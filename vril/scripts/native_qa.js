autowatch=0;inlets=1;outlets=1;
var logs=[],cases=[],index=-1;
var begin=new Task(run,this), next=new Task(nextcase,this), start=new Task(record,this), end=new Task(finish,this);
function log(s) { logs.push(s); var f=new File(ROOT+'/native.log','write','TEXT'); f.eof=0; f.writeline(logs.join('\n')); f.close(); }
function logerror(){log('ERROR '+arrayfromargs(arguments).join(' '));}
function bang(){log('OPEN');begin.schedule(2000);}
function param(k,v){this.patcher.getnamed(k).message(v);}
function command(){var a=arrayfromargs(arguments),o=this.patcher.getnamed('control');o.message.apply(o,a);}
function run(){
  this.patcher.getnamed('dacon').message(1);command('init');
  for(var i=0;i<9;i++)cases.push({name:'algorithm-'+i,p:{algorithm:i,span:40,warp:25,playmode:1}});
  cases.push({name:'midi-note',note:1,p:{mix:0}});
  cases.push({name:'note-off',p:{mix:0,release:5}});
  cases.push({name:'external',external:1,p:{inputgain:0,playmode:1,mix:50,output:-18}});
  for(var a=0;a<9;a++){
    cases.push({name:'negative-'+a,p:{algorithm:a,playmode:1,span:-85,warp:-85,fuse:-90,feed:-85,cell:-45,seed:77,scan:63,form:85}});
    cases.push({name:'positive-'+a,p:{algorithm:a,playmode:1,span:85,warp:85,fuse:90,feed:99,cell:45,seed:89,scan:93,form:95}});
  }
  cases.push({name:'output-mute',p:{playmode:1,output:-70}});
  cases.push({name:'vca-mute',p:{playmode:1,vca:0,mix:0}});
  cases.push({name:'mods',p:{algorithm:6,playmode:1,modsource:1,rate:3,mod_morph:80,mod_basis:60,mod_field:-80,mod_time:60,mod_form:90}});
  index=-1; nextcase();
}
function nextcase(){
  index++; if(index>=cases.length){ log('DONE '+cases.length); this.patcher.message('write');return; }
  var c=cases[index];
  command('panic');
  SCHEMA.forEach(function(p){param(p.key,p.default);});
  Object.keys(c.p).forEach(function(k){param(k,c.p[k]);});
  this.patcher.getnamed('level').message(c.external?.15:0);
  if(c.note)command('midi',60,110);
  start.schedule(250);
}
function record(){var o=this.patcher.getnamed('record');o.message('samptype','float32');o.message('open',ROOT+'/'+cases[index].name+'.wav','wave');o.message(1);end.schedule(600);}
function finish(){this.patcher.getnamed('record').message(0);log('CASE '+cases[index].name);next.schedule(80);}
function save(){this.patcher.message('write');log('SAVED');}
function stop(){begin.cancel();next.cancel();start.cancel();end.cancel();this.patcher.getnamed('record').message(0);command('panic');}
function notifydeleted(){begin.cancel();next.cancel();start.cancel();end.cancel();}
function gen(){var a=arrayfromargs(arguments),o=this.patcher.getnamed('dsp');o.message.apply(o,a);}
function exportcode(){var o=this.patcher.getnamed('dsp');o.message('exportfolder',ROOT);o.message('exportname','vril');o.message('exportcode');}
function close(){stop();this.patcher.message('dispose');}
