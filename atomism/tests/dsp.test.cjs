// node --test tests/dsp.test.cjs  -- offline checks of src/atomism.genexpr (not a substitute for Live)
const test = require('node:test'), assert = require('node:assert');
const { run, stats, SR } = require('./harness.cjs');
const CEIL = 0.966 + 1e-6;
const ring = (view) => { const g = []; for (let i = 0; i < 48; i++) g.push({ dist: view.a[i * 5], semis: view.a[i * 5 + 1] * 36, dir: view.a[i * 5 + 2], d0: view.a[i * 5 + 3], birth: view.a[i * 5 + 4] }); return g; };
const ordered = (view) => { const g = ring(view), rp = Math.round(view.a[251]); const o = []; for (let k = 0; k < 48; k++) o.push(g[(rp + k) % 48]); return o.filter(x => x.birth > 0); };

test('every source x entropy x window is finite and under the ceiling', () => {
  for (let src = 0; src < 4; src++) for (let entropy = 0; entropy < 3; entropy++) for (const wshape of [0, 3]) {
    const r = run({ src, entropy, wshape, sens: 0.8 }, 1.5), s = stats(r.out);
    assert.ok(!s.nan, `nan src ${src} ent ${entropy}`);
    assert.ok(s.peak <= CEIL, `peak ${s.peak}`);
    if (src !== 2 || entropy === 0) assert.ok(r.fires > 0, `no grains src ${src} entropy ${entropy}`);
  }
});

test('free runs at Density', () => {
  const r = run({ src: 0, density: 200, jitter: 0 }, 2);
  assert.ok(Math.abs(r.fires - 400) <= 2, `fires ${r.fires}`);
});

test('sync fires Burst grains per division tick', () => {
  // 120 bpm, 1/16 = 8 ticks/s, burst 4 at 400/s fits inside a tick.
  const r = run({ src: 1, beats: 0.25, burst: 4, density: 400, jitter: 0 }, 2);
  assert.ok(Math.abs(r.fires - 16 * 4) <= 4, `fires ${r.fires}`);
});

test('sync falls back to a free clock when transport stops', () => {
  const r = run({ src: 1, beats: 0.25, burst: 2, density: 400, _stop: 0.5 }, 2);
  assert.ok(r.fires > 25, `fires ${r.fires}`);
});

test('onset fires one burst per kick', () => {
  // kicks every 0.5 s -> 6 in 3 s
  const r = run({ src: 2, burst: 5, density: 300, sens: 0.5 }, 3);
  assert.ok(r.fires >= 30 && r.fires <= 45, `fires ${r.fires}`);
});

test('Trig parameter fires a burst on each rising edge', () => {
  const r = run({ src: 2, burst: 6, density: 500, _silent: true, _trigEvery: Math.round(SR * 0.25) }, 2);
  assert.ok(Math.abs(r.fires - 8 * 6) <= 6, `fires ${r.fires}`);
});

test('logistic at Chaos 0 repeats every 4 grains; at 100 it does not', () => {
  const a = ordered(run({ entropy: 1, chaos: 0 }, 2).view).map(g => g.d0.toFixed(4));
  const tail = a.slice(-24);
  for (let i = 4; i < tail.length; i++) assert.strictEqual(tail[i], tail[i - 4]);
  assert.ok(new Set(tail).size === 4, `distinct ${new Set(tail).size}`);
  const b = ordered(run({ entropy: 1, chaos: 1 }, 2).view).map(g => g.d0.toFixed(4));
  assert.ok(new Set(b.slice(-24)).size > 16, 'r=4 should not cycle');
});

test('chaos source with logistic gates events rhythmically', () => {
  const r = run({ src: 3, entropy: 1, chaos: 0, burst: 1, density: 100, sens: 0.3 }, 2);
  // r=3.5 cycle ~ {0.38, 0.83, 0.50, 0.87}: threshold 0.7 passes 2 of 4 ticks
  assert.ok(Math.abs(r.fires - 100) <= 4, `fires ${r.fires}`);
});

test('lorenz source fires irregular events', () => {
  const r = run({ src: 3, entropy: 2, speed: 8, burst: 3, density: 300, sens: 0.5 }, 4);
  assert.ok(r.fires > 10, `fires ${r.fires}`);
});

test('quantize: octaves only produce multiples of 12, fifths only 0/7 mod 12', () => {
  let g = ordered(run({ prand: 24, quant: 3, entropy: 0 }, 1).view);
  for (const x of g) assert.ok(Math.abs(x.semis / 12 - Math.round(x.semis / 12)) < 1e-3, `oct ${x.semis}`);
  g = ordered(run({ prand: 24, quant: 2, entropy: 0 }, 1).view);
  for (const x of g) { const m = ((Math.round(x.semis) % 12) + 12) % 12; assert.ok(m === 0 || m === 7, `fifth ${x.semis}`); }
});

test('reverse 0 / 100 sets every grain direction', () => {
  assert.ok(ordered(run({ reverse: 0 }, 0.6).view).every(g => g.dir === 1));
  assert.ok(ordered(run({ reverse: 1 }, 0.6).view).every(g => g.dir === -1));
});

test('hold keeps shredding the frozen buffer after the input stops', () => {
  const r = run({ _holdAt: 1, _inputUntil: 1.2, drywet: 1, sprayms: 500 }, 3);
  const N = r.out.length / 2; let e = 0, n0 = Math.round(2 * SR);
  for (let n = n0; n < N; n++) e += r.out[2 * n] ** 2;
  assert.ok(10 * Math.log10(e / (N - n0)) > -45, 'held buffer should still sound');
  const s = run({ _inputUntil: 1, drywet: 1, sprayms: 500 }, 3); let e2 = 0;
  for (let n = n0; n < N; n++) e2 += s.out[2 * n] ** 2;
  assert.ok(e2 < e * 0.01, 'without hold the buffer empties');
});

test('feedback 100 with no input stays bounded and decays or sustains, never blows up', () => {
  const r = run({ feedback: 1, density: 2000, sizems: 20, _inputUntil: 0.5, pitch: 12, prand: 0, reverse: 0 }, 4), s = stats(r.out);
  assert.ok(!s.nan && s.peak <= CEIL);
});

test('extremes stay finite', () => {
  for (const p of [{ density: 4000, sizems: 100, sizernd: 1, prand: 24, pitch: 24 }, { density: 1, sizems: 0.1, pitch: -24, prand: 24 },
    { sprayms: 1000, sizems: 100, pitch: 24, prand: 24, reverse: 0.5 }, { speed: 100, entropy: 2, chaos: 1 }, { outdb: 12, drywet: 1, feedback: 1 }]) {
    const s = stats(run(p, 1).out); assert.ok(!s.nan && s.peak <= CEIL, JSON.stringify(p));
  }
});

test('dry/wet 0 passes the input untouched', () => {
  const { input } = require('./harness.cjs');
  const r = run({ drywet: 0 }, 1); let err = 0;
  for (let n = 22050; n < 22050 + 1000; n++) err = Math.max(err, Math.abs(r.out[2 * n] - Math.max(-0.966, Math.min(0.966, input(n, 0)))));
  assert.ok(err < 1e-4, `err ${err}`);
});
