import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { prelude } from '../../theme/theme.mjs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const hereSrc = path.join(here, '../src');
const hereDevice = path.join(here, '../device');
// The adjacent ES5 rhythm engine is maintained with this device.
// Do not overwrite device-specific curves from a sibling web checkout.
// Runtime scripts embedded in the frozen device (tests and preview stay out).
const RUNTIME = ['fluxion-ui.js', 'fluxion-theme.js', 'fluxion-engine.js', 'fluxion-voice.js', 'fluxion-rhythm.js', 'fluxion-state.js', 'fluxion-control.js', 'fluxion-hit.js'];
// The theme prelude is generated from theme/theme.json into src/ so Max finds it on the same search path.
writeFileSync(path.join(hereSrc, 'fluxion-theme.js'), prelude('fluxion'));

const boxes = [];
const lines = [];
function object(id, text, x, y, inlets = 1, outlets = 1, extra = {}) {
  boxes.push({ box: { id, maxclass: 'newobj', text, numinlets: inlets,
    numoutlets: outlets, patching_rect: [x, y, Math.max(65, text.length * 6.4), 22], ...extra }});
}
function wire(src, out, dst, input, order) {
  lines.push({ patchline: { source: [src, out], destination: [dst, input],
    ...(order === undefined ? {} : { order }) }});
}
function comment(id, text, x, y, w = 430) {
  boxes.push({ box: { id, maxclass: 'comment', text, numinlets: 1,
    numoutlets: 0, patching_rect: [x, y, w, 40] }});
}

boxes.push({ box: { id: 'editor', maxclass: 'jsui', filename: 'fluxion-ui.js',
  jsarguments: [], numinlets: 1, numoutlets: 1, outlettype: [''],
  varname: 'fluxion_editor', border: 0, parameter_enable: 0,
  // Every full-face jsui in this workspace is ignoreclick + background: without it
  // the panel sits over the native widgets and swallows all of their clicks.
  ignoreclick: 1, background: 1,
  patching_rect: [15, 15, 1100, 169], presentation: 1,
  presentation_rect: [0, 0, 1100, 169] }});
// Match Max's own saved layout for a Blob pattr. With parameter mode enabled only
// through "@parameter_enable 1" in the object text, the saved Blob type was ignored:
// Live treated the parameter as a number ("bad number") and recalled 0.
object('engine', 'js fluxion-engine.js', 15, 285, 1, 3);

// ---------------------------------------------------------------------------
// Every value in this device is a real Live parameter. There is no pattr blob any
// more: Live stores parameters, so the parameter set IS the device state. That
// also retires the blob-versus-parameter recall race the previous build had to
// guard against with a load gate.
//
// Per-step values are BANKED: each of the 16 steps owns a full set of parameters
// and only the selected bank is visible. Banking is what makes them mappable at
// all -- Live's modulators map by clicking a control, so a parameter with no
// visible widget cannot be reached. Select the step, click the field, and the
// mapping sticks to that step because every bank is a distinct parameter.
const specs = vm.createContext({});
for (const name of ['fluxion-rhythm.js', 'fluxion-state.js'])
  vm.runInContext(readFileSync(path.join(hereSrc, name), 'utf8'), specs);
const { GLOBAL_MODS, MOD_SLOTS, MOD_TARGETS, CURVE_MODES, AUX_MODES, INPUT_MODES,
        STEP_FIELDS, DEFAULT_STEP } = specs;
const SPEC = Object.fromEntries(STEP_FIELDS.map(f => [f[0], f]));
const CURVE_LABELS = CURVE_MODES.map(m => m.label);
const ONOFF = ['Off', 'On'];

object('control', 'js fluxion-control.js', 15, 250, 1, 2);
wire('editor', 0, 'control', 0);   // mouse events from the face
wire('control', 1, 'editor', 0);   // draw mirror back to the face
wire('engine', 2, 'editor', 0);    // playhead

const parameterEntries = {};
const banks = [];
const modRoster = [];
let stash = 0;

