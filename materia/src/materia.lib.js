// Pure integer/table/routing functions shared with the reference checks.
var Materia = (function () {
 var counts=[16,32,256,256,32,64,8], offsets=[0,4096,12288,77824,143360,151552,167936];
 function lcg(x){return (x*1664525+1013904223)%16777216;}
 function reverse(x){var y=0;for(var b=0;b<8;b++)y|=((x>>b)&1)<<(7-b);return y;}
 function parity(x){x^=x>>4;x^=x>>2;x^=x>>1;return x&1;}
 function rot(x,b){return ((x<<b)|(x>>(8-b)))&255;}
 function identity(k,n){if(k===0)return n;if(k===1)return reverse(n);if(k===2)return n^(n>>1);if(k===3){var x=n;for(var s=1;s<8;s*=2)x^=x>>s;return x;}if(k<12)return rot(n,k-4);if(k===12)return parity(n)*255;if(k===13)return 255-n;if(k===14)return (n&15)*17;return (n>>4)*17;}
 function table(f,k,n){
  if(f===0)return identity(k,n);
  if(f===1){var t=(n/255*(k+1))%1;return Math.floor((1-Math.abs(2*t-1))*255+.5);}
  if(f===2||f===3){var w=f===2?reverse(k^(k>>1)):k;return parity(w&n)*255;}
  if(f===4){var x=n/255,v=0,group=Math.floor(k/8),q=k%8+1;
   if(group===0)v=(Math.sin(x*Math.PI*2*q)+1)/2;
   if(group===1)v=Math.pow(x,q);
   if(group===2)v=Math.floor(x*q)/q;
   if(group===3)v=1-Math.abs(2*((x*q)%1)-1);
   return Math.max(0,Math.min(255,Math.floor(v*255+.5)));
  }
  if(f===5){if(k<32){var steps=8*(1+Math.floor(k/8)),pulses=k%8+1;return ((Math.floor(n*steps/256)*pulses)%steps)<pulses?255:0;}var seed=lcg(lcg(k+1)+n);return seed/16777216<((k-32)+1)/33?255:0;}
  return n;
 }
 function tables(){var a=[];for(var f=0;f<7;f++)for(var k=0;k<counts[f];k++)for(var n=0;n<256;n++)a.push(table(f,k,n));return a;}
 function matrix(preset,seed){var a=[],b;for(b=0;b<8;b++)a.push(1<<b);if(preset===1)a.reverse();if(preset===2)for(b=0;b<8;b++)a[b]=(1<<b)|(b<7?1<<(b+1):0);if(preset===3)for(b=0;b<8;b++)a[b]=1<<((b+7)%8);if(preset===4)for(b=7;b>0;b--){seed=lcg(seed);var j=seed%(b+1),tmp=a[b];a[b]=a[j];a[j]=tmp;}return a;}
 // Graph edges run from producer to consumer. Fixed-order DFS marks the consumer
 // input on each back edge, so LP1<->LP2 delays LP1.src as specified in T9.
 function delays(p){
  var nodes=['l1','l2','g','j','p','m'],bus={7:'l1',8:'l2',9:'g',10:'j',13:'p',14:'p',15:'m'},fields={l1:['src','gate'],l2:['src','gate'],g:['src','gate'],j:['src'],p:['a','b','bus'],m:['src']},edges={},color={},flags={};
  nodes.forEach(function(n){edges[n]=[];color[n]=0;});
  nodes.forEach(function(n){fields[n].forEach(function(f){var key=n+'_'+f;flags[key]=0;
   if(n==='j' && p.j_sync && f==='src')return;
   if(n==='p' && f==='bus' && p.p_mode!==1)return;
   var producer=bus[p[key]];
   if(producer==='j' && p.j_sync)return;
   if(producer)edges[producer].push({to:n,key:key});
  });});
  function dfs(n){color[n]=1;edges[n].forEach(function(e){if(color[e.to]===1)flags[e.key]=1;else if(color[e.to]===0)dfs(e.to);});color[n]=2;}
  nodes.forEach(function(n){if(!color[n])dfs(n);});return flags;
 }
 function clearState(s,mode){var a=s.slice();if(mode===2)return Array(320).fill(0);if(mode===1){for(var i=0;i<132;i++)a[i]=0;}return a;}
 return {counts:counts,offsets:offsets,lcg:lcg,reverse:reverse,parity:parity,rot:rot,table:table,tables:tables,matrix:matrix,delays:delays,clearState:clearState};
})();
if(typeof module!=='undefined')module.exports=Materia;
