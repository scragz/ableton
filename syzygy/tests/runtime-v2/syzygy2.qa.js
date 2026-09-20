autowatch=1;inlets=1;outlets=3;
var defaults={"active": 0.0, "root": 110.0, "wood": 0.8, "glass": 0.65, "metal": 0.45, "decay": 0.5, "brightness": 0.5, "alignment": 0.8, "coupling": 0.22, "instability": 0.12, "bow": 0.0, "evolve": 0.0, "motion": 0.35, "cycle": 18.0, "bloom": 0.45, "hold": 0.0, "space": 0.35, "width": 0.8, "azimuth": 0.5, "elevation": 0.5, "output": -12.0, "inputgain": 0.6, "strikeid": 0.0, "target": 0.0, "velocity": 0.8},root="/Users/scragz/Projects/max/syzygy/tests/runtime-v2";
var cases=[
{name:'rest',ms:1200,params:{active:0}},
{name:'wood',ms:4000,hit:1,params:{active:1,wood:1,glass:0,metal:0,coupling:0,space:0}},
{name:'glass',ms:4000,hit:2,params:{active:1,wood:0,glass:1,metal:0,coupling:0,space:0}},
{name:'metal',ms:4000,hit:3,params:{active:1,wood:0,glass:0,metal:1,coupling:0,space:0}},
{name:'trio',ms:5000,hit:0,params:{active:1}},
{name:'bow',ms:5000,params:{active:1,bow:1}},
{name:'evolve',ms:10000,params:{active:1,bow:1,evolve:1,cycle:3}},
{name:'extreme',ms:6000,hit:0,params:{active:1,wood:1,glass:1,metal:1,bow:1,decay:1,brightness:1,coupling:1,instability:1,space:1,output:0,root:880}},
{name:'mono',ms:3000,hit:0,params:{active:1,width:0}},
{name:'panic',ms:4000,hit:0,params:{active:1,bow:1},panic:1500},
{name:'external',ms:4000,params:{active:1},input:0.2}
];
var index=-1,nextTask=new Task(next,this),hitTask=new Task(hit,this),panicTask=new Task(panic,this),resetTask=new Task(reset,this);
function bang(){nextTask.schedule(1200);}
function hit(){outlet(0,'target',cases[index].hit);outlet(0,'strikeid',1);}
function panic(){outlet(0,'active',0);resetTask.schedule(180);}
function reset(){outlet(0,'reset');outlet(0,'active',0);}
function next(){outlet(1,0);outlet(2,0);index++;if(index>=cases.length){outlet(0,'active',0);return;}
outlet(0,'reset');for(var k in defaults)outlet(0,k,defaults[k]);var c=cases[index];for(var k in c.params)outlet(0,k,c.params[k]);
outlet(1,'samptype','float32');outlet(1,'open',root+'/'+c.name+'.wav','wave');outlet(1,1);
if(c.hit!==undefined)hitTask.schedule(200);if(c.panic)panicTask.schedule(c.panic);if(c.input)outlet(2,c.input);nextTask.schedule(c.ms);}
function notifydeleted(){nextTask.cancel();hitTask.cancel();panicTask.cancel();resetTask.cancel();}