// The step row and the curve graph still need the mouse; the face jsui is
// ignoreclick so it cannot swallow clicks meant for the widgets on top of it.
[['hit_steps', 2, 15, 428, 28, false], ['hit_curve', 2, 47, 250, 121, true]].forEach(
  ([id, x, y, w, h, editOnly]) => {
    boxes.push({ box: { id, maxclass: 'jsui', filename: 'fluxion-hit.js', varname: id,
      jsarguments: ['fluxion-hit.js', x, y], border: 0, parameter_enable: 0,
      numinlets: 1, numoutlets: 1, outlettype: [''],
      patching_rect: [15 + x, 700 + y, w, h], presentation: 1, presentation_rect: [x, y, w, h] }});
    if (editOnly) modRoster.push(id); // hidden when the mod page takes the lower row
    wire(id, 0, 'editor', 0);
  });

// unitstyle: 0 plain, 5 percent, 9 enum. type: 0 float, 1 int, 2 enum.
function widget(id, longname, shortname, rect, opts = {}) {
  const items = opts.enum;
  const cls = opts.button ? 'live.text' : items ? 'live.menu' : 'live.numbox';
  const valueof = {
    parameter_longname: longname, parameter_shortname: shortname,
    parameter_type: items ? 2 : opts.float ? 0 : 1,
    parameter_mmin: opts.lo === undefined ? 0 : opts.lo,
    parameter_mmax: opts.hi === undefined ? (items ? items.length - 1 : 1) : opts.hi,
    parameter_unitstyle: items ? 9 : opts.unitstyle || 0,
    parameter_initial_enable: opts.initial === undefined ? 0 : 1,
    parameter_linknames: 1,
  };
  if (opts.initial !== undefined) valueof.parameter_initial = [opts.initial];
  // Stored Only: kept in the set, kept out of the automation list. Used for the
  // things that are interface state rather than sound.
  if (opts.ui) valueof.parameter_invisible = 1;
  if (items) valueof.parameter_enum = items;
  parameterEntries[id] = [longname, shortname, 0];
  boxes.push({ box: { id, maxclass: cls, varname: id, parameter_enable: 1,
    saved_attribute_attributes: { valueof },
    ...(cls === 'live.menu' ? { items } : {}),
    ...(opts.button ? { mode: 1, text: opts.button, texton: opts.button } : {}),
    ...(opts.offstage ? { hidden: 1, presentation: 0 }
                      : { presentation: 1, presentation_rect: rect }),
    ...(opts.hidden ? { hidden: 1 } : {}),
    numinlets: 1, numoutlets: cls === 'live.menu' ? 3 : 2,
    fontname: 'Ableton Sans Medium', fontsize: 9,
    patching_rect: [1200 + (stash % 8) * 150, 200 + Math.floor(stash / 8) * 28, rect[2], rect[3]] }});
  stash++;
  return id;
}
function relay(id, prefix, dest) {
  const box = 'r' + (dest === 'engine' ? 'e' : 'c') + '_' + id;
  object(box, 'prepend ' + prefix, 1200 + (stash % 8) * 150, 214 + Math.floor(stash / 8) * 28);
  wire(id, 0, box, 0);
  wire(box, 0, dest, 0);
}

