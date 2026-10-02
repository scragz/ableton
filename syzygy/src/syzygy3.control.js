// Syzygy 3 controller: Live parameters -> gen~ params, MIDI (Root / Bodies), strikes, launches
// and orbit grabs. ES5: this runs in Max's legacy js.
// MIDI never writes a Live parameter: notes go straight to gen~, so playing leaves undo and
// automation alone.
autowatch = 1;
inlets = 1;
outlets = 3; // 0 gen~, 1 face panel, 2 orbit display

var NAMES = ['Sun', 'Earth', 'Moon'];
var FORMS = ['Eight', 'Lagrange', 'Euler', 'Swarm'];
// Live parameter defaults, in the units the widgets show. Keep in sync with scripts/build.py.
var state = {
    pitch1: 0, pitch2: 7, pitch3: 12, mass1: 1, mass2: 1, mass3: 1,
    matter1: 80, matter2: 60, matter3: 30, level1: 80, level2: 70, level3: 70,
    oform: 0, ohold: 0, orate: 0.2, chaos: 10, gravity: 35, tide: 20,
    mallet: 50, strikepos: 30, bow: 0, syzalign: 0, keys: 0,
    root: 48, decay: 2500, bright: 55, feed: 0,
    space: 30, width: 80, doppler: 30, output: -6, input: 60
};
// key -> [gen param, scale]. root / pitch / keys are handled by retune().
var DIRECT = {
    mass1: ['mass1', 1], mass2: ['mass2', 1], mass3: ['mass3', 1],
    matter1: ['matter1', 0.01], matter2: ['matter2', 0.01], matter3: ['matter3', 0.01],
    level1: ['level1', 0.01], level2: ['level2', 0.01], level3: ['level3', 0.01],
    oform: ['oform', 1], ohold: ['ohold', 1], orate: ['orate', 1], chaos: ['chaos', 0.01],
    gravity: ['gravity', 0.01], tide: ['tide', 0.01], mallet: ['mallet', 0.01],
    strikepos: ['strikepos', 0.01], bow: ['bow', 0.01], syzalign: ['syzalign', 0.01],
    decay: ['decay', 0.001], bright: ['bright', 0.01], feed: ['feed', 0.01],
    space: ['space', 0.01], width: ['width', 0.01], doppler: ['doppler', 0.01],
    output: ['outdb', 1], input: ['inamt', 0.01]
};
var strikes = [0, 0, 0], launches = 0;
var played = null;            // last MIDI note in Root mode; null until played, cleared by the Root dial
var bodyNote = [null, null, null], held = [0, 0, 0], age = [0, 0, 0], clock = 0;
var grabbing = 0;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function mtof(n) { return 440 * Math.pow(2, (n - 69) / 12); }
function widget(key) { return this.patcher.getnamed(key); }

// Body pitches: base note (Root dial, last Root-mode note, or the note a body holds) plus Pitch.
function retune() {
    for (var i = 0; i < 3; i++) {
        var base = state.keys > 0.5 && bodyNote[i] !== null ? bodyNote[i] : (played !== null ? played : state.root);
        outlet(0, 'f' + (i + 1), clamp(mtof(base + state['pitch' + (i + 1)]), 8, 12000));
    }
}

function strike(i, vel) {
    strikes[i] = (strikes[i] + 1) % 1000000;
    outlet(0, 'v' + (i + 1), clamp(vel, 0, 1));
    outlet(0, 's' + (i + 1), strikes[i]);
    outlet(2, 'struck', i);
}

function send(key) {
    var v = state[key];
    if (DIRECT.hasOwnProperty(key)) outlet(0, DIRECT[key][0], v * DIRECT[key][1]);
    if (key === 'root') { played = null; retune(); }
    if (key === 'pitch1' || key === 'pitch2' || key === 'pitch3' || key === 'keys') retune();
    if (key === 'oform') { outlet(2, 'form', v); launch(); }
    if (key === 'ohold') outlet(2, 'hold', v);
    if (/^(mass|matter)\d$/.test(key)) outlet(2, key, v);
    outlet(1, 'value', key, v);
}

function sync() {
    for (var k in state) send(k);
    retune();
}

function init() { sync(); }

function anything() {
    var k = messagename, v = Number(arguments[0]);
    if (!state.hasOwnProperty(k) || !isFinite(v)) return;
    state[k] = v;
    send(k);
}

// ---- MIDI ----
function note(pitch, velocity) {
    pitch = Number(pitch); velocity = Number(velocity);
    if (state.keys > 0.5) {
        // Bodies: each note claims a planet (a free one if possible, else the longest held).
        var i, pick = -1;
        if (velocity <= 0) {
            for (i = 0; i < 3; i++) if (bodyNote[i] === pitch && held[i]) held[i] = 0;
            return;
        }
        for (i = 0; i < 3; i++) if (!held[i] && (pick < 0 || age[i] < age[pick])) pick = i;
        if (pick < 0) for (i = 0; i < 3; i++) if (pick < 0 || age[i] < age[pick]) pick = i;
        bodyNote[pick] = pitch; held[pick] = 1; age[pick] = ++clock;
        retune();
        strike(pick, velocity / 127);
        return;
    }
    if (velocity <= 0) return;
    played = pitch;
    retune();
    for (var b = 0; b < 3; b++) strike(b, velocity / 127);
}

// ---- actions from the face ----
// Action buttons are live.text toggles so Live's theme draws them lit; unlight them 120 ms after a press.
var ACTIONS = ['strike1', 'strike2', 'strike3', 'strikeall', 'launch'];
var flashTask = new Task(unflash, this);
function unflash() { for (var i = 0; i < ACTIONS.length; i++) { var o = widget(ACTIONS[i]); if (o) o.message('set', 0); } }
function action(name) {
    flashTask.cancel(); flashTask.schedule(120);
    if (name === 'strike1') strike(0, 0.8);
    else if (name === 'strike2') strike(1, 0.8);
    else if (name === 'strike3') strike(2, 0.8);
    else if (name === 'strikeall') { strike(0, 0.8); strike(1, 0.8); strike(2, 0.8); }
    else if (name === 'launch') launch();
}

function launch() {
    launches = (launches + 1) % 1000000;
    outlet(0, 'launch', launches);
    outlet(2, 'launched');
}

// ---- grab and throw, from the orbit display (orbit units) ----
function grab(i, x, y) {
    grabbing = clamp(Math.round(i), 1, 3);
    outlet(0, 'gx', clamp(x, -2, 2)); outlet(0, 'gy', clamp(y, -2, 2)); outlet(0, 'grab', grabbing);
}
function drag(x, y) { if (grabbing) { outlet(0, 'gx', clamp(x, -2, 2)); outlet(0, 'gy', clamp(y, -2, 2)); } }
function release() { if (grabbing) { grabbing = 0; outlet(0, 'grab', 0); } }

function notifydeleted() { flashTask.cancel(); }
