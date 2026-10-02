// Syzygy orbit display: the three bodies, their trails, the triangle between them (brightening as
// they line up) and a flash at each syzygy. Drag a body to move it; let go while moving to throw it.
// This jsui takes clicks, so no native widget may overlap it.
autowatch = 1;
inlets = 1;
outlets = 1; // grab / drag / release -> controller
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("syzygy3.theme.js");

var SPAN = 1.75;      // orbit units from centre to edge (the wall is at 1.6)
var TRAIL = 80;       // points per trail (one per 33 ms tick)
var FORMS = ['Eight', 'Lagrange', 'Euler', 'Swarm'];
// Handler names (form, hold, struck...) are global functions in Max, so state uses other names.
var view = null, d = [], trails = [[], [], []], formIndex = 0, holding = 0, mass = [1, 1, 1];
var lastSyz = -1, syz = null, rings = [0, 0, 0], grabbed = 0;

function viewbuffer(name) { view = new Buffer(name); }
function bodyColor(i) { return [THEME.handle1, THEME.line2, THEME.handle2][i]; }
function size() { return mgraphics.size; }
function toPx(x, y) { var s = size(); return [s[0] / 2 + x / SPAN * s[0] / 2, s[1] / 2 - y / SPAN * s[1] / 2]; }
function toOrbit(px, py) { var s = size(); return [(px - s[0] / 2) / (s[0] / 2) * SPAN, -(py - s[1] / 2) / (s[1] / 2) * SPAN]; }

function form(v) { formIndex = Math.round(v); mgraphics.redraw(); }
function hold(v) { holding = v; mgraphics.redraw(); }
function mass1(v) { mass[0] = v; } function mass2(v) { mass[1] = v; } function mass3(v) { mass[2] = v; }
function matter1() {} function matter2() {} function matter3() {}
function launched() { trails = [[], [], []]; mgraphics.redraw(); }
function struck(i) { rings[i] = 1; }

function tick() {
    if (view) { try { d = view.peek(1, 0, 32); } catch (e) {} }
    if (d.length >= 12) {
        if (!holding) for (var i = 0; i < 3; i++) { trails[i].push([d[i * 2], d[i * 2 + 1]]); if (trails[i].length > TRAIL) trails[i].shift(); }
        var c = Math.round(d[9]);
        if (lastSyz >= 0 && c !== lastSyz) syz = { p: [[d[0], d[1]], [d[2], d[3]], [d[4], d[5]]], mid: Math.round(d[10]) - 1, life: 1 };
        lastSyz = c;
        if (syz) { syz.life -= 0.05; if (syz.life <= 0) syz = null; }
        for (var k = 0; k < 3; k++) rings[k] *= 0.8;
    }
    mgraphics.redraw();
}

