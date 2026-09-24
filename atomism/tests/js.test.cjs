// node --test tests/js.test.cjs  -- runs the Max JS (control + panel) against stubs. Build first.
const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const { run } = require('./harness.cjs');
const DEV = path.join(__dirname, '../device');

function load(file, extra) {
  const calls = [], ctx = Object.assign({
    outlet: (o, ...a) => { if (o === 0) calls.push(a); }, post: () => {}, messagename: '',
    Task: function (fn) { this.fn = fn; this.schedule = () => { this.fn(); }; this.cancel = () => {}; },
  }, extra);
  ctx.include = (n) => vm.runInContext(fs.readFileSync(path.join(DEV, n), 'utf8'), ctx);
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(DEV, file), 'utf8'), ctx);
  return { ctx, calls };
}
function send(ctx, name, ...args) { ctx.messagename = name; if (typeof ctx[name] === 'function') ctx[name](...args); else ctx.anything(...args); }

test('control: every parameter maps to a gen~ param inside its declared range', () => {
  const dims = {};
  const { ctx, calls } = load('atomism.control.js', { patcher: { getnamed: (n) => ({ message: (m, v) => { dims[n] = v; } }) } });
  ctx.init.call(ctx);
  const gen = src => { const m = {}; src.replace(/^Param (\w+)\(([-\d.]+), min=([-\d.]+), max=([-\d.]+)\)/gm, (_, n, d, lo, hi) => { m[n] = [+lo, +hi]; }); return m; };
  const ranges = gen(fs.readFileSync(path.join(__dirname, '../src/atomism.genexpr'), 'utf8'));
  const sent = calls.filter(c => ranges[c[0]]);
  const names = new Set(sent.map(c => c[0]));
  for (const n of Object.keys(ranges)) if (n !== 'trigin') assert.ok(names.has(n), `never sent ${n}`);
  for (const [n, v] of sent) assert.ok(v >= ranges[n][0] && v <= ranges[n][1], `${n}=${v} outside ${ranges[n]}`);
  assert.strictEqual(dims.division, 0); assert.strictEqual(dims.burst, 0); assert.strictEqual(dims.speed, 0);
  calls.length = 0; send(ctx, 'source', 1); assert.strictEqual(dims.division, 1); assert.strictEqual(dims.burst, 1);
  send(ctx, 'entropy', 2); assert.strictEqual(dims.speed, 1);
  // parameter max values stay in gen range too
  calls.length = 0;
  for (const [k, v] of [['density', 4000], ['size', 50], ['spray', 1000], ['speed', 50], ['speed', 0.02], ['division', 10], ['output', -24]]) send(ctx, k, v);
  for (const [n, v] of calls.filter(c => ranges[c[0]])) assert.ok(v >= ranges[n][0] && v <= ranges[n][1], `${n}=${v}`);
});

test('control: Trig pulses trigin 1 then 0 on press, ignores release', () => {
  const { ctx, calls } = load('atomism.control.js', { patcher: { getnamed: () => null } });
  send(ctx, 'trig', 1);
  assert.deepStrictEqual(calls.filter(c => c[0] === 'trigin').map(c => c[1]), [1, 0]);
  calls.length = 0; send(ctx, 'trig', 0);
  assert.strictEqual(calls.filter(c => c[0] === 'trigin').length, 0);
  send(ctx, 'trig', 'bang');
  assert.strictEqual(calls.filter(c => c[0] === 'trigin').length, 2);
});

test('panel paints every mode without throwing, from a real view buffer', () => {
  const ops = { n: 0 }, mg = new Proxy({}, { get: (t, k) => k === 'text_measure' ? () => [20, 9] : () => { ops.n++; } });
  for (const entropy of [0, 1, 2]) for (const src of [0, 1, 2, 3]) for (const w of [0, 1, 2, 3]) {
    const view = run({ entropy, src, hold: 1 }, 0.8).view;
    const { ctx } = load('atomism.panel.js', { mgraphics: mg, max: { getcolor: () => [0.5, 0.5, 0.5, 1] },
      Buffer: function () { this.peek = (c, s, n) => Array.from(view.a.slice(s, s + n)); } });
    send(ctx, 'viewbuffer', 'x');
    send(ctx, 'mode', src, entropy, 120, '1/16', 0.85);
    send(ctx, 'shape', w, 2.5, 0.3);
    for (let i = 0; i < 5; i++) { send(ctx, 'tick'); ctx.paint(); }
  }
  assert.ok(ops.n > 1000);
});

test('frozen amxd embeds the patch and every dependency', () => {
  const b = fs.readFileSync(path.join(DEV, 'Atomism.amxd'));
  assert.strictEqual(b.toString('ascii', 0, 4), 'ampf');
  assert.strictEqual(b.toString('ascii', 8, 12), 'aaaa');
  for (const n of ['Atomism.amxd', 'atomism.control.js', 'atomism.panel.js', 'atomism.theme.js']) assert.ok(b.includes(Buffer.from(n + '\0')), n);
  const patch = JSON.parse(fs.readFileSync(path.join(DEV, 'Atomism.maxpat'), 'utf8')).patcher;
  const widgets = patch.boxes.map(x => x.box).filter(x => x.parameter_enable);
  assert.strictEqual(widgets.length, 23);
  // no two widgets overlap on the face, all inside the device
  const r = widgets.map(w => [w.varname, ...w.presentation_rect]);
  for (const [n, x, y, w, h] of r) assert.ok(x >= 0 && y >= 0 && x + w <= patch.devicewidth && y + h <= 169, `${n} outside`);
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
    const a = r[i], c = r[j];
    const hit = a[1] < c[1] + c[3] && c[1] < a[1] + a[3] && a[2] < c[2] + c[4] && c[2] < a[2] + a[4];
    assert.ok(!hit, `${a[0]} overlaps ${c[0]}`);
  }
});
