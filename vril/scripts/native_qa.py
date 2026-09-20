#!/usr/bin/env python3
"""Create an isolated native Max test harness in the system temporary directory.
This is an optional developer check; the release build never calls it.
"""
import sys
sys.dont_write_bytecode=True
import json
import tempfile
from pathlib import Path
from build import patch, assets
from parameters import P

def prepare():
    root=Path(tempfile.mkdtemp(prefix='vril-qa-'))
    p=patch()['patcher'];p['title']='Vril Native QA'
    def obj(i,t,no=1,ni=1,**kw):
        p['boxes'].append({'box':dict(id=i,maxclass='newobj',text=t,patching_rect=[20,1100+len(p['boxes'])*3,280,22],numinlets=ni,numoutlets=no,**kw)})
    def wire(a,b,o=0,i=0):p['lines'].append({'patchline':dict(source=[a,o],destination=[b,i])})
    obj('qa','v8 '+root.name+'.js',varname='qa')
    obj('qab','loadbang');wire('qab','qa')
    obj('err','error 1',no=2);obj('errpre','prepend logerror');wire('err','errpre');wire('errpre','qa')
    obj('record','sfrecord~ 2',ni=2,varname='record');wire('dsp','record');wire('dsp','record',1,1)
    obj('dacon','dac~',ni=2,varname='dacon')
    obj('udp','udpreceive 7479');wire('udp','qa')
    obj('tone','cycle~ 173');obj('level','*~ 0.',ni=2,varname='level');wire('tone','level');wire('level','dsp');wire('level','dsp',0,1)
    (root/'Vril Native QA.maxpat').write_text(json.dumps({'patcher':p},indent=2))
    for name,kind,data in assets()[1:]:(root/name).write_bytes(data)
    (root/(root.name+'.js')).write_text('var ROOT='+json.dumps(str(root))+';\nvar SCHEMA='+json.dumps(P)+';\n'+(Path(__file__).parent/'native_qa.js').read_text())
    print(root)
if __name__=='__main__':prepare()