// --- the 16 per-step banks --------------------------------------------------
// [widget key, STEP_FIELDS key or null, short label, slot]
const SLOT = {
  density: [350, 66, 72], length: [350, 85, 72], curvemode: [350, 104, 72],
  curve: [350, 123, 72], differential: [350, 142, 72],
  phase: [520, 66, 66], compress: [520, 85, 66], humanize: [520, 104, 66], gate: [520, 123, 66],
  probability: [688, 66, 72], probmode: [688, 85, 72], maskcount: [688, 104, 72],
  mask: [688, 123, 72], maskshift: [688, 142, 72],
  aux1: [824, 104, 76], aux2: [824, 123, 76], enabled: [472, 20, 62],
};
const STEP_PARAMS = [
  ['density', 'density', 'Density', {}],
  ['length', 'length', 'Length', {}],
  ['curvemode', null, 'Multi Curve', { enum: CURVE_LABELS, initialFrom: s => CURVE_MODES.findIndex(m => m.divisions === s.divisions && m.variant === (s.curveVariant || 0)) }],
  ['curve', 'curve', 'Curve', {}],
  ['differential', 'differential', 'Diff', {}],
  ['phase', 'phase', 'Phase', {}],
  ['compress', 'compress', 'Compress', {}],
  ['humanize', 'humanize', 'Humanize', {}],
  ['gate', 'gate', 'Gate', {}],
  ['probability', 'probability', 'Chance', {}],
  ['probmode', null, 'Prob Mode', { enum: ['Trigger', 'Step'], initialFrom: s => s.probabilityMode === 'Step' ? 1 : 0 }],
  ['maskcount', 'maskCount', 'Mask Mute', {}],
  ['mask', 'mask', 'Mask Every', {}],
  ['maskshift', 'maskShift', 'Mask Shift', {}],
  ['aux1', null, 'Aux 1', { enum: AUX_MODES, initialFrom: s => Math.max(0, AUX_MODES.indexOf(s.aux1)) }],
  ['aux2', null, 'Aux 2', { enum: AUX_MODES, initialFrom: s => Math.max(0, AUX_MODES.indexOf(s.aux2)) }],
  ['enabled', null, 'Step Off', { enum: ONOFF, button: 'Step Off', initialFrom: () => 0 }],
];
for (let bank = 0; bank < 16; bank++) {
  const roster = [];
  for (const [key, field, label, opts] of STEP_PARAMS) {
    const id = `s${bank}_${key}`;
    const spec = field ? SPEC[field] : null;
    const rect = [SLOT[key][0], SLOT[key][1], SLOT[key][2], 18];
    widget(id, `Step ${bank + 1} ${label}`, `S${bank + 1} ${label}`, rect, {
      ...opts,
      lo: spec ? spec[2] : opts.lo, hi: spec ? spec[3] : opts.hi,
      float: spec ? spec[4] < 1 : false,
      initial: spec ? DEFAULT_STEP[field] : opts.initialFrom(DEFAULT_STEP),
      hidden: bank !== 0, // only the selected bank is on screen
    });
    relay(id, `step ${bank} ${key}`, 'engine');
    relay(id, `bank ${bank} ${key}`, 'control');
    roster.push(id);
  }
  banks.push(roster);
}

// --- globals ----------------------------------------------------------------
const GLOBALS = [
  ['w_loopstart', 'Loop First', 'First', [680, 20, 34, 18], { lo: 1, hi: 16, initial: 1 }, 'loopstart'],
  ['w_loopend', 'Loop Last', 'Last', [746, 20, 34, 18], { lo: 1, hi: 16, initial: 1 }, 'loopend'],
  ['w_input', 'Note In', 'Note In', [846, 20, 90, 18], { enum: INPUT_MODES, initial: 0 }, 'input'],
  ['w_mute', 'Mute', 'Mute', [538, 20, 44, 18], { enum: ONOFF, button: 'Mute', initial: 0 }, 'mute'],
  ['w_panic', 'Panic', 'Panic', [586, 20, 46, 18], { enum: ONOFF, button: 'Panic', ui: 1 }, 'panic'],
  ['w_all', 'All Steps', 'All', [432, 20, 36, 18], { enum: ONOFF, button: 'All', ui: 1, initial: 0 }, null],
  ['w_page', 'Mod Page', 'Mod', [944, 20, 40, 18], { enum: ONOFF, button: 'Mod', ui: 1, initial: 0 }, null],
  ['w_selected', 'Selected Step', 'Step', [0, 0, 40, 18], { lo: 1, hi: 16, initial: 1, ui: 1, offstage: 1 }, 'selected'],
];
for (const [id, longname, short, rect, opts, engineKey] of GLOBALS) {
  widget(id, longname, short, rect, opts);
  if (engineKey) relay(id, 'set ' + engineKey, 'engine');
  // The voicing stage needs the same Note In mode the engine gets.
  if (engineKey === 'input') wire('re_' + id, 0, 'voice', 0);
  relay(id, 'global ' + id, 'control');
}
for (let lane = 0; lane < 3; lane++) {
  const y = 85 + lane * 19, name = ['Main', 'Aux 1', 'Aux 2'][lane], n = lane + 1;
  const cols = [['ch', 'Channel', 'Ch', 1, 16, lane + 1, 908],
                ['note', 'Note', 'Note', 0, 127, [36, 43, 45][lane], 966],
                ['vel', 'Velocity', 'Vel', 1, 127, 100, 1024]];
  for (const [key, longtail, shorttail, lo, hi, initial, x] of cols) {
    const id = `w_${key}${lane}`;
    widget(id, `${name} ${longtail}`, `${shorttail} ${n}`, [x, y, 54, 18], { lo, hi, initial });
    relay(id, `set ${key} ${lane}`, 'engine');
    relay(id, 'global ' + id, 'control');
  }
}

