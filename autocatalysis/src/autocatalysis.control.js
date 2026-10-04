// Autocatalysis controller: Live parameters -> gen~ params, MIDI -> six strings.
// ES5: this runs in Max's legacy js.
// MIDI never writes a Live parameter: notes, the sustain pedal and pitch bend go straight to gen~,
// so playing leaves undo and automation alone.
autowatch = 1;
inlets = 1;
outlets = 2; // 0 gen~, 1 face panel

var VOICES = 6;
var TUNING = [40, 45, 50, 55, 59, 64];   // E2 A2 D3 G3 B3 E4: where the strings sit before they are played
var BEND_RANGE = 2;                      // semitones
// Live parameter defaults, in the units the widgets show. Keep in sync with scripts/build.py.
var state = {
    sustain: 6000, pick: 60, damp: 35, ring: 0, mute: 0, body: 30, spread: 70,
    drive: 20, bias: 20, tone: 0, cab: 1,
    sag: 40, recover: 250, catalysis: 25, rate: 0.7,
    distance: 1.2, offset: 0.4, stage: 30, seek: 0, harm: 0,
    feedback: 40, output: -6
};
// key -> [gen param, scale]. ring and harm are handled in send().
var DIRECT = {
    sustain: ['sustain', 0.001], pick: ['pick', 0.01], damp: ['damp', 0.01], mute: ['mutep', 1],
    body: ['body', 0.01], spread: ['spread', 0.01], drive: ['drive', 1], bias: ['bias', 0.01],
    tone: ['tone', 0.01], cab: ['cab', 1], sag: ['sag', 0.01], recover: ['recover', 1],
    catalysis: ['catalysis', 0.01], rate: ['rate', 1], distance: ['distm', 1], offset: ['ampoff', 1],
    stage: ['stage', 0.01], seek: ['seek', 1], feedback: ['feedback', 0.01], output: ['outdb', 1]
};

var voiceNote = [], held = [], age = [], strikes = [], clock = 0, pedal = 0;
for (var i = 0; i < VOICES; i++) { voiceNote.push(TUNING[i]); held.push(0); age.push(0); strikes.push(0); }

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function mtof(n) { return 440 * Math.pow(2, (n - 69) / 12); }

function sendRing() { outlet(0, 'ring', state.ring > 0.5 || pedal ? 1 : 0); }

function send(key) {
    var v = state[key];
    if (DIRECT.hasOwnProperty(key)) outlet(0, DIRECT[key][0], clamp(v * DIRECT[key][1], -1000, 100000));
    if (key === 'ring') sendRing();
    if (key === 'harm') outlet(0, 'harm', clamp(Math.round(v) + 1, 1, 4));
    outlet(1, 'value', key, v);
}

function sync() {
    for (var k in state) send(k);
}

function init() {
    for (var i = 0; i < VOICES; i++) {
        outlet(0, 'f' + (i + 1), mtof(voiceNote[i]));
        outlet(0, 'g' + (i + 1), held[i]);
    }
    sync();
}

function anything() {
    var k = messagename, v = Number(arguments[0]);
    if (!state.hasOwnProperty(k) || !isFinite(v)) return;
    state[k] = v;
    send(k);
}

// ---- MIDI ----
// A note takes a string: the one already on that pitch if any (re-pluck), else the free string
// released longest ago, else the oldest held one. Released strings keep their pitch, so with Ring
// (or the pedal) they go on ringing in sympathy and can be pulled into the feedback.
function note(pitch, velocity) {
    pitch = Math.round(Number(pitch)); velocity = Number(velocity);
    if (!isFinite(pitch) || !isFinite(velocity)) return;
    var i, pick = -1;
    if (velocity <= 0) {
        for (i = 0; i < VOICES; i++) if (held[i] && voiceNote[i] === pitch) { held[i] = 0; age[i] = ++clock; outlet(0, 'g' + (i + 1), 0); }
        outlet(1, 'voices', held.join(' '));
        return;
    }
    for (i = 0; i < VOICES; i++) if (voiceNote[i] === pitch) pick = i;
    if (pick < 0) for (i = 0; i < VOICES; i++) if (!held[i] && (pick < 0 || age[i] < age[pick])) pick = i;
    if (pick < 0) for (i = 0; i < VOICES; i++) if (pick < 0 || age[i] < age[pick]) pick = i;
    voiceNote[pick] = pitch; held[pick] = 1; age[pick] = ++clock;
    strikes[pick] = (strikes[pick] + 1) % 1000000;
    var n = pick + 1, f = clamp(mtof(pitch), 16, 4000);
    // Pitch and velocity before the strike, so gen~ plucks the new pitch.
    outlet(0, 'f' + n, f);
    outlet(0, 'v' + n, clamp(velocity / 127, 0, 1));
    outlet(0, 'g' + n, 1);
    outlet(0, 's' + n, strikes[pick]);
    outlet(0, 'fseek', f);
    outlet(1, 'voices', held.join(' '));
}

// Sustain pedal (CC 64) acts as Ring while it is down.
function pedalcc(v) { pedal = Number(v) >= 64 ? 1 : 0; sendRing(); }

// Pitch bend, 0..127 with 64 centre.
function bend(v) { outlet(0, 'bend', clamp((Number(v) - 64) / 64, -1, 1) * BEND_RANGE); }

// All notes off: release every string (Live sends this when the transport stops).
function allnotesoff() {
    for (var i = 0; i < VOICES; i++) if (held[i]) { held[i] = 0; outlet(0, 'g' + (i + 1), 0); }
    pedal = 0; sendRing();
    outlet(1, 'voices', held.join(' '));
}
