"""Build Chiasmus into device/: the editable patch and loose deps (Chiasmus.maxpat, *.js, chiasmus.gendsp)
sit beside the frozen, self-contained Chiasmus.amxd. Open device/Chiasmus.maxpat in Max to live-edit."""
from pathlib import Path
import json
import shutil
import struct
import sys

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'device'
STAGE = DEST  # all build output lives in device/ (gitignored)
sys.path.insert(0, str(ROOT.parent / 'theme'))
import theme as T  # noqa: E402  shared device theme

VERSION = dict(major=9, minor=0, revision=9, architecture='x64', modernui=1)
W, H = 906, 169
B, L, P = [], [], {}

DIVNAMES = ['1/32', '1/16T', '1/16', '1/8T', '1/16D', '1/8', '1/4T', '1/8D', '1/4', '1/4D', '1/2', '1/2D', '1 Bar', '2 Bars']


def box(id, cls, rect, **kw):
    B.append({'box': dict(id=id, maxclass=cls, patching_rect=rect, **kw)})
    return id


def obj(id, text, x, y, ni=1, no=1, **kw):
    return box(id, 'newobj', [x, y, 160, 22], text=text, numinlets=ni, numoutlets=no, **kw)


def wire(a, b, o=0, i=0):
    L.append({'patchline': dict(source=[a, o], destination=[b, i])})


