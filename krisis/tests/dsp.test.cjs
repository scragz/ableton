// node --test tests/dsp.test.cjs  -- offline checks of the generated GenExpr (device/krisis.genexpr).
// Build first. Not a substitute for loading the device in Live.
const test = require('node:test'), assert = require('node:assert');
const { run, stats, testInput, pink } = require('./harness.cjs');
const SR = 44100, CEIL = 0.966 + 1e-6;
const quick = (p) => Object.assign({ p_os: 2 }, p);
const silentAfter = (t) => (n, c) => (n < t * SR ? testInput(n, c) : 0);
const ok = (r, label) => { const s = stats(r.out); assert.ok(!s.nan, `nan ${label}`); assert.ok(s.peak <= CEIL, `peak ${s.peak} ${label}`); return s; };

test('every clip mode x curve x topology is finite and under the ceiling', () => {
  for (let clip = 0; clip < 3; clip++) for (let curve = 0; curve < 4; curve++) for (const topo of [0, 1, 2, 3]) {
    if (topo && curve % 2) continue;
    ok(run(quick({ p_clip: clip, p_curve: curve, p_topo: topo, p_cross: 1.2, p_mab: 1, p_mbc: 1, p_mca: 1, p_maa: 0.5, p_fb: 0.9, p_q: 30, p_drive: 30 }), 0.4),
      `clip ${clip} curve ${curve} topo ${topo}`);
  }
});

test('dry/wet 0 passes the input untouched', () => {
  const r = run(quick({ p_mix: 0 }), 0.6); let err = 0;
  for (let n = 10000; n < 20000; n++) err = Math.max(err, Math.abs(r.out[2 * n] - testInput(n, 0)), Math.abs(r.out[2 * n + 1] - testInput(n, 1)));
  assert.ok(err < 1e-4, `err ${err}`);
});

test('Sustain 1 keeps an Injection loop ringing after the input stops; Sustain 0 lets it die', () => {
  const on = run(quick({ p_fb: 0.9, p_q: 20, p_sustain: 1 }), 2, { input: silentAfter(0.3) });
  const off = run(quick({ p_fb: 0.9, p_q: 20, p_sustain: 0 }), 2, { input: silentAfter(0.3) });
  assert.ok(stats(on.out, 1.5, 2).rmsDb > -40, `drone ${stats(on.out, 1.5, 2).rmsDb}`);
  assert.ok(stats(off.out, 1.5, 2).rmsDb < -100, `tail ${stats(off.out, 1.5, 2).rmsDb}`);
});

test('Both mode can start a self-sustaining tone from silence at Sustain 1', () => {
  const r = run(quick({ p_clip: 2, p_fb: 1, p_q: 30, p_sustain: 1, p_drive: 0 }), 3, { input: () => 0 });
  assert.ok(stats(r.out, 2.5, 3).rmsDb > -60, `self-start ${stats(r.out, 2.5, 3).rmsDb}`);
});

test('Core raises the resonance with level (saturating inductor)', () => {
  const zc = (core, db) => {
    const sig = pink(SR, db, 3);
    const r = run(quick({ p_core: core, p_q: 25, p_fb: 0, p_gm: 0, p_onb: 0, p_onc: 0, p_spread: 0, p_freq: 600, p_tap: 1, p_lim: 0, p_drive: -12 }), 1,
      { input: (n, c) => (c < 2 ? sig[n] : 0) });
    let z = 0; for (let n = SR / 2; n < SR - 1; n++) if ((r.out[2 * n] > 0) !== (r.out[2 * n + 2] > 0)) z++;
    return z;   // crossings in 0.5 s ~ 2 x the resonance in Hz x 0.5
  };
  const quiet = zc(1, -40), loud = zc(1, -6), flat = zc(0, -6);
  assert.ok(Math.abs(quiet - 600) < 60, `quiet ${quiet}`);
  assert.ok(loud > quiet * 1.12, `loud ${loud} quiet ${quiet}`);
  assert.ok(Math.abs(flat - 600) < 60, `core 0 ${flat}`);
});

test('Gain Match holds the default sound near the input level in every clip mode', () => {
  const dry = stats(run(quick({ p_mix: 0 }), 4).out, 2, 4).rmsDb;
  for (let clip = 0; clip < 3; clip++) {
    const wet = stats(run(quick({ p_clip: clip }), 4).out, 2, 4).rmsDb;
    assert.ok(Math.abs(wet - dry) < 3, `clip ${clip}: wet ${wet.toFixed(1)} dry ${dry.toFixed(1)}`);
  }
});

const freqs = (p, secs = 0.3) => Array.from(run(quick(p), secs).view.a.slice(0, 6));
const near = (a, b, tol = 0.01) => Math.abs(a / b - 1) < tol;

