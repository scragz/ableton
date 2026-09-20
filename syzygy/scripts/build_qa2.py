"""Record native Gen output in Live without sending test audio to speakers."""
from pathlib import Path
import json,struct,re
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'tests/runtime-v2';DEST.mkdir(exist_ok=True)
patch=json.loads((ROOT/'device/Syzygy.maxpat').read_text())['patcher']
dsp=next(b['box'] for b in patch['boxes'] if b['box']['id']=='dsp');dsp['patching_rect']=[40,100,80,22]
boxes=[{'box':dsp}];lines=[]
def obj(id,text,x,y,**kw):boxes.append({'box':dict(id=id,maxclass='newobj',text=text,patching_rect=[x,y,220,22],**kw)})
def wire(a,b,ao=0,bi=0):lines.append({'patchline':dict(source=[a,ao],destination=[b,bi])})
obj('qa','js syzygy2.qa.js',40,30,numinlets=1,numoutlets=3);obj('load','loadbang',300,30)
obj('record','sfrecord~ 2',40,150,numinlets=2);obj('audio','plugout~',300,150,numinlets=2);obj('silence','sig~ 0',300,100)
obj('source','cycle~ 220',300,200);obj('gain','*~ 0',300,240)
wire('source','gain');wire('qa','gain',2,1);wire('gain','dsp');wire('gain','dsp',0,1)
wire('load','qa');wire('qa','dsp');wire('qa','record',1);wire('dsp','record');wire('dsp','record',1,1);wire('silence','audio');wire('silence','audio',0,1)
boxes.append({'box':dict(id='label',maxclass='comment',text='Syzygy 2 / native audio verification / speakers muted',patching_rect=[10,10,470,24],presentation=1,presentation_rect=[10,10,470,24])})
doc={'patcher':dict(fileversion=1,appversion=patch['appversion'],rect=[80,80,600,300],devicewidth=500,openinpresentation=1,boxes=boxes,lines=lines,dependency_cache=[dict(name='syzygy2.qa.js',type='TEXT')])}
payload=(json.dumps(doc)+'\n\0').encode();(DEST/'Syzygy 2 QA.amxd').write_bytes(b'ampf'+struct.pack('<I',4)+b'iiii'+b'meta'+struct.pack('<II',4,0)+b'ptch'+struct.pack('<I',len(payload))+payload)
params={k:float(v) for k,v in re.findall(r'Param (\w+)\(([-.\d]+),',(ROOT/'src/syzygy2.genexpr').read_text())}
js='''autowatch=1;inlets=1;outlets=3;
var defaults=DEFAULTS,root=ROOTPATH;
var cases=[
{name:'rest',ms:1200,params:{active:0}},
{name:'wood',ms:4000,hit:1,params:{active:1,wood:1,glass:0,metal:0,coupling:0,space:0}},
{name:'glass',ms:4000,hit:2,params:{active:1,wood:0,glass:1,metal:0,coupling:0,space:0}},
{name:'metal',ms:4000,hit:3,params:{active:1,wood:0,glass:0,metal:1,coupling:0,space:0}},
{name:'trio',ms:5000,hit:0,params:{active:1}},
{name:'bow',ms:5000,params:{active:1,bow:1}},
{name:'evolve',ms:10000,params:{active:1,bow:1,evolve:1,cycle:3}},
{name:'extreme',ms:6000,hit:0,params:{active:1,wood:1,glass:1,metal:1,bow:1,decay:1,brightness:1,coupling:1,instability:1,space:1,output:0,root:880}},
{name:'mono',ms:3000,hit:0,params:{active:1,width:0}},
{name:'panic',ms:4000,hit:0,params:{active:1,bow:1},panic:1500},
{name:'external',ms:4000,params:{active:1},input:0.2}
];
var index=-1,nextTask=new Task(next,this),hitTask=new Task(hit,this),panicTask=new Task(panic,this),resetTask=new Task(reset,this);
function bang(){nextTask.schedule(1200);}
function hit(){outlet(0,'target',cases[index].hit);outlet(0,'strikeid',1);}
function panic(){outlet(0,'active',0);resetTask.schedule(180);}
function reset(){outlet(0,'reset');outlet(0,'active',0);}
function next(){outlet(1,0);outlet(2,0);index++;if(index>=cases.length){outlet(0,'active',0);return;}
outlet(0,'reset');for(var k in defaults)outlet(0,k,defaults[k]);var c=cases[index];for(var k in c.params)outlet(0,k,c.params[k]);
outlet(1,'samptype','float32');outlet(1,'open',root+'/'+c.name+'.wav','wave');outlet(1,1);
if(c.hit!==undefined)hitTask.schedule(200);if(c.panic)panicTask.schedule(c.panic);if(c.input)outlet(2,c.input);nextTask.schedule(c.ms);}
function notifydeleted(){nextTask.cancel();hitTask.cancel();panicTask.cancel();resetTask.cancel();}
'''.replace('DEFAULTS',json.dumps(params)).replace('ROOTPATH',json.dumps(str(DEST)))
(DEST/'syzygy2.qa.js').write_text(js);print(DEST/'Syzygy 2 QA.amxd')