// --- mod page ---------------------------------------------------------------
function modParam(id, longname, shortname, rect, opts) {
  widget(id, longname, shortname, rect, { ...opts, hidden: 1 });
  modRoster.push(id);
  return id;
}
GLOBAL_MODS.forEach((g, i) => {
  const [key, label, lo, hi, quantum, neutral, mode] = g;
  const id = 'g_' + key;
  modParam(id, 'Global ' + label, 'G ' + label, [(i < 4 ? 18 : 288) + 90, 66 + (i % 4) * 19, 80, 18],
    { lo, hi, initial: neutral, float: quantum < 1, unitstyle: mode === 'scale' ? 5 : 0 });
  relay(id, 'gmod ' + key, 'engine');
});
for (let slot = 0; slot < MOD_SLOTS; slot++) {
  const name = 'Mod ' + (slot + 1), short = 'M' + (slot + 1), y = 66 + (slot + 1) * 19;
  const fields = [['target', 'Target', [648, y, 150, 18], { enum: MOD_TARGETS, initial: 0 }],
                  ['step', 'Step', [812, y, 74, 18], { lo: 0, hi: 16, initial: 0 }],
                  ['amount', 'Amount', [902, y, 84, 18], { lo: -100, hi: 100, initial: 0, unitstyle: 5 }]];
  for (const [field, label, rect, opts] of fields) {
    const id = `m${slot}_${field}`;
    modParam(id, `${name} ${label}`, `${short} ${label}`, rect, opts);
    relay(id, `mslot ${slot} ${field}`, 'engine');
  }
}

// Rosters for fluxion-control.js: one message per bank, then the mod page set.
object('faceload', 'loadbang', 15, 640);
object('facemsg', banks.map((roster, i) => `roster ${i} ${roster.join(' ')}`).join(' , ') +
  ' , modpage ' + modRoster.join(' '), 15, 670);
boxes.find(b => b.box.id === 'facemsg').box.maxclass = 'message';
wire('faceload', 0, 'facemsg', 0);
wire('facemsg', 0, 'control', 0);


// Transport polling: absolute ticks with a native timestamp beside them.
object('load', 'loadbang', 630, 210);
object('init', 't b b', 630, 245, 1, 2);
object('startpoll', '1', 700, 280);
boxes.find(b => b.box.id === 'startpoll').box.maxclass = 'message';
object('poll', 'metro 10', 630, 320, 2);
object('order', 't b b b', 630, 355, 1, 3);
object('transport', 'transport', 738, 393, 2, 9);
object('ticks', 'f 0.', 630, 434, 2);
object('timestamp', 'cpuclock', 830, 434);
object('clockpack', 'pack f f i f', 630, 475, 4);
object('clockmsg', 'prepend clock', 630, 513);
wire('load', 0, 'init', 0);
wire('init', 1, 'editor', 0);
wire('init', 0, 'startpoll', 0);
wire('startpoll', 0, 'poll', 0);
wire('poll', 0, 'order', 0);
wire('order', 2, 'transport', 0);
wire('order', 1, 'timestamp', 0);
wire('timestamp', 0, 'clockpack', 3);
wire('transport', 7, 'ticks', 1);
wire('transport', 4, 'clockpack', 1);
wire('transport', 6, 'clockpack', 2);
wire('order', 0, 'ticks', 0);
wire('ticks', 0, 'clockpack', 0);
wire('clockpack', 0, 'clockmsg', 0);
wire('clockmsg', 0, 'engine', 0);

