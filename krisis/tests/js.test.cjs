// node --test tests/js.test.cjs  -- runs the Max JS (control, routing, panel) against stubs and checks the
// frozen device. Build first. Not a substitute for loading the device in Live.
const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const { run } = require('./harness.cjs');
const DEV = path.join(__dirname, '../device');
const patch = () => JSON.parse(fs.readFileSync(path.join(DEV, 'Krisis.maxpat'), 'utf8')).patcher;

function load(file, extra) {
  const calls = [], ctx = Object.assign({
    outlet: (o, ...a) => calls.push([o, ...a]), post: () => {}, messagename: '', error: () => {},
    Task: function (fn) { this.fn = fn; this.schedule = () => { this.fn(); }; this.cancel = () => {}; },
  }, extra);
  ctx.include = (n) => vm.runInContext(fs.readFileSync(path.join(DEV, n), 'utf8'), ctx);
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(DEV, file), 'utf8'), ctx);
  return { ctx, calls };
}
function send(ctx, name, ...args) { ctx.messagename = name; if (typeof ctx[name] === 'function' && name !== 'anything') ctx[name](...args); else ctx.anything(...args); }
function stubPatcher() {
  const attrs = {};
  return { attrs, patcher: { getnamed: (n) => ({ message: (m, v) => { (attrs[n] = attrs[n] || {})[m] = v; } }) } };
}

