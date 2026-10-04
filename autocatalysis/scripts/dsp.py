"""Autocatalysis DSP: generates the GenExpr for the gen~ codebox.

Six strings are written out from one template, so the engine lives here instead of a hand-written
src/*.genexpr. The output has no GenExpr functions (tests/harness.cjs translates it mechanically),
and every value computed in the refresh block is a History, because gen~ locals do not survive
from one sample to the next.

    python3 scripts/dsp.py            # print the GenExpr
    build.py writes it to device/autocatalysis.genexpr and embeds it in the gen~ codebox

Signal path (one sample):
    air delays (written last sample) -> body + injection -> 6 waveguide strings
    -> neck / bridge pickups -> spread -> amp L / amp R (preamp, tone, power + sag reservoir, cab)
    -> air delays (L at Distance, R at Distance + Offset) -> back to the strings
    -> seek (solves the loop phase for the target harmonic, glides the air delay there) -> output
"""

VOICES = 6
TUNING = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]   # standard E A D G B E
NECK, BRIDGE = 0.25, 0.065                               # pickup position, fraction of scale from the bridge
INJ = 0.5                                                # air -> string drive at Feedback 100 %
REFRESH = 16                                             # coefficient refresh period in samples

PARAMS = [
    # name, default, min, max
    ('bend', 0, -12, 12),
    ('sustain', 6, 0.2, 60),
    ('pick', 0.6, 0, 1),
    ('damp', 0.35, 0, 1),
    ('ring', 0, 0, 1),
    ('mutep', 0, 0, 1),
    ('body', 0.3, 0, 1),
    ('spread', 0.7, 0, 1),
    ('feedback', 0.4, 0, 1),
    ('drive', 20, 0, 40),
    ('bias', 0.2, -1, 1),
    ('tone', 0, -1, 1),
    ('cab', 1, 0, 2),
    ('sag', 0.4, 0, 1),
    ('recover', 250, 10, 3000),
    ('catalysis', 0.25, 0, 1),
    ('rate', 0.7, 0.05, 8),
    ('distm', 1.2, 0.1, 8),
    ('ampoff', 0.4, 0, 4),
    ('stage', 0.3, 0, 1),
    ('seek', 0, 0, 1),
    ('harm', 1, 1, 4),
    ('fseek', 110, 16, 4000),
    ('outdb', -6, -70, 6),
]


def svf_coef(n, f, q):
    """Refresh-block code: TPT state-variable filter coefficients into History n_a1 / n_a2 / n_a3 / n_k."""
    return (f'{n}_g = tan(pi * clamp({f}, 10, samplerate * 0.45) / samplerate);\n'
            f'    {n}_k = 1 / ({q});\n'
            f'    {n}_a1 = 1 / (1 + {n}_g * ({n}_g + {n}_k));\n'
            f'    {n}_a2 = {n}_g * {n}_a1;\n'
            f'    {n}_a3 = {n}_g * {n}_a2;\n')


def svf_run(n, s, x):
    """Per-sample code: run filter state s with coefficients n on x. Outputs s_lp, s_bp (unity peak), s_hp."""
    return (f'{s}_v3 = {x} - {s}_c2;\n'
            f'{s}_v1 = {n}_a1 * {s}_c1 + {n}_a2 * {s}_v3;\n'
            f'{s}_v2 = {s}_c2 + {n}_a2 * {s}_c1 + {n}_a3 * {s}_v3;\n'
            f'{s}_c1 = fixdenorm(2 * {s}_v1 - {s}_c1);\n'
            f'{s}_c2 = fixdenorm(2 * {s}_v2 - {s}_c2);\n'
            f'{s}_lp = {s}_v2;\n'
            f'{s}_bp = {n}_k * {s}_v1;\n'
            f'{s}_hp = {x} - {n}_k * {s}_v1 - {s}_v2;\n')


COEFS = ['bd1', 'bd2', 'pun', 'pub', 'chp', 'cbm', 'cpr', 'clp', 'sk1', 'sk2', 'sk3', 'sk4']
STATES = ['bd1', 'bd2', 'puL', 'puR', 'hpL', 'hpR', 'bmL', 'bmR', 'prL', 'prR', 'lpL', 'lpR', 'sk1', 'sk2', 'sk3', 'sk4']

