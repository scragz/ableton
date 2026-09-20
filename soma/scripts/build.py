#!/usr/bin/env python3
"""Build the editable Max patches, then freeze all dependencies directly into the AMXD."""
import json
import sys
import struct
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'scripts/build'
OUT.mkdir(parents=True,exist_ok=True)
DEST=ROOT/'device'
DEST.mkdir(exist_ok=True)
PARAMS={}
def param(name,label,lo,hi,default,kind='float',items=None,unit=None,exp=1):
    PARAMS[name]=dict(label=label,lo=lo,hi=hi,default=default,kind=kind,items=items,unit=unit,exp=exp)
for side,letter in [('l','L'),('c','C'),('r','R')]:
    if side!='c':
        # Outer oscillators run free (Hi) or follow the center at a Mult/Div ratio. The center always runs free.
        param('type_'+side,letter+' Type',0,1,1,'enum',['Hi','Ratio'])
        param('mult_'+side,letter+' Multiply',1,32,1,'int')
        param('div_'+side,letter+' Divide',1,32,1,'int')
    param('tune_'+side,letter+' Tune',-48,48,0,'int',unit='st')
    param('fine_'+side,letter+' Fine',-100,100,0,unit='ct')
    # In Ratio mode an outer oscillator's Exp setting turns FM into phase modulation.
    param('fm_mode_'+side,letter+' FM Mode',0,1,0,'enum',['Lin','Exp'] if side=='c' else ['Lin','Exp/PM'])
    param('fm_'+side,letter+' FM',0,1,0)
    param('level_'+side,letter+' Mix',0,1,1 if side=='c' else 0)
    if side!='c':
        param('pm_'+side,letter+' Phase',0,1,0)
        param('ratio_target_'+side,letter+' Ratio Target',0,1,1,'enum',['Divide','Multiply'])
        param('ratio_depth_'+side,letter+' Ratio Steps',-16,16,0,'int')
param('pm_c1','C Phase 1',0,1,0)
param('pm_c2','C Phase 2',0,1,0)
param('transpose','Transpose',-24,24,0,'int',unit='st')
# Modulation sources name what they are; each input defaults to the module's normalled connection,
# and the center FM input, which has none on the module, defaults to Off.
SOURCES=['Off','L Sine','C Sine','C Cos','R Sine','LFO','Gate Env']
for name,default in dict(fm_l=2,fm_c=0,fm_r=3,pm_l=4,pm_r=1,pm_c1=1,pm_c2=4).items():
    param('src_'+name,name.upper().replace('_',' ')+' Source',0,len(SOURCES)-1,default,'enum',SOURCES)
