/* eslint-disable no-var, no-unused-vars, prefer-rest-params -- Max invokes global callbacks and requires ES5 syntax. */
// Background chrome for the Fluxion face, plus the two controls Live has no widget
// for: the 16-step row and the temporal curve graph.
//
// It owns nothing. Every value in the device is a Live parameter; this script is
// ignoreclick background art that draws from a mirror sent by fluxion-control.js
// and reports mouse gestures back as intentions, which the control turns into
// parameter writes.
autowatch = 1;
inlets = 1;
outlets = 1; // face events for the control script
include("fluxion-rhythm.js");
include("fluxion-state.js");
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

include("fluxion-theme.js");

var view = {selected: 0, page: 0, loopStart: 0, loopEnd: 0, label: "1 Normal",
    enabled: [], step: null};
for (var initStep = 0; initStep < 16; initStep++) view.enabled.push(true);
var playStep = -1;
var lastInput = null; // last upstream note-on, shown so routing problems are visible
var isPlaying = false;
var controls = [];
var drag = null;
var SECTIONS = [[2, 0, 638, 45, "Steps"], [644, 0, 146, 45, "Loop"], [794, 0, 304, 45, "Input"],
    [2, 47, 250, 121, ""], [256, 47, 842, 121, ""]];
var GROUP_Y = 56, GROUP_H = 109, ROW_Y = 66, ROW_STEP = 19;
var GROUPS = [[264, 78, ["Density", "Length", "Multi Curve", "Curve", "Differential"], "Rhythm", 170],
    [442, 70, ["Phase", "Compress", "Humanize", "Gate"], "Timing", 152],
    [602, 78, ["Chance", "Probability", "Mask Mute", "Mask Every", "Mask Shift"], "Chance", 170]];
var OUTPUT = [780, 310];
// The curve fills the well corner to corner: a linear curve runs from the bottom
// left to the top right of the box, with nothing floating above the floor. The
// inset is half the stroke width, so the line sits inside the well rather than
// straddling its edge. The hit marks stay inside the well, along its floor, where
// they read as part of the graph rather than as loose marks at the device edge.
var graph = [10, 78, 234, 78];
var PLOT_INSET = 1;
var TICKS_H = 6, TICKS_Y = 78 + 78 - TICKS_H - 2;
var MOD_SECTIONS = [[2, 47, 548, 121, ""], [552, 47, 546, 121, ""]];
var MOD_COLUMNS = [18, 288];
var MOD_ROWS = 4;
var SLOT_X = [648, 812, 902];