test('spread modes place the voices', () => {
  let f = freqs({ p_spread: 0.5 });
  assert.ok(near(f[0], 800 / Math.pow(2, 1.5)) && near(f[1], 800) && near(f[2], 800 * Math.pow(2, 1.5)), `ratio ${f}`);
  f = freqs({ p_smode: 1, p_spread: 0.5 });
  assert.ok(near(f[0], 50) && near(f[2], 1550), `linear ${f}`);
  f = freqs({ p_smode: 2, p_spread: 0.5, p_hset: 0 });
  assert.ok(near(f[1], 1600) && near(f[2], 2400), `harmonic ${f}`);
  f = freqs({ p_smode: 2, p_spread: 0.5, p_hset: 2 });
  assert.ok(near(f[1], 800 * 1.618034) && near(f[2], 800 * 2.618034), `golden ${f}`);
  f = freqs({ p_smode: 3, p_spread: 0 });
  assert.ok(near(f[0], 730) && near(f[1], 1090) && near(f[2], 2440), `vowel a ${f}`);
  f = freqs({ p_smode: 3, p_spread: 0.5 });
  assert.ok(near(f[0], 270) && near(f[1], 2290) && near(f[2], 3010), `vowel i ${f}`);
  f = freqs({ p_smode: 4, p_spread: 0.5, p_sca: 1, p_scb: -0.5, p_scc: 0 });
  assert.ok(near(f[0], 1600) && near(f[1], 800 / Math.SQRT2) && near(f[2], 800), `scatter ${f}`);
});

test('link: Freq 0 leaves the voices at 1 kHz + Tune; Q and Drive blend in log / dB', () => {
  const f = freqs({ p_linkf: 0, p_tunea: 12, p_freq: 300 });
  assert.ok(near(f[0], 2000) && near(f[1], 1000), `${f}`);
});

test('Offset stereo shifts R by Width; Dual mono does not', () => {
  let f = freqs({ p_stereo: 1, p_width: 12 });
  for (let i = 0; i < 3; i++) assert.ok(near(f[3 + i], 2 * f[i]), `offset ${f}`);
  f = freqs({ p_stereo: 0, p_width: 12 });
  for (let i = 0; i < 3; i++) assert.ok(near(f[3 + i], f[i]), `dual ${f}`);
});

test('Mid/Side filters the centre: a mono input leaves Side silent', () => {
  const r = run(quick({ p_stereo: 2, p_fb: 0.5 }), 0.8, { input: (n, c) => (c < 2 ? testInput(n, 0) : 0) });
  assert.ok(stats(r.out, 0.3, 0.8).sideDb < -100, `side ${stats(r.out, 0.3, 0.8).sideDb}`);
});

test('wah: treadle maps heel -> Min, toe -> Max; low damping overshoots, high does not', () => {
  let f = freqs({ p_wah: 1, p_treadle: 0, p_wmin: 400, p_wmax: 2000 }, 0.6);
  assert.ok(near(f[0], 400, 0.02) && near(f[1], 400, 0.02), `heel ${f}`);
  f = freqs({ p_wah: 1, p_treadle: 1, p_wmin: 400, p_wmax: 2000 }, 0.6);
  assert.ok(near(f[0], 2000, 0.02), `toe ${f}`);
  const peak = (damp) => {
    const r = run(quick({ p_wah: 1, p_treadle: 0, p_damp: damp, p_mass: 0.5 }), 1.5, { events: [[0.5, { p_treadle: 0.5 }]], probes: ['tpos0'], every: 32 });
    return Math.max(...r.probes.map(p => p.tpos0));
  };
  assert.ok(peak(0) > 0.6, `low damping ${peak(0)}`);
  assert.ok(peak(1) < 0.505, `high damping ${peak(1)}`);
});

test('wah Solo silences B and C; Stack puts all three on the treadle', () => {
  const v = run(quick({ p_wah: 2 }), 0.3).view.a;
  assert.ok(v[27] > 0 && v[0] > 0);
  const r = run(quick({ p_wah: 1, p_treadle: 0.3 }), 0.4);
  assert.ok(near(r.view.a[0], r.view.a[1]) && near(r.view.a[1], r.view.a[2]), 'stack');
});

test('envelope treadle opens with the input', () => {
  const r = run(quick({ p_wah: 1, p_tsrc: 1, p_esens: 12, p_mass: 0 }), 1, { probes: ['tpos0', 'te0'], every: 64 });
  assert.ok(Math.max(...r.probes.map(p => p.tpos0)) > 0.5, 'opened');
  assert.ok(Math.min(...r.probes.slice(10).map(p => p.tpos0)) < 0.5, 'closed again between hits');
});

