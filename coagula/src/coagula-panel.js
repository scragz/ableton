// Coagula face: section headers and dividers, Source readouts (file, format, status, cache),
// the Max length value (the dial's own number is hidden so its top position can read "Off"), and
// the Analysis summary on the advanced page. Background only (ignoreclick): every control is a
// native live.* object laid over it, and the scatter plot is its own jsui.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("coagula-theme.js");

var LAYOUT = /*__LAYOUT__*/null; // sections + readout slots, from scripts/build.py
var adv = 0, st = { code: 'empty', text: 'Drop a sample' }, info = { name: '', secs: 0, sr: 0, ch: 0 };
var cacheInfo = { where: '', dir: '' }, summaryInfo = null, maxLen = 1000, silRatio = -1;

function clock(s) {
    s = Math.max(0, Math.round(s));
    var h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x;
}
function tail(p, width) { // keep the end of a long path
    p = String(p);
    if (thMeasure(p, THEME.readout) <= width) return p;
    while (p.length > 2 && thMeasure('…' + p, THEME.readout) > width) p = p.slice(1);
    return '…' + p;
}

function paint() {
    thSections(adv ? LAYOUT.advSections : LAYOUT.sections);
    var R = LAYOUT.source, x = R[0], w = R[2], y = R[1];
    thText(thFit(info.name || 'No sample', w, THEME.readout), x, y, info.name ? THEME.text : THEME.dim, THEME.readout);
    var fmt = info.secs > 0 ? clock(info.secs) + ' · ' + (info.sr / 1000).toFixed(1) + ' kHz · ' + (info.ch > 1 ? 'Stereo' : 'Mono') : '';
    thText(fmt, x, y + 16, THEME.dim, THEME.readout);
    var col = st.code === 'error' ? THEME.handle1 : st.code === 'ready' ? THEME.text : THEME.dim;
    thText(thFit(st.text, w, THEME.readout), x, y + 32, col, THEME.readout);
    if (cacheInfo.dir) thText(tail((cacheInfo.where === 'sidecar' ? 'Sidecar ' : 'Cache ') + cacheInfo.dir, w), x, y + 48, THEME.dim, THEME.readout);
    if (!adv) {
        var M = LAYOUT.maxlen;
        thText(maxLen >= 999.5 ? 'Off' : maxLen.toFixed(0) + ' ms', M[0], M[1], THEME.text, THEME.readout, 1);
    } else {
        var S = LAYOUT.summary, names = ['Onset', 'Hybrid 400', 'Hybrid 200', 'Fixed'], i;
        if (summaryInfo) {
            for (i = 0; i < 4; i++) {
                thText(names[i], S[0], S[1] + i * 16, THEME.dim, THEME.readout);
                thText(summaryInfo.n[i] + ' segments', S[0] + 70, S[1] + i * 16, THEME.text, THEME.readout);
            }
            thText(summaryInfo.cached ? 'From cache' : 'Analyzed in ' + summaryInfo.secs.toFixed(1) + ' s', S[0], S[1] + 72, THEME.dim, THEME.readout);
            if (silRatio >= 0) thText('Pauses ' + Math.round(silRatio * 100) + '% of segments', S[0], S[1] + 88, THEME.dim, THEME.readout);
        } else thText('Not analyzed', S[0], S[1], THEME.dim, THEME.readout);
    }
}

function page(a) { adv = a ? 1 : 0; mgraphics.redraw(); }
function status(code) { st = { code: String(code), text: arrayfromargs(arguments).slice(1).join(' ') }; mgraphics.redraw(); }
function file() { // name may contain spaces; the last three atoms are numbers
    var a = arrayfromargs(arguments);
    info.ch = a.pop(); info.sr = a.pop(); info.secs = a.pop(); info.name = a.join(' ');
    if (!info.name || !Number(info.secs)) { cacheInfo = { where: '', dir: '' }; summaryInfo = null; }
    mgraphics.redraw();
}
function cache(where) { cacheInfo = { where: String(where), dir: arrayfromargs(arguments).slice(1).join(' ') }; mgraphics.redraw(); }
function segcounts(a, b, c, d, secs, cached) { summaryInfo = { n: [a, b, c, d], secs: Number(secs) || 0, cached: Number(cached) > 0 }; mgraphics.redraw(); }
function maxlen(v) { maxLen = v; mgraphics.redraw(); }
function silratio(r) { silRatio = r; mgraphics.redraw(); }