function mirror(json) {
    try { view = JSON.parse(json); } catch (e) { post("Fluxion face: " + e.message + "\n"); return; }
    mgraphics.redraw();
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
// Mouse events arrive from the catcher panels in face coordinates (fluxion-hit.js).
function click(x, y, option, shift) { onclick(x, y, 1, 0, shift, 0, option); }
function mousedrag(x, y, button, shift) { ondrag(x, y, button, 0, shift); }
function dblclick(x, y) { ondblclick(x, y); }

function hit(id, x, y, w, h, data) {
    controls.push({id: id, x: x, y: y, w: w, h: h, data: data});
}
function fieldLabel(label, x, y) { thText(label, x, y + 12.5, THEME.label); }

function paint() {
    controls = [];
    thSections(SECTIONS.slice(0, 3).concat(view.page ? MOD_SECTIONS : SECTIONS.slice(3)));
    paintTop();
    if (view.page) paintMod(); else paintEdit();
}

function paintTop() {
    for (var i = 0; i < 16; i++) {
        var x = 10 + i * 26;
        var selected = i === view.selected;
        var inLoop = i >= view.loopStart && i <= view.loopEnd;
        thRect(x, 18, 24, 22, selected ? THEME.accent : inLoop ? THEME.control : THEME.well);
        thBoxText(i + 1, x, 18, 24, 22, selected ? THEME.ontext : inLoop ? THEME.text : THEME.dim);
        if (view.enabled[i] === false) thLine(x + 4, 36, x + 20, 22, selected ? THEME.ontext : THEME.dim);
        if (isPlaying && i === playStep) thRect(x, 38, 24, 2, THEME.handle1);
        hit("step", x, 18, 24, 22, i);
    }
    fieldLabel("First", 652, 20);
    fieldLabel("Last", 720, 20);
    fieldLabel("Note In", 802, 20);
    if (lastInput !== null) thText(String(lastInput), 996, 33, THEME.dim);
    thText(isPlaying ? "Step " + (playStep + 1) : "Stopped", 1090, 33,
        isPlaying ? THEME.handle1 : THEME.dim, THEME.readout, 2);
}

function paintEdit() {
    for (var fs = 0; fs < GROUPS.length; fs++)
        thFieldset(GROUPS[fs][0], GROUP_Y, GROUPS[fs][4], GROUP_H, GROUPS[fs][3]);
    thFieldset(OUTPUT[0], GROUP_Y, OUTPUT[1], GROUP_H, "Output");
    var s = view.step;
    thText(thFit("Step " + (view.selected + 1) + " · " + view.label, 234), 10, 60, THEME.text);
    thWell(graph[0], graph[1], graph[2], graph[3]);
    var px0 = graph[0] + PLOT_INSET, pw = graph[2] - PLOT_INSET * 2;
    var py0 = graph[1] + PLOT_INSET, ph = graph[3] - PLOT_INSET * 2;
    var gridCount = s && s.divisions > 1 ? s.divisions : 4;
    for (var grid = 0; grid <= gridCount; grid++)
        thLine(Math.round(px0 + pw * grid / gridCount) + 0.5, graph[1],
            Math.round(px0 + pw * grid / gridCount) + 0.5, graph[1] + graph[3], THEME.line);
    for (var gridY = 1; gridY < gridCount; gridY++)
        thLine(graph[0], Math.round(py0 + ph * gridY / gridCount) + 0.5,
            graph[0] + graph[2], Math.round(py0 + ph * gridY / gridCount) + 0.5, THEME.line);
    if (s) {
        thColor(THEME.line1);
        mgraphics.set_line_width(1.5);
        for (var point = 0; point <= 120; point++) {
            var px = px0 + point / 120 * pw;
            var py = py0 + (1 - curvePosition(point / 120, s)) * ph;
            if (!point) mgraphics.move_to(px, py); else mgraphics.line_to(px, py);
        }
        mgraphics.stroke();
        var hits = s.enabled ? generateHits(s, seedFor(0, view.selected, 0)) : [];
        for (var h = 0; h < hits.length; h++)
            if (hits[h].lane === 0)
                thRect(px0 + hits[h].at / s.length * pw - 0.75, TICKS_Y, 1.5, TICKS_H, THEME.line1);
    }
    hit("curve", graph[0], graph[1], graph[2], graph[3], null);

    for (var g = 0; g < GROUPS.length; g++)
        for (var r = 0; r < GROUPS[g][2].length; r++)
            fieldLabel(GROUPS[g][2][r], GROUPS[g][0] + 8, ROW_Y + r * ROW_STEP);

    var heads = ["Mode", "Ch", "Note", "Vel"];
    for (var hd = 0; hd < 4; hd++)
        thText(heads[hd], hd ? 908 + (hd - 1) * 58 + 27 : 862, ROW_Y + 12.5, THEME.label, THEME.size, 1);
    for (var lane = 0; lane < 3; lane++) {
        var y = ROW_Y + (lane + 1) * ROW_STEP;
        thText(["Main", "Aux 1", "Aux 2"][lane], 788, y + 12.5, THEME.label);
        if (!lane) thText("—", 862, y + 12.5, THEME.dim, THEME.size, 1);
    }
}

function paintMod() {
    thFieldset(10, GROUP_Y, 530, GROUP_H, "Global Offsets");
    thFieldset(560, GROUP_Y, 530, GROUP_H, "Mod Slots");
    for (var i = 0; i < GLOBAL_MODS.length; i++)
        fieldLabel(GLOBAL_MODS[i][1], MOD_COLUMNS[Math.floor(i / MOD_ROWS)], ROW_Y + (i % MOD_ROWS) * ROW_STEP);
    var heads = ["Target", "Step", "Amount"];
    for (var h = 0; h < 3; h++) thText(heads[h], SLOT_X[h], ROW_Y + 12.5, THEME.label);
    for (var n = 0; n < MOD_SLOTS; n++)
        thText(String(n + 1), 572, ROW_Y + (n + 1) * ROW_STEP + 12.5, THEME.label);
}

function findControl(x, y) {
    for (var i = controls.length - 1; i >= 0; i--) {
        var c = controls[i];
        if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return c;
    }
    return null;
}
function onclick(x, y, buttonState, cmd, shift, caps, option) {
    var c = findControl(x, y);
    if (!c) return;
    if (c.id === "step") {
        if (option) outlet(0, "stepenabled", c.data);
        else outlet(0, "select", c.data);
    } else if (view.step) {
        drag = {x: x, y: y, value: Number(view.step.curve), moved: false};
    }
}
function ondrag(x, y, buttonState, cmd, shift) {
    if (!drag) return;
    var delta = drag.y - y + (x - drag.x) * 0.4;
    if (Math.abs(delta) > 2) drag.moved = true;
    if (!buttonState) { drag = null; return; }
    if (drag.moved) outlet(0, "curve", drag.value + delta * 0.04 * (shift ? 0.1 : 1));
}
function ondblclick(x, y) {
    var c = findControl(x, y);
    drag = null;
    if (c && c.id === "curve") outlet(0, "curve", DEFAULT_STEP.curve);
}
