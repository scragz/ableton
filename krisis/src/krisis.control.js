// Krisis control: converts Live parameter values into gen~ params, hides and dims the controls the
// current modes and Detail page don't use, and forwards display state to the panel.
// ES5 only (legacy js). CONTROLS is injected by scripts/build.py: key -> [page, initial value].
autowatch = 1;
inlets = 1;
outlets = 2; // 0 gen~, 1 panel

var CONTROLS = /*__ROSTER__*/null;
var PAGES = ['Voices', 'Matrix', 'Mod', 'Pedal'];
var SYNC_BEATS = [0, 0.25, 0.5, 1, 2, 4, 8, 16];     // keep in sync with SYNC in scripts/build.py
var RANGES = [[350, 2200], [450, 1600]];             // Cry, Vox (approximate; see README)
var QUALITY = [2, 4, 8];

// key -> [gen param, scale]
var DIRECT = {
    stereo: ['p_stereo', 1], width: ['p_width', 1], sdrive: ['p_sdrive', 1], multi: ['p_multi', 1],
    freq: ['p_freq', 1], treadle: ['p_treadle', 0.01], spread: ['p_spread', 0.01], smode: ['p_smode', 1],
    hset: ['p_hset', 1], q: ['p_q', 1], drive: ['p_drive', 1], feedback: ['p_fb', 0.01], core: ['p_core', 0.01],
    linkf: ['p_linkf', 0.01], linkq: ['p_linkq', 0.01], linkd: ['p_linkd', 0.01],
    clip: ['p_clip', 1], curve: ['p_curve', 1], sustain: ['p_sustain', 0.01], leak: ['p_leak', 1],
    topo: ['p_topo', 1], cross: ['p_cross', 0.01],
    attr: ['p_attr', 1], crate: ['p_crate', 1], caudio: ['p_caudio', 1], entropy: ['p_entropy', 0.01],
    alpha: ['p_alpha', 1], beta: ['p_beta', 1], forcing: ['p_forcing', 0.01], diverge: ['p_diverge', 0.01],
    cseed: ['p_cseed', 1], freeze: ['p_freeze', 1], cstereo: ['p_cstereo', 1],
    wah: ['p_wah', 1], taper: ['p_taper', 0.01], body: ['p_body', 0.01], tsrc: ['p_tsrc', 1],
    mass: ['p_mass', 0.01], damping: ['p_damp', 0.01], tlink: ['p_tlink', 1],
    esens: ['p_esens', 1], eatk: ['p_eatk', 1], erel: ['p_erel', 1], edir: ['p_edir', 1],
    lrate: ['p_lrate', 1], lshape: ['p_lshape', 1], tsens: ['p_tsens', 0.01], ttime: ['p_ttime', 1],
    tshape: ['p_tshape', 1], caxis: ['p_caxis', 1],
    tap: ['p_tap', 1], gm: ['p_gm', 1], lim: ['p_lim', 1], mix: ['p_mix', 0.01], output: ['p_out', 1], trim: ['p_trim', 1]
};
(function () {
    var v = ['a', 'b', 'c'], r = ['x', 'y', 'z'], i, j;
    for (i = 0; i < 3; i++) {
        DIRECT['tune' + v[i]] = ['p_tune' + v[i], 1];
        DIRECT['q' + v[i]] = ['p_q' + v[i], 1];
        DIRECT['drv' + v[i]] = ['p_drv' + v[i], 1];
        DIRECT['lvl' + v[i]] = ['p_lvl' + v[i], 1];
        DIRECT['on' + v[i]] = ['p_on' + v[i], 1];
        DIRECT['tgt' + r[i]] = ['p_tgt' + r[i], 1];
        DIRECT['dep' + r[i]] = ['p_dep' + r[i], 0.01];
        for (j = 0; j < 3; j++) DIRECT['m' + v[i] + v[j]] = ['p_m' + v[i] + v[j], 0.01];
    }
})();

var state = {};
var resets = 0;
for (var k0 in CONTROLS) if (CONTROLS.hasOwnProperty(k0)) state[k0] = CONTROLS[k0][1];

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function idx(k) { return Math.round(state[k]); }

// Scatter offsets (octaves, -1.5..1.5) from the stored seed: Park-Miller, a few steps per voice.
function scatter(seed) {
    var s = (Math.round(seed) % 2147483646) + 1, out = [], i, n;
    for (i = 0; i < 3; i++) {
        for (n = 0; n < 3; n++) s = (s * 16807) % 2147483647;
        out.push((s / 2147483647 - 0.5) * 3);
    }
    return out;
}

