autowatch = 1;
inlets = 1;
outlets = 2; // gen messages, panel telemetry

var base = {active:0, excite:0.32, tone:110, ratio:1.618, fm:1.8, source:2,
    feedback:0.72, size:0.38, diffusion:0.7, damping:0.55, drive:0.3,
    drift:0.3, coupling:0.25, body:0.35, decay:0.65, space:0.5,
    width:0.75, azimuth:0.5, elevation:0.5, wander:1, rate:0.12, output:-18};
var targets = ["tone", "feedback", "size", "damping", "body", "space"];
var gestureSources = ["excite", "tone", "ratio", "fm", "feedback", "size", "diffusion", "damping", "drive", "drift", "body", "decay", "space"];
var lastGesture = 0;
var percentages = ["excite", "feedback", "size", "diffusion", "damping", "drive", "drift", "coupling", "body", "decay", "space", "width"];
var ready = false;
var readyTask = new Task(function () { ready = true; }, this);
var strikeTask = new Task(function () { outlet(0, "strike", 0); }, this);
var resetTask = new Task(function () { outlet(0, "reset"); sync(); }, this);

function init() {
    ready = false;
    readyTask.cancel();
    sync();
    readyTask.schedule(600);
}
function sync() {
    for (var k in base) {
        outlet(0, k, base[k]);
        outlet(1, "value", k, base[k]);
    }
}
function anything() {
    var key = messagename;
    var v = Number(arguments[0]);
    if (!isFinite(v)) return;
    if (/^m[0-5]$/.test(key)) { outlet(0, key, Math.max(-1, Math.min(1, v))); return; }
    if (!base.hasOwnProperty(key)) return;
    if (percentages.indexOf(key) >= 0) v /= 100;
    var changed = Math.abs(base[key] - v) > 0.00001;
    base[key] = v;
    outlet(0, key, v);
    outlet(1, "value", key, v);
    var now = Date.now();
    if (ready && changed && base.coupling > 0 && gestureSources.indexOf(key) >= 0 && now - lastGesture > 180) {
        lastGesture = now;
        mutate(key, false);
    }
}
function mutate(from, all) {
    var count = all ? 6 : 1 + Math.floor(Math.random() * 3);
    for (var i = 0; i < count; i++) {
        var j = all ? i : Math.floor(Math.random() * 6);
        var v = (Math.random() * 2 - 1) * (all ? 1 : 0.65);
        // Native hidden parameters retain these offsets with the Live Set.
        this.patcher.getnamed("m" + j).message("float", v);
        outlet(1, "connection", from, targets[j]);
    }
}
function reseed() { mutate("reseed", true); }
function strike() {
    if (!base.active) this.patcher.getnamed("active").message("int", 1);
    outlet(0, "strike", 0);
    outlet(0, "strike", 1);
    outlet(1, "connection", "strike", "exciter");
    strikeTask.cancel();
    strikeTask.schedule(40);
}
function panic() {
    this.patcher.getnamed("active").message("int", 0);
    strikeTask.cancel();
    outlet(0, "strike", 0);
    resetTask.cancel();
    resetTask.schedule(150);
    outlet(1, "connection", "network", "cleared");
}
function xy(x, y) {
    this.patcher.getnamed("azimuth").message("float", Math.max(0, Math.min(1, x)));
    this.patcher.getnamed("elevation").message("float", Math.max(0, Math.min(1, y)));
}
function note(pitch, velocity) {
    if (velocity <= 0) return;
    this.patcher.getnamed("tone").message("float", Math.max(25, Math.min(1600, 440 * Math.pow(2, (pitch - 69) / 12))));
    strike();
}
function notifydeleted() {
    readyTask.cancel(); strikeTask.cancel(); resetTask.cancel();
}
