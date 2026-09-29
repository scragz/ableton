// Offline tests for the Node engine: decoding, DSP, segmentation, sidecar, retrieval.
// These never substitute for loading the device in Live.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), os = require('os'), path = require('path');
const E = require('../src/coagula-engine.js');
const { speech, writeWav, writeAiff, rng } = require('./synth.cjs');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'coagula-test-'));
const SR = 44100;

test('FFT matches a naive DFT', () => {
    const n = 64, f = new E.FFT(n), re = new Float64Array(n), im = new Float64Array(n), x = [];
    const r = rng(3);
    for (let i = 0; i < n; i++) { x.push([r() - 0.5, r() - 0.5]); re[i] = x[i][0]; im[i] = x[i][1]; }
    f.forward(re, im);
    for (let k = 0; k < n; k++) {
        let sr = 0, si = 0;
        for (let t = 0; t < n; t++) { const a = -2 * Math.PI * k * t / n; sr += x[t][0] * Math.cos(a) - x[t][1] * Math.sin(a); si += x[t][0] * Math.sin(a) + x[t][1] * Math.cos(a); }
        assert.ok(Math.abs(sr - re[k]) < 1e-9 && Math.abs(si - im[k]) < 1e-9, 'bin ' + k);
    }
    f.inverse(re, im);
    for (let t = 0; t < n; t++) assert.ok(Math.abs(re[t] - x[t][0]) < 1e-12 && Math.abs(im[t] - x[t][1]) < 1e-12);
});

test('decodes WAV 16/24/float and AIFF identically', () => {
    const x = new Float32Array(5000).map((_, i) => 0.5 * Math.sin(i * 0.01)), y = x.map(v => -v * 0.5);
    const files = { w16: [16, false], w24: [24, false], wf: [32, true] };
    for (const [k, [bits, fl]] of Object.entries(files)) {
        const f = path.join(TMP, k + '.wav'); writeWav(f, [x, y], 48000, bits, fl);
        const info = E.readAudioInfo(f);
        assert.deepStrictEqual([info.sr, info.ch, info.frames, info.bits, info.float], [48000, 2, 5000, bits, fl]);
        const m = E.decodeMono(f, info);
        for (let i = 0; i < 5000; i += 97) assert.ok(Math.abs(m[i] - (x[i] + y[i]) / 2) < 2e-4, k + ' @' + i);
    }
    const fa = path.join(TMP, 'a.aiff'); writeAiff(fa, [x], 44100);
    const ia = E.readAudioInfo(fa);
    assert.deepStrictEqual([ia.sr, ia.ch, ia.frames], [44100, 1, 5000]);
    const ma = E.decodeMono(fa, ia);
    assert.ok(Math.abs(ma[1234] - x[1234]) < 1e-4);
    assert.strictEqual(E.readAudioInfo(__filename), null);
});

function framesFor(sig, sr, ap) {
    const g = E.geometry(sr, ap), nd = Math.floor(sig.length / g.D), dec = new Float32Array(nd);
    E.decimate(sig, dec, g.D, 0, nd);
    const nF = Math.ceil(sig.length / g.hop), out = new Float32Array(nF * E.FCOLS);
    E.analyzeFrames(sig, dec, sr, ap, 0, nF, out);
    return { out, nF, g };
}

test('YIN pitch tracks harmonic tones across the range and rejects noise', () => {
    const ap = E.DEFAULT_APARAMS;
    for (const f0 of [55, 98, 220, 440, 880, 1300]) {
        const n = SR, x = new Float32Array(n);
        for (let i = 0; i < n; i++) for (let h = 1; h <= 6; h++) if (h * f0 < SR / 2) x[i] += 0.2 * Math.sin(2 * Math.PI * h * f0 * i / SR) / h;
        const { out, nF } = framesFor(x, SR, ap);
        const mid = Math.floor(nF / 2) * E.FCOLS;
        assert.ok(Math.abs(out[mid + 3] - E.hzToMidi(f0)) < 0.3, f0 + ' Hz -> ' + out[mid + 3]);
        assert.ok(out[mid + 4] > 0.8, 'periodicity ' + out[mid + 4]);
    }
    const r = rng(9), z = new Float32Array(SR).map(() => (r() - 0.5) * 0.5);
    const { out, nF } = framesFor(z, SR, ap);
    let voiced = 0;
    for (let f = 0; f < nF; f++) if (out[f * E.FCOLS + 3] >= 0) voiced++;
    assert.ok(voiced / nF < 0.05, 'noise voiced ratio ' + voiced / nF);
    // flatness: noise high, tone low
    assert.ok(out[Math.floor(nF / 2) * E.FCOLS + 2] > 0.3);
});

let corpus = null;
async function getCorpus() {
    if (corpus) return corpus;
    const { x, events } = speech(40, SR, 7);
    const t0 = Date.now();
    const variants = await E.analyze(x, SR, E.DEFAULT_APARAMS, () => {});
    corpus = { x, events, variants, ms: Date.now() - t0 };
    return corpus;
}

