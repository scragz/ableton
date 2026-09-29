// Offline harness: runs src/coagula.genexpr (mechanically translated to JS) sample by sample.
// Not Max: sample() is linear, and History reads see same-sample writes (the source is written so
// either semantics gives the same result). Params are a mutable object the caller can change.
const fs = require('fs'), path = require('path');
function translate(src) {
    src = src.replace(/\/\/[^\n]*/g, '');
    src = src.replace(/,\s*\w+="[^"]*"/g, '');
    src = src.replace(/^Param (\w+)\(([^,)]+)[^;]*;/gm, (m, n, d) => `if (P.${n} === undefined) P.${n} = ${d};`);
    src = src.replace(/^History (\w+)\(([^)]*)\);/gm, 'var $1 = $2;');
    src = src.replace(/^Data (\w+)\(([^)]*)\);/gm, 'var $1 = new Data($2);');
    src = src.replace(/^Buffer (\w+);/gm, 'var $1 = BUF.$1;');
    const params = [];
    src.replace(/if \(P\.(\w+) === undefined\)/g, (m, n) => params.push(n));
    const lines = src.split('\n'), head = [], body = [];
    for (const l of lines) (/^(var \w+ = (new |BUF\.|[-\d.]+;))|^if \(P\./.test(l) ? head : body).push(l);
    const b = body.join('\n'), locals = new Set();
    b.replace(/(?:^|[;{(]\s*)(\w+)\s*[-+*/]?=(?!=)/gm, (m, n) => locals.add(n));
    ['out1', 'out2', 'out3', 'out4'].forEach(n => locals.delete(n));
    head.join('\n').replace(/^var (\w+)/gm, (m, n) => locals.delete(n));
    return { head: head.join('\n'), body: (locals.size ? 'var ' + Array.from(locals).join(',') + ';\n' : '') + b, params };
}
function make(opts) {
    const SR = opts.sr || 44100;
    const t = translate(fs.readFileSync(path.join(__dirname, '../src/coagula.genexpr'), 'utf8'));
    const env = `
    var samplerate=${SR}, pi=Math.PI, twopi=2*Math.PI, halfpi=Math.PI/2;
    var min=Math.min,max=Math.max,abs=Math.abs,sin=Math.sin,cos=Math.cos,pow=Math.pow,exp=Math.exp,floor=Math.floor;
    function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
    function wrap(x,a,b){var r=b-a;var v=(x-a)%r;if(v<0)v+=r;return v+a;}
    function dbtoa(d){return Math.pow(10,d/20);}
    function Data(n,c){this.n=n;this.c=c;this.a=new Float64Array(n*c);}
    function dim(b){return b.frames;} function channels(b){return b.ch;}
    function peek(b,i,c){i=Math.floor(i);return b.a[i*b.c+c];}
    function poke(b,v,i,c){i=Math.floor(i);b.a[i*b.c+c]=+v;}
    function sample(b,p,c){p=Math.max(0,Math.min(b.frames-1,p));var i=Math.floor(p),f=p-i,j=Math.min(i+1,b.frames-1);return b.a[i*b.ch+c]+(b.a[j*b.ch+c]-b.a[i*b.ch+c])*f;}
    `;
    const fn = new Function('P', 'BUF', 'hook', env + t.head + `
    var _declared = true;
    step.serial = () => serial;
    return step;
    function step(n, in1) { var out1, out2, out3, out4;
    with (P) {
    ${t.body}
    }
    if (hook) hook(n, voices);
    return [out1, out2, out3, out4]; };`);
    const step = fn(opts.P, opts.BUF, opts.hook);
    return { step, SR, params: t.params, serial: () => step.serial() };
}
module.exports = { make, translate };
