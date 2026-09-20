// Numerical smoke test of the GenExpr after parsing with Cycling '74's bundled
// parser. This C++ harness is NOT Max/Live compilation or host verification.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const vendor='/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/Max/Max.app/Contents/Resources/C74/packages/RNBO/server/node_modules/@rnbo/genexpr_js/genbo.js';
const root=path.resolve(__dirname,'..');
const source=cp.execFileSync('python3',['-B','-c',"import sys;sys.path.insert(0,'src');from engine import code;print(code())"],{cwd:root,encoding:'utf8'});
// The bundled experimental parser has a known local precedence defect in
// chains such as a-b*c*d. Check the source with it, then correct only that
// grammar reduction in memory for the numerical harness (never vendor files).
require(vendor).parse(source);
const Module=require('node:module');
const sandbox=new Module(vendor);sandbox.filename=vendor;sandbox.paths=Module._nodeModulePaths(path.dirname(vendor));
const originalRequire=sandbox.require.bind(sandbox);
sandbox.require=function(name){if(name!=='fs')return originalRequire(name);return {...fs,readFileSync(file,...args){let text=fs.readFileSync(file,...args);if(String(file).endsWith('genexpr.pegjs')){
const start=text.indexOf('function normalizeBinaryExpression('),end=text.indexOf('\n\t}',start)+3;
text=text.slice(0,start)+`function normalizeBinaryExpression(first,rest){
 var values=[first],ops=[];
 function reduce(){var op=ops.pop(),right=values.pop(),left=values.pop();values.push({type:"BinaryExpression",operator:op,left:left,right:right});}
 for(var i=0;i<rest.length;i++){while(ops.length && operator_precedence[ops[ops.length-1]]<=operator_precedence[rest[i].op])reduce();ops.push(rest[i].op);values.push(rest[i].val);}
 while(ops.length)reduce();return values[0];
 }`+text.slice(end);}return text;}};};