# Low-pass gate after the Natural Gate: notes hit it, Open raised fully turns it into a drone.
param('lpg_decay','Gate Decay',60,8000,900,unit='ms',exp=2)
param('lpg_open','Gate Open',0,1,0)
param('lpg_ctrl','Gate Ctrl',-1,1,0)
param('lpg_material','Gate Material',0,2,0,'enum',['Hard','Balanced','Soft'])
# 0 keeps FM and center phase-mod depth fixed; 1 scales them by the gate envelope on every hit.
param('index_env','Gate Mod Depth',0,1,0)
param('glide_ms','Glide',0,2000,0,unit='ms',exp=3)
param('bend_range','Bend Range',0,24,2,'int',unit='st')
# The Mix knobs blend the oscillators; the Output menu picks the waveform all three use.
param('output_mode','Waveform',0,3,0,'enum',['Sine / Cos','Saw / Cosaw','Triangle','Square'])
param('width','Width',0,1,1)
param('output_db','Output Gain',-60,0,-18,unit='dB')
param('filter_mode','Mod Filter',0,1,0,'enum',['3 kHz','6 kHz'])
param('phase_direction','Phase Direction',0,1,0,'enum',['Opposing','Same'])
param('square_dry','Square PM',0,1,0,'enum',['Modulated','Dry'])
param('sync_outer','Outer Sync',0,1,0,'enum',['Off','Center'])
param('lfo_hz','LFO Rate',0.01,30,0.2,unit='Hz',exp=3)
param('ratio_source','Ratio Mod',0,2,0,'enum',['Off','LFO','Gate Env'])
DEFAULTS={k:v['default'] for k,v in PARAMS.items()}
PATCHES=[{},
 dict(pm_c1=.18,pm_c2=.12,mult_l=2,mult_r=3,lpg_decay=1600,index_env=.65),
 dict(pm_c1=.13,pm_c2=.08,type_l=0,tune_l=-12,mult_r=2,output_mode=1,lpg_open=.8,lpg_material=2,lpg_decay=3000),
 dict(level_c=0,level_l=1,level_r=1,mult_l=5,mult_r=7,fm_l=.26,fm_r=.26,lpg_decay=2400,index_env=.65,transpose=-12),
 dict(pm_l=.14,pm_r=.18,pm_c1=.28,pm_c2=.19,mult_l=3,div_l=2,mult_r=5,div_r=3,lpg_decay=500,lpg_ctrl=-.12,index_env=.8),
 dict(level_l=.8,level_r=.8,mult_l=5,div_l=4,mult_r=3,div_r=2,lpg_decay=4000,lpg_material=2,lpg_open=.15),
 dict(pm_c1=.32,pm_c2=.2,ratio_source=1,ratio_depth_l=3,ratio_depth_r=5,lfo_hz=.35,lpg_open=1)]
PRESET_NAMES=['Init','Glass Orbits','Slow Rotation','Stereo FM','Crossfold','Ratio Chord','Ratio Steps']
APP={'major':9,'minor':0,'revision':0,'architecture':'x64','modernui':1}
def patcher(width=1100,height=650,**extra):
    return {**dict(fileversion=1,appversion=APP,rect=[60,90,width,height],bglocked=0,openinpresentation=0,default_fontsize=11,default_fontname='Arial',boxes=[],lines=[]),**extra}
def box(p,id,cls='newobj',text=None,rect=None,**attrs):
    x=dict(id=id,maxclass=cls,patching_rect=rect or [20,250+len(p['boxes'])*27,180,22],**attrs)
    if text is not None:x['text']=text
    p['boxes'].append({'box':x});return id
def line(p,a,b,ao=0,bi=0):p['lines'].append({'patchline':{'source':[a,ao],'destination':[b,bi]}})
# Max draws boxes front-to-back, so background art must come last or it covers the controls.
def write(name,p):
    p['boxes'].sort(key=lambda b:b['box'].get('background')==1)
    (OUT/name).write_text(json.dumps({'patcher':p},indent=2)+'\n')
code=(ROOT/'src/engine.genexpr').read_text().replace('// __PARAMETERS__','\n'.join(f'Param {k}({v["default"]}, min={v["lo"]}, max={v["hi"]});' for k,v in PARAMS.items()))
g=patcher(900,700,classnamespace='dsp.gen')
# Port counts match what Max itself saves for a codebox and out objects.
box(g,'code','codebox',rect=[20,20,850,550],code=code,numinlets=1,numoutlets=6,outlettype=['']*6,fontface=0)
for i in range(6):
    box(g,f'out{i+1}',text=f'out {i+1}',rect=[20+120*i,600,80,22],numinlets=1,numoutlets=0);line(g,'code',f'out{i+1}',i)
write('soma.gendsp',g)
DEBUG=False  # True adds file-logging probes (debug.log) to the voice and device patches
voice=patcher(700,480)
box(voice,'in',text='in 1',rect=[30,30,55,22])
box(voice,'engine',text='gen~',rect=[30,90,110,22],patcher=g,numinlets=1,numoutlets=6,outlettype=['signal']*6,varname='engine')
line(voice,'in','engine')
for i in range(6):
    box(voice,f'out{i+1}',text=f'out~ {i+1}',rect=[30+100*i,180,65,22]);line(voice,'engine',f'out{i+1}',i)
