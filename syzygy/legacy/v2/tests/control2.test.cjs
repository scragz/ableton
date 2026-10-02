const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sent=[],scheduled=[],buffers={},files={},attrs={};let ctx;
class Task{constructor(fn,self){this.fn=fn;this.self=self;}schedule(){scheduled.push(this);}cancel(){let i;while((i=scheduled.indexOf(this))>=0)scheduled.splice(i,1);}}
class MaxBuffer{constructor(name){this.data=buffers[name];}framecount(){return this.data[0].length;}peek(c,i,n){return this.data[c-1].slice(i,i+n);}poke(c,i,a){if(!Array.isArray(a))a=[a];this.data[c-1].splice(i,a.length,...a);}send(m,v){if(m==='sizeinsamps')this.data.forEach(a=>{a.length=v;a.fill(0);});if(m==='writewave')files[v]=this.framecount()*8+44;}}
class File{constructor(p,mode){this.p=p;this.isopen=true;this.eof=files[p]||0;if(mode==='write')files[p]=0;}close(){}}
ctx=vm.createContext({Task,Buffer:MaxBuffer,File,jsarguments:['script','ring','export'],outlet:(...a)=>sent.push(a),isFinite,Math,Date,Number,String,patcher:{filepath:'/device/Syzygy.amxd',getnamed:k=>({message:(type,v)=>{if(type!=='float'){attrs[k+'.'+type]=v;return;}ctx.messagename=k;ctx.anything(v);}})}});
vm.runInContext(fs.readFileSync('src/syzygy2.control.js','utf8'),ctx);
function ui(k,v){ctx.messagename=k;ctx.anything(v);}
ctx.action('strike');assert.equal(ctx.base.active,1);assert.equal(ctx.strikeCount,1);ctx.action('strike');assert.equal(ctx.strikeCount,2);assert(sent.some(a=>a[1]==='strikeid'&&a[2]===2));
ui('wood',73);assert.equal(ctx.base.wood,.73);ui('coupling',150);assert.equal(ctx.base.coupling,1);
let before=JSON.stringify(ctx.snapshot()),root=ctx.base.root,out=ctx.base.output;ctx.action('vary');assert.notEqual(JSON.stringify(ctx.snapshot()),before);assert.equal(ctx.base.root,root);assert.equal(ctx.base.output,out);ctx.action('undo');assert.equal(JSON.stringify(ctx.snapshot()),before);
for(let n=0;n<4;n++){ctx.scene(n);ctx.undo();assert.equal(JSON.stringify(ctx.snapshot()),before);}
ctx.note(69,0);assert.equal(ctx.strikeCount,2);ctx.note(69,100);assert.equal(ctx.base.root,440);assert.equal(ctx.strikeCount,3);
ctx.xy(3,-3);assert.equal(ctx.base.azimuth,1);assert.equal(ctx.base.elevation,0);
ui('hold',1);assert.equal(ctx.base.hold,1);ctx.action('panic');assert.equal(ctx.base.active,0);scheduled.shift().fn.call(ctx);assert(sent.some(a=>a[1]==='reset'));
function drain(){for(let n=0;scheduled.length;n++){assert(n<100);let t=scheduled.shift();t.fn.call(t.self);}}
// Wrapped and partial recordings must be chronological and preserve stereo.
for(const valid of [128,80]){buffers.ring=[Array.from({length:128},(_,i)=>i),Array.from({length:128},(_,i)=>-i)];buffers.export=[[],[]];ctx.recordpos(32);ctx.recorded(valid);ctx.captureto('/capture.wav');drain();let start=(32-valid+128)%128;assert.deepEqual(buffers.export[0],Array.from({length:valid},(_,i)=>(start+i)%128));assert.deepEqual(buffers.export[1],buffers.export[0].map(v=>-v));assert.equal(ctx.captureBusy,false);assert(sent.some(a=>a[0]===2&&a[1]==='paused'&&a[2]===0));}
// Undo dims when empty; Capture shows progress while saving.
assert.equal(attrs['undo.active'],0);assert.equal(attrs['capture.text'],'Capture 30 s');
// Every native action button reaches the controller through an `action <name>` message.
const built=JSON.parse(fs.readFileSync('device/Syzygy.maxpat','utf8')).patcher;
const byId=Object.fromEntries(built.boxes.map(b=>[b.box.id,b.box]));
const actions=['strike','woodstrike','glassstrike','metalstrike','vary','undo','capture','panic','woodscene','glassscene','metalscene','trioscene'];
for(const a of actions){
  assert.equal(byId[a].maxclass,'live.text',a);
  assert(built.lines.some(l=>l.patchline.source[0]===a&&l.patchline.destination[0]==='msg-'+a),a);
  assert.equal(byId['msg-'+a].text,'action '+a);
  assert(built.lines.some(l=>l.patchline.source[0]==='msg-'+a&&l.patchline.destination[0]==='control'),a);
  const before=sent.length;ctx.action(a);
}
// The XY pad still reports positions.
let messages=[];let panel=vm.createContext({mgraphics:{init(){},redraw(){}},include(n){vm.runInContext(fs.readFileSync('device/'+n,'utf8'),panel);},outlet:(...v)=>messages.push(v)});vm.runInContext(fs.readFileSync('src/syzygy2.panel.js','utf8'),panel);
panel.onclick(panel.pad[0]+panel.pad[2]/2,panel.pad[1]+panel.pad[3]/2);assert.deepEqual(messages.pop(),[0,'xy',0.5,0.5]);
console.log('PASS: repeated strikes, native parameter scaling, protected variation, exact undo, scenes, MIDI, Hold/Panic, stereo ring capture, native action wiring and XY pad');
