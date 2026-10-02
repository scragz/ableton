// node --test tests/dsp.test.cjs -- offline checks of src/syzygy3.genexpr through tests/harness.cjs.
// Logic and stability only: it does not replace loading the device in Live and listening.
const test = require('node:test'), assert = require('node:assert');
const { run, stats } = require('./harness.cjs');
const SR = 44100, CEIL = 0.97 + 1e-6;
const POS = ['px1', 'py1', 'px2', 'py2', 'px3', 'py3'];
const quiet = { space: 0, doppler: 0, tide: 0, gravity: 0 };

// Dominant frequency by autocorrelation over a window (fine enough for tuning checks).
function pitch(out, from, len, lo = 50, hi = 2000) {
  const a = Math.round(from * SR), n = Math.round(len * SR), x = [];
  for (let i = 0; i < n; i++) x.push(out[2 * (a + i)] + out[2 * (a + i) + 1]);
  let best = 0, bestLag = 0;
  for (let lag = Math.floor(SR / hi); lag < SR / lo; lag++) {
    let s = 0; for (let i = 0; i + lag < n; i++) s += x[i] * x[i + lag];
    if (s > best) { best = s; bestLag = lag; }
  }
  return SR / bestLag;
}

test('every form x chaos x masses stays finite, bounded and under the ceiling', () => {
  for (const oform of [0, 1, 2, 3]) for (const chaos of [0, 1]) for (const m of [[1, 1, 1], [4, 0.25, 1]]) {
    const r = run({ oform, chaos, mass1: m[0], mass2: m[1], mass3: m[2], syzalign: 0.6, gravity: 1, feed: 1, bow: 1, tide: 1, orate: 3 }, 6,
      { probes: POS, every: 256 });
    const s = stats(r.out);
    assert.ok(!s.nan, `nan form ${oform} chaos ${chaos}`);
    assert.ok(s.peak <= CEIL, `peak ${s.peak}`);
    const maxR = Math.max(...r.probes.map(q => Math.max(Math.hypot(q.px1, q.py1), Math.hypot(q.px2, q.py2), Math.hypot(q.px3, q.py3))));
    assert.ok(maxR < 2.3, `escaped: ${maxR.toFixed(2)} form ${oform} chaos ${chaos} masses ${m}`);
  }
});

test('silent until played: no strikes, no bow, no alignment', () => {
  const s = stats(run({}, 3).out);
  assert.ok(s.peak === 0, `peak ${s.peak}`);
});

test('figure-eight is periodic and aligns six times per period', () => {
  // 1 cycle/s for 10 s; the Chenciner-Montgomery orbit passes through 6 syzygies per period.
  const r = run({ orate: 1, syzalign: 0.3, chaos: 0 }, 10, { probes: ['syzCount', ...POS], every: 441 });
  const n = r.probes[r.probes.length - 1].syzCount;
  assert.ok(Math.abs(n - 60) <= 2, `syzygies ${n}`);
  // Softening stretches the period slightly, so look for the return near t + 1 s.
  const a = r.probes[200];
  const miss = Math.min(...r.probes.slice(290, 311).map(b => Math.max(...POS.map(k => Math.abs(a[k] - b[k])))));
  assert.ok(miss < 0.02, `no return after one period: ${miss}`);
});

test('a strike rings its own body at its pitch, and only that body', () => {
  // Matter 0.4 is the String table: harmonic, so the fundamental is unambiguous.
  const r = run(Object.assign({}, quiet, { matter2: 0.4, f2: 220 }), 1.2,
    { events: [[0.05, { s2: 1 }]], probes: ['env1', 'env2', 'env3'], every: 441 });
  const f = pitch(r.out, 0.3, 0.3);
  assert.ok(Math.abs(f - 220) < 3, `pitch ${f}`);
  const e = r.probes.reduce((m, q) => [Math.max(m[0], q.env1), Math.max(m[1], q.env2), Math.max(m[2], q.env3)], [0, 0, 0]);
  assert.ok(e[1] > 0.1 && e[0] < 1e-6 && e[2] < 1e-6, `envs ${e}`);
});

test('a note change and its strike land together: no glide from the old pitch', () => {
  const r = run(Object.assign({}, quiet, { matter1: 0.4, f1: 110, decay: 6 }), 1.4,
    { events: [[0.05, { s1: 1 }], [0.7, { f1: 330, s1: 2, level1: 0.8 }]] });
  const f = pitch(r.out, 0.72, 0.1, 150, 1500);
  // The 110 Hz ring is still decaying underneath, so accept the new fundamental or its octave.
  assert.ok(Math.abs(f - 330) < 5, `pitch after retune ${f}`);
});

test('velocity and mallet hardness shape the hit', () => {
  const hit = (p) => run(Object.assign({}, quiet, p), 0.6, { events: [[0.05, { s1: 1 }]] }).out;
  const soft = stats(hit({ v1: 0.3 }), 0.05, 0.5), loud = stats(hit({ v1: 1 }), 0.05, 0.5);
  assert.ok(loud.rmsDb - soft.rmsDb > 10, `velocity range ${loud.rmsDb - soft.rmsDb}`);
  const hf = (o) => { let d = 0, e = 0; for (let n = 2205; n < 6615; n++) { const x = o[2 * n], y = o[2 * n - 2]; d += (x - y) ** 2; e += x * x; } return d / e; };
  assert.ok(hf(hit({ mallet: 1 })) > 1.5 * hf(hit({ mallet: 0 })), 'hard mallet should be brighter');
});

