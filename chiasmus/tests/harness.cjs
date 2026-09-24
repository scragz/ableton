// Offline harness: runs src/chiasmus.genexpr (mechanically translated to JS) sample by sample.
// Not Max: approximates sample() with linear interpolation and noise() with a seeded PRNG.
// Usage: node tests/harness.cjs '<json params>' [seconds] [inputSeconds]
const fs = require('fs'), path = require('path');
const SR = 44100;
function translate(src, deferred) {
  let dc = 0, fnames = [], hist = [];
  src.replace(/^History (\w+)\(/gm, (m, n) => hist.push(n));
  src = src.replace(/\/\/[^\n]*/g, '');
  src = src.replace(/,\s*\w+="[^"]*"/g, '');
  src = src.replace(/^Param (\w+)\(([^,)]+)[^;]*;/gm, (m, n, d) => `var ${n} = (P.${n} !== undefined ? P.${n} : ${d});`);
  src = src.replace(/^History (\w+)\(([^)]*)\);/gm, 'var $1 = $2;');
  src = src.replace(/^Data (\w+)\(([^)]*)\);/gm, 'var $1 = new Data($2);');
  src = src.replace(/^Buffer (\w+);/gm, 'var $1 = BUF.$1;');
  src = src.replace(/^Delay (\w+)\(([^)]*)\);/gm, 'var $1 = new Delay($2);');
  src = src.replace(/^(\w+)\(([\w ,]*)\) \{/gm, (m, n, a) => { fnames.push(n); return `function ${n}(${a}) {`; });
  src = src.replace(/dcblock\(/g, () => `DC[${dc++}].f(`);
  // Split declarations/functions (run once) from per-sample statements.
  const lines = src.split('\n'); let head = [], body = [], depth = 0, inFn = false;
  for (const l of lines) {
    if (!inFn && /^function /.test(l)) inFn = true;
    if (inFn) { head.push(l); depth += (l.match(/{/g) || []).length - (l.match(/}/g) || []).length; if (depth === 0) inFn = false; continue; }
    if (/^var \w+ = (\(P\.|new |BUF\.|[-\d.]+;)/.test(l) && depth === 0) head.push(l); else body.push(l);
  }
  let b = body.join('\n'), pre = '', post = '';
  if (deferred) {
    // Model: History reads during a sample see last sample's value; writes land at the end.
    for (const n of hist) {
      b = b.replace(new RegExp('\\b' + n + '\\s*(\\+|-|\\*)?=(?!=)', 'g'), (m, op) => op ? `${n}__n = ${n}__n ${op}` : `${n}__n =`);
      pre += `var ${n}__n = ${n};\n`; post += `${n} = ${n}__n;\n`;
    }
  }
  return { head: head.join('\n'), body: pre + b + '\n' + post, dc };
}
function run(params, seconds, inputSeconds, onFrame) {
  const src = fs.readFileSync(path.join(__dirname, '../src/chiasmus.genexpr'), 'utf8');
  const t = translate(src, !!params._deferred);
  let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const env = `
  var samplerate=${SR}, pi=Math.PI, twopi=2*Math.PI, halfpi=Math.PI/2;
  var min=Math.min,max=Math.max,abs=Math.abs,sin=Math.sin,cos=Math.cos,pow=Math.pow,exp=Math.exp,sqrt=Math.sqrt,tanh=Math.tanh,floor=Math.floor;
  function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
  function wrap(x,a,b){var r=b-a;var v=(x-a)%r;if(v<0)v+=r;return v+a;}
  function mix(a,b,t){return a+(b-a)*t;}
  function dbtoa(d){return Math.pow(10,d/20);}
  function fixdenorm(x){return Math.abs(x)<1e-30?0:x;}
  function noise(){return rnd()*2-1;}
  function Data(n,c){this.n=n;this.c=c;this.a=new Float64Array(n*c);}
  function Delay(n){this.n=n;this.a=new Float64Array(n);this.w=0;}
  Delay.prototype.read=function(t){var p=this.w-1-t;var i=Math.floor(p),f=p-i;var n=this.n;var a=this.a[((i%n)+n)%n],b=this.a[(((i+1)%n)+n)%n];return a+(b-a)*f;};
  Delay.prototype.write=function(x){this.a[this.w]=x;this.w=(this.w+1)%this.n;};
  function Buf(frames,ch){this.frames=frames;this.ch=ch;this.a=new Float32Array(frames*ch);}
  function dim(b){return b.frames||b.n;}
  function peek(b,i,c){i=Math.floor(i);if(b instanceof Data){if(i<0||i>=b.n)return 0;return b.a[i*b.c+c];}if(i<0||i>=b.frames)return 0;return b.a[i*b.ch+c];}
  function poke(b,v,i,c){i=Math.floor(i);if(b instanceof Data){if(i>=0&&i<b.n)b.a[i*b.c+c]=v;return;}if(i>=0&&i<b.frames)b.a[i*b.ch+c]=v;}
  function sample(b,p,c){var n=b.frames;p=wrap(p,0,n);var i=Math.floor(p),f=p-i;var x=b.a[(i%n)*b.ch+c],y=b.a[((i+1)%n)*b.ch+c];return x+(y-x)*f;}
  var DC=[];for(var k=0;k<${t.dc};k++)DC.push({x1:0,y1:0,f:function(x){var y=x-this.x1+0.9997*this.y1;this.x1=x;this.y1=y;return y;}});
  `;
  const fn = new Function('P', 'BUF', 'rnd', 'onFrame', 'N', 'input', 'phasor', env + t.head + `
  if (P._wAbs) wAbs = P._wAbs;
  var out=new Float32Array(N*2);
  for (var __i=0;__i<N;__i++){ var in1=input(__i,0), in2=input(__i,1), in3=phasor(__i);
  ${t.body}
  out[2*__i]=out1; out[2*__i+1]=out2; if(onFrame&&__i%441===0)onFrame(__i, {tState:typeof tState!=='undefined'?tState:0, wAbs:wAbs, tPos:tPos, tGain:typeof tGain!=='undefined'?tGain:0}); }
  return out;`);
  const mem = { frames: Math.round(32 * SR), ch: 2, a: new Float32Array(Math.round(32 * SR) * 2) };
  const view = { frames: 32, ch: 1, a: new Float32Array(32) };
  const x = readWav(path.join(__dirname, 'chiasmus-test.wav'));
  if (params._prefill) for (let k = 0; k < mem.frames; k++) { const v = x[k % x.length] * 0.9; mem.a[2 * k] = v; mem.a[2 * k + 1] = v; }
  const inN = Math.round(inputSeconds * SR);
  const input = (n, c) => n < inN && n < x.length ? x[n] : 0;
  const bpm = params._bpm || 120, stopAt = params._stop !== undefined ? params._stop * SR : Infinity;
  const phasor = n => n < stopAt ? (n * bpm / 60 / SR) % 1 : ((stopAt * bpm / 60 / SR) % 1);
  return fn(params, { mem, view }, rnd, onFrame, Math.round(seconds * SR), input, phasor);
}
function readWav(p) {
  const b = fs.readFileSync(p); let i = 12, ch = 2, bits = 16, data;
  while (i < b.length) { const id = b.toString('ascii', i, i + 4), sz = b.readUInt32LE(i + 4);
    if (id === 'fmt ') { ch = b.readUInt16LE(i + 10); bits = b.readUInt16LE(i + 22); }
    if (id === 'data') data = b.subarray(i + 8, i + 8 + sz); i += 8 + sz + (sz & 1); }
  const n = data.length / (ch * bits / 8), out = new Float32Array(n);
  for (let k = 0; k < n; k++) out[k] = data.readInt16LE(k * ch * 2) / 32768;
  return out;
}
function report(out, seconds) {
  const rows = []; for (let s = 0; s < seconds; s++) { let e = 0; for (let n = s * SR; n < (s + 1) * SR; n++) e += out[2 * n] * out[2 * n]; rows.push(10 * Math.log10(e / SR + 1e-20)); }
  return rows;
}
module.exports = { run, report, SR };
if (require.main === module) {
  const params = JSON.parse(process.argv[2] || '{}'), secs = +(process.argv[3] || 40), ins = +(process.argv[4] || 8);
  const out = run(params, secs, ins);
  const r = report(out, secs); let nan = false; for (const v of out) if (!isFinite(v)) { nan = true; break; }
  console.log(JSON.stringify(params), 'nan', nan);
  console.log(r.map(v => v.toFixed(0)).join(' '));
}
