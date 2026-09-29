const test = require('node:test');
const assert = require('node:assert');
const { make } = require('./genharness.cjs');
const SR = 44100;
function src(frames, ch, fill) { const a = new Float32Array(frames * ch); for (let i = 0; i < frames; i++) for (let c = 0; c < ch; c++) a[i * ch + c] = fill(i, c); return { frames, ch, a }; }
const ones = src(SR * 10, 2, () => 0.5);

function run(P, seconds, onSample, BUF = { src: ones }) {
    const h = make({ P, BUF }), N = Math.round(seconds * SR), o = [];
    for (let n = 0; n < N; n++) { const r = h.step(n, 0); o.push(r); if (onSample) onSample(n, r, P); }
    return o;
}
// Plays like the engine: fills the pending slot whenever out3 asks.
function engine(P, seg) {
    let commit = 0;
    return (n, r) => {
        if (r[2] > 0.5) { const s = seg(n); commit++; Object.assign(P, { pstart: s.start, plen: s.len, prate: s.rate || SR, pgain: 1, pxf: s.xf || 8, pcommit: commit }); }
    };
}

test('Chain: back-to-back segments overlap by exactly the crossfade', () => {
    const starts = [];
    const P = { ready: 1, tmode: 0, gateon: 1 };
    const fill = engine(P, () => ({ start: SR, len: 0.1 * SR, xf: 10 }));
    let prevAct = 0;
    const out = run(P, 1, (n, r) => { if (r[3] > prevAct) starts.push(n); prevAct = r[3]; fill(n, r); });
    const d = starts.slice(2, 6).map((s, i, a) => i ? s - a[i - 1] : null).filter(x => x !== null);
    // 100 ms segment, 10 ms crossfade -> a new voice every 90 ms
    for (const x of d) assert.ok(Math.abs(x - 0.09 * SR) <= 2, 'spacing ' + x);
    // equal-power overlap of constant 0.5 material: level stays near 0.5 except inside fades (<= 0.5*sqrt2)
    const mid = out.slice(SR / 2, SR / 2 + 4000).map(r => r[0]);
    assert.ok(Math.max(...mid) < 0.72 && Math.min(...mid) > 0.3, 'range ' + Math.min(...mid) + '..' + Math.max(...mid));
});

test('Chain: no gate, no sound; gate off lets the current segment finish', () => {
    const P = { ready: 1, tmode: 0, gateon: 0 };
    const fill = engine(P, () => ({ start: 0, len: 0.2 * SR }));
    const out = run(P, 0.35, (n, r, p) => { fill(n, r); if (n === Math.round(0.1 * SR)) p.gateon = 1; if (n === Math.round(0.15 * SR)) p.gateon = 0; });
    assert.ok(out.slice(0, 0.1 * SR - 1).every(r => r[0] === 0));
    assert.ok(Math.abs(out[Math.round(0.2 * SR)][0]) > 0.3, 'still playing after gate off');
    assert.ok(out[Math.round(0.34 * SR)][3] === 0, 'finished');
});

test('Clock: free rate fires at the rate, polyphonic', () => {
    const P = { ready: 1, tmode: 1, gateon: 1, clockhz: 20 };
    const fill = engine(P, () => ({ start: 0, len: 0.5 * SR }));
    let maxAct = 0;
    const h = make({ P, BUF: { src: ones } });
    for (let n = 0; n < SR; n++) { const r = h.step(n, 0); maxAct = Math.max(maxAct, r[3]); fill(n, r); }
    let fires = 0;
    h.step(SR, 0);
    fires = h.serial();
    assert.ok(fires >= 19 && fires <= 21, 'fires ' + fires);
    assert.ok(maxAct >= 9, 'overlapping voices ' + maxAct);
});

test('Clock sync: ticks on beat divisions only while the transport runs', () => {
    const P = { ready: 1, tmode: 1, gateon: 1, sync: 1, beats: 0.25 };
    const fill = engine(P, () => ({ start: 0, len: 0.01 * SR, xf: 1 }));
    const h = make({ P, BUF: { src: ones } });
    let fires = 0, prev = 0, ph = 0;
    for (let n = 0; n < SR * 2; n++) {
        if (n < SR) ph = (ph + 2 / SR) % 1; // 120 bpm for 1 s, then stopped
        const r = h.step(n, ph);
        if (r[3] > prev) fires++; prev = r[3]; fill(n, r);
    }
    assert.ok(fires >= 7 && fires <= 9, '1/16 at 120 bpm for 1 s -> ~8, got ' + fires);
});

test('MIDI: fires on commit; not ready is silent', () => {
    const P = { ready: 1, tmode: 2, gateon: 0 };
    const h = make({ P, BUF: { src: ones } });
    let act = 0;
    for (let n = 0; n < 1000; n++) { if (n === 100) Object.assign(P, { pstart: 0, plen: 5000, prate: SR, pgain: 1, pxf: 2, pcommit: 1 }); act = Math.max(act, h.step(n, 0)[3]); }
    assert.strictEqual(act, 1);
    P.ready = 0;
    assert.strictEqual(h.step(1000, 0)[3], 0);
});

test('rate and truncation: length in output samples = len / (rate / sr); transposed reads advance faster', () => {
    const ramp = src(SR * 4, 1, i => i / (SR * 4));
    const P = { ready: 1, tmode: 2, pstart: SR, plen: SR * 0.5, prate: SR * 2, pgain: 1, pxf: 1, pcommit: 1 };
    let alive = 0;
    const out = run(P, 0.5, (n, r) => { if (r[3] > 0) alive = n; }, { src: ramp });
    assert.ok(Math.abs(alive - SR * 0.25) <= 2, 'plays 0.25 s at double rate, got ' + alive / SR);
    const v = out[Math.round(0.1 * SR)][0]; // mono duplicated: out1 == out2
    assert.ok(Math.abs(v - (SR + 2 * 0.1 * SR) / (SR * 4)) < 0.01);
    assert.strictEqual(out[500][0], out[500][1]);
});

test('limiter keeps 32 stacked voices under 0 dBFS', () => {
    const P = { ready: 1, tmode: 1, gateon: 1, clockhz: 100 };
    const fill = engine(P, () => ({ start: 0, len: 2 * SR, xf: 1 }));
    let pk = 0;
    run(P, 1, (n, r) => { pk = Math.max(pk, Math.abs(r[0])); fill(n, r); });
    assert.ok(pk <= 0.98, 'peak ' + pk);
});
