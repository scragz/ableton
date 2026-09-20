autowatch=1;inlets=1;outlets=1;
var jobs=[],result={},meterBuffer;
function bind(name){meterBuffer=new Buffer(name);}
function later(fn,ms){var t=new Task(fn,this);jobs.push(t);t.schedule(ms);}
function write(){var f=new File(ROOT+'/stereo-regression.json','write','TEXT');f.eof=0;f.writeline(JSON.stringify(result,null,2));f.close();}
function param(k,v){this.patcher.getnamed(k).message(v);}
function meters(){return meterBuffer.peek(1,45);}
function bang(){later(run,2500);}
function run(){
 result={defaults:{}};
 ['da_dest','db_dest','da_src','db_src','ber_mode','ber_freq'].forEach(function(k){result.defaults[k]=this.patcher.getnamed(k).getvalueof();},this);
 try{var api=new LiveAPI('this_device');result.liveDeviceId=Number(api.id);}catch(e){result.hostError=String(e);}
 result.stepAt110=meters();
 var r=this.patcher.getnamed('regrecord');r.message('samptype','float32');r.message('open',ROOT+'/stereo-regression.wav','wave');r.message(1);
 later(function(){r.message(0);param('ber_mode',1);later(function(){result.cycleAt110=meters();param('ber_mode',0);param('ber_freq',40);later(function(){result.stepAt40=meters();param('ber_freq',110);write();},150);},150);},1200);
}
function notifydeleted(){jobs.forEach(function(t){t.cancel();});}
