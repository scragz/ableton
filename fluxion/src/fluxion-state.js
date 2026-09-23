/* eslint-disable no-var, no-unused-vars -- Max include shares globals; the classic engine requires ES5 syntax. */
// Shared by Max js and jsui. ES5 syntax is intentional for the classic Max engine.
var STEP_FIELDS = [
    ["density", "Density", 0, 64, 1],
    ["length", "Length /16", 1, 64, 1],
    ["curve", "Curve", -5, 5, 0.05],
    ["divisions", "Divisions", 1, 8, 1],
    ["differential", "Differential", -3, 3, 0.05],
    ["phase", "Phase", -360, 360, 1],
    ["compress", "Compress %", -100, 95, 1],
    ["humanize", "Humanize", 0, 127, 1],
    ["gate", "Gate %", 1, 100, 1],
    ["probability", "Chance %", 0, 100, 1],
    ["maskCount", "Mask mute", 1, 15, 1],
    ["mask", "Mask in every", 0, 16, 1],
    ["maskShift", "Mask shift", 0, 15, 1]
];

// Note source: lane settings, or pitch/velocity from upstream MIDI (see fluxion-voice.js).
var INPUT_MODES = ["OFF", "LATCH", "HOLD"];

function bounded(value, min, max, fallback) {
    var n = Number(value);
    return isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

function freshState() {
    var steps = [];
    for (var i = 0; i < 16; i++) {
        var s = {};
        for (var j = 0; j < STEP_FIELDS.length; j++) {
            var key = STEP_FIELDS[j][0];
            s[key] = DEFAULT_STEP[key];
        }
        s.curveVariant = 0;
        s.probabilityMode = "Trigger";
        s.aux1 = "OFF";
        s.aux2 = "OFF";
        s.enabled = true;
        steps.push(s);
    }
    return {version: 1, selected: 0, all: false, muted: false, input: "OFF", page: 0,
        loopStart: 0, loopEnd: 0, notes: [36, 43, 45],
        channels: [1, 2, 3], velocities: [100, 100, 100], steps: steps};
}

// Live recalls the pattr blob as Max atoms (track duplicate, set reload). A long
// JSON symbol with quotes and commas does not survive that, so store it
// URI-encoded in short chunks. The "s" prefix keeps chunks from parsing as numbers.
var STATE_CHUNK = 500;

function encodeState(state) {
    var text = encodeURIComponent(JSON.stringify(state));
    var atoms = [];
    for (var i = 0; i < text.length; i += STATE_CHUNK) atoms.push("s" + text.slice(i, i + STATE_CHUNK));
    return atoms;
}

function decodeState(atoms) {
    var first = String(atoms[0]);
    if (first.charAt(0) === "{" || first.charAt(0) === "\"") {
        // Legacy: one JSON symbol, possibly still wrapped as a quoted string.
        var value = JSON.parse(atoms.join(" "));
        return normalizeState(typeof value === "string" ? JSON.parse(value) : value);
    }
    if (first.charAt(0) !== "s") throw new Error("not a Fluxion state");
    var text = "";
    for (var i = 0; i < atoms.length; i++) text += String(atoms[i]).slice(1);
    return normalizeState(JSON.parse(decodeURIComponent(text)));
}

function normalizeState(input) {
    if (!input || input.version !== 1 || !input.steps || input.steps.length !== 16)
        throw new Error("Unsupported Fluxion state (expected version 1, 16 steps)");
    var result = freshState();
    result.selected = Math.round(bounded(input.selected, 0, 15, 0));
    result.page = Math.round(bounded(input.page, 0, 1, 0));
    result.loopStart = Math.round(bounded(input.loopStart, 0, 15, 0));
    result.loopEnd = Math.round(bounded(input.loopEnd, result.loopStart, 15, result.loopStart));
    result.all = !!input.all;
    result.muted = !!input.muted;
    result.input = INPUT_MODES.indexOf(input.input) >= 0 ? input.input : "OFF";
    var usedChannels = {};
    for (var lane = 0; lane < 3; lane++) {
        result.notes[lane] = Math.round(bounded((input.notes || [])[lane], 0, 127, result.notes[lane]));
        result.velocities[lane] = Math.round(bounded((input.velocities || [])[lane], 1, 127, 100));
        var channel = Math.round(bounded((input.channels || [])[lane], 1, 16, lane + 1));
        while (usedChannels[channel]) channel = channel % 16 + 1;
        usedChannels[channel] = true;
        result.channels[lane] = channel;
    }
    for (var i = 0; i < 16; i++) {
        var s = input.steps[i] || {};
        var target = result.steps[i];
        for (var j = 0; j < STEP_FIELDS.length; j++) {
            var f = STEP_FIELDS[j];
            target[f[0]] = Math.round(bounded(s[f[0]], f[2], f[3], target[f[0]]) / f[4]) * f[4];
        }
        target.curveVariant = Math.round(bounded(s.curveVariant, 0,
            target.divisions === 1 ? 0 : target.divisions, 0));
        if (target.mask === 1) target.mask = 2;
        target.enabled = s.enabled !== false;
        target.probabilityMode = s.probabilityMode === "Step" ? "Step" : "Trigger";
        target.aux1 = AUX_MODES.indexOf(s.aux1) >= 0 ? s.aux1 : "OFF";
        target.aux2 = AUX_MODES.indexOf(s.aux2) >= 0 ? s.aux2 : "OFF";
    }
    return result;
}

// ---------------------------------------------------------------------------
// Modulation layer.
//
// Live parameters live OUTSIDE the pattr blob. They are applied to a *copy* of a
// step at plan time and never written back, so Live's parameter recall and the
// blob's recall cannot race each other on set load: the blob is always the
// pattern, the parameters are always modifiers on top of it.

function fieldSpec(key) {
    for (var i = 0; i < STEP_FIELDS.length; i++) if (STEP_FIELDS[i][0] === key) return STEP_FIELDS[i];
    return null;
}

function clampField(spec, value) {
    var n = Number(value);
    if (!isFinite(n)) return spec[2];
    return Math.round(Math.max(spec[2], Math.min(spec[3], n)) / spec[4]) * spec[4];
}

// [key, label, min, max, quantum, neutral, mode]. "add" offsets in the field's own
// units; "scale" is a percentage of the stored value.
var GLOBAL_MODS = [
    ["density", "Density", -32, 32, 1, 0, "add"],
    ["curve", "Curve", -5, 5, 0.05, 0, "add"],
    ["differential", "Diff", -3, 3, 0.05, 0, "add"],
    ["phase", "Phase", -360, 360, 1, 0, "add"],
    ["compress", "Compress", -100, 100, 1, 0, "add"],
    ["humanize", "Humanize", -127, 127, 1, 0, "add"],
    ["gate", "Gate", 1, 400, 1, 100, "scale"],
    ["probability", "Chance", -100, 100, 1, 0, "add"]
];

// Assignable slots: target picks a step field, amount is a percentage of that
// field's full range, step 0 means every step. `length` is deliberately NOT
// targetable -- the engine's locate() derives loop geometry from stored lengths,
// so modulating it would desync planning from playback position.
var MOD_SLOTS = 4;
var MOD_TARGET_KEYS = [];
var MOD_TARGETS = ["Off"];
for (var modTargetIndex = 0; modTargetIndex < STEP_FIELDS.length; modTargetIndex++) {
    if (STEP_FIELDS[modTargetIndex][0] === "length") continue;
    MOD_TARGET_KEYS.push(STEP_FIELDS[modTargetIndex][0]);
    MOD_TARGETS.push(STEP_FIELDS[modTargetIndex][1]);
}
var MOD_FIELDS = ["target", "amount", "step"];

function globalModSpec(key) {
    for (var i = 0; i < GLOBAL_MODS.length; i++) if (GLOBAL_MODS[i][0] === key) return GLOBAL_MODS[i];
    return null;
}

function freshMods() {
    var mods = {globals: {}, slots: []};
    for (var i = 0; i < GLOBAL_MODS.length; i++) mods.globals[GLOBAL_MODS[i][0]] = GLOBAL_MODS[i][5];
    for (var j = 0; j < MOD_SLOTS; j++) mods.slots.push({target: 0, amount: 0, step: 0});
    return mods;
}

function modsAreNeutral(mods) {
    if (!mods) return true;
    for (var i = 0; i < GLOBAL_MODS.length; i++)
        if (Number(mods.globals[GLOBAL_MODS[i][0]]) !== GLOBAL_MODS[i][5]) return false;
    for (var j = 0; j < MOD_SLOTS; j++) {
        var slot = mods.slots[j];
        if (slot && slot.target && slot.amount) return false;
    }
    return true;
}

// Returns `step` itself when nothing applies, so the neutral case allocates nothing
// and the engine's per-block cache keeps its identity semantics.
function applyMods(step, mods, index) {
    if (modsAreNeutral(mods)) return step;
    var out = step, i, spec;
    function copy() {
        if (out === step) { out = {}; for (var k in step) out[k] = step[k]; }
        return out;
    }
    for (i = 0; i < GLOBAL_MODS.length; i++) {
        var g = GLOBAL_MODS[i], amount = Number(mods.globals[g[0]]);
        if (!isFinite(amount) || amount === g[5]) continue;
        spec = fieldSpec(g[0]);
        copy()[g[0]] = clampField(spec,
            g[6] === "scale" ? step[g[0]] * amount / 100 : step[g[0]] + amount);
    }
    for (i = 0; i < MOD_SLOTS; i++) {
        var s = mods.slots[i];
        if (!s || !s.target || !Number(s.amount)) continue;
        if (s.step && s.step - 1 !== index) continue;
        spec = fieldSpec(MOD_TARGET_KEYS[s.target - 1]);
        if (!spec) continue;
        copy();
        out[spec[0]] = clampField(spec, out[spec[0]] + Number(s.amount) / 100 * (spec[3] - spec[2]));
    }
    // A modulated division count can strand the stored variant outside its family.
    if (out !== step)
        out.curveVariant = Math.max(0, Math.min(out.divisions === 1 ? 0 : out.divisions, out.curveVariant));
    return out;
}
