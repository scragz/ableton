"""Native Live test harness: actual Gen and controller, captured without speaker output."""
from pathlib import Path
import json,struct
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'scripts/build';RUN=ROOT/'docs/verification/audio';RUN.mkdir(exist_ok=True)
p=json.loads((DEST/'Vermiform.maxpat').read_text())['patcher']
p['boxes']=[b for b in p['boxes'] if b['box']['id']!='audio']
p['lines']=[l for l in p['lines'] if l['patchline']['destination'][0]!='audio']
def obj(i,t,**kw):p['boxes'].insert(0,{'box':dict(id=i,maxclass='newobj',text=t,patching_rect=[100,1300+len(p['boxes'])*3,250,22],**kw)})
def wire(a,b,o=0,i=0):p['lines'].append({'patchline':dict(source=[a,o],destination=[b,i])})
obj('qa','js vermiform.qa.js',numinlets=1,numoutlets=1);obj('qainit','loadbang');obj('rec','sfrecord~ 2',numinlets=2);obj('silence','sig~ 0');obj('audio','plugout~',numinlets=2);obj('errors','error 1',numinlets=1,numoutlets=2);obj('errorprefix','prepend logerror')
wire('qainit','qa');wire('qa','rec');wire('dsp','rec');wire('dsp','rec',1,1);wire('silence','audio');wire('silence','audio',0,1);wire('errors','errorprefix');wire('errorprefix','qa')
p['dependency_cache'].append(dict(name='vermiform.qa.js',type='TEXT'));p['title']='Vermiform QA'
raw=(json.dumps({'patcher':p})+'\n\0').encode();(DEST/'Vermiform QA.amxd').write_bytes(b'ampf'+struct.pack('<I',4)+b'iiii'+b'meta'+struct.pack('<II',4,0)+b'ptch'+struct.pack('<I',len(raw))+raw)
js='''autowatch=1;inlets=1;outlets=1;
var root=ROOT,cases=[],index=-1,task=new Task(next,this),event=new Task(change,this),finishTask=new Task(finish,this);
for(var i=1;i<=64;i++)cases.push({name:'mode-'+('0'+i).slice(-2),mode:i,ms:1800});
cases.push({name:'midi',mode:29,ms:4000,midi:true});
cases.push({name:'restore',mode:1,ms:4000,corrupt:true});
cases.push({name:'freeze',mode:64,ms:4000,freeze:true});
cases.push({name:'extreme',mode:34,ms:5000,extreme:true});
cases.push({name:'silence',mode:29,ms:2000,silence:true});
function c(){var o=this.patcher.getnamed('control');o.message.apply(o,arrayfromargs(arguments));}
var logs=[];function log(s){logs.push(s);var f=new File(root+'/native.log','write','TEXT');f.eof=0;f.writeline(logs.join('\\n'));f.close();}
function logerror(){log('ERROR '+arrayfromargs(arguments).join(' '));}
function bang(){log('START');task.schedule(1400);}
function next(){outlet(0,0);index++;if(index>=cases.length){c('panic');log('DONE');return;}
var t=cases[index];c('panic');c('mode',t.mode);c('x',64);c('y',48);c('z',40);c('speed',64);c('stretch',0);c('rate',0);c('depth',70);c('output',-12);c('armed',0);c('drone',t.midi||t.silence?0:1);
if(t.extreme){c('x',127);c('y',127);c('speed',127);c('rate',100);c('depth',100);}
log(t.name);outlet(0,'samptype','float32');outlet(0,'open',root+'/'+t.name+'.wav','wave');outlet(0,1);event.schedule(500);task.schedule(t.ms);}
function change(){var t=cases[index];if(t.midi){c('note',60,100);finishTask.schedule(1800);}if(t.corrupt){c('operation',2);for(var i=0;i<15;i++)c('corrupt');finishTask.schedule(1500);}if(t.freeze)c('trigger');}
function finish(){var t=cases[index];if(t.midi)c('note',60,0);if(t.corrupt)c('clean');}
function notifydeleted(){task.cancel();event.cancel();finishTask.cancel();}
'''.replace('ROOT',json.dumps(str(RUN)))
(DEST/'vermiform.qa.js').write_text(js)
print(DEST/'Vermiform QA.amxd')
