autowatch=1;
inlets=1;
outlets=2;
var defaults={"active": 0.0, "excite": 0.32, "tone": 110.0, "ratio": 1.618, "fm": 1.8, "source": 2.0, "feedback": 0.72, "size": 0.38, "diffusion": 0.7, "damping": 0.55, "drive": 0.3, "drift": 0.3, "coupling": 0.25, "body": 0.35, "decay": 0.65, "space": 0.5, "width": 0.75, "azimuth": 0.5, "elevation": 0.5, "wander": 1.0, "rate": 0.12, "output": -18.0, "strike": 0.0, "m0": 0.0, "m1": 0.0, "m2": 0.0, "m3": 0.0, "m4": 0.0, "m5": 0.0};
var root="/Users/scragz/Projects/max/syzygy/tests/runtime";
var cases=[
    {name:"rest",ms:1200,params:{active:0}},
    {name:"default",ms:5000,params:{active:1}},
    {name:"sustain",ms:12000,params:{active:1,feedback:0.98},cut:3000},
    {name:"extreme",ms:6000,params:{active:1,excite:1,feedback:1,size:0,fm:12,ratio:8,drive:1,coupling:1,drift:1,body:1,decay:1,space:1,output:0,m0:1,m1:1,m2:1,m3:-1,m4:1,m5:1}},
    {name:"long_dark",ms:4000,params:{active:1,source:0,size:1,damping:1,feedback:1,drive:0,body:0,space:0}},
    {name:"mono",ms:4000,params:{active:1,width:0}},
    {name:"panic",ms:3500,params:{active:1},panic:1500}
];
var index=-1;
var nextTask=new Task(next,this);
var cutTask=new Task(function(){outlet(0,"excite",0);},this);
var panicTask=new Task(function(){outlet(0,"active",0);resetTask.schedule(150);},this);
var resetTask=new Task(function(){outlet(0,"reset");outlet(0,"active",0);},this);
function bang(){nextTask.schedule(1500);}
function next(){
    outlet(1,0);
    index++;
    if(index>=cases.length){outlet(0,"active",0);post("SYZYGY QA COMPLETE\n");return;}
    outlet(0,"reset");
    for(var k in defaults)outlet(0,k,defaults[k]);
    var c=cases[index];
    for(var k in c.params)outlet(0,k,c.params[k]);
    outlet(1,"samptype","float32");
    outlet(1,"open",root+"/"+c.name+".wav","wave");
    outlet(1,1);
    if(c.cut)cutTask.schedule(c.cut);
    if(c.panic)panicTask.schedule(c.panic);
    nextTask.schedule(c.ms);
}
function notifydeleted(){nextTask.cancel();cutTask.cancel();panicTask.cancel();resetTask.cancel();}
