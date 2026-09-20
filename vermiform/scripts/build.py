"""Build editable sources into scripts/build/, then freeze them into a self-contained device/Vermiform.amxd."""
import datetime
import json
import shutil
import struct
from pathlib import Path

from tables import write as tables

ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'device';DEST.mkdir(exist_ok=True)
STAGE=ROOT/'scripts/build';STAGE.mkdir(parents=True,exist_ok=True)
V=dict(major=9,minor=0,revision=9,architecture='x64',modernui=1)
B=[];L=[];P={}
import sys;sys.path.insert(0,str(ROOT.parent/'theme'));import theme as T  # shared device theme
def box(id,cls,rect,**kw):B.append({'box':dict(id=id,maxclass=cls,patching_rect=rect,**kw)});return id
def obj(id,text,x,y,ni=1,no=1,**kw):return box(id,'newobj',[x,y,210,22],text=text,numinlets=ni,numoutlets=no,**kw)
def wire(a,b,o=0,i=0):L.append({'patchline':dict(source=[a,o],destination=[b,i])})
def parameter(key,label,lo,hi,val,rect=None,cls='live.dial',enum=None,**kw):
 i=len(P);attr=dict(parameter_longname=label,parameter_shortname=label,parameter_type=2 if enum else (1 if key=='mode' else 0),parameter_mmin=lo,parameter_mmax=hi,parameter_initial=[val],parameter_initial_enable=1,parameter_unitstyle=0)
 if enum:attr.update(parameter_enum=enum,parameter_unitstyle=9)
 if key=='output':attr['parameter_unitstyle']=4
 box(key,cls,[20+i%8*140,400+i//8*100,60,48],varname=key,parameter_enable=1,saved_attribute_attributes={'valueof':attr},numinlets=1,numoutlets=3 if cls in ('live.menu','live.tab') else 2,**(dict(presentation=1,presentation_rect=rect) if rect else {}),**kw)
 P[key]=[label,label,0];obj('p-'+key,'prepend '+key,20+i%8*140,450+i//8*100);wire(key,'p-'+key);wire('p-'+key,'control')
def dial(key,label,lo,hi,val,x,y,showname=True):parameter(key,label,lo,hi,val,[x,y,44,48] if showname else [x,y+11,44,37],**T.dial(showname=showname))
def button(key,label,rect):parameter(key,label,0,1,0,rect,cls='live.text',enum=['Off','On'],text=label,texton=label,mode=1,**T.button())
def action(key,label,rect):
 # mode=1 (toggle) rather than 0: Live's theme only draws the lit state for a toggle, so the control JS
 # unlights it ~120 ms after the press. The message box fires on 0 as well as 1, so repeated mashing
 # still sends every press even when a click lands inside the flash window.
 box(key,'live.text',[1200,len(B)*25,90,22],varname=key,presentation=1,presentation_rect=rect,text=label,texton=label,mode=1,parameter_enable=0,numinlets=1,numoutlets=2,outlettype=['',''],**T.button())
 box('m-'+key,'message',[1600,len(B)*25,90,22],text='action '+key);wire(key,'m-'+key);wire('m-'+key,'control')
def gen(code):
 bs=[{'box':dict(id='code',maxclass='codebox',code=code,numinlets=1,numoutlets=6,patching_rect=[20,70,850,650])}];ls=[]
 for i in range(6):bs.append({'box':dict(id=f'out{i}',maxclass='newobj',text=f'out {i+1}',patching_rect=[20+i*110,750,70,22])});ls.append({'patchline':dict(source=['code',i],destination=[f'out{i}',0])})
 return dict(fileversion=1,appversion=V,classnamespace='dsp.gen',rect=[0,0,900,820],boxes=bs,lines=ls)
D=tables(ROOT/'src');(ROOT/'src/vermiform.tables.json').write_text(json.dumps(D,indent=2)+'\n')
js='var TABLES='+json.dumps(D,separators=(',',':'))+';\n'+(ROOT/'src/vermiform.control.js').read_text()
(STAGE/'vermiform.control.js').write_text(js)
for n in ['vermiform.panel.js','vermiform.segments.wav']:shutil.copyfile(ROOT/'src'/n,STAGE/n)
T.write_jsui(STAGE,'vermiform',sep='.')
box('panel','jsui',[0,0,804,169],varname='panel',filename='vermiform.panel.js',presentation=1,presentation_rect=[0,0,804,169],numinlets=1,numoutlets=1,border=0,ignoreclick=1)
obj('control','js vermiform.control.js',20,850,no=2,varname='control');wire('control','panel',1)
# Fieldsets and readouts are drawn by vermiform.panel.js (FIELDSETS there matches this layout).
W=804
for key,items,rect in [('corepicker',['Speak & Worm','Intelliworm','Vermis','Saw','Digiwormer','Wormant','Compost'],[10,24,204,18]),('subpicker',[str(x['mode'])+'  '+x['name'] for x in D['modes'][:21]],[10,50,204,18])]:
 box(key,'umenu',[20,220 if key=='corepicker' else 250,230,22],varname=key,items=sum(([s,','] for s in items),[])[:-1],presentation=1,presentation_rect=rect,numinlets=1,numoutlets=3,**T.umenu())
 obj('p-'+key,'prepend '+('corePick' if key=='corepicker' else 'subPick'),300,220 if key=='corepicker' else 250);wire(key,'p-'+key);wire('p-'+key,'control')
parameter('mode','Mode',1,64,1)
# Speech and Worm share one shape: a column of switches with the momentary actions pinned to the bottom
# (Trigger / Stop, Corrupt / Restore at the same height), and a column of tiny dials whose names the panel draws
# (X / Y / Z names follow the mode). Keep in sync with SPEECH / WORM in vermiform.panel.js.
SPEECH_X,WORM_X,MEMORY_X=226,388,558
ACT1,ACT2=118,140
def tiny(key,label,lo,hi,val,x,row):
    parameter(key,label,lo,hi,val,[x,20+row*34+10,60,26],appearance=1,showname=0,shownumber=1)
L1,R1=SPEECH_X+8,SPEECH_X+8+64+12
for i,(k,label) in enumerate([('stretch','1/32'),('drone','Drone'),('armed','Arm')]):button(k,label,[L1,22+i*20,64,18])
button('trigger','Trigger',[L1,ACT1,64,18])
for row,(k,label,v) in enumerate([('speed','Speed',64),('x','X',64),('y','Y',48),('z','Z',0)]):tiny(k,label,0,127,v,R1,row)
# Momentary UI trigger, while retaining its Live parameter and first macro bank.
next(b['box'] for b in B if b['box']['id']=='trigger')['mode']=0
L[:]=[l for l in L if l['patchline']['source'][0]!='trigger']
box('trigger-msg','message',[1250,400,60,22],text='trigger');wire('trigger','trigger-msg');wire('trigger-msg','control')
action('panic','Stop',[L1,ACT2,64,18])
# Text for the TTS modes (7, 24, 30, 39, 40); Return commits it, Trigger replays it. Other modes ignore it.
box('textinput','textedit',[20,740,220,45],varname='textinput',presentation=1,presentation_rect=[10,82,204,22],text='the worm speaks',lines=1,keymode=1,outputmode=1,numinlets=1,numoutlets=4,**T.textedit())
wire('textinput','control')
# A hidden parameter-enabled pattr stores text and phoneme list in Live's device state.
obj('memory','pattr memory @parameter_enable 1 @initial '+json.dumps(json.dumps({'text':'the worm speaks','list':[46,51,16,4]})),20,950,no=3,varname='memory',saved_attribute_attributes={'valueof':dict(parameter_longname='Speech text and list',parameter_shortname='Speech text',parameter_type=3,parameter_invisible=1)})
obj('restore','prepend restore',250,950);wire('memory','restore');wire('restore','control')
# Worm: operation radio column over Corrupt / Restore; Rate and Depth as tiny dials.
L2,R2=WORM_X+8,WORM_X+8+84+12
parameter('operation','Worm operation',0,4,0,[L2,22,84,92],cls='live.tab',enum=['Jitter','Frame bleed','Bit rot','Loop lock','Order swap'],num_lines_presentation=5,num_lines_patching=5,mode=0,**T.tab())
tiny('rate','Rate',0,100,0,R2,0);tiny('depth','Depth',0,100,35,R2,1)
action('corrupt','Corrupt',[L2,ACT1,84,18]);action('clean','Restore',[L2,ACT2,84,18])
# Memory: scope and heads are panel readouts; output level and width sit under them.
MX=MEMORY_X+10
box('label-output','comment',[1500,400,80,18],text='Output',presentation=1,presentation_rect=[MX,102,68,16],numinlets=1,numoutlets=0,**T.label())
box('label-width','comment',[1500,430,80,18],text='Width',presentation=1,presentation_rect=[MX+74,102,60,16],numinlets=1,numoutlets=0,**T.label())
parameter('output','Output',-60,0,-12,[MX,118,68,18],cls='live.numbox',**T.numbox())
parameter('width','Width',0,100,35,[MX+74,118,60,18],cls='live.numbox',**T.numbox())
action('triggerReset','Reset',[MX+140,118,84,18])
# Use the same phrase-start action from the small reset button.
next(b['box'] for b in B if b['box']['id']=='m-triggerReset')['text']='action trigger'
G=gen((ROOT/'src/vermiform.genexpr').read_text());obj('dsp','gen~',300,850,no=6,patcher=G,varname='dsp',outlettype=['signal']*6);wire('control','dsp')
obj('segments','buffer~ #0-segments vermiform.segments.wav',20,1000,no=2)
obj('bind','loadmess segments #0-segments',300,1000);wire('bind','dsp')
obj('scopebuffer','buffer~ #0-scope @samps 2048',300,1040,no=2)
obj('scopebind','loadmess scopes #0-scope',300,1070);wire('scopebind','dsp')
obj('scopepanel','loadmess scope #0-scope',780,1070);wire('scopepanel','panel')
obj('audio','plugout~',300,1120,ni=2,no=2);wire('dsp','audio');wire('dsp','audio',1,1)
for i,key in enumerate(['writepos','readpos','meter','sample']):
 obj('snap-'+key,'snapshot~ '+('4' if key=='sample' else '40'),540+i*140,850);obj('view-'+key,'prepend '+key,540+i*140,890);wire('dsp','snap-'+key,i+2);wire('snap-'+key,'view-'+key);wire('view-'+key,'panel')
obj('notes','notein',20,1050,no=3);obj('note-pack','pack 0 0',20,1080,ni=2);obj('note-msg','prepend note',20,1110);wire('notes','note-pack',1,1);wire('notes','note-pack');wire('note-pack','note-msg');wire('note-msg','control')
obj('cc','ctlin',560,1000,no=3);obj('cc-pack','pack 0 0',560,1030,ni=2);obj('cc-msg','prepend cc',560,1060);wire('cc','cc-pack',1,1);wire('cc','cc-pack');wire('cc-pack','cc-msg');wire('cc-msg','control')
obj('bend','bendin @bendmode 2',780,1000);obj('bend-msg','prepend bend',780,1030);wire('bend','bend-msg');wire('bend-msg','control')
obj('init','live.thisdevice',20,1160,no=3);box('initmsg','message',[240,1160,70,22],text='init');wire('init','initmsg');wire('initmsg','control')
P['parameterbanks']={'0':dict(index=0,name='Vermiform',parameters=['mode','speed','x','y','z','rate','depth','trigger']),'1':dict(index=1,name='Performance',parameters=['drone','armed','stretch','operation','output','width','-','-'])};P['inherited_shortname']=1
patch=dict(fileversion=1,appversion=V,classnamespace='box',rect=[70,90,1120,800],openrect=[0,0,804,169],devicewidth=804,openinpresentation=1,bglocked=1,**T.patcher_attrs(),boxes=B[1:]+B[:1],lines=L,parameters=P,autosave=0,title='Vermiform',dependency_cache=[dict(name=n,type='WAVE' if n.endswith('wav') else 'TEXT',implicit=1) for n in ['vermiform.control.js','vermiform.panel.js','vermiform.theme.js','vermiform.segments.wav']])
raw=(json.dumps({'patcher':patch},indent=2)+'\n').encode();(STAGE/'Vermiform.maxpat').write_bytes(raw)
(STAGE/'vermiform.gendsp').write_text(json.dumps({'patcher':G},indent=2)+'\n')

# --- Freeze: embed the staged dependencies directly into a self-contained AMXD. ---
# Container layout validated against Ableton's own maxdevtools frozen-device test
# fixtures (github.com/Ableton/maxdevtools, maxdiff/freezing_utils.py) and real
# frozen output from another device in this workspace:
#   'ampf' LE32(4) devicecode | 'meta' LE32(4) LE32(7) | 'ptch' LE32(len) +
#   'mx@c' BE32(16) BE32(0) BE32(dirOffset) + [entry bytes back to back, main
#   entry first at offset 16] + 'dlst' BE32(len) + ['dire' entries: type/fnam/
#   sz32/of32/vers/flag/mdat, each a BE32-length-prefixed sub-chunk; fnam is
#   NUL-padded to a multiple of 4 bytes; mdat is HFS+ seconds since 1904; flag
#   is 17 for the main device entry and 0 for dependencies].
def _u32be(n):return struct.pack('>I',n&0xffffffff)
def _chunk(tag,data):return tag.encode('ascii')+_u32be(8+len(data))+data
def _padname(name):
 b=name.encode('ascii')+b'\0';pad=(-len(b))%4;return b+b'\0'*pad
def _mactime():return int(datetime.datetime.now(datetime.timezone.utc).timestamp())+2082844800
def freeze_amxd(main_name,main_data,dependencies,device_code='iiii'):
 now=_mactime();entries=[(main_name,'JSON',17,main_data)]+[(n,t,0,d) for n,t,d in dependencies]
 offset=16;blob=b'';directory=b''
 for name,typ,flag,data in entries:
  content=(_chunk('type',typ.encode('ascii'))+_chunk('fnam',_padname(name))+_chunk('sz32',_u32be(len(data)))+
           _chunk('of32',_u32be(offset))+_chunk('vers',_u32be(0))+_chunk('flag',_u32be(flag))+_chunk('mdat',_u32be(now)))
  directory+=_chunk('dire',content);blob+=data;offset+=len(data)
 container=b'mx@c'+_u32be(16)+_u32be(0)+_u32be(offset)+blob+_chunk('dlst',directory)
 return (b'ampf'+struct.pack('<I',4)+device_code.encode('ascii')+
         b'meta'+struct.pack('<I',4)+struct.pack('<I',7)+
         b'ptch'+struct.pack('<I',len(container))+container)
dependencies=[(n,'WAVE' if n.endswith('wav') else 'TEXT',(STAGE/n).read_bytes()) for n in ['vermiform.control.js','vermiform.panel.js','vermiform.theme.js','vermiform.segments.wav']]
(DEST/'Vermiform.amxd').write_bytes(freeze_amxd('Vermiform.amxd',raw+b'\0',dependencies))
print('Built',DEST/'Vermiform.amxd','(frozen,',len(dependencies),'dependencies embedded)')
