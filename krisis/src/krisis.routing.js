// Krisis routing: chooses the sources of the two extra stereo inputs (plugin~ 3-4 = pair B,
// 5-6 = pair C) through the Live API's DeviceIO objects ('this_device audio_inputs 1' and '... 2').
// Each pair is its own DeviceIO, so B and C are independent (live.routing handles one port per device).
// Live stores the routing with the device, so nothing here is a parameter.
// The approach follows h1data's ioRouting.js (Apache-2.0); this is a separate, smaller implementation
// that drives two umenus instead of live.menu's unofficial _parameter_range.
// ES5 only. Init from live.thisdevice (not loadbang): the Live API is not ready before it.
autowatch = 1;
inlets = 1;
outlets = 2; // 0 umenu B, 1 umenu C

var PREFIX = ['B: ', 'C: '];
var typesApi = [null, null], routeApi = [null, null], types = [[], []];

// Live returns dictionary properties as a JSON string (sometimes wrapped in an array); callbacks may
// hand over an already-parsed object. Accept all three.
function dict(x, key) {
    if (x && typeof x === 'object' && !(x instanceof Array) && x[key] !== undefined) return x[key];
    var s = String(x instanceof Array ? x.join(' ') : x), i = s.indexOf('{');
    if (i < 0) return null;
    try { var o = JSON.parse(s.slice(i)); return o[key] !== undefined ? o[key] : null; } catch (e) { return null; }
}

function cb0() { refresh(0); }
function cb1() { refresh(1); }
cb0.local = 1;
cb1.local = 1;

function init() {
    for (var p = 0; p < 2; p++) {
        try {
            var path = 'this_device audio_inputs ' + (p + 1);
            typesApi[p] = new LiveAPI(p ? cb1 : cb0, path);
            typesApi[p].property = 'available_routing_types';
            routeApi[p] = new LiveAPI(p ? cb1 : cb0, path);
            routeApi[p].property = 'routing_type';
        } catch (e) {
            typesApi[p] = routeApi[p] = null;
        }
        refresh(p);
    }
}

function refresh(p) {
    var list = null, cur = null, i, sel = -1;
    try {
        if (typesApi[p]) list = dict(typesApi[p].get('available_routing_types'), 'available_routing_types');
        if (routeApi[p]) cur = dict(routeApi[p].get('routing_type'), 'routing_type');
    } catch (e) { list = null; }
    types[p] = list || [];
    outlet(p, 'clear');
    if (!types[p].length) {
        outlet(p, 'append', PREFIX[p] + 'No Input');
        outlet(p, 'set', 0);
        return;
    }
    for (i = 0; i < types[p].length; i++) {
        outlet(p, 'append', PREFIX[p] + types[p][i].display_name);
        if (cur && types[p][i].identifier === cur.identifier) sel = i;
    }
    outlet(p, 'set', sel < 0 ? types[p].length - 1 : sel);
}

function choose(p, i) {
    i = Math.round(i);
    if (!routeApi[p] || !types[p][i]) return;
    try { routeApi[p].set('routing_type', types[p][i]); } catch (e) { post('krisis: could not route input ' + PREFIX[p] + e + '\n'); }
}

function selectb(i) { choose(0, i); }
function selectc(i) { choose(1, i); }
