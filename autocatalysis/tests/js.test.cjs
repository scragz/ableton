// node --test tests/js.test.cjs -- the Max JS (control, face) against stubs, inside a context stripped
// of post-ES5 builtins, plus the structure of the built patch. Build first.
// Not a substitute for loading the device in Live.
const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const { run } = require('./harness.cjs');
const DEV = path.join(__dirname, '../device');
const STRIP = `(function(){
 var p=[[Array.prototype,['fill','find','findIndex','includes','flat','flatMap','copyWithin','entries','keys','values','at']],
  [Array,['from','of']],[Object,['assign','entries','values','fromEntries']],
  [String.prototype,['includes','startsWith','endsWith','repeat','padStart','padEnd','trimStart','trimEnd','at','replaceAll']],
  [Number,['isFinite','isInteger','isNaN','parseFloat','parseInt','EPSILON']],
  [Math,['trunc','sign','log2','log10','hypot','cbrt','tanh']]];
 p.forEach(function(e){e[1].forEach(function(k){try{delete e[0][k];}catch(x){}});});
 ['Map','Set','WeakMap','WeakSet','Symbol','Promise','Proxy','Reflect'].forEach(function(k){delete globalThis[k];});
})();`;
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);

function load(file, extra = {}) {
  const out = [], writes = [];
  const ctx = Object.assign({
    outlet: (o, ...a) => out.push([o, ...a]), post: () => {}, messagename: '', jsarguments: [],
    Task: function () { this.schedule = () => {}; this.cancel = () => {}; },
    max: { getcolor: () => [0.5, 0.5, 0.5, 1] },
  }, extra);
  if (!ctx.patcher) ctx.patcher = { filepath: '/dev/Autocatalysis.amxd', getnamed: key => ({ message: (m, v) => writes.push([key, m, v]) }) };
  ctx.include = n => vm.runInContext(fs.readFileSync(path.join(DEV, n), 'utf8'), ctx);
  vm.createContext(ctx);
  vm.runInContext(STRIP, ctx);
  vm.runInContext(fs.readFileSync(path.join(DEV, file), 'utf8'), ctx, { filename: file });
  return { ctx, out, writes };
}
const gen = (o, name) => o.filter(m => m[0] === 0 && m[1] === name).map(m => m[2]);
const last = (o, name) => { const v = gen(o, name); return v[v.length - 1]; };
function send(ctx, name, ...args) { ctx.messagename = name; if (typeof ctx[name] === 'function') ctx[name](...args); else ctx.anything(...args); }
function genRanges() {
  const ranges = {};
  fs.readFileSync(path.join(DEV, 'autocatalysis.genexpr'), 'utf8')
    .replace(/^Param (\w+)\(([-\d.]+), min=([-\d.]+), max=([-\d.]+)\)/gm, (_, n, d, lo, hi) => { ranges[n] = [+lo, +hi]; });
  return ranges;
}
function patch() { return JSON.parse(fs.readFileSync(path.join(DEV, 'Autocatalysis.maxpat'), 'utf8')).patcher; }

test('control: init sends every gen~ param, inside its declared range, including widget extremes', () => {
  const { ctx, out } = load('autocatalysis.control.js');
  ctx.init();
  const ranges = genRanges();
  const skip = [/^s\d$/, /^v\d$/, /^bend$/, /^fseek$/];
  for (const n of Object.keys(ranges)) if (!skip.some(r => r.test(n))) assert.ok(gen(out, n).length, `never sent ${n}`);
  const check = () => { for (const m of out.filter(m => m[0] === 0 && ranges[m[1]])) assert.ok(m[2] >= ranges[m[1]][0] && m[2] <= ranges[m[1]][1], `${m[1]}=${m[2]}`); };
  check();
  // Every widget at both ends of its range (read from the built patch) stays inside the gen ranges.
  out.length = 0;
  for (const b of patch().boxes.map(b => b.box).filter(b => b.parameter_enable === 1)) {
    const v = b.saved_attribute_attributes.valueof;
    send(ctx, b.id, v.parameter_mmin); send(ctx, b.id, v.parameter_mmax);
  }
  check();
});

test('control: the widget defaults match the controller state', () => {
  const { ctx } = load('autocatalysis.control.js');
  for (const b of patch().boxes.map(b => b.box).filter(b => b.parameter_enable === 1)) {
    const v = b.saved_attribute_attributes.valueof;
    assert.strictEqual(ctx.state[b.id], v.parameter_initial[0], b.id);
  }
});

test('control: notes take strings (re-pluck, free, then oldest), pitch goes out before the strike', () => {
  const { ctx, out, writes } = load('autocatalysis.control.js');
  ctx.init(); out.length = 0;
  ctx.note(45, 100);                      // A2 is already string 2's open pitch: re-pluck it
  assert.ok(Math.abs(last(out, 'f2') - mtof(45)) < 1e-9 && last(out, 's2') === 1 && last(out, 'g2') === 1);
  assert.ok(Math.abs(last(out, 'v2') - 100 / 127) < 1e-9);
  assert.ok(Math.abs(last(out, 'fseek') - mtof(45)) < 1e-9);
  const iF = out.findIndex(m => m[1] === 'f2'), iS = out.findIndex(m => m[1] === 's2');
  assert.ok(iF < iS);
  for (const n of [60, 62, 64, 65, 67]) ctx.note(n, 90);
  const held = [1, 2, 3, 4, 5, 6].map(i => last(out, 'g' + i));
  assert.deepStrictEqual(held, [1, 1, 1, 1, 1, 1]);
  ctx.note(62, 0);                          // release one: the next note goes to that string
  const freed = [1, 2, 3, 4, 5, 6].find(i => last(out, 'g' + i) === 0);
  ctx.note(70, 90);
  assert.ok(Math.abs(last(out, 'f' + freed) - mtof(70)) < 1e-9);
  ctx.note(72, 90);                          // all held: steal the oldest (string 2, the A2)
  assert.ok(Math.abs(last(out, 'f2') - mtof(72)) < 1e-9 && last(out, 's2') === 2);
  assert.strictEqual(writes.length, 0, 'MIDI must not write widgets');
});

