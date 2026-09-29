// Coagula engine (Node for Max). Runs out of process, so nothing here can block Live.
//
// Load phase: decode the sample to a mono analysis copy, run one frame-level descriptor pass
// (spectrum, flux, YIN pitch/periodicity) across worker threads, build four segmentations, write
// the sidecar atomically. Playback phase: per-trigger retrieval (silence / continuity / unvoiced
// / main kNN / repeat guard) and hand-off of the chosen segment to gen~, which plays it
// sample-accurately. See docs/coagula-spec.md; deviations are listed in README.md.
//
// The same file is the worker script (worker_threads) and, under node --test, a plain module.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const SCHEMA = 1;
const VARIANTS = ['onset', 'hybrid_400', 'hybrid_200', 'fixed'];
const COLS = ['start', 'len', 'pitch', 'voicing', 'centroid', 'flatness', 'lmean', 'lmax', 'duration', 'src_pos', 'voiced'];
const NOPITCH = -1; // sentinel for unvoiced segments / frames
const DEFAULT_APARAMS = {
    frame: 2048, hop: 256, onset: 1.5, gate: -50, splitA: 400, splitB: 200, fixed: 100, minseg: 30,
    pitchlo: 50, pitchhi: 1500
};

// ---------------------------------------------------------------- audio files

// Header parse for WAV / RF64 / AIFF / AIFC. Returns null for anything else (caller converts).
function readAudioInfo(file) {
    const fd = fs.openSync(file, 'r');
    try {
        const st = fs.fstatSync(fd);
        const head = Buffer.alloc(12);
        fs.readSync(fd, head, 0, 12, 0);
        const id = head.toString('ascii', 0, 4), form = head.toString('ascii', 8, 12);
        if ((id === 'RIFF' || id === 'RF64') && form === 'WAVE') return wavInfo(fd, st.size, id === 'RF64');
        if (id === 'FORM' && (form === 'AIFF' || form === 'AIFC')) return aiffInfo(fd, st.size, form === 'AIFC');
        return null;
    } finally { fs.closeSync(fd); }
}

function chunks(fd, size, start, big) {
    const out = [], h = Buffer.alloc(8);
    let pos = start;
    while (pos + 8 <= size) {
        fs.readSync(fd, h, 0, 8, pos);
        const id = h.toString('ascii', 0, 4);
        let len = big ? h.readUInt32BE(4) : h.readUInt32LE(4);
        out.push({ id, pos: pos + 8, len });
        if (id === 'data' || id === 'SSND') { if (len === 0xffffffff || pos + 8 + len > size) len = size - pos - 8; out[out.length - 1].len = len; }
        pos += 8 + len + (len & 1);
    }
    return out;
}

function wavInfo(fd, size, rf64) {
    const list = chunks(fd, size, 12, false);
    const fmt = list.find(c => c.id === 'fmt '), data = list.find(c => c.id === 'data');
    if (!fmt || !data) throw new Error('WAV without fmt/data chunk');
    const b = Buffer.alloc(Math.min(fmt.len, 40));
    fs.readSync(fd, b, 0, b.length, fmt.pos);
    let tag = b.readUInt16LE(0);
    const ch = b.readUInt16LE(2), sr = b.readUInt32LE(4), bits = b.readUInt16LE(14);
    if (tag === 0xfffe && b.length >= 26) tag = b.readUInt16LE(24);
    let dataLen = data.len;
    if (rf64) {
        const ds = list.find(c => c.id === 'ds64');
        if (ds) { const d = Buffer.alloc(16); fs.readSync(fd, d, 0, 16, ds.pos); dataLen = Number(d.readBigUInt64LE(8)); }
    }
    dataLen = Math.min(dataLen, size - data.pos);
    if (tag !== 1 && tag !== 3) throw new Error('Unsupported WAV encoding (' + tag + ')');
    const bps = bits / 8;
    return { format: 'wav', sr, ch, bits, float: tag === 3, big: false, offset: data.pos, frames: Math.floor(dataLen / (bps * ch)) };
}

function ext80(b, o) { // IEEE 754 80-bit extended (AIFF sample rate)
    const exp = ((b[o] & 0x7f) << 8) | b[o + 1];
    const hi = b.readUInt32BE(o + 2), lo = b.readUInt32BE(o + 6);
    if (exp === 0 && hi === 0 && lo === 0) return 0;
    return (hi * Math.pow(2, exp - 16383 - 31) + lo * Math.pow(2, exp - 16383 - 63)) * ((b[o] & 0x80) ? -1 : 1);
}

function aiffInfo(fd, size, aifc) {
    const list = chunks(fd, size, 12, true);
    const comm = list.find(c => c.id === 'COMM'), ssnd = list.find(c => c.id === 'SSND');
    if (!comm || !ssnd) throw new Error('AIFF without COMM/SSND chunk');
    const b = Buffer.alloc(Math.min(comm.len, 26));
    fs.readSync(fd, b, 0, b.length, comm.pos);
    const ch = b.readUInt16BE(0), frames = b.readUInt32BE(2), bits = b.readUInt16BE(6), sr = Math.round(ext80(b, 8));
    let float = false, big = true;
    if (aifc) {
        const c = b.toString('ascii', 18, 22);
        if (c === 'sowt') big = false;
        else if (c === 'fl32' || c === 'FL32') float = true;
        else if (c === 'fl64' || c === 'FL64') float = true;
        else if (c !== 'NONE' && c !== 'twos') throw new Error('Unsupported AIFC compression ' + c);
    }
    const off = Buffer.alloc(4);
    fs.readSync(fd, off, 0, 4, ssnd.pos);
    const bps = bits / 8;
    const avail = Math.floor((ssnd.len - 8 - off.readUInt32BE(0)) / (bps * ch));
    return { format: aifc ? 'aifc' : 'aiff', sr, ch, bits, float, big, offset: ssnd.pos + 8 + off.readUInt32BE(0), frames: Math.min(frames, avail) };
}

// Sample decoder for one interleaved block -> accumulate channel sum into dst (mono = mean).
function decodeBlock(buf, n, info, dst, at) {
    const ch = info.ch, bps = info.bits / 8, stride = bps * ch, g = 1 / ch;
    for (let i = 0; i < n; i++) {
        let s = 0;
        for (let c = 0; c < ch; c++) s += readSample(buf, i * stride + c * bps, info);
        dst[at + i] = s * g;
    }
}
function readSample(b, o, info) {
    if (info.float) {
        if (info.bits === 32) return info.big ? b.readFloatBE(o) : b.readFloatLE(o);
        return info.big ? b.readDoubleBE(o) : b.readDoubleLE(o);
    }
    switch (info.bits) {
        case 8: return info.format === 'wav' ? (b[o] - 128) / 128 : b.readInt8(o) / 128;
        case 16: return (info.big ? b.readInt16BE(o) : b.readInt16LE(o)) / 32768;
        case 24: return (info.big ? b.readIntBE(o, 3) : b.readIntLE(o, 3)) / 8388608;
        case 32: return (info.big ? b.readInt32BE(o) : b.readInt32LE(o)) / 2147483648;
    }
    throw new Error('Unsupported bit depth ' + info.bits);
}

