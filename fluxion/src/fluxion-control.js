/* eslint-disable no-var, no-unused-vars -- Max invokes global message handlers and requires ES5 syntax. */
// Bank visibility, the ALL fan-out, and the face's draw mirror.
//
// It owns no values. Every value in the device is a Live parameter, so this script
// only decides which of the 16 per-step banks is on screen, copies an edit across
// banks when ALL is on, and hands the face jsui the little it needs to draw.
autowatch = 1;
inlets = 1;
outlets = 2; // parameter writes are done directly; outlet 1 is the draw mirror
include("fluxion-rhythm.js");
include("fluxion-state.js");

var BANKS = 16;
var rosters = [];      // rosters[bank] = widget ids, in STEP_PARAMS order
var modWidgets = [];
var steps = [];        // mirror of every bank's values, by widget key
var selected = 0, page = 0, loopStart = 0, loopEnd = 0;
var pending = null;

for (var b = 0; b < BANKS; b++) steps.push({});

function named(patcher, name) { return patcher.getnamed(String(name)); }

function roster() {
    var args = arrayfromargs(arguments);
    var bank = Math.round(Number(args[0]));
    if (bank >= 0 && bank < BANKS) rosters[bank] = args.slice(1);
    applyBanks(this.patcher);
}
function modpage() { modWidgets = arrayfromargs(arguments); applyBanks(this.patcher); }

// Only the selected bank is on screen, and only while the edit page is showing.
function applyBanks(patcher) {
    for (var i = 0; i < BANKS; i++) {
        var ids = rosters[i];
        if (!ids) continue;
        var show = !page && i === selected;
        for (var j = 0; j < ids.length; j++) {
            var o = named(patcher, ids[j]);
            if (o) o.message("hidden", show ? 0 : 1);
        }
    }
    for (var m = 0; m < modWidgets.length; m++) {
        var w = named(patcher, modWidgets[m]);
        if (w) w.message("hidden", page ? 0 : 1);
    }
}

// `bank <index> <key> <value>`: a per-step parameter moved, by hand or by a
// modulator. Mirror it for drawing, and copy it across the other banks when ALL is
// on. Writing a parameter is a real Live edit, so a fan-out costs 15 undo steps --
// that is the price of ALL now that every step is separately automatable.
function bank(index, key, value) {
    var i = Math.round(Number(index));
    if (!(i >= 0 && i < BANKS)) return;
    steps[i][String(key)] = Number(value);
    if (i === selected) mirror();
    if (!globals.w_all || i !== selected) return;
    var slot = rosters[i] ? rosters[i].indexOf("s" + i + "_" + key) : -1;
    if (slot < 0) return;
    for (var other = 0; other < BANKS; other++) {
        if (other === i || !rosters[other]) continue;
        var o = named(this.patcher, rosters[other][slot]);
        if (o) o.message(Number(value));
    }
}

var globals = {};
function global(id, value) {
    var name = String(id), v = Number(value);
    globals[name] = v;
    if (name === "w_selected") { selected = Math.round(v) - 1; applyBanks(this.patcher); }
    else if (name === "w_page") { page = Math.round(v); applyBanks(this.patcher); }
    else if (name === "w_loopstart") loopStart = Math.round(v) - 1;
    else if (name === "w_loopend") loopEnd = Math.round(v) - 1;
    else if (name === "w_input") inertRouting(this.patcher, Math.round(v) === 0);
    mirror();
}

// In LATCH/HOLD the pitch and velocity come from upstream MIDI at gate time.
function inertRouting(patcher, routable) {
    for (var lane = 0; lane < 3; lane++) {
        var n = named(patcher, "w_note" + lane), v = named(patcher, "w_vel" + lane);
        if (n) n.message("ignoreclick", routable ? 0 : 1);
        if (v) v.message("ignoreclick", routable ? 0 : 1);
    }
}

// --- face events ------------------------------------------------------------
function select(index) {
    var o = named(this.patcher, "w_selected");
    if (o) o.message(Math.round(Number(index)) + 1);
}
function stepenabled(index) {
    var i = Math.round(Number(index));
    if (!(i >= 0 && i < BANKS) || !rosters[i]) return;
    var id = "s" + i + "_enabled", o = named(this.patcher, id);
    if (o) o.message(steps[i].enabled ? 0 : 1);
}
function curve(value) {
    var spec = fieldSpec("curve");
    var next = clampField(spec, value);
    var o = named(this.patcher, "s" + selected + "_curve");
    if (o) o.message(next);
}

// --- drawing ----------------------------------------------------------------
// Coalesced: under modulation the parameters move at control rate and the face
// only has to keep up with the screen.
function mirror() {
    if (!pending) pending = new Task(flush, this);
    pending.cancel();
    pending.schedule(40);
}
function flush() {
    var s = steps[selected] || {};
    var mode = CURVE_MODES[Math.max(0, Math.min(CURVE_MODES.length - 1, Math.round(s.curvemode || 0)))];
    var view = {
        selected: selected, page: page, loopStart: loopStart, loopEnd: loopEnd,
        label: mode.label + " " + mode.name, enabled: [],
        step: {
            density: s.density, length: s.length, curve: s.curve,
            divisions: mode.divisions, curveVariant: mode.variant,
            differential: s.differential, phase: s.phase, compress: s.compress,
            humanize: s.humanize, gate: s.gate, probability: s.probability,
            probabilityMode: Math.round(s.probmode || 0) ? "Step" : "Trigger",
            maskCount: s.maskcount, mask: s.mask, maskShift: s.maskshift,
            aux1: "OFF", aux2: "OFF", enabled: !Math.round(s.enabled || 0)
        }
    };
    for (var i = 0; i < BANKS; i++) view.enabled.push(!Math.round(steps[i].enabled || 0));
    outlet(1, "mirror", JSON.stringify(view));
}
