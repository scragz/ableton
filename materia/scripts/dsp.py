"""Generate the single GenExpr graph. State addresses are versioned and documented."""
from schema import P
S=[]
def emit(s):S.append(s)
def get(a):return f'peek(state, {a}, 0)'
def put(a,v):return f'poke(state, {v}, {a}, 0);'
# State 0..160 follows spec; 161+ extends clock/data delays to all 22 buses.
# 205..: filter memories, phases, exact phase words, snapshot/command plumbing.
N=320
PARAM_EXTRA={'playing':0,'vector_size':64,'restore_request':0,'snap_request':0,'clear1':0,'clear2':0,'ready':0}
COMB=[('l1',7,['src','gate']),('l2',8,['src','gate']),('g',9,['src','gate']),('j',10,['src']),('p',13,['a','b','bus']),('m',15,['src'])]
def source(p,k,clock=False,delayed=False):
 field='c' if clock else 'd';name=p+'_'+k
 expr=f'selector(floor({name})+1, '+', '.join(field+str(i) for i in range(22))+')'
 if delayed:return f'((race_mode == 0 && delay_{name} > 0) ? peek(state, {183 if clock else 161}+floor({name}), 0) : {expr})'
 return expr

def settle(tag):
 emit(f'// {tag}: six relaxations plus one convergence check.\nrace_{tag}=0;')
 emit('for (pass=0; pass<7; pass+=1) {')
 for i in [7,8,9,10,13,14,15]:emit(f'old_d{i}=d{i}; old_c{i}=c{i};')
 for p,num,_ in COMB:
  if p in ['l1','l2','g']:
   a=source(p,'src',delayed=True);gate=source(p,'gate',delayed=True)
   emit(f'{p}gv=rot8({gate}, floor({p}_rot)); {p}gv=bxor({p}gv, {p}_inv > 0 ? 255 : 0);')
   mask=' + '.join(f'floor({p}_b{i})*{2**i}' for i in range(8))
   emit(f'{p}sm={mask};')
   if p=='g':emit(f'{p}mask=bor({p}sm,{p}gv); {p}x={a}; d{num}=selector(floor(g_law)+1, band({p}x,{p}mask),bor({p}x,{p}mask),bxor({p}x,{p}mask),255-band({p}x,{p}mask));')
   else:emit(f'{p}mask={p}_law == 0 ? bor({p}sm,{p}gv) : bxor({p}sm,{p}gv); d{num}=bxor({a},{p}mask);')
   emit(f'c{num}={source(p,"src",True,True)};')
  if p=='j':
   emit(f'jx={source("j","src",delayed=True)}; jf=floor(j_family); jcount=selector(jf+1,16,32,256,256,32,64,8); jt=min(floor(j_table),jcount-1); jo=selector(jf+1,0,4096,12288,77824,143360,151552,167936); jv=floor(mix(peek(tables,jo+jt*256+jx,0),peek(tables,jo+min(jt+1,jcount-1)*256+jx,0),j_morph)+0.5); d10=j_sync>0 ? {get(138)} : clamp(jv,0,255); c10={source("j","src",True,True)};')
  if p=='p':
   emit(f'ps=p_mode==0 ? floor(p_sel) : (p_mode==2 ? {get(139)} : bit8({source("p","bus",delayed=True)},floor(p_bit)));')
   emit(f'pa={source("p","a",delayed=True)}; pb={source("p","b",delayed=True)}; pac={source("p","a",True,True)}; pbc={source("p","b",True,True)}; d13=ps>0 ? pb : pa; d14=ps>0 ? pa : pb; c13=ps>0 ? pbc : pac; c14=ps>0 ? pac : pbc;')
  if p=='m':
   emit(f'mx={source("m","src",delayed=True)}; d15=0; for(mi=0;mi<8;mi+=1) {{ mv=band(mx,peek(matrix,mi,0)); mb=m_mode==0 ? (mv>0) : parity8(mv); d15+=mb*pow(2,mi); }} c15={source("m","src",True,True)};')
 emit('changed='+' || '.join(f'(old_d{i}!=d{i} || old_c{i}!=c{i})' for i in [7,8,9,10,13,14,15])+'; if (!changed) { break; }')
 emit('if (pass==6) {')
 for i in [7,8,9,10,13,14,15]:
  emit(f'rd=bxor(old_d{i},d{i}); rc=old_c{i}!=c{i}; race_{tag}=max(race_{tag},rd>0 || rc); if(race_mode==2 && (rd>0 || rc)) {{ rng=lcg(rng); d{i}=bxor(band(d{i},255-rd),band(floor(rng/65536),rd)); c{i}=rc ? bit8(floor(rng/65536),0) : c{i}; }}')
 emit('} }')

