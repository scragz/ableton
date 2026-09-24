// Offline harness: runs src/atomism.genexpr (mechanically translated to JS) sample by sample.
// Not Max: sample() is linear, noise() a seeded PRNG, and History reads see same-sample writes
// (the source is written so that either semantics gives the same result).
// Usage: node tests/harness.cjs '<json params>' [seconds]
const fs = require('fs'), path = require('path');
const SR = 44100;
function translate(src) {
  let dc = 0;
  src = src.replace(/\/\/[^\n]*/g, '');
  src = src.replace(/,\s*\w+="[^"]*"/g, '');
  src = src.replace(/^Param (\w+)\(([^,)]+)[^;]*;/gm, (m, n, d) => `var ${n} = (P.${n} !== undefined ? P.${n} : ${d});`);
  src = src.replace(/^History (\w+)\(([^)]*)\);/gm, 'var $1 = $2;');
  src = src.replace(/^Data (\w+)\(([^)]*)\);/gm, 'var $1 = new Data($2);');
  src = src.replace(/^Buffer (\w+);/gm, 'var $1 = BUF.$1;');
  src = src.replace(/^(\w+)\(([\w ,]*)\) \{/gm, (m, n, a) => `function ${n}(${a}) {`);
  src = src.replace(/dcblock\(/g, () => `DC[${dc++}].f(`);
  const lines = src.split('\n'); let head = [], body = [], depth = 0, inFn = false;
  for (const l of lines) {
    if (!inFn && /^function /.test(l)) inFn = true;
    if (inFn) { head.push(l); depth += (l.match(/{/g) || []).length - (l.match(/}/g) || []).length; if (depth === 0) inFn = false; continue; }
    if (/^var \w+ = (\(P\.|new |BUF\.|[-\d.]+;)/.test(l)) head.push(l); else body.push(l);
  }
  return { head: head.join('\n'), body: body.join('\n'), dc };
}
// Test input: a kick-ish thump every 0.5 s over a quiet two-note saw chord (stereo detuned).
function input(n, c) {
  const t = n / SR, k = t % 0.5;
  const kick = Math.sin(2 * Math.PI * (50 + 120 * Math.exp(-k * 30)) * k) * Math.exp(-k * 12) * 0.8;
  const saw = (f) => 2 * ((t * f) % 1) - 1;
  return kick + 0.15 * (saw(110 * (c ? 1.003 : 1)) + saw(164.8));
}
function run(params, seconds, onBlock) {
  const src = fs.readFileSync(path.join(__dirname, '../src/atomism.genexpr'), 'utf8');
  const t = translate(src);
  let seed = params._seed || 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const env = `
  var samplerate=${SR}, pi=Math.PI, twopi=2*Math.PI, halfpi=Math.PI/2;
  var min=Math.min,max=Math.max,abs=Math.abs,sin=Math.sin,cos=Math.cos,pow=Math.pow,exp=Math.exp,sqrt=Math.sqrt,tanh=Math.tanh,floor=Math.floor;
  function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
  function wrap(x,a,b){var r=b-a;var v=(x-a)%r;if(v<0)v+=r;return v+a;}
  function fract(x){return x-Math.floor(x);}
  function dbtoa(d){return Math.pow(10,d/20);}
  function fixdenorm(x){return Math.abs(x)<1e-30?0:x;}
  function noise(){return rnd()*2-1;}
  function Data(n,c){this.n=n;this.c=c;this.a=new Float64Array(n*c);}
  function Buf(frames,ch){this.frames=frames;this.ch=ch;this.a=new Float32Array(frames*ch);}
  function dim(b){return b.frames||b.n;}
  function peek(b,i,c){i=Math.floor(i);if(b instanceof Data){if(i<0||i>=b.n)return 0;return b.a[i*b.c+c];}if(i<0||i>=b.frames)return 0;return b.a[i*b.ch+c];}
  function poke(b,v,i,c){i=Math.floor(i);if(b instanceof Data){if(i>=0&&i<b.n)b.a[i*b.c+c]=v;return;}if(i>=0&&i<b.frames)b.a[i*b.ch+c]=v;}
  function sample(b,p,c){var n=b.frames;p=wrap(p,0,n);var i=Math.floor(p),f=p-i;var x=b.a[(i%n)*b.ch+c],y=b.a[((i+1)%n)*b.ch+c];return x+(y-x)*f;}
  var DC=[];for(var k=0;k<${t.dc};k++)DC.push({x1:0,y1:0,f:function(x){var y=x-this.x1+0.9997*this.y1;this.x1=x;this.y1=y;return y;}});
  `;
  const fn = new Function('P', 'BUF', 'rnd', 'onBlock', 'N', 'input', 'phasor', env + t.head + `
  var out=new Float32Array(N*2), fires=0;
  var __iu = P._inputUntil !== undefined ? P._inputUntil * ${SR} : Infinity, __ha = P._holdAt !== undefined ? P._holdAt * ${SR} : -1;
  for (var __i=0;__i<N;__i++){ var in1=__i<__iu?input(__i,0):0, in2=__i<__iu?input(__i,1):0, in3=phasor(__i);
  if (P._trigEvery) trigin = (__i % P._trigEvery) < 200 ? 1 : 0;
  if (__ha >= 0) holdon = __i >= __ha ? 1 : 0;
  ${t.body}
  if (fire) fires++;
  out[2*__i]=out1; out[2*__i+1]=out2;
  if(onBlock&&__i%256===0)onBlock(__i,{nact:nact,fire:fire,cx:cx,lx:lx,lz:lz,wAbs:wAbs}); }
  return {out:out,fires:fires,view:BUF.view,voices:voices};`);
  const mem = { frames: Math.round(4 * SR), ch: 2, a: new Float32Array(Math.round(4 * SR) * 2) };
  const view = { frames: 256, ch: 1, a: new Float32Array(256) };
  const bpm = params._bpm || 120, stopAt = params._stop !== undefined ? params._stop * SR : Infinity;
  const phasor = n => n < stopAt ? (n * bpm / 60 / SR) % 1 : ((stopAt * bpm / 60 / SR) % 1);
  const inp = params._silent ? () => 0 : input;
  return fn(params, { mem, view }, rnd, onBlock, Math.round(seconds * SR), inp, phasor);
}
function stats(out) {
  let e = 0, pk = 0, nan = false, dc = 0; const N = out.length / 2;
  for (let n = 0; n < N; n++) { const v = out[2 * n]; if (!isFinite(v)) nan = true; e += v * v; pk = Math.max(pk, Math.abs(v), Math.abs(out[2 * n + 1])); dc += v; }
  return { rmsDb: 10 * Math.log10(e / N + 1e-20), peak: pk, nan, dc: dc / N };
}
module.exports = { run, stats, SR, input };
if (require.main === module) {
  const params = JSON.parse(process.argv[2] || '{}'), secs = +(process.argv[3] || 4);
  const r = run(params, secs); const s = stats(r.out);
  console.log(JSON.stringify(params), 'fires', r.fires, 'rms', s.rmsDb.toFixed(1), 'peak', s.peak.toFixed(3), 'nan', s.nan);
}
