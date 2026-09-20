/* eslint-disable no-var, no-unused-vars, prefer-rest-params, prefer-spread -- ES5 for Max's classic JS engine. */
// Derived from Fluxion lib/rhythm.ts; maintained locally for this Max device.

if (!Math.expm1) Math.expm1 = function(x) { return Math.abs(x) < 0.00001 ? x + x*x/2 + x*x*x/6 : Math.exp(x)-1; };
if (!Math.imul) Math.imul = function(a,b) { return ((a & 65535)*b + ((((a >>> 16)*b) & 65535) << 16)) | 0; };
if (!Array.from) Array.from = function(a,fn) { var out=[]; for(var i=0;i<a.length;i++) out.push(fn ? fn(a[i],i) : a[i]); return out; };
if (!String.prototype.startsWith) String.prototype.startsWith = function(s) { return this.slice(0,s.length) === s; };
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var LANES = ['Main', 'Aux 1', 'Aux 2'];
var AUX_MODES = __spreadArray(__spreadArray(__spreadArray([
    'OFF',
    'COPY',
    'SOS',
    'FIRST',
    'LAST'
], Array.from({ length: 8 }, function (_, i) { return "DEL ".concat(i + 1); }), true), Array.from({ length: 16 }, function (_, i) { return "TL ".concat(i + 1); }), true), [
    'PPQ 1',
    'PPQ 2',
    'PPQ 4',
    'PPQ 8',
    'PPQ 16',
    '/2',
    '/4',
    '/8',
    '/16',
], false);
var DEFAULT_STEP = {
    density: 4,
    length: 16,
    curve: 0,
    divisions: 1,
    curveVariant: 0,
    differential: 0,
    phase: 0,
    compress: 0,
    humanize: 0,
    probability: 100,
    probabilityMode: 'Trigger',
    gate: 30,
    mask: 0,
    maskCount: 1,
    maskShift: 0,
    aux1: 'OFF',
    aux2: 'OFF',
    lfoRate: 1,
    lfoDepth: 0,
    lfoTarget: 'Main',
    lfoShape: 'Sine',
};
function initialChannels() {
    return ['Ember', 'Moss', 'Cobalt', 'Rose'].map(function (name, c) { return ({
        name: name,
        color: ['#efae63', '#b2d493', '#85bff0', '#e994a4'][c],
        muted: false,
        volume: 0.7,
        loopStart: 0,
        loopEnd: 3,
        notes: [
            [36, 43, 45],
            [38, 39, 40],
            [42, 44, 46],
            [50, 56, 70],
        ][c],
        steps: Array.from({ length: 16 }, function (_, i) { return (__assign(__assign({}, DEFAULT_STEP), { density: [4, 3, 8, 5][c] + (i % 4 === 3 ? 2 : 0), curve: i % 4 === 1 ? [1.5, -1.1, 0.8, -0.8][c] : i % 4 === 3 ? -1 : 0, aux1: c === 0 ? 'TL 2' : c === 1 ? 'LAST' : c === 2 ? 'TL 3' : 'DEL 2', aux2: 'OFF', lfoDepth: c === 2 ? 28 : 0, lfoRate: c === 2 ? 2 : 1 })); }),
    }); });
}
function random(seed) {
    var a = seed | 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function warp(x, amount) {
    return Math.abs(amount) < 0.0001
        ? x
        : Math.expm1(amount * x) / Math.expm1(amount);
}
// The manual does not publish the hardware catalog. These are musical
// interpretations: N divisions offers variants .0 through .N (1 is normal).
var CURVE_NAMES = ["Repeat", "Alternate", "Rise", "Fall", "Call / response",
    "Arch", "Valley", "Wave", "3-3-2"];
var CURVE_DESCRIPTIONS = [
    "The same bend in every subgrid.",
    "Positive and negative bends alternate.",
    "Bends grow from quarter strength to full strength.",
    "Bends fall from full strength to quarter strength.",
    "Full bends alternate with gentler opposite bends.",
    "Bends grow toward the middle, then ease away.",
    "Strong outer bends surround a gentler middle.",
    "Bends move from positive to negative across the step.",
    "Strong bends on a 3-3-2 grouping, with gentler opposite responses."
];
var CURVE_MODES = [{label: "1", divisions: 1, variant: 0, name: "Normal"}];
for (var curveParts = 2; curveParts <= 8; curveParts++) {
    for (var curveVariation = 0; curveVariation <= curveParts; curveVariation++) {
        CURVE_MODES.push({label: curveParts + "." + curveVariation,
            divisions: curveParts, variant: curveVariation, name: CURVE_NAMES[curveVariation]});
    }
}
function curveModeIndex(s) {
    var variant = s.curveVariant || 0;
    for (var i = 0; i < CURVE_MODES.length; i++) {
        if (CURVE_MODES[i].divisions === s.divisions && CURVE_MODES[i].variant === variant) return i;
    }
    return 0;
}
function curveWeight(segment, parts, variant) {
    if (parts === 1) return 1;
    var position = segment / (parts - 1);
    switch (variant) {
        case 1: return segment % 2 ? -1 : 1;
        case 2: return 0.25 + 0.75 * position;
        case 3: return 1 - 0.75 * position;
        case 4: return segment % 2 ? -0.5 : 1;
        case 5: return 0.25 + 0.75 * (1 - Math.abs(2 * position - 1));
        case 6: return 0.25 + 0.75 * Math.abs(2 * position - 1);
        case 7: return Math.cos(Math.PI * position);
        case 8: return segment === 0 || segment === 3 || segment === 6 ? 1 : -0.5;
        default: return 1;
    }
}
function curvePosition(x, s) {
    var parts = s.divisions;
    var segment = Math.min(parts - 1, Math.floor(x * parts));
    var local = x * parts - segment;
    return ((segment + warp(local, s.curve * curveWeight(segment, parts, s.curveVariant) +
        (segment % 2 ? 1 : -1) * s.differential)) /
        parts);
}
function generateHits(s, seed, stepStart) {
    if (seed === void 0) { seed = 1; }
    if (stepStart === void 0) { stepStart = 0; }
    var rng = random(seed), main = [];
    var passStep = s.probabilityMode !== 'Step' || rng() * 100 < s.probability;
    var raw = Array.from({ length: s.density }, function (_, i) {
        var x = curvePosition(i / s.density, s);
        var jitter = ((((rng() - 0.5) * s.humanize) / 127) * (s.humanize > 100 ? 2 : 0.5)) /
            Math.max(1, s.density);
        return {
            at: ((x + s.phase / 360) * (1 - s.compress / 100) + jitter) * s.length,
            index: i,
        };
    })
        .filter(function (h) { return h.at >= 0 && h.at < s.length; })
        .sort(function (a, b) { return a.at - b.at; });
    raw.forEach(function (h, i) {
        var _a, _b, _c;
        if (passStep &&
            // Mute maskCount in every mask triggers; maskShift rotates the pattern.
            (!s.mask ||
                (h.index + s.maskShift) % s.mask >=
                    Math.min((_a = s.maskCount) !== null && _a !== void 0 ? _a : 1, s.mask - 1)) &&
            (s.probabilityMode === 'Step' || rng() * 100 < s.probability))
            main.push(__assign(__assign({}, h), { lane: 0, duration: Math.max(0.001, ((((_c = (_b = raw[i + 1]) === null || _b === void 0 ? void 0 : _b.at) !== null && _c !== void 0 ? _c : s.length) - h.at) * s.gate) / 100) }));
    });
    var hits = __spreadArray([], main, true);
    [s.aux1, s.aux2].forEach(function (mode, k) {
        var lane = k + 1;
        var out = [];
        var n = Number(mode.split(' ')[1] || mode.slice(1));
        if (mode === 'COPY')
            out = main;
        else if (mode === 'FIRST')
            out = main.slice(0, 1);
        else if (mode === 'LAST')
            out = main.slice(-1);
        else if (mode === 'SOS')
            out = [
                {
                    at: 0,
                    duration: Math.max(0.01, (s.length * s.gate) / 100),
                    index: 0,
                    lane: lane,
                },
            ];
        else if (mode.startsWith('TL '))
            out = main.filter(function (_, i) { return i % n === 0; });
        else if (mode.startsWith('DEL '))
            out = main
                .map(function (h) { return (__assign(__assign({}, h), { at: h.at + n })); })
                .filter(function (h) { return h.at < s.length; });
        else if (mode.startsWith('PPQ ') || mode.startsWith('/')) {
            var interval = mode.startsWith('PPQ ') ? 4 / n : n * 4;
            var first = (interval - (stepStart % interval)) % interval;
            for (var at = first; at < s.length; at += interval)
                out.push({ at: at, duration: interval * 0.3, index: out.length, lane: lane });
        }
        hits.push.apply(hits, out.map(function (h) { return (__assign(__assign({}, h), { lane: lane, duration: Math.min(h.duration, s.length - h.at) })); }));
    });
    return hits.sort(function (a, b) { return a.at - b.at || a.lane - b.lane; });
}
function seedFor(c, step, cycle) {
    return 107 + c * 99991 + step * 719 + cycle * 1009;
}
