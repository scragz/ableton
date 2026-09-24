autowatch = 0;
inlets = 1;
outlets = 1;
var cases = [
    {name:'silence-order-0', p:{core_order:0, input_mute:1}, ms:1800},
    {name:'silence-order-1', p:{core_order:1, input_mute:1}, ms:1800},
    {name:'silence-order-2', p:{core_order:2, input_mute:1}, ms:1800},
    {name:'sample-processing', p:{core_order:0, input_mute:0}, level:0.18, ms:1000},
    {name:'mono-generation', p:{core_order:0, input_mute:1, stereo:0}, ms:1000},
    {name:'stereo-generation', p:{core_order:0, input_mute:1, stereo:1}, ms:1000},
    {name:'high-feedback', p:{core_order:2, input_mute:1, feedback:1.7, fold_depth:12, fold_stages:6, bit_depth:2, hold_samples:32}, ms:1000}
];
var defaults = {input_trim:0, seed_level:-100, input_mute:0, core_order:0,
    fold_stages:2, fold_depth:4, fuzz_bias:0.15, drift_rate:0.027,
    bit_depth:14, hold_samples:1, delay_ms:7, mod_depth:0.3,
    mod_rate:0.13, feedback:1.08, ceiling:-1, drywet:100,
    stereo:1, output_trim:-12};
var loglines = [], index = -1;
var begin = new Task(run, this), next = new Task(nextcase, this);
var start = new Task(record, this), end = new Task(finish, this);
function log(s) {
    loglines.push(s);
    var f = new File(ROOT+'/native.log', 'write', 'TEXT');
    f.eof = 0;
    f.writeline(loglines.join('\n'));
    f.close();
}
function logerror() { log('ERROR '+arrayfromargs(arguments).join(' ')); }
function bang() { log('OPEN'); begin.schedule(1800); }
function param(k,v) { this.patcher.getnamed(k).message(v); }
function run() { this.patcher.getnamed('dacon').message(1); nextcase(); }
function nextcase() {
    index++;
    if (index >= cases.length) {log('DONE '+cases.length);return;}
    var c = cases[index];
    this.patcher.getnamed('dsp').message('reset');
    for (var k in defaults) param(k, defaults[k]);
    for (var key in c.p) param(key, c.p[key]);
    this.patcher.getnamed('level').message(c.level || 0);
    start.schedule(160);
}
function record() {
    var r = this.patcher.getnamed('record');
    r.message('samptype', 'float32');
    r.message('open', ROOT+'/'+cases[index].name+'.wav', 'wave');
    r.message(1);
    end.schedule(cases[index].ms);
}
function finish() {
    this.patcher.getnamed('record').message(0);
    log('CASE '+cases[index].name);
    next.schedule(70);
}
function notifydeleted() { begin.cancel(); next.cancel(); start.cancel(); end.cancel(); }