test('chaos attractors stay bounded and the stereo methods route as specified', () => {
  for (const attr of [0, 1]) {
    const r = run(quick({ p_attr: attr, p_crate: 20 }), 2, { probes: ['cx0', 'cy0', 'cz0', 'rvx0', 'rvy0', 'rvx1', 'rvy1'], every: 256 });
    for (const p of r.probes) assert.ok(Math.abs(p.cx0) < 50 && Math.abs(p.cz0) < 50);
    const xs = r.probes.map(p => p.rvx0);
    assert.ok(Math.max(...xs) - Math.min(...xs) > 1, `axis moves (attr ${attr})`);
    for (const p of r.probes) assert.strictEqual(p.rvx1, p.rvy0);       // dual mono -> rotation
  }
  const side = run(quick({ p_stereo: 2, p_crate: 20 }), 1, { probes: ['rvx0', 'rvx1'], every: 512 });
  for (const p of side.probes) assert.strictEqual(p.rvx0, 0);
  assert.ok(side.probes.some(p => p.rvx1 !== 0));
  const div = run(quick({ p_stereo: 1, p_attr: 1, p_crate: 20, p_diverge: 0 }), 6, { probes: ['cx0', 'cx1'], every: 2048 });
  const early = div.probes.slice(1, 4).map(p => Math.abs(p.cx0 - p.cx1)), late = div.probes.slice(-20).map(p => Math.abs(p.cx0 - p.cx1));
  assert.ok(Math.max(...early) < 0.01, `start together ${early}`);
  assert.ok(Math.max(...late) > 0.5, `drift apart ${Math.max(...late)}`);
});

test('chaos routing moves the voice frequency; Freeze holds the attractor', () => {
  const r = run(quick({ p_tgtx: 1, p_depx: 1, p_crate: 10 }), 2, { probes: ['fca0'], every: 512 });
  const f = r.probes.map(p => p.fca0);
  assert.ok(Math.max(...f) / Math.min(...f) > 2, `range ${Math.min(...f)}..${Math.max(...f)}`);
  const z = run(quick({ p_freeze: 1, p_crate: 10 }), 1, { probes: ['cx0'], every: 4096 });
  assert.ok(new Set(z.probes.map(p => p.cx0.toFixed(9))).size === 1, 'frozen');
});

test('Chua lobe switches fire the trigger sweep', () => {
  const r = run(quick({ p_attr: 1, p_crate: 10, p_wah: 1, p_tsrc: 4, p_caxis: 3, p_tsens: 0 }), 4,
    { input: () => 0, probes: ['lev', 'tph0'], every: 1 });
  const hits = r.probes.filter(p => p.lev > 0.5).length;
  assert.ok(hits >= 2, `lobe switches ${hits}`);
  assert.ok(r.probes.some(p => p.tph0 > 0.5), 'sweep ran');
});

test('multi-input: Per Voice feeds B from pair B; Single ignores it; X-Excite rings pair 1 resonators', () => {
  const onlyB = (n, c) => (c === 2 || c === 3 ? testInput(n, c - 2) : 0);
  assert.ok(stats(run(quick({ p_multi: 1, p_gm: 0 }), 0.6, { input: onlyB }).out, 0.2).rmsDb > -50, 'per voice');
  assert.ok(stats(run(quick({ p_multi: 0, p_gm: 0 }), 0.6, { input: onlyB }).out, 0.2).rmsDb < -120, 'single');
  assert.ok(stats(run(quick({ p_multi: 3, p_gm: 0, p_fb: 0.5 }), 0.6, { input: onlyB }).out, 0.2).rmsDb > -60, 'excite');
});

test('Quality 2x / 4x / 8x keep the level within 1.5 dB', () => {
  const lv = [2, 4, 8].map(os => stats(run({ p_os: os, p_gm: 0 }, 0.6).out, 0.2).rmsDb);
  assert.ok(Math.max(...lv) - Math.min(...lv) < 1.5, `${lv}`);
});

test('Series makes up its loss with the wide trim', () => {
  const dry = stats(run(quick({ p_mix: 0 }), 1).out, 0.5).rmsDb;
  const r = run(quick({ p_topo: 1, p_trim: 0.3 }), 6);
  const wet = stats(r.out, 4, 6).rmsDb;
  assert.ok(wet > dry - 8, `series ${wet.toFixed(1)} dry ${dry.toFixed(1)}`);
});

test('extremes stay finite', () => {
  for (const p of [{ p_q: 80, p_drive: 48, p_fb: 1, p_clip: 2, p_sustain: 1, p_curve: 2 }, { p_freq: 20000, p_core: 1, p_q: 80 },
    { p_freq: 20, p_q: 0.3, p_drive: -24 }, { p_caudio: 1, p_crate: 100, p_tgtx: 1, p_depx: 1, p_tgty: 5, p_depy: 1, p_tgtz: 6, p_depz: 1 },
    { p_out: 24, p_lim: 0 }, { p_topo: 3, p_maa: 1.5, p_mbb: 1.5, p_mcc: 1.5, p_mab: 1.5, p_mba: 1.5, p_fb: 1, p_clip: 2 },
    { p_wah: 1, p_tsrc: 3, p_lrate: 50, p_damp: 0, p_mass: 0 }]) {
    ok(run(quick(p), 0.5), JSON.stringify(p));
  }
});
