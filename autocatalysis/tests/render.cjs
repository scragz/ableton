// node tests/render.cjs [name] -- offline audition renders of the generated GenExpr into tests/renders/.
// These are the harness's approximation of gen~ (seeded noise, linear delay reads), for listening
// before loading Live; they are not native renders. Build first.
const path = require('path'), fs = require('fs');
const { run, stats, writeWav } = require('./harness.cjs');
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
let count = 0;
const on = (t, s, n, v = 0.85) => [t, { [`f${s}`]: mtof(n), [`v${s}`]: v, [`g${s}`]: 1, [`s${s}`]: ++count, fseek: mtof(n) }];
const off = (t, s) => [t, { [`g${s}`]: 0 }];
const walk = (t0, t1, from, to, steps = 40) => Array.from({ length: steps + 1 }, (_, i) => [t0 + (t1 - t0) * i / steps, { distm: from + (to - from) * i / steps }]);
const SCENES = {
  '01-bloom': [10, { feedback: 0.45 }, [on(0.1, 2, 45), off(8, 2)]],
  '02-walk-to-the-amp': [16, { feedback: 0.55, drive: 24 }, [on(0.1, 2, 45), ...walk(1, 14, 4, 0.3)]],
  '03-power-chord': [12, { feedback: 0.5, drive: 26, sustain: 12, cab: 2 }, [on(0.1, 1, 40), on(0.11, 2, 47), on(0.12, 3, 52), off(10, 1), off(10, 2), off(10, 3)]],
  '04-breathing': [16, { feedback: 0.6, catalysis: 0.8, rate: 1.2, sag: 0.6 }, [on(0.1, 3, 50)]],
  '05-seek-octave': [14, { feedback: 0.55, distm: 2, seek: 1, harm: 2 }, [on(0.1, 2, 45)]],
  '06-hollow-body': [12, { feedback: 0.5, body: 1, drive: 22, stage: 0.6 }, [on(0.1, 4, 55), off(6, 4)]],
  '07-wide-stereo': [12, { feedback: 0.55, ampoff: 1.7, spread: 1, catalysis: 0.6, rate: 0.4 }, [on(0.1, 2, 45), on(0.12, 4, 57)]],
  '08-ring-mute': [10, { feedback: 0.5, ring: 1 }, [on(0.1, 2, 45), off(1.5, 2), on(3, 5, 64), off(4, 5), [8, { mutep: 1 }]]],
};
const dir = path.join(__dirname, 'renders'); fs.mkdirSync(dir, { recursive: true });
for (const [name, [secs, params, events]] of Object.entries(SCENES)) {
  if (process.argv[2] && !name.startsWith(process.argv[2])) continue;
  const t0 = Date.now(), r = run(params, secs, { events }), s = stats(r.out);
  writeWav(path.join(dir, name + '.wav'), r.out, r.sr);
  console.log(name.padEnd(22), `rms ${s.rmsDb.toFixed(1)} dB  peak ${s.peakDb.toFixed(1)} dB  side ${s.sideDb.toFixed(1)} dB  ${s.nan ? 'NAN ' : ''}(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
