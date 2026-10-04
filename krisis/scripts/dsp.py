"""Krisis DSP: generates the GenExpr for the gen~ codebox.

Six voices (A/B/C x two channels) are written out from one template, so the engine lives here
instead of a hand-written src/*.genexpr. The output has no GenExpr functions (tests/harness.cjs
translates it mechanically). Values computed inside the control-tick block are Histories, because
gen~ locals do not survive from one sample to the next; the oversampled loop works on locals copied
from the Histories and writes them back once per sample.

    python3 scripts/dsp.py            # print the GenExpr
    build.py writes it to device/krisis.genexpr and embeds it in the gen~ codebox

One sample:
    inputs (3 stereo pairs, optional M/S encode) -> envelopes, gate, onsets
    -> chaos (Thomas / Chua, two instances, RK4) -> modulation rows -> treadle (mass-spring)
    -> per-voice Freq / Q / Drive / Feedback -> static gain calibration (control rate)
    -> oversampled loop (2/4/8x): source clippers, injections (own / ring / matrix / excite), Bias Leak,
       Sustain gate, three ZDF SVF voices per channel (core saturation, state clipping), series chain,
       sum, 6th-order decimation low-pass
    -> adaptive trim -> DC block -> M/S decode -> dry/wet -> output -> soft limiter -> ceiling
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAL_FILE = ROOT / 'src' / 'krisis.cal.json'
V = 'abc'
CH = (0, 1)
TICK = 16                      # control-rate period in samples

# Static gain calibration grid (scripts/calibrate.cjs measures it; values are dB, in / out).
CAL_DRIVE = [-12, 0, 12, 24, 36]                 # Drive, dB
CAL_LQ = [-1 + 1.25 * i for i in range(6)]       # log2 Q: 0.5 .. 38
CAL_FB = [0, 1 / 3, 2 / 3, 1]                    # Feedback
CAL_MODES, CAL_CURVES = 3, 4
ND, NQ, NF = len(CAL_DRIVE), len(CAL_LQ), len(CAL_FB)
CAL_N = CAL_MODES * CAL_CURVES * ND * NQ * NF

# Formant table: Peterson & Barney (1952) adult male means, F1 F2 F3 in Hz.
VOWELS = [('a', 730, 1090, 2440), ('e', 530, 1840, 2480), ('i', 270, 2290, 3010),
          ('o', 570, 840, 2410), ('u', 300, 870, 2240)]
FORMANT_REF = 800              # master Freq at which the vowel table is unshifted

# Harmonic sets: log2 of the B and C ratios.
HSETS = [(1.0, math.log2(3)), (math.log2(3), math.log2(5)),
         (math.log2((1 + 5 ** 0.5) / 2), 2 * math.log2((1 + 5 ** 0.5) / 2))]

PARAMS = [
    # name, default, min, max
    ('p_stereo', 0, 0, 2), ('p_width', 3, -24, 24), ('p_sdrive', 12, -24, 36), ('p_multi', 0, 0, 3),
    ('p_freq', 800, 20, 20000), ('p_treadle', 0.5, 0, 1), ('p_spread', 0.5, 0, 1), ('p_smode', 0, 0, 4),
    ('p_hset', 0, 0, 2), ('p_sca', 0, -1.5, 1.5), ('p_scb', 0, -1.5, 1.5), ('p_scc', 0, -1.5, 1.5),
    ('p_q', 4, 0.3, 80), ('p_drive', 6, -24, 48), ('p_fb', 0.3, 0, 1), ('p_core', 0.3, 0, 1),
    ('p_linkf', 1, 0, 1), ('p_linkq', 1, 0, 1), ('p_linkd', 1, 0, 1),
    ('p_clip', 0, 0, 2), ('p_curve', 0, 0, 3), ('p_sustain', 0.4, 0, 1), ('p_leak', 5, 0.5, 40),
    ('p_topo', 0, 0, 3), ('p_cross', 0.3, 0, 1.5),
    ('p_attr', 0, 0, 1), ('p_crate', 0.5, 0.001, 100), ('p_caudio', 0, 0, 1), ('p_entropy', 0.52, 0, 1),
    ('p_alpha', 15.6, 2, 30), ('p_beta', 28, 5, 50), ('p_forcing', 0, 0, 1), ('p_diverge', 0.3, 0, 1),
    ('p_cseed', 1, 0, 100000), ('p_creset', 0, 0, 1000000), ('p_freeze', 0, 0, 1), ('p_cstereo', 0, 0, 4),
    ('p_wah', 0, 0, 2), ('p_wmin', 350, 20, 8000), ('p_wmax', 2200, 20, 16000), ('p_taper', 0.7, 0, 1),
    ('p_body', 0, 0, 1), ('p_tsrc', 0, 0, 4), ('p_mass', 0.3, 0, 1), ('p_damp', 0.4, 0, 1), ('p_tlink', 1, 0, 1),
    ('p_esens', 12, -24, 48), ('p_eatk', 5, 0.1, 500), ('p_erel', 150, 1, 5000), ('p_edir', 0, 0, 1),
    ('p_lrate', 1, 0.01, 50), ('p_lbeats', 0, 0, 64), ('p_lshape', 0, 0, 5),
    ('p_ttime', 300, 5, 10000), ('p_tshape', 0, 0, 3), ('p_tsens', 0.5, 0, 1), ('p_caxis', 0, 0, 3),
    ('p_os', 4, 1, 8), ('p_tap', 1, 0, 1), ('p_gm', 1, 0, 1), ('p_lim', 1, 0, 1), ('p_mix', 1, 0, 1),
    ('p_out', 0, -70, 24), ('p_trim', 2, 0.1, 30),
]
for _v in V:
    PARAMS += [(f'p_tune{_v}', 0, -48, 48), (f'p_q{_v}', 4, 0.3, 80), (f'p_drv{_v}', 6, -24, 48),
               (f'p_lvl{_v}', 0, -70, 12), (f'p_on{_v}', 1, 0, 1)]
for _r in 'xyz':
    PARAMS += [(f'p_tgt{_r}', 0, 0, 10), (f'p_dep{_r}', 0, -1, 1)]
for _i in V:
    for _j in V:
        PARAMS.append((f'p_m{_i}{_j}', 0, 0, 1.5))

# Chaos targets (p_tgt*): 0 Off, 1 Freq, 2 Freq A, 3 Freq B, 4 Freq C, 5 Q, 6 Drive, 7 Feedback,
# 8 Cross, 9 Spread, 10 Treadle. Scale per unit of depth x normalized axis:
MOD_SCALE = {'mf': 2.0, 'mfa': 2.0, 'mfb': 2.0, 'mfc': 2.0, 'mq': 2.0, 'md': 24.0, 'mb': 0.5,
             'mx': 1.5, 'ms': 0.5, 'mt': 0.5}
MOD_TARGETS = ['mf', 'mfa', 'mfb', 'mfc', 'mq', 'md', 'mb', 'mx', 'ms', 'mt']   # index + 1 = p_tgt value

VIEW = 64                       # display buffer length (samples)


def load_cal():
    if CAL_FILE.exists():
        data = json.loads(CAL_FILE.read_text())
        vals = data['db']
        if len(vals) == CAL_N:
            return vals
    return [0.0] * CAL_N


def clip(u):
    """Loop clipper on a plain variable `u`; crv = rounded Curve (tanh, asymmetric diode, sine fold, hard)."""
    return (f'(crv < 0.5 ? tanh({u}) : (crv < 1.5 ? ({u} > 0 ? tanh({u}) : 0.45 * tanh({u} * 2.2222222)) : '
            f'(crv < 2.5 ? sin({u}) : clamp({u}, -1, 1))))')


def svf_coef(n, f, q, sr):
    return (f'{n}g = tan(pi * ({f}) / ({sr}));\n'
            f'    {n}a1 = 1 / (1 + {n}g * ({n}g + {1 / q:.7f}));\n'
            f'    {n}a2 = {n}g * {n}a1;\n'
            f'    {n}a3 = {n}g * {n}a2;')


def deriv(px, py, pz, o):
    """Attractor derivatives into o+x / o+y / o+z. cth selects Thomas; frc is the forcing kick on x."""
    return [f'if (cth) {{',
            f'    {o}x = sin({py}) - bth * {px} + frc;',
            f'    {o}y = sin({pz}) - bth * {py};',
            f'    {o}z = sin({px}) - bth * {pz};',
            f'}} else {{',
            f'    {o}f = -0.7142857 * {px} - 0.2142857 * (abs({px} + 1) - abs({px} - 1));',
            f'    {o}x = calp * ({py} - {px} - {o}f) + frc;',
            f'    {o}y = {px} - {py} + {pz};',
            f'    {o}z = -cbet * {py};',
            f'}}']


def genexpr(cal=None):
    if cal is None:
        cal = load_cal()
    o = []
    w = o.append

    def block(lines, ind='    '):
        for ln in lines:
            w(ind + ln)

    w('// Krisis: three saturating inductor-style band-pass voices per channel with distortion in the')
    w('// resonance loop, chaos modulation and wah. GENERATED by scripts/dsp.py; edit that.')
    w('')
    for n, d, lo, hi in PARAMS:
        w(f'Param {n}({d}, min={lo}, max={hi});')
    w('')
    w('Buffer view;')
    w(f'Data cal({CAL_N}, 1);')
    w('Data vow(5, 3);')
    w('')
    hist = {
        'inited': 0, 'tick': TICK - 1, 'k20': 0.001, 'k10': 0.002, 'k3': 0.005, 'leakA': 0.0002,
        'gRel': 0.999, 'eAk': 0.01, 'eRk': 0.001, 'fAk': 0.01, 'fRk': 0.001, 'kR': 0.0001, 'kT': 0.00001,
        'limR': 0.9998, 'tw0': 60, 'tz0': 0.4, 'fmaxO': 20000,
        'lfreqS': math.log2(800), 'spS': 0.5, 'fbS': 0.3, 'coreS': 0.3, 'bodyS': 0, 'mixS': 1, 'outS': 1,
        'fInj': 1, 'fSt': 0, 'fBo': 0, 'wSer': 0, 'wRing': 0, 'wMat': 0,
        'prevPh': 0, 'beatCnt': 0, 'beatSmp': 22050, 'stillFor': 0,
        'fenv': 0, 'lph': 0, 'lphP': 0, 'shv': 0.5, 'lastRq': -1, 'lobe': 1, 'lobeHit': 0, 'lobeFl': 0,
        'vclk': 0, 'lpk': 0, 'grs': 1, 'pkL': 0, 'pkR': 0, 'dbgN': 0,
    }
    for c in CH:
        for h in ('ge', 'te', 'tf', 'tsl', 'tlo', 'tph', 'tpos', 'tvel', 'rin', 'rwt', 'xep'):
            hist[f'{h}{c}'] = -1 if h == 'tph' else (0.5 if h == 'tpos' else 0)
        hist[f'trm{c}'] = 1
        for n in (1, 2, 3):
            hist[f'q{n}s1{c}'] = 0
            hist[f'q{n}s2{c}'] = 0
        for v in V:
            for h in ('s1', 's2', 'w1', 'hp', 'xp'):
                hist[f'{h}{v}{c}'] = 0
            hist[f'lfs{v}{c}'] = math.log2(800)
            hist[f'lqs{v}{c}'] = 2
            hist[f'dds{v}{c}'] = 6
            hist[f'calT{v}{c}'] = 1
            hist[f'cls{v}{c}'] = 1
    for v in V:
        hist[f'gl{v}'] = 1
        hist[f'glv{v}'] = 1
        hist[f'onS{v}'] = 1
    for n in (1, 2, 3):
        for s in ('a1', 'a2', 'a3'):
            hist[f'dk{n}{s}'] = 0
    for i in CH:
        for a, init in zip('xyz', (0.1, 0.0, 0.0)):
            hist[f'c{a}{i}'] = init
            hist[f'cn{a}{i}'] = 0
            hist[f'cs{a}{i}'] = 0
            hist[f'nmn{a}{i}'] = -3
            hist[f'nmx{a}{i}'] = 3
    for h, init in hist.items():
        w(f'History {h}({init});')
    w('')

    # ---- one-time tables ----
    w('// ---- one-time tables: vowels (log2 Hz) and the static gain calibration (dB) ----')
    w('if (inited < 0.5) {')
    for i, (_, f1, f2, f3) in enumerate(VOWELS):
        for k, f in enumerate((f1, f2, f3)):
            w(f'    poke(vow, {math.log2(f):.6f}, {i}, {k});')
    for i, val in enumerate(cal):
        w(f'    poke(cal, {val:.3f}, {i}, 0);')
    w('    inited = 1;')
    w('}')
    w('')

    # ---- control tick ----
    w(f'// ---- control rate: coefficients every {TICK} samples ----')
    w('sr = samplerate;')
    w('osn = clamp(floor(p_os + 0.5), 1, 8);')
    w('srO = sr * osn;')
    w(f'tk = wrap(tick + 1, 0, {TICK});')
    w('tick = tk;')
    w('if (tk < 0.5) {')
    block([
        'k20 = 1 - exp(-1 / (sr * 0.02));',
        'k10 = 1 - exp(-1 / (sr * 0.01));',
        'k3 = 1 - exp(-1 / (sr * 0.003));',
        'leakA = 1 - exp(-twopi * p_leak / srO);',
        'gRel = exp(-1 / (sr * 0.03 * pow(3000, p_sustain)));',
        'eAk = 1 - exp(-1 / (sr * p_eatk * 0.001));',
        'eRk = 1 - exp(-1 / (sr * p_erel * 0.001));',
        'fAk = 1 - exp(-1 / (sr * 0.005));',
        'fRk = 1 - exp(-1 / (sr * 0.25));',
        'kR = 1 - exp(-1 / (sr * 0.3));',
        'kT = 1 - exp(-1 / (sr * p_trim));',
        'limR = exp(-1 / (sr * 0.12));',
        'tw0 = twopi * 40 * pow(0.025, p_mass);',
        'tz0 = 0.05 * pow(40, p_damp);',
        'fmaxO = min(20000, 0.45 * srO);',
        '// decimation low-pass: 6th-order Butterworth at 0.42 x base rate, run at the oversampled rate',
    ])
    for n, q in ((1, 0.5176381), (2, 0.7071068), (3, 1.9318517)):
        w('    ' + svf_coef(f'dk{n}', '0.42 * sr', q, 'srO'))
    w('}')
    w('')

    # ---- smoothed controls ----
    w('// ---- smoothed controls ----')
    block([
        'lfreqS += (log2(p_freq) - lfreqS) * k20;',
        'spS += (p_spread - spS) * k20;',
        'fbS += (p_fb - fbS) * k20;',
        'coreS += (p_core - coreS) * k20;',
        'bodyS += (p_body - bodyS) * k20;',
        'mixS += (p_mix - mixS) * k20;',
        'outS += (dbtoa(p_out) - outS) * k20;',
        'cm = floor(p_clip + 0.5);',
        'crv = floor(p_curve + 0.5);',
        'fInj += ((cm != 1) - fInj) * k10;',
        'fSt += ((cm >= 1) - fSt) * k10;',
        'fBo += ((cm == 1) - fBo) * k10;',
        'tpo = floor(p_topo + 0.5);',
        'wSer += ((tpo == 1) - wSer) * k10;',
        'wRing += ((tpo == 2) - wRing) * k10;',
        'wMat += ((tpo == 3) - wMat) * k10;',
        'st = floor(p_stereo + 0.5);',
        'msOn = st == 2;',
        'mlt = floor(p_multi + 0.5);',
        'perv = mlt == 1;',
        'xenv = mlt == 2;',
        'xexc = mlt == 3;',
        'wah = floor(p_wah + 0.5);',
        'wahOn = wah > 0.5;',
        'tlk = p_tlink > 0.5;',
        'dth = noise() * 0.0000001;',
    ], ind='')
    for v in V:
        on = f'p_on{v}' if v == 'a' else f'(wah == 2 ? 0 : p_on{v})'
        w(f'on{v} = {on};')
        w(f'gl{v} += (dbtoa(p_lvl{v}) * on{v} - gl{v}) * k10;')
        w(f'glv{v} += (dbtoa(p_lvl{v}) - glv{v}) * k10;')
        w(f'onS{v} += (on{v} - onS{v}) * k10;')
    w('')

    # ---- inputs ----
    w('// ---- inputs: pair 1 (host), B (in 3-4), C (in 5-6); M/S encode per pair ----')
    for p, (l, r) in (('1', ('in1', 'in2')), ('B', ('in3', 'in4')), ('C', ('in5', 'in6'))):
        w(f'x{p}0 = msOn ? ({l} + {r}) * 0.5 : {l};')
        w(f'x{p}1 = msOn ? ({l} - {r}) * 0.5 : {r};')
    for c in CH:
        w(f'xna{c} = x1{c};')
        w(f'xnb{c} = perv ? xB{c} : x1{c};')
        w(f'xnc{c} = perv ? xC{c} : x1{c};')
        w(f'exc{c} = xexc ? (xB{c} + xC{c}) : 0;')
    w('')
    w('// ---- envelopes: Sustain gate (per channel), treadle follower and onsets, chaos forcing ----')
    for c in CH:
        w(f'gin{c} = max(max(abs(xna{c}), abs(xnb{c})), max(abs(xnc{c}), abs(exc{c})));')
        w(f'ge{c} = max(gin{c}, ge{c} * gRel);')
        w(f'gt{c} = p_sustain > 0.995 ? 1 : clamp(ge{c} * 100, 0, 1);')
        w(f'ts{c} = xenv ? xB{c} : x1{c};')
    w('ta0 = tlk ? 0.5 * (abs(ts0) + abs(ts1)) : abs(ts0);')
    w('ta1 = tlk ? ta0 : abs(ts1);')
    for c in CH:
        w(f'te{c} += (ta{c} - te{c}) * (ta{c} > te{c} ? eAk : eRk);')
        w(f'tf{c} += (ta{c} - tf{c}) * (ta{c} > tf{c} ? 0.03 : 0.0008);')
        w(f'tsl{c} += (ta{c} - tsl{c}) * (ta{c} > tsl{c} ? 0.00015 : 0.00006);')
        w(f'tlo{c} = max(tlo{c} - 1, 0);')
        w(f'ons{c} = 0;')
        w(f'if (tlo{c} <= 0 && tf{c} > tsl{c} * (1.25 + (1 - p_tsens) * 2.5) + 0.000001 && tf{c} > dbtoa(-66 + (1 - p_tsens) * 36)) {{')
        w(f'    ons{c} = 1;')
        w(f'    tlo{c} = sr * 0.06;')
        w('}')
    w('fsrc = xenv ? 0.5 * (abs(xC0) + abs(xC1)) : 0.5 * (abs(x10) + abs(x11));')
    w('fenv += (fsrc - fenv) * (fsrc > fenv ? fAk : fRk);')
    w('')

    # ---- host tempo ----
    w('// ---- host tempo (plugphasor~ beat phase on in7), for the synced LFO ----')
    block([
        'ph = in7;',
        'pinc = wrap(ph - prevPh, -0.5, 0.5);',
        'bc = beatCnt;',
        'if (ph < prevPh - 0.5) bc = (bc + 1) % 4096;',
        'prevPh = ph;',
        'beatCnt = bc;',
        'bsm = beatSmp;',
        'still = stillFor;',
        'running = 0;',
        'if (pinc > 0.0000001) {',
        '    bsm = clamp(1 / pinc, sr * 0.1, sr * 4);',
        '    still = 0;',
        '    running = 1;',
        '} else {',
        '    still = min(still + 1, sr);',
        '    running = still < 2048;',
        '}',
        'beatSmp = bsm;',
        'stillFor = still;',
    ], ind='')
    w('')

    # ---- chaos ----
    w('// ---- chaos: Thomas or Chua, two instances (R starts Divergence away), RK4 ----')
    w('cste = p_cstereo > 0.5 ? floor(p_cstereo + 0.5) : (st == 0 ? 2 : (st == 1 ? 3 : 4));  // 1 same 2 rotate 3 diverge 4 side')
    w('cdo = p_caudio > 0.5 ? 1 : (tk < 0.5);')
    w(f'chop = p_caudio > 0.5 ? 1 : {TICK};')
    w('if (cdo) {')
    pre = []
    for s in ('k1', 'k2', 'k3', 'k4'):
        for a in 'xyzf':
            pre.append(f'{s}{a} = 0;')
    block([' '.join(pre[i:i + 8]) for i in range(0, len(pre), 8)])
    block([
        'cth = p_attr < 0.5;',
        'bth = 0.4 * (1 - p_entropy);',
        'calp = p_alpha;',
        'cbet = p_beta;',
        'frc = p_forcing * fenv * (cth ? 6 : 20);',
        '// reseed on Reset, Seed, attractor change or switching into divergence stereo',
        'rq = p_creset + p_cseed * 1000 + (cth ? 0 : 0.5) + (cste == 3 ? 0.25 : 0);',
        'if (abs(rq - lastRq) > 0.000001) {',
        '    h1 = fract(sin(p_cseed * 12.9898 + 1.234) * 43758.5453);',
        '    h2 = fract(sin(p_cseed * 78.233 + 4.321) * 43758.5453);',
        '    h3 = fract(sin(p_cseed * 39.425 + 2.718) * 43758.5453);',
        '    dvg = pow(10, -6 + 5 * p_diverge);',
        '    cx0 = cth ? 2 * h1 - 1 : 0.1 + 0.2 * h1;',
        '    cy0 = cth ? 2 * h2 - 1 : 0.1 * h2;',
        '    cz0 = cth ? 2 * h3 - 1 : 0.1 * h3;',
        '    cx1 = cx0 + dvg;',
        '    cy1 = cy0;',
        '    cz1 = cz0;',
        '    if (cth) {',
        '        nmnx0 = -3; nmxx0 = 3; nmny0 = -3; nmxy0 = 3; nmnz0 = -3; nmxz0 = 3;',
        '    } else {',
        '        nmnx0 = -2.5; nmxx0 = 2.5; nmny0 = -0.5; nmxy0 = 0.5; nmnz0 = -4; nmxz0 = 4;',
        '    }',
        '    nmnx1 = nmnx0; nmxx1 = nmxx0; nmny1 = nmny0; nmxy1 = nmxy0; nmnz1 = nmnz0; nmxz1 = nmxz0;',
        '    lastRq = rq;',
        '}',
        f'dtc = p_freeze > 0.5 ? 0 : clamp(p_crate * (cth ? 6 : 2.5) * (p_caudio > 0.5 ? 40 : 1) * chop / sr, 0, 0.08);',
        'nrk = 1 - exp(-chop / (sr * 12));',
    ])
    for i in CH:
        x, y, z = f'cx{i}', f'cy{i}', f'cz{i}'
        w(f'    // instance {i}')
        w(f'    if (dtc > 0) {{')
        lines = []
        lines += deriv(x, y, z, 'k1')
        lines += [f'p2x = {x} + 0.5 * dtc * k1x;', f'p2y = {y} + 0.5 * dtc * k1y;', f'p2z = {z} + 0.5 * dtc * k1z;']
        lines += deriv('p2x', 'p2y', 'p2z', 'k2')
        lines += [f'p3x = {x} + 0.5 * dtc * k2x;', f'p3y = {y} + 0.5 * dtc * k2y;', f'p3z = {z} + 0.5 * dtc * k2z;']
        lines += deriv('p3x', 'p3y', 'p3z', 'k3')
        lines += [f'p4x = {x} + dtc * k3x;', f'p4y = {y} + dtc * k3y;', f'p4z = {z} + dtc * k3z;']
        lines += deriv('p4x', 'p4y', 'p4z', 'k4')
        lines += [f'{x} = {x} + dtc / 6 * (k1x + 2 * k2x + 2 * k3x + k4x);',
                  f'{y} = {y} + dtc / 6 * (k1y + 2 * k2y + 2 * k3y + k4y);',
                  f'{z} = {z} + dtc / 6 * (k1z + 2 * k2z + 2 * k3z + k4z);',
                  f'if (!(abs({x}) < 100) || !(abs({y}) < 100) || !(abs({z}) < 100)) {{',
                  f'    {x} = 0.1 + 0.001 * {i};', f'    {y} = 0;', f'    {z} = 0;', '}']
        block(lines, ind='        ')
        w('    }')
        for a in 'xyz':
            s, mn, mx = f'c{a}{i}', f'nmn{a}{i}', f'nmx{a}{i}'
            w(f'    nsp = {mx} - {mn};')
            w(f'    {mx} = max({s}, {mx} - nrk * nsp * 0.5);')
            w(f'    {mn} = min({s}, {mn} + nrk * nsp * 0.5);')
            w(f'    cn{a}{i} = clamp(2 * ({s} - {mn}) / max({mx} - {mn}, 0.000001) - 1, -1, 1);')
    block([
        '// lobe switch: sign of x with hysteresis',
        'lb = cx0 > 0.6 ? 1 : (cx0 < -0.6 ? -1 : lobe);',
        'if (lb != lobe) lobeHit = 1;',
        'lobe = lb;',
    ])
    w('}')
    w('lev = lobeHit;')
    w('lobeHit = 0;')
    w('lobeFl = max(lev, lobeFl * 0.9997);')
    for i in CH:
        for a in 'xyz':
            w(f'cs{a}{i} = p_caudio > 0.5 ? cn{a}{i} : cs{a}{i} + (cn{a}{i} - cs{a}{i}) * k3;')
    w('')

    # ---- modulation rows ----
    w('// ---- modulation rows (x, y, z) per channel: Same / Rotate / Diverge / Side ----')
    rot = {'x': 'y', 'y': 'z', 'z': 'x'}
    for r in 'xyz':
        w(f'rv{r}0 = cste == 4 ? 0 : cs{r}0;')
        w(f'rv{r}1 = cste == 2 ? cs{rot[r]}0 : (cste == 3 ? cs{r}1 : cs{r}0);')
        w(f'tg{r} = floor(p_tgt{r} + 0.5);')
    for c in CH:
        for t, name in enumerate(MOD_TARGETS):
            terms = ' + '.join(f'(tg{r} == {t + 1}) * p_dep{r} * rv{r}{c}' for r in 'xyz')
            w(f'{name}{c} = {MOD_SCALE[name]} * ({terms});')
    w('')

    # ---- treadle ----
    w('// ---- treadle: source -> target, mass-spring toward it ----')
    w('tsr = floor(p_tsrc + 0.5);   // 0 pedal 1 env 2 chaos 3 lfo 4 trigger')
    w('cax = floor(p_caxis + 0.5);')
    block([
        '// LFO (one phase; R is a quarter cycle ahead when the treadle is unlinked)',
        'lsyn = p_lbeats > 0.01;',
        'if (lsyn && running) {',
        '    lph = fract((bc + ph) / p_lbeats);',
        '} else if (lsyn) {',
        '    lph = wrap(lph + 1 / (p_lbeats * bsm), 0, 1);',
        '} else {',
        '    lph = wrap(lph + p_lrate / sr, 0, 1);',
        '}',
        'if (lph < lphP - 0.5) shv = noise() * 0.5 + 0.5;',
        'lphP = lph;',
        'lsh = floor(p_lshape + 0.5);',
    ], ind='')
    for c in CH:
        phs = 'lph' if c == 0 else '(tlk ? lph : wrap(lph + 0.25, 0, 1))'
        w(f'lp{c} = {phs};')
        w(f'lv{c} = lsh < 0.5 ? 0.5 - 0.5 * cos(twopi * lp{c}) : (lsh < 1.5 ? 1 - abs(2 * lp{c} - 1) : '
          f'(lsh < 2.5 ? lp{c} : (lsh < 3.5 ? 1 - lp{c} : (lsh < 4.5 ? (lp{c} < 0.5) : shv))));')
    for c in CH:
        w(f'// channel {c}')
        w(f'trg{c} = ons{c} || (cax == 3 && lev > 0.5);')
        w(f'tp = tph{c};')
        w(f'if (trg{c}) tp = 0;')
        w(f'if (tp >= 0) tp += 1 / (sr * p_ttime * 0.001);')
        w(f'if (tp >= 1) tp = -1;')
        w(f'tph{c} = tp;')
        w(f'tsh = floor(p_tshape + 0.5);')
        w(f'swv{c} = tp < 0 ? 0 : (tsh < 0.5 ? tp : (tsh < 1.5 ? 1 - tp : (tsh < 2.5 ? 1 - abs(2 * tp - 1) : exp(-5 * tp))));')
        w(f'tev{c} = clamp(te{c} * dbtoa(p_esens), 0, 1);')
        w(f'if (p_edir > 0.5) tev{c} = 1 - tev{c};')
        w(f'tca{c} = cax == 0 ? rvx{c} : (cax == 1 ? rvy{c} : (cax == 2 ? rvz{c} : (lobe > 0 ? 1 : -1)));')
        w(f'tsv{c} = tsr < 0.5 ? p_treadle : (tsr < 1.5 ? tev{c} : (tsr < 2.5 ? 0.5 + 0.5 * tca{c} : (tsr < 3.5 ? lv{c} : swv{c})));')
        w(f'ttg{c} = clamp(tsv{c} + mt{c}, 0, 1);')
    w('ttg1 = tlk ? ttg0 : ttg1;')
    for c in CH:
        w(f'tvel{c} += (tw0 * tw0 * (ttg{c} - tpos{c}) - 2 * tz0 * tw0 * tvel{c}) / sr;')
        w(f'tpos{c} += tvel{c} / sr;')
        w(f'if (tpos{c} < 0) {{')
        w(f'    tpos{c} = 0;')
        w(f'    tvel{c} = max(tvel{c}, 0);')
        w('}')
        w(f'if (tpos{c} > 1) {{')
        w(f'    tpos{c} = 1;')
        w(f'    tvel{c} = min(tvel{c}, 0);')
        w('}')
    w('wlo = max(p_wmin, 20);')
    w('whi = max(p_wmax, wlo * 1.01);')
    for c in CH:
        w(f'fw{c} = mix(wlo + (whi - wlo) * tpos{c}, wlo * pow(whi / wlo, tpos{c}), p_taper);')
        w(f'lfm{c} = wahOn ? log2(fw{c}) : lfreqS;')
    w('')

    # ---- spread ----
    w('// ---- spread: voice placement in octaves relative to the master ----')
    w('smd = wahOn ? 0 : floor(p_smode + 0.5);')
    w('hs = floor(p_hset + 0.5);')
    w(f'hl2 = hs < 0.5 ? {HSETS[0][0]:.7f} : (hs < 1.5 ? {HSETS[1][0]:.7f} : {HSETS[2][0]:.7f});')
    w(f'hl3 = hs < 0.5 ? {HSETS[0][1]:.7f} : (hs < 1.5 ? {HSETS[1][1]:.7f} : {HSETS[2][1]:.7f});')
    for c in CH:
        w(f'spe{c} = wahOn ? 0 : clamp(spS + ms{c}, 0, 1);')
        w(f'offa{c} = 0;')
        w(f'offb{c} = 0;')
        w(f'offc{c} = 0;')
        w(f'if (smd == 0) {{')
        w(f'    offa{c} = -3 * spe{c};')
        w(f'    offc{c} = 3 * spe{c};')
        w(f'}} else if (smd == 1) {{')
        w(f'    fmh = exp2(lfm{c});')
        w(f'    dlh = 3000 * spe{c} * spe{c};')
        w(f'    offa{c} = log2(max(fmh - dlh, 20) / fmh);')
        w(f'    offc{c} = log2((fmh + dlh) / fmh);')
        w(f'}} else if (smd == 2) {{')
        w(f'    offb{c} = 2 * spe{c} * hl2;')
        w(f'    offc{c} = 2 * spe{c} * hl3;')
        w(f'}} else if (smd == 3) {{')
        w(f'    vm = spe{c} * 4;')
        w(f'    vi = min(floor(vm), 3);')
        w(f'    vf = vm - vi;')
        for k, v in enumerate(V):
            w(f'    off{v}{c} = mix(peek(vow, vi, {k}), peek(vow, vi + 1, {k}), vf) - {math.log2(FORMANT_REF):.6f};')
        w(f'}} else {{')
        for v in V:
            w(f'    off{v}{c} = 2 * spe{c} * p_sc{v};')
        w('}')
    w('')

    # ---- voice parameters ----
    w('// ---- per-voice Freq / Q / Drive and filter coefficients ----')
    w('lfE = wahOn ? 1 : p_linkf;')
    for c in CH:
        w(f'fbv{c} = clamp(fbS + mb{c}, 0, 1);')
        w(f'fbi{c} = fbv{c} * fInj;')
        w(f'crs{c} = clamp(1 + mx{c}, 0, 3);')
        w(f'rga{c} = p_cross * wRing * crs{c};')
        for i in V:
            for j in V:
                w(f'mm{i}{j}{c} = p_m{i}{j} * wMat * crs{c};')
        for v in V:
            wid = ' + (st == 1) * p_width / 12' if c == 1 else ''
            sdr = ' + msOn * p_sdrive' if c == 1 else ''
            w(f'lf = mix(9.9657843, lfm{c} + off{v}{c}, lfE) + p_tune{v} / 12 + mf{c} + mf{v}{c}{wid};')
            w(f'lfs{v}{c} += (lf - lfs{v}{c}) * k10;')
            w(f'fc{v}{c} = clamp(exp2(lfs{v}{c}), 16, fmaxO);')
            w(f'lqs{v}{c} += (mix(log2(p_q{v}), log2(p_q), p_linkq) + mq{c} - lqs{v}{c}) * k10;')
            w(f'dds{v}{c} += (mix(p_drv{v}, p_drive, p_linkd) + md{c}{sdr} - dds{v}{c}) * k10;')
            w(f'dv{v}{c} = max(dbtoa(dds{v}{c}), 0.01);')
            w(f'id{v}{c} = 1 / dv{v}{c};')
            w(f'g0{v}{c} = tan(pi * fc{v}{c} / srO);')
            w(f'kk{v}{c} = 1 / clamp(exp2(lqs{v}{c}), 0.3, 80);')
            w(f'kE{v}{c} = kk{v}{c} * (1 - 0.9 * fbv{c} * fBo);')
            w(f'sk{v}{c} = sqrt(kk{v}{c});')
    w('')

    # ---- calibration lookup ----
    w('// ---- static gain calibration: trilinear in Drive x log2 Q x Feedback, per clip mode and curve ----')
    w('if (tk < 0.5) {')
    sd, sq, sf = CAL_DRIVE[1] - CAL_DRIVE[0], CAL_LQ[1] - CAL_LQ[0], CAL_FB[1] - CAL_FB[0]
    for c in CH:
        for v in V:
            block([
                f'ud = clamp((dds{v}{c} - ({CAL_DRIVE[0]})) / {sd}, 0, {ND - 1.0001});',
                'ud0 = floor(ud);',
                'udf = ud - ud0;',
                f'uq = clamp((lqs{v}{c} - ({CAL_LQ[0]})) / {sq}, 0, {NQ - 1.0001});',
                'uq0 = floor(uq);',
                'uqf = uq - uq0;',
                f'uf = clamp(fbv{c} / {sf:.7f}, 0, {NF - 1.0001});',
                'uf0 = floor(uf);',
                'uff = uf - uf0;',
                f'ub = (cm * {CAL_CURVES} + crv) * {ND * NQ * NF} + ud0 * {NQ * NF} + uq0 * {NF} + uf0;',
                f'cv0 = mix(mix(peek(cal, ub, 0), peek(cal, ub + 1, 0), uff), mix(peek(cal, ub + {NF}, 0), peek(cal, ub + {NF + 1}, 0), uff), uqf);',
                f'cv1 = mix(mix(peek(cal, ub + {NQ * NF}, 0), peek(cal, ub + {NQ * NF + 1}, 0), uff), mix(peek(cal, ub + {NQ * NF + NF}, 0), peek(cal, ub + {NQ * NF + NF + 1}, 0), uff), uqf);',
                f'calT{v}{c} = p_gm > 0.5 ? dbtoa(mix(cv0, cv1, udf)) : 1;',
            ])
    w('}')
    for c in CH:
        for v in V:
            w(f'cls{v}{c} += (calT{v}{c} - cls{v}{c}) * k20;')
    w('')

    # ---- oversampled loop ----
    w('// ---- oversampled voice bank ----')
    loc = []
    for c in CH:
        loc += [f'xe{c} = 0;', f'wet{c} = 0;']
        for n in (1, 2, 3):
            loc += [f'r{n}a{c} = q{n}s1{c};', f'r{n}b{c} = q{n}s2{c};']
        for v in V:
            loc += [f't1{v}{c} = s1{v}{c};', f't2{v}{c} = s2{v}{c};', f'tw{v}{c} = w1{v}{c};', f'th{v}{c} = hp{v}{c};',
                    f'xv{v}{c} = 0;', f'cl{v}{c} = 0;', f'ij{v}{c} = 0;', f'yo{v}{c} = 0;', f'fd{v}{c} = 0;', f'xi{v}{c} = 0;']
    loc += ['gg = 0;', 'b1 = 0;', 'b2 = 0;', 'b3 = 0;', 'u0 = 0;', 'u1 = 0;', 'u2 = 0;', 'u3 = 0;', 'sn = 0;', 'un = 0;', 'uu = 0;',
            'yy = 0;', 'par = 0;', 'ser = 0;', 'fr = 0;', 'tap = p_tap > 0.5;']
    for i in range(0, len(loc), 10):
        w(' '.join(loc[i:i + 10]))
    w('for (j = 0; j < osn; j += 1) {')
    w('    fr = (j + 1) / osn;')
    prev = {'a': 'c', 'b': 'a', 'c': 'b'}
    for c in CH:
        L = []
        L.append(f'// channel {c}: interpolated inputs')
        for v in V:
            L.append(f'xv{v}{c} = mix(xp{v}{c}, xn{v}{c}, fr);')
        L.append(f'xe{c} = mix(xep{c}, exc{c}, fr);')
        L.append('// source clippers: each voice\'s unity-peak output (plus excitation) through the curve at its Drive')
        for v in V:
            L.append(f'uu = dv{v}{c} * (sk{v}{c} * tw{v}{c} + xe{c});')
            L.append(f'cl{v}{c} = {clip("uu")} * id{v}{c};')
        L.append('// injections: own feedback, ring neighbour, matrix row; Bias Leak high-pass; Sustain gate')
        for v in V:
            terms = [f'fbi{c} * cl{v}{c}', f'rga{c} * cl{prev[v]}{c}'] + [f'mm{v}{s}{c} * cl{s}{c}' for s in V]
            L.append(f'uu = {" + ".join(terms)};')
            L.append(f'th{v}{c} += (uu - th{v}{c}) * leakA;')
            L.append(f'ij{v}{c} = (uu - th{v}{c}) * gt{c} + dth;')
        L.append('// voices in order A, B, C (Series feeds each unity-peak output into the next; only the last is calibrated)')
        for v in V:
            if v == 'a':
                L.append(f'xi{v}{c} = xva{c};')
            else:
                L.append(f'xi{v}{c} = mix(xv{v}{c}, fd{prev[v]}{c}, wSer);')
            L += [
                f'yy = 4 * kk{v}{c} * t1{v}{c} * t1{v}{c};',
                f'gg = clamp(g0{v}{c} * (1 + 1.5 * coreS * yy / (1 + yy)), 0.00001, 6.3);',
                f'b1 = 1 / (1 + gg * (gg + kE{v}{c}));',
                'b2 = gg * b1;',
                'b3 = gg * b2;',
                f'u0 = xi{v}{c} + ij{v}{c};',
                f'u3 = u0 - t2{v}{c};',
                f'u1 = b1 * t1{v}{c} + b2 * u3;',
                f'u2 = t2{v}{c} + b2 * t1{v}{c} + b3 * u3;',
                f'sn = 2 * u1 - t1{v}{c};',
                f'un = dv{v}{c} * sn;',
                f't1{v}{c} = mix(sn, {clip("un")} * id{v}{c}, fSt);',
                f't2{v}{c} = 2 * u2 - t2{v}{c};',
                f'tw{v}{c} = u1;',
                f'yo{v}{c} = (tap ? kk{v}{c} * u1 : u1) + bodyS * u2;',
                f'fd{v}{c} = mix(xi{v}{c}, kk{v}{c} * u1, onS{v});',
            ]
        L.append('// sum: Parallel / Ring / Matrix sum all three (-4.8 dB); Series takes C')
        L.append(f'par = 0.5773503 * (gla * clsa{c} * yoa{c} + glb * clsb{c} * yob{c} + glc * clsc{c} * yoc{c});')
        L.append(f'ser = mix(xic{c}, glvc * clsc{c} * yoc{c}, onSc);')
        L.append(f'yy = mix(par, ser, wSer);')
        L.append('// decimation low-pass')
        for n in (1, 2, 3):
            L += [f'u3 = yy - r{n}b{c};',
                  f'u1 = dk{n}a1 * r{n}a{c} + dk{n}a2 * u3;',
                  f'u2 = r{n}b{c} + dk{n}a2 * r{n}a{c} + dk{n}a3 * u3;',
                  f'r{n}a{c} = 2 * u1 - r{n}a{c};',
                  f'r{n}b{c} = 2 * u2 - r{n}b{c};',
                  'yy = u2;']
        L.append(f'wet{c} = yy;')
        block(L)
    w('}')
    for c in CH:
        for n in (1, 2, 3):
            w(f'q{n}s1{c} = fixdenorm(r{n}a{c});')
            w(f'q{n}s2{c} = fixdenorm(r{n}b{c});')
        for v in V:
            w(f's1{v}{c} = fixdenorm(t1{v}{c});')
            w(f's2{v}{c} = fixdenorm(t2{v}{c});')
            w(f'w1{v}{c} = fixdenorm(tw{v}{c});')
            w(f'hp{v}{c} = fixdenorm(th{v}{c});')
            w(f'xp{v}{c} = xn{v}{c};')
        w(f'xep{c} = exc{c};')
    w('')

    # ---- gain match, output ----
    w('// ---- adaptive trim: wet RMS toward input RMS (Trim Speed), +/-6 dB (Series -24..+36 dB: its loss depends')
    w('// on Spread, which no static table covers), held while the input is quiet ----')
    w('tmin = wSer > 0.5 ? 0.0625 : 0.5;')
    w('tmax = wSer > 0.5 ? 64 : 2;')
    for c in CH:
        w(f'ri{c} = perv ? xna{c} * xna{c} + xnb{c} * xnb{c} + xnc{c} * xnc{c} : xna{c} * xna{c} + exc{c} * exc{c};')
        w(f'rin{c} += (ri{c} - rin{c}) * kR;')
        w(f'rwt{c} += (wet{c} * wet{c} - rwt{c}) * kR;')
        w(f'if (p_gm > 0.5) {{')
        w(f'    if (rin{c} > 0.00001) trm{c} += (clamp(sqrt(rin{c} / (rwt{c} + 0.000000000001)), tmin, tmax) - trm{c}) * kT;')
        w(f'}} else trm{c} += (1 - trm{c}) * k20;')
        w(f'wm{c} = dcblock(wet{c} * trm{c});')
    block([
        'wL = msOn ? wm0 + wm1 : wm0;',
        'wR = msOn ? wm0 - wm1 : wm1;',
        '// ---- dry/wet (equal power), output, soft limiter, ceiling (-0.3 dBFS) ----',
        'dg = cos(mixS * halfpi);',
        'wg = sin(mixS * halfpi);',
        'oL = (in1 * dg + wL * wg) * outS;',
        'oR = (in2 * dg + wR * wg) * outS;',
        'gr = 1;',
        'if (p_lim > 0.5) {',
        '    lp = max(max(abs(oL), abs(oR)), lpk * limR);',
        '    lpk = lp;',
        '    gr = lp > 0.75 ? 0.75 / lp : 1;',
        '    grs = gr < grs ? gr : grs + (gr - grs) * k20;',
        '    oL *= grs;',
        '    oR *= grs;',
        '    aL = abs(oL);',
        '    aR = abs(oR);',
        '    if (aL > 0.6) oL = sign(oL) * (0.6 + 0.366 * tanh((aL - 0.6) / 0.366));',
        '    if (aR > 0.6) oR = sign(oR) * (0.6 + 0.366 * tanh((aR - 0.6) / 0.366));',
        '} else {',
        '    lpk = 0;',
        '    grs = 1;',
        '}',
        'o1 = clamp(fixdenorm(oL), -0.966, 0.966);',
        'o2 = clamp(fixdenorm(oR), -0.966, 0.966);',
        'pkL = max(abs(o1), pkL * 0.9997);',
        'pkR = max(abs(o2), pkR * 0.9997);',
    ], ind='')
    w('')
    w('// ---- display state for the face (every 64 samples) ----')
    w('vclk = wrap(vclk + 1, 0, 64);')
    w(f'if (vclk < 1 && dim(view) >= {VIEW}) {{')
    vals = []
    k = 0
    for c in CH:
        for v in V:
            vals.append((k, f'fc{v}{c}')); k += 1                       # 0..5
    vals += [(6, 'tpos0'), (7, 'tpos1')]
    for i in CH:
        for a in 'xyz':
            vals.append((8 + i * 3 + 'xyz'.index(a), f'cs{a}{i}'))       # 8..13
    vals += [(14, 'lobeFl'), (15, 'pkL'), (16, 'pkR'), (17, 'trm0'), (18, 'trm1'), (19, 'grs'), (20, 'gt0'), (21, 'gt1'),
             (22, 'wlo'), (23, 'whi'), (24, 'osn'), (25, 'running'), (26, 'lobe')]
    for c in CH:
        for v in V:
            vals.append((27 + c * 3 + V.index(v), f'cls{v}{c}'))        # 27..32
    vals += [(33, 'fbv0'), (34, 'rin0'), (35, 'rwt0')]
    for idx, expr in vals:
        w(f'    poke(view, {expr}, {idx}, 0);')
    w('}')
    w('')
    w('out1 = o1;')
    w('out2 = o2;')
    return '\n'.join(o) + '\n'


if __name__ == '__main__':
    sys.stdout.write(genexpr())
