#!/usr/bin/env python3
"""Native QA: write device/qa/Autocatalysis QA.maxpat (the real device patch plus a recorder and a case
driver) with its JS beside it, then open it in Max (Live's bundled Max works). It plays the cases in
scripts/native_qa.js through the real gen~, records each to device/qa/<case>.wav, logs console errors
to device/qa/native.log, and scripts/check_native.py analyses the result.

    python3 scripts/native_qa.py      # then open the patch in Max, wait for DONE in native.log
"""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import build  # noqa: E402
import dsp  # noqa: E402


def main():
    folder = ROOT / 'device' / 'qa'
    folder.mkdir(parents=True, exist_ok=True)   # files are overwritten in place; nothing is deleted
    p, _ = build.build_patch(dsp.genexpr())
    p['title'] = 'Autocatalysis QA'
    p['openinpresentation'] = 0
    boxes, lines = p['boxes'], p['lines']

    def obj(ident, text, ni=1, no=1):
        boxes.insert(0, {'box': dict(id=ident, maxclass='newobj', text=text, numinlets=ni, numoutlets=no,
                                     patching_rect=[1500, 40 + len(boxes) * 3, 260, 22], varname=ident)})

    def wire(a, b, ao=0, bi=0):
        lines.append({'patchline': dict(source=[a, ao], destination=[b, bi])})

    obj('qa', 'js autocatalysis.native_qa.js')
    obj('load', 'loadbang')
    wire('load', 'qa')
    obj('record', 'sfrecord~ 2', ni=2, no=1)
    wire('dsp', 'record', 0, 0)
    wire('dsp', 'record', 1, 1)
    obj('dacon', 'dac~', ni=2, no=0)
    obj('monitorL', '*~ 0.', ni=2)
    obj('monitorR', '*~ 0.', ni=2)
    wire('dsp', 'monitorL', 0, 0)
    wire('dsp', 'monitorR', 1, 0)
    wire('monitorL', 'dacon', 0, 0)
    wire('monitorR', 'dacon', 0, 1)
    # Audio settings for an interface-free, sample-timed run: NonRealTime driver, scheduler in audio
    # interrupt + overdrive so the case timers follow audio time, 48 kHz. The driver script saves the
    # current values first and puts them back when it is done.
    for ident, what in (('adsr', 'sr'), ('adto', 'takeover'), ('adod', 'overdrive')):
        obj(ident, 'adstatus ' + what, ni=1, no=2)
        obj('pre-' + ident, 'prepend ' + ident)
        wire(ident, 'pre-' + ident, 1, 0)
        wire('pre-' + ident, 'qa')
    obj('error', 'error 1', no=1)
    obj('errpre', 'prepend logerror')
    wire('error', 'errpre')
    wire('errpre', 'qa')
    p['dependency_cache'].append(dict(name='autocatalysis.native_qa.js', type='TEXT', implicit=1))
    (folder / 'Autocatalysis QA.maxpat').write_text(json.dumps({'patcher': p}, indent=2))
    shutil.copyfile(ROOT / 'scripts' / 'native_qa.js', folder / 'autocatalysis.native_qa.js')
    for n in ['autocatalysis.control.js', 'autocatalysis.panel.js']:
        shutil.copyfile(ROOT / 'src' / n, folder / n)
    build.T.write_jsui(folder, 'autocatalysis', sep='.')
    print(folder / 'Autocatalysis QA.maxpat')
    return folder


if __name__ == '__main__':
    main()
