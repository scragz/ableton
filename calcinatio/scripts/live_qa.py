#!/usr/bin/env python3
"""Create a temporary Live-hosted recorder for the exact Calcinatio Gen core."""
import json
from pathlib import Path

from build import ROOT, freeze
from native_qa import main as native_patch


def main():
    folder = native_patch()
    p = json.loads((folder/'Calcinatio Native QA.maxpat').read_text())
    p['patcher']['title'] = 'Calcinatio Live QA'
    p['patcher']['dependency_cache'].append(
        dict(name='native_qa.js', type='TEXT', implicit=1))
    name = 'Calcinatio-QA.amxd'
    script = (folder/'native_qa.js').read_text().replace(
        "function run() { this.patcher.getnamed('dacon').message(1); nextcase(); }",
        "function run() { nextcase(); }")
    dest = ROOT/'device'/name
    dest.write_bytes(freeze([
        (name, 'JSON', (json.dumps(p, separators=(',', ':'))+'\n').encode()+b'\0'),
        ('native_qa.js', 'TEXT', script.encode()),
        ('calcinatio-theme.js', 'TEXT', (folder/'calcinatio-theme.js').read_bytes()),
        ('calcinatio-art.js', 'TEXT', (folder/'calcinatio-art.js').read_bytes()),
    ]))
    print(dest)


if __name__ == '__main__':
    main()