test('device JS is ES5 (legacy js / jsui)', () => {
  const bad = [/=>/, /\blet\s/, /\bconst\s/, /`/, /\.includes\(/, /Array\.from/, /Object\.assign/, /[^s]\.fill\(/, /new (Map|Set)\b/,
    /\.startsWith\(/, /\.endsWith\(/, /\bclass\s+\w/, /\.padStart\(/, /\.find\(/];
  for (const f of ['krisis.control.js', 'krisis.routing.js', 'krisis.panel.js', 'krisis.theme.js']) {
    const src = fs.readFileSync(path.join(DEV, f), 'utf8').replace(/\/\/[^\n]*/g, '').replace(/'[^'\n]*'/g, "''");
    for (const re of bad) assert.ok(!re.test(src), `${f}: ${re}`);
  }
});

test('control: init sends every gen~ param inside its declared range, and every Live parameter is handled', () => {
  const { attrs, patcher } = stubPatcher();
  const { ctx, calls } = load('krisis.control.js', { patcher });
  ctx.init();
  const ranges = {};
  fs.readFileSync(path.join(DEV, 'krisis.genexpr'), 'utf8').replace(/^Param (\w+)\(([-\d.e]+), min=([-\d.e]+), max=([-\d.e]+)\)/gm, (_, n, d, lo, hi) => { ranges[n] = [+lo, +hi]; });
  const sent = calls.filter(c => c[0] === 0);
  const names = new Set(sent.map(c => c[1]));
  for (const n of Object.keys(ranges)) assert.ok(names.has(n), `never sent ${n}`);
  for (const [, n, v] of sent) { assert.ok(ranges[n], `unknown gen param ${n}`); assert.ok(v >= ranges[n][0] && v <= ranges[n][1], `${n}=${v} outside ${ranges[n]}`); }
  // every parameter's extremes stay in range too
  const P = patch().boxes.map(b => b.box).filter(b => b.parameter_enable);
  for (const b of P) {
    const v = b.saved_attribute_attributes.valueof;
    for (const x of [v.parameter_mmin, v.parameter_mmax]) {
      calls.length = 0; send(ctx, b.varname, x);
      for (const [o, n, val] of calls) if (o === 0) assert.ok(val >= ranges[n][0] && val <= ranges[n][1], `${b.varname}=${x} -> ${n}=${val}`);
      if (!['page'].includes(b.varname)) assert.ok(calls.some(c => c[0] === 0) || b.varname === 'creset' && x === 0, `${b.varname} sends nothing to gen~`);
    }
  }
  assert.ok(Object.keys(attrs).length > 50, 'refresh reached the widgets');
});

test('control: Detail pages and mode swaps hide the right widgets', () => {
  const { attrs, patcher } = stubPatcher();
  const { ctx } = load('krisis.control.js', { patcher });
  ctx.init();
  const hidden = (k) => attrs[k] && attrs[k].hidden === 1;
  assert.ok(!hidden('tunea') && hidden('mab') && hidden('tgtx') && hidden('esens'));
  send(ctx, 'page', 1); assert.ok(hidden('tunea') && !hidden('mab'));
  send(ctx, 'page', 3); assert.ok(!hidden('esens') && hidden('mab'));
  assert.ok(!hidden('freq') && hidden('treadle'));
  send(ctx, 'wah', 1); assert.ok(hidden('freq') && !hidden('treadle'));
  assert.ok(attrs.spread.active === 0 && attrs.mass.active === 1);
  send(ctx, 'smode', 2); assert.ok(!hidden('hset') && hidden('sseed'));
  send(ctx, 'smode', 4); assert.ok(hidden('hset') && !hidden('sseed'));
  send(ctx, 'attr', 1); assert.ok(hidden('entropy') && !hidden('alpha') && !hidden('beta'));
  send(ctx, 'tsrc', 3); assert.ok(attrs.lrate.active === 1 && attrs.esens.active === 0);
  send(ctx, 'lsync', 2); assert.ok(attrs.lrate.active === 0);
  send(ctx, 'topo', 3); assert.ok(attrs.mab.active === 1 && attrs.cross.active === 0);
});

test('control: Reset counts presses, Scatter seeds are deterministic, Quality and Sync map', () => {
  const { patcher } = stubPatcher();
  const { ctx, calls } = load('krisis.control.js', { patcher });
  const last = (n) => { const c = calls.filter(x => x[1] === n); return c.length ? c[c.length - 1][2] : undefined; };
  send(ctx, 'creset', 1); send(ctx, 'creset', 0); send(ctx, 'creset', 1);
  assert.strictEqual(last('p_creset'), 2);
  send(ctx, 'sseed', 7); const a = [last('p_sca'), last('p_scb'), last('p_scc')];
  send(ctx, 'sseed', 8); send(ctx, 'sseed', 7);
  assert.deepStrictEqual([last('p_sca'), last('p_scb'), last('p_scc')], a);
  assert.ok(a.every(x => Math.abs(x) <= 1.5) && new Set(a).size === 3);
  send(ctx, 'quality', 2); assert.strictEqual(last('p_os'), 8);
  send(ctx, 'lsync', 5); assert.strictEqual(last('p_lbeats'), 4);
  send(ctx, 'range', 1); assert.strictEqual(last('p_wmin'), 450); assert.strictEqual(last('p_wmax'), 1600);
  send(ctx, 'range', 2); send(ctx, 'wmin', 300); send(ctx, 'wmax', 3000); assert.strictEqual(last('p_wmax'), 3000);
});

test('no two visible widgets overlap, in any page / mode combination, and all sit inside the device', () => {
  const p = patch(), W = p.devicewidth;
  const boxes = p.boxes.map(b => b.box).filter(b => b.presentation && b.varname && b.maxclass !== 'jsui');
  for (const page of [0, 1, 2, 3]) for (const wah of [0, 1]) for (const smode of [0, 2, 4]) for (const attr of [0, 1]) {
    const { patcher } = stubPatcher();
    const { ctx } = load('krisis.control.js', { patcher });
    send(ctx, 'page', page); send(ctx, 'wah', wah); send(ctx, 'smode', smode); send(ctx, 'attr', attr);
    const vis = boxes.filter(b => !ctx.CONTROLS[b.varname] || ctx.visible(b.varname)).map(b => [b.varname, ...b.presentation_rect]);
    for (const [n, x, y, w, h] of vis) assert.ok(x >= 0 && y >= 0 && x + w <= W && y + h <= 169, `${n} outside`);
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
      const a = vis[i], c = vis[j];
      const hit = a[1] < c[1] + c[3] && c[1] < a[1] + a[3] && a[2] < c[2] + c[4] && c[2] < a[2] + a[4];
      assert.ok(!hit, `${a[0]} overlaps ${c[0]} (page ${page} wah ${wah} smode ${smode} attr ${attr})`);
    }
  }
});

test('routing: lists Live routing types per pair and sets the chosen one', () => {
  const sets = [];
  function LiveAPI(cb, p) { this.path = p; this.cb = cb; }
  LiveAPI.prototype.get = function (prop) {
    const pair = +this.path.split(' ').pop();
    if (prop === 'available_routing_types') return [JSON.stringify({ available_routing_types: [
      { display_name: '1-Kick', identifier: 10 }, { display_name: '2-Bass', identifier: 11 }, { display_name: 'No Input', identifier: 99 }] })];
    if (prop === 'routing_type') return JSON.stringify({ routing_type: { display_name: pair === 1 ? '2-Bass' : 'No Input', identifier: pair === 1 ? 11 : 99 } });
  };
  LiveAPI.prototype.set = function (prop, v) { sets.push([this.path, prop, v]); };
  const { ctx, calls } = load('krisis.routing.js', { LiveAPI });
  ctx.init();
  const toB = calls.filter(c => c[0] === 0), toC = calls.filter(c => c[0] === 1);
  assert.deepStrictEqual(toB.filter(c => c[1] === 'append').map(c => c[2]), ['B: 1-Kick', 'B: 2-Bass', 'B: No Input']);
  assert.deepStrictEqual(toB[toB.length - 1], [0, 'set', 1]);
  assert.deepStrictEqual(toC[toC.length - 1], [1, 'set', 2]);
  send(ctx, 'selectc', 0);
  assert.strictEqual(JSON.stringify(sets[0]), JSON.stringify(['this_device audio_inputs 2', 'routing_type', { display_name: '1-Kick', identifier: 10 }]));
  // outside Live: no API, the menus still show something
  const off = load('krisis.routing.js', { LiveAPI: function () { throw new Error('no live'); } });
  off.ctx.init();
  assert.ok(off.calls.some(c => c[0] === 0 && c[1] === 'append' && c[2] === 'B: No Input'));
});

test('panel paints every page and mode from a real view buffer without throwing', () => {
  const ops = { n: 0 }, mg = new Proxy({}, { get: (t, k) => k === 'text_measure' ? () => [20, 9] : () => { ops.n++; } });
  for (const p of [{}, { p_attr: 1, p_wah: 1 }, { p_stereo: 1, p_attr: 1 }, { p_wah: 2, p_smode: 3 }]) {
    const view = run(Object.assign({ p_os: 2, p_crate: 10 }, p), 0.4).view;
    const { ctx } = load('krisis.panel.js', { mgraphics: mg, max: { getcolor: () => [0.5, 0.5, 0.5, 1] },
      Buffer: function () { this.peek = (c, s, n) => Array.from(view.a.slice(s, s + n)); } });
    send(ctx, 'viewbuffer', 'x');
    for (const [k, v] of Object.entries({ attr: p.p_attr || 0, wah: p.p_wah || 0, stereo: p.p_stereo || 0, smode: p.p_smode || 0 })) send(ctx, 'param', k, v);
    for (let page = 0; page < 4; page++) {
      send(ctx, 'param', 'page', page);
      for (let i = 0; i < 4; i++) { send(ctx, 'tick'); ctx.paint(); }
    }
  }
  assert.ok(ops.n > 2000);
});

test('frozen amxd embeds the patch and every dependency; banks name real parameters', () => {
  const b = fs.readFileSync(path.join(DEV, 'Krisis.amxd'));
  assert.strictEqual(b.toString('ascii', 0, 4), 'ampf');
  assert.strictEqual(b.toString('ascii', 8, 12), 'aaaa');
  for (const n of ['Krisis.amxd', 'krisis.control.js', 'krisis.routing.js', 'krisis.panel.js', 'krisis.theme.js']) assert.ok(b.includes(Buffer.from(n + '\0')), n);
  const p = patch();
  const params = p.boxes.map(x => x.box).filter(x => x.parameter_enable).map(x => x.varname);
  assert.ok(params.length >= 90, `parameters ${params.length}`);
  for (const bank of Object.values(p.parameters.parameterbanks)) for (const n of bank.parameters) assert.ok(n === '-' || params.includes(n), `bank ${bank.name}: ${n}`);
  const longnames = p.boxes.map(x => x.box).filter(x => x.parameter_enable).map(x => x.saved_attribute_attributes.valueof.parameter_longname);
  assert.strictEqual(new Set(longnames).size, longnames.length, 'long names unique');
  const gen = p.boxes.map(x => x.box).find(x => x.varname === 'dsp');
  assert.strictEqual(gen.numinlets, 7);
  assert.ok(p.boxes.some(x => x.box.text === 'plugin~ 1 2 3 4 5 6'));
});
