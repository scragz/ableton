#!/usr/bin/env python3
"""Build an optional temporary Live audio monitor for the selected Vril test track."""
import sys
sys.dont_write_bytecode=True
import json,tempfile
from pathlib import Path
from build import freeze,V
root=Path(tempfile.mkdtemp(prefix='vril-live-'))
script=r'''
inlets=1;outlets=1;var timer=new Task(inspect,this);var track,device;
function log(s){var f=new File(ROOT+'/live.log','write','TEXT');f.position=f.eof;f.writeline(s);f.close();}
function bang(){timer.schedule(1500);}
function inspect(){
 try {
  track=new LiveAPI(null,'live_set view selected_track');
  device=new LiveAPI(null,'live_set view selected_track devices 0');
  log('DEVICE '+device.get('name'));log('TRACK '+track.id);
  log('INFO '+device.info);
  var inputs=device.get('audio_inputs');log('INPUTS '+JSON.stringify(inputs));
  for(var i=1;i<inputs.length;i+=2){var input=new LiveAPI(null,'id '+inputs[i]);log('INPUT '+input.info);log('TYPES '+input.get('available_routing_types'));log('CHANNELS '+input.get('available_routing_channels'));}
  var ps=device.get('parameters');for(var j=1;j<ps.length;j+=2){var p=new LiveAPI(null,'id '+ps[j]);log('PARAM '+p.get('name')+' '+p.get('value'));}
 }catch(e){log('ERROR '+e);}
}
function setparam(name,value){var ps=device.get('parameters');for(var j=1;j<ps.length;j+=2){var p=new LiveAPI(null,'id '+ps[j]);if(String(p.get('name'))===name){p.set('value',value);log('SET '+name+' '+p.get('value'));return;}}}
function meter(){log('METERS '+track.get('output_meter_left')+' '+track.get('output_meter_right'));}
function routes(){var input=new LiveAPI(null,'live_set view selected_track devices 0 audio_inputs 0');log('TYPES '+input.get('available_routing_types'));log('CHANNELS '+input.get('available_routing_channels'));}
function logerror(){log('ERROR '+arrayfromargs(arguments).join(' '));}
function notifydeleted(){timer.cancel();}
'''
boxes=[];lines=[]
def obj(i,t,no=1,ni=1):boxes.append({'box':dict(id=i,maxclass='newobj',text=t,numinlets=ni,numoutlets=no,patching_rect=[20,30+len(boxes)*35,300,22])})
def wire(a,b,o=0,i=0):lines.append({'patchline':dict(source=[a,o],destination=[b,i])})
obj('in','plugin~',2,2);obj('out','plugout~',2,2)
wire('in','out');wire('in','out',1,1)
obj('ready','live.thisdevice',3);obj('qa','v8 '+root.name+'.js');wire('ready','qa')
obj('udp','udpreceive 7480');wire('udp','qa');obj('err','error 1',2);obj('pre','prepend logerror');wire('err','pre');wire('pre','qa')
p=dict(patcher=dict(fileversion=1,appversion=V,rect=[100,100,400,400],devicewidth=80,openinpresentation=1,boxes=boxes,lines=lines,
 dependency_cache=[dict(name=root.name+'.js',type='TEXT',implicit=1)]))
raw=freeze([('Vril QA Monitor.amxd','JSON',json.dumps(p).encode()+b'\0'),(root.name+'.js','TEXT',('var ROOT='+json.dumps(str(root))+';\n'+script).encode())])
raw=raw[:8]+b'aaaa'+raw[12:]
(root/'Vril QA Monitor.amxd').write_bytes(raw)
print(root/'Vril QA Monitor.amxd')