if DEBUG:
    # Probe inside poly~: did the voice load, do messages arrive, is gen~ producing signal?
    box(voice,'dbg_js',text='js soma-debug.js',rect=[30,300,150,22],numinlets=1,numoutlets=0)
    box(voice,'dbg_load',text='loadbang',rect=[250,30,60,22]);box(voice,'dbg_loaded','message',text='voice_loaded',rect=[250,60,90,22])
    line(voice,'dbg_load','dbg_loaded');line(voice,'dbg_loaded','dbg_js')
    box(voice,'dbg_in',text='prepend voice_in',rect=[400,30,110,22]);line(voice,'in','dbg_in');line(voice,'dbg_in','dbg_js')
    for i,(outlet,tag) in enumerate([(0,'voice_out1'),(4,'voice_baseC')]):
        snap=box(voice,'dbg_snap_'+tag,text='snapshot~ 500',rect=[30+i*200,230,90,22]);line(voice,'engine',snap,outlet)
        box(voice,'dbg_pre_'+tag,text='prepend '+tag,rect=[30+i*200,260,120,22]);line(voice,snap,'dbg_pre_'+tag);line(voice,'dbg_pre_'+tag,'dbg_js')
write('soma-voice.maxpat',voice)
js=(ROOT/'src/midi.js').read_text().replace('// __PRESETS__','var defaults = '+json.dumps(DEFAULTS)+';\nvar patches = '+json.dumps(PATCHES)+';')
(OUT/'soma-midi.js').write_text(js)
(ROOT/'tests/parameters.json').write_text(json.dumps(PARAMS,indent=2)+'\n')

# Device face: stock Live controls on the shared theme. Ordinary Live controls keep every sound parameter
# automatable; a background jsui draws the surface and fieldsets, and a small jsui shows the gate.
sys.path.insert(0,str(ROOT.parent/'theme'))
import theme as T
W,H=1156,169
p=patcher(W,760,openrect=[0,0,W,H],devicewidth=W,description='Stereo phase and frequency modulation instrument with a low-pass gate',tags='instrument oscillator FM PM stereo LPG')
p.update(T.patcher_attrs())
p['openinpresentation']=1
p['parameters']={}
LAYOUT=dict(width=W,height=H,sections=[],fieldsets=[])
def label(q,id,text,x,y,w,justify=1):
    return box(q,id,'comment',text,[x,y,w,14],presentation=1,presentation_rect=[x,y,w,14],numinlets=1,numoutlets=0,**T.label(justify=justify))
def ui(q,name,rect,style=None,short=None,hidden=False):
    a=PARAMS[name]; x,y,w,h=rect; short=short or a['label']
    style=style or ('menu' if a['kind']=='enum' else 'dial')
    attributes=dict(parameter_longname=a['label'],parameter_shortname=short,parameter_type=2 if a['kind']=='enum' else (1 if a['kind']=='int' else 0),parameter_mmin=a['lo'],parameter_mmax=a['hi'],parameter_initial=[a['default']],parameter_initial_enable=1)
    # Live unit styles: 0 Int, 1 Float, 2 Time, 3 Hertz, 4 dB, 7 Semitones, 9 Custom.
    # Int style quantizes, so unitless floats must use Float or 0-1 dials snap to 0/1.
    if a['kind']=='enum': attributes['parameter_enum']=a['items']
    elif a['unit']=='ct':attributes.update(parameter_unitstyle=9,parameter_units='%.1f ct')
    elif a['unit']:attributes['parameter_unitstyle']={'ms':2,'Hz':3,'dB':4,'st':7}[a['unit']]
    else:attributes['parameter_unitstyle']=0 if a['kind']=='int' else 1
    if a['exp']!=1: attributes['parameter_exponent']=a['exp']
    attrs=dict(varname=name,parameter_enable=1,presentation=1,presentation_rect=[x,y,w,h],saved_attribute_attributes={'valueof':attributes},numinlets=1)
    if hidden: attrs['hidden']=1
    if style=='dial':
        cls='live.dial'; attrs.update(numoutlets=2,outlettype=['','float'],**T.dial(showname=True))
    elif style=='tab':
        # Stacked tabs read like the module's toggle switches.
        cls='live.tab'; attrs.update(numoutlets=3,outlettype=['','','float'],num_lines_presentation=len(a['items']),num_lines_patching=len(a['items']),mode=0,**T.tab())
    elif style=='slider':
        cls='live.slider'; attrs.update(numoutlets=2,outlettype=['','float'],orientation=0,showname=0,shownumber=1,**T.slider())
    else:
        cls='live.menu'; attrs.update(numoutlets=3,outlettype=['','','float'],items=a['items'],annotation=a['label'],**T.menu())
    box(q,name,cls,rect=[x,y,w,h],**attrs)
    pre='pre_'+name;box(q,pre,text='prepend '+name);line(q,name,pre);line(q,pre,'controls')
    q['parameters'][name]=[a['label'],short,0]
    return name
