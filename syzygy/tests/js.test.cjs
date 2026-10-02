// node --test tests/js.test.cjs -- the Max JS (control, face, orbit) against stubs, inside a context
// stripped of post-ES5 builtins, plus the structure of the built patches. Build first.
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
    outlet: (o, ...a) => out.push([o, ...a]), post: () => {}, messagename: '', jsarguments: ['x', 'mem', 'exp'],
    Task: function (fn, self) { this.fn = fn; this.schedule = () => {}; this.cancel = () => {}; },
    max: { getcolor: () => [0.5, 0.5, 0.5, 1] },
  }, extra);
  // Widgets echo their value back to the controller the way a live.* parameter does.
  if (!ctx.patcher) ctx.patcher = { filepath: '/dev/Syzygy.amxd', getnamed: key => ({ message: (m, v) => { writes.push([key, m, v]); if (m === 'float') { ctx.messagename = key; ctx.anything(v); } } }) };
  ctx.include = n => vm.runInContext(fs.readFileSync(path.join(DEV, n), 'utf8'), ctx);
  vm.createContext(ctx);
  vm.runInContext(STRIP, ctx);
  vm.runInContext(fs.readFileSync(path.join(DEV, file), 'utf8'), ctx, { filename: file });
  return { ctx, out, writes };
}
const gen = (o, name) => o.filter(m => m[0] === 0 && m[1] === name).map(m => m[2]);
const last = (o, name) => { const v = gen(o, name); return v[v.length - 1]; };
function send(ctx, name, ...args) { ctx.messagename = name; if (typeof ctx[name] === 'function') ctx[name](...args); else ctx.anything(...args); }

test('control: init sends every gen~ param, inside its declared range', () => {
  const { ctx, out } = load('syzygy3.control.js');
  ctx.init();
  const ranges = {};
  fs.readFileSync(path.join(__dirname, '../src/syzygy3.genexpr'), 'utf8')
    .replace(/^Param (\w+)\(([-\d.]+), min=([-\d.]+), max=([-\d.]+)\)/gm, (_, n, d, lo, hi) => { ranges[n] = [+lo, +hi]; });
  const skip = ['s1', 's2', 's3', 'v1', 'v2', 'v3', 'grab', 'gx', 'gy'];
  for (const n of Object.keys(ranges)) if (!skip.includes(n)) assert.ok(gen(out, n).length, `never sent ${n}`);
  for (const m of out.filter(m => m[0] === 0 && ranges[m[1]])) assert.ok(m[2] >= ranges[m[1]][0] && m[2] <= ranges[m[1]][1], `${m[1]}=${m[2]}`);
  // Widget extremes stay inside the gen ranges too.
  out.length = 0;
  for (const [k, v] of [['orate', 10], ['orate', 0.01], ['decay', 30000], ['decay', 50], ['output', -70], ['mass1', 4], ['root', 96], ['pitch3', 24]]) send(ctx, k, v);
  for (const m of out.filter(m => m[0] === 0 && ranges[m[1]])) assert.ok(m[2] >= ranges[m[1]][0] && m[2] <= ranges[m[1]][1], `${m[1]}=${m[2]}`);
});

test('control: Root keys retune all bodies and strike them, without touching a Live parameter', () => {
  const { ctx, out, writes } = load('syzygy3.control.js');
  ctx.init(); out.length = 0; writes.length = 0;
  ctx.note(60, 100);
  assert.ok(Math.abs(last(out, 'f1') - mtof(60)) < 1e-6 && Math.abs(last(out, 'f2') - mtof(67)) < 1e-6 && Math.abs(last(out, 'f3') - mtof(72)) < 1e-6);
  for (const s of ['s1', 's2', 's3']) assert.strictEqual(last(out, s), 1);
  assert.ok(Math.abs(last(out, 'v1') - 100 / 127) < 1e-9);
  // The frequency goes out before the strike, so gen~ rings the new pitch.
  const iF = out.findIndex(m => m[1] === 'f1'), iS = out.findIndex(m => m[1] === 's1');
  assert.ok(iF < iS);
  assert.strictEqual(writes.length, 0, 'MIDI must not write widgets');
  ctx.note(60, 0); assert.strictEqual(last(out, 's1'), 1, 'note-off does not strike');
  // Moving the Root dial takes pitch back from MIDI.
  send(ctx, 'root', 45);
  assert.ok(Math.abs(last(out, 'f1') - mtof(45)) < 1e-6);
});