test('control: sustain pedal acts as Ring; all notes off releases everything', () => {
  const { ctx, out } = load('autocatalysis.control.js');
  ctx.init(); out.length = 0;
  ctx.pedalcc(127); assert.strictEqual(last(out, 'ring'), 1);
  ctx.pedalcc(0); assert.strictEqual(last(out, 'ring'), 0);
  send(ctx, 'ring', 1); ctx.pedalcc(0); assert.strictEqual(last(out, 'ring'), 1, 'the Ring toggle wins');
  send(ctx, 'ring', 0);
  ctx.note(60, 90); ctx.note(64, 90); ctx.allnotesoff();
  const gs = [1, 2, 3, 4, 5, 6].map(i => last(out, 'g' + i)).filter(g => g !== undefined);
  assert.ok(gs.length === 2 && gs.every(g => g === 0), `gates ${gs}`);
  ctx.bend(127); assert.ok(Math.abs(last(out, 'bend') - 2 * 63 / 64) < 1e-9);
  ctx.bend(0); assert.strictEqual(last(out, 'bend'), -2);
  send(ctx, 'harm', 3); assert.strictEqual(last(out, 'harm'), 4);
});

test('face paints from a real view buffer', () => {
  const ops = { n: 0 }, mg = new Proxy({}, { get: (t, k) => k === 'text_measure' ? () => [20, 9] : () => { ops.n++; } });
  for (const p of [{ feedback: 0.6 }, { feedback: 0.6, catalysis: 0.9, seek: 1, rate: 2 }, {}]) {
    const r = run(p, 1.5, { events: [[0.05, { g2: 1, s2: 1, v2: 0.9 }]] });
    const view = r.view;
    const Buffer = function () { this.peek = (c, s, n) => Array.prototype.slice.call(view.a, s, s + n); };
    const face = load('autocatalysis.panel.js', { mgraphics: mg, Buffer }).ctx;
    face.viewbuffer('v');
    for (let i = 0; i < 30; i++) { face.tick(); face.paint(); }
  }
  assert.ok(ops.n > 1000);
});

test('built patch: wiring, face layering, no overlapping widgets, banks, frozen deps', () => {
  const p = patch();
  const boxes = p.boxes.map(b => b.box), byId = Object.fromEntries(boxes.map(b => [b.id, b]));
  const wired = (a, b) => p.lines.some(l => l.patchline.source[0] === a && l.patchline.destination[0] === b);
  assert.strictEqual(byId.panel.ignoreclick, 1); assert.strictEqual(byId.panel.background, 1);
  assert.strictEqual(boxes[boxes.length - 1].id, 'panel');
  const params = boxes.filter(b => b.parameter_enable === 1);
  const longs = params.map(b => b.saved_attribute_attributes.valueof.parameter_longname);
  assert.strictEqual(new Set(longs).size, longs.length, 'unique long names');
  for (const b of params) { assert.ok(wired(b.id, 'p-' + b.id) && wired('p-' + b.id, 'control'), b.id); }
  const face = boxes.filter(b => b.presentation && b.id !== 'panel');
  for (const b of face) {
    const r = b.presentation_rect;
    assert.ok(r[0] >= 0 && r[1] >= 0 && r[0] + r[2] <= p.devicewidth && r[1] + r[3] <= 169, `${b.id} off the face`);
  }
  for (let i = 0; i < face.length; i++) for (let j = i + 1; j < face.length; j++) {
    const a = face[i].presentation_rect, c = face[j].presentation_rect;
    const hit = a[0] < c[0] + c[2] && c[0] < a[0] + a[2] && a[1] < c[1] + c[3] && c[1] < a[1] + a[3];
    assert.ok(!hit, `${face[i].id} overlaps ${face[j].id}`);
  }
  for (const bank of Object.values(p.parameters.parameterbanks)) for (const k of bank.parameters) if (k !== '-') assert.ok(p.parameters[k], `bank ${bank.name}: ${k}`);
  for (const k of ['notes', 'pedal', 'bendin', 'anoff']) assert.ok(byId[k], k);
  assert.ok(wired('dsp', 'audio'));
  const amxd = fs.readFileSync(path.join(DEV, 'Autocatalysis.amxd'));
  assert.strictEqual(amxd.slice(8, 12).toString(), 'iiii');
  for (const d of ['autocatalysis.control.js', 'autocatalysis.panel.js', 'autocatalysis.theme.js']) assert.ok(amxd.includes(Buffer.from(d)), d);
  // The embedded codebox is exactly the generated GenExpr.
  const code = byId.dsp.patcher.boxes.find(b => b.box.id === 'code').box.code;
  assert.strictEqual(code, fs.readFileSync(path.join(DEV, 'autocatalysis.genexpr'), 'utf8'));
});