// Whole file -> mono Float32Array on a SharedArrayBuffer (so workers can read it without copies).
function decodeMono(file, info, progress, cancelled) {
    const shared = new SharedArrayBuffer(info.frames * 4);
    const mono = new Float32Array(shared);
    const stride = (info.bits / 8) * info.ch, per = Math.max(1, Math.floor((8 << 20) / stride));
    const buf = Buffer.alloc(per * stride);
    const fd = fs.openSync(file, 'r');
    try {
        for (let f = 0; f < info.frames; f += per) {
            if (cancelled && cancelled()) return null;
            const n = Math.min(per, info.frames - f);
            fs.readSync(fd, buf, 0, n * stride, info.offset + f * stride);
            decodeBlock(buf, n, info, mono, f);
            if (progress) progress(f / info.frames);
        }
    } finally { fs.closeSync(fd); }
    return mono;
}

// Cheap fingerprint: stat + format + SHA-1 of three fixed-position 64 KB blocks of audio data.
function fingerprint(file, info) {
    const st = fs.statSync(file);
    const h = crypto.createHash('sha1'), fd = fs.openSync(file, 'r');
    const stride = (info.bits / 8) * info.ch, total = info.frames * stride, blk = Math.min(65536, total);
    const b = Buffer.alloc(blk);
    try {
        for (const at of [0, Math.floor((total - blk) / 2), total - blk]) {
            const n = fs.readSync(fd, b, 0, blk, info.offset + Math.max(0, at));
            h.update(b.subarray(0, n));
        }
    } finally { fs.closeSync(fd); }
    return { size: st.size, mtime: Math.round(st.mtimeMs), sr: info.sr, channels: info.ch, frames: info.frames, hash: h.digest('hex') };
}

// ---------------------------------------------------------------- DSP

class FFT { // in-place iterative radix-2 complex FFT, forward sign -1
    constructor(n) {
        this.n = n;
        const bits = Math.round(Math.log2(n));
        this.rev = new Uint32Array(n);
        for (let i = 0; i < n; i++) {
            let r = 0;
            for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
            this.rev[i] = r;
        }
        this.c = new Float64Array(n / 2);
        this.s = new Float64Array(n / 2);
        for (let i = 0; i < n / 2; i++) { this.c[i] = Math.cos(2 * Math.PI * i / n); this.s[i] = Math.sin(2 * Math.PI * i / n); }
    }
    forward(re, im) {
        const n = this.n, rev = this.rev, C = this.c, S = this.s;
        for (let i = 0; i < n; i++) {
            const j = rev[i];
            if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
        }
        for (let size = 2; size <= n; size <<= 1) {
            const half = size >> 1, step = n / size;
            for (let i = 0; i < n; i += size) {
                for (let j = i, k = 0; j < i + half; j++, k += step) {
                    const l = j + half, c = C[k], s = S[k];
                    const tr = re[l] * c + im[l] * s, ti = im[l] * c - re[l] * s;
                    re[l] = re[j] - tr; im[l] = im[j] - ti; re[j] += tr; im[j] += ti;
                }
            }
        }
    }
    inverse(re, im) {
        const n = this.n;
        for (let i = 0; i < n; i++) im[i] = -im[i];
        this.forward(re, im);
        for (let i = 0; i < n; i++) { re[i] /= n; im[i] = -im[i] / n; }
    }
}

function nextPow2(n) { let p = 1; while (p < n) p <<= 1; return p; }

// Analysis geometry derived from the analysis params and the source rate. Frame and hop are
// specified at 44.1 kHz and scale with the source rate.
function geometry(sr, ap) {
    const scale = sr / 44100;
    const N = nextPow2(Math.max(256, Math.round(ap.frame * scale)));
    const hop = Math.max(16, Math.round(ap.hop * scale));
    const D = Math.max(1, Math.floor(sr / 11025)); // pitch analysis decimation (fundamentals <= ~1.5 kHz)
    const srd = sr / D;
    const tmax = Math.ceil(srd / ap.pitchlo), tmin = Math.max(2, Math.floor(srd / ap.pitchhi));
    const W = tmax + 16;
    const M = nextPow2(2 * (W + tmax) + 2);
    return { N, hop, D, srd, tmax, tmin, W, M };
}

function lowpassTaps(D) { // windowed-sinc anti-alias filter for the pitch decimator
    const L = 63, fc = 0.45 / D, h = new Float64Array(L);
    let sum = 0;
    for (let i = 0; i < L; i++) {
        const x = i - (L - 1) / 2;
        const w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (L - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (L - 1));
        h[i] = (x === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * x) / (Math.PI * x)) * w;
        sum += h[i];
    }
    for (let i = 0; i < L; i++) h[i] /= sum;
    return h;
}

function decimate(mono, dec, D, from, to) { // dec[j] for j in [from, to)
    if (D === 1) { for (let j = from; j < to; j++) dec[j] = mono[j]; return; }
    const h = lowpassTaps(D), L = h.length, half = (L - 1) / 2, n = mono.length;
    for (let j = from; j < to; j++) {
        const c = j * D;
        let s = 0;
        if (c - half >= 0 && c + half < n) for (let t = 0; t < L; t++) s += h[t] * mono[c - half + t];
        else for (let t = 0; t < L; t++) { const i = c - half + t; if (i >= 0 && i < n) s += h[t] * mono[i]; }
        dec[j] = s;
    }
}

const FCOLS = 6; // per-frame: 0 loud dB, 1 centroid (MIDI), 2 flatness, 3 pitch (MIDI or -1), 4 periodicity, 5 flux

function hzToMidi(f) { return 69 + 12 * Math.log2(f / 440); }

