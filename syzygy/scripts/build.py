"""Build Syzygy 3 into device/: Syzygy.amxd (instrument) and Syzygy Audio.amxd (audio effect) from one
source, each frozen with its dependencies, plus the editable Syzygy.maxpat, loose JS and syzygy3.gendsp.
Open device/Syzygy.maxpat in Max to live-edit (then change src/ and rebuild; never hand-edit output)."""
from pathlib import Path
import copy
import json
import shutil
import struct
import sys

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'device'
sys.path.insert(0, str(ROOT.parent / 'theme'))
import theme as T  # noqa: E402  shared device theme

VERSION = dict(major=9, minor=0, revision=9, architecture='x64', modernui=1)
W, H = 1064, 169
B, L, P = [], [], {}
DEPS = ['syzygy3.control.js', 'syzygy3.panel.js', 'syzygy3.orbit.js', 'syzygy3.theme.js']
BODIES = ['Sun', 'Earth', 'Moon']
BODY_X = [2, 112, 222]          # section left edges; keep in sync with src/syzygy3.panel.js
ORBIT = [338, 18, 146, 146]     # orbit display jsui


def box(id, cls, rect, **kw):
    B.append({'box': dict(id=id, maxclass=cls, patching_rect=rect, **kw)})
    return id


def obj(id, text, x, y, ni=1, no=1, **kw):
    return box(id, 'newobj', [x, y, 180, 22], text=text, numinlets=ni, numoutlets=no, **kw)


def wire(a, b, o=0, i=0):
    L.append({'patchline': dict(source=[a, o], destination=[b, i])})


