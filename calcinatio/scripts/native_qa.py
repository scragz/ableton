#!/usr/bin/env python3
"""Create an isolated Max audio harness in /private/tmp; run its patch in bundled Max."""
import json
import tempfile
from pathlib import Path
from build import patch

ROOT = Path(__file__).resolve().parents[1]


def main():
    folder = Path(tempfile.mkdtemp(prefix='calcinatio-qa-'))
    p = patch()['patcher']
    p['title'] = 'Calcinatio Native QA'
    boxes = p['boxes']
    lines = p['lines']

    def obj(ident, text, ni=1, no=1):
        boxes.append({'box': dict(id=ident, maxclass='newobj', text=text,
                                  numinlets=ni, numoutlets=no,
                                  patching_rect=[20, 1100+len(boxes)*3, 260, 22],
                                  varname=ident)})

    def wire(a, b, ao=0, bi=0):
        lines.append({'patchline': dict(source=[a, ao], destination=[b, bi])})

    obj('qa', 'js native_qa.js')
    obj('load', 'loadbang')
    wire('load', 'qa')
    obj('record', 'sfrecord~ 2', ni=2)
    wire('dsp', 'record', 0, 0)
    wire('dsp', 'record', 1, 1)
    obj('dacon', 'dac~', ni=2, no=0)
    obj('monitorL', '*~ 0.', ni=2)
    obj('monitorR', '*~ 0.', ni=2)
    wire('dsp', 'monitorL', 0, 0)
    wire('dsp', 'monitorR', 1, 0)
    wire('monitorL', 'dacon', 0, 0)
    wire('monitorR', 'dacon', 0, 1)
    obj('tone', 'cycle~ 173')
    obj('level', '*~ 0.', ni=2)
    wire('tone', 'level')
    wire('level', 'dsp', 0, 0)
    wire('level', 'dsp', 0, 1)
    obj('error', 'error 1', no=2)
    obj('errpre', 'prepend logerror')
    wire('error', 'errpre')
    wire('errpre', 'qa')
    p['dependency_cache'].append(dict(name='native_qa.js', type='TEXT', implicit=1))
    (folder/'Calcinatio Native QA.maxpat').write_text(json.dumps({'patcher': p}, indent=2))
    (folder/'native_qa.js').write_text(
        'var ROOT=' + json.dumps(str(folder)) + ';\n' +
        (ROOT/'scripts/native_qa.js').read_text())
    for filename in ['calcinatio-theme.js', 'calcinatio-art.js']:
        (folder/filename).write_bytes((ROOT/'src'/filename).read_bytes())
    print(folder)
    return folder


if __name__ == '__main__':
    main()
