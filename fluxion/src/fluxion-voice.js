/* eslint-disable no-var, no-unused-vars -- Max invokes global message handlers and requires ES5 syntax. */
// Max js: final voicing stage between the native pipe and midiout.
// Fluxion decides WHEN gates fire; in LATCH/HOLD an upstream MIDI sequencer
// decides WHICH pitch and velocity. Substitution happens at emit time (after
// the 80 ms lookahead), so sequencer notes arriving just before a gate are used.
autowatch = 1;
inlets = 1;
outlets = 2; // [status pitch velocity], editor input readout

var mode = "OFF"; // OFF: lane note/velocity. LATCH: last input note. HOLD: held input notes only.
var held = []; // [pitch, velocity], most recent last (last-note priority)
var latched = null;
var sounding = {}; // channel nibble -> emitted pitch, or null when the gate was suppressed

// `set input <index>` from the Note In parameter, which also feeds the engine.
var INPUT = ["OFF", "LATCH", "HOLD"];
function set(key, value) {
    if (String(key) !== "input") return;
    var i = Math.round(Number(value));
    mode = INPUT[i >= 0 && i < INPUT.length ? i : 0];
}

// Upstream note from midiparse: pitch velocity (velocity 0 = release).
function note(pitch, velocity) {
    pitch = pitch | 0;
    velocity = velocity | 0;
    for (var i = held.length - 1; i >= 0; i--) if (held[i][0] === pitch) held.splice(i, 1);
    if (velocity > 0) {
        held.push([pitch, velocity]);
        latched = [pitch, velocity];
        outlet(1, "input", pitch, velocity);
    }
}

// Scheduled Fluxion packet from pipe.
function list(status, pitch, velocity) {
    var type = status & 0xF0;
    var channel = status & 0x0F;
    if (type === 0x90) {
        var source = mode === "LATCH" ? latched
            : mode === "HOLD" ? held[held.length - 1]
            : [pitch, velocity];
        if (!source) { sounding[channel] = null; return; }
        sounding[channel] = source[0];
        outlet(0, [status, source[0], source[1]]);
    } else if (type === 0x80) {
        // Release the pitch this lane actually started, even if the input changed since.
        var on = sounding[channel];
        delete sounding[channel];
        if (on === null) return;
        outlet(0, [status, on === undefined ? pitch : on, 0]);
    } else {
        outlet(0, [status, pitch, velocity]);
    }
}

// Panic: pipe is already cleared and midiflush releases what was emitted.
function reset() { sounding = {}; }

// Run in Max's high-priority scheduler thread instead of deferring to the UI queue.
note.immediate = 1;
list.immediate = 1;
reset.immediate = 1;