sandbox._compile(fs.readFileSync(vendor,'utf8'),vendor);
const ast=sandbox.exports.parse(source);
let fields=[];
function emit(n){if(!n)return '';switch(n.type){
case 'Program':return n.body.map(emit).join('\n');
case 'BlockStatement':return '{\n'+n.body.map(emit).join('\n')+'\n}';
case 'FunctionDeclaration':return 'void process()'+emit(n.body);
case 'Identifier':return n.name==='in1'?'input1':n.name==='in2'?'input2':n.name;
case 'Literal':return typeof n.value==='number'?String(n.value)+(/[.eE]/.test(String(n.value))?'':'.0'):JSON.stringify(n.value);
case 'VariableDeclaration':return n.declarations.map(d=>{
 let key=emit(d.id),v=d.init;
 if(v?.type==='NewExpression'){
  let kind=v.callee.name,args=v.arguments.filter(a=>a.type!=='ObjectExpression').map(emit).join(',');
  fields.push((kind==='history'||kind==='Param'?'double':kind)+' '+key+'{'+args+'};');return '';
 }
 return 'double '+key+' = '+(v?emit(v):'0')+';';}).join('\n');
case 'ExpressionStatement':return emit(n.expression)+';';
case 'BinaryExpression':return n.operator==='%'?'fmod('+emit(n.left)+','+emit(n.right)+')':'('+emit(n.left)+n.operator+emit(n.right)+')';
case 'AssignmentExpression':return '('+emit(n.left)+n.operator+emit(n.right)+')';
case 'UnaryExpression':return '('+n.operator+emit(n.argument)+')';
case 'ConditionalExpression':return '('+emit(n.test)+' ? '+emit(n.consequent)+' : '+emit(n.alternate)+')';
case 'CallExpression':return n.callee.name==='samplerate'?'sr':(n.callee.type==='Identifier'?'::':'')+emit(n.callee)+'('+n.arguments.filter(a=>a.type!=='ObjectExpression').map(emit).join(',')+')';
case 'MemberExpression':return emit(n.object)+'.'+emit(n.property);
case 'IfStatement':return 'if('+emit(n.test)+')'+emit(n.consequent)+(n.alternate?'else '+emit(n.alternate):'');
case 'ForStatement':return 'for('+emit(n.init).replace(/;$/,'')+';'+emit(n.test)+';'+emit(n.update)+')'+emit(n.body);
default:throw Error('Unsupported AST '+n.type);
}}
const processCode=emit(ast);
let cpp=`#include <cmath>
#include <vector>
#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <cstdint>
using std::sin;using std::cos;using std::exp;using std::pow;using std::floor;using std::round;using std::abs;using std::sqrt;using std::tan;using std::tanh;
constexpr double pi=3.141592653589793,twopi=2*pi;
double min(double a,double b){return std::min(a,b);} double max(double a,double b){return std::max(a,b);}
double clamp(double x,double a,double b){return max(a,min(x,b));}
double mix(double a,double b,double t){return a+(b-a)*t;} double fract(double x){return x-floor(x);}
double wrap(double x,double a,double b){return a+(b-a)*fract((x-a)/(b-a));}
double sign(double x){return x<0?-1:x>0?1:0;}
double fixdenorm(double x){return abs(x)<1e-30?0:x;}
double smoothstep(double a,double b,double x){double t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);}
struct noise {uint32_t s=897321;double next(){s^=s<<13;s^=s>>17;s^=s<<5;return s/2147483648.-1;}};
struct dcblock{double x=0,y=0;double next(double v){double o=v-x+.9997*y;x=v;y=o;return o;}};
struct delay{std::vector<double>b;int p=0;delay(double n):b(static_cast<int>(n),0){} void write(double v){b[p]=v;}void step(){p=(p+1)%b.size();}
 double read(double t){double pos=wrap(p-t,0,b.size());int j=floor(pos);double f=pos-j;auto at=[&](int k){return b[(k+(int)b.size())%(int)b.size()];};
 double a=at(j-1),c=at(j),d=at(j+1),e=at(j+2);return c+.5*f*(d-a+f*(2*a-5*c+4*d-e+f*(3*(c-d)+e-a)));}};
struct Synth{double input1=0,input2=0,out1=0,out2=0,sr=48000;
${fields.join('\n')}
${processCode}
};
struct Stats{double rms,peak,stereo;};
Stats render(Synth&s,double seconds){double sum=0,peak=0,stereo=0;int n=seconds*s.sr;for(int i=0;i<n;i++){s.process();if(!std::isfinite(s.out1)||!std::isfinite(s.out2))throw std::runtime_error("non-finite audio");sum+=s.out1*s.out1;peak=max(peak,max(abs(s.out1),abs(s.out2)));stereo+=pow(s.out1-s.out2,2);}return {sqrt(sum/n),peak,sqrt(stereo/n)};}
int main(){int count=0;for(double sr:{44100.,48000.,96000.})for(int mode=0;mode<9;mode++)for(int extreme:{-1,0,1}){
 Synth s;s.sr=sr;s.algorithm=mode;s.playmode=1;s.span=45;
 if(extreme){s.warp=extreme*90;s.span=extreme*85;s.fuse=extreme*90;s.feed=extreme*99;s.cell=extreme*55;s.seed=78;s.scan=83;s.form=90;}
 auto r=render(s,.45);if(r.rms<.00001||r.peak>1.00001)throw std::runtime_error("silent or unbounded algorithm: mode="+std::to_string(mode)+" sr="+std::to_string(sr)+" extreme="+std::to_string(extreme)+" rms="+std::to_string(r.rms)+" peak="+std::to_string(r.peak)+" env="+std::to_string(s.env)+" phase="+std::to_string(s.ph0)+" osc="+std::to_string(s.prev0)+" gain="+std::to_string(s.s_output));
 std::cout<<"mode="<<mode+1<<" sr="<<sr<<" extreme="<<extreme<<" rms="<<r.rms<<" peak="<<r.peak<<" stereo="<<r.stereo<<"\\n";count++;}
 Synth midi;midi.gate=1;midi.velocity=.8;midi.note=60;midi.mix=0;auto on=render(midi,.3);midi.gate=0;midi.release=5;render(midi,.3);auto off=render(midi,.15);if(on.rms<.001||off.rms>.00001)throw std::runtime_error("MIDI envelope release");
 Synth muted;muted.playmode=1;muted.output=-70;render(muted,.3);if(render(muted,.1).peak>1e-12)throw std::runtime_error("output mute");
 Synth vca;vca.playmode=1;vca.vca=0;vca.mix=0;render(vca,.3);if(render(vca,.1).peak>.00001)throw std::runtime_error("VCA mute");
 std::cout<<"PASS "<<count<<" algorithm/rate/extreme cases + MIDI release and mute checks (numerical harness, not host validation)\\n";
}
`;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'vril-dsp-'));
try{fs.writeFileSync(path.join(temp,'check.cpp'),cpp);cp.execFileSync('clang++',['-std=c++17','-O2','-Wno-parentheses-equality',path.join(temp,'check.cpp'),'-o',path.join(temp,'check')],{stdio:'pipe'});const result=cp.execFileSync(path.join(temp,'check'),[],{encoding:'utf8',timeout:120000});console.log(result.trim().split('\n').slice(-1).join('\n'));}
catch(e){console.error(e.stderr?.toString()||e.message);process.exitCode=1;}
finally{fs.rmSync(temp,{recursive:true,force:true});}
