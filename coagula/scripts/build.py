"""Build Coagula into device/: the editable patch and loose deps (Coagula.maxpat, *.js, coagula.gendsp)
sit beside the frozen, self-contained Coagula.amxd (an Instrument: MIDI in, stereo out).

The Node engine (src/coagula-engine.js) is embedded like any other dependency, but node.script
cannot start a script that only exists inside a frozen device, so coagula-control.js extracts it
to /tmp/coagula-engine-<hash>.js at load and scripts a node.script pointing at that file."""
from pathlib import Path
import hashlib
import json
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'device'
sys.path.insert(0, str(ROOT.parent / 'theme'))
sys.path.insert(0, str(ROOT / 'scripts'))
import theme as T  # noqa: E402  shared device theme
from freeze import freeze  # noqa: E402

VERSION = dict(major=9, minor=0, revision=9, architecture='x64', modernui=1)
W, H = 1012, 169
B, L, P = [], [], {}

# Keep in sync with DIVISIONS in src/coagula-control.js.
DIVNAMES = ['1/64', '1/32T', '1/32', '1/16T', '1/16', '1/8T', '1/8', '1/4T', '1/4', '1/2', '1 Bar']
DEPS = ['coagula-control.js', 'coagula-panel.js', 'coagula-space.js', 'coagula-wave.js', 'coagula-theme.js', 'coagula-engine.js']

# Sections (x, y, w, h, header) for the background panel; keep in sync with the widget rects below.
SECTIONS = [[2, 0, 188, 168, 'Source'], [192, 0, 180, 168, 'Space'], [374, 0, 228, 168, 'Play'],
            [604, 0, 216, 168, 'Grain'], [822, 0, 130, 168, 'Trigger'], [954, 0, 56, 168, 'Output']]
ADV_SECTIONS = SECTIONS[:2] + [[374, 0, 580, 168, 'Analysis'], SECTIONS[5]]
LAYOUT = dict(sections=SECTIONS, advSections=ADV_SECTIONS, source=[10, 110, 172], maxlen=[738, 66],
              summary=[740, 34])


def box(id, cls, rect, **kw):
    B.append({'box': dict(id=id, maxclass=cls, patching_rect=rect, **kw)})
    return id


def obj(id, text, x, y, ni=1, no=1, w=160, **kw):
    return box(id, 'newobj', [x, y, w, 22], text=text, numinlets=ni, numoutlets=no, **kw)


def msg(id, text, x, y):
    return box(id, 'message', [x, y, max(40, 8 * len(text)), 22], text=text, numinlets=2, numoutlets=1)


def wire(a, b, o=0, i=0):
    L.append({'patchline': dict(source=[a, o], destination=[b, i])})


