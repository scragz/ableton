import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

// Same harness shape as multicurve.test.mjs: run the real Max scripts, stub the
// host. `notifies` matters here -- modulation must never mark the Live set dirty.
function runtime(file = 'fluxion-ui.js', base = new URL('./', import.meta.url)) {
  const output = [], counts = {notify: 0};
  const context = vm.createContext({
    outlet: (...args) => output.push(args), notifyclients: () => { counts.notify++; },
    arrayfromargs: args => Array.from(args), post() {},
    error: message => { throw Error(message); },
    mgraphics: new Proxy({}, {get: (o, k) => o[k] || (() => {})}),
  });
  context.include = name => vm.runInContext(fs.readFileSync(new URL(name, base), 'utf8'), context);
  context.include(file);
  return {context, output, counts};
}
function engine() {
  const output = [];
  const context = vm.createContext({
    outlet: (...args) => output.push(args), post() {},
    arrayfromargs: args => Array.from(args), error: message => { throw Error(message); },
  });
  context.include = name => vm.runInContext(fs.readFileSync(new URL(name, new URL('./', import.meta.url)), 'utf8'), context);
  context.include('fluxion-engine.js');
  return {context, output};
}
const patch = JSON.parse(fs.readFileSync(new URL('../device/Fluxion.maxpat', import.meta.url), 'utf8')).patcher;

test('neutral modulation is a no-op that allocates nothing', () => {
  const {context: c} = runtime();
  const step = {...c.DEFAULT_STEP};
  assert.ok(c.modsAreNeutral(c.freshMods()));
  assert.equal(c.applyMods(step, c.freshMods(), 0), step);
  assert.equal(c.applyMods(step, null, 0), step);
  // A slot with a target but no amount, or an amount but no target, is still neutral.
  const armed = c.freshMods();
  armed.slots[0].target = 2;
  assert.equal(c.applyMods(step, armed, 0), step);
});

test('global offsets add, gate scales, and every result stays inside the field range', () => {
  const {context: c} = runtime();
  const step = {...c.DEFAULT_STEP, density: 4, gate: 30, probability: 80};
  const mods = c.freshMods();
  mods.globals.density = 5;
  mods.globals.gate = 200;
  mods.globals.probability = 40;
  const out = c.applyMods(step, mods, 0);
  assert.equal(out.density, 9);
  assert.equal(out.gate, 60);          // scale: 30 * 200%
  assert.equal(out.probability, 100);  // 80 + 40, clamped at the field maximum
  assert.deepEqual(step, {...c.DEFAULT_STEP, density: 4, gate: 30, probability: 80});
  for (const [key, , lo, hi] of c.STEP_FIELDS) {
    const g = c.globalModSpec(key);
    if (!g) continue;
    for (const extreme of [g[2], g[3]]) {
      const m = c.freshMods();
      m.globals[key] = extreme;
      const v = c.applyMods(step, m, 0)[key];
      assert.ok(v >= lo && v <= hi, `${key} ${extreme} -> ${v} outside ${lo}..${hi}`);
    }
  }
});

test('slot amount is a percentage of the target field range, and slots accumulate', () => {
  const {context: c} = runtime();
  const step = {...c.DEFAULT_STEP, curve: 0, density: 4};
  const curveTarget = c.MOD_TARGET_KEYS.indexOf('curve') + 1;
  const densityTarget = c.MOD_TARGET_KEYS.indexOf('density') + 1;
  const mods = c.freshMods();
  mods.slots[0] = {target: curveTarget, amount: 25, step: 0};   // 25% of -5..5 = +2.5
  assert.equal(c.applyMods(step, mods, 0).curve, 2.5);
  mods.slots[1] = {target: densityTarget, amount: 10, step: 0}; // 10% of 0..64 = +6.4 -> 6
  mods.slots[2] = {target: densityTarget, amount: 10, step: 0};
  const out = c.applyMods(step, mods, 0);
  assert.equal(out.curve, 2.5);
  assert.equal(out.density, 4 + 6 + 6);
  mods.slots[0].amount = -100;
  assert.equal(c.applyMods(step, mods, 0).curve, -5); // clamped, not wrapped
});

test('a slot scoped to one step leaves the others alone', () => {
  const {context: c} = runtime();
  const step = {...c.DEFAULT_STEP, density: 4};
  const mods = c.freshMods();
  mods.slots[0] = {target: c.MOD_TARGET_KEYS.indexOf('density') + 1, amount: 25, step: 3};
  assert.equal(c.applyMods(step, mods, 2).density, 20); // step 3 is index 2
  assert.equal(c.applyMods(step, mods, 0), step);
  assert.equal(c.applyMods(step, mods, 15), step);
  mods.slots[0].step = 0;
  for (let i = 0; i < 16; i++) assert.equal(c.applyMods(step, mods, i).density, 20);
});

test('step length is not modulatable, so loop geometry cannot drift from playback', () => {
  const {context: c} = runtime();
  assert.ok(!c.MOD_TARGET_KEYS.includes('length'));
  assert.ok(!c.MOD_TARGETS.includes('Length /16'));
  assert.equal(c.globalModSpec('length'), null);
  assert.equal(c.MOD_TARGETS.length, c.MOD_TARGET_KEYS.length + 1);
  assert.equal(c.MOD_TARGETS[0], 'Off');
  const step = {...c.DEFAULT_STEP};
  for (let target = 1; target < c.MOD_TARGETS.length; target++) {
    const mods = c.freshMods();
    mods.slots[0] = {target, amount: 100, step: 0};
    assert.equal(c.applyMods(step, mods, 0).length, step.length);
  }
});