// Native scheduling path: pack a complete MIDI message, then serialize its bytes.
object('unpack', 'unpack i i i f', 15, 330, 1, 4);
object('pipe', 'pipe 0 0 0 0.', 15, 375, 4, 3);
object('packet', 'pack i i i', 15, 420, 3);
object('voice', 'js fluxion-voice.js', 15, 462, 1, 2);
object('bytes', 'iter', 15, 504);
object('flush', 'midiflush', 15, 546);
object('out', 'midiout', 15, 594, 1, 0);
// Upstream sequencer notes: pitch/velocity for the voice stage, never passed through.
object('in', 'midiin', 440, 594, 1, 1);
object('parse', 'midiparse', 440, 630, 1, 8);
object('notein', 'prepend note', 440, 666);
wire('in', 0, 'parse', 0);
wire('parse', 0, 'notein', 0);
wire('notein', 0, 'voice', 0);
wire('voice', 1, 'editor', 0);
object('freshclock', 't l b', 170, 330, 1, 2);
object('outputtransport', 'transport', 385, 330, 2, 9);
object('runninggate', 'gate 1', 170, 365, 2);
object('delaytime', 'expr max(0., ($f1-$f2)*125./$f3)', 150, 540, 3);
wire('engine', 0, 'freshclock', 0);
wire('freshclock', 1, 'outputtransport', 0);
wire('outputtransport', 7, 'delaytime', 1);
wire('outputtransport', 4, 'delaytime', 2);
wire('outputtransport', 6, 'runninggate', 0);
wire('freshclock', 0, 'runninggate', 1);
wire('runninggate', 0, 'unpack', 0);
for (let i = 0; i < 3; i++) wire('unpack', i, 'pipe', i);
wire('unpack', 3, 'delaytime', 0);
wire('delaytime', 0, 'pipe', 3);
for (let i = 0; i < 3; i++) wire('pipe', i, 'packet', i);
wire('packet', 0, 'voice', 0);
wire('voice', 0, 'bytes', 0);
wire('bytes', 0, 'flush', 0);
wire('flush', 0, 'out', 0);
object('panic', 't b b b', 250, 375, 1, 3);
object('clear', 'clear', 300, 420);
boxes.find(b => b.box.id === 'clear').box.maxclass = 'message';
object('voicereset', 'reset', 360, 420);
boxes.find(b => b.box.id === 'voicereset').box.maxclass = 'message';
wire('engine', 1, 'panic', 0);
wire('panic', 2, 'clear', 0);
wire('clear', 0, 'pipe', 0);
wire('panic', 1, 'voicereset', 0);
wire('voicereset', 0, 'voice', 0);
wire('panic', 0, 'flush', 0);
object('stopchange', 'change', 960, 434, 3, 3);
object('stopped', 'sel 0', 960, 475, 2, 2);
wire('transport', 6, 'stopchange', 0);
wire('stopchange', 0, 'stopped', 0);
wire('stopped', 0, 'panic', 0);
object('close', 'closebang', 250, 285);
wire('close', 0, 'panic', 0);
object('thisdevice', 'live.thisdevice', 440, 210, 1, 3);
object('active', 'prepend active', 440, 285);
// Face controls are stored parameters, so Live restores them during device load.
// Their order against the sequence blob's own restore is not defined, so the
// control script drops every widget output until the device reports it is fully
// loaded. Trigger fires right to left: the editor pushes the recalled pattern over
// the widgets first, and only then is the gate opened.
object('loaded', 't b b', 440, 245, 1, 2);
wire('thisdevice', 0, 'loaded', 0);
wire('loaded', 1, 'editor', 0);
object('readymsg', 'ready', 540, 285);
boxes.find(b => b.box.id === 'readymsg').box.maxclass = 'message';
wire('loaded', 0, 'readymsg', 0);
wire('readymsg', 0, 'control', 0);
wire('thisdevice', 1, 'active', 0);
wire('active', 0, 'engine', 0);
comment('timing-note', 'Absolute Live transport position, 480 ticks / quarter. Poll reports are read only; Fluxion never starts or moves Live.', 630, 555);
comment('midi-note', 'RAW MIDI OUT: Main / Aux 1 / Aux 2 carry separate channel status bytes. Note in LATCH/HOLD: input notes set pitch/velocity at gate time; input is not passed through.', 15, 710, 560);
comment('panic-note', 'Cancel pending messages first; then release notes actually emitted on every channel.', 245, 455, 330);