function paint() {
    var s = size(), w = s[0], h = s[1], i, j, p, q;
    thWell(0, 0, w, h);
    // Wall and centre.
    var wall = 1.6 / SPAN * w / 2;
    thColor(THEME.line); mgraphics.set_line_width(1);
    mgraphics.ellipse(w / 2 - wall, h / 2 - wall, wall * 2, wall * 2); mgraphics.stroke();
    thLine(w / 2 - 3, h / 2 + 0.5, w / 2 + 3, h / 2 + 0.5, THEME.line);
    thLine(w / 2 + 0.5, h / 2 - 3, w / 2 + 0.5, h / 2 + 3, THEME.line);
    if (d.length < 12) return;
    // Trails, fading in four strokes per body (one stroke per segment would cost 240 per frame).
    mgraphics.set_line_width(1.2);
    for (i = 0; i < 3; i++) {
        var t = trails[i], n = t.length, part, from, to;
        for (part = 0; part < 4; part++) {
            from = Math.floor(part * (n - 1) / 4); to = Math.floor((part + 1) * (n - 1) / 4);
            if (to <= from) continue;
            thColor(bodyColor(i), (part + 1) / 4 * 0.55);
            p = toPx(t[from][0], t[from][1]); mgraphics.move_to(p[0], p[1]);
            for (j = from + 1; j <= to; j++) { q = toPx(t[j][0], t[j][1]); mgraphics.line_to(q[0], q[1]); }
            mgraphics.stroke();
        }
    }
    // The triangle: faint, and brighter as the bodies approach a line (col 1 = equilateral, 0 = syzygy).
    var pts = [toPx(d[0], d[1]), toPx(d[2], d[3]), toPx(d[4], d[5])];
    var near = Math.pow(1 - Math.max(0, Math.min(1, d[11])), 6);
    thColor(THEME.text, 0.08 + near * 0.5); mgraphics.set_line_width(1);
    mgraphics.move_to(pts[0][0], pts[0][1]); mgraphics.line_to(pts[1][0], pts[1][1]); mgraphics.line_to(pts[2][0], pts[2][1]); mgraphics.close_path(); mgraphics.stroke();
    // Syzygy flash: the line through the outer bodies, extended across the display.
    if (syz) {
        var e = [0, 1, 2].filter(function (k) { return k !== syz.mid; });
        var a = toPx(syz.p[e[0]][0], syz.p[e[0]][1]), b = toPx(syz.p[e[1]][0], syz.p[e[1]][1]);
        var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= L; dy /= L;
        thLine(a[0] - dx * w, a[1] - dy * w, b[0] + dx * w, b[1] + dy * w, THEME.accent, 1, syz.life * 0.9);
        if (syz.mid >= 0 && syz.mid < 3) {
            var m = toPx(syz.p[syz.mid][0], syz.p[syz.mid][1]), rr = 5 + (1 - syz.life) * 14;
            thColor(bodyColor(syz.mid), syz.life); mgraphics.ellipse(m[0] - rr, m[1] - rr, rr * 2, rr * 2); mgraphics.stroke();
        }
    }
    // Bodies: size from mass, halo from level, a ring when struck.
    for (i = 0; i < 3; i++) {
        p = pts[i];
        var r = 2 + 2.4 * Math.pow(mass[i], 1 / 3), env = Math.min(1, (d[6 + i] || 0) * 2);
        if (env > 0.01) { thColor(bodyColor(i), env * 0.35); mgraphics.ellipse(p[0] - r - env * 6, p[1] - r - env * 6, (r + env * 6) * 2, (r + env * 6) * 2); mgraphics.fill(); }
        thColor(bodyColor(i)); mgraphics.ellipse(p[0] - r, p[1] - r, r * 2, r * 2); mgraphics.fill();
        if (rings[i] > 0.05 || grabbed === i + 1) { thColor(THEME.text, grabbed === i + 1 ? 0.9 : rings[i]); mgraphics.ellipse(p[0] - r - 2, p[1] - r - 2, r * 2 + 4, r * 2 + 4); mgraphics.stroke(); }
    }
    thText(FORMS[Math.max(0, Math.min(3, formIndex))], 5, 12, THEME.dim, THEME.size);
    if (holding) thText('Hold', w - 5, 12, THEME.handle1, THEME.size, 2);
}

// ---- grab and throw ----
function onclick(x, y) {
    if (d.length < 12) return;
    var best = 0, bestD = 14 * 14;
    for (var i = 0; i < 3; i++) {
        var p = toPx(d[i * 2], d[i * 2 + 1]), dd = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y);
        if (dd < bestD) { bestD = dd; best = i + 1; }
    }
    if (!best) return;
    grabbed = best;
    var o = toOrbit(x, y);
    outlet(0, 'grab', best, o[0], o[1]);
    mgraphics.redraw();
}
function ondrag(x, y, button) {
    if (!grabbed) return;
    if (!button) { grabbed = 0; outlet(0, 'release'); mgraphics.redraw(); return; }
    var o = toOrbit(x, y);
    outlet(0, 'drag', o[0], o[1]);
}
function onidleout() {}
