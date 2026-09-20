"""Build editable patch, then freeze all dependencies directly into the AMXD."""
import json
import shutil
import struct
from pathlib import Path

from dsp import build
from schema import TABS, P

ROOT=Path(__file__).resolve().parents[1]
STAGE=ROOT/'scripts/build';STAGE.mkdir(parents=True,exist_ok=True)
DEST=ROOT/'device';DEST.mkdir(exist_ok=True)
V=dict(major=9,minor=0,revision=9,architecture='x64',modernui=1)
B=[];L=[];PARAM={}
def box(i,c,r,**k):B.append({'box':dict(id=i,maxclass=c,patching_rect=r,**k)});return i
def obj(i,t,x=20,y=300,ni=1,no=1,**k):return box(i,'newobj',[x,y,240,22],text=t,numinlets=ni,numoutlets=no,**k)
def wire(a,b,o=0,i=0):L.append({'patchline':dict(source=[a,o],destination=[b,i])})
def msg(i,t,y=300):return box(i,'message',[1000,y,220,22],text=t,numinlets=2,numoutlets=1)
def gen(code):
 b=[{'box':dict(id='code',maxclass='codebox',code=code,numinlets=3,numoutlets=6,patching_rect=[100,80,1100,720])}];l=[]
 for i in range(3):b.append({'box':dict(id=f'in{i}',maxclass='newobj',text=f'in {i+1}',patching_rect=[20+100*i,20,50,22])});l.append({'patchline':dict(source=[f'in{i}',0],destination=['code',i])})
 for i in range(6):b.append({'box':dict(id=f'out{i}',maxclass='newobj',text=f'out {i+1}',patching_rect=[20+100*i,840,50,22])});l.append({'patchline':dict(source=['code',i],destination=[f'out{i}',0])})
 return dict(fileversion=1,appversion=V,classnamespace='dsp.gen',rect=[0,0,1240,900],boxes=b,lines=l)