test('Tide bends pitch with the orbit, and not at all at zero', () => {
  const r0 = run({ tide: 0, orate: 1 }, 3, { probes: ['st1', 'st2', 'st3'], every: 441 });
  assert.ok(r0.probes.every(q => q.st1 === 0 && q.st2 === 0 && q.st3 === 0));
  const r1 = run({ tide: 1, orate: 1 }, 3, { probes: ['st1'], every: 441 });
  const v = r1.probes.map(q => q.st1);
  assert.ok(Math.max(...v) - Math.min(...v) > 3, `tide swing ${Math.max(...v) - Math.min(...v)}`);
  assert.ok(Math.max(...v.map(Math.abs)) <= 12, 'tide is bounded by 12 semitones');
});

test('Hold freezes the orbit; Launch restores the form', () => {
  const r = run({ orate: 1 }, 2, { events: [[0.5, { ohold: 1 }], [1.5, { ohold: 0, launch: 1 }]], probes: POS, every: 441 });
  const a = r.probes[60], b = r.probes[140];
  for (const k of POS) assert.strictEqual(a[k], b[k]);
  const c = r.probes[151]; // just after relaunch
  assert.ok(Math.abs(c.px1 - 0.97) < 0.1 && Math.abs(c.px3) < 0.1, `relaunch ${c.px1} ${c.px3}`);
});

test('grab pins a body to the pointer and a release throws it', () => {
  const r = run({ orate: 0.5 }, 2, {
    // Hold at (1.2, 1.2), then drag straight down for 150 ms and let go while still moving.
    events: [[0.2, { grab: 2, gx: 1.2, gy: 1.2 }], ...Array.from({ length: 15 }, (_, i) => [0.6 + i * 0.01, { gy: 1.2 - i * 0.16 }]), [0.75, { grab: 0 }]],
    probes: ['px2', 'py2', 'vy2'], every: 441
  });
  const held = r.probes[55]; // 0.55 s
  assert.ok(Math.abs(held.px2 - 1.2) < 0.02 && Math.abs(held.py2 - 1.2) < 0.02, `held at ${held.px2},${held.py2}`);
  const thrown = r.probes[76];
  assert.ok(thrown.vy2 < -1, `throw velocity ${thrown.vy2}`);
});

test('syzygies strike the bodies by themselves when Align is up', () => {
  const s = stats(run({ syzalign: 0.4, orate: 1 }, 4).out, 1, 4);
  assert.ok(s.rmsDb > -40, `rms ${s.rmsDb}`);
});

test('Bow sings in proportion to orbital speed', () => {
  const lo = stats(run({ bow: 0.3 }, 4).out, 2, 4), hi = stats(run({ bow: 1 }, 4).out, 2, 4);
  assert.ok(hi.rmsDb > lo.rmsDb + 5 && hi.rmsDb > -35, `bow ${lo.rmsDb} ${hi.rmsDb}`);
});

test('Feed self-sustains after one hit, bounded', () => {
  const s = stats(run({ feed: 0.8 }, 10, { events: [[0.05, { s1: 1, s2: 1, s3: 1 }]] }).out, 7, 10);
  assert.ok(s.rmsDb > -30 && s.peak <= CEIL, `feed ${s.rmsDb}`);
  const off = stats(run({ feed: 0 }, 10, { events: [[0.05, { s1: 1, s2: 1, s3: 1 }]] }).out, 7, 10);
  assert.ok(off.rmsDb < -50, `no feed should decay: ${off.rmsDb}`);
});

test('Gravity carries a hit into the other bodies', () => {
  const env = (g) => { const r = run({ gravity: g, tide: 0, space: 0 }, 5, { events: [[0.05, { s1: 1 }]], probes: ['env2', 'env3'], every: 441 });
    return Math.max(...r.probes.map(q => Math.max(q.env2, q.env3))); };
  const a = env(0), b = env(0.5), c = env(0.9);
  assert.ok(a < 1e-4 && b > 30 * a && c > b, `gravity ${a} ${b} ${c}`);
});

test('a gen~ reset does not replay the last strike', () => {
  // ready is 0 after a reset while the strike counters keep their values.
  const s = stats(run({ s1: 5, s2: 5, s3: 5 }, 1).out);
  assert.ok(s.peak === 0, `peak ${s.peak}`);
});

test('audio input excites the bodies (Syzygy Audio)', () => {
  const input = (n) => (n % 22050) < 200 ? Math.sin(n * 0.3) : 0;
  const on = stats(run({ inamt: 0.8 }, 2, { input }).out), off = stats(run({ inamt: 0 }, 2, { input }).out);
  assert.ok(on.rmsDb > -50 && off.peak === 0, `input ${on.rmsDb} ${off.peak}`);
});

test('display state reaches the view buffer', () => {
  const r = run({ orate: 1, syzalign: 0.4 }, 2);
  const v = r.view.a;
  assert.ok(Math.abs(v[0]) > 0 && v[9] > 0 && v[12] > 100, `view ${Array.from(v.slice(0, 16))}`);
});

test('contact keeps bodies apart: a throw into the centre or lopsided masses never lock into a clump', () => {
  const ev = [[1, { grab: 3, gx: 0, gy: 0 }], ...Array.from({ length: 20 }, (_, i) => [1.5 + i * 0.01, { gx: i * 0.07, gy: i * 0.05 }]), [1.7, { grab: 0 }]];
  for (const p of [{ orate: 1 }, { oform: 3, chaos: 1, mass1: 4, mass2: 0.25, orate: 2 }, { oform: 3, mass1: 4, mass2: 4, mass3: 0.25, orate: 2 }]) {
    const r = run(p, 20, { events: ev, probes: ['q12', 'q13', 'q23'], every: 441 });
    const clumped = r.probes.filter(q => Math.max(q.q12, q.q13, q.q23) < 0.09).length / r.probes.length;
    assert.ok(clumped < 0.03, `${JSON.stringify(p)} clumped ${(clumped * 100).toFixed(1)}%`);
  }
});
