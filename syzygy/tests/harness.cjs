// Offline harness: runs src/syzygy3.genexpr, mechanically translated to JS, sample by sample.
// Not Max: noise() is a seeded PRNG, Delay.read is linear, and there is no vector boundary.
// The GenExpr source avoids functions (every mode keeps its state in Data), so a
// straight translation keeps per-mode / per-call-site state exactly as gen~ does.
//
// run(params, seconds, {events, probes, every, sr, input}) -> {out: Float32Array (interleaved), probes: [...], view}
//   events: [[timeSec, {param: value, ...}], ...] applied at that sample (like messages to gen~)
//   probes: names of genexpr variables sampled every `every` samples
// CLI: node tests/harness.cjs '<json params>' [seconds] [out.wav]
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '../src/syzygy3.genexpr');

function translate(src) {
  let dc = 0;
  src = src.replace(/\/\/[^\n]*/g, '');
  src = src.replace(/,\s*\w+="[^"]*"/g, '');
  const head = [], params = {};
  src = src.replace(/^Param (\w+)\(([^,)]+)(?:,\s*min=([-\d.e]+))?(?:,\s*max=([-\d.e]+))?[^;]*;/gm, (m, n, d, lo, hi) => {
    params[n] = { def: +d, lo: lo === undefined ? -Infinity : +lo, hi: hi === undefined ? Infinity : +hi };
    head.push(`var ${n};`); return '';
  });
  src = src.replace(/^History (\w+)\(([^)]*)\);/gm, (m, n, v) => { head.push(`var ${n} = ${v};`); return ''; });
  src = src.replace(/^Data (\w+)\(([^)]*)\);/gm, (m, n, a) => { head.push(`var ${n} = new Data(${a});`); return ''; });
  src = src.replace(/^Delay (\w+)\(([^)]*)\);/gm, (m, n, a) => { head.push(`var ${n} = new DelayLine(${a});`); return ''; });
  src = src.replace(/^Buffer (\w+);/gm, (m, n) => { head.push(`var ${n} = BUF.${n};`); return ''; });
  if (/^\w+\([\w ,]*\)\s*\{/m.test(src)) throw new Error('harness does not translate GenExpr functions');
  src = src.replace(/\bdcblock\(/g, () => `DC[${dc++}].f(`);
  // Declare every assigned local once, outside the per-sample loop.
  const declared = new Set(head.map(l => l.match(/var (\w+)/)[1]));
  const locals = new Set();
  const re = /(^|[;{}\s(])([a-zA-Z_]\w*)\s*[-+*/]?=(?!=)/g; let m;
  while ((m = re.exec(src))) if (!declared.has(m[2]) && !['if', 'else', 'for', 'return'].includes(m[2])) locals.add(m[2]);
  if (locals.size) head.push('var ' + [...locals].join(',') + ';');
  return { head: head.join('\n'), body: src, dc, params };
}

function run(params = {}, seconds = 4, opt = {}) {
  const SR = opt.sr || 44100;
  const t = translate(fs.readFileSync(SRC, 'utf8'));
  const probes = opt.probes || [], every = opt.every || 64;
  const env = `
  var samplerate=${SR}, pi=Math.PI, twopi=2*Math.PI, halfpi=Math.PI/2;
  var min=Math.min,max=Math.max,abs=Math.abs,sin=Math.sin,cos=Math.cos,pow=Math.pow,exp=Math.exp,sqrt=Math.sqrt,tanh=Math.tanh,floor=Math.floor,atan2=Math.atan2,log=Math.log;
  function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
  function mix(a,b,f){return a+(b-a)*f;}
  function exp2(x){return Math.pow(2,x);} function log2(x){return Math.log2(x);}
  function wrap(x,a,b){var r=b-a;var v=(x-a)%r;if(v<0)v+=r;return v+a;}
  function fract(x){return x-Math.floor(x);}
  function dbtoa(d){return Math.pow(10,d/20);}
  function fixdenorm(x){return Math.abs(x)<1e-30?0:x;}
  function noise(){return rnd()*2-1;}
  function Data(n,c){this.n=n;this.c=c;this.a=new Float64Array(n*(c||1));}
  function dim(b){return b.frames!==undefined?b.frames:b.n;}
  function peek(b,i,c){c=c||0;i=Math.floor(i);if(b instanceof Data){if(i<0||i>=b.n)return 0;return b.a[i*b.c+c];}if(i<0||i>=b.frames)return 0;return b.a[i*b.ch+c];}
  function poke(b,v,i,c){c=c||0;i=Math.floor(i);if(b instanceof Data){if(i>=0&&i<b.n)b.a[i*b.c+c]=v;return;}if(i>=0&&i<b.frames)b.a[i*b.ch+c]=v;}
  function DelayLine(n){this.n=n;this.b=new Float64Array(n);this.w=0;}
  DelayLine.prototype.read=function(d){d=Math.max(0,Math.min(this.n-1,d));var p=this.w-d;while(p<0)p+=this.n;var i=Math.floor(p),f=p-i;var a=this.b[i%this.n],b=this.b[(i+1)%this.n];return a+(b-a)*f;};
  DelayLine.prototype.write=function(x){this.b[this.w]=x;this.w=(this.w+1)%this.n;};
  var DC=[];for(var k=0;k<${t.dc};k++)DC.push({x1:0,y1:0,f:function(x){var y=x-this.x1+0.9997*this.y1;this.x1=x;this.y1=y;return y;}});
  `;
  const setP = Object.keys(t.params).map(n => `${n}=Math.max(${t.params[n].lo},Math.min(${t.params[n].hi},(P.${n}!==undefined?P.${n}:${t.params[n].def})));`).join('\n');
  const probeObj = '{' + probes.map(n => `${n}:${n}`).join(',') + '}';
  const fn = new Function('P', 'BUF', 'rnd', 'EV', 'N', 'INPUT', 'PROBE', env + t.head + `
  function __set(){${setP}}
  __set();
  var out=new Float32Array(N*2), pr=[], ev=0, in1=0, in2=0;
  for (var __i=0;__i<N;__i++){
    while (ev<EV.length && EV[ev][0]<=__i){ for (var k in EV[ev][1]) P[k]=EV[ev][1][k]; __set(); ev++; }
    if (INPUT){ in1=INPUT(__i,0); in2=INPUT(__i,1); }
    ${t.body}
    out[2*__i]=out1; out[2*__i+1]=out2;
    if (PROBE && __i%${every}===0) pr.push(${probeObj});
  }
  return {out:out, probes:pr};`);
  let seed = params._seed || 12345;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const view = { frames: 64, ch: 1, a: new Float32Array(64) };
  const events = (opt.events || []).map(([ts, p]) => [Math.round(ts * SR), p]).sort((a, b) => a[0] - b[0]);
  const P = Object.assign({}, params);
  const r = fn(P, { view }, rnd, events, Math.round(seconds * SR), opt.input || null, probes.length > 0);
  r.view = view; r.sr = SR; r.params = t.params;
  return r;
}

function stats(out, from = 0, to = Infinity, sr = 44100) {
  const N = out.length / 2, a = Math.max(0, Math.round(from * sr)), b = Math.min(N, Math.round(to * sr));
  let e = 0, pk = 0, nan = false, dcL = 0, side = 0;
  for (let n = a; n < b; n++) {
    const l = out[2 * n], r = out[2 * n + 1];
    if (!isFinite(l) || !isFinite(r)) nan = true;
    e += (l * l + r * r) / 2; side += ((l - r) / 2) ** 2; dcL += l;
    pk = Math.max(pk, Math.abs(l), Math.abs(r));
  }
  const n = Math.max(1, b - a), db = x => 10 * Math.log10(x + 1e-20);
  return { rmsDb: db(e / n), peakDb: 20 * Math.log10(pk + 1e-12), peak: pk, nan, dc: dcL / n, sideDb: db(side / n) };
}

function writeWav(file, out, sr = 44100) {
  const n = out.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(3, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 8, 28); buf.writeUInt16LE(8, 32); buf.writeUInt16LE(32, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) buf.writeFloatLE(out[i], 44 + i * 4);
  fs.writeFileSync(file, buf);
}

module.exports = { run, stats, writeWav, translate };
if (require.main === module) {
  const params = JSON.parse(process.argv[2] || '{}'), secs = +(process.argv[3] || 4);
  const r = run(params, secs, { events: params._events || [] }), s = stats(r.out, 0, Infinity, r.sr);
  console.log(JSON.stringify(params), 'rms', s.rmsDb.toFixed(1), 'peak', s.peakDb.toFixed(1), 'dB nan', s.nan);
  if (process.argv[4]) writeWav(process.argv[4], r.out, r.sr);
}
