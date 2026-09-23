// Render the actual jsui paint commands to SVG for source-level visual QA.
// This is not a screenshot or a substitute for verification in Ableton / Max.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const here = new URL('./', import.meta.url);
// sharp is installed in the Fluxion web app.
const app = process.env.FLUXION_APP || new URL('../../fluxion/', here).pathname;
const sharp = createRequire(app + '/package.json')('sharp');
const elements = [];
let color = '#fff', width = 1, fontSize = 10, weight = 'normal', x = 0, y = 0, path = '';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const graphics = {
  init() {}, redraw() {},
  // Approximate Max's text_measure: [width, height].
  text_measure(label) { return [String(label).length * fontSize * 0.55, fontSize]; },
  // Max accepts either an [r, g, b, a] array or four separate numbers.
  set_source_rgba(...args) {
    const rgba = args.length > 1 ? args : args[0];
    color = `rgb(${rgba.slice(0, 3).map(n => Math.round(n * 255)).join(',')})`; },
  set_line_width(n) { width = n; },
  select_font_face(_face, _style, bold) { weight = bold; },
  set_font_size(n) { fontSize = n; },
  rectangle(a, b, w, h) { path = `M${a},${b}h${w}v${h}h${-w}Z`; },
  move_to(a, b) { x = a; y = b; path += `M${a},${b}`; },
  line_to(a, b) { path += `L${a},${b}`; },
  fill() { elements.push(`<path d="${path}" fill="${color}"/>`); path = ''; },
  stroke() { elements.push(`<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}"/>`); path = ''; },
  show_text(label) {
    elements.push(`<text x="${x}" y="${y}" fill="${color}" font-family="Arial" font-size="${fontSize}" font-weight="${weight}">${escape(label)}</text>`);
    path = '';
  },
};
// Any mgraphics call the mock doesn't implement (new_path, close_path, ...) is a no-op instead of a crash.
const mgraphics = new Proxy(graphics, { get: (target, key) => (key in target ? target[key] : () => {}) });
const context = vm.createContext({ mgraphics, outlet() {}, notifyclients() {},
  arrayfromargs: args => Array.from(args), error: message => { throw new Error(message); } });
context.include = file => vm.runInContext(fs.readFileSync(new URL(file, here), 'utf8'), context);
context.include('fluxion-ui.js');
// The face draws from a mirror now; hand it a representative one.
const page = Number(process.env.PREVIEW_PAGE || 0);
context.mirror(JSON.stringify({
  selected: 0, page, loopStart: 0, loopEnd: 3, label: '4.4 Call / response',
  enabled: Array.from({length: 16}, (_, i) => i !== 6),
  step: {...context.DEFAULT_STEP, curve: 2.4, density: 32, divisions: 4, curveVariant: 4, enabled: true},
}));
context.paint();
// The values on the face are native live.* widgets, not jsui drawing, so they are
// invisible to the mock above. Sketch them from the generated patch: this shows
// where Live will put them and whether anything collides, not how Live draws them.
const patch = JSON.parse(fs.readFileSync(new URL('../device/Fluxion.maxpat', here), 'utf8')).patcher;
const boxes = patch.boxes.map(b => b.box);
// Sketch whichever parameters would be on screen: bank 0 plus the globals, or the
// mod page. Placement only -- this is not how Live draws them.
const rows = boxes.find(b => b.id === 'facemsg').text.split(',').map(s => s.trim().split(/\s+/));
const bank0 = rows.find(r => r[0] === 'roster' && r[1] === '0').slice(2);
const mod = rows.find(r => r[0] === 'modpage').slice(1);
const onPage = new Set(page ? mod : bank0);
for (const box of boxes.filter(b => String(b.maxclass).startsWith('live.'))) {
  if (box.presentation !== 1) continue;
  const banked = /^(s\d+_|g_|m\d_)/.test(box.id);
  if (banked && !onPage.has(box.id)) continue;
  const [bx, by, bw, bh] = box.presentation_rect;
  const menu = box.maxclass === 'live.menu';
  const label = box.maxclass === 'live.text' ? box.text
    : menu ? (box.items || box.saved_attribute_attributes?.valueof?.parameter_enum || ['\u2014'])[0] + ' \u25be'
    : String(box.saved_attribute_attributes?.valueof?.parameter_initial?.[0] ?? 0);
  if (box.maxclass === 'live.text' && page && !onPage.has(box.id) && /^(s\d+_)/.test(box.id)) continue;
  elements.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="rgb(67,67,67)"/>`);
  elements.push(`<text x="${bx + bw / 2}" y="${by + bh / 2 + 3.2}" fill="rgb(217,217,217)" font-family="Arial" font-size="9" text-anchor="middle">${escape(label)}</text>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="169" viewBox="0 0 1100 169">${elements.join('')}</svg>`;
const out = new URL('../device/', here); // next to the device, where the committed previews live
const name = page ? 'editor-preview-mod' : 'editor-preview';
fs.writeFileSync(new URL(name + '.svg', out), svg);
await sharp(Buffer.from(svg)).resize(2200, 338).png().toFile(new URL(name + '.png', out).pathname);
console.log(`Rendered actual jsui paint commands to device/${name}.svg / .png.`);
