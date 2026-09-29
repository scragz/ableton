// Coagula Source display: "Drop Sample Here" when empty, the sample's waveform overview once
// loaded (from the engine; the sidecar keeps it), an analysis progress line, and the regions of
// the last played segments. Display only: a live.drop sits under it and takes the file drops.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("coagula-theme.js");

var LIFE = 1500;
var ov = null, prog = -1, recent = [];
var redrawTask = new Task(function () { mgraphics.redraw(); });

function size() {
    var s = mgraphics.size;
    if (s && s.length > 1 && s[0] > 0) return [s[0], s[1]];
    return [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]];
}

function paint() {
    var s = size(), w = s[0], h = s[1], i, now = Date.now();
    thWell(0, 0, w, h);
    if (!ov) {
        thText('Drop Sample Here', w / 2, h / 2 + 3, THEME.dim, THEME.size, 1);
    } else {
        var bins = ov.length / 2, mid = h / 2, amp = h / 2 - 3, peak = 0;
        for (i = 0; i < ov.length; i++) peak = Math.max(peak, Math.abs(ov[i]));
        var g = peak > 1e-6 ? Math.min(4, 0.95 / peak) : 1; // normalize quiet material a little
        thRect(1, Math.round(mid), w - 2, 1, THEME.line);
        thColor(THEME.line1, 0.85);
        for (var x = 0; x < w - 2; x++) {
            var b = Math.min(bins - 1, Math.floor(x * bins / (w - 2)));
            var lo = ov[2 * b] * g, hi = ov[2 * b + 1] * g;
            var y0 = mid - hi * amp, y1 = mid - lo * amp;
            mgraphics.rectangle(1 + x, y0, 1, Math.max(1, y1 - y0));
        }
        mgraphics.fill();
    }
    // last played segments, fading
    for (i = 0; i < recent.length; i++) {
        var r = recent[i], age = (now - r.t) / LIFE;
        if (age >= 1) continue;
        var x0 = 1 + r.a * (w - 2), ww = Math.max(1.5, r.l * (w - 2));
        thRect(x0, 1, ww, h - 2, r.kind === 2 ? THEME.dim : THEME.handle1, 0.45 * (1 - age));
    }
    if (prog >= 0) {
        thRect(1, h - 3, (w - 2), 2, THEME.line);
        thRect(1, h - 3, (w - 2) * Math.min(1, prog), 2, THEME.accent);
    }
    var live = false;
    for (i = 0; i < recent.length; i++) if (now - recent[i].t < LIFE) live = true;
    if (live) redrawTask.schedule(40);
}

function overview() { ov = arrayfromargs(arguments); if (ov.length < 4) ov = null; mgraphics.redraw(); }
function clear() { ov = null; recent = []; prog = -1; mgraphics.redraw(); }
function played(a, l, kind) {
    recent.push({ a: a, l: l, kind: kind, t: Date.now() });
    if (recent.length > 24) recent.shift();
    if (!redrawTask.running) redrawTask.schedule(15);
}
function progress(f) { prog = Number(f); mgraphics.redraw(); }