test('analysis: four variants, bounded lengths, pauses and onsets found', async () => {
    const { variants, events, ms } = await getCorpus();
    console.log('    40 s analyzed in', ms, 'ms ->', E.VARIANTS.map(v => v + ' ' + variants[v].n).join(', '));
    const minLen = 0.03 * SR;
    for (const v of E.VARIANTS) {
        const c = variants[v].cols;
        let pos = 0;
        for (let i = 0; i < variants[v].n; i++) {
            assert.strictEqual(c.start[i], pos, v + ' contiguous');
            assert.ok(c.len[i] >= minLen - 1 || i === variants[v].n - 1, v + ' min length');
            pos += c.len[i];
            if (c.voiced[i] < 0.5) assert.strictEqual(c.pitch[i], E.NOPITCH);
        }
        assert.strictEqual(pos, 40 * SR, v + ' covers the file');
    }
    const maxOf = v => Math.max(...variants[v].cols.duration);
    assert.ok(maxOf('hybrid_400') <= 400.5 && maxOf('hybrid_200') <= 200.5 && maxOf('fixed') <= 130);
    assert.ok(maxOf('onset') > 400, 'onset keeps sustains whole');
    // Onset recall: most voiced/unvoiced event starts have a boundary within 25 ms.
    const starts = variants.onset.cols.start, starts2 = Array.from(starts);
    const evs = events.filter(e => e.kind !== 'pause');
    let hit = 0;
    for (const e of evs) if (starts2.some(s => Math.abs(s / SR - e.t) < 0.025)) hit++;
    console.log('    onset recall', (hit / evs.length).toFixed(2), 'of', evs.length);
    assert.ok(hit / evs.length > 0.8);
    // Pauses become silent segments.
    const B = E.prepare(variants.hybrid_400, -50);
    assert.ok(B.silent.length > 0 && B.voi.length > 0 && B.unv.length > 0, 'buckets ' + [B.silent.length, B.voi.length, B.unv.length]);
    // Voiced segment pitch agrees with the event f0.
    const c = variants.onset.cols;
    let good = 0, tot = 0;
    for (const e of events.filter(e => e.kind === 'voiced' && e.d > 0.15)) {
        const i = E.segmentAt(variants.onset, (e.t + e.d / 2) * 1000);
        if (c.voiced[i] > 0.5) { tot++; if (Math.abs(c.pitch[i] - E.hzToMidi(e.f0)) < 0.7) good++; }
    }
    console.log('    pitch agreement', good, '/', tot);
    assert.ok(tot > 5 && good / tot > 0.85);
});

test('sidecar: round trip, fingerprint, params, crash safety', async () => {
    const { variants, x } = await getCorpus();
    const f = path.join(TMP, 'long.wav'); writeWav(f, [x], SR);
    const info = E.readAudioInfo(f), fp = E.fingerprint(f, info), dir = E.sidecarDir(f);
    E.writeSidecar(dir, fp, E.DEFAULT_APARAMS, variants);
    assert.ok(E.validCache(dir, fp, E.DEFAULT_APARAMS));
    const back = E.readVariant(path.join(dir, 'hybrid_400.bin'));
    assert.deepStrictEqual(Array.from(back.cols.start), Array.from(variants.hybrid_400.cols.start));
    assert.deepStrictEqual(Array.from(back.cols.pitch), Array.from(variants.hybrid_400.cols.pitch));
    assert.strictEqual(E.validCache(dir, fp, Object.assign({}, E.DEFAULT_APARAMS, { hop: 128 })), null, 'param change invalidates');
    // Re-export with the same size and mtime but different audio.
    const y = Float32Array.from(x); y[Math.floor(y.length / 2) + 10] += 0.25;
    const st = fs.statSync(f); writeWav(f, [y], SR); fs.utimesSync(f, st.atime, st.mtime);
    const fp2 = E.fingerprint(f, E.readAudioInfo(f));
    assert.strictEqual(fp2.size, fp.size);
    assert.strictEqual(E.validCache(dir, fp2, E.DEFAULT_APARAMS), null, 'middle-block hash catches re-export');
    // Overwrite, then simulate a crash: a folder without manifest is never valid.
    E.writeSidecar(dir, fp2, E.DEFAULT_APARAMS, variants);
    assert.ok(E.validCache(dir, fp2, E.DEFAULT_APARAMS));
    assert.deepStrictEqual(fs.readdirSync(path.dirname(dir)).filter(n => /\.(tmp|old)-/.test(n)), [], 'no leftovers');
    fs.unlinkSync(path.join(dir, 'manifest.json'));
    assert.strictEqual(E.validCache(dir, fp2, E.DEFAULT_APARAMS), null);
});