box(p,'controls',text='s #0-controls',rect=[800,500,100,22])

# Five fieldsets: Left | Center | Right oscillators, Gate, Output. Each oscillator shares one four-column grid:
#   top:    Type | Coarse/Mult | Fine/Div | Mix              (center: Coarse | Fine | Mix | Transpose)
#   bottom: [FM: mode over source | index] [Phase: source | index]   (center phase: index 1 | index 2)
# Outer oscillators: [Type over Mult/Div] [FM fieldset over Phase fieldset] [Mix fader].
# Center: [FM over Phase] [Mix fader]. Its Coarse / Fine / Transpose stay at their defaults (not on the panel).
TOP=22                    # first control under a section header
FS_W,FS_H=124,64          # fieldset: 8 px padding, controls 10 px below the frame top
FM_Y,PM_Y=TOP,TOP+FS_H+8
BOTTOM=PM_Y+FS_H          # every column ends where the Phase fieldset ends
GAP=8
OUTER_W,CENTER_W=280,180
def knob(x,y,name,short,hidden=False):
    ui(p,name,[x,y,44,48],'dial',short,hidden=hidden)
def fader(x,name,short):
    label(p,'lbl_'+name,short,x-6,TOP,44)
    ui(p,name,[x,TOP+16,32,BOTTOM-TOP-16],'slider',short)
def modulation(side,fx):
    LAYOUT['fieldsets'].append([fx,FM_Y,FS_W,FS_H,'FM'])
    LAYOUT['fieldsets'].append([fx,PM_Y,FS_W,FS_H,'Phase'])
    ui(p,'fm_mode_'+side,[fx+GAP,FM_Y+10,56,28],'tab','FM Mode')
    ui(p,'src_fm_'+side,[fx+GAP,FM_Y+42,56,18],'menu')
    knob(fx+FS_W-GAP-44,FM_Y+10,'fm_'+side,'Index')
    if side=='c':
        knob(fx+GAP+4,PM_Y+10,'pm_c1','Index 1');knob(fx+FS_W-GAP-4-44,PM_Y+10,'pm_c2','Index 2')
    else:
        ui(p,'src_pm_'+side,[fx+GAP,PM_Y+25,56,18],'menu')
        knob(fx+FS_W-GAP-44,PM_Y+10,'pm_'+side,'Index')
def outer(side,x0,title):
    LAYOUT['sections'].append([x0,0,OUTER_W,H-1,title])
    ratio=PARAMS['type_'+side]['default']==1
    label(p,'lbl_type_'+side,'Type',x0+GAP,TOP,96)
    ui(p,'type_'+side,[x0+GAP+22,TOP+16,52,30],'tab','Type')
    kx=[x0+GAP,x0+GAP+48]
    # Coarse/Mult and Fine/Div share a position; the Type switch decides which knob shows.
    knob(kx[0],PM_Y+10,'tune_'+side,'Coarse',hidden=ratio);knob(kx[1],PM_Y+10,'fine_'+side,'Fine',hidden=ratio)
    knob(kx[0],PM_Y+10,'mult_'+side,'Mult',hidden=not ratio);knob(kx[1],PM_Y+10,'div_'+side,'Div',hidden=not ratio)
    modulation(side,x0+108)
    fader(x0+108+FS_W+14,'level_'+side,'Mix')
