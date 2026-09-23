import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

function runtime(file = 'fluxion-ui.js', base = new URL('./', import.meta.url)) {
  const output = [], labels = [];
  const context = vm.createContext({
    outlet: (...args) => output.push(args), notifyclients() {},
    arrayfromargs: args => Array.from(args),
    error: message => { throw Error(message); },
    mgraphics: new Proxy({show_text: value => labels.push(String(value))}, {get: (o, k) => o[k] || (() => {})}),
  });
  context.include = name => vm.runInContext(fs.readFileSync(new URL(name, base), 'utf8'), context);
  context.include(file);
  return {context, output, labels};
}
const plain = value => JSON.parse(JSON.stringify(value));
function engine() {
  const context = vm.createContext({
    outlet() {}, post() {}, arrayfromargs: args => Array.from(args),
    error: message => { throw Error(message); },
  });
  context.include = name => vm.runInContext(fs.readFileSync(new URL(name, new URL('./', import.meta.url)), 'utf8'), context);
  context.include('fluxion-engine.js');
  return context;
}
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);

test('catalog grows from normal through 8.8, with distinct rhythmic choices', () => {
  const {context: c} = runtime();
  assert.equal(c.CURVE_MODES.length, 43);
  assert.equal(c.CURVE_MODES[0].label, '1');
  assert.equal(c.CURVE_MODES.at(-1).label, '8.8');
  for (let divisions = 2; divisions <= 8; divisions++) {
    const modes = c.CURVE_MODES.filter(m => m.divisions === divisions);
    assert.equal(modes.length, divisions + 1);
    const rhythms = modes.map(m => c.generateHits({...c.DEFAULT_STEP, divisions,
      curveVariant: m.variant, curve: 4, density: 64}).map(h => h.at.toFixed(8)).join(','));
    assert.equal(new Set(rhythms).size, modes.length);
  }
});

test('zero curve stays linear; bends are monotonic and pinned at every subgrid boundary', () => {
  const {context: c} = runtime();
  for (const mode of c.CURVE_MODES) {
    const step = {...c.DEFAULT_STEP, divisions: mode.divisions, curveVariant: mode.variant};
    for (let i = 0; i <= 256; i++) near(c.curvePosition(i / 256, step), i / 256);
    for (const curve of [-5, 5]) for (const differential of [-3, 0, 3]) {
      Object.assign(step, {curve, differential});
      let previous = -1;
      for (let i = 0; i <= 512; i++) {
        const at = c.curvePosition(i / 512, step);
        assert.ok(Number.isFinite(at) && at > previous && at >= 0 && at <= 1);
        previous = at;
      }
      for (let i = 0; i <= mode.divisions; i++) near(c.curvePosition(i / mode.divisions, step), i / mode.divisions);
    }
  }
});

test('musical patterns apply opposite directions and different strengths', () => {
  const {context: c} = runtime();
  const displacement = (variant, segment, curve = 4, divisions = 8) => {
    const x = (segment + 0.5) / divisions;
    return c.curvePosition(x, {...c.DEFAULT_STEP, divisions, curveVariant: variant, curve}) - x;
  };
  assert.ok(displacement(1, 0) < 0 && displacement(1, 1) > 0);
  near(displacement(1, 0), -displacement(1, 0, -4));
  assert.ok(Math.abs(displacement(2, 0)) < Math.abs(displacement(2, 7)));
  assert.ok(Math.abs(displacement(3, 0)) > Math.abs(displacement(3, 7)));
  assert.ok(Math.abs(displacement(4, 0)) > Math.abs(displacement(4, 1)));
  assert.ok(Math.abs(displacement(5, 0)) < Math.abs(displacement(5, 3)));
  assert.ok(Math.abs(displacement(6, 0)) > Math.abs(displacement(6, 3)));
  assert.ok(displacement(7, 0) < 0 && displacement(7, 7) > 0);
  assert.deepEqual(Array.from({length: 8}, (_, i) => Math.sign(displacement(8, i))), [-1, 1, 1, -1, 1, 1, -1, 1]);
});

test('legacy states select repeated curves; variants are bounded and survive recall', () => {
  const {context: c} = runtime();
  const state = plain(c.freshState());
  state.steps.forEach((s, i) => { s.divisions = i % 8 + 1; delete s.curveVariant; });
  let recalled = c.normalizeState(state);
  recalled.steps.forEach(s => assert.equal(s.curveVariant, 0));
  state.steps[0].curveVariant = 8;
  state.steps[1].curveVariant = 99;
  state.steps[2].curveVariant = -3;
  state.steps[3].curveVariant = 'invalid';
  recalled = c.normalizeState(state);
  assert.deepEqual(plain(recalled.steps.slice(0, 4).map(s => s.curveVariant)), [0, 2, 0, 0]);
  for (const mode of c.CURVE_MODES) {
    Object.assign(state.steps[0], {divisions: mode.divisions, curveVariant: mode.variant});
    const restored = c.decodeState(c.encodeState(state));
    assert.equal(c.CURVE_MODES[c.curveModeIndex(restored.steps[0])].label, mode.label);
  }
});

test('the curve-mode parameter walks the catalog and clamps', () => {
  // Multi Curve is a native live.menu per step now, so what still has to be right
  // is the mapping from its index onto divisions and variant.
  const {context: c, labels} = runtime();
  c.paint();
  assert.ok(labels.includes('Multi Curve'));
  const eng = engine();
  const index = label => c.CURVE_MODES.findIndex(m => m.label === label);
  for (const label of ['2.0', '2.1', '2.2', '3.0', '8.8']) {
    eng.step(0, 'curvemode', index(label));
    assert.equal(c.CURVE_MODES[c.curveModeIndex(eng.state.steps[0])].label, label);
  }
  assert.equal(eng.state.steps[1].divisions, 1, 'only the addressed step moved');
  eng.step(0, 'curvemode', 999);
  assert.equal(c.curveModeIndex(eng.state.steps[0]), c.CURVE_MODES.length - 1);
  eng.step(0, 'curvemode', -5);
  assert.equal(c.curveModeIndex(eng.state.steps[0]), 0);
});

test('each mode reaches MIDI scheduling with bounded gates, straight from parameters', () => {
  const c = engine();
  for (const mode of c.CURVE_MODES) {
    const index = c.CURVE_MODES.indexOf(mode);
    c.step(0, 'density', 64);
    c.step(0, 'curvemode', index);
    c.step(0, 'curve', 4);
    c.step(0, 'aux1', c.AUX_MODES.indexOf('COPY'));
    assert.equal(c.state.steps[0].curveVariant, mode.variant);
    assert.equal(c.state.steps[0].divisions, mode.divisions);
    const events = c.eventsFor(c.locate(0));
    const hits = c.generateHits(c.state.steps[0], c.seedFor(0, 0, 0));
    assert.equal(events.length, 256);
    events.forEach(e => assert.ok(e.at >= 0 && e.at <= 4));
    const ons = events.filter(e => e.bytes[0] === 144);
    hits.filter(h => h.lane === 0).forEach((h, i) => near(ons[i].at, h.at / 4));
  }
});
