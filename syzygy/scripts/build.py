"""Build Syzygy 2 instrument and audio effect from shared source, freezing every dependency into each AMXD."""
from pathlib import Path
import copy
import json
import shutil
import struct
import patcher as p
from patcher import T

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'device'
STAGE=ROOT/'scripts/build'


def gen(codefile, outputs):
    code=(ROOT/'src'/codefile).read_text()
    boxes=[{'box':dict(id='code',maxclass='codebox',code=code,numinlets=2,numoutlets=outputs,patching_rect=[40,90,750,650])}]
    lines=[]
    for i in range(2):
        boxes.append({'box':dict(id=f'in{i}',maxclass='newobj',text=f'in {i+1}',numinlets=0,numoutlets=1,patching_rect=[40+i*100,30,60,22])})
        lines.append({'patchline':dict(source=[f'in{i}',0],destination=['code',i])})
    for i in range(outputs):
        boxes.append({'box':dict(id=f'out{i}',maxclass='newobj',text=f'out {i+1}',numinlets=1,numoutlets=0,patching_rect=[40+i*85,780,60,22])})
        lines.append({'patchline':dict(source=['code',i],destination=[f'out{i}',0])})
    return dict(fileversion=1,appversion=p.VERSION,classnamespace='dsp.gen',rect=[40,40,900,840],boxes=boxes,lines=lines)


