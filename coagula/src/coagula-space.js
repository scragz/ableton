// Coagula Space: scatter of the active variant's active bucket in the current axis mode
// (x = pitch or flatness, y = centroid, both normalized to the coagula), the target crosshair and
// the last played segments. Display only: dragging writes Target X / Y through their dials, so
// automation, MIDI mapping and Push all go through the parameters.
autowatch = 1;
inlets = 1;
outlets = 1; // tx <v> / ty <v> -> the dials
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("coagula-theme.js");

var PAD = 4, LIFE = 2000;
var xs = [], ys = [], total = 0, axisMode = 0, tx = 0.5, ty = 0.5, recent = [], layer = null, dirty = true;
var ranges = null;
var redrawTask = new Task(function () { mgraphics.redraw(); });

function size() {
    var s = mgraphics.size;
    if (s && s.length > 1 && s[0] > 0) return [s[0], s[1]];
    return [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]];
}
function toPx(x, y) { var s = size(); return [PAD + x * (s[0] - 2 * PAD), s[1] - PAD - y * (s[1] - 2 * PAD)]; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Points are drawn once into an offscreen layer and blitted; only overlays redraw per frame.
function buildLayer() {
    var s = size();
    try {
        var g = new MGraphics(s[0], s[1]);
        g.init();
        var c = THEME.line1;
        g.set_source_rgba(c[0], c[1], c[2], xs.length > 2000 ? 0.35 : 0.6);
        for (var i = 0; i < xs.length; i++) {
            var p = toPx(clamp(xs[i], -0.02, 1.02), clamp(ys[i], -0.02, 1.02));
            g.rectangle(p[0] - 0.75, p[1] - 0.75, 1.5, 1.5);
        }
        g.fill();
        layer = new Image(g);
    } catch (e) { layer = null; }
    dirty = false;
}

function paint() {
    var s = size(), i, p;
    thWell(0, 0, s[0], s[1]);
    // quarter grid
    for (i = 1; i < 4; i++) {
        thRect(Math.round(PAD + i * (s[0] - 2 * PAD) / 4), PAD, 1, s[1] - 2 * PAD, THEME.line);
        thRect(PAD, Math.round(PAD + i * (s[1] - 2 * PAD) / 4), s[0] - 2 * PAD, 1, THEME.line);
    }
    if (dirty) buildLayer();
    if (layer) { mgraphics.image_surface_draw(layer); }
    else if (xs.length) {
        thColor(THEME.line1, 0.5);
        for (i = 0; i < xs.length; i++) { p = toPx(clamp(xs[i], 0, 1), clamp(ys[i], 0, 1)); mgraphics.rectangle(p[0] - 0.75, p[1] - 0.75, 1.5, 1.5); }
        mgraphics.fill();
    }
    // recently played: voiced/main at their point, unvoiced along the left edge, silence as a ring
    var now = Date.now();
    for (i = 0; i < recent.length; i++) {
        var r = recent[i], age = (now - r.t) / LIFE;
        if (age >= 1) continue;
        var a = 1 - age;
        if (r.kind === 0) { p = toPx(clamp(r.x, 0, 1), clamp(r.y, 0, 1)); thRect(p[0] - 2, p[1] - 2, 4, 4, THEME.handle1, a); }
        else if (r.kind === 1) { p = toPx(0, clamp(r.y, 0, 1)); thRect(1, p[1] - 1.5, 5, 3, THEME.handle1, a); }
        else { thColor(THEME.dim, a); mgraphics.set_line_width(1); mgraphics.ellipse(s[0] - 11, 5, 6, 6); mgraphics.stroke(); }
    }
    // target crosshair
    p = toPx(tx, ty);
    thLine(p[0], PAD, p[0], s[1] - PAD, THEME.handle2, 1, 0.5);
    thLine(PAD, p[1], s[0] - PAD, p[1], THEME.handle2, 1, 0.5);
    thColor(THEME.handle2); mgraphics.set_line_width(1.5);
    mgraphics.ellipse(p[0] - 4, p[1] - 4, 8, 8); mgraphics.stroke();
    // axis names, and the empty state
    thText(axisMode ? 'Flatness' : 'Pitch', s[0] - PAD - 2, s[1] - PAD - 3, THEME.dim, THEME.size, 2);
    thText('Brightness', PAD + 2, PAD + 10, THEME.dim, THEME.size, 0);
    if (!xs.length) thText(total > 0 ? '' : 'No segments', s[0] / 2, s[1] / 2 + 3, THEME.dim, THEME.size, 1);
    else thText(total > xs.length ? xs.length + ' of ' + total : String(total), s[0] - PAD - 2, PAD + 10, THEME.dim, THEME.size, 2);
    var live = false;
    for (i = 0; i < recent.length; i++) if (now - recent[i].t < LIFE) live = true;
    if (live) redrawTask.schedule(40);
}

function points(name, shown, all, ax) {
    var d = new Dict(String(name));
    xs = d.get('x') || []; ys = d.get('y') || [];
    if (typeof xs === 'number') xs = [xs];
    if (typeof ys === 'number') ys = [ys];
    total = all; axisMode = ax; recent = []; dirty = true;
    mgraphics.redraw();
}
function played(x, y, kind, dur) {
    recent.push({ x: x, y: y, kind: kind, t: Date.now() });
    if (recent.length > 24) recent.shift();
    if (!redrawTask.running) redrawTask.schedule(15);
}
function target(x, y) { tx = clamp(x, 0, 1); ty = clamp(y, 0, 1); mgraphics.redraw(); }
function axis(a) { axisMode = a ? 1 : 0; mgraphics.redraw(); }
function clear() { xs = []; ys = []; total = 0; recent = []; dirty = true; mgraphics.redraw(); }
function onresize() { dirty = true; mgraphics.redraw(); }

function drag(x, y) {
    var s = size();
    var nx = clamp((x - PAD) / (s[0] - 2 * PAD), 0, 1), ny = clamp((s[1] - PAD - y) / (s[1] - 2 * PAD), 0, 1);
    outlet(0, 'tx', nx * 100); // the dials show 0..100 %
    outlet(0, 'ty', ny * 100);
}
function onclick(x, y) { drag(x, y); }
function ondrag(x, y, but) { if (but) drag(x, y); }
