"""Build Krisis into device/: Krisis.amxd (audio effect, frozen with its dependencies), plus the
editable Krisis.maxpat, loose JS, krisis.genexpr and krisis.gendsp beside it. Open device/Krisis.maxpat
in Max to live-edit (then change scripts/ or src/ and rebuild; never hand-edit output)."""
from pathlib import Path
import json
import shutil
import struct
import sys

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'device'
sys.path.insert(0, str(ROOT.parent / 'theme'))
sys.path.insert(0, str(ROOT / 'scripts'))
import theme as T  # noqa: E402  shared device theme
import dsp  # noqa: E402  GenExpr generator

VERSION = dict(major=9, minor=0, revision=9, architecture='x64', modernui=1)
H = 169
B, L, P = [], [], {}
ROSTER = {}          # parameter varname -> [Detail page ('' = always on the face), initial value]
LABELS = []          # [x, baseline, text, page, align]
SECTIONS, WELLS = [], {}
DEPS = ['krisis.control.js', 'krisis.routing.js', 'krisis.panel.js', 'krisis.theme.js']

PAGES = ['Voices', 'Matrix', 'Mod', 'Pedal']
MOD_TARGETS = ['Off', 'Freq', 'Freq A', 'Freq B', 'Freq C', 'Q', 'Drive', 'Feedback', 'Cross', 'Spread', 'Treadle']
SYNC = ['Free', '1/16', '1/8', '1/4', '1/2', '1 Bar', '2 Bar', '4 Bar']   # keep in sync with krisis.control.js


def box(id, cls, rect, **kw):
    B.append({'box': dict(id=id, maxclass=cls, patching_rect=rect, **kw)})
    return id


def obj(id, text, x, y, ni=1, no=1, **kw):
    return box(id, 'newobj', [x, y, 180, 22], text=text, numinlets=ni, numoutlets=no, **kw)


def wire(a, b, o=0, i=0):
    L.append({'patchline': dict(source=[a, o], destination=[b, i])})