def center(x0,title):
    LAYOUT['sections'].append([x0,0,CENTER_W,H-1,title])
    modulation('c',x0+GAP)
    fader(x0+GAP+FS_W+14,'level_c','Mix')
X=1
outer('l',X,'Left');X+=OUTER_W+2
center(X,'Center');X+=CENTER_W+2
outer('r',X,'Right');X+=OUTER_W+2

# Low-pass gate: Open and Decay faders with the openness indicator beside them, Material over Ctrl at right.
GATE_X,GATE_W=X,140
LAYOUT['sections'].append([GATE_X,0,GATE_W,H-1,'Gate'])
label(p,'lbl_open','Open',GATE_X+3,TOP,34)
ui(p,'lpg_open',[GATE_X+4,TOP+16,32,BOTTOM-TOP-16],'slider','Open')
label(p,'lbl_decay','Decay',GATE_X+36,TOP,34)
ui(p,'lpg_decay',[GATE_X+37,TOP+16,32,BOTTOM-TOP-16],'slider','Decay')
box(p,'glow','jsui',rect=[GATE_X+72,TOP+20,8,BOTTOM-TOP-36],presentation=1,presentation_rect=[GATE_X+72,TOP+20,8,BOTTOM-TOP-36],filename='soma-glow.js',border=0,ignoreclick=1,numinlets=1,numoutlets=1,outlettype=[''],parameter_enable=0)
label(p,'lbl_material','Material',GATE_X+83,TOP,56)
ui(p,'lpg_material',[GATE_X+85,TOP+16,52,42],'tab','Material')
ui(p,'lpg_ctrl',[GATE_X+89,PM_Y+10,44,48],'dial','Ctrl')
X+=GATE_W+2

# Output: preset and waveform menus over a 2x2 of global dials.
OUT_X,OUT_W=X,138
W=OUT_X+OUT_W+1
LAYOUT['width']=W
LAYOUT['sections'].append([OUT_X,0,OUT_W,H-1,'Output'])
box(p,'preset','umenu',rect=[OUT_X+GAP,TOP,OUT_W-2*GAP,18],items=sum(([v,','] for v in PRESET_NAMES[:-1]),[])+[PRESET_NAMES[-1]],presentation=1,presentation_rect=[OUT_X+GAP,TOP,OUT_W-2*GAP,18],
    parameter_enable=0,**T.umenu())
