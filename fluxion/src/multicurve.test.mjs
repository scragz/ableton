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

test('selector clicks and drags cross families, ALL updates both values, reset selects normal', () => {
  const {context: c, output, labels} = runtime();
  c.paint();
  const control = c.controls.find(item => item.id === 'multiCurve');
  const click = right => {
    const x = control.x + (right ? control.w - 5 : 5), y = control.y + 15;
    c.onclick(x, y, 1, 0, 0, 0, 0); c.ondrag(x, y, 0, 0, 0);
  };
  ['2.0', '2.1', '2.2', '3.0'].forEach(label => { click(true); assert.equal(c.CURVE_MODES[c.currentValue(control)].label, label); });
  click(false); assert.equal(c.CURVE_MODES[c.currentValue(control)].label, '2.2');
  const x = control.x + 20, y = control.y + 15;
  c.onclick(x, y, 1, 0, 0, 0, 0); c.ondrag(x, y - 200, 1, 0, 0); c.ondrag(x, y - 200, 0, 0, 0);
  assert.equal(c.CURVE_MODES[c.currentValue(control)].label, '8.8');
  assert.equal(c.state.steps[1].divisions, 1);
  c.state.all = true; output.length = 0; c.assign(control, 8);
  assert.equal(output.length, 1);
  c.state.steps.forEach(s => assert.equal(c.curveModeIndex(s), 8));
  c.paint(); assert.ok(labels.includes('Multi Curve'));
  c.ondblclick(x, y); c.state.steps.forEach(s => assert.equal(c.curveModeIndex(s), 0));
});

test('each mode reaches MIDI scheduling with bounded gates; edits cancel stale events', () => {
  const {context: c, output} = runtime('fluxion-engine.js');
  const state = plain(c.freshState());
  for (const mode of c.CURVE_MODES) {
    Object.assign(state.steps[0], {density: 64, divisions: mode.divisions, curveVariant: mode.variant, curve: 4, aux1: 'COPY'});
    output.length = 0; c.configure(JSON.stringify(state));
    assert.ok(output.some(e => e[0] === 1 && e[1] === 'bang'));
    const events = c.eventsFor(c.locate(0));
    const hits = c.generateHits(state.steps[0], c.seedFor(0, 0, 0));
    assert.equal(events.length, 256);
    events.forEach(e => assert.ok(e.at >= 0 && e.at <= 4));
    const ons = events.filter(e => e.bytes[0] === 144);
    hits.filter(h => h.lane === 0).forEach((h, i) => near(ons[i].at, h.at / 4));
    assert.equal(c.state.steps[0].curveVariant, mode.variant);
  }
});
