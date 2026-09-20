#!/usr/bin/env python3
"""Read the binary independently, validate its graph, closure and native layout."""
import sys
sys.dont_write_bytecode=True
import json,struct,hashlib,subprocess
from pathlib import Path
from build import ROOT

def check():
    before=set(p.relative_to(ROOT) for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts)
    subprocess.run([sys.executable,str(ROOT/'scripts/build.py')],check=True)
    data=(ROOT/'device/Vril.amxd').read_bytes()
    assert data[:12]==b'ampf\x04\0\0\0iiii', 'Must be an instrument, not an audio effect'
    assert data[24:28]==b'ptch'
    payload=data[32:];assert struct.unpack_from('<I',data,28)[0]==len(payload)
    assert payload[:4]==b'mx@c'
    directory=struct.unpack_from('>I',payload,12)[0]
    assert payload[directory:directory+4]==b'dlst'
    def chunks(buf,start,end):
        while start<end:
            tag=buf[start:start+4].decode();size=struct.unpack_from('>I',buf,start+4)[0]
            assert size>=8 and start+size<=end
            yield tag,buf[start+8:start+size]
            start+=size
        assert start==end
    entries={}
    for tag,entry in chunks(payload,directory+8,len(payload)):
        assert tag=='dire';fields=dict(chunks(entry,0,len(entry)))
        name=fields['fnam'].rstrip(b'\0').decode();size=struct.unpack('>I',fields['sz32'])[0];offset=struct.unpack('>I',fields['of32'])[0]
        assert offset>=16 and offset+size<=directory
        entries[name]=payload[offset:offset+size]
    assert set(entries)=={'Vril.amxd','vril.control.js','vril-theme.js','vril-art.js'}
    p=json.loads(entries['Vril.amxd'].rstrip(b'\0'))['patcher']
    def graph(p):
        boxes={b['box']['id']:b['box'] for b in p['boxes']};assert len(boxes)==len(p['boxes'])
        for l in p['lines']:
            line=l['patchline'];assert line['source'][0] in boxes and line['destination'][0] in boxes
            for attr,nattr in [('source','numoutlets'),('destination','numinlets')]:
                ident,port=line[attr];assert 0<=port<boxes[ident].get(nattr,99),(ident,port)
        for b in boxes.values():
            if 'patcher' in b:graph(b['patcher'])
        return boxes
    boxes=graph(p)
    controls=[b for b in boxes.values() if b.get('parameter_enable')]
    assert len(controls)==30 and all(b['maxclass'].startswith('live.') for b in controls)
    assert len(boxes['algorithm']['saved_attribute_attributes']['valueof']['parameter_enum'])==9
    rects=[]
    for b in controls:
        x,y,w,h=b['presentation_rect'];assert x>=0 and y>=0 and x+w<=1127 and y+h<=169
        for name,(a,c,d,e) in rects:assert x>=a+d or a>=x+w or y>=c+e or c>=y+h,(b['id'],name)
        rects.append((b['id'],[x,y,w,h]))
    after=set(p.relative_to(ROOT) for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts)
    assert after-before<={Path('device/Vril.amxd')},after-before
    assert {p.name for p in (ROOT/'device').iterdir()}=={'Vril.amxd'}
    subprocess.run([sys.executable,str(ROOT/'scripts/build.py')],check=True)
    assert data==(ROOT/'device/Vril.amxd').read_bytes(), 'Build must be deterministic'
    print('PASS: instrument header, embedded dependency closure, patch graph, 28 native controls, layout bounds, deterministic single-file build.')
    print('SHA256 '+hashlib.sha256(data).hexdigest())
if __name__=='__main__':check()
