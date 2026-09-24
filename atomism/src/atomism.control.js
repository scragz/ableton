// Atomism control: converts Live parameter values into gen~ params, dims the controls the current
// Source / Entropy ignore, turns Trig into a short pulse, and forwards display state to the panel.
autowatch = 1;
inlets = 1;
outlets = 2; // 0 gen~, 1 panel

var DIVISIONS = [0.0625, 1 / 12, 0.125, 1 / 6, 0.25, 1 / 3, 0.5, 2 / 3, 1, 2, 4];
var DIVNAMES = ['1/64', '1/32T', '1/32', '1/16T', '1/16', '1/8T', '1/8', '1/4T', '1/4', '1/2', '1 Bar'];
var state = {
    source: 0, density: 120, division: 4, burst: 8, sens: 50, trig: 0,
    size: 2.5, vary: 30, window: 1, reverse: 25, jitter: 40, spray: 60,
    pitch: 0, random: 12, quantize: 0, entropy: 1, chaos: 85, speed: 2,
    hold: 0, feedback: 0, width: 50, mix: 100, output: 0
};
// key -> [gen param, scale]
var DIRECT = {
    source: ['src', 1], density: ['density', 1], burst: ['burst', 1], sens: ['sens', 0.01],
    size: ['sizems', 1], vary: ['sizernd', 0.01], window: ['wshape', 1], reverse: ['reverse', 0.01],
    jitter: ['jitter', 0.01], spray: ['sprayms', 1], pitch: ['pitch', 1], random: ['prand', 1],
    quantize: ['quant', 1], entropy: ['entropy', 1], chaos: ['chaos', 0.01], speed: ['speed', 1],
    hold: ['holdon', 1], feedback: ['feedback', 0.01], width: ['width', 0.01], mix: ['drywet', 0.01],
    output: ['outdb', 1]
};
var trigLow = new Task(function () { outlet(0, 'trigin', 0); });

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function send(key) {
    var v = state[key];
    if (DIRECT.hasOwnProperty(key)) outlet(0, DIRECT[key][0], v * DIRECT[key][1]);
    else if (key === 'division') outlet(0, 'beats', DIVISIONS[clamp(Math.round(v), 0, DIVISIONS.length - 1)]);
    if (key === 'source' || key === 'entropy') dimming();
    panel();
}

function pulse() {
    trigLow.cancel();
    outlet(0, 'trigin', 1);
    trigLow.schedule(8);
}

// Division only in Sync; Burst outside Free; Sens in Onset and Chaos;
// Chaos unless Entropy is Noise; Speed only for Lorenz.
function dimming() {
    var s = Math.round(state.source), e = Math.round(state.entropy);
    active('division', s === 1);
    active('burst', s !== 0);
    active('sens', s === 2 || s === 3);
    active('chaos', e !== 0);
    active('speed', e === 2);
}
function active(name, on) {
    var o = this.patcher.getnamed(name);
    if (o) o.message('active', on ? 1 : 0);
}

function panel() {
    outlet(1, 'shape', Math.round(state.window), state.size, state.vary / 100);
    outlet(1, 'mode', Math.round(state.source), Math.round(state.entropy), state.density,
        DIVNAMES[clamp(Math.round(state.division), 0, DIVNAMES.length - 1)], state.chaos / 100);
}

function init() { for (var k in state) if (k !== 'trig') send(k); }

function anything() {
    var k = messagename;
    if (k === 'trig') {
        // live.text in button mode: fire on the press (a value, or a bang).
        var a = arguments[0];
        if (a === undefined || a === 'bang' || Number(a) > 0.5) pulse();
        return;
    }
    var v = Number(arguments[0]);
    if (!state.hasOwnProperty(k) || !isFinite(v)) return;
    state[k] = v;
    send(k);
}
