// node --test tests/dsp.test.cjs -- offline checks of the generated GenExpr (device/autocatalysis.genexpr,
// build first) through tests/harness.cjs. Logic and stability only: it does not replace loading the
// device in Live and listening.
const test = require('node:test'), assert = require('node:assert');
const { run, stats } = require('./harness.cjs');
const CEIL = 0.97 + 1e-6;
const pluck = (t, n = 2, f = 110, v = 0.8, s = 1) => [t, { [`f${n}`]: f, [`g${n}`]: 1, [`v${n}`]: v, [`s${n}`]: s }];

// Magnitude of harmonics 1..K of f0 over a window (single-bin DFTs on the left channel).
function harmonics(out, sr, from, len, f0, K = 10) {
  const a = Math.round(from * sr), n = Math.round(len * sr), res = [];
  for (let k = 1; k <= K; k++) {
    let re = 0, im = 0; const w = 2 * Math.PI * k * f0 / sr;
    for (let i = 0; i < n; i++) { const x = out[2 * (a + i)]; re += x * Math.cos(w * i); im += x * Math.sin(w * i); }
    res.push(Math.hypot(re, im) / n);
  }
  return res;
}
const strongest = h => h.indexOf(Math.max(...h)) + 1;

test('no GenExpr local or History overwrites a Param', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../device/autocatalysis.genexpr'), 'utf8');
  const params = new Set([...src.matchAll(/^Param (\w+)\(/gm)].map(m => m[1]));
  const body = src.replace(/\/\/[^\n]*/g, '').replace(/^(Param|History|Delay|Data|Buffer) [^\n]*$/gm, '');
  const hits = [...body.matchAll(/(^|[;{}\s(])([a-zA-Z_]\w*)\s*[-+*/]?=(?!=)/g)].map(m => m[2]).filter(n => params.has(n));
  assert.deepStrictEqual([...new Set(hits)], []);
});

test('silent until played', () => {
  const s = stats(run({ feedback: 1, drive: 40 }, 2).out);
  assert.strictEqual(s.peak, 0);
});

test('extreme settings stay finite and under the ceiling', () => {
  for (const p of [{ feedback: 1, drive: 40, sag: 0, catalysis: 1, rate: 8, distm: 0.1, stage: 1, body: 1, bias: 1, tone: 1, cab: 0, pick: 1, damp: 0 },
    { feedback: 1, drive: 40, sag: 1, recover: 10, catalysis: 1, rate: 0.05, distm: 8, ampoff: 4, bias: -1, tone: -1, cab: 2, sustain: 60, ring: 1, seek: 1, harm: 4 }]) {
    const ev = [1, 2, 3, 4, 5, 6].map((n, i) => pluck(0.05 + i * 0.03, n, 82 * (i + 1), 1));
    const s = stats(run(p, 5, { events: ev }).out);
    assert.ok(!s.nan, `nan ${JSON.stringify(p)}`);
    assert.ok(s.peak <= CEIL, `peak ${s.peak}`);
    assert.ok(Math.abs(s.dc) < 0.01, `dc ${s.dc}`);
  }
});

test('Feedback 0: a plucked note decays like a string through an amp', () => {
  const r = run({ feedback: 0 }, 6, { events: [pluck(0.05)] });
  const early = stats(r.out, 0.1, 0.6).rmsDb, late = stats(r.out, 5, 6).rmsDb;
  assert.ok(early > -30, `pluck too quiet ${early}`);
  assert.ok(early - late > 20, `no decay: ${early} -> ${late}`);
});

test('Feedback up: a held note blooms into sustained feedback on one of its harmonics', () => {
  const r = run({ feedback: 0.6 }, 6, { events: [pluck(0.05)] });
  const late = stats(r.out, 4, 6).rmsDb;
  assert.ok(late > -20, `no sustain ${late}`);
  const h = harmonics(r.out, r.sr, 5, 0.5, 110, 12);
  const total = Math.sqrt(stats(r.out, 5, 5.5).rmsDb > -99 ? Math.pow(10, stats(r.out, 5, 5.5).rmsDb / 10) : 0);
  assert.ok(Math.max(...h) > 0.3 * total, `feedback is not on a harmonic of the note (${Math.max(...h)} vs ${total})`);
});

test('more Drive lowers the Feedback needed to sustain', () => {
  const level = (drive, feedback) => stats(run({ drive, feedback }, 5, { events: [pluck(0.05)] }).out, 4, 5).rmsDb;
  assert.ok(level(6, 0.3) < -40, 'clean amp at 30 % should not sustain');
  assert.ok(level(30, 0.3) > -20, 'hot amp at 30 % should sustain');
});

test('Distance moves the feedback between harmonics', () => {
  const seen = new Set();
  for (const distm of [0.6, 2.0, 2.5]) {
    const r = run({ feedback: 0.6, distm }, 5, { events: [pluck(0.05)] });
    seen.add(strongest(harmonics(r.out, r.sr, 4, 0.5, 110, 12)));
  }
  assert.ok(seen.size >= 2, `always the same harmonic: ${[...seen]}`);
});

test('releasing the note stops the feedback; Ring keeps it going; Mute kills it', () => {
  const rel = run({ feedback: 0.6 }, 6, { events: [pluck(0.05), [3, { g2: 0 }]] });
  assert.ok(stats(rel.out, 2, 3).rmsDb > -20 && stats(rel.out, 5, 6).rmsDb < -60, 'release');
  const ring = run({ feedback: 0.6, ring: 1 }, 6, { events: [pluck(0.05), [3, { g2: 0 }]] });
  assert.ok(stats(ring.out, 5, 6).rmsDb > -25, 'ring');
  const mute = run({ feedback: 0.6, ring: 1 }, 6, { events: [pluck(0.05), [3, { mutep: 1 }]] });
  assert.ok(stats(mute.out, 3.3, 4).rmsDb < -80, 'mute');
});

test('Offset and Spread make it stereo; at zero it is mono', () => {
  const mono = stats(run({ feedback: 0.6, ampoff: 0, spread: 0 }, 4, { events: [pluck(0.05)] }).out, 2, 4);
  assert.ok(mono.sideDb < -100, `side ${mono.sideDb}`);
  const wide = stats(run({ feedback: 0.6, ampoff: 0.4, spread: 0.7 }, 4, { events: [pluck(0.05)] }).out, 2, 4);
  assert.ok(wide.sideDb - wide.rmsDb > -20, `side ${wide.sideDb} vs ${wide.rmsDb}`);
});

test('Catalysis: low settles to a steady level, high makes the amp breathe', () => {
  const swing = (catalysis) => {
    const r = run({ feedback: 0.6, catalysis, rate: 1.5 }, 10, { events: [pluck(0.05)], probes: ['envL'], every: 2205 });
    const e = r.probes.slice(100).map(q => q.envL);
    return Math.max(...e) / Math.max(1e-9, Math.min(...e));
  };
  assert.ok(swing(0.25) < 1.2, `default should be steady: ${swing(0.25)}`);
  assert.ok(swing(0.8) > 2, `high catalysis should pulse: ${swing(0.8)}`);
});

test('Sag drains the supply in proportion to output', () => {
  const S = (sag) => {
    const r = run({ feedback: 0.6, sag, catalysis: 0 }, 5, { events: [pluck(0.05)], probes: ['SL'], every: 4410 });
    return r.probes[r.probes.length - 1].SL;
  };
  assert.ok(S(0) > 0.99, `no sag ${S(0)}`);
  assert.ok(S(1) < S(0.4) && S(0.4) < 0.9, `sag ${S(0.4)} ${S(1)}`);
});

test('Seek puts the target harmonic in charge and then holds still', () => {
  // A2: without Seek, Distance alone picks the winner; with Seek, Fund / Oct / 12th take over.
  for (const [harm, distm] of [[1, 2.0], [2, 0.5], [2, 2.0], [3, 1.2]]) {
    const off = run({ feedback: 0.6, distm, seek: 0 }, 6, { events: [pluck(0.05)] });
    const on = run({ feedback: 0.6, distm, seek: 1, harm, fseek: 110 }, 8, { events: [pluck(0.05)], probes: ['lk', 'soff', 'weak'], every: 4410 });
    assert.strictEqual(strongest(harmonics(on.out, on.sr, 7.3, 0.5, 110, 8)), harm, `h${harm} at ${distm} m (unseeked winner h${strongest(harmonics(off.out, off.sr, 5.3, 0.5, 110, 8))})`);
    const tail = on.probes.slice(-30);
    assert.ok(tail.every(q => q.lk === 1 && q.weak === 0), `h${harm} at ${distm} m not locked`);
    const so = tail.map(q => q.soff);
    assert.ok(Math.max(...so) - Math.min(...so) < 1, `offset wanders ${Math.min(...so)}..${Math.max(...so)}`);
  }
});

test('Seek reports Weak when the target cannot win (low E fundamental under the amp high-pass)', () => {
  const f = 82.41;
  const r = run({ feedback: 0.6, distm: 1.2, seek: 1, harm: 1, fseek: f, f1: f }, 3, { events: [pluck(0.05, 1, f)], probes: ['weak'], every: 4410 });
  assert.strictEqual(r.probes[r.probes.length - 1].weak, 1);
});

test('Seek off eases the offset back to zero', () => {
  const r = run({ feedback: 0.6, distm: 2.0, seek: 1, harm: 1, fseek: 110 }, 6, { events: [pluck(0.05), [3, { seek: 0 }]], probes: ['soff'], every: 4410 });
  assert.ok(Math.abs(r.probes[25].soff) > 5, 'seek moved');
  assert.ok(Math.abs(r.probes[r.probes.length - 1].soff) < 1, `offset left at ${r.probes[r.probes.length - 1].soff}`);
});

test('a re-pluck on a new pitch lands at that pitch', () => {
  const r = run({ feedback: 0 }, 1.4, { events: [pluck(0.05, 1, 110), pluck(0.7, 1, 220, 0.8, 2)] });
  const h = harmonics(r.out, r.sr, 0.75, 0.3, 220, 3);
  const h110 = harmonics(r.out, r.sr, 0.75, 0.3, 110, 1)[0];
  assert.ok(h[0] > h110 * 2, `220 ${h[0]} vs 110 ${h110}`);
});
