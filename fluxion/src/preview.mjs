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
context.state.steps[0].curve = 2.4;
context.state.steps[0].density = 32;
context.state.steps[0].divisions = 4;
context.state.steps[0].curveVariant = 4;
context.state.loopEnd = 3;
context.paint();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="169" viewBox="0 0 1100 169">${elements.join('')}</svg>`;
const out = new URL('../device/', here); // next to the device, where the committed previews live
fs.writeFileSync(new URL('editor-preview.svg', out), svg);
await sharp(Buffer.from(svg)).resize(2200, 338).png().toFile(new URL('editor-preview.png', out).pathname);
console.log('Rendered actual jsui paint commands to device/editor-preview.svg / .png.');