VOICE_HIST = ['ls', 'bu', 'pk', 'lp', 'gd', 'gt', 'sf', 'en', 'hd', 'qn', 'cq']

VOICE_REFRESH = '''
    hd@ = max(g@ > 0.5, ring > 0.5);
    t60@ = mix(hd@ ? sustain : 0.07, 0.025, muteS);
    gt@ = pow(10, -3 / (t60@ * sf@ * bendr));
    // air drive into the string: scaled by what the string loses per period when it is free to ring,
    // so a held string's resonance peak is (1 - g)^-0.3 (more sustain, more feedback) and a muted
    // string, ~35 dB less at any pitch. A damped string (released, Ring off) also barely moves:
    // the fingers soak up the drive, so its coupling drops another 24 dB.
    qn@ = pow(1 - pow(10, -3 / (sustain * sf@ * bendr)), 0.7) * (hd@ > 0.5 ? 1 : 0.06);'''

VOICE = '''
// ---- string @ ----
if (s@ != ls@) {
    ls@ = s@;
    sf@ = f@;
    bu@ = min(samplerate / (f@ * bendr), 4096);
}
sf@ += (f@ - sf@) * glk;
dd@ = clamp(samplerate / (sf@ * bendr) - lgd, 2, 8000);
r@ = wg@.read(dd@, interp="linear");
ta@ = wg@.read(1, interp="linear");
tn@ = wg@.read(1 + NECKD * dd@, interp="linear");
tb@ = wg@.read(1 + BRIDGED * dd@, interp="linear");
lp@ += (r@ - lp@) * la;
gd@ += (gt@ - gd@) * dk;
cq@ += (qn@ - cq@) * dk;
ex@ = 0;
if (bu@ > 0) {
    bu@ -= 1;
    pk@ += (noise() - pk@) * pka;
    ex@ = pk@ * v@ * exg;
}
wg@.write(fixdenorm(lp@ * gd@ + ex@ + inj * cq@));
pickN += ta@ - 0.85 * tn@;
pickB += ta@ - 0.85 * tb@;
en@ += (abs(ta@) - en@) * (abs(ta@) > en@ ? eak : erk);
'''


class Cx:
    """Emits GenExpr for complex arithmetic: each value is a pair of locals <name>r / <name>i."""

    def __init__(self, w, sfx):
        self.w, self.sfx, self.n, self.lines = w, sfx, 0, []

    def new(self, re, im):
        name = f'z{self.n}_{self.sfx}'
        self.n += 1
        self.lines.append(f'{name}r = {re}; {name}i = {im};')
        return name

    def real(self, x):
        return self.new(x, '0')

    def mul(self, a, b):
        return self.new(f'{a}r * {b}r - {a}i * {b}i', f'{a}r * {b}i + {a}i * {b}r')

    def add(self, a, b):
        return self.new(f'{a}r + {b}r', f'{a}i + {b}i')

    def scale(self, a, k):
        return self.new(f'({k}) * {a}r', f'({k}) * {a}i')

    def div(self, a, b):
        d = self.new(f'{b}r * {b}r + {b}i * {b}i + 1e-30', '0')
        return self.new(f'({a}r * {b}r + {a}i * {b}i) / {d}r', f'({a}i * {b}r - {a}r * {b}i) / {d}r')

    def delay(self, D):
        """e^{-j w D}: D samples of delay."""
        return self.new(f'cos({self.w} * ({D}))', f'-sin({self.w} * ({D}))')

    def lp1(self, a):
        """y += (x - y) * a."""
        den = self.new(f'1 - (1 - ({a})) * cos({self.w})', f'(1 - ({a})) * sin({self.w})')
        return self.div(self.real(a), den)

    def hp1(self, a):
        """x - lp1(x)."""
        lp = self.lp1(a)
        return self.new(f'1 - {lp}r', f'-{lp}i')

    def dcblock(self):
        num = self.new(f'1 - cos({self.w})', f'sin({self.w})')
        den = self.new(f'1 - 0.9997 * cos({self.w})', f'0.9997 * sin({self.w})')
        return self.div(num, den)

    def svf(self, n, kind):
        """TPT SVF responses are exact bilinear transforms: s = j tan(w/2) / g."""
        om = f'tan(0.5 * {self.w}) / {n}_g'
        den = self.new(f'1 - ({om}) * ({om})', f'{n}_k * ({om})')
        if kind == 'lp':
            num = self.real('1')
        elif kind == 'bp':   # unity-peak band-pass (k * v1)
            num = self.new('0', f'{n}_k * ({om})')
        else:                # hp
            num = self.new(f'-({om}) * ({om})', '0')
        return self.div(num, den)


