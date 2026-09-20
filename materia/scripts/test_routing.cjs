const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const schema=require('./build/schema.json'),routes=require('./build/routes.json');
const emits=[],writes=[];
const host={SCHEMA:schema,Materia:require('../src/materia.lib.js'),outlet:(...x)=>emits.push(x),notifyclients(){},arrayfromargs:a=>Array.from(a),Task:function(){this.cancel=this.repeat=this.schedule=()=>{};},Buffer:function(){},LiveAPI:function(){},File:function(){}};
host.patcher={getnamed:key=>({message:(...a)=>{writes.push([key,...a]);if(schema.some(p=>p.key===key)){host.messagename=key;host.anything(a[0]);}}})};
vm.createContext(host);vm.runInContext(fs.readFileSync('src/materia.control.js','utf8'),host);
assert.equal(routes.length,34);assert.deepEqual(new Set(routes.map(r=>r.key)),new Set(schema.filter(p=>p.enum?.length===22).map(p=>p.key)));
for(const r of routes){host.setroute(r.key,4);assert.equal(host.params[r.key],4);assert(writes.some(w=>w[0]===r.key&&w[1]===4));assert(emits.some(e=>e[0]===1&&e[1][0]==='param'&&e[1][1]===r.key&&e[1][2]===4));}
const old=writes.length;for(const [k,v] of [['constant',4],['l1_src',-1],['l1_src',22],['l1_src',1.5],['l1_src',NaN]])host.setroute(k,v);assert.equal(writes.length,old);
host.setroute('l1_src',8);host.setroute('l2_src',7);assert(emits.some(e=>e[0]===1&&e[1][0]==='routedelay'&&e[1][1]==='l1_src'&&e[1][2]===1));
host.openrouting();assert(writes.some(w=>w[0]==='routing'&&w[1]==='front'));
const clicks=[];const ui={ROUTES:routes,box:{rect:[0,0,1260,780]},max:{getcolor:()=>[.5,.5,.5,1]},outlet:(...a)=>clicks.push(a),arrayfromargs:a=>Array.from(a),mgraphics:new Proxy({},{get:()=>()=>{}})};
vm.createContext(ui);vm.runInContext(fs.readFileSync('src/materia.routing.js','utf8'),ui);ui.paint();
let g=ui.layout();assert.equal(g.cols.length,34);assert(g.cw>30&&g.rh>24);assert(g.bottom<780-55);
routes.forEach(r=>ui.param(r.key,0));
for(let c=0;c<g.cols.length;c++){
 const row=4;ui.onclick(g.left+(c+.5)*g.cw,g.top+(row+.5)*g.rh);
 assert.deepEqual(clicks.pop(),[0,'setroute',g.cols[c].key,4]);
 ui.param(g.cols[c].key,4);ui.onclick(g.left+(c+.5)*g.cw,g.top+(row+.5)*g.rh);
 assert.deepEqual(clicks.pop(),[0,'setroute',g.cols[c].key,0]);ui.param(g.cols[c].key,0);
}
ui.onclick(150,52);g=ui.layout();assert(g.cols.every(r=>r.clock));ui.onclick(g.left+.5*g.cw,g.top+17.5*g.rh);assert.equal(clicks.pop()[3],17);
ui.onclick(250,52);g=ui.layout();assert.deepEqual(Array.from(g.rows),[0]);ui.paint();ui.onidle(-1,-1);ui.paint();
// Existing dropdown/automation edits update the same matrix selection.
ui.param('a1_clk',17);g=ui.layout();assert.deepEqual(Array.from(g.rows),[0,17]);
ui.param('a1_mode',0);assert.equal(ui.active(routes.find(r=>r.key==='a1_clk')),false);ui.param('a1_mode',2);assert.equal(ui.active(routes.find(r=>r.key==='a1_clk')),true);
console.log('PASS: 34 parameter routes, click/disconnect, filters, feedback indicators, invalid input rejection, and automation synchronization.');