// Frame-level descriptors for frames [f0, f1). Frame n is centred on sample n * hop.
function analyzeFrames(mono, dec, sr, ap, f0, f1, out, tick) {
    const g = geometry(sr, ap), N = g.N, hop = g.hop, half = N / 2, n = mono.length;
    const fft = new FFT(N), win = new Float64Array(N);
    for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
    const re = new Float64Array(N), im = new Float64Array(N);
    const mag = new Float64Array(half + 1), prevLog = new Float64Array(half + 1);
    const binHz = sr / N, fluxK = 1000 / N;
    const pf = new FFT(g.M), pre = new Float64Array(g.M), pim = new Float64Array(g.M);
    const cum = new Float64Array(g.W + g.tmax + 1), dp = new Float64Array(g.tmax + 2);
    const nd = dec.length, tr = new Float64Array(g.M), ti = new Float64Array(g.M);
    let havePrev = false;
    const start = Math.max(0, f0 - 1); // one frame of look-back so flux is continuous across workers
    for (let f = start; f < f1; f++) {
        const c = f * hop;
        // ---- spectrum
        let e = 0;
        for (let i = 0; i < N; i++) {
            const k = c - half + i;
            const x = k >= 0 && k < n ? mono[k] : 0;
            e += x * x;
            re[i] = x * win[i]; im[i] = 0;
        }
        fft.forward(re, im);
        let msum = 0, fsum = 0, psum = 0, lsum = 0, flux = 0;
        for (let k = 1; k <= half; k++) {
            const m = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
            mag[k] = m;
            msum += m; fsum += m * k * binHz;
            const p = m * m + 1e-12;
            psum += p; lsum += Math.log(p);
            const lg = Math.log(1 + fluxK * m);
            if (havePrev) { const d = lg - prevLog[k]; if (d > 0) flux += d; }
            prevLog[k] = lg;
        }
        havePrev = true;
        if (f < f0) continue;
        const loud = 10 * Math.log10(e / N + 1e-12);
        const cent = msum > 1e-9 ? hzToMidi(Math.max(20, fsum / msum)) : hzToMidi(20);
        const flat = Math.exp(lsum / half) / (psum / half);
        // ---- YIN pitch on the decimated signal
        let pitch = NOPITCH, period = 0;
        const cd = Math.round(c / g.D) - ((g.W + g.tmax) >> 1);
        const L = g.W + g.tmax;
        let e0 = 0;
        cum[0] = 0;
        for (let i = 0; i < L; i++) {
            const k = cd + i, x = k >= 0 && k < nd ? dec[k] : 0;
            pre[i] = i < g.W ? x : 0; // a: first W samples
            pim[i] = x;               // b: all W + tmax samples
            cum[i + 1] = cum[i] + x * x;
            if (i < g.W) e0 += x * x;
        }
        for (let i = L; i < g.M; i++) { pre[i] = 0; pim[i] = 0; }
        if (e0 > 1e-9 * g.W && loud > -70) {
            pf.forward(pre, pim); // Z = A + iB
            const M = g.M;
            // conj(A) * B, with A_k = (Z_k + conj Z_-k)/2, B_k = (Z_k - conj Z_-k)/(2i)
            for (let k = 0; k < M; k++) {
                const j = (M - k) & (M - 1);
                const ar = (pre[k] + pre[j]) / 2, ai = (pim[k] - pim[j]) / 2;
                const br = (pim[k] + pim[j]) / 2, bi = -(pre[k] - pre[j]) / 2;
                tr[k] = ar * br + ai * bi; ti[k] = ar * bi - ai * br;
            }
            pf.inverse(tr, ti); // tr[tau] = r(tau)
            let run = 0;
            dp[0] = 1;
            let best = -1, bestv = 2, first = -1;
            for (let t = 1; t <= g.tmax; t++) {
                const d = e0 + (cum[t + g.W] - cum[t]) - 2 * tr[t];
                run += d;
                dp[t] = run > 0 ? d * t / run : 1;
            }
            for (let t = g.tmin; t <= g.tmax; t++) {
                if (dp[t] < bestv) { bestv = dp[t]; best = t; }
                if (first < 0 && dp[t] < 0.15) {
                    first = t;
                    while (first + 1 <= g.tmax && dp[first + 1] < dp[first]) first++;
                    break;
                }
            }
            const t = first >= 0 ? first : best;
            if (t > 0) {
                let tt = t;
                if (t > 1 && t < g.tmax) {
                    const a = dp[t - 1], b = dp[t], cc = dp[t + 1], den = a - 2 * b + cc;
                    if (Math.abs(den) > 1e-12) tt = t + 0.5 * (a - cc) / den;
                }
                period = Math.max(0, Math.min(1, 1 - dp[t]));
                const f0hz = g.srd / tt;
                if (period >= 0.5 && f0hz >= ap.pitchlo * 0.97 && f0hz <= ap.pitchhi * 1.03 && loud > -60) pitch = hzToMidi(f0hz);
            }
        }
        const o = f * FCOLS;
        out[o] = loud; out[o + 1] = cent; out[o + 2] = flat; out[o + 3] = pitch; out[o + 4] = period; out[o + 5] = flux;
        if (tick && (f & 1023) === 0 && tick(f)) return false;
    }
    return true;
}

// ---------------------------------------------------------------- segmentation

function median(a, lo, hi) { // median of a[lo..hi) (copy)
    const t = Array.prototype.slice.call(a, lo, hi).sort((x, y) => x - y);
    return t.length ? t[t.length >> 1] : 0;
}

// Onset frames from spectral flux, plus boundaries where loudness crosses the analysis gate
// (so pauses become their own segments and the Silence bucket has something in it).
function boundaries(frames, nFrames, hop, sr, ap, totalSamples) {
    const flux = new Float64Array(nFrames), loud = new Float64Array(nFrames);
    let fsum = 0, fcount = 0;
    for (let f = 0; f < nFrames; f++) {
        flux[f] = frames[f * FCOLS + 5]; loud[f] = frames[f * FCOLS];
        if (loud[f] > ap.gate) { fsum += flux[f]; fcount++; }
    }
    const mean = fcount ? fsum / fcount : 1;
    const z = new Float64Array(nFrames);
    for (let f = 0; f < nFrames; f++) z[f] = flux[f] / (mean + 1e-9);
    const cuts = new Set([0]);
    const R = 10, gap = Math.max(1, Math.round(0.03 * sr / hop));
    let last = -gap;
    // running median over a +-R window using a sorted sliding array would be faster; R is small.
    for (let f = 1; f < nFrames - 1; f++) {
        if (loud[f] <= ap.gate) continue;
        let peak = true;
        for (let k = 1; k <= 3 && peak; k++) {
            if (f - k >= 0 && z[f - k] > z[f]) peak = false;
            if (f + k < nFrames && z[f + k] >= z[f]) peak = false;
        }
        if (!peak) continue;
        const m = median(z, Math.max(0, f - R), Math.min(nFrames, f + R + 1));
        if (z[f] - m < ap.onset || f - last < gap) continue;
        let b = f; // back up to the loudness valley just before the attack
        for (let k = 0; k < 4 && b > 0 && loud[b - 1] < loud[b]; k++) b--;
        cuts.add(b * hop);
        last = f;
    }
    // Gate crossings with 3 dB hysteresis and a minimum run of 3 frames.
    let state = loud[0] > ap.gate, runStart = 0;
    for (let f = 1; f < nFrames; f++) {
        const up = loud[f] > ap.gate + 1.5, down = loud[f] < ap.gate - 1.5;
        if ((!state && up) || (state && down)) {
            let hold = true;
            for (let k = 1; k < 3 && f + k < nFrames; k++) if (state ? loud[f + k] > ap.gate - 1.5 : loud[f + k] < ap.gate + 1.5) hold = false;
            if (hold) { state = !state; cuts.add(f * hop); runStart = f; }
        }
    }
    const list = Array.from(cuts).filter(c => c >= 0 && c < totalSamples).sort((a, b) => a - b);
    return list;
}

// Starts -> [start, len] pairs, merging anything shorter than minseg into its predecessor.
function toSegments(starts, total, minLen) {
    const segs = [];
    for (let i = 0; i < starts.length; i++) {
        const s = starts[i], e = i + 1 < starts.length ? starts[i + 1] : total;
        if (e <= s) continue;
        if (segs.length && e - s < minLen) { segs[segs.length - 1][1] += e - s; continue; }
        segs.push([s, e - s]);
    }
    if (segs.length > 1 && segs[0][1] < minLen) { segs[1][0] = segs[0][0]; segs[1][1] += segs[0][1]; segs.shift(); }
    return segs;
}

