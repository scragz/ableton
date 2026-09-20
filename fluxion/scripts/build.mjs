import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { prelude } from '../../theme/theme.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const hereSrc = path.join(here, '../src');
const hereDevice = path.join(here, '../device');
// The adjacent ES5 rhythm engine is maintained with this device.
// Do not overwrite device-specific curves from a sibling web checkout.
// Runtime scripts embedded in the frozen device (tests and preview stay out).
const RUNTIME = ['fluxion-ui.js', 'fluxion-theme.js', 'fluxion-engine.js', 'fluxion-voice.js', 'fluxion-rhythm.js', 'fluxion-state.js'];
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
  jsarguments: [], numinlets: 1, numoutlets: 2, outlettype: ['', ''],
  varname: 'fluxion_editor', border: 0, parameter_enable: 0,
  patching_rect: [15, 15, 1100, 169], presentation: 1,
  presentation_rect: [0, 0, 1100, 169] }});
// Match Max's own saved layout for a Blob pattr. With parameter mode enabled only
// through "@parameter_enable 1" in the object text, the saved Blob type was ignored:
// Live treated the parameter as a number ("bad number") and recalled 0.
object('state', 'pattr fluxion_state @bindto fluxion_editor', 15, 210, 1, 3, {
  varname: 'fluxion_state',
  saved_object_attributes: { parameter_enable: 1 },
  saved_attribute_attributes: { valueof: {
    parameter_longname: 'Fluxion Sequence', parameter_shortname: 'Sequence',
    parameter_type: 3, parameter_invisible: 1, parameter_linknames: 1 } },
});
object('engine', 'js fluxion-engine.js', 15, 285, 1, 3);
wire('editor', 0, 'engine', 0);
wire('engine', 2, 'editor', 0);
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
wire('editor', 0, 'voice', 0);
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
wire('editor', 1, 'panic', 0);
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
wire('thisdevice', 0, 'editor', 0);
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
  boxes, lines, parameters: { state: ['Fluxion Sequence', 'Sequence', 0],
    parameterbanks: {}, inherited_shortname: 1 },
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
