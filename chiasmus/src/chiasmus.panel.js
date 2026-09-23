// Chiasmus face: section headers/dividers, the grain display and the envelope preview.
// Background only (ignoreclick): every control is a native live.* object laid over it.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("chiasmus.theme.js");

// Must match the section layout in scripts/build.py.
var FIELDSETS = [[2, 0, 186, 168, 'Time'], [190, 0, 132, 168, 'Direction'], [324, 0, 236, 168, 'Shape'],
    [562, 0, 150, 168, 'Loop'], [714, 0, 130, 168, 'Output']];
var GRAINS = [332, 20, 220, 50], ENV = [332, 74, 220, 26];
var READ_X = 478, READ_Y = 118;
var PATTERNS = ['Rev', 'Alt', 'ABBA'];

var view = null, data = [], smooth = 0.3, swell = 0, trigger = 0, pattern = 0, timeMs = 400, division = '1/4', pitch = 0;
function viewbuffer(name) { view = new Buffer(name); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function envelope(x, f, s) {
    var a = 1;
    if (x < f) a = Math.sin(0.5 * Math.PI * x / f);
    else if (x > 1 - f) a = Math.sin(0.5 * Math.PI * (1 - x) / f);
    if (s > 0) a *= Math.pow(x, 1 + s * 3);
    else if (s < 0) a *= Math.pow(1 - x, 1 - s * 3);
    return a;
}

function paint() {
    thSections(FIELDSETS);
    var g = GRAINS, i, d = data;
    // Grain display: right edge is "now", left edge the oldest audio a grain can reach.
    thWell(g[0], g[1], g[2], g[3]);
    for (i = 1; i < 4; i++) thRect(g[0] + Math.round(g[2] * i / 4), g[1] + 1, 1, g[3] - 2, THEME.line);
    for (i = 0; i < 6; i++) {
        var amp = d[i * 4] || 0, dir = d[i * 4 + 2] || 0, dist = d[i * 4 + 3] || 0;
        if (amp <= 0.001 || !dir) continue;
        var x = g[0] + g[2] - 3 - clamp(dist, 0, 1) * (g[2] - 6);
        var y = g[1] + 5 + i * (g[3] - 10) / 5;
        var c = dir < 0 ? THEME.line1 : THEME.line2;
        thRect(x - 0.5, g[1] + 1, 1, g[3] - 2, c, 0.15 + amp * 0.35);
        // Arrow: reverse heads travel into the past (left), forward heads toward now (right).
        thColor(c, 0.35 + amp * 0.65);
        mgraphics.move_to(x + dir * 5, y);
        mgraphics.line_to(x - dir * 2, y - 3.5);
        mgraphics.line_to(x - dir * 2, y + 3.5);
        mgraphics.close_path();
        mgraphics.fill();
    }
    if (trigger === 2) {
        var flash = d[24] || 0;
        thColor(flash > 0.05 ? THEME.handle1 : THEME.dim, flash > 0.05 ? clamp(flash, 0.3, 1) : 0.6);
        mgraphics.ellipse(g[0] + g[2] - 9, g[1] + 3, 6, 6);
        mgraphics.fill();
    }
    // Envelope preview from Smooth / Swell (same curve as the engine).
    var e = ENV, f = 0.01 + clamp(smooth, 0, 1) * 0.49;
    thWell(e[0], e[1], e[2], e[3]);
    thColor(THEME.line1);
    mgraphics.set_line_width(1);
    for (i = 0; i <= 110; i++) {
        var xx = i / 110, px = e[0] + 2 + xx * (e[2] - 4), py = e[1] + e[3] - 3 - envelope(xx, f, swell) * (e[3] - 6);
        if (i === 0) mgraphics.move_to(px, py); else mgraphics.line_to(px, py);
    }
    mgraphics.stroke();
    // Readouts: chunk time, pattern / pitch, state.
    var bpm = d[25] > 0 ? 60 / d[25] : 0;
    var t = trigger === 1 ? division + (d[26] > 0.5 && bpm ? ' · ' + bpm.toFixed(1) : ' · free') : (timeMs >= 1000 ? (timeMs / 1000).toFixed(2) + ' s' : Math.round(timeMs) + ' ms');
    thText(thFit(t, 76, THEME.readout), READ_X, READ_Y, THEME.text, THEME.readout);
    var ps = (pitch >= 0 ? '+' : '') + pitch.toFixed(pitch % 1 ? 2 : 0) + ' st';
    thText(PATTERNS[pattern] + ' · ' + ps, READ_X, READ_Y + 14, THEME.dim, THEME.size);
    if (d[28] > 0.5) thText('Frozen', READ_X, READ_Y + 28, THEME.handle1, THEME.size);
    thMeter(READ_X, READ_Y + 34, 74, 3, (d[27] || 0) * 2);
}

function tick() {
    if (!view) return;
    try { data = view.peek(1, 0, 32) || []; } catch (err) { data = []; }
    mgraphics.redraw();
}
function shape(s, w) { smooth = s; swell = w; mgraphics.redraw(); }
function mode(t, p, ms, div, st) { trigger = t; pattern = p; timeMs = ms; division = String(div); pitch = st; mgraphics.redraw(); }
