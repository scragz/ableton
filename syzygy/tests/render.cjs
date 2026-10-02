// node tests/render.cjs [name] -- offline audition renders of the real GenExpr into tests/renders/.
// These are the harness's approximation of gen~ (seeded noise, linear delay reads), for listening
// before loading Live; they are not native renders.
const path = require('path'), fs = require('fs');
const { run, stats, writeWav } = require('./harness.cjs');
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
// Root-mode note: every body retuned to note + its Pitch offset (0 / +7 / +12 by default), then struck.
let count = 0;
const note = (t, n, v = 0.8, off = [0, 7, 12]) => { count++; return [t, { f1: mtof(n + off[0]), f2: mtof(n + off[1]), f3: mtof(n + off[2]), v1: v, v2: v, v3: v, s1: count, s2: count, s3: count }]; };
const SCENES = {
  '01-keys': [16, { orate: 0.25, gravity: 0.4, tide: 0.3, space: 0.35 },
    [[0.2, 36], [2.2, 43], [4.2, 39], [6.2, 46], [8.2, 34], [10.2, 41]].map(([t, n]) => note(t, n))],
  '02-align-eight': [20, { syzalign: 0.35, orate: 0.6, gravity: 0.35, tide: 0.25 }, [note(0.01, 38, 0.001)]],
  '03-lagrange-breakup': [30, { oform: 1, syzalign: 0.4, chaos: 0.25, orate: 0.5, tide: 0.4, gravity: 0.45, space: 0.5 }, [note(0.01, 41, 0.001)]],
  '04-swarm-bow': [20, { oform: 3, bow: 0.8, chaos: 0.5, gravity: 0.6, tide: 0.6, orate: 0.4, matter1: 0.6, matter2: 0.62, matter3: 0.9, space: 0.6 }, [note(0.01, 45, 0.001)]],
  '05-feed-bifurcation': [30, { feed: 0.6, gravity: 0.72, decay: 8, mass1: 2.5, mass3: 0.4, chaos: 0.3, orate: 0.3, tide: 0.5, space: 0.5 }, [note(0.3, 33, 0.9)]],
  '06-throw': [16, { syzalign: 0.3, orate: 0.5, tide: 0.3, gravity: 0.4 },
    [note(0.01, 40, 0.001), [5, { grab: 3, gx: 0, gy: 0 }], ...Array.from({ length: 20 }, (_, i) => [5.5 + i * 0.01, { gx: i * 0.07, gy: i * 0.05 }]), [5.7, { grab: 0 }]]],
  '07-matter-sweep': [14, { tide: 0.1, gravity: 0.2, decay: 1.5 },
    Array.from({ length: 13 }, (_, i) => [[i * 1.0 + 0.1, { matter1: i / 12, matter2: i / 12, matter3: i / 12 }], note(i * 1.0 + 0.12, 43, 0.85)]).flat()],
};
const dir = path.join(__dirname, 'renders'); fs.mkdirSync(dir, { recursive: true });
for (const [name, [secs, params, events]] of Object.entries(SCENES)) {
  if (process.argv[2] && !name.startsWith(process.argv[2])) continue;
  const t0 = Date.now(), r = run(params, secs, { events }), s = stats(r.out);
  writeWav(path.join(dir, name + '.wav'), r.out, r.sr);
  console.log(name.padEnd(22), `rms ${s.rmsDb.toFixed(1)} dB  peak ${s.peakDb.toFixed(1)} dB  side ${s.sideDb.toFixed(1)} dB  ${s.nan ? 'NAN ' : ''}(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
