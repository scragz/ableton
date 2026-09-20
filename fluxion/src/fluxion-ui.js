/* eslint-disable no-var, no-unused-vars, prefer-rest-params -- Max invokes global callbacks and requires ES5 syntax. */
// Compact, single-channel Max jsui editor. ES5 for Max 8 / bundled Max compatibility.
autowatch = 1;
inlets = 1;
outlets = 2; // configuration / panic
include("fluxion-rhythm.js");
include("fluxion-state.js");
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

include("fluxion-theme.js");

var state = freshState();
var playStep = -1;
var lastInput = null; // last upstream note-on, shown so routing problems are visible
var isPlaying = false;
var controls = [];
var drag = null;
var W = 1100, H = 169;
// Sections: [x, y, w, h, header]; dividers between them come from thSections(). The lower row is
// untitled: the curve graph at left, then the step parameters and output routing in fieldsets.
var SECTIONS = [[2, 0, 638, 45, "Steps"], [644, 0, 146, 45, "Loop"], [794, 0, 304, 45, "Input"],
    [2, 47, 250, 121, ""], [256, 47, 842, 121, ""]];
var GROUP_Y = 56, GROUP_H = 109, ROW_Y = 66, ROW_STEP = 19;
// Fieldsets: [x, label width, field width, keys, legend, frame width]. Rows are ROW_STEP apart.
var GROUPS = [[264, 78, 72, ["density", "length", "divisions", "curve", "differential"], "Rhythm", 170],
    [442, 70, 66, ["phase", "compress", "humanize", "gate"], "Timing", 152],
    [602, 78, 72, ["probability", "probabilityMode", "maskCount", "mask", "maskShift"], "Chance", 170]];
var OUTPUT = [780, 310];
var DISPLAY = {length: "Length", compress: "Compress", gate: "Gate", probability: "Chance", maskCount: "Mask Mute", mask: "Mask Every", maskShift: "Mask Shift"};
var graph = [10, 78, 234, 66];
var PLOT_INSET = 4; // px between the well edge and beat 1 / the last beat

function changed(sound) {
    notifyclients();
    mgraphics.redraw();
    if (sound) outlet(0, "configure", JSON.stringify(state));
}

function loadbang() { outlet(0, "configure", JSON.stringify(state)); mgraphics.redraw(); }
function bang() { loadbang(); }
function getvalueof() { return encodeState(state); }
function setvalueof() {
    var args = arrayfromargs(arguments);
    try { state = decodeState(args); changed(true); }
    catch (e) {
        // A new device instance has nothing to recall; keep defaults but show what arrived.
        post("Fluxion state: kept current settings (" + e.message + "): " + args.join(" ").slice(0, 120) + "\n");
    }
}
function playing(step, active) {
    playStep = step;
    isPlaying = !!active;
    mgraphics.redraw();
}

function input(pitch, velocity) {
    lastInput = pitch;
    mgraphics.redraw();
}

function hit(id, x, y, w, h, data) {
    controls.push({id: id, x: x, y: y, w: w, h: h, data: data});
}
function button(id, label, x, y, w, on, data) {
    thButton(x, y, w, 18, label, on);
    hit(id, x, y, w, 18, data);
}
function valueLabel(value, field) {
    if (field === "mask") return value ? String(value) : "Off";
    if (field === "curve" || field === "differential") return Number(value).toFixed(2);
    return String(value);
}
// An inline field: label to the left, live.numbox-style box to the right. The hit region covers both.
function inlineField(id, label, value, x, y, labelWidth, w, data, color) {
    thText(label, x, y + 12.5, THEME.label);
    thField(x + labelWidth, y, w, 18, value, color);
    hit(id, x, y, labelWidth + w, 18, data);
}
function specFor(key) {
    for (var i = 0; i < STEP_FIELDS.length; i++) if (STEP_FIELDS[i][0] === key) return STEP_FIELDS[i];
    return null;
}

