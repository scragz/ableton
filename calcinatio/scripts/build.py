#!/usr/bin/env python3
"""Build the editable Max patch and single embedded audio effect AMXD."""
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent/'theme'))
import theme as T  # noqa: E402
VERSION = dict(major=9, minor=0, revision=9, architecture='x64', modernui=1)
W, H = 1030, 188

# Key, Live label, minimum, maximum, initial value, UI position, optional enum.
CONTROLS = [
    ('input_trim', 'Input dB', -36, 24, 0, (48, 32), None),
    ('seed_level', 'Seed dB', -120, -60, -100, (48, 88), None),
    ('input_mute', 'Mute Input', 0, 1, 0, (29, 162), ['Input', 'Mute']),
    ('core_order', 'Order', 0, 2, 0, (169, 39),
     ['Fold > Fuzz > Degrade', 'Degrade > Fold > Fuzz', 'Fuzz > Degrade > Fold']),
    ('fold_stages', 'Stages', 1, 6, 2, (216, 63), None),
    ('fold_depth', 'Fold', 0, 12, 4, (318, 63), None),
    ('fuzz_bias', 'Bias', -0.8, 0.8, 0.15, (216, 122), None),
    ('drift_rate', 'Drift Hz', 0.001, 0.3, 0.027, (318, 122), None),
    ('bit_depth', 'Bits', 2, 16, 14, (450, 32), None),
    ('hold_samples', 'Hold smp', 1, 64, 1, (450, 92), None),
    ('delay_ms', 'Delay ms', 0.5, 40, 7, (574, 32), None),
    ('mod_depth', 'Mod ms', 0, 5, 0.3, (675, 32), None),
    ('mod_rate', 'Mod Hz', 0.001, 5, 0.13, (574, 92), None),
    ('feedback', 'Feedback', 0, 1.7, 1.08, (675, 92), None),
    ('ceiling', 'Ceiling dB', -24, 0, -1, (821, 32), None),
    ('drywet', 'Dry/Wet', 0, 100, 100, (923, 32), None),
    ('stereo', 'Stereo', 0, 1, 1, (812, 130), ['Mono', 'Stereo']),
    ('output_trim', 'Output dB', -36, 12, -12, (923, 92), None),
]


def genpatch(code):
    boxes = [{'box': dict(id='code', maxclass='codebox', code=code,
                          numinlets=2, numoutlets=2, patching_rect=[70, 80, 1050, 700])}]
    lines = []
    for i in range(2):
        boxes.append({'box': dict(id=f'in{i}', maxclass='newobj', text=f'in {i + 1}',
                                  numinlets=0, numoutlets=1, patching_rect=[40 + 110*i, 25, 55, 22])})
        boxes.append({'box': dict(id=f'out{i}', maxclass='newobj', text=f'out {i + 1}',
                                  numinlets=1, numoutlets=0, patching_rect=[40 + 110*i, 810, 55, 22])})
        lines.append({'patchline': dict(source=[f'in{i}', 0], destination=['code', i])})
        lines.append({'patchline': dict(source=['code', i], destination=[f'out{i}', 0])})
    return dict(fileversion=1, appversion=VERSION, classnamespace='dsp.gen',
                rect=[0, 0, 1180, 880], boxes=boxes, lines=lines)


