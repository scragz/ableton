// Static gain calibration (spec: "Layer 1"). Runs the real generated GenExpr offline with one voice,
// Gain Match off, pink noise at -18 dBFS RMS, over the grid in scripts/dsp.py
// (clip mode x curve x Drive x log2 Q x Feedback), and writes src/krisis.cal.json: dB of input RMS over
// one voice's output RMS, clamped to +/-40 dB. The tables are baked into the GenExpr at build time.
//
//   python3 scripts/build.py && node scripts/calibrate.cjs [--jobs 2]     (then rebuild)
// Takes a few minutes. The result is deterministic (seeded noise), so commit krisis.cal.json.
const fs = require('fs'), path = require('path'), { execFileSync, spawn } = require('child_process');
const ROOT = path.join(__dirname, '..');
const H = require(path.join(ROOT, 'tests/harness.cjs'));

const grid = JSON.parse(execFileSync('python3', ['-c',
  'import sys, json; sys.path.insert(0, "scripts"); import dsp; print(json.dumps(dict(drive=dsp.CAL_DRIVE, lq=dsp.CAL_LQ, fb=dsp.CAL_FB, modes=dsp.CAL_MODES, curves=dsp.CAL_CURVES)))'],
  { cwd: ROOT }).toString());
const SR = 44100, SECS = 0.4, FROM = 0.15, IN_DB = -18;

function measure(src, mode, curve) {
  const sig = H.pink(Math.round(SECS * SR) + 16, IN_DB, 7);
  const out = [];
  for (const drive of grid.drive) for (const lq of grid.lq) for (const fb of grid.fb) {
    const r = H.run({
      p_gm: 0, p_onb: 0, p_onc: 0, p_ona: 1, p_linkq: 1, p_linkd: 1, p_linkf: 1, p_spread: 0, p_freq: 1000,
      p_q: Math.pow(2, lq), p_drive: drive, p_fb: fb, p_clip: mode, p_curve: curve, p_tap: 1, p_body: 0,
      p_mix: 1, p_lim: 0, p_out: 0, p_os: 4,
    }, SECS, { src, input: (n, c) => (c < 2 ? sig[n] : 0) });
    let e = 0, k = 0;
    for (let n = Math.round(FROM * SR); n < r.out.length / 2; n++) { e += r.out[2 * n] ** 2; k++; }
    const voice = Math.sqrt(e / k) / 0.5773503;           // undo the three-voice sum scalar
    const db = 20 * Math.log10(Math.pow(10, IN_DB / 20) / Math.max(voice, 1e-9));
    out.push(Math.max(-40, Math.min(40, +db.toFixed(3))));
  }
  return out;
}

if (process.argv[2] === '--chunk') {
  const [mode, curve] = process.argv[3].split(',').map(Number);
  const src = fs.readFileSync(path.join(ROOT, 'device/krisis.genexpr'), 'utf8');
  process.stdout.write(JSON.stringify(measure(src, mode, curve)));
} else {
  const jobs = +(process.argv[process.argv.indexOf('--jobs') + 1] || 2) || 2;
  const chunks = [];
  for (let m = 0; m < grid.modes; m++) for (let c = 0; c < grid.curves; c++) chunks.push([m, c]);
  const results = new Array(chunks.length);
  let next = 0, done = 0;
  const t0 = Date.now();
  const launch = () => {
    if (next >= chunks.length) return;
    const i = next++, p = spawn(process.execPath, [__filename, '--chunk', chunks[i].join(',')]);
    let buf = '';
    p.stdout.on('data', d => { buf += d; });
    p.stderr.on('data', d => process.stderr.write(d));
    p.on('close', code => {
      if (code !== 0) { console.error('chunk failed', chunks[i]); process.exit(1); }
      results[i] = JSON.parse(buf);
      done++;
      console.log(`mode ${chunks[i][0]} curve ${chunks[i][1]} done (${done}/${chunks.length}, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
      if (done === chunks.length) {
        const db = [].concat(...results);
        const file = path.join(ROOT, 'src/krisis.cal.json');
        fs.writeFileSync(file, JSON.stringify({
          about: 'Static gain calibration for Krisis (scripts/calibrate.cjs). dB of input RMS over one voice\'s output RMS, ' +
            'pink noise at -18 dBFS, index = (((mode * curves + curve) * drive + d) * q + q) * fb + f.',
          grid: { drive_db: grid.drive, log2_q: grid.lq, feedback: grid.fb, modes: ['Inject', 'State', 'Both'], curves: ['Tanh', 'Diode', 'Fold', 'Hard'] },
          db,
        }) + '\n');
        console.log(`wrote ${file} (${db.length} points)`);
      } else launch();
    });
  };
  for (let j = 0; j < jobs; j++) launch();
}