function splitLong(segs, maxLen) { // equal parts, so no stub remainders
    const out = [];
    for (const [s, l] of segs) {
        if (l <= maxLen) { out.push([s, l]); continue; }
        const parts = Math.ceil(l / maxLen);
        let at = s;
        for (let p = 0; p < parts; p++) {
            const e = Math.round(s + l * (p + 1) / parts);
            out.push([at, e - at]); at = e;
        }
    }
    return out;
}

function segmentations(frames, nFrames, sr, ap, total) {
    const g = geometry(sr, ap), minLen = Math.round(ap.minseg * sr / 1000);
    const onset = toSegments(boundaries(frames, nFrames, g.hop, sr, ap, total), total, minLen);
    const fixedStarts = [];
    const step = Math.max(minLen, Math.round(ap.fixed * sr / 1000));
    for (let s = 0; s < total; s += step) fixedStarts.push(s);
    return {
        onset,
        hybrid_400: splitLong(onset, Math.round(ap.splitA * sr / 1000)),
        hybrid_200: splitLong(onset, Math.round(ap.splitB * sr / 1000)),
        fixed: toSegments(fixedStarts, total, minLen)
    };
}

// Per-segment statistics over the frames whose centres fall inside the segment.
function segmentStats(segs, frames, nFrames, sr, hop) {
    const n = segs.length, cols = {};
    for (const c of COLS) cols[c] = new Float64Array(n);
    const pbuf = [];
    for (let i = 0; i < n; i++) {
        const [s, l] = segs[i];
        let a = Math.ceil(s / hop), b = Math.ceil((s + l) / hop);
        a = Math.min(a, nFrames - 1); b = Math.min(Math.max(b, a + 1), nFrames);
        let pw = 0, lmax = -Infinity, cent = 0, flat = 0, per = 0;
        pbuf.length = 0;
        for (let f = a; f < b; f++) {
            const o = f * FCOLS;
            pw += Math.pow(10, frames[o] / 10);
            if (frames[o] > lmax) lmax = frames[o];
            cent += frames[o + 1]; flat += frames[o + 2]; per += frames[o + 4];
            if (frames[o + 3] >= 0) pbuf.push(frames[o + 3]);
        }
        const k = b - a;
        const voicing = per / k;
        pbuf.sort((x, y) => x - y);
        const pitch = pbuf.length ? pbuf[pbuf.length >> 1] : NOPITCH;
        const voiced = voicing >= 0.5 && pbuf.length > 0 ? 1 : 0;
        cols.start[i] = s; cols.len[i] = l;
        cols.pitch[i] = voiced ? pitch : NOPITCH;
        cols.voicing[i] = voicing; cols.centroid[i] = cent / k; cols.flatness[i] = flat / k;
        cols.lmean[i] = 10 * Math.log10(pw / k + 1e-12); cols.lmax[i] = lmax;
        cols.duration[i] = l * 1000 / sr; cols.src_pos[i] = s * 1000 / sr; cols.voiced[i] = voiced;
    }
    return { n, cols };
}

// ---------------------------------------------------------------- sidecar

function writeVariant(file, v) {
    const head = Buffer.alloc(16 + COLS.length * 16);
    head.write('CGLA', 0, 'ascii'); head.writeUInt32LE(SCHEMA, 4); head.writeUInt32LE(v.n, 8); head.writeUInt32LE(COLS.length, 12);
    COLS.forEach((c, i) => head.write(c, 16 + i * 16, 'ascii'));
    const fd = fs.openSync(file, 'w');
    try {
        fs.writeSync(fd, head);
        for (const c of COLS) fs.writeSync(fd, Buffer.from(v.cols[c].buffer, v.cols[c].byteOffset, v.cols[c].byteLength));
        fs.fsyncSync(fd);
    } finally { fs.closeSync(fd); }
}

function readVariant(file) {
    const b = fs.readFileSync(file);
    if (b.toString('ascii', 0, 4) !== 'CGLA' || b.readUInt32LE(4) !== SCHEMA) throw new Error('bad variant file');
    const n = b.readUInt32LE(8), nc = b.readUInt32LE(12), cols = {};
    let at = 16 + nc * 16;
    for (let i = 0; i < nc; i++) {
        const name = b.toString('ascii', 16 + i * 16, 32 + i * 16).replace(/\0+$/, '');
        const a = new Float64Array(n);
        Buffer.from(a.buffer).set(b.subarray(at, at + n * 8));
        cols[name] = a; at += n * 8;
    }
    for (const c of COLS) if (!cols[c]) throw new Error('variant file missing column ' + c);
    return { n, cols };
}

function sameParams(a, b) { return Object.keys(DEFAULT_APARAMS).every(k => Number(a[k]) === Number(b[k])); }

function sidecarDir(sample) { return sample + '.coagula'; }
function cacheRoot() { return path.join(os.homedir(), 'Library', 'Caches', 'Coagula'); }
function fallbackDir(fp) { return path.join(cacheRoot(), crypto.createHash('sha1').update(JSON.stringify(fp)).digest('hex').slice(0, 16)); }

function validCache(dir, fp, ap) {
    try {
        const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
        if (m.schema !== SCHEMA) return null;
        for (const k of ['size', 'mtime', 'sr', 'channels', 'frames', 'hash']) if (m.fingerprint[k] !== fp[k]) return null;
        if (!sameParams(m.params, ap)) return null;
        for (const v of VARIANTS) {
            const f = path.join(dir, v + '.bin');
            if (!fs.existsSync(f) || !m.segments || typeof m.segments[v] !== 'number') return null;
            const b = Buffer.alloc(12), fd = fs.openSync(f, 'r');
            fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd);
            if (b.readUInt32LE(8) !== m.segments[v]) return null;
        }
        return m;
    } catch (e) { return null; }
}

// Write into <dir>.tmp-*, manifest last, then swap it in with renames. A crash at any point
// leaves either the old valid sidecar, or no manifest in the final folder (= re-analyze).
function writeSidecar(dir, fp, ap, variants, extra, overview) {
    const tmp = dir + '.tmp-' + process.pid + '-' + Date.now();
    fs.mkdirSync(tmp, { recursive: true });
    if (overview) writeOverview(tmp, overview);
    const segments = {};
    for (const v of VARIANTS) { writeVariant(path.join(tmp, v + '.bin'), variants[v]); segments[v] = variants[v].n; }
    const manifest = Object.assign({ schema: SCHEMA, fingerprint: fp, params: ap, segments, written: new Date().toISOString() }, extra || {});
    const mf = path.join(tmp, 'manifest.json');
    fs.writeFileSync(mf, JSON.stringify(manifest, null, 2));
    const fd = fs.openSync(mf, 'r'); fs.fsyncSync(fd); fs.closeSync(fd);
    let old = null;
    if (fs.existsSync(dir)) { old = dir + '.old-' + process.pid + '-' + Date.now(); fs.renameSync(dir, old); }
    fs.renameSync(tmp, dir);
    if (old) fs.rmSync(old, { recursive: true, force: true }); // the invalidated sidecar it replaces
    return manifest;
}

