// Coagula control (Max js, ES5).
// - Extracts the embedded Node engine to a real file and scripts a node.script for it (node.script
//   cannot start a script that only exists inside a frozen device).
// - Holds every Live parameter value; forwards engine params to Node, transport/trigger params to
//   gen~, display state to the panel and the scatter plot.
// - Morph macro: while Link is on, the five bundled dials follow Morph and are read-only.
// - Held MIDI notes gate Chain / Clock and drive key tracking; the sample path lives in a pattr.
autowatch = 0;
inlets = 1;
outlets = 5; // 0 gen~, 1 node, 2 panel, 3 space, 4 pattr (set path)

var BUILD = '__BUILD__';          // replaced by scripts/build.py (hash of the engine source)
var ENGINE_SIZE = 0;              // replaced by scripts/build.py
var DIVISIONS = [0.0625, 1 / 12, 0.125, 1 / 6, 0.25, 1 / 3, 0.5, 2 / 3, 1, 2, 4];
var FRAMES = [1024, 2048, 4096], HOPS = [128, 256, 512];
var ENGINE_KEYS = ['variant', 'axis', 'tx', 'ty', 'k', 'jitter', 'xfade', 'continuity', 'maxlen', 'guard',
    'silthresh', 'sildens', 'unvmix', 'trigmode', 'keytrack', 't2m', 'transpose'];
var BUNDLE = ['k', 'jitter', 'xfade', 'continuity', 'maxlen'];
// Dials shown as 0..100 %; held here (and sent on) as 0..1.
var PCT = { morph: 1, tx: 1, ty: 1, sildens: 1, unvmix: 1, continuity: 1, jitter: 1 };
function shown(key, val) { return PCT[key] ? val * 100 : val; }
var APARAMS = { a_frame: 'frame', a_hop: 'hop', a_onset: 'onset', a_gate: 'gate', a_splita: 'splitA', a_splitb: 'splitB',
    a_fixed: 'fixed', a_minseg: 'minseg', a_pitchlo: 'pitchlo', a_pitchhi: 'pitchhi' };
// Widgets per page (the Space plot and the Source column stay on both).
var MAIN = ['morph', 'link', 'tx', 'ty', 'variant', 'axis', 'sildens', 'match', 'unvmix', 'k', 'jitter', 'xfade',
    'continuity', 'maxlen', 'guard', 'silthresh', 'transpose', 'trigmode', 'run', 'sync', 'keytrack', 't2m', 'rate',
    'division'];
var ADV = ['a_frame', 'a_hop', 'a_onset', 'a_gate', 'a_splita', 'a_splitb', 'a_fixed', 'a_minseg', 'a_pitchlo',
    'a_pitchhi', 'reanalyze', 'reveal', 'l_frame', 'l_hop'];

var v = {
    morph: 0, link: 1, tx: 0.5, ty: 0.5, variant: 1, axis: 0, sildens: 0, unvmix: 0.2, silthresh: -50, gain: 0,
    k: 1, jitter: 0, xfade: 8, continuity: 0.6, maxlen: 1000, guard: 4, transpose: 0,
    trigmode: 0, rate: 8, division: 4, sync: 0, run: 0, keytrack: 0, t2m: 0, adv: 0,
    a_frame: 1, a_hop: 1, a_onset: 1.5, a_gate: -50, a_splita: 400, a_splitb: 200, a_fixed: 100, a_minseg: 30,
    a_pitchlo: 50, a_pitchhi: 1500
};
var inited = false, nodeUp = false, samplePath = '', bufName = '', dictName = '', held = 0, pendingMatch = false;
var silRatio = 0, spawned = false;

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function obj(name) { return this.patcher.getnamed(name); }
function widget(name, msg, a) { var o = this.patcher.getnamed(name); if (o) o.message(msg, a); }

// ---- engine process
function enginePath() { return '/tmp/coagula-engine-' + BUILD + '.js'; }
function extract() {
    var dst = enginePath(), chk = new File(dst, 'read');
    var have = chk.isopen ? chk.eof : -1;
    chk.close();
    if (have === ENGINE_SIZE && ENGINE_SIZE > 0) return dst;
    var src = new File('coagula-engine.js', 'read');
    if (!src.isopen) { post('coagula: engine script missing from device\n'); return null; }
    var out = new File(dst, 'write', 'TEXT');
    if (!out.isopen) { post('coagula: cannot write ' + dst + '\n'); src.close(); return null; }
    out.eof = 0;
    while (src.position < src.eof) {
        var b = src.readbytes(Math.min(4096, src.eof - src.position));
        if (!b || !b.length) break;
        out.writebytes(b);
    }
    src.close(); out.close();
    return dst;
}
function spawn() {
    if (spawned) return;
    var file = extract();
    if (!file) { outlet(2, 'status', 'error', 'Engine could not be extracted'); return; }
    var p = this.patcher, old = p.getnamed('engine');
    if (old) p.remove(old);
    var n = p.newdefault(700, 560, 'node.script', file, '@autostart', 1, '@watch', 0);
    n.varname = 'engine';
    p.connect(p.getnamed('tonode'), 0, n, 0);
    p.connect(n, 0, p.getnamed('fromnode'), 0);
    p.connect(n, 1, p.getnamed('nodestatus'), 0);
    spawned = true;
    // Scripted node.scripts don't reliably honour @autostart: start it explicitly.
    var t = new Task(function () { if (!nodeUp) n.message('script', 'start'); }, this);
    t.schedule(1500);
}
function nodestatus() { qalog('node ' + arrayfromargs(arguments).join(' ')); }

