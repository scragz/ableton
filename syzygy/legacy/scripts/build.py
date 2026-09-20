"""Build the editable Max patch and an unfrozen native M4L instrument."""
from pathlib import Path
import json
import shutil
import struct

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'device'
VERSION = dict(major=9, minor=0, revision=0, architecture='x64', modernui=1)
INK = [0.90, 0.91, 0.88, 1]
GOLD = [0.85, 0.72, 0.43, 1]
TEAL = [0.40, 0.78, 0.71, 1]
BG = [0.071, 0.086, 0.09, 1]
BOXES, LINES, PARAMETERS = [], [], {}


def box(name, kind, rect, **attrs):
    b = dict(id=name, maxclass=kind, patching_rect=rect, **attrs)
    BOXES.append({'box': b})
    return name


def obj(name, text, x, y, ni=1, no=1, **attrs):
    return box(name, 'newobj', [x, y, 150, 22], text=text,
               numinlets=ni, numoutlets=no, **attrs)


def wire(src, dst, outlet=0, inlet=0):
    LINES.append({'patchline': dict(source=[src, outlet], destination=[dst, inlet])})


def parameter(key, label, lo, hi, initial, rect=None, kind='live.dial', unit=5, enum=None, **attrs):
    i = len(PARAMETERS)
    value = dict(parameter_longname=label, parameter_shortname=label,
                 parameter_type=2 if enum else 0, parameter_mmin=lo,
                 parameter_mmax=hi, parameter_initial=[initial],
                 parameter_initial_enable=1, parameter_unitstyle=unit)
    if enum:
        value['parameter_enum'] = enum
    present = dict(presentation=1, presentation_rect=rect) if rect else {}
    box(key, kind, [30 + (i % 6) * 165, 250 + (i // 6) * 110, 54, 50],
        varname=key, parameter_enable=1,
        saved_attribute_attributes={'valueof': value},
        numinlets=1, numoutlets=3 if kind=='live.menu' else 2,
        **present, **attrs)
    PARAMETERS[key] = [label, label, 0]
    obj('send-'+key, 'prepend '+key, 30+(i%6)*165, 305+(i//6)*110)
    wire(key, 'send-'+key)
    wire('send-'+key, 'control')


def dial(key, label, lo, hi, initial, x, y, unit=5, hint='', **attrs):
    if unit == 5:
        lo, hi, initial = lo*100, hi*100, initial*100
    parameter(key, label, lo, hi, initial, [x,y,52,51], unit=unit,
              appearance=0, activefgdialcolor=GOLD, activeneedlecolor=INK,
              textcolor=INK, textcolor2=[0.59,0.65,0.64,1],
              activedialcolor=[0.21,0.25,0.25,1], fontsize=9,
              annotation=hint, **attrs)


def button(key, text, rect, toggle=False, initial=0, color=TEAL):
    parameter(key, key.title(), 0, 1, initial, rect, kind='live.text', unit=9,
              enum=['Off','On'], mode=1 if toggle else 0,
              text=text, texton=text, fontsize=9, rounded=3,
              bgcolor=[0.16,0.20,0.20,1], bgoncolor=color,
              textcolor=INK, textoncolor=BG)
    if not toggle:
        # Keep Live's parameter-backed widget enabled, but don't expose actions
        # for automation or emit an action during parameter initialization.
        b = next(b['box'] for b in BOXES if b['box']['id']==key)
        b['active'] = 1
        b['saved_attribute_attributes']['valueof']['parameter_invisible'] = 1
        b['saved_attribute_attributes']['valueof']['parameter_initial_enable'] = 0
        LINES[:] = [l for l in LINES if l['patchline']['source'][0] != key]
        box('msg-'+key, 'message', [1210,300+len(BOXES)*2,65,22], text=key)
        # live.text in button mode emits bang, not the toggle's integer 1.
        wire(key, 'msg-'+key)
        wire('msg-'+key, 'control')


def build():
    DEST.mkdir(exist_ok=True)
    box('panel', 'jsui', [0,0,1000,169], presentation=1,
        presentation_rect=[0,0,1000,169], filename='syzygy.panel.js',
        numinlets=1, numoutlets=1, parameter_enable=0, border=0)
    obj('control', 'js syzygy.control.js', 30, 900, no=2, varname='control')
    wire('control','panel',1)
    wire('panel','control')
    button('active','RUN',[15,130,48,18],toggle=True)
    button('strike','STRIKE',[69,130,50,18])
    dial('excite','Excite',0,1,.32,143,31,hint='Continuous energy injected into the network. Zero removes the continuous exciter.')
    dial('tone','Tone',25,1600,110,202,31,unit=3,hint='Exciter frequency and resonator fundamental. Incoming MIDI notes retune this control.')
    dial('ratio','Ratio',.125,8,1.618,143,91,unit=1,hint='FM modulator-to-carrier frequency ratio.')
    dial('fm','FM',0,12,1.8,202,91,unit=1,hint='FM depth. The network also phase-modulates the exciter when Coupling is raised.')
    parameter('source','Source',0,2,2,[178,151,77,16],kind='live.menu',unit=9,
              enum=['DUST','FM','HYBRID'], fontsize=8, textcolor=INK,
              bgcolor=BG, activebgcolor=BG, tricolor=GOLD)
    dial('feedback','Feedback',0,1,.72,269,31,hint='Regeneration. Higher settings pass from decays into sustained nonlinear states.')
    dial('size','Size',0,1,.38,328,31,hint='Delay reservoir lengths, from short resonances to diffuse echoes.')
    dial('diffusion','Diffuse',0,1,.7,269,91,hint='Blend a circulating ring with a four-way scattering junction.')
    dial('damping','Damping',0,1,.55,328,91,hint='High-frequency loss inside the feedback network.')
    dial('body','Body',0,1,.35,591,31,hint='Blend in two detuned metallic resonators.')
    dial('decay','Decay',0,1,.65,650,31,hint='Resonator sustain time.')
    dial('drive','Drive',0,1,.3,591,91,hint='Nonlinearity and internal energy regulation strength.')
    dial('space','Space',0,1,.5,650,91,hint='Late allpass diffusion in the stereo field.')
    dial('coupling','Coupling',0,1,.25,719,31,hint='Cross-module influence and stochastic offset depth. At zero, offsets have no effect.')
    dial('drift','Drift',0,1,.3,778,31,hint='Slow delay-time fluctuations and exciter drift.')
    dial('rate','Rate',.01,1,.12,719,91,unit=3,hint='Wander speed. The two axes independently randomize their rates at each cycle.')
    dial('width','Width',0,1,.75,778,91,hint='Stereo width. Zero sums the spatial output to mono.')
    dial('output','Level',-60,0,-18,867,31,unit=4,hint='Final output level in dB. Independent of feedback regulation.')
    button('wander','WANDER',[929,32,57,19],toggle=True,initial=1)
    button('reseed','RESEED',[929,59,57,19],color=GOLD)
    button('panic','PANIC / CLEAR',[871,123,115,22],color=[0.9,0.42,0.32,1])
    # Small native axis controls make MIDI mapping and automation available.
    for key,label,rect in [('azimuth','X',[871,94,52,17]),('elevation','Y',[930,94,52,17])]:
        parameter(key,label,0,1,.5,rect,kind='live.numbox',unit=1,
                  fontsize=9, textcolor=INK, bgcolor=BG, annotation='Spatial '+label+' axis. Drag the field or automate this value.')
    for i in range(6):
        parameter('m'+str(i),'Matrix '+str(i+1),-1,1,0,kind='live.numbox',unit=0)
        value = BOXES[-2]['box']['saved_attribute_attributes']['valueof']
        value['parameter_invisible'] = 1
    code = (ROOT/'src/syzygy.genexpr').read_text()
    genboxes = [{'box': dict(id='code', maxclass='codebox', numinlets=0, numoutlets=5,
                            patching_rect=[40,40,760,650], code=code)}]
    genlines = []
    for i in range(5):
        genboxes.append({'box':dict(id='out'+str(i+1),maxclass='newobj',text='out '+str(i+1),
                                   numinlets=1,numoutlets=0,patching_rect=[40+i*145,720,60,22])})
        genlines.append({'patchline':dict(source=['code',i],destination=['out'+str(i+1),0])})
    genpatch = dict(fileversion=1,appversion=VERSION,classnamespace='dsp.gen',
                    rect=[100,100,860,800],boxes=genboxes,lines=genlines)
    obj('dsp','gen~',320,900,no=5,patcher=genpatch,outlettype=['signal']*5)
    obj('audio','plugout~',320,1100,ni=2,no=2)
    wire('control','dsp')
    wire('dsp','audio',0,0)
    wire('dsp','audio',1,1)
    for i,key in enumerate(['meter','positionx','positiony']):
        obj('snap-'+key,'snapshot~ 50',520+i*165,970)
        obj('view-'+key,'prepend '+key,520+i*165,1010)
        wire('dsp','snap-'+key,i+2)
        wire('snap-'+key,'view-'+key)
        wire('view-'+key,'panel')
    obj('liveinit','live.thisdevice',30,1100,no=3)
    obj('load','loadbang',30,1140)
    box('init','message',[190,1100,45,22],text='init')
    wire('liveinit','init'); wire('load','init'); wire('init','control')
    obj('notes','notein',30,1200,no=3)
    obj('note-pack','pack 0 0',200,1200,ni=2)
    obj('note-msg','prepend note',370,1200)
    wire('notes','note-pack',1,1); wire('notes','note-pack',0,0)
    wire('note-pack','note-msg'); wire('note-msg','control')
    banks = [(['excite','tone','ratio','fm','feedback','size','diffusion','damping'],'Excite / Network'),
             (['body','decay','drive','space','coupling','drift','rate','width'],'Matter / Evolve'),
             (['azimuth','elevation','wander','output','source','active','-','-'],'Space / Output')]
    PARAMETERS['parameterbanks']={str(i):dict(index=i,name=name,parameters=keys) for i,(keys,name) in enumerate(banks)}
    PARAMETERS['inherited_shortname']=1
    patch = dict(fileversion=1,appversion=VERSION,classnamespace='box',
                 rect=[80,100,1020,740],openrect=[0,0,1000,169],devicewidth=1000,
                 openinpresentation=1,bglocked=1,bgcolor=BG,editing_bgcolor=[.16,.17,.18,1],
                 default_fontsize=11,default_fontname='Arial',boxes=BOXES[1:]+BOXES[:1],lines=LINES,
                 parameters=PARAMETERS,autosave=0,title='Syzygy',latency=0,
                 dependency_cache=[dict(name='syzygy.panel.js',type='TEXT',implicit=1),
                                   dict(name='syzygy.control.js',type='TEXT',implicit=1)])
    doc = {'patcher':patch}
    encoded = (json.dumps(doc,indent=2)+'\n').encode()
    (DEST/'Syzygy.maxpat').write_bytes(encoded)
    payload = encoded+b'\0'
    (DEST/'Syzygy.amxd').write_bytes(b'ampf'+struct.pack('<I',4)+b'iiii'+b'meta'+struct.pack('<II',4,0)+b'ptch'+struct.pack('<I',len(payload))+payload)
    for name in ['syzygy.panel.js','syzygy.control.js']:
        shutil.copyfile(ROOT/'src'/name,DEST/name)
    (DEST/'syzygy.gendsp').write_text(json.dumps({'patcher':genpatch},indent=2)+'\n')
    print(f'Built {DEST / "Syzygy.amxd"} ({len(payload):,} bytes)')


if __name__=='__main__':
    build()