test('control: Bodies keys give each note its own planet and steal the oldest', () => {
  const { ctx, out } = load('syzygy3.control.js');
  ctx.init(); send(ctx, 'pitch1', 0); send(ctx, 'pitch2', 0); send(ctx, 'pitch3', 0); send(ctx, 'keys', 1); out.length = 0;
  ctx.note(60, 90); ctx.note(64, 90); ctx.note(67, 90);
  assert.deepStrictEqual([last(out, 'f1'), last(out, 'f2'), last(out, 'f3')].map(f => Math.round(f * 100)), [60, 64, 67].map(n => Math.round(mtof(n) * 100)));
  assert.deepStrictEqual([last(out, 's1'), last(out, 's2'), last(out, 's3')], [1, 1, 1]);
  ctx.note(64, 0);          // release the Earth's note: the next note goes there
  ctx.note(71, 90);
  assert.ok(Math.abs(last(out, 'f2') - mtof(71)) < 1e-6 && last(out, 's2') === 2);
  ctx.note(72, 90);         // all held: steal the oldest (the Sun's 60)
  assert.ok(Math.abs(last(out, 'f1') - mtof(72)) < 1e-6 && last(out, 's1') === 2);
});

test('control: Form launches, grab/drag/release reach gen~, strikes count up', () => {
  const { ctx, out } = load('syzygy3.control.js');
  ctx.init(); out.length = 0;
  send(ctx, 'oform', 2);
  assert.strictEqual(last(out, 'oform'), 2); assert.ok(last(out, 'launch') >= 1);
  assert.ok(out.some(m => m[0] === 2 && m[1] === 'form' && m[2] === 2));
  ctx.grab(3, 0.5, -0.25); ctx.drag(0.7, -0.3); ctx.release();
  assert.deepStrictEqual(gen(out, 'grab'), [3, 0]);
  assert.deepStrictEqual(gen(out, 'gx'), [0.5, 0.7]);
  ctx.action('strike2'); ctx.action('strike2'); ctx.action('strikeall');
  assert.strictEqual(last(out, 's2'), 3); assert.strictEqual(last(out, 's1'), 1);
});

test('control: action buttons light on press and go dark 120 ms later without re-firing', () => {
  const tasks = [];
  const { ctx, out, writes } = load('syzygy3.control.js', { Task: function (fn, self) { this.fn = fn; this.self = self; this.schedule = (ms) => { this.ms = ms; tasks.push(this); }; this.cancel = () => { const i = tasks.indexOf(this); if (i >= 0) tasks.splice(i, 1); }; } });
  ctx.init(); out.length = 0; writes.length = 0;
  ctx.action('launch'); ctx.action('strikeall');
  assert.strictEqual(tasks.length, 1, 'one pending unlight'); assert.strictEqual(tasks[0].ms, 120);
  const before = out.length;
  tasks.shift().fn.call(ctx);
  for (const k of ['strike1', 'strike2', 'strike3', 'strikeall', 'launch']) assert.ok(writes.some(w => w[0] === k && w[1] === 'set' && w[2] === 0), k);
  assert.strictEqual(out.length, before, 'unlighting sends nothing');
});

