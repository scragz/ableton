// Max's `js`/`jsui` run a legacy ES5 engine; Node's vm does not. Strip post-ES5 builtins inside
// each context, then load every built script and drive the control paths the device uses.
// Syntax (let/const/=>/class/`) is not checked here -- only runtime builtins.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const BUILD=path.join(__dirname,'build');
const STRIP=`(function(){
 var p=[[Array.prototype,['fill','find','findIndex','includes','flat','flatMap','copyWithin','entries','keys','values','at','findLast','findLastIndex']],
  [Array,['from','of']],[Object,['assign','entries','values','fromEntries','getOwnPropertySymbols']],
  [String.prototype,['includes','startsWith','endsWith','repeat','padStart','padEnd','trimStart','trimEnd','at','replaceAll','codePointAt','normalize']],
  [String,['raw','fromCodePoint']],[Number,['isFinite','isInteger','isNaN','isSafeInteger','parseFloat','parseInt','EPSILON']],
  [Math,['trunc','sign','log2','log10','hypot','cbrt','clz32','fround','imul','expm1','log1p','sinh','cosh','tanh','asinh','acosh','atanh']]];
 p.forEach(function(e){e[1].forEach(function(k){try{delete e[0][k];}catch(x){}});});
 ['Map','Set','WeakMap','WeakSet','Symbol','Promise','Proxy','Reflect'].forEach(function(k){delete globalThis[k];});
})();`;
const stubObj=()=>new Proxy(function(){},{get:(t,k)=>k==='rect'?[0,0,1360,169]:stubObj(),apply:()=>stubObj(),construct:()=>stubObj()});
function run(file,extra){
 const emits=[],writes=[];
 const ctx={outlet:(...a)=>emits.push(a),post(){},error(){},notifyclients(){},messagename:'',jsarguments:['x','table'],
  arrayfromargs:a=>Array.prototype.slice.call(a),
  Task:function(){this.cancel=this.repeat=this.schedule=function(){};},
  Buffer:function(){this.poke=function(){};this.peek=function(c,i,n){var a=[];for(var j=0;j<(n||1);j++)a.push(0);return (n||1)>1?a:0;};this.framecount=function(){return 4096;};},
  LiveAPI:function(){},File:function(){},
  max:{getcolor:()=>[.5,.5,.5,1]},mgraphics:stubObj(),box:{rect:[0,0,1260,780]},...extra};
 ctx.patcher={getnamed:key=>({getvalueof:()=>0,message:(...a)=>{writes.push([key,...a]);
  if(ctx.params&&Object.prototype.hasOwnProperty.call(ctx.params,key)&&typeof ctx.anything==='function'){ctx.messagename=key;ctx.anything(a[0]);}}})};
 vm.createContext(ctx);vm.runInContext(STRIP,ctx);
 vm.runInContext(fs.readFileSync(path.join(BUILD,file),'utf8'),ctx,{filename:file});
 return {ctx,emits,writes};
}
const schema=JSON.parse(fs.readFileSync(path.join(BUILD,'schema.json'),'utf8'));
// Control: load, bind buffers, open the routing window, route a cell, clear all.
{
 const {ctx,emits,writes}=run('materia.control.js');
 assert.equal(Object.keys(ctx.params).length,schema.length,'global init finished (params populated)');
 ctx.bind('s','e','t','m','me');assert.equal(ctx.ready,true,'initialize() completed');
 ctx.openrouting();assert(writes.some(w=>w[0]==='routing'&&w[1]==='front'));
 const r=schema.find(p=>p.enum&&p.enum.length===22);
 ctx.setroute(r.key,4);assert.equal(ctx.params[r.key],4,'setroute reaches params');
 assert(emits.some(e=>e[0]===1&&e[1][0]==='param'&&e[1][1]===r.key&&e[1][2]===4),'routing view updated');
 ctx.clearconfirmed('all');ctx.tab('BER');ctx.tick&&ctx.tick();
}
// UI scripts: load and paint.
for(const [file,extra] of [['materia.panel.js',{}],['materia.routing.js',{}],['materia.editor.js',{}]]){
 const {ctx}=run(file,extra);if(ctx.paint)ctx.paint();
}
console.log('ES5 runtime check passed: control, panel, routing, editor');