function paint() {
    controls = [];
    thSections(SECTIONS);
    for (var fs = 0; fs < GROUPS.length; fs++) thFieldset(GROUPS[fs][0], GROUP_Y, GROUPS[fs][5], GROUP_H, GROUPS[fs][4]);
    thFieldset(OUTPUT[0], GROUP_Y, OUTPUT[1], GROUP_H, "Output");
    var s = state.steps[state.selected];

    // Steps: select; loop range shown by fill, playhead as a bar, mute as a strike-through.
    for (var i = 0; i < 16; i++) {
        var x = 10 + i * 26;
        var selected = i === state.selected;
        var inLoop = i >= state.loopStart && i <= state.loopEnd;
        thRect(x, 18, 24, 22, selected ? THEME.accent : inLoop ? THEME.control : THEME.well);
        thBoxText(i + 1, x, 18, 24, 22, selected ? THEME.ontext : inLoop ? THEME.text : THEME.dim);
        if (!state.steps[i].enabled) thLine(x + 4, 36, x + 20, 22, selected ? THEME.ontext : THEME.dim);
        if (isPlaying && i === playStep) thRect(x, 38, 24, 2, THEME.handle1);
        hit("step", x, 18, 24, 22, i);
    }
    button("all", "All", 432, 20, 36, state.all);
    button("enabled", s.enabled ? "Step On" : "Step Off", 472, 20, 62, !s.enabled);
    button("mute", "Mute", 538, 20, 44, state.muted);
    button("panic", "Panic", 586, 20, 46, false);

    inlineField("loopStart", "First", state.loopStart + 1, 652, 20, 28, 34, ["loopStart", "Loop first", 0, 15, 1]);
    inlineField("loopEnd", "Last", state.loopEnd + 1, 720, 20, 26, 34, ["loopEnd", "Loop last", 0, 15, 1]);

    inlineField("input", "Note In", state.input + (lastInput === null ? "" : " " + lastInput), 802, 20, 44, 90, ["input"]);
    thText(isPlaying ? "Step " + (playStep + 1) : "Stopped", 1090, 33, isPlaying ? THEME.handle1 : THEME.dim, THEME.readout, 2);

    // Curve: selected step and pattern, the time-warp graph, and where its hits land.
    var mode = CURVE_MODES[curveModeIndex(s)];
    thText(thFit("Step " + (state.selected + 1) + " · " + mode.label + " " + mode.name, 234), 10, 60, THEME.text);
    thWell(graph[0], graph[1], graph[2], graph[3] + 12);
    // Plot inside the well with a small inset so beat 1 (x = 0) and the last beat aren't flush with
    // the well's edge, where the first hit tick and curve start were getting lost.
    var px0 = graph[0] + PLOT_INSET, pw = graph[2] - PLOT_INSET * 2;
    var gridCount = s.divisions > 1 ? s.divisions : 4;
    for (var grid = 0; grid <= gridCount; grid++) {
        var gx = Math.round(px0 + pw * grid / gridCount) + 0.5;
        thLine(gx, graph[1], gx, graph[1] + graph[3], THEME.line);
    }
    for (var gridY = 1; gridY < gridCount; gridY++) {
        var gy = Math.round(graph[1] + graph[3] * gridY / gridCount) + 0.5;
        thLine(px0, gy, px0 + pw, gy, THEME.line);
    }
    thColor(THEME.line1);
    mgraphics.set_line_width(1.5);
    for (var point = 0; point <= 120; point++) {
        var px = px0 + point / 120 * pw;
        var py = graph[1] + (1 - curvePosition(point / 120, s)) * graph[3];
        if (!point) mgraphics.move_to(px, py); else mgraphics.line_to(px, py);
    }
    mgraphics.stroke();
    var hits = s.enabled ? generateHits(s, seedFor(0, state.selected, 0)) : [];
    for (var h = 0; h < hits.length; h++) {
        if (hits[h].lane === 0) thRect(px0 + hits[h].at / s.length * pw - 0.75, graph[1] + graph[3] + 3, 1.5, 6, THEME.line1);
    }
    hit("curve", graph[0], graph[1], graph[2], graph[3] + 12, ["curve", "Curve", -5, 5, 0.05]);

    // Step parameters, grouped.
    for (var g = 0; g < GROUPS.length; g++) {
        var gx0 = GROUPS[g][0] + 8, lw = GROUPS[g][1], fw = GROUPS[g][2], keys = GROUPS[g][3];
        for (var r = 0; r < keys.length; r++) {
            var key = keys[r], fy = ROW_Y + r * ROW_STEP, spec = specFor(key);
            if (key === "divisions") inlineField("multiCurve", "Multi Curve", mode.label, gx0, fy, lw, fw, ["multiCurve", "Multi curve", 0, CURVE_MODES.length - 1, 1]);
            else if (key === "probabilityMode") inlineField("probabilityMode", "Probability", s.probabilityMode, gx0, fy, lw, fw, ["probabilityMode"]);
            else inlineField("parameter", DISPLAY[key] || spec[1], valueLabel(s[key], key), gx0, fy, lw, fw, spec);
        }
    }

    // Output lanes: each lane's per-step mode (aux only), then Channel / Note / Velocity.
    var cols = ["channels", "notes", "velocities"], heads = ["Mode", "Ch", "Note", "Vel"];
    for (var hd = 0; hd < 4; hd++) thText(heads[hd], hd ? 908 + (hd - 1) * 58 + 27 : 862, ROW_Y + 12.5, THEME.label, THEME.size, 1);
    for (var lane = 0; lane < 3; lane++) {
        var y = ROW_Y + (lane + 1) * ROW_STEP;
        thText(["Main", "Aux 1", "Aux 2"][lane], 788, y + 12.5, THEME.label);
        if (lane) inlineField("aux" + lane, "", s["aux" + lane], 824, y, 0, 76, ["aux" + lane]);
        else thText("\u2014", 862, y + 12.5, THEME.dim, THEME.size, 1);
        for (var column = 0; column < 3; column++) {
            var col = cols[column];
            var xx = 908 + column * 58;
            if (col !== "channels" && state.input !== "OFF") {
                // Pitch and velocity come from upstream MIDI at gate time.
                thField(xx, y, 54, 18, "In", THEME.dim);
                continue;
            }
            thField(xx, y, 54, 18, state[col][lane]);
            hit("route", xx, y, 54, 18, [col, lane, col === "notes" ? 0 : 1, col === "channels" ? 16 : 127, 1]);
        }
    }
}