test('face and orbit paint from a real view buffer; clicking a body grabs it', () => {
  const ops = { n: 0 }, mg = new Proxy({ size: [146, 146] }, { get: (t, k) => k === 'size' ? t.size : k === 'text_measure' ? () => [20, 9] : () => { ops.n++; } });
  for (const p of [{ orate: 1, syzalign: 0.5 }, { oform: 1, ohold: 1 }, { oform: 3, chaos: 1 }]) {
    const view = run(p, 1.5, { events: [[0.1, { s1: 1 }]] }).view;
    const Buffer = function () { this.peek = (c, s, n) => Array.prototype.slice.call(view.a, s, s + n); };
    const face = load('syzygy3.panel.js', { mgraphics: mg, Buffer }).ctx;
    const orbit = load('syzygy3.orbit.js', { mgraphics: mg, Buffer });
    face.viewbuffer('v'); orbit.ctx.viewbuffer('v'); face.value('matter2', 100);
    orbit.ctx.form(p.oform || 0); orbit.ctx.hold(p.ohold || 0); orbit.ctx.struck(1);
    for (let i = 0; i < 40; i++) { face.tick(); face.paint(); orbit.ctx.tick(); orbit.ctx.paint(); }
    // Click right on the Moon: grab 3, then drag and release.
    const x = 73 + view.a[4] / 1.75 * 73, y = 73 - view.a[5] / 1.75 * 73;
    orbit.ctx.onclick(x, y); orbit.ctx.ondrag(x + 5, y, 1); orbit.ctx.ondrag(x + 9, y, 0);
    const msgs = orbit.out.map(m => m[1]);
    assert.deepStrictEqual(msgs, ['grab', 'drag', 'release']);
    assert.strictEqual(orbit.out[0][2], 3);
    orbit.ctx.onclick(-50, -50); assert.strictEqual(orbit.out.length, 3, 'empty space grabs nothing');
  }
  assert.ok(ops.n > 1000);
});

test('built patches: wiring, face layering, no overlapping widgets, banks, frozen deps', () => {
  for (const name of ['Syzygy', 'Syzygy Audio']) {
    const p = JSON.parse(fs.readFileSync(path.join(DEV, name + '.maxpat'), 'utf8')).patcher;
    const boxes = p.boxes.map(b => b.box), byId = Object.fromEntries(boxes.map(b => [b.id, b]));
    const wired = (a, b) => p.lines.some(l => l.patchline.source[0] === a && l.patchline.destination[0] === b);
    assert.strictEqual(byId.panel.ignoreclick, 1); assert.strictEqual(byId.panel.background, 1);
    assert.strictEqual(boxes[boxes.length - 1].id, 'panel');
    const params = boxes.filter(b => b.parameter_enable === 1);
    const longs = params.map(b => b.saved_attribute_attributes.valueof.parameter_longname);
    assert.strictEqual(new Set(longs).size, longs.length, 'unique long names');
    for (const b of params) { assert.ok(wired(b.id, 'p-' + b.id) && wired('p-' + b.id, 'control'), b.id); assert.strictEqual(byId['p-' + b.id].text, 'prepend ' + b.id); }
    const actions = boxes.filter(b => b.maxclass === 'live.text' && !b.parameter_enable);
    assert.deepStrictEqual(actions.map(b => b.id).sort(), ['launch', 'strike1', 'strike2', 'strike3', 'strikeall']);
    for (const b of actions) {
      assert.strictEqual(b.mode, 1, `${b.id}: toggle mode so Live draws the lit state`);
      assert.ok(wired(b.id, 'msg-' + b.id) && byId['msg-' + b.id].text === 'action ' + b.id && wired('msg-' + b.id, 'control'), b.id);
    }
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
    const amxd = fs.readFileSync(path.join(DEV, name + '.amxd'));
    assert.strictEqual(amxd.slice(8, 12).toString(), name === 'Syzygy' ? 'iiii' : 'aaaa');
    for (const d of ['syzygy3.control.js', 'syzygy3.panel.js', 'syzygy3.orbit.js', 'syzygy3.theme.js']) assert.ok(amxd.includes(Buffer.from(d)), d);
    if (name === 'Syzygy Audio') {
      assert.ok(wired('input-audio', 'dsp') && p.parameters.input && !p.parameters.keys && !byId.notes);
    } else {
      assert.ok(byId.notes && p.parameters.keys && !p.parameters.input && !byId['input-audio']);
    }
  }
});