test('retrieval: selection order, guard, clamps, fall-through', async () => {
    const { variants } = await getCorpus();
    const v = variants.hybrid_400, B = E.prepare(v, -50), r = rng(5);
    const P = Object.assign({}, E.DEFAULT_PARAMS, { continuity: 0, unvmix: 0, sildens: 0 });
    const st = { last: -1, history: [], note: null };
    // Pitch mode main query never returns unvoiced or silent segments.
    for (let t = 0; t < 500; t++) {
        const p = Object.assign({}, P, { tx: r(), ty: r(), k: 1 + Math.floor(r() * 8) });
        const s = E.selectSegment(v, B, p, st, r);
        assert.strictEqual(s.step, 'main');
        assert.ok(v.cols.voiced[s.index] > 0.5 && !B.isSilent[s.index]);
    }
    // Static target, k = 1: the repeat guard walks through neighbours instead of looping.
    const seen = [];
    for (let t = 0; t < 40; t++) {
        const s = E.selectSegment(v, B, P, st, r);
        seen.push(s.index); st.last = s.index; st.history.push(s.index);
    }
    for (let i = 1; i < seen.length; i++) assert.notStrictEqual(seen[i], seen[i - 1]);
    for (let i = 4; i < seen.length; i++) assert.ok(!seen.slice(i - 4, i).includes(seen[i]), 'guard of 4');
    // Silence density 0: never silence. 1: always silence.
    for (let t = 0; t < 200; t++) assert.notStrictEqual(E.selectSegment(v, B, Object.assign({}, P, { continuity: 1 }), { last: Math.floor(r() * v.n), history: [], note: null }, r).step, 'silence');
    assert.strictEqual(E.selectSegment(v, B, Object.assign({}, P, { sildens: 1 }), st, r).step, 'silence');
    // Continuity 1 plays the next segment in source order.
    assert.strictEqual(E.selectSegment(v, B, Object.assign({}, P, { continuity: 1 }), { last: 10, history: [], note: null }, r).index, 11);
    // Clamps: k larger than the bucket and a guard as big as the bucket still return something.
    const tiny = { n: 3, cols: {} };
    for (const c of E.COLS) tiny.cols[c] = new Float64Array(3);
    tiny.cols.voiced.set([1, 1, 0]); tiny.cols.pitch.set([60, 62, -1]); tiny.cols.lmean.set([-20, -20, -20]); tiny.cols.duration.set([100, 100, 100]);
    const TB = E.prepare(tiny, -50);
    const s1 = E.selectSegment(tiny, TB, Object.assign({}, P, { k: 32, guard: 16 }), { last: -1, history: [0, 1], note: null }, r);
    assert.ok(s1.index === 0 || s1.index === 1);
    // Empty voiced bucket in Pitch mode falls through to unvoiced, then silence, then anything.
    tiny.cols.voiced.set([0, 0, 0]); tiny.cols.pitch.set([-1, -1, -1]);
    assert.strictEqual(E.selectSegment(tiny, E.prepare(tiny, -50), P, { last: -1, history: [], note: null }, r).step, 'unvoiced');
    tiny.cols.lmean.set([-90, -90, -90]);
    assert.strictEqual(E.selectSegment(tiny, E.prepare(tiny, -50), P, { last: -1, history: [], note: null }, r).step, 'silence');
    // Key tracking: nearest available pitch for the held note.
    const Pk = Object.assign({}, P, { keytrack: 1, guard: 0, k: 1 });
    const pitches = Array.from(B.voi).map(i => v.cols.pitch[i]);
    for (const note of [45, 52, 60, 67]) {
        const s = E.selectSegment(v, B, Object.assign({}, Pk, { ty: 0.5 }), { last: -1, history: [], note }, r);
        const nearest = Math.min(...pitches.map(p => Math.abs(p - note)));
        assert.ok(Math.abs(v.cols.pitch[s.index] - note) <= nearest + 6, 'note ' + note);
    }
    // Transpose-to-match clamps at +-12 semitones; Max length truncates.
    const i = B.voi[0], pp = E.playParams(v, i, Object.assign({}, Pk, { t2m: 1, maxlen: 20 }), SR, v.cols.pitch[i] + 30);
    assert.ok(Math.abs(pp.rate - SR * 2) < 1e-6);
    assert.strictEqual(pp.len, Math.min(v.cols.len[i], Math.round(0.02 * SR)));
});

test('variant switch keeps continuity by source position', async () => {
    const { variants } = await getCorpus();
    const a = variants.onset, b = variants.fixed;
    for (const i of [3, 20, a.n - 2]) {
        const j = E.segmentAt(b, a.cols.src_pos[i]);
        assert.ok(b.cols.src_pos[j] <= a.cols.src_pos[i] && b.cols.src_pos[j] + b.cols.duration[j] > a.cols.src_pos[i]);
    }
});
