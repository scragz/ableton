"""Shared device theme: stock Live look.

theme.json is the single source. Builds import this module by path:

    sys.path.insert(0, str(ROOT.parent / 'theme')); import theme as T

- live.* widgets get no color attributes at all, so Live's theme draws them.
- comments, umenu and textedit bind to Live theme colors with `themecolor.*` expressions.
- jsui code includes `<prefix>-theme.js`, which resolves roles with max.getcolor() at paint time.
- the patcher gets no bgcolor, so the device background is Live's.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPEC = json.loads((HERE / 'theme.json').read_text())
FONT = SPEC['font']['family']
SIZE = SPEC['font']['label']
READOUT = SPEC['font']['readout']
LIVE = {role: v[0] for role, v in SPEC['roles'].items()}
FALLBACK = {role: v[1] for role, v in SPEC['roles'].items()}


def bind(**attrs):
    """{'textcolor': 'text'} -> saved_attribute_attributes binding each attribute to a Live theme color."""
    return {'saved_attribute_attributes': {a: {'expression': 'themecolor.' + LIVE[role]} for a, role in attrs.items()}}


def _font(size=None):
    return dict(fontname=FONT, fontsize=size or SIZE)


# Stock widgets: geometry-related attributes only.
def dial(showname=True, shownumber=True):
    return dict(appearance=0, showname=int(showname), shownumber=int(shownumber))


def button():
    return {}


def tab():
    return {}


def menu():
    return {}


def numbox():
    return {}


def slider():
    return {}


def label(role='label', size=None, justify=0):
    return dict(_font(size), textjustification=justify, **bind(textcolor=role))


def header(justify=0):
    """Bold section header, as used at the top-left of a section."""
    return dict(fontname=SPEC['fieldset']['legendFont'], fontsize=SIZE, textjustification=justify,
                **bind(textcolor='text'))


def divider(role='divider'):
    """Attributes for a `panel` box used as a rule between sections.

    Prefer thSections() in a background jsui: Max will not draw a `panel` narrower than
    four pixels, which reads much heavier than Live's one-pixel separators."""
    return dict(mode=0, rounded=0, border=0, **bind(bgcolor=role))


def readout(size=None, justify=0):
    return label('text', size or READOUT, justify)


def umenu():
    d = dict(_font(), arrow=1)
    d.update(bind(bgcolor='control', bgfillcolor_color='control', textcolor='text', color='text'))
    d['bgfillcolor_type'] = 'color'
    return d


def textedit():
    return dict(_font(), rounded=0, border=1, **bind(bgcolor='well', textcolor='text', bordercolor='line'))


def patcher_attrs():
    return dict(default_fontname=FONT, default_fontsize=SIZE)


def prelude(prefix):
    """ES5 jsui helpers. Each device ships its own copy under a unique filename
    because Max resolves include() names globally across every loaded device."""
    body = (HERE / 'jsui' / 'theme.js').read_text()
    data = dict(live=LIVE, fallback=FALLBACK, font=FONT, size=SIZE, readout=READOUT, fieldset=SPEC['fieldset'])
    return f'// Generated from theme/theme.json for {prefix}. Do not edit; rebuild instead.\n' + \
        body.replace('/*__THEME__*/null', json.dumps(data, separators=(',', ':')))


def art(prefix, layout, sep='-'):
    """Background jsui: fieldset frames and wells only; the surface stays Live's."""
    body = (HERE / 'jsui' / 'art.js').read_text()
    return body.replace('__PRELUDE__', f'{prefix}{sep}theme.js').replace('/*__LAYOUT__*/null', json.dumps(layout, separators=(',', ':')))


def write_jsui(dest, prefix, layout=None, sep='-'):
    """Write <prefix><sep>theme.js (and <prefix><sep>art.js when a layout is given) into dest."""
    dest = Path(dest)
    (dest / f'{prefix}{sep}theme.js').write_text(prelude(prefix))
    if layout is not None:
        (dest / f'{prefix}{sep}art.js').write_text(art(prefix, layout, sep))
    return [f'{prefix}{sep}theme.js'] + ([f'{prefix}{sep}art.js'] if layout is not None else [])