// Waveform overview for the Source display: min/max of the mono sum per bin, interleaved.
const OVERVIEW_BINS = 512;
function overviewOf(mono, bins = OVERVIEW_BINS) {
    const out = new Float32Array(bins * 2), n = mono.length;
    for (let b = 0; b < bins; b++) {
        const a = Math.floor(b * n / bins), e = Math.max(a + 1, Math.floor((b + 1) * n / bins));
        let lo = 0, hi = 0;
        for (let i = a; i < e && i < n; i++) { const x = mono[i]; if (x < lo) lo = x; if (x > hi) hi = x; }
        out[2 * b] = lo; out[2 * b + 1] = hi;
    }
    return out;
}
function readOverview(dir) {
    try {
        const b = fs.readFileSync(path.join(dir, 'overview.bin'));
        if (b.length !== OVERVIEW_BINS * 8) return null;
        const a = new Float32Array(OVERVIEW_BINS * 2);
        Buffer.from(a.buffer).set(b);
        return a;
    } catch (e) { return null; }
}
function writeOverview(dir, ov) { fs.writeFileSync(path.join(dir, 'overview.bin'), Buffer.from(ov.buffer, ov.byteOffset, ov.byteLength)); }

function writable(dir) {
    try { fs.accessSync(dir, fs.constants.W_OK); return true; } catch (e) { return false; }
}

// ---------------------------------------------------------------- analysis driver

function workerCount() { return Math.max(1, Math.min(8, (os.cpus() || []).length - 1)); }

function runWorkers(job, count, onProgress, token) {
    return new Promise((resolve, reject) => {
        const workers = [], done = new Float64Array(count);
        let finished = 0, failed = false;
        const per = Math.ceil(job.total / count);
        for (let w = 0; w < count; w++) {
            const from = w * per, to = Math.min(job.total, from + per);
            // execArgv: [] keeps Node for Max's --import loader (which needs process.send) out of workers.
            const wk = new Worker(__filename, { workerData: Object.assign({}, job, { from, to }), execArgv: [] });
            workers.push(wk);
            wk.on('message', m => {
                if (m.progress !== undefined) {
                    done[w] = m.progress * (to - from);
                    if (onProgress) onProgress(done.reduce((a, b) => a + b, 0) / job.total);
                } else if (m.done) { if (++finished === count) resolve(); }
            });
            wk.on('error', e => { if (!failed) { failed = true; workers.forEach(x => x.terminate()); reject(e); } });
            wk.on('exit', code => { if (code !== 0 && !failed && finished < count) { failed = true; workers.forEach(x => x.terminate()); reject(new Error(token && token.cancelled ? 'cancelled' : 'worker exit ' + code)); } });
        }
        if (token) token.kill = () => workers.forEach(x => x.terminate());
    });
}

function workerMain() {
    const d = workerData;
    if (d.kind === 'dec') {
        const mono = new Float32Array(d.mono), dec = new Float32Array(d.dec);
        const step = 65536;
        for (let j = d.from; j < d.to; j += step) {
            decimate(mono, dec, d.D, j, Math.min(d.to, j + step));
            parentPort.postMessage({ progress: (Math.min(d.to, j + step) - d.from) / Math.max(1, d.to - d.from) });
        }
    } else {
        const mono = new Float32Array(d.mono), dec = new Float32Array(d.dec), out = new Float32Array(d.out);
        analyzeFrames(mono, dec, d.sr, d.ap, d.from, d.to, out, f => {
            parentPort.postMessage({ progress: (f - d.from) / Math.max(1, d.to - d.from) });
            return false;
        });
    }
    parentPort.postMessage({ done: true });
}

// Full analysis of a decoded mono signal. progress(stage, fraction).
// In-process fallback when worker threads are unavailable: same work, chunked so messages
// (a new drop, a cancel) still get through between chunks.
async function inProcess(job, onProgress, token) {
    const mono = new Float32Array(job.mono), dec = new Float32Array(job.dec);
    const step = job.kind === 'dec' ? 262144 : 2048;
    for (let a = 0; a < job.total; a += step) {
        if (token && token.cancelled) throw new Error('cancelled');
        const b = Math.min(job.total, a + step);
        if (job.kind === 'dec') decimate(mono, dec, job.D, a, b);
        else analyzeFrames(mono, dec, job.sr, job.ap, a, b, new Float32Array(job.out));
        onProgress(b / job.total);
        await new Promise(r => setImmediate(r));
    }
}

async function parallel(job, onProgress, token) {
    try { await runWorkers(job, workerCount(), onProgress, token); }
    catch (e) {
        if (token && token.cancelled) throw new Error('cancelled');
        await inProcess(job, onProgress, token);
    }
}

async function analyze(mono, sr, ap, progress, token) {
    const g = geometry(sr, ap), total = mono.length;
    const nd = Math.floor(total / g.D);
    const decBuf = new SharedArrayBuffer(Math.max(1, nd) * 4);
    await parallel({ kind: 'dec', mono: mono.buffer, dec: decBuf, D: g.D, total: nd }, p => progress('frames', p * 0.15), token);
    if (token && token.cancelled) throw new Error('cancelled');
    const nFrames = Math.max(1, Math.ceil(total / g.hop));
    const outBuf = new SharedArrayBuffer(nFrames * FCOLS * 4);
    await parallel({ kind: 'frames', mono: mono.buffer, dec: decBuf, out: outBuf, sr, ap, total: nFrames }, p => progress('frames', 0.15 + p * 0.85), token);
    if (token && token.cancelled) throw new Error('cancelled');
    const frames = new Float32Array(outBuf);
    const segs = segmentations(frames, nFrames, sr, ap, total);
    const variants = {};
    VARIANTS.forEach((v, i) => {
        progress('variant', i / VARIANTS.length, i + 1);
        variants[v] = segmentStats(segs[v], frames, nFrames, sr, g.hop);
    });
    return variants;
}

// ---------------------------------------------------------------- retrieval

function percentile(values, q) {
    if (!values.length) return 0;
    const t = Float64Array.from(values).sort();
    return t[Math.min(t.length - 1, Math.max(0, Math.round(q * (t.length - 1))))];
}