def loop_response(j):
    """Refresh-block GenExpr: open-loop response of the whole feedback path (minus the seek offset and
    the strings' real resonance gain) at harmonic j of the last note. Writes |L| (weighted by the string's
    resonance at that harmonic), arg L and w into Data sk row j - 1."""
    w = f'skw{j}'
    c = Cx(w, j)
    L = [f'{w} = min(twopi * {j} * skf / samplerate, 3);']
    one = c.delay('1')                                     # string tap read + two half-sample ADAA stages
    # amp + cab chain (both amps share settings)
    amp = c.mul(c.hp1('hpa'), one)
    tl = c.lp1('tka')
    tone = c.new(f'{tl}r * tgl + (1 - {tl}r) * tgh', f'{tl}i * (tgl - tgh)')
    amp = c.mul(amp, tone)
    amp = c.mul(amp, c.svf('chp', 'hp'))
    bm = c.svf('cbm', 'bp')
    amp = c.mul(amp, c.new(f'1 + bumpg * {bm}r', f'bumpg * {bm}i'))
    pr = c.svf('cpr', 'bp')
    amp = c.mul(amp, c.new(f'1 + presg * {pr}r', f'presg * {pr}i'))
    amp = c.mul(amp, c.svf('clp', 'lp'))
    inj = c.mul(c.lp1('ika'), c.dcblock())
    # pickups: tap one sample after the write, comb against the position tap
    dn, db = c.delay(f'{NECK} * skdd'), c.delay(f'{BRIDGE} * skdd')
    cn = c.mul(c.new(f'1 - 0.85 * {dn}r', f'-0.85 * {dn}i'), c.svf('pun', 'lp'))
    cb = c.mul(c.new(f'1 - 0.85 * {db}r', f'-0.85 * {db}i'), c.svf('pub', 'lp'))
    xl = c.add(c.scale(cn, 'skaN'), c.scale(cb, 'skaB'))
    xr = c.add(c.scale(cn, 'skaB'), c.scale(cb, 'skaN'))
    air = []
    for ch, e1, e2 in (('L', 0.0087, 0.021), ('R', 0.0113, 0.0257)):
        d1, d2 = c.delay(f'{e1} * samplerate'), c.delay(f'{e2} * samplerate')
        refl = c.new(f'ga{ch} + r1{ch} * {d1}r + r2{ch} * {d2}r', f'r1{ch} * {d1}i + r2{ch} * {d2}i')
        air.append(c.mul(c.mul(c.delay(f'skt{ch}'), refl), c.lp1(f'ak{ch}')))
    paths = c.add(c.mul(xl, air[0]), c.mul(xr, air[1]))
    tot = c.mul(c.mul(amp, inj), paths)
    # string resonance strength at this harmonic: 1 / (1 - g |H_loop(w)|)
    hl = c.lp1('la')
    L += c.lines
    L.append(f'skr{j} = 1 / max(1 - skg * sqrt({hl}r * {hl}r + {hl}i * {hl}i), 0.0001);')
    L.append(f'poke(sk, {w} < 2.9 ? sqrt({tot}r * {tot}r + {tot}i * {tot}i) * skr{j} : 0, {j - 1}, 0);')
    L.append(f'poke(sk, atan2({tot}i, {tot}r), {j - 1}, 1);')
    L.append(f'poke(sk, {w}, {j - 1}, 2);')
    return L