def build():
    p.BOXES.clear();p.LINES.clear();p.PARAMETERS.clear()
    p.box('panel','jsui',[0,0,936,169],varname='panel',presentation=1,presentation_rect=[0,0,936,169],filename='syzygy2.panel.js',numinlets=1,numoutlets=1,parameter_enable=0,border=0)
    p.obj('control','js syzygy2.control.js #0-memory #0-export',30,1050,no=3,varname='control')
    p.wire('panel','control');p.wire('control','panel',1)
    # Fieldsets are drawn by the panel jsui; see FIELDSETS in src/syzygy2.panel.js.
    body_x=lambda i:8+i*72
    for i,(key,label,v,hint) in enumerate([
        ('wood','Wood',.8,'Level of the woody, quickly damped resonator.'),
        ('glass','Glass',.65,'Level of the clear, long-ringing glass resonator.'),
        ('metal','Metal',.45,'Level of the metallic body with close, beating modes.')]):
        x=body_x(i)
        p.dial(key,label,0,1,v,x+10,18,hint=hint)
        p.action(['woodstrike','glassstrike','metalstrike'][i],'Strike',[x+2,80,60,18])
        p.action(['woodscene','glassscene','metalscene'][i],'Solo',[x+2,102,60,18])
    p.action('strike','Strike All',[10,128,134,18])
    p.action('trioscene','Trio',[154,128,62,18])
    # Resonance / Relationships / Evolution: tiny dials stacked four high, one column per section.
    columns=[(236,[
      ('decay','Decay',0,1,.5,5,'Ringing time of all three bodies; their relative decay character stays distinct.'),
      ('brightness','Bright',0,1,.5,5,'Upper partial strength and external-input brightness.'),
      ('space','Space',0,1,.35,5,'Late stereo reflections. Direct sound remains present.'),
      ('root','Root',27.5,880,110,3,'Fundamental in Hz; MIDI notes retune and strike all bodies.')]),
     (314,[
      ('alignment','Align',0,1,.8,5,'Move the three fundamentals toward octave and fifth relationships.'),
      ('coupling','Couple',0,1,.22,5,'Energy exchanged between bodies. At zero each rings independently.'),
      ('instability','Instab.',0,1,.12,5,'Bounded detuning, beating, and stronger nonlinear exchange.')]),
     (392,[
      ('motion','Motion',0,1,.35,5,'Speed and depth of drift and spatial motion.'),
      ('cycle','Cycle',3,90,18,1,'Length of each autonomous gather/bloom/fracture/settle phrase, in seconds.'),
      ('bloom','Bloom',0,1,.45,5,'Phrase swelling and the strength of its brief fracture.'),
      ('variation','Vary %',0,1,.15,5,'Maximum variation amount. Vary preserves root, level, input gain, and performance switches.')])]
    for x,rows in columns:
        for i,(key,label,lo,hi,v,unit,hint) in enumerate(rows):p.tiny(key,label,lo,hi,v,x,20+i*34,unit=unit,hint=hint)
    for i,(key,text) in enumerate([('active','Run'),('bow','Bow'),('evolve','Evolve'),('hold','Hold')]):
        p.button(key,text,[472,24+i*24,64,18],toggle=True)
    OX=750
    p.label('label-output','Output',[OX,18,84,16]);p.label('label-width','Width',[OX+90,18,84,16])
    p.parameter('output','Output',-60,0,-12,[OX,34,84,18],kind='live.numbox',unit=4,**T.numbox())
    p.parameter('width','Width',0,100,80,[OX+90,34,84,18],kind='live.numbox',unit=5,**T.numbox())
    p.action('vary','Vary',[OX,60,84,18]);p.action('undo','Undo',[OX+90,60,84,18])
    p.action('capture','Capture 30 s',[OX,84,174,18]);p.action('panic','Panic',[OX,108,174,18])
    for key in ['azimuth','elevation']:p.parameter(key,key.title(),0,1,.5,kind='live.numbox',unit=1)
    p.parameter('inputgain','Audio Input',0,100,60,kind='live.numbox',unit=5)
    main=gen('syzygy2.genexpr',8)
    recorder=gen('syzygy2.capture.genexpr',2)
    p.obj('dsp','gen~',310,1050,ni=2,no=8,varname='dsp',patcher=main,outlettype=['signal']*8)
    p.obj('audio','plugout~',310,1290,ni=2,no=2)
    p.wire('control','dsp')
    p.wire('dsp','audio');p.wire('dsp','audio',1,1)
    p.obj('memory','buffer~ #0-memory 30000 2',30,1380,no=2,varname='memory')
    p.obj('export','buffer~ #0-export 30000 2',30,1420,no=2,varname='export')
    p.obj('recorder','gen~',310,1380,ni=2,no=2,varname='recorder',patcher=recorder)
    p.wire('dsp','recorder');p.wire('dsp','recorder',1,1);p.wire('control','recorder',2)
    p.obj('bind','loadmess memory #0-memory',310,1420);p.wire('bind','recorder')
    def sample(src,out,key,to,x,y):
        p.obj('snap-'+key,'snapshot~ 30',x,y)
        p.obj('view-'+key,'prepend '+key,x,y+30)
        p.wire(src,'snap-'+key,out);p.wire('snap-'+key,'view-'+key);p.wire('view-'+key,to)
    for i,key in enumerate(['meterA','meterB','meterC','phrase','positionx','positiony']):sample('dsp',i+2,key,'panel',480+i*125,1130)
    sample('recorder',0,'recordpos','control',500,1390)
    sample('recorder',1,'recorded','control',680,1390)
    p.obj('load','loadbang',30,1500)
    p.obj('liveinit','live.thisdevice',200,1500,no=3)
    p.box('init','message',[390,1500,50,22],numinlets=2,numoutlets=1,text='init')
    p.wire('load','init');p.wire('liveinit','init');p.wire('init','control')
    p.obj('notes','notein',30,1550,no=3)
    p.obj('note-pack','pack 0 0',200,1550,ni=2)
    p.obj('note-msg','prepend note',390,1550)
    p.wire('notes','note-pack',1,1);p.wire('notes','note-pack');p.wire('note-pack','note-msg');p.wire('note-msg','control')
    banks=[('Bodies',['wood','glass','metal','decay','brightness','space','root','output']),
           ('Relationships',['alignment','coupling','instability','motion','cycle','bloom','variation','width']),
           ('Performance',['active','bow','evolve','hold','azimuth','elevation','inputgain','-'])]
    p.PARAMETERS['parameterbanks']={str(i):dict(index=i,name=n,parameters=k) for i,(n,k) in enumerate(banks)}
    p.PARAMETERS['inherited_shortname']=1
    patch=dict(fileversion=1,appversion=p.VERSION,classnamespace='box',rect=[80,100,1070,740],openrect=[0,0,936,169],devicewidth=936,openinpresentation=1,bglocked=1,**T.patcher_attrs(),boxes=p.BOXES[1:]+p.BOXES[:1],lines=p.LINES,parameters=p.PARAMETERS,autosave=0,title='Syzygy',latency=0,dependency_cache=[dict(name=n,type='TEXT',implicit=1) for n in ['syzygy2.panel.js','syzygy2.theme.js','syzygy2.control.js']])
    DEST.mkdir(exist_ok=True);(DEST/'captures').mkdir(exist_ok=True);(DEST/'captures/.keep').touch()
    STAGE.mkdir(parents=True,exist_ok=True)
    for name in ['syzygy2.panel.js','syzygy2.control.js']:shutil.copyfile(ROOT/'src'/name,STAGE/name)
    T.write_jsui(STAGE,'syzygy2',sep='.')
    # --- Freeze: embed every dependency directly into each AMXD's collective footer, ---
    # the same 'mx@c'/'dlst'/'dire' container Live writes when you freeze by hand
    # (validated against Ableton's own maxdevtools frozen-device test fixtures).
    FROZEN_DEPS=[('syzygy2.panel.js','TEXT'),('syzygy2.theme.js','TEXT'),('syzygy2.control.js','TEXT')]
    def _u32be(n):return struct.pack('>I',n&0xffffffff)
    def _chunk(tag,data):return tag.encode('ascii')+_u32be(8+len(data))+data
    def _padname(name):
     b=name.encode('ascii')+b'\0';pad=(-len(b))%4;return b+b'\0'*pad
    def _mactime(path):return int(path.stat().st_mtime)+2082844800
    def freeze_amxd(main_name,main_data,dependencies,device_code):
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
    def write(name,patch,kind):
        raw=(json.dumps({'patcher':patch},indent=2)+'\n').encode()
        (STAGE/(name+'.maxpat')).write_bytes(raw)
        (DEST/(name+'.amxd')).write_bytes(freeze_amxd(name+'.amxd',raw+b'\0',FROZEN_DEPS,kind))
    write('Syzygy',patch,b'iiii')
    effect=copy.deepcopy(patch);effect['title']='Syzygy Audio'
    effect['boxes'].append({'box':dict(id='input',maxclass='newobj',text='plugin~',numinlets=0,numoutlets=2,patching_rect=[310,990,90,22])})
    for i in range(2):effect['lines'].append({'patchline':dict(source=['input',i],destination=['dsp',i])})
    write('Syzygy Audio',effect,b'aaaa')
    (STAGE/'syzygy2.gendsp').write_text(json.dumps({'patcher':main},indent=2)+'\n')
    print(f'Built Syzygy.amxd and Syzygy Audio.amxd (frozen, {len(FROZEN_DEPS)} dependencies embedded each)')

if __name__=='__main__':build()
