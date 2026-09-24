// Atomism face: section headers/dividers, grain map, window preview, pitch histogram, entropy
// view, meters and readouts. Background only (ignoreclick): every control is a native live.*
// object laid over it.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("atomism.theme.js");

// Must match the layout in scripts/build.py.
var FIELDSETS = [[2, 0, 186, 168, 'Trigger'], [190, 0, 180, 168, 'Grain'], [372, 0, 236, 168, 'Buffer'],
    [610, 0, 120, 168, 'Pitch'], [732, 0, 120, 168, 'Entropy'], [854, 0, 110, 168, 'Output']];
var MAP = [380, 20, 220, 80], WIN = [304, 100, 58, 50], HIST = [672, 100, 50, 50],
    ENT = [740, 82, 56, 68], METER = [914, 22, 40, 70], READ = [500, 104];
var SPAN = 1.2;     // seconds of buffer shown in the map (matches the 1.2 s scale in the gen code)
var LIFE = 1.2;     // seconds a grain stays on screen
var SOURCES = ['Free', 'Sync', 'Onset', 'Chaos'], ENTROPIES = ['Noise', 'Logistic', 'Lorenz'];

var view = null, d = [], trail = [];
var win = 1, sizeMs = 2.5, vary = 0.3, source = 0, entropy = 1, density = 120, division = '1/16', chaos = 0.85;
function viewbuffer(name) { view = new Buffer(name); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Same curves as the voices in atomism.genexpr.
function windowAt(x) {
    if (win === 1) return 1 - Math.abs(2 * x - 1);
    if (win === 2) return 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
    if (win === 3) return Math.exp(-6 * x);
    return 1;
}

// Grains still on screen, oldest first: {dist, pitch, dir, draw, age}.
function grains() {
    var out = [], now = d[240] || 0, rp = Math.round(d[251] || 0), k, i, b, age;
    for (k = 0; k < 48; k++) {
        i = (rp + k) % 48;
        b = d[i * 5 + 4] || 0;
        if (b <= 0) continue;
        age = now - b;
        if (age < 0) age += 10000;
        out.push({ dist: d[i * 5] || 0, pitch: d[i * 5 + 1] || 0, dir: d[i * 5 + 2] || 0, draw: d[i * 5 + 3] || 0, age: age });
    }
    return out;
}

function paint() {
    thSections(FIELDSETS);
    var list = grains(), i, g, x, y, px, py;

    // Grain map: x = how far back in the buffer (right edge = now, sqrt scale), y = pitch (centre = 0 st).
    g = MAP;
    thWell(g[0], g[1], g[2], g[3]);
    var top = g[1] + 16, bot = g[1] + g[3] - 4, mid = (top + bot) / 2, half = (bot - top) / 2;
    // grid at 0.1 / 0.4 / 0.9 s back (sqrt scale)
    for (i = 1; i < 4; i++) thRect(g[0] + g[2] - 4 - Math.round(Math.sqrt([0.1, 0.4, 0.9][i - 1] / SPAN) * (g[2] - 8)), top, 1, bot - top, THEME.line);
    thRect(g[0] + 2, Math.round(mid), g[2] - 4, 1, THEME.line);
    for (i = 0; i < list.length; i++) {
        var e = list[i];
        if (e.age > LIFE) continue;
        // sqrt scale so the default few-ms-to-60-ms sprays are not all piled on the right edge
        x = g[0] + g[2] - 4 - Math.sqrt(clamp(e.dist, 0, 1)) * (g[2] - 8);
        y = mid - clamp(e.pitch, -1, 1) * half;
        thRect(x - 1, y - 2.5, 2, 5, e.dir < 0 ? THEME.line1 : THEME.line2, 1 - e.age / LIFE);
    }
    var t = SOURCES[source];
    if (source === 0) t += ' · ' + (density >= 100 ? Math.round(density) : density.toFixed(1)) + '/s';
    else if (source === 1) t += ' · ' + division + (d[245] > 0.5 && d[246] > 0 ? ' · ' + (60 / d[246]).toFixed(1) : ' · free');
    thText(thFit(t, 150, THEME.size), g[0] + 5, g[1] + 11, THEME.dim, THEME.size);
    var right = g[0] + g[2] - 5;
    if (source === 2) {
        var flash = d[241] || 0;
        thColor(flash > 0.05 ? THEME.handle1 : THEME.dim, flash > 0.05 ? clamp(flash, 0.3, 1) : 0.6);
        mgraphics.ellipse(right - 6, g[1] + 4, 6, 6);
        mgraphics.fill();
        right -= 12;
    }
    if (d[243] > 0.5) thText('Hold', right, g[1] + 11, THEME.handle1, THEME.size, 2);

    // Readouts under the map.
    thText('Voices ' + Math.round((d[244] || 0) * 16) + ' / 16', READ[0], READ[1] + 22, THEME.dim, THEME.readout);
    var et = entropy === 0 ? 'Noise' : entropy === 1 ? 'r ' + (3.5 + chaos * 0.5).toFixed(3) : 'rho ' + (18 + chaos * 32).toFixed(1);
    thText(et, READ[0], READ[1] + 38, THEME.dim, THEME.readout);

    // Window preview: the well spans the longest grain Vary allows; faint = shortest / longest.
    g = WIN;
    thWell(g[0], g[1], g[2], g[3]);
    var longest = Math.pow(2, 2 * vary), base = g[1] + g[3] - 3, h = g[3] - 18, x0 = g[0] + 3, w = g[2] - 6;
    var scales = vary > 0.01 ? [Math.pow(2, -2 * vary), Math.pow(2, 2 * vary), 1] : [1];
    mgraphics.set_line_width(1);
    for (var s = 0; s < scales.length; s++) {
        var len = w * scales[s] / longest;
        thColor(THEME.line1, s === scales.length - 1 ? 1 : 0.35);
        if (win === 0) {
            mgraphics.move_to(x0, base); mgraphics.line_to(x0, base - h);
            mgraphics.line_to(x0 + len, base - h); mgraphics.line_to(x0 + len, base);
        } else for (i = 0; i <= 60; i++) {
            px = x0 + len * i / 60; py = base - windowAt(i / 60) * h;
            if (i === 0) { mgraphics.move_to(px, base); mgraphics.line_to(px, py); } else mgraphics.line_to(px, py);
        }
        mgraphics.stroke();
    }
    thText(sizeMs >= 10 ? sizeMs.toFixed(0) + ' ms' : sizeMs.toFixed(1) + ' ms', g[0] + 4, g[1] + 11, THEME.dim, THEME.size);

    // Pitch histogram of grains on screen: -36 st at the bottom, +36 at the top, bars from the left.
    g = HIST;
    thWell(g[0], g[1], g[2], g[3]);
    var bins = [], nb = 24, most = 1, b;
    for (i = 0; i < nb; i++) bins.push(0);
    for (i = 0; i < list.length; i++) if (list[i].age <= LIFE) {
        b = clamp(Math.floor((list[i].pitch + 1) / 2 * nb), 0, nb - 1);
        bins[b]++;
        most = Math.max(most, bins[b]);
    }
    var bh = (g[3] - 4) / nb;
    for (i = 0; i < nb; i++) if (bins[i]) thRect(g[0] + 2, g[1] + g[3] - 2 - (i + 1) * bh, Math.max(1, (g[2] - 4) * bins[i] / most), Math.max(1, bh - 0.5), THEME.line1);
    thRect(g[0] + 1, Math.round(g[1] + g[3] / 2), g[2] - 2, 1, THEME.line);

    // Entropy: Lorenz shows the x/z trail; Noise and Logistic show the return map
    // (each grain's draw against the next), so a settled cycle is a few fixed dots.
    g = ENT;
    thWell(g[0], g[1], g[2], g[3]);
    var ix = g[0] + 3, iy = g[1] + 3, iw = g[2] - 6, ih = g[3] - 6;
    if (entropy === 2) {
        mgraphics.set_line_width(1);
        for (i = 1; i < trail.length; i++) {
            thLine(ix + trail[i - 1][0] * iw, iy + (1 - trail[i - 1][1]) * ih, ix + trail[i][0] * iw, iy + (1 - trail[i][1]) * ih,
                THEME.line2, 1, i / trail.length);
        }
        if (trail.length) {
            var last = trail[trail.length - 1];
            thRect(ix + last[0] * iw - 1.5, iy + (1 - last[1]) * ih - 1.5, 3, 3, THEME.handle2);
        }
    } else {
        if (entropy === 1) {
            var r = 3.5 + chaos * 0.5;
            thColor(THEME.line, 1);
            for (i = 0; i <= 40; i++) {
                px = ix + i / 40 * iw; py = iy + (1 - r * (i / 40) * (1 - i / 40)) * ih;
                if (i === 0) mgraphics.move_to(px, py); else mgraphics.line_to(px, py);
            }
            mgraphics.stroke();
        }
        for (i = 1; i < list.length; i++) {
            thRect(ix + list[i - 1].draw * iw - 1, iy + (1 - list[i].draw) * ih - 1, 2, 2, THEME.line2, 0.35 + 0.65 * i / list.length);
        }
    }

    // Output meters, -60..0 dBFS.
    g = METER;
    var mw = (g[2] - 2) / 2;
    for (i = 0; i < 2; i++) {
        var pk = d[249 + i] || 0, lv = clamp((20 * Math.log(Math.max(pk, 1e-6)) / Math.LN10 + 60) / 60, 0, 1);
        thWell(g[0] + i * (mw + 2), g[1], mw, g[3]);
        if (lv > 0) thRect(g[0] + i * (mw + 2), g[1] + g[3] * (1 - lv), mw, g[3] * lv, THEME.meter);
    }
}

function tick() {
    if (!view) return;
    try { d = view.peek(1, 0, 256) || []; } catch (err) { d = []; }
    if (entropy === 2 && d.length > 248) {
        trail.push([clamp(d[247], 0, 1), clamp(d[248], 0, 1)]);
        if (trail.length > 90) trail.shift();
    }
    mgraphics.redraw();
}
function shape(w, ms, v) { win = Math.round(w); sizeMs = ms; vary = v; mgraphics.redraw(); }
function mode(s, e, dens, div, c) {
    source = Math.round(s); if (Math.round(e) !== entropy) trail = [];
    entropy = Math.round(e); density = dens; division = String(div); chaos = c; mgraphics.redraw();
}