def seek_code(w):
    """Seek: work out where to stand instead of hunting for it.

    Every 256 samples, compute the open-loop response of the feedback path at the last note's
    harmonics 1..6 from the actual filter coefficients, distances and spread (loop_response). A
    harmonic sustains where the loop phase is 0, so the air-delay offsets that put the target there are
    known exactly: arg(L) / w, repeated every target period. Within one fundamental period there are
    Harmonic of them. Rank them by how well they line up the competing harmonics, weighted by the
    string's resonance at each, and glide to the best. If the target hasn't taken over after 3 s,
    try the next one. The ranking follows Distance, Offset, Spread, Cab and Tone as they move.
    """
    w('// ---- seek: compute where to stand (see scripts/dsp.py seek_code) ----')
    w('stick = wrap(stick + 1, 0, 256);')
    w('if (stick < 1) {')
    w('    skf = clamp(fseek * bendr, 20, 4000);')
    w('    skdd = samplerate / skf - lgd;')
    w('    skg = pow(10, -3 / (sustain * skf));')
    w('    skaN = 0.5 + 0.5 * spreadS;')
    w('    skaB = 0.5 - 0.5 * spreadS;')
    w('    sktL = dLs / 343 * samplerate;')
    w('    sktR = dRs / 343 * samplerate;')
    for j in range(1, 7):
        for line in loop_response(j):
            w('    ' + line)
    w('    // candidates for the target: one per target period inside one fundamental period')
    w('    skh = clamp(floor(harm + 0.5), 1, 4);')
    w('    skwh = peek(sk, skh - 1, 2);')
    w('    skstep = per / skh;')
    w('    sklo = max(-0.5 * per, 4 - min(sktL, sktR));')
    w('    sks0 = sklo + wrap(peek(sk, skh - 1, 1) / skwh - sklo, 0, skstep);')
    w('    for (skm = 0; skm < skh; skm += 1) {')
    w('        sksm = sks0 + skm * skstep;')
    w('        sksc = -1000000;')
    w('        for (skj = 0; skj < 6; skj += 1) {')
    w('            if (skj != skh - 1) {')
    w('                sksc = max(sksc, peek(sk, skj, 0) * cos(peek(sk, skj, 1) - peek(sk, skj, 2) * sksm));')
    w('            }')
    w('        }')
    w('        poke(scd, sksc, skm, 0);')
    w('    }')
    w('    // new note, new target or Seek switched on: start from the best-ranked spot')
    w('    if (abs(fseek - lastF) > 0.001 || abs(harm - lastH) > 0.001 || (seek > 0.5 && lastSeek < 0.5)) {')
    w('        tried = 0;')
    w('        dwell = 0;')
    w('        got = 0;')
    w('    }')
    w('    if (abs(tried - lastTried) > 0.5) {')
    w('        got = 0;')
    w('    }')
    w('    lastTried = tried;')
    w('    lastF = fseek;')
    w('    lastH = harm;')
    w('    lastSeek = seek;')
    w('    skwant = floor(wrap(tried, 0, skh));')
    w('    skpick = 0;')
    w('    for (skm = 0; skm < skh; skm += 1) {')
    w('        skrank = 0;')
    w('        for (skq = 0; skq < skh; skq += 1) {')
    w('            if (peek(scd, skq, 0) < peek(scd, skm, 0) || (peek(scd, skq, 0) == peek(scd, skm, 0) && skq < skm)) {')
    w('                skrank += 1;')
    w('            }')
    w('        }')
    w('        if (skrank == skwant) {')
    w('            skpick = skm;')
    w('        }')
    w('    }')
    w('    soffT = sks0 + skpick * skstep;')
    w('    weak = peek(scd, skpick, 0) > peek(sk, skh - 1, 0) ? 1 : 0;')
    w('    // is the target winning? (strongest of the first four harmonics of the note; let go after 0.6 s)')
    w('    sket = skh < 1.5 ? e1 : (skh < 2.5 ? e2 : (skh < 3.5 ? e3 : e4));')
    w('    skdom = sket > 0.0000001 && sket >= e1 && sket >= e2 && sket >= e3 && sket >= e4;')
    w('    lkOff = skdom ? 0 : lkOff + 256 / samplerate;')
    w('    lk = skdom ? 1 : (lkOff > 0.6 ? 0 : lk);')
    w('    // move on only from a spot that never caught: once the target has won somewhere, losing it')
    w('    // later (another note taking over, the amp breathing) is no reason to walk away')
    w('    // (it counts once the glide has arrived and the target has held for half a second)')
    w('    lkt = (lk > 0.5 && abs(soff - soffT) < 0.05 * per) ? lkt + 256 / samplerate : 0;')
    w('    got = lkt > 0.5 ? 1 : got;')
    w('    dwell = (seek > 0.5 && got < 0.5) ? dwell + 256 / samplerate : 0;')
    w('    if (dwell > 3) {')
    w('        tried += 1;')
    w('        dwell = 0;')
    w('    }')
    w('}')
    w('sko = cabL + cabR;')
    for j in range(1, 5):
        w(svf_run(f'sk{j}', f'sk{j}', 'sko'))
        w(f'e{j} += (sk{j}_bp * sk{j}_bp - e{j}) * bek;')
    w('soff += ((seek > 0.5 ? soffT : 0) - soff) * sgk;')
    w('')


