#!/usr/bin/env python3
"""Validate the frozen collective, control graph, and deterministic packaging."""
import hashlib
import json
import struct
import subprocess
import sys
from pathlib import Path
from build import ROOT, CONTROLS, W, H


def chunks(buf, begin, end):
    while begin < end:
        tag = buf[begin:begin+4].decode()
        size = struct.unpack_from('>I', buf, begin+4)[0]
        assert size >= 8 and begin+size <= end, (tag, size)
        yield tag, buf[begin+8:begin+size]
        begin += size
    assert begin == end


def entries(data):
    assert data[:12] == b'ampf\x04\x00\x00\x00aaaa', 'Must be an audio effect'
    assert data[24:28] == b'ptch'
    assert struct.unpack_from('<I', data, 28)[0] == len(data)-32
    payload = data[32:]
    assert payload[:4] == b'mx@c'
    directory = struct.unpack_from('>I', payload, 12)[0]
    assert payload[directory:directory+4] == b'dlst'
    found = {}
    for tag, entry in chunks(payload, directory+8, len(payload)):
        assert tag == 'dire'
        fields = dict(chunks(entry, 0, len(entry)))
        name = fields['fnam'].rstrip(b'\0').decode()
        size = struct.unpack('>I', fields['sz32'])[0]
        offset = struct.unpack('>I', fields['of32'])[0]
        assert 16 <= offset and offset+size <= directory
        found[name] = payload[offset:offset+size]
    return found


def graph(p):
    boxes = {entry['box']['id']: entry['box'] for entry in p['boxes']}
    assert len(boxes) == len(p['boxes'])
    for entry in p['lines']:
        line = entry['patchline']
        for side, attr in [('source', 'numoutlets'), ('destination', 'numinlets')]:
            ident, port = line[side]
            assert ident in boxes and 0 <= port < boxes[ident].get(attr, 99), (ident, port)
    for b in boxes.values():
        if 'patcher' in b:
            graph(b['patcher'])
    return boxes


def intersects(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx+bw and bx < ax+aw and ay < by+bh and by < ay+ah


def main():
    subprocess.run([sys.executable, str(ROOT/'scripts/build.py')], check=True)
    path = ROOT/'device/Calcinatio.amxd'
    data = path.read_bytes()
    found = entries(data)
    assert set(found) == {'Calcinatio.amxd', 'calcinatio-theme.js', 'calcinatio-art.js'}
    p = json.loads(found['Calcinatio.amxd'].rstrip(b'\0'))['patcher']
    boxes = graph(p)
    controls = {b['id']: b for b in boxes.values() if b.get('parameter_enable')}
    assert set(controls) == {spec[0] for spec in CONTROLS}
    assert all(b['maxclass'].startswith('live.') for b in controls.values())
    assert boxes['panel']['ignoreclick'] == 1
    assert boxes['panel']['filename'] == 'calcinatio-art.js'
    assert all(0 <= b['presentation_rect'][0] and 0 <= b['presentation_rect'][1]
               and b['presentation_rect'][0]+b['presentation_rect'][2] <= W
               and b['presentation_rect'][1]+b['presentation_rect'][3] <= H
               for b in controls.values())
    visible = [b for b in boxes.values() if b.get('presentation') and b['id'] != 'panel']
    for i, left in enumerate(visible):
        for right in visible[i+1:]:
            assert not intersects(left['presentation_rect'], right['presentation_rect']), (
                left['id'], right['id'])
    code = boxes['dsp']['patcher']['boxes'][0]['box']['code']
    for needle in ['noise() * seedGain', 'guardL = tanh(', 'cleanL = dcblock(coreL)',
                   'loopL.write(fixdenorm(cleanL))', 'order == 0', 'order == 1',
                   'out1 = clamp(']:
        assert needle in code, needle
    assert code == (ROOT/'src/calcinatio.genexpr').read_text()
    assert found['calcinatio-theme.js'] == (ROOT/'src/calcinatio-theme.js').read_bytes()
    assert found['calcinatio-art.js'] == (ROOT/'src/calcinatio-art.js').read_bytes()
    assert {x.name for x in (ROOT/'device').iterdir()} == {'Calcinatio.amxd'}
    subprocess.run([sys.executable, str(ROOT/'scripts/build.py')], check=True)
    assert path.read_bytes() == data
    print('PASS: audio-effect header, complete embedded dependencies, 18 native controls, graph, layout, deterministic build.')
    print('SHA256 '+hashlib.sha256(data).hexdigest())


if __name__ == '__main__':
    main()
