"""Build Autocatalysis into device/: Autocatalysis.amxd (instrument, frozen with its dependencies),
plus the editable Autocatalysis.maxpat, loose JS, autocatalysis.genexpr and autocatalysis.gendsp.
Open device/Autocatalysis.maxpat in Max to live-edit (then change scripts/ or src/ and rebuild;
never hand-edit output)."""
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
W, H = 854, 169
B, L, P = [], [], {}
DEPS = ['autocatalysis.control.js', 'autocatalysis.panel.js', 'autocatalysis.theme.js']


def box(id, cls, rect, **kw):
    B.append({'box': dict(id=id, maxclass=cls, patching_rect=rect, **kw)})
    return id


def obj(id, text, x, y, ni=1, no=1, **kw):
    return box(id, 'newobj', [x, y, 180, 22], text=text, numinlets=ni, numoutlets=no, **kw)


def wire(a, b, o=0, i=0):
    L.append({'patchline': dict(source=[a, o], destination=[b, i])})


def parameter(key, long, short, lo, hi, init, rect, cls='live.dial', unit=1, ptype=0, enum=None, exponent=None,
              units=None, **kw):
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
    outs = 3 if cls in ('live.menu', 'live.tab') else 2
    box(key, cls, [20 + (i % 8) * 150, 420 + (i // 8) * 90, rect[2], rect[3]], varname=key, parameter_enable=1,
        saved_attribute_attributes={'valueof': v}, numinlets=1, numoutlets=outs,
        presentation=1, presentation_rect=rect, **kw)
    P[key] = [long, short, 0]
    obj('p-' + key, 'prepend ' + key, 20 + (i % 8) * 150, 470 + (i // 8) * 90)
    wire(key, 'p-' + key)
    wire('p-' + key, 'control')


def dial(key, long, short, lo, hi, init, x, y, **kw):
    parameter(key, long, short, lo, hi, init, [x, y, 44, 48], **T.dial(), **kw)


def tab(key, long, items, init, rect, lines=None):
    n = len(items) if lines is None else lines
    parameter(key, long, long, 0, len(items) - 1, init, rect, cls='live.tab', enum=items, mode=0,
              num_lines_presentation=n, num_lines_patching=n, **T.tab())


def toggle(key, long, text, rect):
    parameter(key, long, text, 0, 1, 0, rect, cls='live.text', enum=['Off', 'On'], text=text, texton=text,
              mode=1, **T.button())


def gen(code, outputs):
    boxes = [{'box': dict(id='code', maxclass='codebox', code=code, numinlets=1, numoutlets=outputs,
                          patching_rect=[40, 80, 900, 700])}]
    lines = []
    for i in range(outputs):
        boxes.append({'box': dict(id=f'out{i}', maxclass='newobj', text=f'out {i + 1}', numinlets=1, numoutlets=0,
                                  patching_rect=[40 + i * 120, 810, 50, 22])})
        lines.append({'patchline': dict(source=['code', i], destination=[f'out{i}', 0])})
    return dict(fileversion=1, appversion=VERSION, classnamespace='dsp.gen', rect=[40, 40, 1000, 880],
                boxes=boxes, lines=lines)


def build_patch(code):
    B.clear(); L.clear(); P.clear()
    # Face: background jsui (sections, wells, meters, readouts). ignoreclick + background so every
    # native widget on top gets its clicks.
    box('panel', 'jsui', [0, 0, W, H], varname='panel', filename='autocatalysis.panel.js', presentation=1,
        presentation_rect=[0, 0, W, H], numinlets=1, numoutlets=0, border=0, ignoreclick=1, background=1,
        parameter_enable=0)
    obj('control', 'js autocatalysis.control.js', 20, 330, no=2, varname='control')
    wire('control', 'panel', 1)

    # Strings (2..202): strings well over Ring / Mute | Sustain / Damp | Pick / Body.
    toggle('ring', 'Ring', 'Ring', [8, 108, 88, 18])
    toggle('mute', 'Mute', 'Mute', [8, 132, 88, 18])
    dial('sustain', 'Sustain', 'Sustain', 200, 60000, 6000, 108, 20, unit=2, exponent=3)
    dial('damp', 'Damp', 'Damp', 0, 100, 35, 108, 104, unit=5)
    dial('pick', 'Pick', 'Pick', 0, 100, 60, 156, 20, unit=5)
    dial('body', 'Body', 'Body', 0, 100, 30, 156, 104, unit=5)
    # Amp (204..366): Drive / Tone | Bias / Spread | Cab over the supply meters.
    dial('drive', 'Drive', 'Drive', 0, 40, 20, 212, 20, unit=4)
    dial('tone', 'Tone', 'Tone', -100, 100, 0, 212, 104, unit=5)
    dial('bias', 'Bias', 'Bias', -100, 100, 20, 262, 20, unit=5)
    dial('spread', 'Spread', 'Spread', 0, 100, 70, 262, 104, unit=5)
    tab('cab', 'Cab', ['1x12', '2x12', '4x12'], 1, [314, 22, 46, 72])
    # Kinetics (368..578): Sag / Catalysis | Recover / Rate | reaction phase portrait.
    dial('sag', 'Sag', 'Sag', 0, 100, 40, 376, 20, unit=5)
    dial('catalysis', 'Catalysis', 'Catalysis', 0, 100, 25, 376, 104, unit=5)
    dial('recover', 'Recover', 'Recover', 10, 3000, 250, 426, 20, unit=2, exponent=3)
    dial('rate', 'Rate', 'Rate', 0.05, 8, 0.7, 426, 104, unit=3, exponent=3)
    # Space (580..748): Distance / Stage | Offset | Seek over Harmonic; seek strip under Offset / Harmonic.
    dial('distance', 'Distance', 'Distance', 0.1, 8, 1.2, 588, 20, unit=9, units='%.2f m', exponent=2)
    dial('stage', 'Stage', 'Stage', 0, 100, 30, 588, 104, unit=5)
    dial('offset', 'Offset', 'Offset', 0, 4, 0.4, 638, 20, unit=9, units='%.2f m', exponent=2)
    toggle('seek', 'Seek', 'Seek', [690, 22, 50, 18])
    tab('harm', 'Harmonic', ['Fund', 'Oct', '12th', '2 Oct'], 0, [690, 44, 50, 72])
    # Output (750..852): Feedback / Output | meters.
    dial('feedback', 'Feedback', 'Feedback', 0, 100, 40, 758, 20, unit=5)
    dial('output', 'Output', 'Output', -70, 6, -6, 758, 104, unit=4)

    # DSP and display buffer.
    G = gen(code, 2)
    obj('dsp', 'gen~', 300, 1050, ni=1, no=2, varname='dsp', patcher=G, outlettype=['signal', 'signal'])
    obj('audio', 'plugout~', 300, 1110, ni=2, no=2)
    wire('control', 'dsp')
    wire('dsp', 'audio'); wire('dsp', 'audio', 1, 1)
    obj('view', 'buffer~ ---acview @samps 32', 520, 1050, no=2)
    obj('bind-view', 'loadmess view ---acview', 520, 1090); wire('bind-view', 'dsp')
    obj('bind-panel', 'loadmess viewbuffer ---acview', 720, 1090); wire('bind-panel', 'panel')
    obj('clock', 'qmetro 40 @active 1', 720, 1010)
    box('tick', 'message', [720, 1050, 40, 22], text='tick', numinlets=2, numoutlets=1)
    wire('clock', 'tick'); wire('tick', 'panel')
    obj('thisdevice', 'live.thisdevice', 20, 250, no=3)
    box('init', 'message', [20, 290, 40, 22], text='init', numinlets=2, numoutlets=1)
    wire('thisdevice', 'init'); wire('init', 'control')
    # MIDI: notes, sustain pedal (Ring while down), pitch bend (+/- 2 st), all notes off (CC 123).
    obj('notes', 'notein', 20, 1300, no=3)
    obj('note-pack', 'pack 0 0', 20, 1340, ni=2)
    obj('note-msg', 'prepend note', 20, 1380)
    wire('notes', 'note-pack', 1, 1); wire('notes', 'note-pack'); wire('note-pack', 'note-msg'); wire('note-msg', 'control')
    obj('pedal', 'ctlin 64', 220, 1300, ni=0, no=2)
    obj('pedal-msg', 'prepend pedalcc', 220, 1340)
    wire('pedal', 'pedal-msg'); wire('pedal-msg', 'control')
    obj('bendin', 'bendin', 420, 1300, ni=0, no=2)
    obj('bend-msg', 'prepend bend', 420, 1340)
    wire('bendin', 'bend-msg'); wire('bend-msg', 'control')
    obj('anoff', 'ctlin 123', 620, 1300, ni=0, no=2)
    box('anoff-msg', 'message', [620, 1340, 80, 22], text='allnotesoff', numinlets=2, numoutlets=1)
    wire('anoff', 'anoff-msg'); wire('anoff-msg', 'control')

    P['parameterbanks'] = {
        '0': dict(index=0, name='Play', parameters=['feedback', 'drive', 'distance', 'offset', 'sustain', 'damp', 'body', 'output']),
        '1': dict(index=1, name='Kinetics', parameters=['sag', 'recover', 'catalysis', 'rate', 'bias', 'tone', 'spread', 'stage']),
        '2': dict(index=2, name='Switches', parameters=['pick', 'cab', 'ring', 'mute', 'seek', 'harm', '-', '-'])}
    P['inherited_shortname'] = 1
    return dict(fileversion=1, appversion=VERSION, classnamespace='box', rect=[60, 80, 1400, 900],
                openrect=[0, 0, W, H], devicewidth=W, openinpresentation=1, bglocked=1, **T.patcher_attrs(),
                boxes=B[1:] + B[:1], lines=L, parameters=P, autosave=0, title='Autocatalysis', latency=0,
                dependency_cache=[dict(name=n, type='TEXT', implicit=1) for n in DEPS]), G


def build():
    code = dsp.genexpr()
    patch, G = build_patch(code)
    DEST.mkdir(exist_ok=True)
    for n in ['autocatalysis.control.js', 'autocatalysis.panel.js']:
        shutil.copyfile(ROOT / 'src' / n, DEST / n)
    T.write_jsui(DEST, 'autocatalysis', sep='.')
    (DEST / 'autocatalysis.genexpr').write_text(code)
    (DEST / 'autocatalysis.gendsp').write_text(json.dumps({'patcher': G}, indent=2) + '\n')
    # Deterministic stamp: newest source file, not wall-clock time.
    srcs = list((ROOT / 'src').glob('autocatalysis*')) + [Path(__file__), ROOT / 'scripts' / 'dsp.py']
    stamp = max(int(f.stat().st_mtime) for f in srcs) + 2082844800
    deps = [(n, 'TEXT', (DEST / n).read_bytes()) for n in DEPS]
    raw = (json.dumps({'patcher': patch}, indent=2) + '\n').encode()
    (DEST / 'Autocatalysis.maxpat').write_bytes(raw)
    amxd = freeze('Autocatalysis.amxd', raw + b'\0', deps, b'iiii', stamp)
    (DEST / 'Autocatalysis.amxd').write_bytes(amxd)
    print(f'Built {DEST / "Autocatalysis.amxd"} (frozen, {len(deps)} dependencies embedded, {len(amxd)} bytes)')


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