def parameter(key, label, lo, hi, init, rect, cls='live.dial', unit=1, ptype=0, enum=None, exponent=None, **kw):
    i = len(P)
    v = dict(parameter_longname=label, parameter_shortname=label, parameter_type=2 if enum else ptype,
             parameter_mmin=lo, parameter_mmax=hi, parameter_initial=[init], parameter_initial_enable=1,
             parameter_unitstyle=9 if enum else unit)
    if enum:
        v['parameter_enum'] = enum
    if exponent:
        v['parameter_exponent'] = exponent
    outs = 3 if cls in ('live.menu', 'live.tab') else 2
    box(key, cls, [20 + (i % 8) * 150, 420 + (i // 8) * 90, rect[2], rect[3]], varname=key, parameter_enable=1,
        saved_attribute_attributes={'valueof': v}, numinlets=1, numoutlets=outs,
        presentation=1, presentation_rect=rect, **kw)
    P[key] = [label, label, 0]
    obj('p-' + key, 'prepend ' + key, 20 + (i % 8) * 150, 470 + (i // 8) * 90)
    wire(key, 'p-' + key)
    wire('p-' + key, 'control')


def dial(key, label, lo, hi, init, x, y, **kw):
    parameter(key, label, lo, hi, init, [x, y, 44, 48], **T.dial(), **kw)


def tab(key, label, items, init, rect):
    parameter(key, label, 0, len(items) - 1, init, rect, cls='live.tab', enum=items, mode=0,
              num_lines_presentation=len(items), num_lines_patching=len(items), **T.tab())


def build():
    # Face: background jsui (sections, grain display, envelope, readouts). ignoreclick so the
    # native widgets on top receive every click.
    box('panel', 'jsui', [0, 0, W, H], varname='panel', filename='chiasmus.panel.js', presentation=1,
        presentation_rect=[0, 0, W, H], numinlets=1, numoutlets=0, border=0, ignoreclick=1, background=1,
        parameter_enable=0)
    obj('control', 'js chiasmus.control.js', 20, 330, no=2, varname='control')
    wire('control', 'panel', 1)

    # Time (x 2..188). Keep in sync with FIELDSETS in src/chiasmus.panel.js.
    # Top: Trigger over Division | Pre | Sens.  Bottom row, level with the other knobs: Freeze | Time | Drift.
    tab('trigger', 'Trigger', ['Free', 'Sync', 'Onset'], 0, [10, 22, 64, 54])
    parameter('division', 'Division', 0, len(DIVNAMES) - 1, 8, [10, 82, 64, 18], cls='live.menu', enum=DIVNAMES, **T.menu())
    dial('pre', 'Pre', 0, 2000, 0, 86, 20, unit=2, exponent=2.5)
    dial('sens', 'Sens', 0, 100, 50, 138, 20, unit=5)
    parameter('freeze', 'Freeze', 0, 1, 0, [10, 121, 64, 18], cls='live.text', enum=['Off', 'On'],
              text='Freeze', texton='Freeze', mode=1, **T.button())
    dial('time', 'Time', 20, 4000, 400, 86, 104, unit=2, exponent=2.5)
    dial('drift', 'Drift', 0, 100, 0, 138, 104, unit=5)
    # Direction (190..322)
    tab('pattern', 'Pattern', ['Rev', 'Alt', 'ABBA'], 0, [198, 22, 60, 54])
    dial('flip', 'Flip', 0, 100, 0, 206, 104, unit=5)
    dial('pitch', 'Pitch', -12, 12, 0, 270, 20, unit=7, ptype=1)
    dial('fine', 'Fine', -50, 50, 0, 270, 104, unit=0, ptype=1)
    # Shape (324..620): display drawn by the panel above these.
    dial('smooth', 'Smooth', 0, 100, 30, 334, 104, unit=5)
    dial('swell', 'Swell', -100, 100, 0, 388, 104, unit=5)
    dial('zip', 'Zip', 0, 100, 30, 442, 104, unit=5)
    dial('wow', 'Wow', 0, 100, 0, 496, 104, unit=5)
    tab('engine', 'Engine', ['Grain', 'Tape'], 0, [552, 110, 60, 36])
    # Loop (622..772)
    dial('feedback', 'Feedback', 0, 100, 35, 630, 20, unit=5)
    dial('cross', 'Cross', 0, 100, 0, 678, 20, unit=5)
    dial('diffuse', 'Diffuse', 0, 100, 0, 726, 20, unit=5)
    dial('tone', 'Tone', -100, 100, 0, 630, 104, unit=5)
    dial('drive', 'Drive', 0, 100, 0, 678, 104, unit=5)
    parameter('scatter', 'Scatter', 0, 1, 0, [724, 121, 46, 18], cls='live.text', enum=['Off', 'On'],
              text='Scatter', texton='Scatter', mode=1, **T.button())
    # Output (774..904)
    dial('width', 'Width', 0, 100, 0, 784, 20, unit=5)
    dial('duck', 'Duck', 0, 100, 0, 842, 20, unit=5)
    dial('mix', 'Dry/Wet', 0, 100, 50, 784, 104, unit=5)
    dial('output', 'Output', -24, 12, 0, 842, 104, unit=4)

    # DSP
    code = (ROOT / 'src/chiasmus.genexpr').read_text()
    gb = [{'box': dict(id='code', maxclass='codebox', code=code, numinlets=3, numoutlets=2,
                       patching_rect=[40, 80, 900, 700])}]
    gl = []
    for i in range(3):
        gb.append({'box': dict(id=f'in{i}', maxclass='newobj', text=f'in {i + 1}', numinlets=0, numoutlets=1,
                               patching_rect=[40 + i * 120, 30, 50, 22])})
        gl.append({'patchline': dict(source=[f'in{i}', 0], destination=['code', i])})
    for i in range(2):
        gb.append({'box': dict(id=f'out{i}', maxclass='newobj', text=f'out {i + 1}', numinlets=1, numoutlets=0,
                               patching_rect=[40 + i * 120, 810, 50, 22])})
        gl.append({'patchline': dict(source=['code', i], destination=[f'out{i}', 0])})
    G = dict(fileversion=1, appversion=VERSION, classnamespace='dsp.gen', rect=[40, 40, 1000, 880], boxes=gb, lines=gl)

    obj('input', 'plugin~', 300, 250, ni=2, no=2, outlettype=['signal', 'signal'])
    obj('phasor', 'plugphasor~', 480, 250, ni=1, no=1, outlettype=['signal'])
    obj('dsp', 'gen~', 300, 330, ni=3, no=2, varname='dsp', patcher=G, outlettype=['signal', 'signal'])
    obj('output-audio', 'plugout~', 300, 380, ni=2, no=2)
    wire('input', 'dsp'); wire('input', 'dsp', 1, 1); wire('phasor', 'dsp', 0, 2)
    wire('control', 'dsp')
    wire('dsp', 'output-audio'); wire('dsp', 'output-audio', 1, 1)
    obj('mem', 'buffer~ #0-mem 32000 2', 520, 330, no=2)
    obj('view', 'buffer~ #0-view @samps 32', 700, 330, no=2)
    obj('bind-mem', 'loadmess mem #0-mem', 520, 370); wire('bind-mem', 'dsp')
    obj('bind-view', 'loadmess view #0-view', 700, 370); wire('bind-view', 'dsp')
    obj('bind-panel', 'loadmess viewbuffer #0-view', 880, 370); wire('bind-panel', 'panel')
    obj('clock', 'qmetro 33 @active 1', 880, 250)
    box('tick', 'message', [880, 290, 40, 22], text='tick', numinlets=2, numoutlets=1)
    wire('clock', 'tick'); wire('tick', 'panel')
    obj('thisdevice', 'live.thisdevice', 20, 250, no=3)
    box('init', 'message', [20, 290, 40, 22], text='init', numinlets=2, numoutlets=1)
    wire('thisdevice', 'init'); wire('init', 'control')

    P['parameterbanks'] = {
        '0': dict(index=0, name='Chiasmus', parameters=['time', 'feedback', 'cross', 'pitch', 'smooth', 'swell', 'mix', 'freeze']),
        '1': dict(index=1, name='Motion', parameters=['trigger', 'division', 'pre', 'drift', 'pattern', 'flip', 'fine', 'sens']),
        '2': dict(index=2, name='Tape', parameters=['engine', 'zip', 'wow', 'scatter', 'tone', 'drive', 'diffuse', '-']),
        '3': dict(index=3, name='Output', parameters=['width', 'duck', 'output', '-', '-', '-', '-', '-'])}
    P['inherited_shortname'] = 1

    deps = ['chiasmus.control.js', 'chiasmus.panel.js', 'chiasmus.theme.js']
    patch = dict(fileversion=1, appversion=VERSION, classnamespace='box', rect=[60, 80, 1200, 760],
                 openrect=[0, 0, W, H], devicewidth=W, openinpresentation=1, bglocked=1, **T.patcher_attrs(),
                 boxes=B[1:] + B[:1], lines=L, parameters=P, autosave=0, title='Chiasmus', latency=0,
                 dependency_cache=[dict(name=n, type='TEXT', implicit=1) for n in deps])

    DEST.mkdir(exist_ok=True)
    STAGE.mkdir(parents=True, exist_ok=True)
    for n in ['chiasmus.control.js', 'chiasmus.panel.js']:
        shutil.copyfile(ROOT / 'src' / n, STAGE / n)
    T.write_jsui(STAGE, 'chiasmus', sep='.')
    raw = (json.dumps({'patcher': patch}, indent=2) + '\n').encode()
    (STAGE / 'Chiasmus.maxpat').write_bytes(raw)
    (STAGE / 'chiasmus.gendsp').write_text(json.dumps({'patcher': G}, indent=2) + '\n')
    # Deterministic stamp: newest source file, not wall-clock time.
    stamp = max(int(f.stat().st_mtime) for f in list((ROOT / 'src').iterdir()) + [Path(__file__)]) + 2082844800
    amxd = freeze('Chiasmus.amxd', raw + b'\0', [(n, 'TEXT', (STAGE / n).read_bytes()) for n in deps], b'aaaa', stamp)
    (DEST / 'Chiasmus.amxd').write_bytes(amxd)
    print(f'Built {DEST / "Chiasmus.amxd"} (frozen, {len(deps)} dependencies embedded, {len(amxd)} bytes)')


# --- Freeze: same 'mx@c' collective container as vermiform/syzygy (see vermiform/scripts/build.py). ---
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
