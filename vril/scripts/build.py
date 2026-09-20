#!/usr/bin/env python3
"""Build one frozen device; no staging files, caches or secondary artifacts.
Usage: python3 scripts/build.py
"""
import sys
sys.dont_write_bytecode = True
import json
import struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'src'))
sys.path.insert(0,str(ROOT.parent/'theme'))
from parameters import P
from engine import code
import theme as T  # shared device theme
V=dict(major=9,minor=0,revision=9,architecture='x64',modernui=1)

def genpatch(source):
    boxes=[{'box':dict(id='code',maxclass='codebox',code=source,numinlets=2,numoutlets=2,patching_rect=[90,80,1050,650])}]
    lines=[]
    for n in range(2):
        for kind,y in [('in',20),('out',770)]:
            ident=f'{kind}{n+1}'
            boxes.append({'box':dict(id=ident,maxclass='newobj',text=f'{kind} {n+1}',patching_rect=[20+n*120,y,55,22])})
            a,b=([ident,0],['code',n]) if kind=='in' else (['code',n],[ident,0])
            lines.append({'patchline':dict(source=a,destination=b)})
    return dict(fileversion=1,appversion=V,classnamespace='dsp.gen',rect=[0,0,1200,830],boxes=boxes,lines=lines)

def patch():
    boxes=[];lines=[];params={}
    def box(i,c,r,**kw):
        boxes.append({'box':dict(id=i,maxclass=c,patching_rect=r,**kw)});return i
    def obj(i,t,x=20,y=300,ni=1,no=1,**kw):
        return box(i,'newobj',[x,y,180,22],text=t,numinlets=ni,numoutlets=no,**kw)
    def wire(a,b,o=0,i=0):
        lines.append({'patchline':dict(source=[a,o],destination=[b,i])})
    def label(i,t,r,**kw):
        box(i,'comment',r,text=t,presentation=1,presentation_rect=r,**dict(T.label(),**kw))
    # Bold section headers and the hairline rules between sections are drawn by the background jsui:
    # a `panel` box cannot go below four pixels wide, which reads far heavier than Live's own separators.
    for n,p in enumerate(P):
        key=p['key'];kind=p['kind'];r=p['rect']
        attr=dict(parameter_longname=p['label'] if not key.startswith('mod_') else p['label']+' Mod',
            parameter_shortname=p['label'],parameter_type=2 if 'enum' in p else 0,
            parameter_mmin=p['lo'],parameter_mmax=p['hi'],parameter_initial=[p['default']],
            parameter_initial_enable=1,parameter_unitstyle=p['unit'],parameter_exponent=p.get('exp',1))
        if 'enum' in p:attr['parameter_enum']=p['enum']
        extra={}
        if kind=='live.dial':extra=dict(showname=1,shownumber=1,appearance=0)
        box(key,kind,[20+(n%8)*140,500+(n//8)*95,r[2],r[3]],varname=key,
            numinlets=1,numoutlets=3 if kind=='live.menu' else 2,parameter_enable=1,
            presentation=1,presentation_rect=r,saved_attribute_attributes={'valueof':attr},**extra)
        obj('pre_'+key,'prepend '+key,20+(n%8)*140,565+(n//8)*95)
        wire(key,'pre_'+key);wire('pre_'+key,'control');params[key]=[attr['parameter_longname'],p['label'],0]
    for key,text,r in [('inlabel','Gain',[988,116,118,15]),('ratelabel','Hz',[861,29,24,15]),
                       ('glidelabel','Glide',[607,116,58,15]),('vcalabel','VCA',[675,116,58,15])]:label(key,text,r)
    for key,text,r in [('randomize','Random',[222,133,71,18]),('panic','Panic',[300,133,71,18])]:
        box(key,'live.text',[1100,500,80,20],varname=key,presentation=1,presentation_rect=r,
            mode=0,text=text,texton=text,parameter_enable=0,numinlets=1,numoutlets=2)
        obj('b_'+key,'t b');wire(key,'b_'+key)
        box('m_'+key,'message',[1100,540,80,20],text=key,numinlets=2,numoutlets=1)
        wire('b_'+key,'m_'+key);wire('m_'+key,'control')
    obj('control','v8 vril.control.js',20,240,varname='control')
    obj('dsp','gen~',240,240,ni=2,no=2,varname='dsp',patcher=genpatch(code()),outlettype=['signal','signal'])
    wire('control','dsp')
    obj('audioin','plugin~',240,200,ni=2,no=2);obj('audioout','plugout~',240,280,ni=2,no=2)
    for n in range(2):wire('audioin','dsp',n,n);wire('dsp','audioout',n,n)
    # Live owns routing persistence. These dynamic menus are deliberately not
    # automation parameters, so changing track lists cannot alter parameter IDs.
    obj('routing','live.routing @port audio_inputs',650,300,no=5,varname='routing')
    for key,y,title in [('input_type',43,'Source'),('input_channel',88,'Channel')]:
        r=[988,y,118,18]
        label('label_'+key,title,[988,y-16,118,14])
        box(key,'live.menu',r,varname=key,numinlets=1,numoutlets=3,parameter_enable=1,
            presentation=1,presentation_rect=r,saved_attribute_attributes={'valueof':dict(
                parameter_longname='Audio '+title,parameter_shortname=title,parameter_type=2,parameter_invisible=1,
                parameter_enum=['None'],parameter_mmin=0,parameter_mmax=0)})
        params[key]=['Audio '+title,title,0]
        obj('pre_'+key,'prepend '+key);wire(key,'pre_'+key);wire('pre_'+key,'control')
    for n,name in enumerate(['type_index','channel_index','type_names','channel_names']):
        obj('route_'+name,'prepend '+name);wire('routing','route_'+name,n);wire('route_'+name,'control')
    obj('routeport','loadmess port audio_inputs');wire('routeport','routing')
    obj('midiin' ,'midiin',20,20);obj('parse','midiparse @hires 1',20,50,no=8);wire('midiin','parse')
    for key,outlet in [('midi',0),('cc',2),('bend',5)]:
        obj('m_'+key,'prepend '+key,20,90+outlet*20);wire('parse','m_'+key,outlet);wire('m_'+key,'control')
    obj('ready','live.thisdevice',450,200,no=3);obj('defer','deferlow',450,230);wire('ready','defer')
    box('init','message',[450,260,60,20],text='init',numinlets=2,numoutlets=1);wire('defer','init');wire('init','control');wire('defer','routeport')
    box('art','jsui',[0,0,1127,169],filename='vril-art.js',varname='art',presentation=1,
        presentation_rect=[0,0,1127,169],border=0,ignoreclick=1,background=1,numinlets=1,numoutlets=1)
    groups=[('Generator',['warp','span','morph','fuse','basis','field','seed','scan']),
            ('Processor',['mix','feed','form','time','cell','inputgain','output','algorithm']),
            ('Voice',['playmode','attack','release','glide','vca','modsource','rate','-']),
            ('Modulation',['mod_morph','mod_basis','mod_field','mod_time','mod_form','-','-','-'])]
    params['parameterbanks']={str(i):dict(index=i,name=name,parameters=keys) for i,(name,keys) in enumerate(groups)}
    params['inherited_shortname']=1
    return dict(patcher=dict(fileversion=1,appversion=V,classnamespace='box',rect=[40,80,1130,600],
        openrect=[0,0,1127,169],devicewidth=1127,openinpresentation=1,bglocked=1,
        **T.patcher_attrs(),boxes=boxes,lines=lines,parameters=params,
        autosave=0,dependency_cache=[dict(name=n,type='TEXT',implicit=1) for n in ['vril.control.js','vril-theme.js','vril-art.js']]))

def chunk(tag,data):return tag.encode()+struct.pack('>I',len(data)+8)+data

def freeze(entries):
    """Max collective directory inside an instrument AMXD, all data embedded."""
    blob=b'';directory=b'';offset=16
    for index,(name,kind,data) in enumerate(entries):
        nb=name.encode()+b'\0';nb+=b'\0'*((-len(nb))%4)
        fields=[('type',kind.encode()),('fnam',nb),('sz32',struct.pack('>I',len(data))),
                ('of32',struct.pack('>I',offset)),('vers',struct.pack('>I',0)),
                ('flag',struct.pack('>I',17 if index==0 else 0)),('mdat',struct.pack('>I',0))]
        directory+=chunk('dire',b''.join(chunk(k,v) for k,v in fields))
        blob+=data;offset+=len(data)
    collective=b'mx@c'+struct.pack('>III',16,0,offset)+blob+chunk('dlst',directory)
    return (b'ampf'+struct.pack('<I',4)+b'iiii'+b'meta'+struct.pack('<II',4,7)+
            b'ptch'+struct.pack('<I',len(collective))+collective)

# Section rectangles for the background jsui: [x, y, w, h, header]. thSections() draws the bold
# header and derives a one-pixel rule in each gap between neighbouring sections.
SECTIONS=[[5,0,196,169,'Generator'],[207,0,181,169,'Algorithm'],[393,0,196,169,'Processor'],
          [596,0,147,169,'Voice'],[749,0,217,169,'Modulation'],[974,0,147,169,'Input']]

def assets():
    raw=(json.dumps(patch(),separators=(',',':'))+'\n').encode()+b'\0'
    script=('var SCHEMA='+json.dumps(P,separators=(',',':'))+';\n'+(ROOT/'src/vril.control.js').read_text()).encode()
    art=T.art('vril',dict(width=1127,height=169,fieldsets=SECTIONS))
    return [('Vril.amxd','JSON',raw),('vril.control.js','TEXT',script),
            ('vril-theme.js','TEXT',T.prelude('vril').encode()),('vril-art.js','TEXT',art.encode())]

def main():
    dest=ROOT/'device';dest.mkdir(exist_ok=True)
    data=freeze(assets());(dest/'Vril.amxd').write_bytes(data)
    print(f'Built device/Vril.amxd: {len(data):,} bytes; 9 algorithms; {len(P)} native parameters; all assets embedded.')

if __name__=='__main__':main()
