const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
function load(){const messages=[],objects={};const ctx={console,Math,JSON,isFinite,outlet:(...a)=>messages.push(a),arrayfromargs:a=>Array.from(a),Task:function(fn,self){this.fn=()=>fn.call(self);this.cancel=()=>{};this.schedule=()=>{};this.repeat=()=>{};},patcher:{getnamed:k=>objects[k]||(objects[k]={message(){}})}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'/scripts/build/vermiform.control.js','utf8'),ctx);ctx.init();ctx.commitMode();ctx.messages=messages;return ctx;}
const tests=[];function test(name,fn){tests.push([name,fn]);}
function last(c,k){return c.messages.filter(a=>a[0]===0&&a[1]===k).at(-1)?.[2];}
test('64 complete modes and seven reachable groups',()=>{let c=load();assert.equal(c.TABLES.modes.length,64);for(let n=1;n<=64;n++){c.param('mode',n);c.commitMode();assert.equal(c.selected.mode,n);assert.ok(c.sequence.length);assert.ok(Number.isFinite(last(c,'pitch')));}assert.equal(c.TABLES.modes[60].core,5);assert.equal(c.TABLES.modes[61].core,5);});
test('MIDI last note, sustain, pitch bend and all-notes-off',()=>{let c=load();c.note(60,100);assert.equal(last(c,'gate'),1);c.note(67,90);c.note(67,0);assert.equal(c.notePitch,60);c.cc(127,64);c.note(60,0);assert.equal(last(c,'gate'),1);c.cc(0,64);assert.equal(last(c,'gate'),0);c.note(60,100);let p=last(c,'pitch');c.bend(12288);assert.ok(Math.abs(last(c,'pitch')/p-Math.pow(2,1/12))<1e-10);c.cc(0,123);assert.equal(last(c,'gate'),0);});
test('all five worm operations restore without altering source',()=>{for(let op=0;op<5;op++){let c=load(),original=JSON.stringify(c.TABLES.phones);c.param('depth',100);c.param('operation',op);c.corrupt();if(op===3)assert.equal(c.locked,true);else assert.ok(Object.keys(c.working).length);assert.equal(JSON.stringify(c.TABLES.phones),original);c.clean();assert.equal(Object.keys(c.working).length,0);assert.equal(c.locked,false);}});
test('rate-zero clears corruption and loop lock',()=>{let c=load();c.param('rate',50);c.param('operation',3);c.corrupt();assert.ok(c.locked);c.param('rate',0);assert.equal(c.locked,false);});
test('Compost inherits source without clearing RAM on mode change',()=>{let c=load();c.param('mode',47);c.commitMode();c.messages.length=0;c.param('mode',64);c.commitMode();assert.equal(c.sourceMode,47);assert.equal(last(c,'core'),4);assert.equal(last(c,'compost'),1);assert.equal(c.messages.some(a=>a[1]==='reset'),false);c.trigger();assert.equal(last(c,'freeze'),1);c.trigger();assert.equal(last(c,'freeze'),0);});
test('freeze modes defer XYZ until trigger unfreezes',()=>{let c=load();c.param('mode',28);c.commitMode();c.trigger();c.param('x',20);assert.equal(c.S.x,64);c.trigger();assert.equal(c.S.x,20);});
test('TTS and list state survive serialization',()=>{let c=load();c.text('hello human');assert.ok(c.parseText(c.textValue).length>4);c.phoneList=[1,12,30];const save=JSON.stringify({text:c.textValue,list:c.phoneList});let d=load();d.restore(save);assert.equal(d.textValue,c.textValue);assert.equal(JSON.stringify(d.phoneList),'[1,12,30]');});
test('trigger arm starts quiet then opens and drone respects stop',()=>{let c=load();c.param('drone',1);c.param('armed',1);assert.equal(last(c,'gate'),0);c.trigger();assert.equal(last(c,'gate'),1);c.panic();assert.equal(last(c,'gate'),0);assert.equal(c.S.drone,0);});
test('text field is live only for TTS sources',()=>{let c=load(),sent={};c.patcher.getnamed=k=>({message:(m,...a)=>{sent[k+'.'+m]=a.length>1?a:a[0];}});
 c.param('mode',7);c.commitMode();assert.equal(sent['textinput.ignoreclick'],0);
 c.param('mode',1);c.commitMode();assert.equal(sent['textinput.ignoreclick'],1);assert.equal(sent['textinput.textcolor'][3],.45);
 c.param('mode',30);c.commitMode();c.param('mode',63);c.commitMode();assert.equal(sent['textinput.ignoreclick'],0);});
// Route messages the way Max does: a same-named JS function wins over anything().
function dispatch(c,name,...args){if(typeof c[name]==='function')return c[name](...args);c.messagename=name;return c.anything(...args);}
test('Speed dial message reaches the clock',()=>{for(const [n,want] of [[0,1/32],[64,1],[127,4]]){let c=load();c.messages.length=0;dispatch(c,'speed',n);assert.ok(Math.abs(last(c,'speed')-want)<1e-9,`speed ${n} sent ${last(c,'speed')}`);}
 let c=load();dispatch(c,'stretch',1);dispatch(c,'speed',127);assert.ok(Math.abs(last(c,'speed')-4/32)<1e-9);});
test('parameter messages are not shadowed by JS functions',()=>{let c=load();for(const k of Object.keys(c.S))if(k!=='trigger'&&k!=='mode')assert.notEqual(typeof c[k],'function',`message "${k}" is swallowed by function ${k}()`);});
test('pitch knob reaches sub-audio and high extremes',()=>{let c=load();c.param('x',0);assert.ok(last(c,'pitch')<2,`low ${last(c,'pitch')}`);c.param('x',64);assert.ok(Math.abs(last(c,'pitch')/120-1)<.1);c.param('x',127);assert.ok(last(c,'pitch')>1500,`high ${last(c,'pitch')}`);});
test('drone survives a transport stop and stops itself when switched off',()=>{let c=load();
 c.param('drone',1);assert.equal(last(c,'gate'),1);
 c.note(60,100);c.cc(0,123);  // Live's all-notes-off on transport/clip stop
 assert.equal(c.S.drone,1);assert.equal(c.notes.length,0);assert.equal(last(c,'gate'),1);
 c.param('drone',0);assert.equal(last(c,'gate'),0);
 let d=load();d.param('drone',1);d.param('armed',1);d.trigger();assert.equal(last(d,'gate'),1);
 d.cc(0,123);assert.equal(last(d,'gate'),1);  // armed trigger latch also survives
 d.param('drone',0);assert.equal(last(d,'gate'),0);});
test('action dispatch drives the worm buttons and Stop',()=>{let c=load();c.param('depth',100);
 c.action('corrupt');assert.ok(Object.keys(c.working).length);
 c.action('clean');assert.equal(Object.keys(c.working).length,0);
 c.param('drone',1);c.action('panic');assert.equal(c.S.drone,0);assert.equal(last(c,'gate'),0);});
let failed=0;for(const [n,f] of tests){try{f();console.log('PASS',n);}catch(e){failed++;console.error('FAIL',n,e.message);}}if(failed)process.exit(1);
// Compost knobs must never retune or reselect the speech source it is recording.
{let c=load();c.param('mode',29);c.commitMode();c.param('x',76);c.param('z',50);const before=last(c,'pitch');c.param('mode',63);c.commitMode();c.param('x',0);c.param('z',100);c.publishFrame();assert.equal(last(c,'pitch'),before);assert.equal(c.sequence[0],25);console.log('PASS Compost preserves the previous speech settings');}
