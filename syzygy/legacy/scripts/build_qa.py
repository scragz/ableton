"""Create a silent-to-speakers Live harness that records the actual gen~ core."""
from pathlib import Path
import json
import struct

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT/'tests/runtime'
DEST.mkdir(parents=True, exist_ok=True)
patch = json.loads((ROOT/'device/Syzygy.maxpat').read_text())['patcher']
dsp = next(b['box'] for b in patch['boxes'] if b['box']['id']=='dsp')
dsp['patching_rect'] = [40,100,80,22]
boxes = [{'box':dsp}]
lines = []
def obj(id, text, x, y, **kw):
    boxes.append({'box':dict(id=id,maxclass='newobj',text=text,patching_rect=[x,y,220,22],**kw)})
def wire(a,b,ao=0,bi=0):
    lines.append({'patchline':dict(source=[a,ao],destination=[b,bi])})
obj('qa','js syzygy.qa.js',40,30,numinlets=1,numoutlets=2)
obj('load','loadbang',300,30)
obj('record','sfrecord~ 2',40,150,numinlets=2)
obj('audio','plugout~',300,150,numinlets=2)
obj('silence','sig~ 0',300,100)
wire('load','qa'); wire('qa','dsp'); wire('qa','record',1)
wire('dsp','record'); wire('dsp','record',1,1)
wire('silence','audio'); wire('silence','audio',0,1)
boxes.append({'box':dict(id='label',maxclass='comment',text='Syzygy DSP verification / internal recording / output muted',patching_rect=[10,10,470,24],presentation=1,presentation_rect=[10,10,470,24])})
doc={'patcher':dict(fileversion=1,appversion=patch['appversion'],rect=[80,80,600,300],devicewidth=500,
                    openinpresentation=1,boxes=boxes,lines=lines,dependency_cache=[dict(name='syzygy.qa.js',type='TEXT')])}
payload=(json.dumps(doc)+'\n\0').encode()
(DEST/'Syzygy QA.amxd').write_bytes(b'ampf'+struct.pack('<I',4)+b'iiii'+b'meta'+struct.pack('<II',4,0)+b'ptch'+struct.pack('<I',len(payload))+payload)
params = {}
import re
for name,initial in re.findall(r'Param (\w+)\(([-.\d]+),', (ROOT/'src/syzygy.genexpr').read_text()):
    params[name]=float(initial)
js='''autowatch=1;
inlets=1;
outlets=2;
var defaults=DEFAULTS;
var root=ROOTPATH;
var cases=[
    {name:"rest",ms:1200,params:{active:0}},
    {name:"default",ms:5000,params:{active:1}},
    {name:"sustain",ms:12000,params:{active:1,feedback:0.98},cut:3000},
    {name:"extreme",ms:6000,params:{active:1,excite:1,feedback:1,size:0,fm:12,ratio:8,drive:1,coupling:1,drift:1,body:1,decay:1,space:1,output:0,m0:1,m1:1,m2:1,m3:-1,m4:1,m5:1}},
    {name:"long_dark",ms:4000,params:{active:1,source:0,size:1,damping:1,feedback:1,drive:0,body:0,space:0}},
    {name:"mono",ms:4000,params:{active:1,width:0}},
    {name:"panic",ms:3500,params:{active:1},panic:1500}
];
var index=-1;
var nextTask=new Task(next,this);
var cutTask=new Task(function(){outlet(0,"excite",0);},this);
var panicTask=new Task(function(){outlet(0,"active",0);resetTask.schedule(150);},this);
var resetTask=new Task(function(){outlet(0,"reset");outlet(0,"active",0);},this);
function bang(){nextTask.schedule(1500);}
function next(){
    outlet(1,0);
    index++;
    if(index>=cases.length){outlet(0,"active",0);post("SYZYGY QA COMPLETE\\n");return;}
    outlet(0,"reset");
    for(var k in defaults)outlet(0,k,defaults[k]);
    var c=cases[index];
    for(var k in c.params)outlet(0,k,c.params[k]);
    outlet(1,"samptype","float32");
    outlet(1,"open",root+"/"+c.name+".wav","wave");
    outlet(1,1);
    if(c.cut)cutTask.schedule(c.cut);
    if(c.panic)panicTask.schedule(c.panic);
    nextTask.schedule(c.ms);
}
function notifydeleted(){nextTask.cancel();cutTask.cancel();panicTask.cancel();resetTask.cancel();}
'''.replace('DEFAULTS',json.dumps(params)).replace('ROOTPATH',json.dumps(str(DEST)))
(DEST/'syzygy.qa.js').write_text(js)
print(DEST/'Syzygy QA.amxd')
