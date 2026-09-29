// Synthetic "speech-like" material with known structure: voiced syllables (harmonic tones with a
// formant-ish tilt and vibrato), unvoiced fricatives (high-passed noise) and pauses.
const fs = require('fs');
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function speech(seconds, sr, seed = 1) {
    const r = rng(seed), n = Math.round(seconds * sr), x = new Float32Array(n), events = [];
    let t = 0.05;
    while (t < seconds - 0.5) {
        const roll = r();
        if (roll < 0.15) { const d = 0.15 + r() * 0.5; events.push({ kind: 'pause', t, d }); t += d; continue; }
        if (roll < 0.35) { // fricative
            const d = 0.06 + r() * 0.12, a = Math.round(t * sr), b = Math.min(n, Math.round((t + d) * sr));
            let y1 = 0;
            for (let i = a; i < b; i++) { const w = r() * 2 - 1, hp = w - y1; y1 = w; const e = Math.min(1, (i - a) / (0.005 * sr), (b - i) / (0.01 * sr)); x[i] += 0.12 * hp * e; }
            events.push({ kind: 'unvoiced', t, d }); t += d + 0.01; continue;
        }
        const d = 0.08 + r() * (r() < 0.2 ? 1.2 : 0.3), f0 = 90 * Math.pow(2, r() * 2.2), a = Math.round(t * sr), b = Math.min(n, Math.round((t + d) * sr));
        let ph = 0;
        for (let i = a; i < b; i++) {
            const tt = (i - a) / sr, f = f0 * (1 + 0.01 * Math.sin(2 * Math.PI * 5 * tt));
            ph += 2 * Math.PI * f / sr;
            let s = 0;
            for (let h = 1; h * f0 < 4000; h++) s += Math.sin(h * ph) / (h * (1 + Math.abs(h * f0 - 700) / 600));
            const e = Math.min(1, (i - a) / (0.004 * sr)) * Math.min(1, (b - i) / (0.02 * sr));
            x[i] += 0.3 * s * e;
        }
        events.push({ kind: 'voiced', t, d, f0 }); t += d + (r() < 0.5 ? 0.0 : 0.03);
    }
    return { x, events };
}
function writeWav(file, chans, sr, bits = 16, float = false) {
    const n = chans[0].length, ch = chans.length, bps = bits / 8;
    const b = Buffer.alloc(44 + n * ch * bps);
    b.write('RIFF', 0); b.writeUInt32LE(36 + n * ch * bps, 4); b.write('WAVE', 8); b.write('fmt ', 12);
    b.writeUInt32LE(16, 16); b.writeUInt16LE(float ? 3 : 1, 20); b.writeUInt16LE(ch, 22); b.writeUInt32LE(sr, 24);
    b.writeUInt32LE(sr * ch * bps, 28); b.writeUInt16LE(ch * bps, 32); b.writeUInt16LE(bits, 34); b.write('data', 36); b.writeUInt32LE(n * ch * bps, 40);
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
        const v = Math.max(-1, Math.min(1, chans[c][i]));
        if (float) b.writeFloatLE(v, o);
        else if (bits === 16) b.writeInt16LE(Math.round(v * 32767), o);
        else if (bits === 24) b.writeIntLE(Math.round(v * 8388607), o, 3);
        o += bps;
    }
    fs.writeFileSync(file, b);
}
function writeAiff(file, chans, sr) {
    const n = chans[0].length, ch = chans.length;
    const comm = Buffer.alloc(26), ssnd = Buffer.alloc(16 + n * ch * 2);
    comm.write('COMM', 0); comm.writeUInt32BE(18, 4); comm.writeUInt16BE(ch, 8); comm.writeUInt32BE(n, 10); comm.writeUInt16BE(16, 14);
    // 80-bit extended sample rate
    let e = 16383 + 31, m = sr; while (m < 0x80000000) { m *= 2; e--; }
    comm.writeUInt16BE(e, 16); comm.writeUInt32BE(m >>> 0, 18); comm.writeUInt32BE(0, 22);
    ssnd.write('SSND', 0); ssnd.writeUInt32BE(8 + n * ch * 2, 4);
    let o = 16;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { ssnd.writeInt16BE(Math.round(Math.max(-1, Math.min(1, chans[c][i])) * 32767), o); o += 2; }
    const head = Buffer.alloc(12); head.write('FORM', 0); head.writeUInt32BE(4 + comm.length + ssnd.length, 4); head.write('AIFF', 8);
    fs.writeFileSync(file, Buffer.concat([head, comm, ssnd]));
}
module.exports = { speech, writeWav, writeAiff, rng };
