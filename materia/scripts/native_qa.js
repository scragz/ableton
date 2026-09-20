autowatch=1;inlets=1;outlets=1;
var logs=[],task=new Task(report,this),sequence=new Task(nextCase,this),finishTask=new Task(finishCase,this),cases=[],index=-1;
function log(s){logs.push(s);var f=new File(ROOT+'/native.log','write','TEXT');f.eof=0;f.writeline(logs.join('\n'));f.close();}
function logerror(){log('ERROR '+arrayfromargs(arguments).join(' '));}
function bang(){log('OPEN');task.schedule(2000);}
function report(){var c=this.patcher.getnamed('control');var state=JSON.parse(c.getvalueof());var f=new File(ROOT+'/last-state.json','write','TEXT');f.eof=0;f.writeline(JSON.stringify(state));f.close();log('STATE '+JSON.stringify(state.state.slice(132,161)));}
function dsp(v){this.patcher.getnamed('dacon').message(v);log('DSP '+v);}
function param(k,v){this.patcher.getnamed(k).message(v);}
function command(){var a=arrayfromargs(arguments),o=this.patcher.getnamed('control');o.message.apply(o,a);}
function record(name){var o=this.patcher.getnamed('record');o.message('samptype','float32');o.message('open',ROOT+'/'+name+'.wav','wave');o.message(1);}
function stop(){this.patcher.getnamed('record').message(0);report();}
function save(){this.patcher.message('write');log('SAVE');}
function run(){index=-1;cases=[
 {name:'adc',p:{da_dc:0,db_dc:0}},
 {name:'silence',level:0,p:{da_dc:0,db_dc:0}},
 {name:'flip7',p:{da_dc:0,db_dc:0,l1_b7:1}},
 {name:'invert',p:{da_dc:0,db_dc:0,l1_b0:1,l1_b1:1,l1_b2:1,l1_b3:1,l1_b4:1,l1_b5:1,l1_b6:1,l1_b7:1}},
 {name:'chain',p:{da_dc:0,db_dc:0,e1_clk:17,iclk_rate:1000,r1_src:5,r1_clk:17,r1_length:1,r2_src:11,r2_clk:17,r2_length:1,t1_src:5,t1_kind:0,t2_src:11,t2_kind:0,t3_src:12,t3_kind:0}},
 {name:'erfurt-feedback',p:{e1_clk:17,iclk_rate:1000,e1_src:7,l1_src:5,l1_b0:1,da_src:5,da_dc:0}},
 {name:'loop-delay',p:{l1_src:8,l2_src:7,l1_b0:1,da_src:7,db_src:8,da_dc:0,db_dc:0}},
 {name:'loop-last',p:{l1_src:8,l2_src:7,l1_b0:1,da_src:7,db_src:8,da_dc:0,db_dc:0,race_mode:1}},
 {name:'loop-noise',p:{l1_src:8,l2_src:7,l1_b0:1,da_src:7,db_src:8,da_dc:0,db_dc:0,race_mode:2}},
 {name:'berlin-saturated',p:{ber_freq:1000,da_src:4,da_dc:0,t1_src:5,t1_kind:0}},
 {name:'rostock-loop',p:{r1_mode:1,r1_src:2,r1_clk:17,iclk_rate:500,da_src:11,da_dc:0}},
 {name:'rostock-scramble',p:{r1_mode:2,r1_src:2,r1_clk:17,iclk_rate:500,da_src:11,da_dc:0}},
 {name:'rostock-hold',p:{r1_mode:3,r1_src:2,r1_clk:17,iclk_rate:500,da_src:11,da_dc:0}},
 {name:'poczdam',p:{p_a:2,p_b:3,p_sel:1,da_src:13,db_src:14,da_dc:0,db_dc:0}},
 {name:'ladder',p:{da_wmode:1,db_wmode:1,da_dc:0,db_dc:0}},
 {name:'custom',p:{da_wmode:2,da_w7:-1,da_dc:0,db_dc:0}},
 {name:'lp-filter',p:{da_filt:1,da_cutoff:100}},
 {name:'fourpole-filter',p:{da_filt:2,da_cutoff:100}},
 {name:'adc-rate',p:{a1_mode:1,a1_rate:2000,da_dc:0}},
 {name:'adc-bus',p:{a1_mode:2,a1_clk:17,iclk_rate:2000,da_dc:0}},
 {name:'adc-zero',p:{a1_mode:3,da_dc:0}}
 ];
 for(var mode=0;mode<4;mode++)cases.push({name:'gera-'+mode,p:{g_b1:0,g_b3:0,g_b5:0,g_b7:0,g_law:mode,da_dc:0}});
 for(var f=0;f<7;f++)cases.push({name:'jena-'+f,p:{j_src:2,j_family:f,j_table:f===6?0:3,j_morph:.3,da_src:10,da_dc:0}});
 for(var m=0;m<5;m++)cases.push({name:'matrix-'+m,p:{m_src:2,m_preset:m,da_src:15,da_dc:0}});
 dsp(1);sequence.schedule(100);
}
function nextCase(){index++;if(index>=cases.length){log('DONE '+cases.length);report();return;}var c=cases[index];SCHEMA.forEach(function(p){param(p.key,p.default);});this.patcher.getnamed('testlevel').message(c.level===undefined?.25:c.level);Object.keys(c.p).forEach(function(k){param(k,c.p[k]);});command('clearconfirmed','all');task.cancel();var begin=new Task(function(){record(c.name);finishTask.schedule(350);},this);begin.schedule(50);}
function finishCase(){this.patcher.getnamed('record').message(0);var data=JSON.parse(this.patcher.getnamed('control').getvalueof());log('CASE '+cases[index].name+' '+JSON.stringify(data.state.slice(132,145)));sequence.schedule(50);}
function notifydeleted(){task.cancel();sequence.cancel();finishTask.cancel();}
