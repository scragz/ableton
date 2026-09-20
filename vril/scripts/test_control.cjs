const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function setup(){
 let events=[],values={seed:27,scan:35,playmode:0};
 let ctx={SCHEMA:[{key:'playmode'}],Math,Number,arrayfromargs:a=>Array.from(a),
  outlet:(...a)=>events.push(a),patcher:{getnamed:k=>({getvalueof:()=>values[k],message:v=>{values[k]=v;events.push([0,k,v]);}})}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../src/vril.control.js','utf8'),ctx);
 return {ctx,events,values,last:k=>events.filter(e=>e[1]===k).at(-1)?.[2]};
}
test('last-note priority returns to a held note and releases the gate',()=>{
 let {ctx,last}=setup();ctx.midi(60,100);ctx.midi(67,80);assert.equal(last('note'),67);
 ctx.midi(67,0);assert.equal(last('note'),60);ctx.midi(60,0);assert.equal(last('gate'),0);
});
test('sustain holds released notes until pedal release',()=>{
 let {ctx,last}=setup();ctx.midi(60,100);ctx.cc(127,64);ctx.midi(60,0);assert.equal(last('gate'),1);
 ctx.cc(0,64);assert.equal(last('gate'),0);
});
test('repeated pitch under pedal does not leave a stuck note',()=>{
 let {ctx,last}=setup();ctx.cc(127,64);ctx.midi(60,100);ctx.midi(60,0);ctx.midi(60,80);
 ctx.cc(0,64);assert.equal(last('gate'),1);ctx.midi(60,0);assert.equal(last('gate'),0);
});
test('hires pitch bend maps minus one to plus one into two semitones',()=>{
 let {ctx,last}=setup();ctx.bend(0);assert.equal(last('bend'),0);ctx.bend(-1);assert.equal(last('bend'),-2);ctx.bend(1);assert.equal(last('bend'),2);
});
test('panic closes the drone, clears notes and resets DSP',()=>{
 let {ctx,events,last,values}=setup();ctx.midi(60,100);ctx.cc(127,64);ctx.panic();
 assert.equal(last('gate'),0);assert.equal(values.playmode,0);assert.deepEqual(events.at(-1),[0,'reset']);
 ctx.cc(0,64);assert.equal(last('gate'),0);
});
test('initialization preserves restored drone selection',()=>{
 let {ctx,values}=setup();values.playmode=1;ctx.init();assert.equal(values.playmode,1);
});
test('random only changes seed and scan, within their ranges',()=>{
 let {ctx,events}=setup();ctx.randomize();assert.deepEqual(events.map(e=>e[1]),['seed','scan']);assert.ok(events.every(e=>e[2]>=0&&e[2]<=100));
});
