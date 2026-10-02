// Syzygy face: section headers and dividers, a colour key per body, body meters, pitch and
// matter readouts. Background only (ignoreclick): every
// control is a native live.* object on top, and the orbit display is its own jsui.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("syzygy3.theme.js");

// Must match the layout in scripts/build.py.
var SECTIONS = [[2, 0, 108, 168, 'Sun'], [112, 0, 108, 168, 'Earth'], [222, 0, 108, 168, 'Moon'],
    [332, 0, 330, 168, 'Orbit'], [664, 0, 170, 168, 'Excite'], [836, 0, 112, 168, 'Resonance'],
    [950, 0, 112, 168, 'Output']];
var BODY_X = [2, 112, 222];
var MATTERS = ['Skin', 'Wood', 'String', 'Glass', 'Bell', 'Gong'];
var NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

var view = null, d = [], values = { matter1: 80, matter2: 60, matter3: 30 };
function viewbuffer(name) { view = new Buffer(name); }
function value(k, v) { values[k] = v; mgraphics.redraw(); }
// Redraw only when a meter or readout would visibly change.
var shown = '';
function tick() {
    if (view) { try { d = view.peek(1, 0, 32); } catch (e) {} }
    var sig = '', i;
    for (i = 0; i < 3; i++) sig += Math.round(((d[6 + i] || 0) > 0 ? 20 * Math.log(d[6 + i]) / Math.LN10 : -99)) + noteName(d[12 + i]) + ',';
    if (sig !== shown) { shown = sig; mgraphics.redraw(); }
}
function bang() { mgraphics.redraw(); }

// Body colours come from Live's display colours so they follow the skin; the orbit uses the same.
function bodyColor(i) { return [THEME.handle1, THEME.line2, THEME.handle2][i]; }
function matterName(pct) { return MATTERS[Math.max(0, Math.min(5, Math.round(pct / 20)))]; }
function noteName(hz) {
    if (!(hz > 0)) return '';
    var n = 69 + 12 * Math.log(hz / 440) / Math.LN2, r = Math.round(n), c = Math.round((n - r) * 100);
    return NOTES[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 2) + (c === 0 ? '' : (c > 0 ? ' +' : ' ') + c);
}
function paint() {
    var i, x;
    thSections(SECTIONS);
    for (i = 0; i < 3; i++) {
        x = BODY_X[i];
        // Colour key beside the header, matching the body's dot in the orbit display.
        var hw = thMeasure(SECTIONS[i][4], THEME.size, THEME.fieldset.legendFont);
        thColor(bodyColor(i)); mgraphics.ellipse(x + THEME.fieldset.legendInset + hw + 5, 6, 6, 6); mgraphics.fill();
        var env = d[6 + i] || 0, db = env > 0 ? 20 * Math.log(env) / Math.LN10 : -99;
        thMeter(x + 8, 72, 92, 3, (db + 48) / 48, bodyColor(i));
        thText(thFit(noteName(d[12 + i]), 44), x + 58, 87, THEME.text, THEME.readout);
        thText(matterName(values['matter' + (i + 1)]), x + 58, 98, THEME.dim, THEME.readout);
    }
}