def parameter(key, long, short, lo, hi, init, rect, cls='live.dial', unit=1, ptype=0, enum=None, exponent=None, **kw):
    i = len(P)
    v = dict(parameter_longname=long, parameter_shortname=short, parameter_type=2 if enum else ptype,
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
    P[key] = [long, short, 0]
    obj('p-' + key, 'prepend ' + key, 20 + (i % 8) * 150, 470 + (i // 8) * 90)
    wire(key, 'p-' + key)
    wire('p-' + key, 'control')


def dial(key, long, short, lo, hi, init, x, y, **kw):
    parameter(key, long, short, lo, hi, init, [x, y, 44, 48], **T.dial(), **kw)


def tab(key, long, items, init, rect):
    parameter(key, long, long, 0, len(items) - 1, init, rect, cls='live.tab', enum=items, mode=0,
              num_lines_presentation=len(items), num_lines_patching=len(items), **T.tab())


def toggle(key, long, text, rect):
    parameter(key, long, text, 0, 1, 0, rect, cls='live.text', enum=['Off', 'On'], text=text, texton=text,
              mode=1, **T.button())


def action(key, text, rect):
    """Action button: a non-parameter live.text sending `action <key>` to the controller.
    mode 1 (toggle), as in vermiform: Live's theme only draws the lit state for a toggle, so the
    controller unlights it ~120 ms after the press. The message box fires on 0 as well as 1, so a
    click landing inside the flash window still counts."""
    box(key, 'live.text', [1300, 300 + len(B) * 2, 60, 20], varname=key, presentation=1, presentation_rect=rect,
        text=text, texton=text, mode=1, parameter_enable=0, numinlets=1, numoutlets=2, outlettype=['', ''],
        **T.button())
    box('msg-' + key, 'message', [1380, 300 + len(B) * 2, 110, 22], text='action ' + key, numinlets=2, numoutlets=1)
    wire(key, 'msg-' + key)
    wire('msg-' + key, 'control')


def gen(codefile, outputs, name):
    code = (ROOT / 'src' / codefile).read_text()
    boxes = [{'box': dict(id='code', maxclass='codebox', code=code, numinlets=2, numoutlets=outputs,
                          patching_rect=[40, 80, 900, 700])}]
    lines = []
    for i in range(2):
        boxes.append({'box': dict(id=f'in{i}', maxclass='newobj', text=f'in {i + 1}', numinlets=0, numoutlets=1,
                                  patching_rect=[40 + i * 120, 30, 50, 22])})
        lines.append({'patchline': dict(source=[f'in{i}', 0], destination=['code', i])})
    for i in range(outputs):
        boxes.append({'box': dict(id=f'out{i}', maxclass='newobj', text=f'out {i + 1}', numinlets=1, numoutlets=0,
                                  patching_rect=[40 + i * 120, 810, 50, 22])})
        lines.append({'patchline': dict(source=['code', i], destination=[f'out{i}', 0])})
    return dict(fileversion=1, appversion=VERSION, classnamespace='dsp.gen', rect=[40, 40, 1000, 880],
                boxes=boxes, lines=lines)


def build_patch():
    B.clear(); L.clear(); P.clear()
    # Face: background jsui (sections, meters, readouts). ignoreclick + background so every native
    # widget on top gets its clicks. The orbit display is a separate, clickable jsui.
    box('panel', 'jsui', [0, 0, W, H], varname='panel', filename='syzygy3.panel.js', presentation=1,
        presentation_rect=[0, 0, W, H], numinlets=1, numoutlets=0, border=0, ignoreclick=1, background=1,
        parameter_enable=0)
    obj('control', 'js syzygy3.control.js', 20, 330, no=3, varname='control')
    wire('control', 'panel', 1)

    # Bodies: Pitch / Mass over Matter / Level; meter, Strike and readouts between the rows.
    defaults = [(0, 80, 80), (7, 60, 70), (12, 30, 70)]
    for i, name in enumerate(BODIES):
        x, n = BODY_X[i], i + 1
        pitch, matter, level = defaults[i]
        dial(f'pitch{n}', f'{name} Pitch', 'Pitch', -24, 24, pitch, x + 8, 20, unit=7, ptype=1)
        dial(f'mass{n}', f'{name} Mass', 'Mass', 0.25, 4, 1, x + 58, 20, unit=1, exponent=2)
        dial(f'matter{n}', f'{name} Matter', 'Matter', 0, 100, matter, x + 8, 104, unit=5)
        dial(f'level{n}', f'{name} Level', 'Level', 0, 100, level, x + 58, 104, unit=5)
        action(f'strike{n}', 'Strike', [x + 8, 78, 44, 18])
    # Orbit (332..662): display | Rate / Chaos | Gravity / Tide | Form over Launch and Hold.
    box('orbit', 'jsui', [900, 250, ORBIT[2], ORBIT[3]], varname='orbit', filename='syzygy3.orbit.js', presentation=1,
        presentation_rect=ORBIT, numinlets=1, numoutlets=1, border=0, parameter_enable=0)
    wire('orbit', 'control')
    wire('control', 'orbit', 2)
    dial('orate', 'Orbit Rate', 'Rate', 0.01, 10, 0.2, 492, 20, unit=3, exponent=3)
    dial('chaos', 'Chaos', 'Chaos', 0, 100, 10, 492, 104, unit=5)
    dial('gravity', 'Gravity', 'Gravity', 0, 100, 35, 544, 20, unit=5)
    dial('tide', 'Tide', 'Tide', 0, 100, 20, 544, 104, unit=5)
    tab('oform', 'Form', ['Eight', 'Lagrange', 'Euler', 'Swarm'], 0, [596, 22, 58, 72])
    action('launch', 'Launch', [596, 100, 58, 18])
    toggle('ohold', 'Hold', 'Hold', [596, 122, 58, 18])
    # Excite (664..834): Mallet / Position | Bow / Align | Keys over Strike All.
    dial('mallet', 'Mallet', 'Mallet', 0, 100, 50, 672, 20, unit=5)
    dial('strikepos', 'Position', 'Position', 0, 100, 30, 672, 104, unit=5)
    dial('bow', 'Bow', 'Bow', 0, 100, 0, 724, 20, unit=5)
    dial('syzalign', 'Align', 'Align', 0, 100, 0, 724, 104, unit=5)
    tab('keys', 'Keys', ['Root', 'Bodies'], 0, [776, 22, 50, 36])
    action('strikeall', 'All', [776, 72, 50, 18])
    # Resonance (836..948): Root / Decay | Bright / Feed.
    dial('root', 'Root', 'Root', 24, 96, 48, 844, 20, unit=8, ptype=1)
    dial('decay', 'Decay', 'Decay', 50, 30000, 2500, 844, 104, unit=2, exponent=3)
    dial('bright', 'Bright', 'Bright', 0, 100, 55, 896, 20, unit=5)
    dial('feed', 'Feed', 'Feed', 0, 100, 0, 896, 104, unit=5)
    # Output (950..1062): Space / Doppler | Width / Output.
    dial('space', 'Space', 'Space', 0, 100, 30, 958, 20, unit=5)
    dial('doppler', 'Doppler', 'Doppler', 0, 100, 30, 958, 104, unit=5)
    dial('width', 'Width', 'Width', 0, 100, 80, 1010, 20, unit=5)
    dial('output', 'Output', 'Output', -70, 6, -6, 1010, 104, unit=4)

    # DSP and display buffer.
    G = gen('syzygy3.genexpr', 2, 'dsp')
    obj('dsp', 'gen~', 300, 1050, ni=2, no=2, varname='dsp', patcher=G, outlettype=['signal', 'signal'])
    obj('audio', 'plugout~', 300, 1110, ni=2, no=2)
    wire('control', 'dsp')
    wire('dsp', 'audio'); wire('dsp', 'audio', 1, 1)
    obj('view', 'buffer~ ---syzview @samps 64', 520, 1050, no=2)
    obj('bind-view', 'loadmess view ---syzview', 520, 1090); wire('bind-view', 'dsp')
    obj('bind-panel', 'loadmess viewbuffer ---syzview', 720, 1090); wire('bind-panel', 'panel'); wire('bind-panel', 'orbit')
    obj('clock', 'qmetro 33 @active 1', 720, 1010)
    box('tick', 'message', [720, 1050, 40, 22], text='tick', numinlets=2, numoutlets=1)
    wire('clock', 'tick'); wire('tick', 'panel'); wire('tick', 'orbit')
    obj('thisdevice', 'live.thisdevice', 20, 250, no=3)
    box('init', 'message', [20, 290, 40, 22], text='init', numinlets=2, numoutlets=1)
    wire('thisdevice', 'init'); wire('init', 'control')
    obj('notes', 'notein', 20, 1300, no=3)
    obj('note-pack', 'pack 0 0', 20, 1340, ni=2)
    obj('note-msg', 'prepend note', 20, 1380)
    wire('notes', 'note-pack', 1, 1); wire('notes', 'note-pack'); wire('note-pack', 'note-msg'); wire('note-msg', 'control')

    P['parameterbanks'] = {
        '0': dict(index=0, name='Orbit', parameters=['orate', 'chaos', 'gravity', 'tide', 'syzalign', 'bow', 'feed', 'decay']),
        '1': dict(index=1, name='Bodies', parameters=['matter1', 'matter2', 'matter3', 'mass1', 'mass2', 'mass3', 'root', 'oform']),
        '2': dict(index=2, name='Tone', parameters=['pitch1', 'pitch2', 'pitch3', 'level1', 'level2', 'level3', 'mallet', 'bright']),
        '3': dict(index=3, name='Space', parameters=['strikepos', 'space', 'width', 'doppler', 'output', 'ohold', 'keys', '-'])}
    P['inherited_shortname'] = 1
    return dict(fileversion=1, appversion=VERSION, classnamespace='box', rect=[60, 80, 1400, 900],
                openrect=[0, 0, W, H], devicewidth=W, openinpresentation=1, bglocked=1, **T.patcher_attrs(),
                boxes=B[1:] + B[:1], lines=L, parameters=P, autosave=0, title='Syzygy', latency=0,
                dependency_cache=[dict(name=n, type='TEXT', implicit=1) for n in DEPS]), G


def audio_variant(patch):
    """Syzygy Audio: plugin~ excites the bodies; the Keys tab (no MIDI in an audio effect) becomes Input."""
    fx = copy.deepcopy(patch)
    fx['title'] = 'Syzygy Audio'
    fx['boxes'] = [b for b in fx['boxes'] if b['box']['id'] not in ('keys', 'p-keys', 'notes', 'note-pack', 'note-msg')]
    fx['lines'] = [l for l in fx['lines'] if not {l['patchline']['source'][0], l['patchline']['destination'][0]} &
                   {'keys', 'p-keys', 'notes', 'note-pack', 'note-msg'}]
    del fx['parameters']['keys']
    saved = B[:], L[:], dict(P)
    B.clear(); L.clear(); P.clear()
    dial('input', 'Input', 'Input', 0, 100, 60, 779, 20)
    obj('input-audio', 'plugin~', 300, 990, ni=2, no=2, outlettype=['signal', 'signal'])
    wire('input-audio', 'dsp'); wire('input-audio', 'dsp', 1, 1)
    fx['boxes'] = fx['boxes'][:-1] + B + fx['boxes'][-1:]   # keep the face jsui last in the list
    fx['lines'] += L
    fx['parameters']['input'] = P['input']
    fx['parameters']['parameterbanks']['3']['parameters'][6] = 'input'
    B[:], L[:] = saved[0], saved[1]; P.clear(); P.update(saved[2])
    return fx


def build():
    patch, G = build_patch()
    DEST.mkdir(exist_ok=True)
    for n in ['syzygy3.control.js', 'syzygy3.panel.js', 'syzygy3.orbit.js']:
        shutil.copyfile(ROOT / 'src' / n, DEST / n)
    T.write_jsui(DEST, 'syzygy3', sep='.')
    (DEST / 'syzygy3.gendsp').write_text(json.dumps({'patcher': G}, indent=2) + '\n')
    # Deterministic stamp: newest source file, not wall-clock time.
    stamp = max(int(f.stat().st_mtime) for f in list((ROOT / 'src').glob('syzygy3*')) + [Path(__file__)]) + 2082844800
    deps = [(n, 'TEXT', (DEST / n).read_bytes()) for n in DEPS]
    for name, p, code in [('Syzygy', patch, b'iiii'), ('Syzygy Audio', audio_variant(patch), b'aaaa')]:
        raw = (json.dumps({'patcher': p}, indent=2) + '\n').encode()
        (DEST / f'{name}.maxpat').write_bytes(raw)
        amxd = freeze(f'{name}.amxd', raw + b'\0', deps, code, stamp)
        (DEST / f'{name}.amxd').write_bytes(amxd)
        print(f'Built {DEST / (name + ".amxd")} (frozen, {len(deps)} dependencies embedded, {len(amxd)} bytes)')


# --- Freeze: same 'mx@c' collective container as vermiform/atomism (see vermiform/scripts/build.py). ---
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