def parameter(key, long, short, lo, hi, init, rect, cls='live.dial', unit=1, ptype=0, enum=None, exponent=None,
              units=None, page='', invisible=False, **kw):
    i = len(P)
    v = dict(parameter_longname=long, parameter_shortname=short, parameter_type=2 if enum else ptype,
             parameter_mmin=lo, parameter_mmax=hi, parameter_initial=[init], parameter_initial_enable=1,
             parameter_unitstyle=9 if enum else unit)
    if enum:
        v['parameter_enum'] = enum
    if exponent:
        v['parameter_exponent'] = exponent
    if units:
        v['parameter_units'] = units
    if invisible:
        v['parameter_invisible'] = 1
    outs = 3 if cls in ('live.menu', 'live.tab') else 2
    px, py = 20 + (i % 10) * 130, 600 + (i // 10) * 80
    box(key, cls, [px, py, rect[2], rect[3]], varname=key, parameter_enable=1,
        saved_attribute_attributes={'valueof': v}, numinlets=1, numoutlets=outs,
        presentation=1, presentation_rect=rect, **kw)
    P[key] = [long, short, 0]
    ROSTER[key] = [page, init]
    obj('p-' + key, 'prepend ' + key, px, py + 40)
    wire(key, 'p-' + key)
    wire('p-' + key, 'control')


def dial(key, long, short, lo, hi, init, x, y, **kw):
    parameter(key, long, short, lo, hi, init, [x, y, 44, 48], **T.dial(), **kw)


def tiny(key, long, short, lo, hi, init, x, y, name=None, page='', **kw):
    """Live's tiny dial (fixed size, value beside the knob); the panel draws its name above it."""
    parameter(key, long, short, lo, hi, init, [x, y, 60, 26], appearance=1, showname=0, shownumber=1, page=page, **kw)
    if name:
        LABELS.append([x + 2, y - 3, name, page, 0])


def tab(key, long, items, init, rect, lines=None, page='', **kw):
    n = len(items) if lines is None else lines
    parameter(key, long, long, 0, len(items) - 1, init, rect, cls='live.tab', enum=items, mode=0,
              num_lines_presentation=n, num_lines_patching=n, page=page, **T.tab(), **kw)


def menu(key, long, items, init, rect, page='', **kw):
    parameter(key, long, long, 0, len(items) - 1, init, rect, cls='live.menu', enum=items, page=page, **T.menu(), **kw)


def toggle(key, long, text, rect, init=0, momentary=False, page='', textoff=None):
    parameter(key, long, text, 0, 1, init, rect, cls='live.text', enum=['Off', 'On'], text=textoff or text, texton=text,
              mode=0 if momentary else 1, page=page, **T.button())


def numbox(key, long, short, lo, hi, init, rect, page='', **kw):
    parameter(key, long, short, lo, hi, init, rect, cls='live.numbox', unit=0, ptype=1, page=page, **T.numbox(), **kw)


def section(x, w, header):
    SECTIONS.append([x, 0, w, 168, header])
    return x + w + 2


def gen(code, inputs, outputs):
    boxes = [{'box': dict(id='code', maxclass='codebox', code=code, numinlets=inputs, numoutlets=outputs,
                          patching_rect=[40, 80, 900, 700])}]
    lines = []
    for i in range(inputs):
        boxes.append({'box': dict(id=f'in{i}', maxclass='newobj', text=f'in {i + 1}', numinlets=0, numoutlets=1,
                                  patching_rect=[40 + i * 70, 30, 50, 22])})
        lines.append({'patchline': dict(source=[f'in{i}', 0], destination=['code', i])})
    for i in range(outputs):
        boxes.append({'box': dict(id=f'out{i}', maxclass='newobj', text=f'out {i + 1}', numinlets=1, numoutlets=0,
                                  patching_rect=[40 + i * 120, 810, 50, 22])})
        lines.append({'patchline': dict(source=['code', i], destination=[f'out{i}', 0])})
    return dict(fileversion=1, appversion=VERSION, classnamespace='dsp.gen', rect=[40, 40, 1000, 880],
                boxes=boxes, lines=lines)


def face():
    """Every control on the face. Sections run left to right in signal order."""
    x = 2
    # ---- Input ----
    X = x
    x = section(X, 134, 'Input')
    tab('stereo', 'Stereo', ['Dual', 'Offset', 'M/S'], 0, [X + 6, 22, 70, 54])
    menu('multi', 'Multi Input', ['Single', 'Per Voice', 'X-Env', 'X-Excite'], 0, [X + 6, 100, 70, 18])
    for k, y in (('routeb', 122), ('routec', 144)):
        box(k, 'umenu', [700 + (y - 122) * 4, 300, 100, 22], varname=k, presentation=1,
            presentation_rect=[X + 6, y, 70, 18], numinlets=1, numoutlets=3, outlettype=['int', '', ''],
            items=['No Input'], parameter_enable=0, **T.umenu())
    dial('width', 'Width', 'Width', -24, 24, 3, X + 84, 20, unit=7)
    dial('sdrive', 'S Drive', 'S Drive', -24, 36, 12, X + 84, 104, unit=4)

    # ---- Master ----
    X = x
    x = section(X, 236, 'Master')
    dial('freq', 'Freq', 'Freq', 20, 20000, 800, X + 8, 20, unit=3, exponent=4)
    dial('treadle', 'Treadle', 'Treadle', 0, 100, 50, X + 8, 20, unit=5)
    dial('q', 'Q', 'Q', 0.5, 40, 4, X + 8, 104, unit=1, exponent=2.5)
    dial('spread', 'Spread', 'Spread', 0, 100, 50, X + 60, 20, unit=5)
    dial('drive', 'Drive', 'Drive', -12, 36, 6, X + 60, 104, unit=4)
    dial('feedback', 'Feedback', 'Feedback', 0, 100, 30, X + 112, 20, unit=5)
    dial('core', 'Core', 'Core', 0, 100, 30, X + 112, 104, unit=5)
    menu('smode', 'Spread Mode', ['Ratio', 'Linear', 'Harmonic', 'Formant', 'Scatter'], 0, [X + 164, 22, 66, 18])
    menu('hset', 'Harmonic Set', ['1:2:3', '1:3:5', 'Golden'], 0, [X + 164, 44, 66, 18])
    numbox('sseed', 'Scatter Seed', 'Seed', 0, 999, 1, [X + 164, 44, 66, 18])
    WELLS['freq'] = [X + 164, 68, 66, 92]

    # ---- Detail pages (Voices / Matrix / Mod / Pedal) ----
    X = x
    x = section(X, 270, None)
    tab('page', 'Page', PAGES, 0, [X + 6, 3, 258, 15], lines=1, invisible=True)
    cols = [X + 28, X + 88, X + 148, X + 208]
    rows = [34, 68, 102, 136]
    # Voices
    for c, name in zip(cols, ('Freq', 'Q', 'Drive', 'Level')):
        LABELS.append([c + 2, 30, name, 'Voices', 0])
    LABELS.append([X + 6, rows[0] + 16, 'Link', 'Voices', 0])
    tiny('linkf', 'Link Freq', 'Link Freq', 0, 100, 100, cols[0], rows[0], page='Voices', unit=5)
    tiny('linkq', 'Link Q', 'Link Q', 0, 100, 100, cols[1], rows[0], page='Voices', unit=5)
    tiny('linkd', 'Link Drive', 'Link Drive', 0, 100, 100, cols[2], rows[0], page='Voices', unit=5)
    for v, y in zip('ABC', rows[1:]):
        k = v.lower()
        toggle('on' + k, f'Voice {v}', v, [X + 6, y + 4, 18, 18], init=1, page='Voices')
        tiny('tune' + k, f'Tune {v}', f'Tune {v}', -48, 48, 0, cols[0], y, page='Voices', unit=7)
        tiny('q' + k, f'Q {v}', f'Q {v}', 0.5, 40, 4, cols[1], y, page='Voices', unit=1, exponent=2.5)
        tiny('drv' + k, f'Drive {v}', f'Drive {v}', -12, 36, 6, cols[2], y, page='Voices', unit=4)
        tiny('lvl' + k, f'Level {v}', f'Level {v}', -36, 12, 0, cols[3], y, page='Voices', unit=4)
    # Matrix: row = destination, column = source
    for c, name in zip(cols, ('From A', 'From B', 'From C')):
        LABELS.append([c + 2, 30, name, 'Matrix', 0])
    for v, y in zip('ABC', rows):
        LABELS.append([X + 6, y + 16, 'To ' + v, 'Matrix', 0])
        for c, s in zip(cols, 'ABC'):
            tiny(f'm{v.lower()}{s.lower()}', f'Matrix {s}>{v}', f'{s}>{v}', 0, 150, 0, c, y, page='Matrix', unit=5)
    # Mod: chaos routing rows
    LABELS.append([X + 30, 30, 'Target', 'Mod', 0])
    LABELS.append([cols[2] + 2, 30, 'Depth', 'Mod', 0])
    for r, y, t in zip('xyz', rows, (1, 5, 6)):
        LABELS.append([X + 6, y + 16, r.upper(), 'Mod', 0])
        menu('tgt' + r, f'Chaos {r.upper()} Target', MOD_TARGETS, t, [X + 28, y + 4, 116, 18], page='Mod')
        tiny('dep' + r, f'Chaos {r.upper()} Depth', f'{r.upper()} Depth', -100, 100, 0, cols[2], y, page='Mod', unit=5)
    LABELS.append([X + 6, rows[3] + 16, 'Stereo', 'Mod', 0])
    menu('cstereo', 'Chaos Stereo', ['Auto', 'Same', 'Rotate', 'Diverge', 'Side'], 0, [X + 48, rows[3] + 4, 96, 18], page='Mod')
    # Pedal: treadle source settings
    prow = [34, 80, 126]
    for name, y in zip(('Env', 'LFO', 'Trig'), prow):
        LABELS.append([X + 6, y + 16, name, 'Pedal', 0])
    tiny('esens', 'Env Sens', 'Env Sens', -24, 48, 12, cols[0], prow[0], name='Sens', page='Pedal', unit=4)
    tiny('eatk', 'Env Attack', 'Attack', 0.1, 500, 5, cols[1], prow[0], name='Attack', page='Pedal', unit=2, exponent=3)
    tiny('erel', 'Env Release', 'Release', 1, 5000, 150, cols[2], prow[0], name='Release', page='Pedal', unit=2, exponent=3)
    menu('edir', 'Env Direction', ['Up', 'Down'], 0, [cols[3], prow[0] + 4, 58, 18], page='Pedal')
    LABELS.append([cols[3] + 2, prow[0] - 3, 'Dir', 'Pedal', 0])
    tiny('lrate', 'LFO Rate', 'LFO Rate', 0.01, 50, 1, cols[0], prow[1], name='Rate', page='Pedal', unit=3, exponent=3)
    menu('lshape', 'LFO Shape', ['Sine', 'Tri', 'Saw Up', 'Saw Dn', 'Square', 'S&H'], 0, [cols[1], prow[1] + 4, 58, 18], page='Pedal')
    LABELS.append([cols[1] + 2, prow[1] - 3, 'Shape', 'Pedal', 0])
    menu('lsync', 'LFO Sync', SYNC, 0, [cols[2], prow[1] + 4, 58, 18], page='Pedal')
    LABELS.append([cols[2] + 2, prow[1] - 3, 'Sync', 'Pedal', 0])
    tiny('tsens', 'Trig Sens', 'Trig Sens', 0, 100, 50, cols[0], prow[2], name='Sens', page='Pedal', unit=5)
    tiny('ttime', 'Trig Time', 'Trig Time', 5, 10000, 300, cols[1], prow[2], name='Time', page='Pedal', unit=2, exponent=3)
    menu('tshape', 'Trig Shape', ['Up', 'Down', 'Up-Dn', 'Decay'], 0, [cols[2], prow[2] + 4, 58, 18], page='Pedal')
    LABELS.append([cols[2] + 2, prow[2] - 3, 'Shape', 'Pedal', 0])
    menu('caxis', 'Chaos Axis', ['X', 'Y', 'Z', 'Lobe'], 0, [cols[3], prow[2] + 4, 58, 18], page='Pedal')
    LABELS.append([cols[3] + 2, prow[2] - 3, 'Axis', 'Pedal', 0])

    # ---- Loop ----
    X = x
    x = section(X, 186, 'Loop')
    tab('clip', 'Clip Mode', ['Inject', 'State', 'Both'], 0, [X + 8, 22, 54, 54])
    menu('curve', 'Curve', ['Tanh', 'Diode', 'Fold', 'Hard'], 0, [X + 8, 100, 54, 18])
    dial('sustain', 'Sustain', 'Sustain', 0, 100, 40, X + 70, 20, unit=5)
    dial('leak', 'Bias Leak', 'Leak', 0.5, 40, 5, X + 70, 104, unit=3, exponent=2.5)
    tab('topo', 'Topology', ['Parallel', 'Series', 'Ring', 'Matrix'], 0, [X + 122, 22, 58, 72])
    dial('cross', 'Cross', 'Cross', 0, 150, 30, X + 129, 104, unit=5)

    # ---- Chaos ----
    X = x
    x = section(X, 268, 'Chaos')
    tab('attr', 'Attractor', ['Thomas', 'Chua'], 0, [X + 8, 22, 58, 36])
    toggle('caudio', 'Audio Rate', 'Audio', [X + 8, 64, 58, 18])
    toggle('freeze', 'Freeze', 'Freeze', [X + 8, 86, 58, 18])
    toggle('creset', 'Reset', 'Reset', [X + 8, 108, 58, 18], momentary=True)
    numbox('cseed', 'Chaos Seed', 'Seed', 0, 999, 1, [X + 8, 130, 58, 18])
    dial('crate', 'Chaos Rate', 'Rate', 0.01, 50, 0.5, X + 74, 20, unit=3, exponent=3)
    dial('forcing', 'Forcing', 'Forcing', 0, 100, 0, X + 74, 104, unit=5)
    dial('entropy', 'Entropy', 'Entropy', 0, 100, 52, X + 126, 20, unit=5)
    dial('alpha', 'Alpha', 'Alpha', 2, 30, 15.6, X + 126, 20, unit=1)
    dial('beta', 'Beta', 'Beta', 5, 50, 28, X + 126, 104, unit=1)
    WELLS['chaos'] = [X + 178, 20, 84, 80]
    dial('diverge', 'Divergence', 'Diverge', 0, 100, 30, X + 178, 104, unit=5)
    WELLS['chaosread'] = [X + 226, 104, 36, 56]

    # ---- Wah ----
    X = x
    x = section(X, 226, 'Wah')
    tab('wah', 'Wah Mode', ['Off', 'Stack', 'Solo'], 0, [X + 8, 22, 56, 54])
    menu('range', 'Wah Range', ['Cry', 'Vox', 'Custom'], 0, [X + 8, 100, 56, 18])
    menu('tsrc', 'Treadle Source', ['Pedal', 'Env', 'Chaos', 'LFO', 'Trigger'], 0, [X + 8, 122, 56, 18])
    toggle('tlink', 'Treadle Link', 'Link', [X + 8, 144, 56, 18], init=1)
    dial('wmin', 'Wah Min', 'Min', 20, 8000, 400, X + 72, 20, unit=3, exponent=3)
    dial('wmax', 'Wah Max', 'Max', 100, 16000, 2000, X + 72, 104, unit=3, exponent=3)
    dial('taper', 'Taper', 'Taper', 0, 100, 70, X + 124, 20, unit=5)
    dial('body', 'Body', 'Body', 0, 100, 0, X + 124, 104, unit=5)
    dial('mass', 'Mass', 'Mass', 0, 100, 30, X + 176, 20, unit=5)
    dial('damping', 'Damping', 'Damping', 0, 100, 40, X + 176, 104, unit=5)

    # ---- Output ----
    X = x
    x = section(X, 170, 'Output')
    tab('quality', 'Quality', ['2x', '4x', '8x'], 1, [X + 8, 22, 52, 54])
    tab('tap', 'Output Tap', ['Raw', 'Norm'], 1, [X + 8, 82, 52, 18], lines=1)
    toggle('gm', 'Gain Match', 'Match', [X + 8, 106, 52, 18], init=1)
    toggle('lim', 'Limiter', 'Limit', [X + 8, 130, 52, 18], init=1)
    dial('mix', 'Dry/Wet', 'Dry/Wet', 0, 100, 100, X + 68, 20, unit=5)
    dial('output', 'Output', 'Output', -36, 12, 0, X + 68, 104, unit=4)
    dial('trim', 'Trim Speed', 'Trim', 0.3, 10, 2, X + 120, 20, unit=9, units='%.1f s', exponent=2)
    WELLS['meter'] = [X + 120, 104, 44, 56]
    return x


def build_patch(code):
    B.clear(); L.clear(); P.clear(); ROSTER.clear(); LABELS.clear(); SECTIONS.clear(); WELLS.clear()
    W = face()
    # Background face: sections, wells, labels, readouts. ignoreclick + background so every native widget on
    # top gets its clicks.
    box('panel', 'jsui', [0, 0, W, H], varname='panel', filename='krisis.panel.js', presentation=1,
        presentation_rect=[0, 0, W, H], numinlets=1, numoutlets=0, border=0, ignoreclick=1, background=1,
        parameter_enable=0)
    obj('control', 'js krisis.control.js', 20, 330, no=2, varname='control')
    wire('control', 'panel', 1)
    obj('routing', 'js krisis.routing.js', 700, 250, no=2, varname='routing')
    for k, o in (('routeb', 0), ('routec', 1)):
        wire('routing', k, o)
        obj('sel-' + k, 'prepend select' + k[-1], 700 + o * 200, 340)
        wire(k, 'sel-' + k)
        wire('sel-' + k, 'routing')

    G = gen(code, 7, 2)
    obj('input', 'plugin~ 1 2 3 4 5 6', 300, 200, ni=1, no=6, outlettype=['signal'] * 6)
    obj('phasor', 'plugphasor~', 520, 200, ni=1, no=1, outlettype=['signal'])
    obj('dsp', 'gen~', 300, 400, ni=7, no=2, varname='dsp', patcher=G, outlettype=['signal', 'signal'])
    obj('audio', 'plugout~', 300, 460, ni=2, no=2)
    for i in range(6):
        wire('input', 'dsp', i, i)
    wire('phasor', 'dsp', 0, 6)
    wire('control', 'dsp')
    wire('dsp', 'audio'); wire('dsp', 'audio', 1, 1)
    obj('view', f'buffer~ #0-krview @samps {dsp.VIEW}', 520, 460, no=2)
    obj('bind-view', 'loadmess view #0-krview', 520, 500); wire('bind-view', 'dsp')
    obj('bind-panel', 'loadmess viewbuffer #0-krview', 720, 500); wire('bind-panel', 'panel')
    obj('clock', 'qmetro 33 @active 1', 720, 420)
    box('tick', 'message', [720, 460, 40, 22], text='tick', numinlets=2, numoutlets=1)
    wire('clock', 'tick'); wire('tick', 'panel')
    obj('thisdevice', 'live.thisdevice', 20, 250, no=3)
    box('init', 'message', [20, 290, 40, 22], text='init', numinlets=2, numoutlets=1)
    wire('thisdevice', 'init'); wire('init', 'control'); wire('init', 'routing')

    P['parameterbanks'] = {
        '0': dict(index=0, name='Master', parameters=['freq', 'spread', 'q', 'drive', 'feedback', 'core', 'smode', 'mix']),
        '1': dict(index=1, name='Loop', parameters=['clip', 'curve', 'sustain', 'leak', 'topo', 'cross', 'quality', 'output']),
        '2': dict(index=2, name='Chaos', parameters=['attr', 'crate', 'entropy', 'forcing', 'depx', 'depy', 'depz', 'diverge']),
        '3': dict(index=3, name='Wah', parameters=['wah', 'treadle', 'range', 'taper', 'body', 'tsrc', 'mass', 'damping'])}
    P['inherited_shortname'] = 1
    layout = dict(width=W, sections=SECTIONS, wells=WELLS, labels=LABELS, pages=PAGES)
    patch = dict(fileversion=1, appversion=VERSION, classnamespace='box', rect=[60, 80, 1400, 900],
                 openrect=[0, 0, W, H], devicewidth=W, openinpresentation=1, bglocked=1, **T.patcher_attrs(),
                 boxes=B,
                 lines=L, parameters=P, autosave=0, title='Krisis', latency=0,
                 dependency_cache=[dict(name=n, type='TEXT', implicit=1) for n in DEPS])
    return patch, G, layout


def build():
    code = dsp.genexpr()
    patch, G, layout = build_patch(code)
    DEST.mkdir(exist_ok=True)
    roster = json.dumps(ROSTER, separators=(',', ':'))
    (DEST / 'krisis.control.js').write_text((ROOT / 'src/krisis.control.js').read_text().replace('/*__ROSTER__*/null', roster))
    (DEST / 'krisis.panel.js').write_text((ROOT / 'src/krisis.panel.js').read_text().replace(
        '/*__LAYOUT__*/null', json.dumps(layout, separators=(',', ':'))))
    shutil.copyfile(ROOT / 'src/krisis.routing.js', DEST / 'krisis.routing.js')
    T.write_jsui(DEST, 'krisis', sep='.')
    (DEST / 'krisis.genexpr').write_text(code)
    (DEST / 'krisis.gendsp').write_text(json.dumps({'patcher': G}, indent=2) + '\n')
    # Deterministic stamp: newest source file, not wall-clock time.
    srcs = list((ROOT / 'src').glob('krisis*')) + [Path(__file__), ROOT / 'scripts' / 'dsp.py']
    stamp = max(int(f.stat().st_mtime) for f in srcs) + 2082844800
    deps = [(n, 'TEXT', (DEST / n).read_bytes()) for n in DEPS]
    raw = (json.dumps({'patcher': patch}, indent=2, ensure_ascii=False) + '\n').encode()
    (DEST / 'Krisis.maxpat').write_bytes(raw)
    amxd = freeze('Krisis.amxd', raw + b'\0', deps, b'aaaa', stamp)
    (DEST / 'Krisis.amxd').write_bytes(amxd)
    print(f'Built {DEST / "Krisis.amxd"} (frozen, {len(deps)} dependencies embedded, {len(amxd)} bytes, '
          f'{len([k for k in P if k not in ("parameterbanks", "inherited_shortname")])} parameters, width {layout["width"]})')


# --- Freeze: same 'mx@c' collective container as vermiform/atomism/syzygy (see vermiform/scripts/build.py). ---
def _u32be(n):
    return struct.pack('>I', n & 0xffffffff)


def _chunk(tag, data):
    return tag.encode('ascii') + _u32be(8 + len(data)) + data


def _padname(name):
    b = name.encode('ascii') + b'\0'
    return b + b'\0' * ((-len(b)) % 4)


def freeze(main_name, main_data, dependencies, device_code, stamp):
    entries = [(main_name, 'JSON', 17, main_data)] + [(n, t, 0, d) for n, t, d in dependencies]
    offset, blob, directory = 16, b'', b''
    for name, typ, flag, data in entries:
        content = (_chunk('type', typ.encode('ascii')) + _chunk('fnam', _padname(name)) + _chunk('sz32', _u32be(len(data))) +
                   _chunk('of32', _u32be(offset)) + _chunk('vers', _u32be(0)) + _chunk('flag', _u32be(flag)) +
                   _chunk('mdat', _u32be(stamp)))
        directory += _chunk('dire', content)
        blob += data
        offset += len(data)
    container = b'mx@c' + _u32be(16) + _u32be(0) + _u32be(offset) + blob + _chunk('dlst', directory)
    return (b'ampf' + struct.pack('<I', 4) + device_code + b'meta' + struct.pack('<I', 4) + struct.pack('<I', 7) +
            b'ptch' + struct.pack('<I', len(container)) + container)


if __name__ == '__main__':
    build()
