// Krisis face: section headers and dividers, Detail-page labels, the voice-frequency well, the
// attractor trail, meters and readouts. Background only (ignoreclick): every control is a native
// live.* object laid over it. LAYOUT is injected by scripts/build.py.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("krisis.theme.js");

var LAYOUT = /*__LAYOUT__*/null;
var VOWELS = ['a', 'e', 'i', 'o', 'u'];
var view = null, d = [], trailL = [], trailR = [];
var st = { page: 0, smode: 0, spread: 50, wah: 0, attr: 0, entropy: 52, crate: 0.5, caudio: 0, freeze: 0,
    stereo: 0, cstereo: 0, ona: 1, onb: 1, onc: 1, hset: 0, tgtx: 1, tgty: 5, tgtz: 6, depx: 0, depy: 0, depz: 0 };

function viewbuffer(name) { view = new Buffer(name); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function param(k, v) {
    var before = st[k];
    st[k] = Number(v);
    if ((k === 'attr' || k === 'cstereo' || k === 'stereo') && before !== st[k]) { trailL = []; trailR = []; }
    mgraphics.redraw();
}
function chaosStereo() {
    var c = Math.round(st.cstereo), s = Math.round(st.stereo);
    return c > 0 ? c : (s === 0 ? 2 : (s === 1 ? 3 : 4));
}
function fmtHz(f) { return f >= 1000 ? (f / 1000).toFixed(f >= 10000 ? 1 : 2) + 'k' : Math.round(f) + ''; }

function paint() {
    var i, g, pg = LAYOUT.pages[clamp(Math.round(st.page), 0, LAYOUT.pages.length - 1)];
    thSections(LAYOUT.sections);
    for (i = 0; i < LAYOUT.labels.length; i++) {
        var lb = LAYOUT.labels[i];
        if (lb[3] && lb[3] !== pg) continue;
        thText(lb[2], lb[0], lb[1], THEME.text, THEME.size, lb[4]);
    }
    freqWell();
    spreadReadout();
    chaosWell();
    meters();
}

// Voice frequencies on a log axis (20 Hz .. 20 kHz, bottom to top): left half = L / Mid voices,
// right half = R / Side. In wah mode the sweep range is shaded and the treadle marked.
function freqWell() {
    var g = LAYOUT.wells.freq, x = g[0], y = g[1], w = g[2], h = g[3], i, c;
    thWell(x, y, w, h);
    var top = y + 4, bot = y + h - 4;
    function fy(f) { return bot - clamp(Math.log(Math.max(f, 20) / 20) / Math.log(1000), 0, 1) * (bot - top); }
    var grid = [100, 1000, 10000];
    for (i = 0; i < grid.length; i++) thRect(x + 2, Math.round(fy(grid[i])), w - 4, 1, THEME.line);
    var wahOn = Math.round(st.wah) > 0;
    if (wahOn && d.length > 23) {
        var a = fy(d[23] || 2000), b = fy(d[22] || 400);
        thRect(x + 2, a, w - 4, Math.max(1, b - a), THEME.line, 0.8);
        for (c = 0; c < 2; c++) {
            var lo = d[22] || 400, hi = d[23] || 2000, p = clamp(d[6 + c] || 0, 0, 1);
            var tf = lo * Math.pow(hi / lo, p);
            thRect(x + 2 + c * (w / 2), Math.round(fy(tf)) - 1, w / 2 - 4, 3, THEME.handle1, 0.5);
        }
    }
    var on = [st.ona, Math.round(st.wah) === 2 ? 0 : st.onb, Math.round(st.wah) === 2 ? 0 : st.onc];
    for (c = 0; c < 2; c++) for (i = 0; i < 3; i++) {
        var f = d[c * 3 + i];
        if (!f) continue;
        var yy = Math.round(fy(f)) + 0.5, x0 = x + 4 + c * (w / 2), x1 = x0 + w / 2 - 8;
        thLine(x0, yy, x1, yy, c ? THEME.line2 : THEME.line1, 2, on[i] > 0.5 ? 1 : 0.25);
    }
}

// In the Spread Mode slot, when neither the Harmonic set menu nor the Scatter seed is showing.
function spreadReadout() {
    var g = LAYOUT.wells.freq, x = g[0], y = 44, sm = Math.round(st.smode), sp = clamp(st.spread / 100, 0, 1), t = '';
    if (sm === 2 || sm === 4) return;   // the Harmonic set menu / Scatter seed sit here
    if (Math.round(st.wah) > 0) t = 'Wah';
    else if (sm === 0) t = '±' + (3 * sp).toFixed(1) + ' oct';
    else if (sm === 1) t = '±' + fmtHz(3000 * sp * sp) + ' Hz';
    else if (sm === 3) {
        var m = sp * 4, k = Math.min(Math.floor(m), 3), fr = m - k;
        t = fr < 0.08 ? VOWELS[k] : (fr > 0.92 ? VOWELS[k + 1] : VOWELS[k] + ' → ' + VOWELS[k + 1]);
    }
    if (t) thText(thFit(t, g[2] - 4, THEME.readout), x + 3, y + 13, THEME.dim, THEME.readout);
}

// Attractor trail: Thomas x/y, Chua x/z (the double scroll). R instance as a second trail when the
// chaos stereo method is Diverge.
function chaosWell() {
    var g = LAYOUT.wells.chaos, x = g[0], y = g[1], w = g[2], h = g[3], i, t;
    thWell(x, y, w, h);
    var sw = 24, ix = x + 4, iy = y + 4, iw = w - 8 - sw, ih = h - 8;
    function draw(trail, col) {
        for (i = 1; i < trail.length; i++) {
            thLine(ix + (trail[i - 1][0] + 1) / 2 * iw, iy + (1 - trail[i - 1][1]) / 2 * ih,
                ix + (trail[i][0] + 1) / 2 * iw, iy + (1 - trail[i][1]) / 2 * ih, col, 1, i / trail.length);
        }
        if (trail.length) {
            var p = trail[trail.length - 1];
            thRect(ix + (p[0] + 1) / 2 * iw - 1.5, iy + (1 - p[1]) / 2 * ih - 1.5, 3, 3, THEME.handle2);
        }
    }
    if (chaosStereo() === 3) draw(trailR, THEME.line1);
    draw(trailL, THEME.line2);
    axes(x + w - sw, y, sw, h);
    var chua = Math.round(st.attr) === 1;
    if (chua) {
        var fl = clamp(d[14] || 0, 0, 1);
        thColor(fl > 0.05 ? THEME.handle1 : THEME.dim, fl > 0.05 ? clamp(fl, 0.3, 1) : 0.6);
        mgraphics.ellipse(x + w - sw - 9, y + 3, 6, 6);
        mgraphics.fill();
    }
    if (st.freeze > 0.5) thText('Frozen', x + 4, y + h - 4, THEME.handle1, THEME.size);
    // readouts beside Divergence
    var r = LAYOUT.wells.chaosread, rx = r[0], ry = r[1];
    if (!chua) {
        thText('b', rx, ry + 14, THEME.dim, THEME.readout);
        thText((0.4 * (1 - st.entropy / 100)).toFixed(3), rx, ry + 27, THEME.text, THEME.readout);
    } else {
        thText('Lobe', rx, ry + 14, THEME.dim, THEME.readout);
        thText((d[26] || 1) > 0 ? '+' : '−', rx, ry + 27, THEME.text, THEME.readout);
    }
    var eff = st.crate * (st.caudio > 0.5 ? 40 : 1);
    t = eff >= 100 ? Math.round(eff) + '' : eff >= 10 ? eff.toFixed(1) : eff.toFixed(2);
    thText(t + ' Hz', rx, ry + 44, THEME.dim, THEME.readout);
}

// The three modulation outputs: one track per axis (X, Y, Z), -1 at the bottom, +1 at the top.
// Filled dot = L / Mid rows, ring = R / Side rows (they differ under Rotate, Diverge and Side).
// A row whose Target is Off or whose Depth is 0 is drawn dim.
function axes(x, y, w, h) {
    var names = ['X', 'Y', 'Z'], r = ['x', 'y', 'z'], k, top = y + 6, bot = y + h - 16;
    for (k = 0; k < 3; k++) {
        var cx = x + 4 + k * 7 + 0.5, live = Math.round(st['tgt' + r[k]] || 0) > 0 && Math.abs(st['dep' + r[k]] || 0) > 0.05;
        var a = live ? 1 : 0.35;
        thLine(cx, top, cx, bot, THEME.line, 1);
        var vl = clamp(chaosStereo() === 4 ? 0 : d[8 + k] || 0, -1, 1), vr = clamp(rowR(k), -1, 1);
        var yl = bot - (vl + 1) / 2 * (bot - top), yr = bot - (vr + 1) / 2 * (bot - top);
        if (Math.abs(yr - yl) > 1.5) {
            thColor(THEME.line1, a); mgraphics.set_line_width(1);
            mgraphics.ellipse(cx - 2.5, yr - 2.5, 5, 5); mgraphics.stroke();
        }
        thColor(THEME.line2, a);
        mgraphics.ellipse(cx - 2.5, yl - 2.5, 5, 5); mgraphics.fill();
        thText(names[k], cx, y + h - 4, live ? THEME.text : THEME.dim, THEME.size - 1, 1);
    }
}
// What the R / Side voices read for row k (same rule as the GenExpr's rv*1).
function rowR(k) {
    var m = chaosStereo();
    if (m === 2) return d[8 + (k + 1) % 3] || 0;
    if (m === 3) return d[11 + k] || 0;
    return d[8 + k] || 0;
}

// Output meters (-60..0 dBFS), gain reduction as a bar from the top.
function meters() {
    var g = LAYOUT.wells.meter, x = g[0], y = g[1], w = g[2], h = g[3], i;
    var mw = Math.floor((w - 10) / 2);
    for (i = 0; i < 2; i++) {
        var pk = d[15 + i] || 0, lv = clamp((20 * Math.log(Math.max(pk, 1e-6)) / Math.LN10 + 60) / 60, 0, 1);
        thWell(x + i * (mw + 2), y, mw, h);
        if (lv > 0) thRect(x + i * (mw + 2), y + h * (1 - lv), mw, h * lv, THEME.meter);
    }
    var grx = x + 2 * (mw + 2) + 2, gr = d[19] === undefined ? 1 : d[19];
    thWell(grx, y, w - (grx - x), h);
    var grdb = clamp(-20 * Math.log(Math.max(gr, 1e-6)) / Math.LN10, 0, 24);
    if (grdb > 0.05) thRect(grx, y, w - (grx - x), h * grdb / 24, THEME.handle2);
}

function tick() {
    if (!view) return;
    try { d = view.peek(1, 0, 64) || []; } catch (err) { d = []; }
    if (d.length > 13) {
        var chua = Math.round(st.attr) === 1;
        trailL.push([clamp(d[8], -1, 1), clamp(chua ? d[10] : d[9], -1, 1)]);
        trailR.push([clamp(d[11], -1, 1), clamp(chua ? d[13] : d[12], -1, 1)]);
        if (trailL.length > 120) trailL.shift();
        if (trailR.length > 120) trailR.shift();
    }
    mgraphics.redraw();
}