function wahRange() {
    var r = idx('range');
    if (r < 2) return RANGES[r];
    return [state.wmin, Math.max(state.wmax, state.wmin * 1.01)];
}

function send(key) {
    var v = state[key];
    if (DIRECT.hasOwnProperty(key)) outlet(0, DIRECT[key][0], v * DIRECT[key][1]);
    else if (key === 'sseed') {
        var s = scatter(v);
        outlet(0, 'p_sca', s[0]); outlet(0, 'p_scb', s[1]); outlet(0, 'p_scc', s[2]);
    } else if (key === 'range' || key === 'wmin' || key === 'wmax') {
        var w = wahRange();
        outlet(0, 'p_wmin', w[0]); outlet(0, 'p_wmax', w[1]);
    } else if (key === 'quality') outlet(0, 'p_os', QUALITY[clamp(idx('quality'), 0, 2)]);
    else if (key === 'lsync') outlet(0, 'p_lbeats', SYNC_BEATS[clamp(idx('lsync'), 0, SYNC_BEATS.length - 1)]);
    outlet(1, 'param', key, v);
}

// ---- visibility: Detail page membership plus mode-dependent swaps ----
function visible(k) {
    var page = CONTROLS[k] ? CONTROLS[k][0] : '';
    if (page && page !== PAGES[clamp(idx('page'), 0, 3)]) return false;
    if (k === 'freq') return idx('wah') === 0;
    if (k === 'treadle') return idx('wah') > 0;
    if (k === 'hset') return idx('smode') === 2;
    if (k === 'sseed') return idx('smode') === 4;
    if (k === 'entropy') return idx('attr') === 0;
    if (k === 'alpha' || k === 'beta') return idx('attr') === 1;
    return true;
}

function enabled(k) {
    var wah = idx('wah'), tsrc = idx('tsrc');
    if (k === 'width') return idx('stereo') === 1;
    if (k === 'sdrive') return idx('stereo') === 2;
    if (k === 'spread' || k === 'smode' || k === 'hset' || k === 'sseed' || k === 'linkf') return wah === 0;
    if (k === 'cross') return idx('topo') === 2;
    if (/^m[abc][abc]$/.test(k)) return idx('topo') === 3;
    if (k === 'sustain') return idx('clip') !== 1;
    if (k === 'treadle') return tsrc === 0;
    if (k === 'range' || k === 'tsrc' || k === 'tlink' || k === 'taper' || k === 'mass' || k === 'damping') return wah > 0;
    if (k === 'wmin' || k === 'wmax') return wah > 0 && idx('range') === 2;
    if (k === 'esens' || k === 'eatk' || k === 'erel' || k === 'edir') return tsrc === 1;
    if (k === 'lrate') return tsrc === 3 && idx('lsync') === 0;
    if (k === 'lshape' || k === 'lsync') return tsrc === 3;
    if (k === 'tsens' || k === 'ttime' || k === 'tshape') return tsrc === 4;
    if (k === 'caxis') return tsrc === 2 || tsrc === 4;
    if (/^(on|tune|q|drv|lvl)[bc]$/.test(k)) return wah !== 2;
    if (k === 'trim') return state.gm > 0.5;
    return true;
}

var shown = {}, lit = {};
function refresh() {
    for (var k in CONTROLS) {
        if (!CONTROLS.hasOwnProperty(k)) continue;
        var o = this.patcher ? this.patcher.getnamed(k) : null;
        if (!o) continue;
        var vis = visible(k), on = enabled(k);
        if (shown[k] !== vis) { o.message('hidden', vis ? 0 : 1); shown[k] = vis; }
        if (lit[k] !== on && k.indexOf('route') !== 0) { o.message('active', on ? 1 : 0); lit[k] = on; }
    }
}

var MODAL = { page: 1, wah: 1, smode: 1, attr: 1, stereo: 1, topo: 1, clip: 1, tsrc: 1, range: 1, lsync: 1, gm: 1 };

function init() {
    for (var k in state) if (state.hasOwnProperty(k) && k !== 'creset') send(k);
    outlet(0, 'p_creset', resets);
    shown = {}; lit = {};
    refresh();
}

function anything() {
    var k = messagename;
    if (!state.hasOwnProperty(k)) return;
    var v = Number(arguments[0]);
    if (k === 'creset') {
        // momentary live.text: count presses; gen~ reseeds when the count changes
        if (arguments[0] === 'bang' || v > 0.5) { resets += 1; outlet(0, 'p_creset', resets); }
        return;
    }
    if (!isFinite(v)) return;
    state[k] = v;
    send(k);
    if (MODAL[k]) refresh();
}
