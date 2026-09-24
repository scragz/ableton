// Sweep parameter combos through the harness; flag any tail that decays and then comes back.
const h = require('./harness.cjs');
const base = { drywet: 1 };
const axes = {
  tapemode: [0, 1], trig: [0, 1, 2], feedback: [0.35, 0.8], crossamt: [0, 0.5, 1], scatteron: [0, 1],
  pitch: [0, 7], wowamt: [0, 0.6], diffuse: [0, 0.7], drive: [0, 0.6], pattern: [0, 2],
};
const pick = process.argv[2] ? JSON.parse(process.argv[2]) : null;
function* combos(keys, i = 0, cur = {}) { if (i === keys.length) { yield { ...cur }; return; } for (const v of axes[keys[i]]) { cur[keys[i]] = v; yield* combos(keys, i + 1, cur); } }
const keys = Object.keys(axes); let bad = 0, total = 0;
const list = pick ? [pick] : [...combos(keys)].filter(() => true);
// Random subset for speed unless a specific combo is given.
let rs = 7; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
const shuffled = list.map(c => [rnd(), c]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
const start = +(process.env.START || 0), count = +(process.env.COUNT || 40);
const sel = pick ? list : shuffled.slice(start, start + count);
for (const c of sel) {
  total++;
  const p = { ...base, ...c, _stop: 9 };
  const r = h.report(h.run(p, 24, 6), 24).slice(6);
  let lo = Infinity, back = false, loAt = 0;
  r.forEach((v, i) => { if (v < lo) { lo = v; loAt = i; } if (lo < -60 && v > lo + 25) back = true; });
  const peak = Math.max(...r);
  if (process.env.V) console.log(JSON.stringify(c), r.map(v => v.toFixed(0)).join(' '));
  if (back || peak > -3) { bad++; console.log('BAD', JSON.stringify(c), r.map(v => v.toFixed(0)).join(' ')); }
}
console.log(`${bad}/${total} flagged`);