def patch():
    boxes, lines, params = [], [], {}

    def box(ident, cls, rect, **kw):
        boxes.append({'box': dict(id=ident, maxclass=cls, patching_rect=rect, **kw)})

    def obj(ident, text, x, y, ni=1, no=1, **kw):
        box(ident, 'newobj', [x, y, 178, 22], text=text,
            numinlets=ni, numoutlets=no, **kw)

    def wire(a, b, ao=0, bi=0):
        lines.append({'patchline': dict(source=[a, ao], destination=[b, bi])})

    box('panel', 'jsui', [0, 0, W, H], filename='calcinatio-art.js',
        presentation=1, presentation_rect=[0, 0, W, H], border=0,
        ignoreclick=1, background=1, numinlets=1, numoutlets=0)
    for i, (key, label, low, high, default, (x, y), enum) in enumerate(CONTROLS):
        special = key in {'input_mute', 'core_order', 'stereo'}
        cls = 'live.menu' if key == 'core_order' else 'live.text' if special else 'live.dial'
        rect = [x, y, 212 if key == 'core_order' else 94 if key == 'input_mute' else
                76 if special else
                44 if key in {'fold_stages', 'fold_depth', 'fuzz_bias', 'drift_rate'} else 51,
                21 if special else 52]
        # Live's decibel display turns values below its floor into "-inf";
        # show the seed's actual dB value so the dither setting is legible.
        unitstyle = (1 if key == 'seed_level'
                     else 4 if key in {'input_trim', 'ceiling', 'output_trim'}
                     else 3 if key in {'drift_rate', 'mod_rate'}
                     else 2 if key in {'delay_ms', 'mod_depth'}
                     else 5 if key == 'drywet'
                     else 0 if key in {'fold_stages', 'bit_depth', 'hold_samples'}
                     else 1)
        attrs = dict(parameter_longname=label, parameter_shortname=label,
                     parameter_type=2 if enum else 0, parameter_mmin=low,
                     parameter_mmax=high, parameter_initial=[default],
                     parameter_initial_enable=1, parameter_unitstyle=9 if enum else unitstyle)
        if enum:
            attrs['parameter_enum'] = enum
        if key in {'fold_stages', 'bit_depth', 'hold_samples'}:
            attrs['parameter_type'] = 1
        extra = (dict(text=label, texton=label, mode=1) if cls == 'live.text'
                 else dict(showname=1, shownumber=1) if cls == 'live.dial' else {})
        box(key, cls, [20+(i%8)*140, 430+(i//8)*80, rect[2], rect[3]],
            varname=key, numinlets=1, numoutlets=3 if cls == 'live.menu' else 2,
            parameter_enable=1, saved_attribute_attributes={'valueof': attrs},
            presentation=1, presentation_rect=rect, **extra)
        if special:
            box('label_'+key, 'comment', [x, y-19, rect[2], 16], text=label,
                presentation=1, presentation_rect=[x, y-19, rect[2], 16],
                **T.label(),
                numinlets=1, numoutlets=0)
        obj('prepend_'+key, 'prepend '+key, 20+(i%8)*140, 470+(i//8)*80)
        wire(key, 'prepend_'+key)
        wire('prepend_'+key, 'dsp')
        params[key] = [label, label, 0]

    code = (ROOT/'src/calcinatio.genexpr').read_text()
    obj('input', 'plugin~', 220, 270, ni=2, no=2, outlettype=['signal', 'signal'])
    obj('dsp', 'gen~', 220, 325, ni=2, no=2, varname='dsp',
        patcher=genpatch(code), outlettype=['signal', 'signal'])
    obj('output', 'plugout~', 220, 375, ni=2, no=2)
    for channel in range(2):
        wire('input', 'dsp', channel, channel)
        wire('dsp', 'output', channel, channel)
    obj('ready', 'live.thisdevice', 20, 270, no=3)
    params['parameterbanks'] = {
        '0': dict(index=0, name='Calcinatio', parameters=[
            'input_trim', 'seed_level', 'core_order', 'fold_depth',
            'bit_depth', 'feedback', 'drywet', 'output_trim']),
        '1': dict(index=1, name='Core', parameters=[
            'input_mute', 'fold_stages', 'fuzz_bias', 'drift_rate',
            'hold_samples', 'stereo', '-', '-']),
        '2': dict(index=2, name='Feedback', parameters=[
            'delay_ms', 'mod_depth', 'mod_rate', 'feedback',
            'ceiling', '-', '-', '-'])}
    params['inherited_shortname'] = 1
    return dict(patcher=dict(fileversion=1, appversion=VERSION,
                             classnamespace='box', rect=[60, 80, 1140, 680],
                             openrect=[0, 0, W, H], devicewidth=W,
                             openinpresentation=1, bglocked=1,
                             boxes=boxes, lines=lines, parameters=params,
                             **T.patcher_attrs(),
                             dependency_cache=[dict(name=name, type='TEXT', implicit=1)
                                               for name in ['calcinatio-theme.js', 'calcinatio-art.js']],
                             autosave=0))


def chunk(tag, data):
    return tag.encode() + struct.pack('>I', len(data)+8) + data


def freeze(entries):
    """Write the same collective directory framing used by Max frozen AMXDs."""
    payload = b''
    directory = b''
    offset = 16
    for index, (name, kind, raw) in enumerate(entries):
        filename = name.encode() + b'\0'
        filename += b'\0' * (-len(filename) % 4)
        fields = [
            ('type', kind.encode()), ('fnam', filename),
            ('sz32', struct.pack('>I', len(raw))), ('of32', struct.pack('>I', offset)),
            ('vers', struct.pack('>I', 0)),
            ('flag', struct.pack('>I', 17 if index == 0 else 0)),
            ('mdat', struct.pack('>I', 0)),
        ]
        directory += chunk('dire', b''.join(chunk(k, v) for k, v in fields))
        payload += raw
        offset += len(raw)
    collective = b'mx@c' + struct.pack('>III', 16, 0, offset) + payload + chunk('dlst', directory)
    return (b'ampf' + struct.pack('<I', 4) + b'aaaa' + b'meta' +
            struct.pack('<II', 4, 7) + b'ptch' + struct.pack('<I', len(collective)) + collective)


def main():
    layout = dict(width=W, height=H, fieldsets=[
        [0, 0, 150, H, 'Input'], [150, 0, 250, H, 'Core'],
        [400, 0, 130, H, 'Degrade'], [530, 0, 250, H, 'Feedback'],
        [780, 0, 250, H, 'Output'],
    ])
    theme = T.prelude('calcinatio').encode()
    art = T.art('calcinatio', layout).encode()
    (ROOT/'src/calcinatio-theme.js').write_bytes(theme)
    (ROOT/'src/calcinatio-art.js').write_bytes(art)
    p = patch()
    pretty = json.dumps(p, indent=2) + '\n'
    (ROOT/'src/Calcinatio.maxpat').write_text(pretty)
    raw = (json.dumps(p, separators=(',', ':')) + '\n').encode() + b'\0'
    dest = ROOT/'device/Calcinatio.amxd'
    dest.parent.mkdir(exist_ok=True)
    dest.write_bytes(freeze([(dest.name, 'JSON', raw),
                             ('calcinatio-theme.js', 'TEXT', theme),
                             ('calcinatio-art.js', 'TEXT', art)]))
    print(f'Built {dest}: {dest.stat().st_size:,} bytes, {len(CONTROLS)} controls, embedded Gen DSP.')


if __name__ == '__main__':
    main()