// ---- morph macro (spec: Texture <-> Assembly morph)
function morphed(m) {
    return {
        k: Math.round(Math.pow(16, m)),
        jitter: 0.15 * m,
        xfade: 8 * Math.pow(60 / 8, m),
        continuity: 0.6 * (1 - m),
        maxlen: m < 0.05 ? 1000 : 1000 * Math.pow(0.12, (m - 0.05) / 0.95)
    };
}
function applyMorph() {
    if (v.link < 0.5) return;
    var b = morphed(v.morph);
    for (var i = 0; i < BUNDLE.length; i++) {
        var key = BUNDLE[i];
        v[key] = b[key];
        widget(key, 'set', shown(key, b[key]));
        engine(key);
    }
    outlet(2, 'maxlen', v.maxlen);
}

// ---- forwarding
function engine(key) { if (inited && nodeUp) outlet(1, 'param', key, v[key]); }
function aparam(key) {
    if (!inited || !nodeUp) return;
    var val = v[key];
    if (key === 'a_frame') val = FRAMES[clamp(Math.round(val), 0, 2)];
    if (key === 'a_hop') val = HOPS[clamp(Math.round(val), 0, 2)];
    outlet(1, 'aparam', APARAMS[key], val);
}
function gen(key) {
    if (key === 'trigmode') outlet(0, 'tmode', Math.round(v.trigmode));
    else if (key === 'rate') outlet(0, 'clockhz', v.rate);
    else if (key === 'sync') outlet(0, 'sync', v.sync > 0.5 ? 1 : 0);
    else if (key === 'division') outlet(0, 'beats', DIVISIONS[clamp(Math.round(v.division), 0, DIVISIONS.length - 1)]);
    else if (key === 'gain') outlet(0, 'outdb', v.gain);
    else if (key === 'run') gate();
}
function gate() { outlet(0, 'gateon', (v.run > 0.5 || held > 0) ? 1 : 0); }

function dimming() {
    var clock = Math.round(v.trigmode) === 1, pitch = v.axis < 0.5, linked = v.link > 0.5;
    active('rate', clock && v.sync < 0.5);
    active('division', clock && v.sync > 0.5);
    active('sync', clock);
    active('run', Math.round(v.trigmode) !== 2);
    active('keytrack', pitch);
    active('t2m', pitch && v.keytrack > 0.5);
    active('unvmix', pitch);
    active('morph', linked);
    for (var i = 0; i < BUNDLE.length; i++) {
        active(BUNDLE[i], !linked);
        widget(BUNDLE[i], 'ignoreclick', linked ? 1 : 0);
    }
}
function active(name, on) { widget(name, 'active', on ? 1 : 0); }

function page() {
    var adv = v.adv > 0.5, i;
    for (i = 0; i < MAIN.length; i++) widget(MAIN[i], 'hidden', adv ? 1 : 0);
    for (i = 0; i < ADV.length; i++) widget(ADV[i], 'hidden', adv ? 0 : 1);
    outlet(2, 'page', adv ? 1 : 0);
}

function pushAll() {
    var i, k;
    outlet(1, 'setup', dictName);
    for (k in APARAMS) aparam(k);
    for (i = 0; i < ENGINE_KEYS.length; i++) engine(ENGINE_KEYS[i]);
    if (samplePath) outlet(1, 'load', samplePath);
}

function init() {
    inited = true;
    var keys = ['trigmode', 'rate', 'sync', 'division', 'gain'];
    for (var i = 0; i < keys.length; i++) gen(keys[i]);
    gate();
    applyMorph();
    dimming();
    page();
    outlet(2, 'maxlen', v.maxlen);
    outlet(3, 'target', v.tx, v.ty);
    outlet(3, 'axis', Math.round(v.axis));
    spawn();
    if (nodeUp) pushAll();
}

// ---- messages from Node (via route ctl)
function hello() { qalog('hello'); nodeUp = true; if (inited) pushAll(); }
function silratio(r) {
    silRatio = r;
    outlet(2, 'silratio', r);
    if (pendingMatch) { pendingMatch = false; widget('sildens', 'float', shown('sildens', clamp(r, 0, 1))); }
}