// Buckets, axis ranges and normalized coordinates for one variant at one silence threshold.
// Axis ranges use the 1st..99th percentile rather than the raw min/max so a single tracker
// outlier can't squash the whole coagula into a corner of the 0..1 target.
function prepare(v, thr) {
    const c = v.cols, n = v.n;
    const silent = [], unv = [], voi = [], nons = [];
    for (let i = 0; i < n; i++) {
        if (c.lmean[i] < thr) silent.push(i);
        else { nons.push(i); if (c.voiced[i] > 0.5) voi.push(i); else unv.push(i); }
    }
    const rng = (idx, col) => {
        const vals = idx.map(i => col[i]);
        let lo = percentile(vals, 0.01), hi = percentile(vals, 0.99);
        if (!(hi - lo > 1e-6)) { lo -= 0.5; hi += 0.5; }
        return [lo, hi];
    };
    const range = { pitch: rng(voi, c.pitch), centroid: rng(nons, c.centroid), flatness: rng(nons, c.flatness) };
    const norm = (col, r) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = (col[i] - r[0]) / (r[1] - r[0]); return a; };
    return {
        silent: Int32Array.from(silent), unv: Int32Array.from(unv), voi: Int32Array.from(voi), nons: Int32Array.from(nons),
        range, px: norm(c.pitch, range.pitch), cy: norm(c.centroid, range.centroid), fx: norm(c.flatness, range.flatness),
        silRatio: n ? silent.length / n : 0, isSilent: (() => { const a = new Uint8Array(n); for (const i of silent) a[i] = 1; return a; })()
    };
}

// k nearest of idx to (tx, ty) (ty only when X is null), skipping `ex`; returns one of them uniformly.
function knn(idx, X, Y, tx, ty, k, ex, rnd) {
    const m = idx.length;
    if (!m) return -1;
    k = Math.max(1, Math.min(k, 32));
    const bd = new Float64Array(k).fill(Infinity), bi = new Int32Array(k).fill(-1);
    let found = 0;
    for (let q = 0; q < m; q++) {
        const i = idx[q];
        if (ex && ex.has(i)) continue;
        const dy = Y[i] - ty, dx = X ? X[i] - tx : 0, d = dx * dx + dy * dy;
        if (d >= bd[k - 1]) continue;
        let j = k - 1;
        while (j > 0 && bd[j - 1] > d) { bd[j] = bd[j - 1]; bi[j] = bi[j - 1]; j--; }
        bd[j] = d; bi[j] = i;
        if (found < k) found++;
    }
    if (!found) return -1;
    return bi[Math.floor(rnd() * found)];
}

// Last N played, N clamped to bucket size - 1 so the guard can never empty a bucket.
function guardSet(history, n, size) {
    const N = Math.max(0, Math.min(n, size - 1));
    return new Set(history.slice(Math.max(0, history.length - N)));
}

// One selection decision (spec: Retrieval and playback / Selection order per trigger).
// p: playback params; st: {last, history, note}; returns {index, step}.
function selectSegment(v, B, p, st, rnd) {
    const n = v.n, axisPitch = p.axis < 0.5;
    if (!n) return { index: -1, step: 'empty' };
    const pickSilence = () => {
        const s = B.silent;
        if (!s.length) return -1;
        const ref = st.last >= 0 ? v.cols.duration[st.last] : 200;
        let best = -1, total = 0;
        const cand = [], w = [];
        for (let t = 0; t < Math.min(32, s.length); t++) {
            const i = s[Math.floor(rnd() * s.length)];
            const wt = Math.exp(-2 * Math.abs(Math.log(Math.max(1, v.cols.duration[i]) / Math.max(1, ref))));
            cand.push(i); w.push(wt); total += wt;
        }
        let r = rnd() * total;
        for (let t = 0; t < cand.length; t++) { r -= w[t]; if (r <= 0) { best = cand[t]; break; } }
        return best >= 0 ? best : cand[cand.length - 1];
    };
    // 1. silence roll
    if (B.silent.length && rnd() < p.sildens) { const i = pickSilence(); if (i >= 0) return { index: i, step: 'silence' }; }
    // 2. continuity roll
    if (st.last >= 0 && rnd() < p.continuity) {
        const nx = st.last + 1;
        if (nx < n && !(B.isSilent[nx] && p.sildens <= 0)) return { index: nx, step: 'continuity' };
    }
    const J = p.jitter;
    const tx = (st.note !== null && st.note !== undefined && p.keytrack > 0.5 && axisPitch
        ? (st.note - B.range.pitch[0]) / (B.range.pitch[1] - B.range.pitch[0]) : p.tx) + (J > 0 ? (rnd() * 2 - 1) * J : 0);
    const ty = p.ty + (J > 0 ? (rnd() * 2 - 1) * J : 0);
    const k = Math.round(p.k);
    const unvoiced = () => knn(B.unv, null, B.cy, 0, ty, k, guardSet(st.history, p.guard, B.unv.length), rnd);
    // 3. unvoiced roll (Pitch mode only)
    if (axisPitch && B.unv.length && rnd() < p.unvmix) { const i = unvoiced(); if (i >= 0) return { index: i, step: 'unvoiced' }; }
    // 4. main query
    const idx = axisPitch ? B.voi : B.nons;
    let i = knn(idx, axisPitch ? B.px : B.fx, B.cy, tx, ty, k, guardSet(st.history, p.guard, idx.length), rnd);
    if (i >= 0) return { index: i, step: 'main' };
    // Empty bucket: fall through, never stall.
    if (axisPitch && B.unv.length) { i = unvoiced(); if (i >= 0) return { index: i, step: 'unvoiced' }; }
    i = pickSilence();
    if (i >= 0) return { index: i, step: 'silence' };
    return { index: Math.floor(rnd() * n), step: 'any' };
}

// Segment containing a source position (ms) in variant v: binary search on src_pos.
function segmentAt(v, posMs) {
    const a = v.cols.src_pos;
    let lo = 0, hi = v.n - 1;
    if (hi < 0) return -1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (a[mid] <= posMs) lo = mid; else hi = mid - 1; }
    return lo;
}

// Playback parameters for gen~: source start/length in source samples, rate in source samples
// per second (gen~ divides by Live's rate), gain, crossfade ms.
function playParams(v, i, p, srcSr, note, vel) {
    const c = v.cols;
    let len = c.len[i];
    if (p.maxlen < 999.5) len = Math.min(len, Math.max(16, Math.round(p.maxlen * srcSr / 1000)));
    let semis = p.transpose;
    if (p.keytrack > 0.5 && p.t2m > 0.5 && p.axis < 0.5 && note !== null && note !== undefined && c.voiced[i] > 0.5 && c.pitch[i] >= 0)
        semis += Math.max(-12, Math.min(12, note - c.pitch[i]));
    return { start: c.start[i], len, rate: srcSr * Math.pow(2, semis / 12), gain: vel === undefined ? 1 : vel, xf: p.xfade };
}

const DEFAULT_PARAMS = {
    variant: 1, axis: 0, tx: 0.5, ty: 0.5, k: 1, jitter: 0, xfade: 8, continuity: 0.6, maxlen: 1000, guard: 4,
    silthresh: -50, sildens: 0, unvmix: 0.2, trigmode: 0, keytrack: 0, t2m: 0, transpose: 0
};

module.exports = {
    SCHEMA, VARIANTS, COLS, NOPITCH, DEFAULT_APARAMS, DEFAULT_PARAMS, FCOLS,
    readAudioInfo, decodeMono, fingerprint, FFT, geometry, decimate, analyzeFrames, boundaries, toSegments, splitLong,
    segmentations, segmentStats, writeVariant, readVariant, validCache, writeSidecar, sidecarDir, fallbackDir, analyze,
    prepare, knn, guardSet, overviewOf, readOverview, selectSegment, segmentAt, playParams, hzToMidi
};