def genexpr():
    o = []
    w = o.append
    w('// Autocatalysis: guitar-into-amp feedback as an instrument. GENERATED by scripts/dsp.py; edit that.')
    w('// Six waveguide strings -> neck / bridge pickups -> two amps (L, R) -> air -> back into the strings.')
    w('')
    for i in range(1, VOICES + 1):
        w(f'Param f{i}({TUNING[i - 1]}, min=16, max=4000);')
        w(f'Param g{i}(0, min=0, max=1);')
        w(f'Param s{i}(0, min=0, max=1000000);')
        w(f'Param v{i}(0.8, min=0, max=1);')
    for n, d, lo, hi in PARAMS:
        w(f'Param {n}({d}, min={lo}, max={hi});')
    w('')
    w('Buffer view;')
    for i in range(1, VOICES + 1):
        w(f'Delay wg{i}(8192);')
    w('Delay airL(16384);')
    w('Delay airR(16384);')
    w('Data sk(8, 3);')
    w('Data scd(4, 1);')
    w('')
    hist = ['tick', 'vtick', 'smk', 'dk', 'glk', 'eak', 'erk', 'la', 'lgd', 'pka', 'exg', 'bendr',
            'akL', 'akR', 'alpL', 'alpR', 'r1L', 'r2L', 'r1R', 'r2R', 'gaL', 'gaR',
            'bodyAmt', 'tka', 'tgl', 'tgh', 'hpa', 'rr', 'cons', 'bumpg', 'presg', 'cabtrim',
            'dLs', 'dRs', 'biasS', 'bp1', 'lcb1', 'muteS', 'spreadS', 'stageS',
            'drvg', 'fbg', 'outg', 'hxL', 'hxR', 'u1L', 'u1R', 'lc1L', 'lc1R', 'tloL', 'tloR',
            'w1L', 'w1R', 'lw1L', 'lw1R', 'envL', 'envR', 'cabL', 'cabR',
            'ilp', 'ika', 'ceL', 'ceR', 'cak', 'crk', 'baL', 'baR', 'byL', 'byR', 'bdt', 'lk', 'lkOff', 'soff', 'soffT', 'per', 'bek', 'sgk', 'stick', 'tried', 'dwell', 'lastF', 'lastH', 'lastSeek', 'weak', 'got', 'lkt', 'lastTried', 'e1', 'e2', 'e3', 'e4']
    for h in hist:
        init = 1 if h in ('smk', 'bendr', 'la', 'pka', 'per', 'baL', 'baR') else (REFRESH - 1 if h == 'tick' else 0)
        w(f'History {h}({init});')
    w('History bxL(1);')
    w('History bxR(1.05);')
    w('History SL(1);')
    w('History SR(1);')
    for n in COEFS:
        for s in ('g', 'a1', 'a2', 'a3', 'k'):
            w(f'History {n}_{s}(0);')
    for s in STATES:
        w(f'History {s}_c1(0);')
        w(f'History {s}_c2(0);')
    for i in range(1, VOICES + 1):
        for h in VOICE_HIST:
            init = TUNING[i - 1] if h == 'sf' else 0
            w(f'History {h}{i}({init});')
    w('')

    # ---- refresh block ----
    w(f'// ---- refresh: coefficients every {REFRESH} samples (and on the first sample) ----')
    w(f'tick = wrap(tick + 1, 0, {REFRESH});')
    w('if (tick < 1) {')
    w('    smk = 1 - exp(-1 / (samplerate * 0.02));')
    w('    dk = 1 - exp(-1 / (samplerate * 0.004));')
    w('    glk = 1 - exp(-1 / (samplerate * 0.004));')
    w('    eak = 1 - exp(-1 / (samplerate * 0.003));')
    w('    erk = 1 - exp(-1 / (samplerate * 0.25));')
    w('    bendr = exp2(bend / 12);')
    w('    // string loop filter: one-pole low-pass, its low-frequency delay taken off the loop length')
    w('    la = mix(0.94, 0.25, damp);')
    w('    lgd = (1 - la) / la;')
    w('    pka = mix(0.03, 1, pick * pick);')
    w('    exg = 0.6 * sqrt((2 - pka) / pka);')
    for i in range(1, VOICES + 1):
        w(VOICE_REFRESH.replace('@', str(i))[1:])
    w('    // air: inverse-distance level, high-frequency loss with distance')
    w('    gaL = 1 / (0.5 + dLs);')
    w('    gaR = 1 / (0.5 + dRs);')
    w('    akL = 1 - exp(-twopi * 12000 / (1 + 0.6 * dLs) / samplerate);')
    w('    akR = 1 - exp(-twopi * 12000 / (1 + 0.6 * dRs) / samplerate);')
    w('    r1L = stageS * 0.55 / (0.5 + dLs + 3);')
    w('    r2L = stageS * 0.4 / (0.5 + dLs + 7.2);')
    w('    r1R = stageS * 0.55 / (0.5 + dRs + 3.9);')
    w('    r2R = stageS * 0.4 / (0.5 + dRs + 8.8);')
    w('    // body: solid (0) -> hollow (1); two plate / air modes and how much they reach the pickups')
    w('    ' + svf_coef('bd1', 'mix(180, 98, body)', 'mix(2.5, 14, body)'))
    w('    ' + svf_coef('bd2', 'mix(180, 98, body) * 2.07', 'mix(2, 9, body)'))
    w('    bodyAmt = 0.03 + 0.9 * body * body;')
    w('    // pickups: coil + cable resonance, neck darker than bridge')
    w('    ' + svf_coef('pun', '3200', '1.4'))
    w('    ' + svf_coef('pub', '4600', '1.2'))
    w('    // amp')
    w('    ika = 1 - exp(-twopi * 1500 / samplerate);')
    w('    cak = 1 - exp(-1 / (samplerate * 0.01));')
    w('    crk = 1 - exp(-1 / (samplerate * 0.08));')
    w('    bdt = rate * 6 / samplerate;')
    w('    hpa = 1 - exp(-twopi * 90 / samplerate);')
    w('    tka = 1 - exp(-twopi * 650 / samplerate);')
    w('    tgl = dbtoa(-8 * tone);')
    w('    tgh = dbtoa(8 * tone);')
    w('    rr = 1000 / (recover * samplerate);')
    w('    cons = sag * sag * 60 / samplerate;')
    w('    // cab: 0 open 1x12, 1 2x12, 2 closed 4x12')
    w('    ' + svf_coef('chp', 'cab < 0.5 ? 85 : (cab < 1.5 ? 75 : 68)', '0.75'))
    w('    ' + svf_coef('cbm', 'cab < 0.5 ? 115 : (cab < 1.5 ? 100 : 88)', '1.8'))
    w('    ' + svf_coef('cpr', 'cab < 0.5 ? 2600 : (cab < 1.5 ? 2300 : 2000)', '1.3'))
    w('    ' + svf_coef('clp', 'cab < 0.5 ? 5600 : (cab < 1.5 ? 4800 : 4000)', '0.9'))
    w('    bumpg = cab < 0.5 ? 0.6 : (cab < 1.5 ? 1 : 1.6);')
    w('    presg = cab < 0.5 ? 1.2 : (cab < 1.5 ? 0.9 : 0.7);')
    w('    cabtrim = cab < 0.5 ? 0.8 : (cab < 1.5 ? 0.7 : 0.6);')
    w('    // seek: band-passes on the last note\'s first four harmonics (is the target winning?)')
    w('    per = samplerate / clamp(fseek * bendr, 20, 8000);')
    for j in range(1, 5):
        w('    ' + svf_coef(f'sk{j}', f'fseek * bendr * {j}', '8'))
    w('    bek = 1 - exp(-1 / (samplerate * 0.03));')
    w('    sgk = 1 - exp(-1 / (samplerate * 0.25));')
    w('}')
    w('')

    # ---- smoothed controls ----
    w('// ---- smoothed controls ----')
    w('dLs += (distm - dLs) * smk * 0.25;')
    w('dRs += (distm + ampoff - dRs) * smk * 0.25;')
    w('muteS += (mutep - muteS) * smk * 2;')
    w('spreadS += (spread - spreadS) * smk;')
    w('stageS += (stage - stageS) * smk;')
    w('drvg += (dbtoa(drive) - drvg) * smk;')
    w('biasS += (bias - biasS) * smk * 0.1;')
    w('// the preamp\'s DC point, through the same ADAA as the signal, so silence stays exactly silent')
    w('lcb = abs(biasS) + log(1 + exp(-2 * abs(biasS))) - 0.6931471805599453;')
    w('ybias = abs(biasS - bp1) > 0.0001 ? (lcb - lcb1) / (biasS - bp1) : tanh(0.5 * (biasS + bp1));')
    w('bp1 = biasS;')
    w('lcb1 = lcb;')
    w('fbg += (feedback * feedback - fbg) * smk;')
    w('outg += (dbtoa(outdb) - outg) * smk;')
    w('')

    # ---- air ----
    w('// ---- air: what each amp put out, arriving at the guitar ----')
    w('tL = clamp(dLs / 343 * samplerate + soff, 2, 12000);')
    w('tR = clamp(dRs / 343 * samplerate + soff, 2, 12000);')
    w('xaL = airL.read(tL, interp="linear") * gaL + airL.read(tL + 0.0087 * samplerate, interp="linear") * r1L'
      ' + airL.read(tL + 0.021 * samplerate, interp="linear") * r2L;')
    w('xaR = airR.read(tR, interp="linear") * gaR + airR.read(tR + 0.0113 * samplerate, interp="linear") * r1R'
      ' + airR.read(tR + 0.0257 * samplerate, interp="linear") * r2R;')
    w('alpL += (xaL - alpL) * akL;')
    w('alpR += (xaR - alpR) * akR;')
    w('airSum = alpL + alpR;')
    w('')
    w('// ---- body and injection into the strings ----')
    w(svf_run('bd1', 'bd1', 'airSum'))
    w(svf_run('bd2', 'bd2', 'airSum'))
    w('bodyOut = ((bd1_bp + 0.6 * bd2_bp) * bodyAmt + airSum * 0.03 * body) * fbg;')
    w('// air pressure moves a string far less at high frequencies: one-pole low-pass on the drive')
    w('ilp += (dcblock(airSum) - ilp) * ika;')
    w('inj = ilp * fbg * INJ * (1 - muteS);'.replace('INJ', str(INJ)))
    w('pickN = 0;')
    w('pickB = 0;')
    voice = VOICE.replace('NECKD', str(NECK)).replace('BRIDGED', str(BRIDGE))
    for i in range(1, VOICES + 1):
        w(voice.replace('@', str(i)))

    # ---- pickups ----
    w('// ---- pickups -> amps: neck feeds L, bridge feeds R; Spread blends them toward the middle ----')
    w(svf_run('pun', 'puL', '(pickN + bodyOut * (1 - muteS))'))
    w(svf_run('pub', 'puR', '(pickB + bodyOut * (1 - muteS))'))
    w('pmid = 0.5 * (puL_lp + puR_lp);')
    w('xL = mix(pmid, puL_lp, spreadS);')
    w('xR = mix(pmid, puR_lp, spreadS);')
    w('')

    for c in ('L', 'R'):
        w(f'// ---- amp {c} ----')
        w(f'hx{c} += (x{c} - hx{c}) * hpa;')
        w(f'uu{c} = (x{c} - hx{c}) * drvg + biasS;')
        w(f'// preamp: tanh with first-order antiderivative anti-aliasing (log cosh), biased for even harmonics')
        w(f'au{c} = abs(uu{c});')
        w(f'lc{c} = au{c} + log(1 + exp(-2 * au{c})) - 0.6931471805599453;')
        w(f'du{c} = uu{c} - u1{c};')
        w(f'ya{c} = abs(du{c}) > 0.0001 ? (lc{c} - lc1{c}) / du{c} : tanh(0.5 * (uu{c} + u1{c}));')
        w(f'u1{c} = uu{c};')
        w(f'lc1{c} = lc{c};')
        w(f'ya{c} -= ybias;')
        w(f'tlo{c} += (ya{c} - tlo{c}) * tka;')
        w(f'yt{c} = tlo{c} * tgl + (ya{c} - tlo{c}) * tgh;')
        w(f'// power stage: gain paid for out of the reservoir S (~S^2), times the reaction term X/A')
        w(f'ww{c} = yt{c} * S{c} * S{c} * clamp(bx{c} / ba{c}, 0, 3) * 1.4;')
        w(f'aw{c} = abs(ww{c});')
        w(f'lw{c} = aw{c} + log(1 + exp(-2 * aw{c})) - 0.6931471805599453;')
        w(f'dw{c} = ww{c} - w1{c};')
        w(f'pw{c} = abs(dw{c}) > 0.0001 ? (lw{c} - lw1{c}) / dw{c} : tanh(0.5 * (ww{c} + w1{c}));')
        w(f'w1{c} = ww{c};')
        w(f'lw1{c} = lw{c};')
        w(f'// reservoir: refills toward 1 at 1/Recover, burned by output power (Sag)')
        w(f'S{c} = clamp(S{c} + rr * (1 - S{c}) - cons * pw{c} * pw{c}, 0.02, 1);')
        w(f'ce{c} += (abs(pw{c}) - ce{c}) * (abs(pw{c}) > ce{c} ? cak : crk);')
        w(f'// reaction: Brusselator X\' = A - (B + 1) X + X^2 Y, Y\' = B X - X^2 Y. B = 5 * Catalysis; A = 1 + the')
        w(f'// amp\'s own output level. Past B = 1 + A^2 X runs a limit cycle (the amp breathes); loud')
        w(f'// feedback raises A and settles it, so it pulses near the edge and holds when it screams.')
        w(f'ba{c} = 1 + 0.6 * ce{c};')
        w(f'bxy{c} = bx{c} * bx{c} * by{c};')
        w(f'bx{c} = clamp(bx{c} + (ba{c} - (catalysis * 5 + 1) * bx{c} + bxy{c}) * bdt, 0, 20);')
        w(f'by{c} = clamp(by{c} + (catalysis * 5 * bx{c} - bxy{c}) * bdt, 0, 20);')
        w(f'// cab')
        w(svf_run('chp', 'hp' + c, f'pw{c}'))
        w(svf_run('cbm', 'bm' + c, f'hp{c}_hp'))
        w(f'zb{c} = hp{c}_hp + bumpg * bm{c}_bp;')
        w(svf_run('cpr', 'pr' + c, f'zb{c}'))
        w(f'zp{c} = zb{c} + presg * pr{c}_bp;')
        w(svf_run('clp', 'lp' + c, f'zp{c}'))
        w(f'cab{c} = lp{c}_lp * cabtrim;')
        w(f'env{c} += (abs(cab{c}) - env{c}) * (abs(cab{c}) > env{c} ? eak : erk);')
        w('')
    w('airL.write(fixdenorm(cabL));')
    w('airR.write(fixdenorm(cabR));')
    w('')

    seek_code(w)
    w('// ---- output: amp L / amp R close-miked, soft ceiling at 0.97 ----')
    w('oL = dcblock(cabL) * outg;')
    w('oR = dcblock(cabR) * outg;')
    w('out1 = 0.97 * tanh(oL / 0.97);')
    w('out2 = 0.97 * tanh(oR / 0.97);')
    w('')
    w('// ---- display state for the face (every 64 samples) ----')
    w('vtick = wrap(vtick + 1, 0, 64);')
    w('if (vtick < 1 && dim(view) >= 32) {')
    w('    poke(view, SL, 0, 0); poke(view, SR, 1, 0); poke(view, envL, 2, 0); poke(view, envR, 3, 0);')
    w('    poke(view, soff / per, 4, 0); poke(view, lk + seek * 2 + weak * 4, 5, 0);')
    for i in range(1, VOICES + 1):
        w(f'    poke(view, en{i}, {5 + i}, 0); poke(view, sf{i} * bendr, {11 + i}, 0); poke(view, hd{i}, {17 + i}, 0);')
    w('    poke(view, bxL, 24, 0); poke(view, byL, 25, 0); poke(view, bxR, 26, 0); poke(view, byR, 27, 0);')
    w('}')
    return '\n'.join(o) + '\n'


if __name__ == '__main__':
    print(genexpr(), end='')