code=build();(ROOT/'src/materia.genexpr').write_text(code)
obj('control','v8 materia.control.js',20,230,no=2,varname='control')
box('panel','jsui',[0,0,1360,169],filename='materia.panel.js',varname='panel',numinlets=1,numoutlets=1,presentation=1,presentation_rect=[0,0,1360,169],border=0)
wire('panel','control');wire('control','panel',1)
counts={}
for i,p in enumerate(P):
 k=p['key'];t=p['tab'];n=counts.get(t,0);counts[t]=n+1
 # Nine columns, two rows. Each parameter gets a full label and native Live widget.
 r=[294+(n%9)*97,71+(n//9)*45,89,18]
 # Output column: source menu and gain side by side for each DAC, labels above both.
 if k in ['da_src','db_src']:r=[1190,22 if k=='da_src' else 66,104,18]
 if k in ['da_gain','db_gain']:r=[1300,22 if k=='da_gain' else 66,48,18]
 if t=='MTX':r=[294+n*112,71,103,18]
 p['rect']=r;vis=t=='ADC1' or k in ['da_src','db_src','da_gain','db_gain']
 label=p['label'].replace(t+' ','').replace('Berlin ','').replace('Poczdam ','').replace('Jena ','').replace('Matrix ','')
 if k in ['da_src','db_src']:label=t
 attr=dict(parameter_longname=p['label'],parameter_shortname=p['label'],parameter_type=2 if p['enum'] else 0,parameter_mmin=p['lo'],parameter_mmax=p['hi'],parameter_initial=[p['default']],parameter_initial_enable=1,parameter_unitstyle=9 if p['enum'] else 0)
 if p['enum']:attr['parameter_enum']=p['enum']
 cls='live.menu' if p['enum'] else 'live.numbox'
 toggle=p['enum']==['Off','On']
 if toggle:cls='live.text'
 args=dict(text=label,texton=label,mode=1) if toggle else {}
 box(k,cls,[20+(i%9)*135,1000+(i//9)*78,89,18],varname=k,numinlets=1,numoutlets=3 if cls=='live.menu' else 2,parameter_enable=1,presentation=1,presentation_rect=r,hidden=not vis,saved_attribute_attributes={'valueof':attr},**args)
 box('label_'+k,'comment',[20+(i%9)*135,978+(i//9)*78,100,18],text=label,varname='label_'+k,presentation=1,presentation_rect=[r[0],r[1]-16,r[2],14],hidden=not vis or toggle,fontsize=9)
 obj('p_'+k,'prepend '+k,20+(i%9)*135,1025+(i//9)*78);wire(k,'p_'+k);wire('p_'+k,'control');PARAM[k]=[p['label'],p['label'],0]
G=gen(code);obj('dsp','gen~',300,230,ni=3,no=6,varname='dsp',patcher=G,outlettype=['signal']*6);wire('control','dsp')
obj('input','plugin~',300,190,ni=2,no=2);obj('output','plugout~',300,270,ni=2,no=2)
wire('input','dsp');wire('input','dsp',1,1);wire('dsp','output');wire('dsp','output',1,1)
obj('clockphase','phasor~ 16n @lock 1',600,190,ni=2,varname='clockphase');wire('clockphase','dsp',0,2)
obj('plugsync','plugsync~',600,230,no=9);obj('playmsg','prepend transport',600,270);wire('plugsync','playmsg');wire('playmsg','control')
for name,size in [('state',320),('exchange',4096),('jena',169984),('matrix',8),('meters',64)]:obj('buffer_'+name,f'buffer~ ---materia_{name} @samps {size}',20,350+len(B),no=2)
# Resolve unique buffer names explicitly for Gen and JS: no reliance on --- substitution.
for name in ['state','exchange','tables','matrix','meters']:
 buf='jena' if name=='tables' else name;obj('bind_'+name,f'loadmess {name} ---materia_{buf}',300,350+len(B));wire('bind_'+name,'dsp')
obj('bind_control','loadmess bind ---materia_state ---materia_exchange ---materia_jena ---materia_matrix ---materia_meters',20,650);obj('bind_defer','deferlow',300,650);wire('bind_control','bind_defer');wire('bind_defer','control')
obj('vs','adstatus sigvs',600,650);obj('vs_load','loadbang',600,620);obj('vs_pre','prepend vector_size',600,680);wire('vs_load','vs');wire('vs','vs_pre');wire('vs_pre','dsp')
obj('live','live.thisdevice',20,700,no=3);msg('initmsg','init',700);wire('live','initmsg');wire('initmsg','control')
obj('memory','pattr materia_state @bindto control',20,740,no=3,varname='memory',saved_object_attributes={'parameter_enable':1},saved_attribute_attributes={'valueof':dict(parameter_longname='Materia Machine State',parameter_shortname='Machine State',parameter_type=3,parameter_invisible=1,parameter_linknames=1)})
for n in range(1,5):obj(f'remote{n}','live.remote~ @normalized 1 @smoothing 0',300+(n-1)*240,740,ni=1,no=0,varname=f'remote{n}');wire('dsp',f'remote{n}',n+1)
for i,kind,r in [('matrixgrid','matrix',[830,53,288,104]),('tableedit','table',[910,60,260,80])]:
 box(i,'jsui',[1500,500,260,90],filename='materia.editor.js',jsarguments=[kind],varname=i,numinlets=1,numoutlets=1,presentation=1,presentation_rect=r,hidden=1,border=0);wire(i,'control')
def action(key,label,r,command,clear=False):
 r=[r[0]+80]+r[1:]
 box(key,'live.text',[1500,800+len(B),90,20],varname=key,numinlets=1,numoutlets=2,parameter_enable=0,presentation=1,presentation_rect=r,hidden=1,text=label,texton=label,mode=0)
 obj('sel_'+key,'t b',1500,900+len(B));wire(key,'sel_'+key)
 if clear:
  obj('dialog_'+key,'dialog "Clear registered state? This cannot be undone." "Clear" "Cancel"',1600,900+len(B),no=2);wire('sel_'+key,'dialog_'+key);msg('cmd_'+key,command,900+len(B));wire('dialog_'+key,'cmd_'+key)
 else:msg('cmd_'+key,command,900+len(B));wire('sel_'+key,'cmd_'+key)
 wire('cmd_'+key,'control')
for n in [1,2]:
 action('store'+str(n),'Store S'+str(n),[215+(n-1)*180,117,80,19],'store '+str(n));action('recall'+str(n),'Recall S'+str(n),[300+(n-1)*180,117,80,19],'recall '+str(n));action('clearros'+str(n),'Clear pipe',[820,117,100,19],'clearconfirmed '+str(n),True)
action('clearall','Clear all',[610,117,90,19],'clearconfirmed all',True)
for n in range(1,5):
 action('map'+str(n),'Map',[215,117,90,19],'map '+str(n));action('unmap'+str(n),'Unmap',[310,117,90,19],'unmap '+str(n))
action('importbutton','Import table',[715,117,100,19],'noop')
L[:]=[l for l in L if l['patchline']['source'][0]!='cmd_importbutton']
obj('importdialog','opendialog',1500,1600);obj('importpre','prepend importtable',1500,1640);wire('cmd_importbutton','importdialog');next(b['box'] for b in B if b['box']['id']=='cmd_importbutton')['text']='bang';wire('importdialog','importpre');wire('importpre','control')
# A full-size embedded routing window shares the original native Live parameters.
routes=[]
for tab in TABS:
 for p in P:
  if p['tab']!=tab or not p['enum'] or len(p['enum'])!=22:continue
  key=p['key'];clock=key.endswith('_clk') or key=='ber_sync'
  port=('CLOCK' if key.endswith('_clk') else 'SYNC' if key=='ber_sync' else 'STEP' if key in ['e1_src','e2_src'] else 'DIRECTION' if key in ['e1_gate','e2_gate'] else 'RESET' if key.endswith('_reset') else 'GATE' if key.endswith('_gate') else 'SELECT' if key=='p_bus' else 'A' if key=='p_a' else 'B' if key=='p_b' else 'IN')
  routes.append(dict(key=key,label=p['label'],tab=tab,default=p['default'],clock=clock,port=port))
route_patch=dict(fileversion=1,appversion=V,classnamespace='box',rect=[100,100,1260,780],openrect=[100,100,1260,780],openinpresentation=1,bglocked=1,toolbarvisible=0,title='Materia — Patch Matrix',enablehscroll=0,enablevscroll=0,boxes=[
 {'box':dict(id='routein',maxclass='newobj',text='inlet',patching_rect=[10,820,40,22])},
 {'box':dict(id='routeview',varname='routeview',maxclass='jsui',filename='materia.routing.js',patching_rect=[0,0,1260,780],presentation=1,presentation_rect=[0,0,1260,780],numinlets=1,numoutlets=1,border=0)},
 {'box':dict(id='routeout',maxclass='newobj',text='outlet',patching_rect=[100,820,40,22])},
 {'box':dict(id='window',maxclass='newobj',text='thispatcher',patching_rect=[200,820,80,22])}],lines=[
 {'patchline':dict(source=['routein',0],destination=['routeview',0])},
 {'patchline':dict(source=['routeview',0],destination=['routeout',0])}])
obj('routing','p routing',20,800,no=1,varname='routing',patcher=route_patch)
wire('control','routing',1);wire('routing','control')
action('routingbutton','Patch Matrix',[1110,142,158,18],'openrouting')
next(b['box'] for b in B if b['box']['id']=='routingbutton')['hidden']=0

# Automation parameter banks grouped by module.
PARAM['parameterbanks']={str(i):dict(index=i,name=t,parameters=([p['key'] for p in P if p['tab']==t]+['-']*8)[:8]) for i,t in enumerate(TABS)};PARAM['inherited_shortname']=1
patch=dict(fileversion=1,appversion=V,classnamespace='box',rect=[60,80,1380,850],openrect=[0,0,1360,169],devicewidth=1360,openinpresentation=1,bglocked=1,boxes=[b for b in B if b['box']['id']!='panel']+[b for b in B if b['box']['id']=='panel'],lines=L,parameters=PARAM,autosave=0,title='Materia',dependency_cache=[dict(name=n,type='TEXT',implicit=1) for n in ['materia.control.js','materia.panel.js','materia.editor.js','materia.routing.js']])
raw=(json.dumps({'patcher':patch},indent=2)+'\n').encode();(STAGE/'Materia.maxpat').write_bytes(raw)
(STAGE/'materia.gendsp').write_text(json.dumps({'patcher':G},indent=2)+'\n')
schema='var SCHEMA='+json.dumps(P,separators=(',',':'))+';\n'
(STAGE/'materia.control.js').write_text(schema+(ROOT/'src/materia.lib.js').read_text()+'\n'+(ROOT/'src/materia.control.js').read_text())
(STAGE/'materia.panel.js').write_text(schema+(ROOT/'src/materia.panel.js').read_text());shutil.copyfile(ROOT/'src/materia.editor.js',STAGE/'materia.editor.js')
(STAGE/'materia.routing.js').write_text('var ROUTES='+json.dumps(routes,separators=(',',':'))+';\n'+(ROOT/'src/materia.routing.js').read_text())
(STAGE/'routes.json').write_text(json.dumps(routes,indent=2))
(STAGE/'schema.json').write_text(json.dumps(P,indent=2))

# --- Freeze: embed every dependency directly into the AMXD's collective footer, ---
# the same 'mx@c'/'dlst'/'dire' container Live writes when you freeze by hand
# (validated against Ableton's own maxdevtools frozen-device test fixtures).
def _u32be(n):return struct.pack('>I',n&0xffffffff)
def _chunk(tag,data):return tag.encode('ascii')+_u32be(8+len(data))+data
def _padname(name):
 b=name.encode('ascii')+b'\0';pad=(-len(b))%4;return b+b'\0'*pad
def _mactime(path):return int(path.stat().st_mtime)+2082844800
def freeze_amxd(main_name,main_data,dependencies,device_code=b'aaaa'):
 stamps=[_mactime(STAGE/n) for n,_ in dependencies]+[int(Path(__file__).resolve().stat().st_mtime)+2082844800]
 entries=[(main_name,'JSON',17,main_data,max(stamps))]+[(n,t,0,(STAGE/n).read_bytes(),_mactime(STAGE/n)) for n,t in dependencies]
 offset=16;blob=b'';directory=b''
 for name,typ,flag,data,mdat in entries:
  content=(_chunk('type',typ.encode('ascii'))+_chunk('fnam',_padname(name))+_chunk('sz32',_u32be(len(data)))+
           _chunk('of32',_u32be(offset))+_chunk('vers',_u32be(0))+_chunk('flag',_u32be(flag))+_chunk('mdat',_u32be(mdat)))
  directory+=_chunk('dire',content);blob+=data;offset+=len(data)
 container=b'mx@c'+_u32be(16)+_u32be(0)+_u32be(offset)+blob+_chunk('dlst',directory)
 return (b'ampf'+struct.pack('<I',4)+device_code+
         b'meta'+struct.pack('<I',4)+struct.pack('<I',7)+
         b'ptch'+struct.pack('<I',len(container))+container)
DEPENDENCIES=[('materia.control.js','TEXT'),('materia.panel.js','TEXT'),('materia.editor.js','TEXT'),('materia.routing.js','TEXT')]
(DEST/'Materia.amxd').write_bytes(freeze_amxd('Materia.amxd',raw+b'\0',DEPENDENCIES))
print(f'Built {DEST}/Materia.amxd (frozen, {len(DEPENDENCIES)} dependencies embedded): {len(P)} parameters, {len(code.splitlines())} GenExpr lines')