if (!isMainThread) workerMain();

// ---------------------------------------------------------------- Max glue

// Max hands us either POSIX paths or Max-style "Volume:/path" ones.
function posixPath(p) {
    p = String(p || '').trim();
    const m = /^([^/:]+):(\/.*)$/.exec(p);
    if (!m) return p;
    if (fs.existsSync(m[2])) return m[2];
    return path.join('/Volumes', m[1], m[2]);
}

// Formats Max's buffer~ reads but we can't parse: decode once with macOS afconvert to a float WAV
// in the cache, then analyze *and* play that file so both sides see identical sample frames.
function convertedCopy(file) {
    const st = fs.statSync(file);
    const key = crypto.createHash('sha1').update(file + ':' + st.size + ':' + st.mtimeMs).digest('hex').slice(0, 16);
    const dir = path.join(cacheRoot(), 'decoded');
    const out = path.join(dir, key + '.wav');
    if (fs.existsSync(out)) return out;
    fs.mkdirSync(dir, { recursive: true });
    const tmp = out + '.tmp-' + process.pid + '.wav';
    const r = childProcess.spawnSync('/usr/bin/afconvert', ['-f', 'WAVE', '-d', 'LEF32', file, tmp]);
    if (r.status !== 0) throw new Error('Unsupported audio file');
    fs.renameSync(tmp, out);
    return out;
}