function findControl(x, y) {
    for (var i = controls.length - 1; i >= 0; i--) {
        var c = controls[i];
        if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return c;
    }
    return null;
}
function editStep(key, value) {
    for (var i = 0; i < 16; i++) if (state.all || i === state.selected) state.steps[i][key] = value;
    changed(true);
}
function editCurveMode(index) {
    var mode = CURVE_MODES[Math.max(0, Math.min(CURVE_MODES.length - 1, Math.round(index)))];
    for (var i = 0; i < 16; i++) if (state.all || i === state.selected) {
        state.steps[i].divisions = mode.divisions;
        state.steps[i].curveVariant = mode.variant;
    }
    changed(true);
}
function currentValue(c) {
    if (c.id === "multiCurve") return curveModeIndex(state.steps[state.selected]);
    if (c.id === "route") return state[c.data[0]][c.data[1]];
    if (c.id === "loopStart" || c.id === "loopEnd") return state[c.id];
    if (c.id === "aux1" || c.id === "aux2") return AUX_MODES.indexOf(state.steps[state.selected][c.id]);
    return state.steps[state.selected][c.data[0]];
}
function assign(c, value) {
    if (c.id === "multiCurve") { editCurveMode(value); return; }
    var data = c.data;
    if (c.id === "aux1" || c.id === "aux2") {
        editStep(c.id, AUX_MODES[Math.max(0, Math.min(AUX_MODES.length - 1, Math.round(value)))]);
        return;
    }
    value = Math.round(Math.max(data[2], Math.min(data[3], value)) / data[4]) * data[4];
    if (c.id === "route") {
        if (data[0] === "channels") {
            // Swap assignments so Main / Aux 1 / Aux 2 always remain distinct.
            for (var i = 0; i < 3; i++) if (i !== data[1] && state.channels[i] === value)
                state.channels[i] = state.channels[data[1]];
        }
        state[data[0]][data[1]] = value;
        changed(true);
    } else if (c.id === "loopStart" || c.id === "loopEnd") {
        state[c.id] = value;
        if (state.loopStart > state.loopEnd) state[c.id === "loopStart" ? "loopEnd" : "loopStart"] = value;
        changed(true);
    } else {
        if (data[0] === "mask" && value === 1) value = currentValue(c) > 1 ? 0 : 2;
        editStep(data[0], value);
    }
}
function onclick(x, y, buttonState, cmd, shift, caps, option) {
    var c = findControl(x, y);
    if (!c) return;
    if (c.id === "step") {
        if (option) { state.steps[c.data].enabled = !state.steps[c.data].enabled; changed(true); }
        else { state.selected = c.data; changed(false); }
    } else if (c.id === "all") { state.all = !state.all; changed(false); }
    else if (c.id === "enabled") editStep("enabled", !state.steps[state.selected].enabled);
    else if (c.id === "mute") { state.muted = !state.muted; changed(true); }
    else if (c.id === "panic") {
        state.muted = true;
        outlet(1, "bang");
        changed(true);
    } else if (c.id === "input") {
        state.input = INPUT_MODES[(INPUT_MODES.indexOf(state.input) + 1) % INPUT_MODES.length];
        changed(true);
    } else if (c.id === "probabilityMode") editStep("probabilityMode", state.steps[state.selected].probabilityMode === "Step" ? "Trigger" : "Step");
    else drag = {control: c, x: x, y: y, value: currentValue(c), moved: false, shift: shift};
}
function ondrag(x, y, buttonState, cmd, shift) {
    if (!drag) return;
    var c = drag.control;
    var delta = drag.y - y + (c.id === "curve" ? (x - drag.x) * 0.4 : 0);
    if (Math.abs(delta) > 2) drag.moved = true;
    if (!buttonState) {
        if (!drag.moved && c.id !== "curve") {
            var increment = c.id === "aux1" || c.id === "aux2" ? 1 : c.data[4];
            // Left half decrements; right half increments. Shift-click reverses.
            var direction = (drag.x < c.x + c.w / 2 ? -1 : 1) * (drag.shift ? -1 : 1);
            assign(c, drag.value + direction * increment);
        }
        drag = null;
        return;
    }
    if (drag.moved) {
        var scale = c.id === "curve" ? 0.04 : c.id === "aux1" || c.id === "aux2" ? 0.25 : c.data[4] * 0.5;
        assign(c, drag.value + delta * scale * (shift ? 0.1 : 1));
    }
}
function ondblclick(x, y) {
    var c = findControl(x, y);
    drag = null;
    if (!c) return;
    if (c.id === "multiCurve") editCurveMode(0);
    else if (c.id === "parameter" || c.id === "curve") editStep(c.data[0], DEFAULT_STEP[c.data[0]]);
    else if (c.id === "aux1" || c.id === "aux2") editStep(c.id, "OFF");
}
