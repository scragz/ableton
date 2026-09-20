const assert=require('node:assert/strict');const M=require('../src/materia.lib.js');const fs=require('node:fs');const schema=require('./build/schema.json');
let checked=0;
for(let k=0;k<256;k++){let crossings=0,last=M.table(2,k,0);for(let n=1;n<256;n++){let v=M.table(2,k,n);if(v!==last)crossings++;last=v;}assert.equal(crossings,k);checked++;}
for(let j=0;j<8;j++)for(let n=0;n<256;n++)assert.equal(M.table(3,2**j,n),((n>>j)&1)*255);
for(let f=0;f<7;f++)for(let k=0;k<M.counts[f];k++)for(let n=0;n<256;n++){let v=M.table(f,k,n);assert(Number.isInteger(v)&&v>=0&&v<=255);}
const p=Object.fromEntries(schema.map(x=>[x.key,x.default]));assert(Object.values(M.delays(p)).every(x=>x===0));
Object.assign(p,{l1_src:8,l2_src:7});assert.equal(M.delays(p).l1_src,1);assert.equal(M.delays(p).l2_src,0);
Object.assign(p,{l1_src:5,e1_src:7});assert(Object.values(M.delays(p)).every(x=>x===0));
Object.assign(p,{l1_src:10,j_src:7,j_sync:0});assert.equal(Object.values(M.delays(p)).reduce((a,b)=>a+b,0),1);p.j_sync=1;assert(Object.values(M.delays(p)).every(x=>x===0));
for(let x=0;x<256;x++){const rows=M.matrix(2,1);let y=rows.reduce((sum,row,i)=>sum+M.parity(row&x)*2**i,0);assert.equal(y,x^(x>>1));}
let a=Array.from({length:320},(_,i)=>i);assert.deepEqual(M.clearState(a,0),a);assert(M.clearState(a,1).slice(0,132).every(x=>x===0));assert.deepEqual(M.clearState(a,1).slice(132),a.slice(132));assert(M.clearState(a,2).every(x=>x===0));
const all=M.tables();assert.equal(all.length,169984);fs.writeFileSync('scripts/build/tables.json',JSON.stringify(all));
console.log('PASS: 256 Walsh crossing counts; 2048 Walsh bit comparisons; 169984 table values; graph cycle and registered-break cases; matrix Gray transform; clear modes.');
