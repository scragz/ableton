// Gate openness indicator after the Natural Gate's LED: a column of diamonds that fills as the gate opens.
// Fed by a snapshot~ tap of the engine's gate level.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("soma-theme.js");
var gate = 0, shownGate = 0, lastTime = new Date().getTime();
var clock = new Task(advance, this);
clock.interval = 33;
clock.repeat();

function msg_float(v) { gate = v; }
function msg_int(v) { gate = v; }

function advance() {
    var now = new Date().getTime(), dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    var next = shownGate + (gate - shownGate) * Math.min(1, dt * 18);
    // Skip redraws once the display has settled.
    if (Math.abs(next - shownGate) < 0.001) return;
    shownGate = next;
    mgraphics.redraw();
}

function paint() {
    var size = mgraphics.size, w = size[0], h = size[1];
    var count = Math.max(1, Math.floor(h / 12)), cx = w / 2, s = Math.min(w / 2 - 0.5, 4);
    thRect(0, 0, w, h, THEME.surface);
    for (var k = 0; k < count; k++) {
        var y = h - 6 - k * (h - 12) / Math.max(1, count - 1);
        var lit = Math.max(0, Math.min(1, (shownGate - k / count) * count));
        mgraphics.new_path();
        mgraphics.move_to(cx, y - s);
        mgraphics.line_to(cx + s, y);
        mgraphics.line_to(cx, y + s);
        mgraphics.line_to(cx - s, y);
        mgraphics.close_path();
        thColor(THEME.well);
        mgraphics.fill_preserve();
        thColor(THEME.accent, lit);
        mgraphics.fill_preserve();
        thColor(THEME.line);
        mgraphics.set_line_width(1);
        mgraphics.stroke();
    }
}

function freebang() {
    clock.cancel();
}