def build():
 S.clear()
 emit('''// Materia v0.2: integer buses, simultaneous registers, explicit loop delays.
bit8(v,b) { return mod(floor(v/pow(2,b)),2); }
band(a,b) { return bit8(a,0)*bit8(b,0)*1 + bit8(a,1)*bit8(b,1)*2 + bit8(a,2)*bit8(b,2)*4 + bit8(a,3)*bit8(b,3)*8 + bit8(a,4)*bit8(b,4)*16 + bit8(a,5)*bit8(b,5)*32 + bit8(a,6)*bit8(b,6)*64 + bit8(a,7)*bit8(b,7)*128; }
bor(a,b) { return a+b-band(a,b); }
bxor(a,b) { return a+b-2*band(a,b); }
rot8(a,n) { return mod(floor(a)*pow(2,n),256)+floor(a/pow(2,8-n)); }
parity8(v) { t=0; for(i=0;i<8;i+=1) { t+=bit8(v,i); } return mod(t,2); }
lcg(v) { return mod(v*1664525+1013904223,16777216); }
Buffer state("materia_state");
Buffer tables("materia_jena");
Buffer matrix("materia_matrix");
Buffer meters("materia_meters");
Buffer exchange("materia_exchange");
''')
 for p in P:emit(f'Param {p["key"]}({int(p["default"]) if isinstance(p["default"],bool) else p["default"]});')
 for k,v in PARAM_EXTRA.items():emit(f'Param {k}({v});')
 for p,_,ks in COMB:
  for k in ks:emit(f'Param delay_{p}_{k}(0);')
 emit('''// Restore mailbox is written completely before its request token is changed.
if (restore_request != peek(exchange, 0, 0)) {
 for(i=0;i<320;i+=1) { poke(state,peek(exchange,32+i,0),i,0); }
 poke(exchange,restore_request,0,0);
}
start=playing>0 && peek(state,242,0)==0;
if(start && recall_on_play>0 && peek(exchange, 4+floor(recall_on_play),0)>0) {
 slotbase=1024+floor(recall_on_play-1)*320;
 for(i=0;i<320;i+=1) { poke(state,peek(exchange,slotbase+i,0),i,0); }
}
poke(state,playing,242,0);
''')
 for n,b,wi,hold,flag in [(1,0,64,65,250),(2,66,130,131,251)]:
  emit(f'if(clear{n} != {get(flag)}) {{ for(i={b};i<{b+64};i+=1) {{ {put("i",0)} }} {put(wi,0)} {put(hold,0)} {put(flag,f"clear{n}")} }}')
 emit('rng=peek(state,143,0); jv=0; daone=0; dbone=0;')
 for i in range(22):emit(f'd{i}=0; c{i}=0;')
 emit('d1=floor(constant);')
 emit('c16=playing>0 && in3<0.5; ip=wrap(peek(state,220,0)+min(iclk_rate,samplerate/2)/samplerate,0,1); poke(state,ip,220,0); c17=ip<0.5;')
 # Prior output bus state for source-stage sync. Updated registered holds below.
 for i in range(2,16):emit(f'd{i}=peek(state,{161+i},0); c{i}=peek(state,{183+i},0);')
 emit(f'bs={source("ber","sync",True)}; bp={get(140)}+{get(221)} / 16777216+{get(222)} / 281474976710656; fm=selector(floor(ber_fm)+1,0,{get(218)},{get(219)},(in1+in2)*0.5); bf=clamp(ber_freq*pow(2,ber_fine/1200)*pow(2,fm*ber_amt*4),0,samplerate/2); bp=wrap(bp+bf/samplerate,0,1); if(bs>0 && {get(145)}==0) {{bp=0;}} {put(145,"bs")}')
 # exact double decomposed into high float plus 24bit fractional residual words; hi floor phase*2^24 /2^24, mid etc
 emit('bhi=floor(bp*16777216)/16777216; bmid=floor((bp-bhi)*281474976710656)/16777216; blo=(bp-bhi-bmid/16777216)*281474976710656; poke(state,bhi,140,0); poke(state,bmid,221,0); poke(state,blo,222,0); d4=floor(bp*256); c4=ber_mode==0 ? (bf*256>samplerate/2 ? 1-peek(state,187,0) : mod(floor(bp*512),2)) : bp<0.5;')
 for n,hold,phase,prev in [(1,136,223,146),(2,137,226,147)]:
  p=f'a{n}'
  emit(f'{p}x=(selector(floor({p}_in)+1,in1,in2,(in1+in2)*0.5,(in1-in2)*0.5)+{p}_offset)*pow(10,{p}_gain/20); {p}u={p}_range==0 ? ({p}x+1)*0.5 : {p}x; {p}q=floor(clamp({p}u,0,1)*255+0.5); {p}ph=wrap({get(phase)}+min({p}_rate,samplerate/2)/samplerate,0,1); {put(phase,p+"ph")} c{n+1}=selector(floor({p}_mode)+1,1-{get(prev)}, {p}ph<0.5, {source(p,"clk",True)}, {p}x>=0); d{n+1}={get(hold)};')
 for num,addr,p in [(5,132,'e1'),(6,134,'e2')]:emit(f'd{num}={get(addr)}; c{num}={source(p,"clk",True)}; c{num+13}={get(addr+1)};')
 for num,addr,p in [(11,65,'r1'),(12,131,'r2')]:emit(f'd{num}={get(addr)}; c{num}={source(p,"clk",True)};')
 settle('pre')
 # Settled clock levels for registered module aliases. Their sources may be combinational.
 for num,p in [(5,'e1'),(6,'e2'),(11,'r1'),(12,'r2')]:emit(f'c{num}={source(p,"clk",True)};')
 for n,hold,prev in [(1,136,146),(2,137,147)]:
  emit(f'if(a{n}_mode==2) {{ c{n+1}={source(f"a{n}","clk",True)}; }} na{n}=(a{n}_mode==0 || (c{n+1}>0 && {get(prev)}==0)) ? a{n}q : d{n+1};')
 # Registers compute only locals until all next states are computed.
 for n,addr,pr,rr in [(1,132,148,149),(2,134,150,151)]:
  p=f'e{n}';emit(f'{p}c={source(p,"clk",True)}; {p}re=bit8({source(p,"reset")},floor({p}_rbit)); n{p}={get(addr)}; n{p}o={get(addr+1)}; if({p}c>0 && {get(pr)}==0) {{ if({p}re>0 && {get(rr)}==0) {{n{p}=0;}} {p}s={p}_src==1 ? floor({p}_step) : {source(p,"src")}; {p}up=bxor({p}_dir==0,bit8({source(p,"gate")},floor({p}_bit))); {p}sum=n{p}+({p}up>0 ? {p}s : -{p}s); n{p}=mod({p}sum+256,256); n{p}o={p}sum<0 || {p}sum>255; }}')
 for n,b,wi,ho,pr,seedaddr in [(1,0,64,65,152,141),(2,66,130,131,153,142)]:
  p=f'r{n}';emit(f'{p}c={source(p,"clk",True)}; {p}edge={p}c>0 && {get(pr)}==0; n{p}={get(ho)}; {p}w={get(wi)}; {p}rng={get(seedaddr)}; {p}input={source(p,"src")}; if({p}_seed!={get(252+n)}) {{ {p}rng=floor({p}_seed); }} {p}store=0; {p}value=0; if({p}edge && {p}_mode!=3) {{ {p}delay=floor({p}_length); if({p}_mode==2) {{ {p}rng=lcg({p}rng); {p}delay=1+mod({p}rng,{p}delay); }} n{p}={p}_mode==0 ? ({p}delay==1 ? {p}input : peek(state,{b}+mod({p}w-{p}delay+65,64),0)) : peek(state,{b}+mod({p}w-{p}delay+64,64),0); {p}value={p}_mode==1 ? n{p} : {p}input; {p}store=1; }}')
 emit(f'jc={source("j","clk",True)}; nj=(j_sync>0 && jc>0 && {get(154)}==0) ? jv : {get(138)}; pc={source("p","clk",True)}; np=(p_mode==2 && pc>0 && {get(155)}==0) ? bit8({source("p","bus")},floor(p_bit)) : {get(139)};')
 emit('// Simultaneous commit: no register sees another register\'s new data.')
 for n,hold,prev in [(1,136,146),(2,137,147)]:emit(put(hold,f'na{n}')+put(prev,f'c{n+1}')+f'd{n+1}=na{n};')
 for n,addr,pr,rr in [(1,132,148,149),(2,134,150,151)]:
  p=f'e{n}';emit(put(addr,'n'+p)+put(addr+1,'n'+p+'o')+put(pr,p+'c')+put(rr,p+'re')+f'd{n+4}=n{p}; c{n+4}={p}c; c{n+17}=n{p}o;')
 for n,b,wi,ho,pr,seedaddr in [(1,0,64,65,152,141),(2,66,130,131,153,142)]:
  p=f'r{n}';emit(f'if({p}store) {{ poke(state,{p}value,{b}+{p}w,0); {put(wi,f"mod({p}w+1,64)")} }} '+put(ho,'n'+p)+put(pr,p+'c')+put(seedaddr,p+'rng')+put(252+n,p+'_seed')+f'd{n+10}=n{p}; c{n+10}={p}c;')
 emit(put(138,'nj')+put(139,'np')+put(154,'jc')+put(155,'pc'))
 settle('post')
 emit(put(143,'rng'))
 for i in range(22):emit(put(161+i,f'd{i}')+put(183+i,f'c{i}')+f'poke(meters,d{i},{i*2},0); poke(meters,c{i},{i*2+1},0);')
 for n,base in [('a',205),('b',211)]:
  p='d'+n
  emit(f'{p}v={source(p,"src")}; {p}rng=floor({p}_seed);')
  for i in range(8):
   emit(f'{p}rng=lcg({p}rng); {p}wt{i}=pow(2,{i})*({p}_wmode==0 ? 1 : ({p}_wmode==1 ? 1+{p}_tol*0.01*({p}rng/8388607.5-1) : {p}_w{i}));')
  emit(f'{p}sum='+ '+'.join(f'bit8({p}v,{i})*{p}wt{i}' for i in range(8))+'; '+f'{p}den='+ '+'.join(f'abs({p}wt{i})' for i in range(8))+';')
  emit(f'{p}unit={p}den>0 ? {p}sum/{p}den : 0; {p}raw=({p}_range==0 ? {p}unit*2-1 : {p}unit)*({p}_gain<=-80 ? 0 : pow(10,{p}_gain/20)); {p}coef=1-exp(-twopi*min({p}_cutoff,samplerate*0.49)/samplerate);')
  for i in range(4):
   prev=p+'raw' if i==0 else p+f'lp{i-1}'
   emit(f'{p}lp{i}={get(base+i)}+{p}coef*({prev}- {get(base+i)}); '+put(base+i,p+f'lp{i}'))
  emit(f'{p}filtered=selector(floor({p}_filt)+1,{p}raw,{p}lp0,{p}lp3); {p}blocked={p}filtered- {get(base+4)}+0.995*{get(base+5)}; '+put(base+4,p+'filtered')+put(base+5,p+'blocked')+f' {p}y={p}_dc>0 ? {p}blocked : {p}filtered;')
 emit(put(218,'day')+put(219,'dby'))
 emit('out1=ready*((da_dest!=1 ? day : 0)+(db_dest!=1 ? dby : 0)); out2=ready*((da_dest!=0 ? day : 0)+(db_dest!=0 ? dby : 0));')
 for n in range(1,5):
  p=f't{n}';emit(f'{p}d={source(p,"src")}; {p}v=selector(floor({p}_kind)+1,{p}d/255,bit8({p}d,floor({p}_bit)),band({p}d,floor({p}_mask))>0); out{n+2}=clamp({p}_min+({p}_max-{p}_min)*{p}v*{p}_depth,0,1);')
 emit('poke(meters,max(race_pre,race_post),44,0); poke(meters,(ber_mode==0)&&(bf*256>samplerate/2),45,0); poke(meters,samplerate,46,0);')
 emit('''// Publish a double-bank snapshot once per vector. Reader validates sequence.
count=peek(exchange,1,0);
if(count<=0 || snap_request!=peek(exchange,2,0)) {
 seq=mod(peek(exchange,3,0)+1,16777216); bank=mod(seq,2); base=2048+bank*320;
 for(i=0;i<320;i+=1) { poke(exchange,peek(state,i,0),base+i,0); }
 poke(exchange,seq,3,0); poke(exchange,snap_request,2,0); count=max(vector_size,1);
}
poke(exchange,count-1,1,0);
''')
 import re
 return re.sub(r'([?:])', r' \1 ', '\n'.join(S)).replace('-peek', '- peek').replace('+peek', '+ peek').replace('!=peek', '!= peek').replace('==peek', '== peek')+'\n'
if __name__=='__main__':
 from pathlib import Path
 Path(__file__).resolve().parents[1].joinpath('src/materia.genexpr').write_text(build())
