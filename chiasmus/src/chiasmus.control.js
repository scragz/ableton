// Chiasmus control: converts Live parameter values into gen~ params, dims controls the
// current Trigger mode ignores, and forwards envelope/timing state to the display.
autowatch = 1;
inlets = 1;
outlets = 2; // 0 gen~, 1 panel

var DIVISIONS = [0.125, 1 / 6, 0.25, 1 / 3, 0.375, 0.5, 2 / 3, 0.75, 1, 1.5, 2, 3, 4, 8];
var DIVNAMES = ['1/32', '1/16T', '1/16', '1/8T', '1/16D', '1/8', '1/4T', '1/8D', '1/4', '1/4D', '1/2', '1/2D', '1 Bar', '2 Bars'];
var state = {
    trigger: 0, time: 400, division: 8, pre: 0, drift: 0, sens: 50, pattern: 0, flip: 0,
    pitch: 0, fine: 0, smooth: 30, swell: 0, feedback: 35, cross: 0, tone: 0, drive: 0,
    diffuse: 0, width: 0, duck: 0, mix: 50, output: 0, freeze: 0,
    engine: 0, zip: 30, wow: 0, scatter: 0
};
var PERCENT = { drift: 'drift', sens: 'sens', flip: 'flip', smooth: 'smooth', swell: 'swell', feedback: 'feedback',
    cross: 'crossamt', zip: 'zipamt', wow: 'wowamt', tone: 'tone', drive: 'drive', diffuse: 'diffuse', width: 'width', duck: 'duck', mix: 'drywet' };

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function send(key) {
    var v = state[key];
    if (PERCENT.hasOwnProperty(key)) { outlet(0, PERCENT[key], v / 100); }
    else if (key === 'trigger') { outlet(0, 'trig', v); dimming(); }
    else if (key === 'time') outlet(0, 'timems', v);
    else if (key === 'division') outlet(0, 'beats', DIVISIONS[clamp(Math.round(v), 0, DIVISIONS.length - 1)]);
    else if (key === 'pre') outlet(0, 'prems', v);
    else if (key === 'pattern') outlet(0, 'pattern', v);
    else if (key === 'pitch' || key === 'fine') outlet(0, 'pitch', state.pitch + state.fine / 100);
    else if (key === 'output') outlet(0, 'outdb', v);
    else if (key === 'freeze') outlet(0, 'freeze', v);
    else if (key === 'scatter') outlet(0, 'scatteron', v);
    else if (key === 'engine') { outlet(0, 'tapemode', v); dimming(); }
    panel();
}

// Time is ignored in Sync, Division outside Sync, Sens outside Onset, Zip outside Tape.
function dimming() {
    var t = Math.round(state.trigger);
    active('time', t !== 1);
    active('division', t === 1);
    active('sens', t === 2);
    active('zip', Math.round(state.engine) === 1);
}
function active(name, on) {
    var o = this.patcher.getnamed(name);
    if (o) o.message('active', on ? 1 : 0);
}

function panel() {
    outlet(1, 'shape', state.smooth / 100, state.swell / 100, Math.round(state.engine), state.zip / 100);
    outlet(1, 'mode', Math.round(state.trigger), Math.round(state.pattern), state.time,
        DIVNAMES[clamp(Math.round(state.division), 0, DIVNAMES.length - 1)], state.pitch + state.fine / 100);
}

function init() { for (var k in state) send(k); }

function anything() {
    var k = messagename, v = Number(arguments[0]);
    if (!state.hasOwnProperty(k) || !isFinite(v)) return;
    state[k] = v;
    send(k);
}