test('a modulated division count never strands the stored curve variant', () => {
  const {context: c} = runtime();
  const mods = c.freshMods();
  mods.slots[0] = {target: c.MOD_TARGET_KEYS.indexOf('divisions') + 1, amount: -100, step: 0};
  const step = {...c.DEFAULT_STEP, divisions: 8, curveVariant: 8};
  const out = c.applyMods(step, mods, 0);
  assert.equal(out.divisions, 1);
  assert.equal(out.curveVariant, 0);
  assert.equal(c.curveModeIndex(out), 0);
  assert.ok(c.generateHits(out, 1).every(h => Number.isFinite(h.at)));
});

test('the engine mirrors modulation without touching the stored step values', () => {
  const {context: c} = engine();
  const before = JSON.stringify(c.state.steps);
  for (const [key, , , , , neutral] of c.GLOBAL_MODS) c.gmod(key, neutral + 1);
  for (let i = 0; i < c.MOD_SLOTS; i++) c.mslot(i, 'target', 2);
  c.gmod('nonsense', 5);
  c.mslot(99, 'amount', 5);
  assert.equal(JSON.stringify(c.state.steps), before, 'modulation must never write into the pattern');
  for (const [key, , , , , neutral] of c.GLOBAL_MODS) assert.equal(c.mods.globals[key], neutral + 1);
});

test('a parameter move drops only that step\'s plan, and never cancels the pipe', () => {
  const {context: c, output} = engine();
  c.cache = {'0:0': [1], '1:0': [1], '0:4': [1]};
  c.gmod('density', 3);
  c.mslot(0, 'amount', 40);
  assert.deepEqual(Object.keys(c.cache).sort(), ['0:0', '0:4', '1:0']);
  assert.equal(output.length, 0, 'continuous modulation must not cancel the scheduler');
  c.step(0, 'density', 9);
  assert.deepEqual(Object.keys(c.cache), ['0:4'], 'only step 1 is replanned');
  assert.equal(c.state.steps[0].density, 9);
  assert.equal(output.length, 0, 'an automated parameter must not drop notes already in the pipe');
  c.mslot(0, 'target', 2);
  assert.equal(Object.keys(c.cache).length, 0, 'retargeting a slot is configuration');
});

test('the engine understands every per-step parameter the face exposes', () => {
  const {context: c} = engine();
  c.step(2, 'curvemode', 5);
  const mode = c.CURVE_MODES[5];
  assert.equal(c.state.steps[2].divisions, mode.divisions);
  assert.equal(c.state.steps[2].curveVariant, mode.variant);
  c.step(2, 'probmode', 1);
  assert.equal(c.state.steps[2].probabilityMode, 'Step');
  c.step(2, 'aux1', c.AUX_MODES.indexOf('DEL 3'));
  assert.equal(c.state.steps[2].aux1, 'DEL 3');
  c.step(2, 'enabled', 1);
  assert.equal(c.state.steps[2].enabled, false);
  c.step(2, 'maskshift', 99);
  assert.equal(c.state.steps[2].maskShift, 15, 'out of range values clamp to the field');
  c.step(99, 'density', 1);
  c.step(2, 'nonsense', 1);
  assert.equal(c.state.steps[2].density, c.DEFAULT_STEP.density);
});

test('globals reach the engine, and loop ends cannot cross', () => {
  const {context: c} = engine();
  c.set('loopend', 6);
  assert.equal(c.state.loopEnd, 5);
  c.set('loopstart', 9);
  assert.equal(c.state.loopStart, 8);
  assert.equal(c.state.loopEnd, 8);
  c.set('input', 1);
  assert.equal(c.state.input, 'LATCH');
  c.set('ch', 0, 7);
  assert.equal(c.state.channels[0], 7);
  c.set('note', 2, 60);
  assert.equal(c.state.notes[2], 60);
  c.set('selected', 4);
  assert.equal(c.state.selected, 3);
});

test('every modulation parameter is exposed to Live and reaches the engine', () => {
  const {context: c} = runtime();
  const boxes = patch.boxes.map(b => b.box);
  const byId = Object.fromEntries(boxes.map(b => [b.id, b]));
  const mod = boxes.filter(b => /^(g_|m\d_)/.test(b.id));
  assert.equal(mod.length, c.GLOBAL_MODS.length + c.MOD_SLOTS * c.MOD_FIELDS.length);
  for (const b of mod) {
    const v = b.saved_attribute_attributes.valueof;
    assert.equal(b.parameter_enable, 1);
    assert.equal(v.parameter_invisible, undefined, 'modulation targets must be mappable');
    assert.ok(v.parameter_mmin < v.parameter_mmax);
    assert.ok(patch.lines.some(l => l.patchline.source[0] === 're_' + b.id
      && l.patchline.destination[0] === 'engine'), `${b.id} does not reach the engine`);
  }
  assert.deepEqual([...byId.m0_target.items], [...c.MOD_TARGETS]);
});
