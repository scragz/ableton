// Native QA driver for Autocatalysis (runs inside device/qa/Autocatalysis QA.maxpat in Max).
// Plays scripted cases through the real gen~ and records each to <case>.wav beside the patch, with a
// log (native.log) of every Max console error caught by the [error] object. Speakers stay muted.
// Runs on Max's NonRealTime driver with the scheduler in audio interrupt, so it needs no audio interface
// and every case timer follows audio time. The previous driver settings are restored at the end.
autowatch = 0;
inlets = 1;
outlets = 1;

var NOTE = 45;          // A2, string 2's open pitch
var cases = [
    {name: 'silence', p: {feedback: 100, drive: 40}, ms: 1500, ev: []},
    {name: 'pluck-dry', p: {feedback: 0}, ms: 3000, ev: [[50, 'on']]},
    {name: 'bloom', p: {feedback: 60}, ms: 4000, ev: [[50, 'on']]},
    {name: 'release', p: {feedback: 60}, ms: 4500, ev: [[50, 'on'], [2500, 'off']]},
    {name: 'mute', p: {feedback: 60, ring: 1}, ms: 4500, ev: [[50, 'on'], [2500, 'mute']]},
    {name: 'breathing', p: {feedback: 60, catalysis: 80, rate: 1.5}, ms: 7000, ev: [[50, 'on']]},
    {name: 'seek-off', p: {feedback: 60, distance: 2}, ms: 8000, ev: [[50, 'on']]},
    {name: 'seek-on', p: {feedback: 60, distance: 2, seek: 1}, ms: 8000, ev: [[50, 'on']]},
    {name: 'seek-oct', p: {feedback: 60, distance: 0.5, seek: 1, harm: 1}, ms: 8000, ev: [[50, 'on']]},
    {name: 'stereo-mono', p: {feedback: 60, offset: 0, spread: 0}, ms: 3000, ev: [[50, 'on']]},
    {name: 'chord-extreme', p: {feedback: 100, drive: 40, catalysis: 100, rate: 8, body: 100, stage: 100, distance: 0.1},
        ms: 4000, ev: [[50, 'chord']]}
];
var defaults = {sustain: 6000, pick: 60, damp: 35, ring: 0, mute: 0, body: 30, spread: 70,
    drive: 20, bias: 20, tone: 0, cab: 1, sag: 40, recover: 250, catalysis: 25, rate: 0.7,
    distance: 1.2, offset: 0.4, stage: 30, seek: 0, harm: 0, feedback: 40, output: -6};

var ROOT = '', loglines = [], index = -1, timers = [];
var begin = new Task(run, this), next = new Task(nextcase, this);
var start = new Task(record, this), end = new Task(finish, this);

function folder() {
    var f = this.patcher.filepath;
    return f.substring(0, f.lastIndexOf('/'));
}
function log(s) {
    loglines.push(s);
    var f = new File(ROOT + '/native.log', 'write', 'TEXT');
    f.eof = 0;
    f.writeline(loglines.join('\n'));
    f.close();
}
function logerror() { log('ERROR ' + arrayfromargs(arguments).join(' ')); }
var saved = {};
function adsr(v) { if (saved.adsr === undefined) saved.adsr = v; }
function adto(v) { if (saved.adto === undefined) saved.adto = v; }
function adod(v) { if (saved.adod === undefined) saved.adod = v; }
function setting(name, v) { var o = this.patcher.getnamed(name); if (o) o.message(v); }
function bang() {
    ROOT = folder(); log('OPEN ' + ROOT);
    setting('adsr', 'bang'); setting('adto', 'bang'); setting('adod', 'bang');
    messnamed('dsp', 'setdriver', 'NonRealTime');
    setting('adsr', 48000); setting('adto', 1); setting('adod', 1);
    begin.schedule(2500);
}
function param(k, v) { var o = this.patcher.getnamed(k); if (o) o.message(v); else log('MISSING ' + k); }
function control() { var c = this.patcher.getnamed('control'); c.message.apply(c, arrayfromargs(arguments)); }
function run() { this.patcher.getnamed('dacon').message(1); control('init'); nextcase(); }
function nextcase() {
    index++;
    if (index >= cases.length) {
        messnamed('dsp', 'stop');
        if (saved.adto !== undefined) setting('adto', saved.adto);
        if (saved.adod !== undefined) setting('adod', saved.adod);
        messnamed('dsp', 'setdriver', 'Core Audio');
        if (saved.adsr !== undefined) setting('adsr', saved.adsr);
        log('RESTORED ' + JSON.stringify(saved));
        log('DONE ' + cases.length);
        return;
    }
    var c = cases[index], k;
    control('allnotesoff');
    this.patcher.getnamed('dsp').message('reset');
    for (k in defaults) param(k, defaults[k]);
    for (k in c.p) param(k, c.p[k]);
    start.schedule(300);
}
function fire(what) {
    if (what === 'on') control('note', NOTE, 100);
    else if (what === 'off') control('note', NOTE, 0);
    else if (what === 'mute') param('mute', 1);
    else if (what === 'chord') { control('note', 40, 127); control('note', 47, 127); control('note', 52, 127); control('note', 64, 127); }
}
function record() {
    var r = this.patcher.getnamed('record'), c = cases[index], i;
    r.message('samptype', 'float32');
    r.message('open', ROOT + '/' + c.name + '.wav', 'wave');
    r.message(1);
    for (i = 0; i < c.ev.length; i++) {
        var t = new Task(fire, this, c.ev[i][1]);
        t.schedule(c.ev[i][0]);
        timers.push(t);
    }
    end.schedule(c.ms);
}
function finish() {
    this.patcher.getnamed('record').message(0);
    log('CASE ' + cases[index].name);
    timers = [];
    next.schedule(100);
}
function notifydeleted() { begin.cancel(); next.cancel(); start.cancel(); end.cancel(); }