// ---- sample path
function newSample(p) {
    p = String(p);
    if (!p || p === 'bang') return;
    samplePath = p;
    widget('drop', 'set', p); // keep live.drop's stored path in step with the pattr
    pendingMatch = true; // Silence density defaults to the new coagula's pause ratio
    outlet(4, 'set', p);
    if (inited && nodeUp) outlet(1, 'load', p);
}
function drop() {
    var p = arrayfromargs(arguments).join(' ');
    if (!p || p === '0' || p === 'none' || p === 'bang' || p === samplePath) return;
    if (!inited) { path(p); return; } // parameter recall on Set open: re-link, keep settings
    newSample(p);
}
function opened() { newSample(arrayfromargs(arguments).join(' ')); }
function path() {
    // pattr restore (Live Set open): keep the user's parameters, just re-link the sample.
    var p = arrayfromargs(arguments).join(' ');
    if (!p || p === '0' || p === 'none' || p === samplePath) return; // an empty pattr recalls 0
    samplePath = p;
    if (inited && nodeUp) outlet(1, 'load', p);
}
function bufname(n) { bufName = String(n); }
function dictname(n) { dictName = String(n); }
function bufready() {
    var fr = 0, ch = 0;
    try { var b = new Buffer(bufName); fr = b.framecount(); ch = b.channelcount(); } catch (e) {}
    if (nodeUp) outlet(1, 'bufready', fr, ch);
}

// ---- MIDI
function note(p, vel) {
    if (vel > 0) held++;
    else held = Math.max(0, held - 1);
    gate();
    if (nodeUp) outlet(1, 'note', p, vel);
}

// ---- buttons
function loadbtn() { var d = obj('dialog'); if (d) d.message('bang'); }
function match() { widget('sildens', 'float', shown('sildens', clamp(silRatio, 0, 1))); }
function reanalyze() { if (nodeUp) outlet(1, 'reanalyze'); }
function reveal() { if (nodeUp) outlet(1, 'reveal'); }

var QA = false; // true only in the QA build (scripts/build.py --qa)
var qaFile = null, qaLines = [];
function qalog(line) {
    if (!QA) return;
    qaLines.push(new Date().getTime() + ' ' + line);
    if (qaLines.length > 400) qaLines.shift();
    if (!qaFile) return;
    var f = new File(qaFile, 'write', 'TEXT');
    if (f.isopen) { f.eof = 0; for (var i = 0; i < qaLines.length; i++) f.writeline(qaLines[i]); f.close(); }
}

// QA builds only (scripts/build.py --qa): OSC over udpreceive drives the real widgets.
function qa(k, args) {
    if (k === '/qalog') { qaFile = String(args[0]); qalog('state inited=' + inited + ' nodeUp=' + nodeUp + ' spawned=' + spawned + ' path=' + samplePath + ' engine=' + !!obj('engine') + ' tonode=' + !!obj('tonode')); return; }
    if (k === '/drop') drop.apply(this, args);
    else if (k === '/set') widget(args[0], 'float', Number(args[1]));
    else if (k === '/note') note(Number(args[0]), Number(args[1]));
    else if (k === '/node') outlet(1, args);
    else if (k === '/press') { var b = { match: match, reanalyze: reanalyze, reveal: reveal }; if (b[args[0]]) b[args[0]](); }
}

function anything() {
    var k = messagename, a = arguments[0];
    qalog('in ' + k + ' ' + arrayfromargs(arguments).join(' '));
    if (QA && k.charAt(0) === '/') { qa(k, arrayfromargs(arguments)); return; }
    var buttons = { match: match, reanalyze: reanalyze, reveal: reveal, loadbtn: loadbtn };
    if (buttons.hasOwnProperty(k)) {
        if (a === undefined || a === 'bang' || Number(a) > 0.5) buttons[k]();
        return;
    }
    var val = Number(a);
    if (!v.hasOwnProperty(k) || !isFinite(val)) return;
    if (PCT[k]) val = val / 100;
    v[k] = val;
    if (APARAMS.hasOwnProperty(k)) { aparam(k); return; }
    if (k === 'adv') { if (inited) page(); return; }
    if (k === 'morph' || k === 'link') { if (inited) { applyMorph(); dimming(); } return; }
    if (k === 'axis' || k === 'trigmode' || k === 'sync' || k === 'keytrack') if (inited) dimming();
    if (k === 'maxlen') outlet(2, 'maxlen', val);
    if (k === 'tx' || k === 'ty') outlet(3, 'target', v.tx, v.ty);
    if (k === 'axis') outlet(3, 'axis', Math.round(val));
    gen(k);
    if (ENGINE_KEYS.indexOf(k) >= 0) engine(k);
}
