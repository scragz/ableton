const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../src/syzygy.control.js'),'utf8');

function controller() {
    const events = [], writes = [], tasks = [];
    const ctx = vm.createContext({outlet:(...args)=>events.push(args),
        Task:function(fn,owner){this.cancel=()=>{this.pending=false};this.schedule=()=>{this.pending=true};this.run=()=>{this.pending=false;fn.call(owner)};tasks.push(this)},
        patcher:{getnamed:(name)=>({message:(type,v)=>{assert.ok(type==='float'||type==='int');writes.push([name,v]);send(name,v)}})}});
    vm.runInContext(source,ctx);
    function send(name,value) { ctx.messagename=name;ctx.anything(value); }
    return {ctx,events,writes,tasks,send};
}

test('recall preserves values without generating stochastic gestures',()=>{
    const c=controller(); c.ctx.init(); c.send('feedback',84);
    assert.equal(c.ctx.base.feedback,.84);
    assert.equal(c.writes.length,0);
    assert.ok(c.events.some(e=>e[0]===0&&e[1]==='feedback'&&e[2]===.84));
});
test('gestures modify only bounded matrix offsets, not macro settings',()=>{
    const c=controller();c.ctx.ready=true;c.send('feedback',83);
    assert.equal(c.ctx.base.feedback,.83);
    assert.ok(c.writes.length>=1&&c.writes.length<=3);
    assert.ok(c.writes.every(([k,v])=>/^m[0-5]$/.test(k)&&Math.abs(v)<=1));
    assert.ok(c.events.some(e=>e[1]==='connection'&&e[2]==='feedback'));
});
test('coupling zero disables gesture mutation, reseed covers all targets',()=>{
    const c=controller();c.ctx.ready=true;c.send('coupling',0);c.send('tone',220);
    assert.equal(c.writes.length,0);
    c.ctx.reseed();assert.equal(new Set(c.writes.map(w=>w[0])).size,6);
});
test('XY and MIDI use native parameter objects; note-offs do not excite',()=>{
    const c=controller();c.ctx.xy(1.5,-1);assert.deepEqual(c.writes,[['azimuth',1],['elevation',0]]);
    c.ctx.note(69,100);assert.equal(c.ctx.base.tone,440);
    const n=c.events.length;c.ctx.note(69,0);assert.equal(c.events.length,n);
});
test('panic turns run off, then resets and restores the stopped parameter state',()=>{
    const c=controller();c.send('active',1);c.send('tone',330);c.ctx.panic();
    assert.equal(c.ctx.base.active,0);c.tasks[2].run();
    assert.ok(c.events.some(e=>e[1]==='reset'));
    assert.deepEqual(c.events.filter(e=>e[1]==='active').at(-1),[0,'active',0]);
    assert.equal(c.ctx.base.tone,330);
});
test('strike wakes a stopped network and emits a bounded excitation pulse',()=>{
    const c=controller();c.ctx.strike();
    assert.equal(c.ctx.base.active,1);
    assert.deepEqual(c.events.filter(e=>e[1]==='strike'),[[0,'strike',0],[0,'strike',1]]);
    c.tasks[1].run();
    assert.deepEqual(c.events.filter(e=>e[1]==='strike').at(-1),[0,'strike',0]);
});
test('built momentary buttons deliver Max click bangs to their actions',()=>{
    const patch=JSON.parse(fs.readFileSync(path.join(__dirname,'../device/Syzygy.maxpat'),'utf8')).patcher;
    const boxes=new Map(patch.boxes.map(({box})=>[box.id,box]));
    const edges=patch.lines.map(l=>l.patchline);
    for(const action of ['strike','reseed','panic']) {
        const received=[];
        function propagate(id,event) {
            if(id==='control'){received.push(event);return;}
            const box=boxes.get(id);
            // Button mode emits a bang on mouse-down. Follow the saved graph,
            // including select semantics, to catch a broken patchcord adapter.
            let outlet=0;
            if(box.maxclass==='message')event=box.text;
            if(box.text==='sel 1'){outlet=event===1?0:1;event=event===1?'bang':event;}
            for(const edge of edges.filter(e=>e.source[0]===id&&e.source[1]===outlet)) {
                propagate(edge.destination[0],event);
            }
        }
        assert.equal(boxes.get(action).mode,0);
        propagate(action,'bang');
        assert.deepEqual(received,[action]);
    }
});