box(p,'pre_preset',text='prepend preset');line(p,'preset','pre_preset');line(p,'pre_preset','midi')
ui(p,'output_mode',[OUT_X+GAP,TOP+22,OUT_W-2*GAP,18],'menu','Waveform')
for j,(n,short) in enumerate([('index_env','Gate Mod'),('glide_ms','Glide'),('width','Width'),('output_db','Volume')]):
    ui(p,n,[OUT_X+(OUT_W-96)//2+(j%2)*52,TOP+46+(j//2)*50,44,48],'dial',short)
p['openrect']=[0,0,W,H];p['devicewidth']=W;p['rect']=[60,90,W,760]
box(p,'art','jsui',rect=[0,0,W,H],presentation=1,presentation_rect=[0,0,W,H],filename='soma-art.js',border=0,ignoreclick=1,background=1,numinlets=1,numoutlets=1,outlettype=[''],parameter_enable=0)
T.write_jsui(OUT,'soma')
(OUT/'soma-art.js').write_text((ROOT/'src/panel.js').read_text().replace('/*__LAYOUT__*/null',json.dumps(LAYOUT,separators=(',',':'))))
(OUT/'soma-glow.js').write_text((ROOT/'src/glow.js').read_text())
(OUT/'soma-ui.js').write_text((ROOT/'src/ui.js').read_text())

# Runtime wiring. No load-time preset: Live-restored parameters are authoritative.
box(p,'midiin',text='midiin',rect=[20,250,55,22]);box(p,'midi',text='js soma-midi.js',rect=[20,300,150,22],varname='midi')
line(p,'midiin','midi');line(p,'midi','controls')
box(p,'receive',text='r #0-controls',rect=[220,250,100,22])
box(p,'synth',text='poly~ soma-voice 1 up 4 @resampling 1',rect=[220,300,295,22],numinlets=1,numoutlets=6,outlettype=['signal']*6,varname='synth')
line(p,'receive','synth');box(p,'output',text='plugout~',rect=[220,420,80,22]);line(p,'synth','output');line(p,'synth','output',1,1)
# Panel behavior (Coarse/Mult and Fine/Div swaps) listens to the same controls bus.
box(p,'ui',text='js soma-ui.js',rect=[340,250,130,22],numinlets=1,numoutlets=0);line(p,'receive','ui')
# The engine's gate level drives the openness indicator at about 30 fps.
box(p,'snap_gate',text='snapshot~ 33',rect=[560,380,90,22]);line(p,'synth','snap_gate',2);line(p,'snap_gate','glow')
box(p,'liveinit',text='live.thisdevice',rect=[600,250,100,22]);box(p,'defer',text='deferlow');box(p,'initialize','message',text='initialize');line(p,'liveinit','defer');line(p,'defer','initialize');line(p,'initialize','midi')
box(p,'load',text='loadbang');line(p,'load','defer')
if DEBUG:
    # Console output is unreliable to read remotely, so diagnostics also go to files in the project root.
    LOG=ROOT/'debug.log'; LOG.write_text(''); (ROOT/'debug-load.txt').unlink(missing_ok=True)
    (OUT/'soma-debug.js').write_text(f'''autowatch = 1; inlets = 1; outlets = 0;
var LOG = "{LOG}";
function log(s) {{ var f = new File(LOG, "readwrite"); if (!f.isopen) {{ post("soma-debug: cannot open log\\n"); return; }} f.position = f.eof; f.writeline(new Date().getTime() + " " + s); f.close(); }}
function loadbang() {{ log("debug js loaded"); }}
function msg_int(v) {{ log("int " + v); }}
function msg_float(v) {{ log("float " + v); }}
function list() {{ log("list " + arrayfromargs(arguments).join(" ")); }}
function anything() {{ log(arrayfromargs(messagename, arguments).join(" ")); }}
''')
    box(p,'dbg_js',text='js soma-debug.js',rect=[340,340,150,22],numinlets=1,numoutlets=0)
    line(p,'receive','dbg_js')
    box(p,'dbg_midi',text='prepend midi',rect=[90,250,90,22]);line(p,'midiin','dbg_midi');line(p,'dbg_midi','dbg_js')
    for i,(outlet,tag) in enumerate([(0,'out1'),(2,'gate_level'),(4,'baseC')]):
        snap=box(p,'dbg_snap_'+tag,text='snapshot~ 500',rect=[560+i*110,480,90,22]);line(p,'synth',snap,outlet)
        box(p,'dbg_pre_'+tag,text='prepend '+tag,rect=[560+i*110,510,90,22]);line(p,snap,'dbg_pre_'+tag);line(p,'dbg_pre_'+tag,'dbg_js')
    # JS-free proof of load: a text object writes a file on loadbang (right outlet fires first).
    box(p,'dbg_load',text='loadbang',rect=[900,250,60,22]);box(p,'dbg_trig',text='t b b',rect=[900,280,40,22]);line(p,'dbg_load','dbg_trig')
    box(p,'dbg_loaded','message',text='loaded',rect=[950,310,50,22]);line(p,'dbg_trig','dbg_loaded',1)
    box(p,'dbg_write','message',text=f'write {ROOT/"debug-load.txt"}',rect=[900,340,250,22]);line(p,'dbg_trig','dbg_write',0)
    box(p,'dbg_text',text='text',rect=[900,370,40,22]);line(p,'dbg_loaded','dbg_text');line(p,'dbg_write','dbg_text')
DEPENDENCIES=[('soma-midi.js','TEXT'),('soma-ui.js','TEXT'),('soma-theme.js','TEXT'),('soma-art.js','TEXT'),('soma-glow.js','TEXT'),('soma-voice.maxpat','JSON')]+([('soma-debug.js','TEXT')] if DEBUG else [])
p['dependency_cache']=[{'name':n,'type':t,'implicit':1} for n,t in DEPENDENCIES]
# Small banks for hands-on Push control.
p['parameters']['parameterbanks']={
 '0':{'index':0,'name':'Timbre','parameters':['pm_c1','pm_c2','pm_l','pm_r','fm_l','fm_r','fm_c','index_env']},
 '1':{'index':1,'name':'Pitch','parameters':['mult_l','div_l','mult_r','div_r','tune_l','tune_r','glide_ms','width']},
 '2':{'index':2,'name':'Gate & Mix','parameters':['lpg_decay','lpg_open','lpg_ctrl','lpg_material','level_l','level_c','level_r','output_db']}}
write('Soma.maxpat',p)

# --- Freeze: embed every dependency directly into the AMXD's collective footer, ---
# the same 'mx@c'/'dlst'/'dire' container Live writes when you freeze by hand
# (validated against Ableton's own maxdevtools frozen-device test fixtures).
def _u32be(n):return struct.pack('>I',n&0xffffffff)
def _chunk(tag,data):return tag.encode('ascii')+_u32be(8+len(data))+data
def _padname(name):
 b=name.encode('ascii')+b'\0';pad=(-len(b))%4;return b+b'\0'*pad
def _mactime(path):return int(path.stat().st_mtime)+2082844800
def freeze_amxd(main_name,main_data,dependencies,device_code=b'iiii'):
 stamps=[_mactime(OUT/n) for n,_ in dependencies]+[int(Path(__file__).resolve().stat().st_mtime)+2082844800]
 entries=[(main_name,'JSON',17,main_data,max(stamps))]+[(n,t,0,(OUT/n).read_bytes(),_mactime(OUT/n)) for n,t in dependencies]
 offset=16;blob=b'';directory=b''
 for name,typ,flag,data,mdat in entries:
  content=(_chunk('type',typ.encode('ascii'))+_chunk('fnam',_padname(name))+_chunk('sz32',_u32be(len(data)))+
           _chunk('of32',_u32be(offset))+_chunk('vers',_u32be(0))+_chunk('flag',_u32be(flag))+_chunk('mdat',_u32be(mdat)))
  directory+=_chunk('dire',content);blob+=data;offset+=len(data)
 container=b'mx@c'+_u32be(16)+_u32be(0)+_u32be(offset)+blob+_chunk('dlst',directory)
 return (b'ampf'+struct.pack('<I',4)+device_code+
         b'meta'+struct.pack('<I',4)+struct.pack('<I',7)+
         b'ptch'+struct.pack('<I',len(container))+container)
main_raw=(json.dumps({'patcher':p},indent=2)+'\n').encode()+b'\0'
(DEST/'Soma.amxd').write_bytes(freeze_amxd('Soma.amxd',main_raw,DEPENDENCIES))
(ROOT/'tests/presets.json').write_text(json.dumps(PATCHES,indent=2)+'\n')
print(f'Built device/Soma.amxd (frozen, {len(DEPENDENCIES)} dependencies embedded), {len(p["parameters"])-1} automatable controls ({len(PARAMS)} engine parameters), {len(PATCHES)} patches')