const patch = { patcher: {
  fileversion: 1, appversion: { major: 8, minor: 6, revision: 0, architecture: 'x64', modernui: 1 },
  classnamespace: 'box', rect: [80, 100, 1140, 780], openrect: [0, 0, 1100, 169],
  openinpresentation: 1, devicewidth: 1100, default_fontname: 'Ableton Sans Medium', default_fontsize: 9,
  bglocked: 1,
  boxes, lines, parameters: { ...parameterEntries, parameterbanks: {}, inherited_shortname: 1 },
  dependency_cache: RUNTIME.map(name => ({ name, type: 'TEXT', implicit: 1 })),
  latency: 0, autosave: 0, title: 'Fluxion',
  project: { version: 1, amxdtype: 1835887981, readonly: 0, devpathtype: 0, devpath: '.',
    autoorganize: 1, hideprojectwindow: 1, autolocalize: 0, contents: {}, layout: {}, searchpath: {} },
}};
// Editable patch: open in Max with src/ on the search path.
writeFileSync(path.join(hereDevice, 'Fluxion.maxpat'), JSON.stringify(patch, null, 2) + '\n');

// Frozen AMXD: the patch plus every runtime script in one file, so the device
// needs nothing beside it. Layout matches Live's frozen factory devices:
//   ampf (LE) 'mmmm' MIDI effect | meta bytes 00 00 00 07 = frozen | ptch (LE) length, then
//   'mx@c' container (BE): header size 16, 0, directory offset; files back to back;
//   'dlst' directory of 'dire' entries (type, fnam NUL-padded to 4, sz32, of32,
//   vers, flag 17 = main patch, mdat in seconds since 1904).
const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0); return b; };
const chunk = (tag, data) => Buffer.concat([Buffer.from(tag, 'latin1'), u32(8 + data.length), data]);
const macTime = ms => Math.floor(ms / 1000) + 2082844800;
const padded = name => { const b = Buffer.alloc(Math.ceil((name.length + 1) / 4) * 4); b.write(name, 0, 'latin1'); return b; };

const frozenName = 'Fluxion.amxd';
const scripts = RUNTIME.map(name => {
  const file = path.join(hereSrc, name);
  return { name, type: 'TEXT', flag: 0, data: readFileSync(file), mdat: macTime(statSync(file).mtimeMs) };
});
const frozenPatch = { patcher: { ...patch.patcher, project: { ...patch.patcher.project, readonly: 1 } } };
const entries = [{ name: frozenName, type: 'JSON', flag: 17, data: Buffer.from(JSON.stringify(frozenPatch)),
  mdat: Math.max(...scripts.map(s => s.mdat), macTime(statSync(fileURLToPath(import.meta.url)).mtimeMs)) }, ...scripts];
let offset = 16;
const directory = entries.map(e => {
  const dire = chunk('dire', Buffer.concat([
    chunk('type', Buffer.from(e.type, 'latin1')), chunk('fnam', padded(e.name)),
    chunk('sz32', u32(e.data.length)), chunk('of32', u32(offset)), chunk('vers', u32(0)),
    chunk('flag', u32(e.flag)), chunk('mdat', u32(e.mdat)),
  ]));
  offset += e.data.length;
  return dire;
});
const container = Buffer.concat([Buffer.from('mx@c', 'latin1'), u32(16), u32(0), u32(offset),
  ...entries.map(e => e.data), chunk('dlst', Buffer.concat(directory))]);
const header = Buffer.alloc(32);
header.write('ampf', 0); header.writeUInt32LE(4, 4); header.write('mmmm', 8);
header.write('meta', 12); header.writeUInt32LE(4, 16); header.writeUInt32BE(7, 20);
header.write('ptch', 24); header.writeUInt32LE(container.length, 28);
writeFileSync(path.join(hereDevice, frozenName), Buffer.concat([header, container]));
console.log(`Built Fluxion.maxpat and frozen ${frozenName} (${RUNTIME.length} scripts embedded).`);
