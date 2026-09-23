/* eslint-disable no-var, no-unused-vars -- Max invokes global message handlers and requires ES5 syntax. */
// Max js: plan ahead at low priority; native pipe emits the actual MIDI events.
autowatch = 1;
inlets = 1;
outlets = 3; // [status pitch velocity absolute-ticks], panic bang, editor playhead
include("fluxion-rhythm.js");
include("fluxion-state.js");

var state = freshState();
var mods = freshMods();
var cache = {};
var lastBeat = null;
var lastTempo = 120;
var lastWall = null;
var until = null;
var running = false;
var deviceActive = true;
var lastDisplay = "";
var LOOKAHEAD_MS = 80;
var EPSILON = 0.00000001;

// Every value is a Live parameter now, so state is assembled from parameter
// messages rather than recalled from a blob.
var STEP_KEYS = {density: "density", length: "length", curve: "curve",
    differential: "differential", phase: "phase", compress: "compress",
    humanize: "humanize", gate: "gate", probability: "probability",
    maskcount: "maskCount", mask: "mask", maskshift: "maskShift"};

function step(index, key, value) {
    var i = Math.round(Number(index)), name = String(key), v = Number(value);
    if (!(i >= 0 && i < 16) || !isFinite(v)) return;
    var s = state.steps[i];
    if (STEP_KEYS[name] !== undefined) s[STEP_KEYS[name]] = clampField(fieldSpec(STEP_KEYS[name]), v);
    else if (name === "curvemode") {
        var mode = CURVE_MODES[Math.round(bounded(v, 0, CURVE_MODES.length - 1, 0))];
        s.divisions = mode.divisions;
        s.curveVariant = mode.variant;
    } else if (name === "probmode") s.probabilityMode = Math.round(v) ? "Step" : "Trigger";
    else if (name === "aux1" || name === "aux2") s[name] = AUX_MODES[Math.round(bounded(v, 0, AUX_MODES.length - 1, 0))];
    else if (name === "enabled") s.enabled = !Math.round(v);
    else return;
    invalidate(i);
}

// Drop that step's plan but cancel nothing already in the pipe: values are sampled
// when a step is next planned, so a modulator moving at control rate lands on the
// following step edge instead of thrashing the scheduler and dropping notes.
function invalidate(index) {
    for (var k in cache) if (Number(k.split(":")[1]) === index) delete cache[k];
}

function set(key, a, b) {
    var name = String(key), lane;
    if (name === "loopstart" || name === "loopend") {
        state[name === "loopstart" ? "loopStart" : "loopEnd"] = Math.round(bounded(a, 1, 16, 1)) - 1;
        if (state.loopStart > state.loopEnd) {
            if (name === "loopstart") state.loopEnd = state.loopStart;
            else state.loopStart = state.loopEnd;
        }
        cache = {};
    } else if (name === "input") state.input = INPUT_MODES[Math.round(bounded(a, 0, INPUT_MODES.length - 1, 0))];
    else if (name === "mute") { state.muted = !!Math.round(Number(a)); if (state.muted) panic(); }
    else if (name === "panic") { if (Math.round(Number(a))) { state.muted = true; panic(); } }
    else if (name === "selected") state.selected = Math.round(bounded(a, 1, 16, 1)) - 1;
    else if (name === "ch" || name === "note" || name === "vel") {
        lane = Math.round(Number(a));
        if (!(lane >= 0 && lane < 3)) return;
        var column = name === "ch" ? "channels" : name === "note" ? "notes" : "velocities";
        state[column][lane] = Math.round(bounded(b, name === "note" ? 0 : 1, name === "ch" ? 16 : 127,
            state[column][lane]));
        cache = {};
    }
}

// Modulation is sampled when a step is next planned, so it never cancels the pipe.
// Changing a slot's target or step is configuration rather than modulation, so it
// drops the whole plan cache (but still cancels nothing already scheduled).
function gmod(key, value) {
    var name = String(key), next = Number(value);
    if (mods.globals[name] === undefined || !isFinite(next)) return;
    mods.globals[name] = next;
}

function mslot(index, field, value) {
    var i = Math.round(Number(index)), name = String(field), next = Number(value);
    if (!(i >= 0 && i < MOD_SLOTS) || !isFinite(next)) return;
    if (name === "amount") { mods.slots[i].amount = next; return; }
    if (name !== "target" && name !== "step") return;
    if (mods.slots[i][name] === Math.round(next)) return;
    mods.slots[i][name] = Math.round(next);
    cache = {};
}

function cancel() {
    outlet(1, "bang"); // clear pipe BEFORE midiflush
    until = null;
}

function panic() {
    cancel();
    running = false;
    lastBeat = null;
    lastWall = null;
    display(-1, false);
}

function active(value) {
    deviceActive = !!value;
    if (!deviceActive) panic();
}

function stop() { panic(); }
function freebang() { panic(); }

