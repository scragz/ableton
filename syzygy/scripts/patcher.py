"""Build the editable Max patch and an unfrozen native M4L instrument."""
from pathlib import Path
import json
import shutil
import struct

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'device'
VERSION = dict(major=9, minor=0, revision=0, architecture='x64', modernui=1)
import sys
sys.path.insert(0, str(ROOT.parent / 'theme'))
import theme as T  # noqa: E402  shared device theme
BOXES, LINES, PARAMETERS = [], [], {}


def box(name, kind, rect, **attrs):
    b = dict(id=name, maxclass=kind, patching_rect=rect, **attrs)
    BOXES.append({'box': b})
    return name


def obj(name, text, x, y, ni=1, no=1, **attrs):
    return box(name, 'newobj', [x, y, 150, 22], text=text,
               numinlets=ni, numoutlets=no, **attrs)


def wire(src, dst, outlet=0, inlet=0):
    LINES.append({'patchline': dict(source=[src, outlet], destination=[dst, inlet])})


def parameter(key, label, lo, hi, initial, rect=None, kind='live.dial', unit=5, enum=None, **attrs):
    i = len(PARAMETERS)
    value = dict(parameter_longname=label, parameter_shortname=label,
                 parameter_type=2 if enum else 0, parameter_mmin=lo,
                 parameter_mmax=hi, parameter_initial=[initial],
                 parameter_initial_enable=1, parameter_unitstyle=unit)
    if enum:
        value['parameter_enum'] = enum
    present = dict(presentation=1, presentation_rect=rect) if rect else {}
    box(key, kind, [30 + (i % 6) * 165, 250 + (i // 6) * 110, 54, 50],
        varname=key, parameter_enable=1,
        saved_attribute_attributes={'valueof': value},
        numinlets=1, numoutlets=3 if kind=='live.menu' else 2,
        **present, **attrs)
    PARAMETERS[key] = [label, label, 0]
    obj('send-'+key, 'prepend '+key, 30+(i%6)*165, 305+(i//6)*110)
    wire(key, 'send-'+key)
    wire('send-'+key, 'control')


def dial(key, label, lo, hi, initial, x, y, unit=5, hint='', **attrs):
    if unit == 5:
        lo, hi, initial = lo*100, hi*100, initial*100
    parameter(key, label, lo, hi, initial, [x,y,44,48], unit=unit,
              annotation=hint, **T.dial(showname=True), **attrs)


def tiny(key, label, lo, hi, initial, x, y, unit=5, hint=''):
    """Live's tiny dial (fixed size): name above, small knob, value beside it. Stacks 34 px apart."""
    if unit == 5:
        lo, hi, initial = lo*100, hi*100, initial*100
    parameter(key, label, lo, hi, initial, [x,y,60,34], unit=unit, annotation=hint,
              appearance=1, showname=1, shownumber=1)


def button(key, text, rect, toggle=False, initial=0):
    parameter(key, key.title(), 0, 1, initial, rect, kind='live.text', unit=9,
              enum=['Off','On'], mode=1 if toggle else 0,
              text=text, texton=text, **T.button())
    if not toggle:
        # Keep Live's parameter-backed widget enabled, but don't expose actions
        # for automation or emit an action during parameter initialization.
        b = next(b['box'] for b in BOXES if b['box']['id']==key)
        b['active'] = 1
        b['saved_attribute_attributes']['valueof']['parameter_invisible'] = 1
        b['saved_attribute_attributes']['valueof']['parameter_initial_enable'] = 0
        LINES[:] = [l for l in LINES if l['patchline']['source'][0] != key]
        box('msg-'+key, 'message', [1210,300+len(BOXES)*2,65,22], text=key)
        # live.text in button mode emits bang, not the toggle's integer 1.
        wire(key, 'msg-'+key)
        wire('msg-'+key, 'control')


def action(key, text, rect):
    """Momentary live.text that is not a Live parameter; sends `action <key>` to the controller."""
    box(key, 'live.text', [1320, 300+len(BOXES)*2, 60, 20], varname=key, presentation=1, presentation_rect=rect,
        text=text, texton=text, mode=0, parameter_enable=0, numinlets=1, numoutlets=2, outlettype=['', ''],
        **T.button())
    box('msg-'+key, 'message', [1400, 300+len(BOXES)*2, 110, 22], text='action '+key)
    wire(key, 'msg-'+key)
    wire('msg-'+key, 'control')


def label(key, text, rect, role='label'):
    box(key, 'comment', rect, text=text, presentation=1, presentation_rect=rect, numinlets=1, numoutlets=0,
        **T.label(role))