function startMax(Max) {
    const P = Object.assign({}, DEFAULT_PARAMS), AP = Object.assign({}, DEFAULT_APARAMS);
    let dictName = null;
    let S = null;             // loaded coagula: {file, audio, info, fp, variants, where, dir, B: {variant: prepared}}
    let job = 0, token = null;
    let analysisReady = false, bufferReady = false, expectFrames = -1;
    let commit = 0, queued = -1, waiting = false;
    const st = { last: -1, history: [], note: null };
    const held = [];
    let reselectTimer = null, rebuildTimer = null, aparamTimer = null, loadTimer = null;
    let pendingPath = null;
    let qaLog = null;
    const out = (...a) => {
        if (qaLog) try { fs.appendFileSync(qaLog, Date.now() + ' ' + a.map(x => typeof x === 'number' ? +x.toFixed(4) : x).join(' ') + '\n'); } catch (e) {}
        return Max.outlet(...a);
    };
    const status = (code, text) => out('panel', 'status', code, text || '');
    const ready = () => analysisReady && bufferReady && S && S.B;
    const V = () => S.variants[VARIANTS[Math.round(P.variant)] || 'hybrid_400'];
    const B = () => S.B[VARIANTS[Math.round(P.variant)] || 'hybrid_400'];

    function setReady(on) { out('gen', 'ready', on ? 1 : 0); }

    function sendPoints() {
        if (!ready() || !dictName) return;
        const v = V(), b = B(), pitch = P.axis < 0.5;
        const idx = pitch ? b.voi : b.nons, stride = Math.max(1, Math.ceil(idx.length / 5000));
        const xs = [], ys = [];
        for (let q = 0; q < idx.length; q += stride) { const i = idx[q]; xs.push(+(pitch ? b.px[i] : b.fx[i]).toFixed(4)); ys.push(+b.cy[i].toFixed(4)); }
        const r = pitch ? b.range.pitch : b.range.flatness;
        Promise.resolve(Max.setDict(dictName, { x: xs, y: ys, total: idx.length, xlo: r[0], xhi: r[1], ylo: b.range.centroid[0], yhi: b.range.centroid[1] }))
            .then(() => out('space', 'points', dictName, xs.length, idx.length, pitch ? 0 : 1))
            .catch(e => Max.post('coagula: setDict failed ' + e.message));
    }

    function readyStatus() {
        if (!ready()) return;
        const b = B();
        if (!b.nons.length) { status('error', 'No usable segments at this threshold'); return; }
        const few = VARIANTS.filter(k => S.B[k].nons.length < 50);
        const where = S.where === 'sidecar' ? 'Ready · sidecar' : 'Ready · cache folder';
        status('ready', few.length ? where + ' · few segments (' + few.join(', ') + ')' : where);
    }

    function rebuild() {
        if (!S) return;
        const B2 = {};
        for (const k of VARIANTS) B2[k] = prepare(S.variants[k], P.silthresh);
        S.B = B2; // old index served every query until this line
        out('ctl', 'silratio', B().silRatio);
        sendPoints();
        readyStatus();
        reselect();
    }

    function markPlayed(i) {
        if (i < 0 || !S) return;
        st.last = i;
        st.history.push(i);
        if (st.history.length > 32) st.history.shift();
        const b = B(), v = V(), pitch = P.axis < 0.5;
        const kind = b.isSilent[i] ? 2 : (pitch && v.cols.voiced[i] < 0.5) ? 1 : 0;
        out('space', 'played', kind === 0 ? (pitch ? b.px[i] : b.fx[i]) : -1, b.cy[i], kind, v.cols.duration[i]);
        const total = S.info.frames;
        out('wave', 'played', v.cols.start[i] / total, v.cols.len[i] / total, kind);
    }

    function keyNote() { return held.length ? held[held.length - 1] : null; }

    function send(i, note, vel) {
        const pp = playParams(V(), i, P, S.info.sr, note, vel);
        commit = (commit + 1) % 1000000;
        out('gen', 'pend', commit, pp.start, pp.len, pp.rate, pp.gain, pp.xf);
    }

    function fill() {
        if (!ready() || Math.round(P.trigmode) === 2) return;
        st.note = keyNote();
        const r = selectSegment(V(), B(), P, st, Math.random);
        if (r.index < 0) return;
        send(r.index, st.note);
        queued = r.index;
        waiting = false;
    }

    // A playback param moved while a pre-selected segment waits in gen~: pick again, throttled.
    function reselect() {
        if (reselectTimer || !ready() || Math.round(P.trigmode) === 2) return;
        reselectTimer = setTimeout(() => { reselectTimer = null; if (queued >= 0 || waiting) fill(); }, 15);
    }

    function unload(msg) {
        analysisReady = false; bufferReady = false; setReady(false);
        queued = -1; st.last = -1; st.history = [];
        if (msg) status('error', msg);
    }

    async function load(raw, force) {
        if (token) { token.cancelled = true; if (token.kill) token.kill(); }
        const my = ++job, tk = token = { cancelled: false };
        unload();
        const cancelled = () => tk.cancelled || my !== job;
        const file = posixPath(raw);
        S = null;
        out('panel', 'file', path.basename(file), 0, 0, 0);
        out('wave', 'clear');
        if (!file) { status('empty', 'Drop a sample'); return; }
        if (!fs.existsSync(file)) { status('error', 'Missing sample: ' + file); return; }
        try {
            status('checking', 'Checking cache');
            let audio = file, info = readAudioInfo(file);
            if (!info) { status('checking', 'Decoding'); audio = convertedCopy(file); info = readAudioInfo(audio); }
            if (!info || !info.frames) throw new Error('Unreadable audio file');
            if (info.ch > 2) throw new Error('Multichannel (' + info.ch + ' ch) is not supported');
            out('panel', 'file', path.basename(file), info.frames / info.sr, info.sr, info.ch);
            const fp = fingerprint(audio, info);
            expectFrames = info.frames; bufferReady = false;
            out('buf', 'replace', audio);
            const primary = writable(path.dirname(file)) ? sidecarDir(file) : null, fb = fallbackDir(fp);
            let dir = null, where = null, manifest = null, cached = false;
            if (!force) {
                if (primary && (manifest = validCache(primary, fp, AP))) { dir = primary; where = 'sidecar'; }
                else if ((manifest = validCache(sidecarDir(file), fp, AP))) { dir = sidecarDir(file); where = 'sidecar'; }
                else if ((manifest = validCache(fb, fp, AP))) { dir = fb; where = 'fallback'; }
            }
            let variants = {}, overview = null;
            const t0 = Date.now();
            if (manifest) {
                for (const k of VARIANTS) variants[k] = readVariant(path.join(dir, k + '.bin'));
                cached = true;
                overview = readOverview(dir);
                if (!overview) { // sidecars written before the overview existed
                    const mono = decodeMono(audio, info, null, cancelled);
                    if (!mono || cancelled()) return;
                    overview = overviewOf(mono);
                    try { writeOverview(dir, overview); } catch (e) {}
                }
            } else {
                status('analyzing', 'Analyzing · reading');
                const mono = decodeMono(audio, info, f => status('analyzing', 'Analyzing · reading ' + Math.round(f * 100) + '%'), cancelled);
                if (!mono || cancelled()) return;
                overview = overviewOf(mono);
                out('wave', 'overview', ...Array.from(overview, x => +x.toFixed(4)));
                let lastPct = -1;
                variants = await analyze(mono, info.sr, AP, (stage, f, n) => {
                    if (stage === 'frames') { const pc = Math.floor(f * 100); if (pc !== lastPct) { lastPct = pc; status('analyzing', 'Analyzing · frames ' + pc + '%'); out('wave', 'progress', f); } }
                    else status('analyzing', 'Analyzing · variant ' + n + '/4');
                }, tk);
                if (cancelled()) return;
                status('writing', 'Writing cache');
                const extra = { source: path.basename(file), seconds: (Date.now() - t0) / 1000 };
                try {
                    if (!primary) throw new Error('read-only');
                    manifest = writeSidecar(primary, fp, AP, variants, extra, overview); dir = primary; where = 'sidecar';
                } catch (e) {
                    fs.mkdirSync(cacheRoot(), { recursive: true });
                    manifest = writeSidecar(fb, fp, AP, variants, extra, overview); dir = fb; where = 'fallback';
                }
            }
            if (cancelled()) return;
            S = { file, audio, info, fp, variants, where, dir, B: null };
            out('wave', 'progress', -1);
            out('wave', 'overview', ...Array.from(overview, x => +x.toFixed(4)));
            out('panel', 'cache', where, dir);
            out('panel', 'segcounts', ...VARIANTS.map(k => variants[k].n), manifest.seconds || 0, cached ? 1 : 0);
            analysisReady = true;
            st.last = -1; st.history = []; queued = -1;
            rebuild();
            if (bufferReady) goLive(); else status('checking', 'Loading audio');
        } catch (e) {
            if (cancelled() || /cancelled/.test(e.message)) return;
            S = null;
            status('error', e.message);
        }
    }

    function goLive() {
        if (!ready()) return;
        setReady(true);
        readyStatus();
        sendPoints();
        waiting = true;
        fill();
    }

    const handlers = {
        setup: (name) => { dictName = String(name); },
        qa: (file) => { qaLog = file ? String(file) : null; },
        param: (k, val) => {
            if (!(k in P)) return;
            const old = P[k];
            P[k] = Number(val);
            if (old === P[k]) return;
            if (k === 'silthresh') { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(rebuild, 100); return; }
            if (k === 'variant' && S && S.B) {
                // Continuity carries over: the segment of the new variant containing the last src_pos.
                const ov = S.variants[VARIANTS[Math.round(old)]], nv = V();
                st.last = st.last >= 0 && ov ? segmentAt(nv, ov.cols.src_pos[Math.min(st.last, ov.n - 1)]) : -1;
                st.history = [];
                sendPoints(); readyStatus();
            }
            if (k === 'axis') sendPoints();
            if (k === 'trigmode') { if (Math.round(P.trigmode) !== 2) { waiting = true; fill(); } return; }
            reselect();
        },
        aparam: (k, val) => {
            if (!(k in AP) || Number(val) === AP[k]) return;
            AP[k] = Number(val);
            if (S || pendingPath) { clearTimeout(aparamTimer); aparamTimer = setTimeout(() => { if (S) load(S.file); }, 1000); }
        },
        load: (...a) => {
            pendingPath = a.join(' ');
            clearTimeout(loadTimer);
            loadTimer = setTimeout(() => load(pendingPath), 50);
        },
        reanalyze: () => { if (S || pendingPath) load(S ? S.file : pendingPath, true); },
        reveal: () => {
            const d = S && S.dir;
            if (d && fs.existsSync(d)) childProcess.spawn(process.platform === 'win32' ? 'explorer' : 'open', process.platform === 'win32' ? [d] : ['-R', d], { detached: true });
        },
        bufready: (frames, ch) => {
            if (!S && !analysisReady && expectFrames < 0) return;
            if (Number(frames) > 0 && expectFrames > 0 && Math.abs(Number(frames) - expectFrames) > 1) return; // a stale load
            bufferReady = true;
            if (analysisReady) goLive();
        },
        buferror: (...a) => unload('Audio could not be loaded: ' + a.join(' ')),
        need: () => {
            waiting = true;
            if (queued >= 0) markPlayed(queued);
            queued = -1;
            fill();
        },
        note: (pitch, vel) => {
            pitch = Number(pitch); vel = Number(vel);
            const at = held.indexOf(pitch);
            if (at >= 0) held.splice(at, 1);
            if (vel > 0) held.push(pitch);
            if (!ready()) return;
            if (Math.round(P.trigmode) === 2) {
                if (vel <= 0) return;
                st.note = pitch;
                const r = selectSegment(V(), B(), P, st, Math.random);
                if (r.index < 0) return;
                send(r.index, pitch, vel / 127);
                markPlayed(r.index);
            } else if (P.keytrack > 0.5) reselect();
        },
        allnotesoff: () => { held.length = 0; }
    };
    // MESSAGE_TYPES.ALL handlers receive (handled, name, ...args).
    Max.addHandler(Max.MESSAGE_TYPES.ALL, (...all) => {
        if (typeof all[0] === 'boolean') all.shift();
        const name = String(all.shift()), args = all;
        const h = handlers[name];
        if (h) { try { h(...args); } catch (e) { Max.post('coagula: ' + name + ': ' + e.stack); } }
    });
    status('empty', 'Drop a sample');
    out('ctl', 'hello', SCHEMA);
}

if (isMainThread) {
    let Max = null;
    try { Max = require('max-api'); } catch (e) { Max = null; }
    if (Max) startMax(Max);
}