function locate(beat) {
    var total = 0;
    for (var i = state.loopStart; i <= state.loopEnd; i++) total += state.steps[i].length / 4;
    var cycle = Math.floor(Math.max(0, beat) / total);
    var start = cycle * total;
    for (var step = state.loopStart; step <= state.loopEnd; step++) {
        var end = start + state.steps[step].length / 4;
        if (beat < end - EPSILON || step === state.loopEnd)
            return {step: step, cycle: cycle, start: start, end: end};
        start = end;
    }
}

function eventsFor(block) {
    var key = block.cycle + ":" + block.step;
    if (cache[key]) return cache[key];
    var s = applyMods(state.steps[block.step], mods, block.step);
    var hits = s.enabled ? generateHits(s, seedFor(0, block.step, block.cycle), block.start * 4) : [];
    var events = [];
    for (var lane = 0; lane < 3; lane++) {
        var notes = [];
        for (var j = 0; j < hits.length; j++) {
            if (hits[j].lane !== lane) continue;
            // Coincident retriggers of one pitch cannot be represented as distinct MIDI gates.
            if (notes.length && Math.abs(notes[notes.length - 1].at - hits[j].at) < EPSILON) continue;
            notes.push(hits[j]);
        }
        for (var n = 0; n < notes.length; n++) {
            var h = notes[n];
            var on = block.start + h.at / 4;
            var off = Math.min(block.end, on + h.duration / 4);
            if (n + 1 < notes.length) off = Math.min(off, block.start + notes[n + 1].at / 4);
            if (off <= on) continue;
            var channel = state.channels[lane] - 1;
            events.push({at: on, bytes: [0x90 + channel, state.notes[lane], state.velocities[lane]]});
            events.push({at: off, bytes: [0x80 + channel, state.notes[lane], 0]});
        }
    }
    events.sort(function(a, b) { return a.at - b.at || a.bytes[0] - b.bytes[0]; });
    cache[key] = events;
    return events;
}

function display(step, on) {
    var key = step + ":" + on;
    if (key !== lastDisplay) {
        outlet(2, "playing", step, on ? 1 : 0);
        lastDisplay = key;
    }
}

// Max transport: absolute ticks (480 per quarter), tempo, running state.
function clock(ticks, bpm, play, timestamp) {
    var now = Number(ticks) / 480;
    var tempo = Number(bpm);
    if (!isFinite(now) || !isFinite(tempo) || tempo <= 0) return;
    if (!play || !deviceActive || state.muted || now < 0) {
        if (running || until !== null) panic();
        return;
    }
    // Timestamp is captured beside transport in the native scheduler, before JS
    // deferral. UI-thread delays must not be mistaken for host transport jumps.
    var wall = isFinite(timestamp) ? Number(timestamp) : Date.now();
    var beginning = !running;
    var elapsed = lastWall === null ? 0 : (wall - lastWall) * lastTempo / 60000;
    var jumped = lastBeat !== null && (now < lastBeat - EPSILON ||
        Math.abs(now - lastBeat - elapsed) > tempo * 0.025 / 60);
    var tempoChanged = Math.abs(tempo - lastTempo) > 0.0001;
    if (beginning || jumped || tempoChanged) cancel();
    running = true;
    lastBeat = now;
    lastTempo = tempo;
    lastWall = wall;
    var block = locate(now);
    display(block.step, true);
    var from = until === null ? now : until;
    // Catch the initial step edge if the first host poll arrives a few ms late.
    // Other starts/seeks skip past notes instead of replaying a backlog.
    if (beginning && now - block.start < tempo * 0.02 / 60) from = block.start;
    if (from < now - tempo * LOOKAHEAD_MS / 60000) {
        cancel(); // stalled UI thread: release held notes, discard overdue notes
        from = now;
    }
    var to = now + tempo * LOOKAHEAD_MS / 60000;
    if (from >= to) return;
    var pending = [];
    // Include the previous block's tail note-offs at an exact step boundary.
    var cursor = locate(Math.max(0, from - 0.000001));
    while (cursor.start < to) {
        var events = eventsFor(cursor);
        for (var i = 0; i < events.length; i++) {
            if (events[i].at >= from - EPSILON && events[i].at < to - EPSILON)
                pending.push(events[i]);
        }
        cursor = locate(cursor.end + EPSILON);
    }
    pending.sort(function(a, b) { return a.at - b.at || a.bytes[0] - b.bytes[0]; });
    for (var p = 0; p < pending.length; p++) {
        var e = pending[p];
        // Convert to delay using a fresh native transport query in the patch.
        // Measuring the delay here would add JavaScript queue latency to notes.
        outlet(0, e.bytes[0], e.bytes[1], e.bytes[2], e.at * 480);
    }
    until = to;
    // Bound memory independently of how long the Live set has been running.
    for (var k in cache) if (Number(k.split(":")[0]) < block.cycle - 1) delete cache[k];
}
