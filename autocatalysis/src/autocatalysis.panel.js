// Autocatalysis face: section headers and dividers, the strings well, the amp's reservoir meters,
// the reaction phase portrait, the seek strip and output meters. Background only (ignoreclick):
// every control is a native live.* object on top.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("autocatalysis.theme.js");

// Must match the layout in scripts/build.py.
var SECTIONS = [[2, 0, 200, 168, 'Strings'], [204, 0, 162, 168, 'Amp'], [368, 0, 210, 168, 'Kinetics'],
    [580, 0, 168, 168, 'Space'], [750, 0, 102, 168, 'Output']];
var STRINGS = [8, 22, 88, 78];
var RES = [314, 104, 46, 48];
var PHASE = [478, 20, 92, 140];
var SEEK = [638, 122, 102, 30];
var METERS = [810, 22, 34, 128];
var NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

var view = null, d = [], trailL = [], trailR = [], TRAIL = 90;
function viewbuffer(name) { view = new Buffer(name); }
function value(k, v) { }
function voices() { }
function bang() { mgraphics.redraw(); }
function tick() {
    if (view) { try { d = view.peek(1, 0, 32); } catch (e) {} }
    if (d.length >= 28) {
        trailL.push([d[24], d[25]]); trailR.push([d[26], d[27]]);
        if (trailL.length > TRAIL) { trailL.shift(); trailR.shift(); }
    }
    mgraphics.redraw();
}

function db(x) { return x > 0 ? 20 * Math.log(x) / Math.LN10 : -99; }
function noteName(hz) {
    if (!(hz > 0)) return '';
    var n = 69 + 12 * Math.log(hz / 440) / Math.LN2, r = Math.round(n);
    return NOTES[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 2);
}
function vmeter(x, y, w, h, level, color) {
    thWell(x, y, w, h);
    level = Math.max(0, Math.min(1, level));
    if (level > 0) thRect(x, y + h * (1 - level), w, Math.max(1, h * level), color || THEME.meter);
}

function paintStrings() {
    var x = STRINGS[0], y = STRINGS[1], w = STRINGS[2], h = STRINGS[3], row = h / 6, i;
    thWell(x, y, w, h);
    for (i = 0; i < 6; i++) {
        // Highest string on top, like tab.
        var s = 5 - i, ry = y + i * row, env = d[6 + s] || 0, on = (d[18 + s] || 0) > 0.5;
        thText(noteName(d[12 + s]), x + 4, ry + row * 0.5 + 3.5, on ? THEME.text : THEME.dim, THEME.readout);
        var lvl = Math.max(0, Math.min(1, (db(env) + 54) / 54));
        thLine(x + 28, ry + row * 0.5, x + w - 4, ry + row * 0.5, THEME.line);
        if (lvl > 0) thRect(x + 28, ry + row * 0.5 - 1.5, (w - 32) * lvl, 3, on ? THEME.accent : THEME.meter);
    }
}

function paintReservoir() {
    var x = RES[0], y = RES[1], w = RES[2], h = RES[3];
    thText('Supply', x, y + 7, THEME.dim, THEME.readout);
    vmeter(x + 6, y + 12, 12, h - 14, d[0] === undefined ? 1 : d[0], THEME.line1);
    vmeter(x + 28, y + 12, 12, h - 14, d[1] === undefined ? 1 : d[1], THEME.line2);
}

// Reaction phase portrait: Brusselator X (right) against Y (up) for each amp. A dot sitting still is a
// steady amp; a loop is the amp breathing.
function paintPhase() {
    var x = PHASE[0], y = PHASE[1], w = PHASE[2], h = PHASE[3], i;
    thWell(x, y, w, h);
    var px = function (v) { return x + 4 + Math.min(1, v / 4) * (w - 8); };
    var py = function (v) { return y + h - 4 - Math.min(1, v / 6) * (h - 8); };
    thLine(px(1), y + 2, px(1), y + h - 2, THEME.line, 1, 0.6);
    var trails = [[trailL, THEME.line1, THEME.handle1], [trailR, THEME.line2, THEME.handle2]];
    for (var t = 0; t < 2; t++) {
        var tr = trails[t][0];
        if (tr.length < 2) continue;
        thColor(trails[t][1], 0.8); mgraphics.set_line_width(1);
        mgraphics.move_to(px(tr[0][0]), py(tr[0][1]));
        for (i = 1; i < tr.length; i++) mgraphics.line_to(px(tr[i][0]), py(tr[i][1]));
        mgraphics.stroke();
        var e = tr[tr.length - 1];
        thColor(trails[t][2]); mgraphics.ellipse(px(e[0]) - 2.5, py(e[1]) - 2.5, 5, 5); mgraphics.fill();
    }
}

function paintSeek() {
    var x = SEEK[0], y = SEEK[1], w = SEEK[2], h = SEEK[3];
    // d[5] = locked + 2 * seek + 4 * weak. Weak: at the best spot the other harmonics still out-gain
    // the target (a low fundamental under the amp's high-pass, or a harmonic the pickups null).
    var st = Math.round(d[5] || 0), locked = st % 2 === 1, on = (st & 2) === 2, weak = (st & 4) === 4;
    var label = !on ? 'Seek Off' : locked ? 'Locked' : weak ? 'Weak' : 'Seeking';
    thText(label, x, y + 9, on ? THEME.text : THEME.dim, THEME.readout);
    var ly = y + 21, off = Math.max(-0.5, Math.min(0.5, d[4] || 0));
    thWell(x, ly - 6, w, 12);
    thLine(x + w / 2, ly - 6, x + w / 2, ly + 6, THEME.line);
    var mx = x + w / 2 + off * (w - 6);
    thRect(mx - 2, ly - 5, 4, 10, on ? (locked ? THEME.accent : THEME.handle1) : THEME.dim);
    thText((off >= 0 ? '+' : '') + Math.round(off * 360) + ' deg', x + w, y + 9, THEME.dim, THEME.readout, 2);
}

function paintMeters() {
    var x = METERS[0], y = METERS[1], w = METERS[2], h = METERS[3];
    var l = (db(d[2] || 0) + 48) / 48, r = (db(d[3] || 0) + 48) / 48;
    vmeter(x, y, 12, h, l);
    vmeter(x + 18, y, 12, h, r);
}

function paint() {
    thSections(SECTIONS);
    paintStrings();
    paintReservoir();
    paintPhase();
    paintSeek();
    paintMeters();
}
