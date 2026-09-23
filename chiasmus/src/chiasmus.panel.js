// Chiasmus face: section headers/dividers, head display, envelope preview and readouts.
// Background only (ignoreclick): every control is a native live.* object laid over it.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("chiasmus.theme.js");

// Must match the section layout in scripts/build.py.
var FIELDSETS = [[2, 0, 186, 168, 'Time'], [190, 0, 132, 168, 'Direction'], [324, 0, 296, 168, 'Shape'],
    [622, 0, 150, 168, 'Loop'], [774, 0, 130, 168, 'Output']];
var HEADS = [332, 20, 280, 50], ENV = [332, 74, 280, 26];
var PATTERNS = ['Rev', 'Alt', 'ABBA'];

var view = null, data = [], smooth = 0.3, swell = 0, engine = 0, zip = 0.3;
var trigger = 0, pattern = 0, timeMs = 400, division = '1/4', pitch = 0;
function viewbuffer(name) { view = new Buffer(name); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Same curves as the engine (envelope() / skew() in chiasmus.genexpr).
function skew(x, s) {
    if (s > 0) return Math.pow(x, 1 + s * 3);
    if (s < 0) return Math.pow(1 - x, 1 - s * 3);
    return 1;
}
function envelope(x, f, s) {
    var a = 1;
    if (x < f) a = Math.sin(0.5 * Math.PI * x / f);
    else if (x > 1 - f) a = Math.sin(0.5 * Math.PI * (1 - x) / f);
    return a * skew(x, s);
}

function arrow(x, y, dir, c, alpha) {
    thColor(c, alpha);
    if (!dir) { mgraphics.rectangle(x - 2.5, y - 2.5, 5, 5); mgraphics.fill(); return; }
    mgraphics.move_to(x + dir * 5, y);
    mgraphics.line_to(x - dir * 2, y - 3.5);
    mgraphics.line_to(x - dir * 2, y + 3.5);
    mgraphics.close_path();
    mgraphics.fill();
}

function paint() {
    thSections(FIELDSETS);
    var g = HEADS, i, d = data;
    // Heads: right edge is "now", left edge the oldest audio a chunk can reach.
    thWell(g[0], g[1], g[2], g[3]);
    for (i = 1; i < 4; i++) thRect(g[0] + Math.round(g[2] * i / 4), g[1] + 1, 1, g[3] - 2, THEME.line);
    var lanes = engine ? 1 : 6, top = g[1] + 16, bottom = g[1] + g[3] - 6;
    for (i = 0; i < lanes; i++) {
        var amp = d[i * 4] || 0, dir = d[i * 4 + 2] || 0, dist = d[i * 4 + 3] || 0;
        if (amp <= 0.001 && !(engine && d[27] > 0.5)) continue;
        var x = g[0] + g[2] - 3 - clamp(dist, 0, 1) * (g[2] - 6);
        var y = engine ? (top + bottom) / 2 : top + i * (bottom - top) / 5;
        // Reverse heads travel into the past (left); forward and fast-forward heads toward now (right).
        var c = dir < 0 ? THEME.line1 : THEME.line2;
        thRect(x - 0.5, g[1] + 1, 1, g[3] - 2, c, 0.15 + amp * 0.35);
        arrow(x, y, dir, c, 0.35 + clamp(amp, 0, 1) * 0.65);
    }
    // Readouts in the display's top line: chunk time, pattern, pitch; state on the right.
    var bpm = d[25] > 0 ? 60 / d[25] : 0;
    var t = trigger === 1 ? division + (d[26] > 0.5 && bpm ? ' · ' + bpm.toFixed(1) : ' · free') :
        (timeMs >= 1000 ? (timeMs / 1000).toFixed(2) + ' s' : Math.round(timeMs) + ' ms');
    var ps = (pitch >= 0 ? '+' : '') + pitch.toFixed(pitch % 1 ? 2 : 0) + ' st';
    thText(thFit(t + '  ·  ' + PATTERNS[pattern] + '  ·  ' + ps, 190, THEME.size), g[0] + 5, g[1] + 11, THEME.dim, THEME.size);
    var right = g[0] + g[2] - 5;
    if (trigger === 2) {
        var flash = d[24] || 0;
        thColor(flash > 0.05 ? THEME.handle1 : THEME.dim, flash > 0.05 ? clamp(flash, 0.3, 1) : 0.6);
        mgraphics.ellipse(right - 6, g[1] + 4, 6, 6);
        mgraphics.fill();
        right -= 12;
    }
    if (d[28] > 0.5) thText('Frozen', right, g[1] + 11, THEME.handle1, THEME.size, 2);
    // Envelope preview. Grain: the window from Smooth / Swell. Tape: one chunk, the catch-up
    // (length from Smooth, level = Zip) followed by the Swell-shaped play.
    var e = ENV, x0 = e[0] + 2, w = e[2] - 4, base = e[1] + e[3] - 3, h = e[3] - 6, xx, px, py;
    thWell(e[0], e[1], e[2], e[3]);
    mgraphics.set_line_width(1);
    if (!engine) {
        var f = 0.01 + clamp(smooth, 0, 1) * 0.49;
        thColor(THEME.line1);
        for (i = 0; i <= 140; i++) {
            xx = i / 140; px = x0 + xx * w; py = base - envelope(xx, f, swell) * h;
            if (i === 0) mgraphics.move_to(px, py); else mgraphics.line_to(px, py);
        }
        mgraphics.stroke();
    } else {
        var cf = 0.05 + clamp(smooth, 0, 1) * 0.45, cx = x0 + cf * w;
        thColor(THEME.line2);
        for (i = 0; i <= 40; i++) {
            xx = i / 40; px = x0 + xx * (cx - x0);
            var b = Math.sin(Math.PI * xx), from = skew(1, swell), to = skew(0, swell);
            py = base - ((from + (to - from) * xx) * (1 - b * b) + zip * b * b) * h;
            if (i === 0) mgraphics.move_to(px, py); else mgraphics.line_to(px, py);
        }
        mgraphics.stroke();
        thColor(THEME.line1);
        for (i = 0; i <= 120; i++) {
            xx = i / 120; px = cx + xx * (x0 + w - cx); py = base - skew(xx, swell) * h;
            if (i === 0) mgraphics.move_to(px, py); else mgraphics.line_to(px, py);
        }
        mgraphics.stroke();
    }
}

function tick() {
    if (!view) return;
    try { data = view.peek(1, 0, 32) || []; } catch (err) { data = []; }
    mgraphics.redraw();
}
function shape(s, w, eng, z) { smooth = s; swell = w; engine = eng ? 1 : 0; zip = z === undefined ? zip : z; mgraphics.redraw(); }
function mode(t, p, ms, div, st) { trigger = t; pattern = p; timeMs = ms; division = String(div); pitch = st; mgraphics.redraw(); }