def spot():
    n = len([b for b in B if b['box'].get('presentation')])
    return [20 + (n % 8) * 150, 700 + (n // 8) * 80]


def parameter(key, long, short, lo, hi, init, rect, cls='live.dial', unit=1, ptype=0, enum=None, exponent=None,
              invisible=False, route=True, **kw):
    v = dict(parameter_longname=long, parameter_shortname=short, parameter_type=2 if enum else ptype,
             parameter_mmin=lo, parameter_mmax=hi, parameter_initial=[init], parameter_initial_enable=1,
             parameter_unitstyle=9 if enum else unit)
    if enum:
        v['parameter_enum'] = enum
    if exponent:
        v['parameter_exponent'] = exponent
    if invisible:
        v['parameter_invisible'] = 1
    outs = {'live.menu': 3, 'live.tab': 3, 'live.gain~': 5}.get(cls, 2)
    x, y = spot()
    box(key, cls, [x, y, rect[2], rect[3]], varname=key, parameter_enable=1,
        saved_attribute_attributes={'valueof': v}, numinlets=2 if cls == 'live.gain~' else 1, numoutlets=outs,
        presentation=1, presentation_rect=rect, **kw)
    P[key] = [long, short, 0]
    if route:
        obj('p-' + key, 'prepend ' + key, x, y + 50, w=110)
        wire(key, 'p-' + key, 2 if cls == 'live.gain~' else 0)
        wire('p-' + key, 'control')


def dial(key, long, short, lo, hi, init, x, y, showvalue=True, **kw):
    parameter(key, long, short, lo, hi, init, [x, y, 44, 48], **T.dial(shownumber=showvalue), **kw)


def tab(key, long, short, items, init, rect, lines=None, **kw):
    n = len(items) if lines is None else lines
    parameter(key, long, short, 0, len(items) - 1, init, rect, cls='live.tab', enum=items, mode=0,
              num_lines_presentation=n, num_lines_patching=n, **T.tab(), **kw)


def toggle(key, long, short, rect, text=None, init=0, **kw):
    parameter(key, long, short, 0, 1, init, rect, cls='live.text', enum=['Off', 'On'], text=text or short,
              texton=text or short, mode=1, **T.button(), **kw)


def button(key, text, rect, **kw):
    """Momentary live.text that carries no value: not a parameter."""
    x, y = spot()
    box(key, 'live.text', [x, y, rect[2], rect[3]], varname=key, parameter_enable=0, text=text, texton=text, mode=0,
        numinlets=1, numoutlets=2, presentation=1, presentation_rect=rect, **T.button(), **kw)
    obj('p-' + key, 'prepend ' + key, x, y + 50, w=110)
    wire(key, 'p-' + key)
    wire('p-' + key, 'control')


def label(key, text, rect, **kw):
    box(key, 'comment', rect, varname=key, text=text, presentation=1, presentation_rect=rect, numinlets=1,
        numoutlets=0, **T.label(), **kw)


def build(qa=False):
    engine_src = (ROOT / 'src/coagula-engine.js').read_bytes()
    build_id = hashlib.sha1(engine_src).hexdigest()[:12]

    # Face: background jsui (sections, readouts). ignoreclick so native widgets receive every click.
    box('panel', 'jsui', [0, 0, W, H], varname='panel', filename='coagula-panel.js', presentation=1,
        presentation_rect=[0, 0, W, H], numinlets=1, numoutlets=0, border=0, ignoreclick=1, background=1,
        parameter_enable=0)
    obj('control', 'js coagula-control.js', 20, 330, no=5, varname='control',
        saved_object_attributes=dict(filename='coagula-control.js', parameter_enable=0))
    wire('control', 'panel', 2)

    # ---- Source (2..190)
    x, y = spot()
    # live.drop takes the drops (decodemode 0: we want the original file, not Live's temporary
    # decode); the wave jsui on top of it draws "Drop Sample Here" / the waveform, click-through.
    box('drop', 'live.drop', [x, y, 172, 50], varname='drop', presentation=1, presentation_rect=[10, 20, 172, 50],
        numinlets=1, numoutlets=2, outlettype=['', ''], decodemode=0, legend='', parameter_enable=1,
        saved_attribute_attributes={'valueof': dict(parameter_longname='Sample File', parameter_shortname='Sample',
                                                     parameter_invisible=1)})
    P['drop'] = ['Sample File', 'Sample', 0]
    obj('p-drop', 'prepend drop', x, y + 60, w=110); wire('drop', 'p-drop'); wire('p-drop', 'control')
    box('wave', 'jsui', [x + 200, y, 172, 50], varname='wave', filename='coagula-wave.js', presentation=1,
        presentation_rect=[10, 20, 172, 50], numinlets=1, numoutlets=0, border=0, ignoreclick=1, parameter_enable=0)
    button('loadbtn', 'Load…', [10, 76, 84, 18])
    toggle('adv', 'Show Analysis Settings', 'Analysis', [98, 76, 84, 18], text='Analysis', invisible=True)
    # ---- Space (192..372): the scatter plot jsui (clickable; it is the XY pad)
    box('space', 'jsui', [400, 40, 164, 142], varname='space', filename='coagula-space.js', presentation=1,
        presentation_rect=[200, 20, 164, 142], numinlets=1, numoutlets=1, outlettype=[''], border=0,
        parameter_enable=0)
    wire('control', 'space', 3)
    # ---- Play (374..602)
    parameter('morph', 'Morph Assembly-Texture %', 'Morph', 0, 100, 0, [382, 20, 40, 120], cls='live.slider',
              unit=5, orientation=0, showname=1, shownumber=1, **T.slider())
    toggle('link', 'Link Morph', 'Link', [380, 146, 44, 18], init=1)
    dial('tx', 'Target X %', 'Target X', 0, 100, 50, 434, 20, unit=5)
    dial('ty', 'Target Y %', 'Target Y', 0, 100, 50, 434, 104, unit=5)
    tab('variant', 'Segmentation Variant', 'Variant', ['Onset', 'Hyb 400', 'Hyb 200', 'Fixed'], 1, [486, 22, 56, 72])
    tab('axis', 'Axis Mode', 'Axis', ['Pitch', 'Noise'], 0, [486, 112, 56, 36])
    dial('sildens', 'Silence Density %', 'Silence', 0, 100, 0, 550, 20, unit=5)
    button('match', 'Match', [550, 74, 44, 18])
    dial('unvmix', 'Unvoiced Mix %', 'Unvoiced', 0, 100, 20, 550, 104, unit=5)
    # ---- Grain (604..820)
    dial('k', 'Nearest k (candidates)', 'k', 1, 32, 1, 612, 20, unit=0, ptype=1)
    dial('jitter', 'Jitter % of axis', 'Jitter', 0, 50, 0, 612, 104, unit=5)
    dial('xfade', 'Crossfade ms', 'X-Fade', 2, 200, 8, 664, 20, unit=2, exponent=2.5)
    dial('continuity', 'Continuity %', 'Contin.', 0, 100, 60, 664, 104, unit=5)
    dial('maxlen', 'Max Length ms (top = Off)', 'Max Len', 20, 1000, 1000, 716, 20, unit=2, exponent=2.5,
         showvalue=False)
    dial('guard', 'Repeat Guard segments', 'Guard', 0, 16, 4, 716, 104, unit=0, ptype=1)
    dial('silthresh', 'Silence Threshold dB', 'Sil Thr', -70, -20, -50, 768, 20, unit=4)
    dial('transpose', 'Transpose st', 'Transp', -24, 24, 0, 768, 104, unit=7, ptype=1)
    # ---- Trigger (822..952)
    tab('trigmode', 'Trigger Mode', 'Trigger', ['Chain', 'Clock', 'MIDI'], 0, [830, 22, 56, 54])
    toggle('run', 'Run', 'Run', [830, 82, 56, 18])
    toggle('sync', 'Clock Sync', 'Sync', [830, 104, 56, 18])
    toggle('keytrack', 'Key Tracking', 'Key Trk', [830, 125, 56, 18])
    toggle('t2m', 'Transpose to Match', 'Retune', [830, 146, 56, 18])
    dial('rate', 'Clock Rate Hz', 'Rate', 0.5, 100, 8, 894, 20, unit=3, exponent=3)
    parameter('division', 'Sync Division', 'Division', 0, len(DIVNAMES) - 1, 4, [894, 112, 52, 18], cls='live.menu',
              enum=DIVNAMES, **T.menu())
    # ---- Output (954..1010): native gain fader with meter, in the audio path
    parameter('gain', 'Output Gain dB', 'Gain', -70, 6, 0, [962, 20, 40, 142], cls='live.gain~', unit=4,
              route=False, orientation=0, showname=1, shownumber=1, outlettype=['signal', 'signal', '', 'float', 'list'])

    # ---- Analysis page (hidden until Analysis is on); stored with the Set, not automatable
    label('l_frame', 'Frame', [382, 18, 60, 18], hidden=1)
    tab('a_frame', 'Frame Size', 'Frame', ['1024', '2048', '4096'], 1, [382, 34, 120, 18], lines=1, invisible=True, hidden=1)
    label('l_hop', 'Hop', [382, 54, 60, 18], hidden=1)
    tab('a_hop', 'Hop Size', 'Hop', ['128', '256', '512'], 1, [382, 70, 120, 18], lines=1, invisible=True, hidden=1)
    button('reanalyze', 'Re-analyze', [382, 104, 120, 18], hidden=1)
    button('reveal', 'Reveal Sidecar', [382, 126, 120, 18], hidden=1)
    dial('a_onset', 'Onset Threshold', 'Onset', 0.3, 6, 1.5, 514, 20, unit=1, invisible=True, hidden=1)
    dial('a_gate', 'Pause Gate dB', 'Gate', -80, -20, -50, 566, 20, unit=4, invisible=True, hidden=1)
    dial('a_minseg', 'Min Segment ms', 'Min Seg', 10, 100, 30, 618, 20, unit=2, invisible=True, hidden=1)
    dial('a_fixed', 'Fixed Chop ms', 'Fixed', 20, 500, 100, 670, 20, unit=2, invisible=True, hidden=1)
    dial('a_splita', 'Hybrid 400 Split ms', 'Split A', 100, 1000, 400, 514, 104, unit=2, invisible=True, hidden=1)
    dial('a_splitb', 'Hybrid 200 Split ms', 'Split B', 50, 500, 200, 566, 104, unit=2, invisible=True, hidden=1)
    dial('a_pitchlo', 'Pitch Floor Hz', 'Pitch Lo', 30, 200, 50, 618, 104, unit=3, invisible=True, hidden=1)
    dial('a_pitchhi', 'Pitch Ceiling Hz', 'Pitch Hi', 400, 4000, 1500, 670, 104, unit=3, exponent=2, invisible=True,
         hidden=1)

    # ---- DSP
    code = (ROOT / 'src/coagula.genexpr').read_text()
    gb = [{'box': dict(id='code', maxclass='codebox', code=code, numinlets=1, numoutlets=4,
                       patching_rect=[40, 80, 900, 700])}]
    gl = [{'patchline': dict(source=['in0', 0], destination=['code', 0])}]
    gb.append({'box': dict(id='in0', maxclass='newobj', text='in 1', numinlets=0, numoutlets=1, patching_rect=[40, 30, 50, 22])})
    for i in range(4):
        gb.append({'box': dict(id=f'out{i}', maxclass='newobj', text=f'out {i + 1}', numinlets=1, numoutlets=0,
                               patching_rect=[40 + i * 120, 810, 50, 22])})
        gl.append({'patchline': dict(source=['code', i], destination=[f'out{i}', 0])})
    G = dict(fileversion=1, appversion=VERSION, classnamespace='dsp.gen', rect=[40, 40, 1000, 880], boxes=gb, lines=gl)

    obj('phasor', 'plugphasor~', 300, 200, ni=1, no=1, outlettype=['signal'])
    obj('dsp', 'gen~', 300, 330, ni=1, no=4, varname='dsp', patcher=G, outlettype=['signal'] * 4)
    obj('output-audio', 'plugout~', 300, 460, ni=2, no=2)
    wire('phasor', 'dsp')
    wire('control', 'dsp')
    wire('dsp', 'gain'); wire('dsp', 'gain', 1, 1)
    wire('gain', 'output-audio'); wire('gain', 'output-audio', 1, 1)
    obj('need-edge', 'edge~', 480, 380, ni=1, no=2)
    msg('need', 'need', 480, 410)
    wire('dsp', 'need-edge', 2); wire('need-edge', 'need'); wire('need', 'tonode-send')

    # ---- Node engine plumbing. The node.script itself is created by coagula-control.js.
    # Everything bound for Node goes through send/receive: a trigger in between mangles
    # anything-messages ([t a] turned them into the symbol "a").
    obj('tonode-send', 's ---tonode', 700, 490, ni=1, no=0, w=110)
    obj('tonode', 'r ---tonode', 700, 520, ni=0, no=1, varname='tonode', w=110)
    wire('control', 'tonode-send', 1)
    obj('fromnode', 'route gen panel space buf ctl wave', 700, 600, ni=1, no=7, varname='fromnode', w=240)
    obj('nodestatus', 'prepend nodestatus', 940, 520, varname='nodestatus', w=130)
    wire('nodestatus', 'control')
    obj('genroute', 'route pend', 700, 640, ni=1, no=2)
    obj('pend', 'unpack 0 0. 0. 0. 0. 0.', 700, 670, ni=1, no=6, w=200)
    wire('fromnode', 'genroute'); wire('genroute', 'pend'); wire('genroute', 'dsp', 1)
    for i, name in enumerate(['pcommit', 'pstart', 'plen', 'prate', 'pgain', 'pxf']):
        obj('pp-' + name, 'prepend ' + name, 700 + i * 90, 700, w=85)
        wire('pend', 'pp-' + name, i); wire('pp-' + name, 'dsp')
    wire('fromnode', 'panel', 1)
    wire('fromnode', 'space', 2)
    obj('src', 'buffer~ ---src', 950, 640, ni=1, no=2, w=120)
    wire('fromnode', 'src', 3)
    msg('bufready', 'bufready', 950, 670)
    wire('src', 'bufready', 1); wire('bufready', 'control')
    wire('fromnode', 'control', 4)
    wire('fromnode', 'wave', 5)
    obj('bind-src', 'loadmess src ---src', 950, 560); wire('bind-src', 'dsp')
    obj('bind-bufname', 'loadmess bufname ---src', 950, 590); wire('bind-bufname', 'control')
    obj('pts', 'dict ---pts', 1150, 560, ni=2, no=4)
    obj('bind-dict', 'loadmess dictname ---pts', 1150, 590); wire('bind-dict', 'control')
    # space drag -> Target X / Y dials
    obj('space-route', 'route tx ty', 400, 200, ni=1, no=3)
    wire('space', 'space-route'); wire('space-route', 'tx'); wire('space-route', 'ty', 1)

    # ---- sample path (pattr blob, stored in the Live Set), file dialog, MIDI, init
    box('pathstore', 'newobj', [20, 560, 160, 22], text='pattr pathstore', varname='pathstore', numinlets=2,
        numoutlets=3, outlettype=['', '', ''], parameter_enable=1,
        saved_attribute_attributes={'valueof': dict(parameter_longname='Sample Path', parameter_shortname='Path',
                                                     parameter_type=3, parameter_invisible=1)})
    P['pathstore'] = ['Sample Path', 'Path', 0]
    obj('p-path', 'prepend path', 20, 590, w=110)
    wire('pathstore', 'p-path'); wire('p-path', 'control'); wire('control', 'pathstore', 4)
    obj('dialog', 'opendialog sound', 200, 560, ni=1, no=2, varname='dialog', w=120)
    obj('p-opened', 'prepend opened', 200, 590, w=110)
    wire('dialog', 'p-opened'); wire('p-opened', 'control')
    obj('notes', 'notein', 20, 250, ni=1, no=3)
    obj('note-pack', 'pack 0 0', 20, 280, ni=2, no=1)
    obj('note-msg', 'prepend note', 20, 310, w=110)
    wire('notes', 'note-pack'); wire('notes', 'note-pack', 1, 1); wire('note-pack', 'note-msg'); wire('note-msg', 'control')
    obj('thisdevice', 'live.thisdevice', 200, 250, no=3)
    msg('init', 'init', 200, 290)
    wire('thisdevice', 'init'); wire('init', 'control')

    if qa:  # OSC test port; never in the shipped device
        obj('qa-udp', 'udpreceive 7474', 20, 640, ni=1, no=1, w=120)
        wire('qa-udp', 'control')

    P['parameterbanks'] = {
        '0': dict(index=0, name='Play', parameters=['morph', 'tx', 'ty', 'variant', 'axis', 'sildens', 'unvmix', 'gain']),
        '1': dict(index=1, name='Grain', parameters=['k', 'jitter', 'xfade', 'continuity', 'maxlen', 'guard', 'silthresh', 'transpose']),
        '2': dict(index=2, name='Trigger', parameters=['trigmode', 'rate', 'sync', 'keytrack', 't2m', 'link', 'division', 'run'])}
    P['inherited_shortname'] = 1

    # Background panel last in the box list so it draws behind everything else.
    boxes = B[1:] + B[:1]
    patch = dict(fileversion=1, appversion=VERSION, classnamespace='box', rect=[60, 80, 1400, 900],
                 openrect=[0, 0, W, H], devicewidth=W, openinpresentation=1, bglocked=1, **T.patcher_attrs(),
                 boxes=boxes, lines=L, parameters=P, autosave=0, title='Coagula', latency=0,
                 dependency_cache=[dict(name=n, type='TEXT', implicit=1) for n in DEPS])

    dest = ROOT / 'tests' / 'qa' if qa else DEST
    name = 'Coagula QA' if qa else 'Coagula'
    dest.mkdir(parents=True, exist_ok=True)
    control = (ROOT / 'src/coagula-control.js').read_text()
    if qa:
        control = control.replace('var QA = false;', 'var QA = true;')
    control = control.replace("'__BUILD__'", repr(build_id)).replace('ENGINE_SIZE = 0;', f'ENGINE_SIZE = {len(engine_src)};')
    (dest / 'coagula-control.js').write_text(control)
    panel = (ROOT / 'src/coagula-panel.js').read_text().replace('/*__LAYOUT__*/null', json.dumps(LAYOUT))
    (dest / 'coagula-panel.js').write_text(panel)
    for n in ['coagula-space.js', 'coagula-wave.js', 'coagula-engine.js']:
        shutil.copyfile(ROOT / 'src' / n, dest / n)
    T.write_jsui(dest, 'coagula')
    raw = (json.dumps({'patcher': patch}, indent=2) + '\n').encode()
    (dest / f'{name}.maxpat').write_bytes(raw)
    (dest / 'coagula.gendsp').write_text(json.dumps({'patcher': G}, indent=2) + '\n')
    stamp = max(int(f.stat().st_mtime) for f in list((ROOT / 'src').iterdir()) + [Path(__file__)]) + 2082844800
    amxd = freeze(f'{name}.amxd', raw + b'\0', [(n, 'TEXT', (dest / n).read_bytes()) for n in DEPS], b'iiii', stamp)
    (dest / f'{name}.amxd').write_bytes(amxd)
    print(f'Built {dest / (name + ".amxd")} (frozen, {len(DEPS)} dependencies embedded, {len(amxd)} bytes, engine {build_id})')


if __name__ == '__main__':
    build(qa='--qa' in sys.argv)
