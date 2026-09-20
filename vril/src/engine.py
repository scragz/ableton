"""Original GenExpr implementation of the supplied nine algorithm descriptions.
No firmware, samples, or external wavetable dependencies are used.
"""
from parameters import P

def code():
    s = r'''
// Smooth procedural waves: harmonic sum suppresses partials near Nyquist.
hash(x) { return fract(sin(x*12.9898+78.233)*43758.5453); }
randscan(x,salt) { a=floor(x); t=fract(x); t=t*t*(3-2*t); return mix(hash(a+salt),hash(a+1+salt),t); }
random2(x,y,salt) { a=floor(x); b=floor(y); t=fract(x); u=fract(y); t=t*t*(3-2*t); u=u*u*(3-2*u); return mix(mix(hash(a+b*37+salt),hash(a+1+b*37+salt),t),mix(hash(a+(b+1)*37+salt),hash(a+1+(b+1)*37+salt),t),u); }
vrilwave(p,shape,colorSet,freq) {
    a=0; norm=0;
    for(k=1;k<=12;k+=1) {
        pulse=(k%2)*2/pow(k,1.2);
        saw=(1-2*(k%2==0))/k;
        sine=(k==1);
        w=mix(mix(pulse,saw,min(1,shape*2)),sine,max(0,shape*2-1));
        color=mix(1,0.3+randscan(colorSet*9,k*17)*1.4,colorSet);
        band=1-smoothstep(samplerate*.35,samplerate*.47,k*abs(freq));
        a+=sin(p*twopi*k)*w*color*band; norm+=abs(w)*band;
    }
    return a/max(1,norm*.7);
}
// Topology-preserving state variable filter: stable under coefficient changes.
tone(x,hz,res,shape) {
    History z1(0); History z2(0);
    g=tan(pi*clamp(hz,20,samplerate*.38)/samplerate);
    k=2-1.85*clamp(res,0,1); a=1/(1+g*(g+k));
    v1=a*(z1+g*(x-z2)); v2=z2+g*v1;
    z1=fixdenorm(2*v1-z1); z2=fixdenorm(2*v2-z2);
    hp=x-k*v1-v2;
    return shape<0?mix(v2,v1,min(1,-shape)):mix(v2,hp,shape);
}
notch(x,hz,r) {
    History x1(0); History x2(0); History y1(0); History y2(0);
    c=cos(twopi*clamp(hz,30,samplerate*.4)/samplerate);
    y=(1+r)*.5*(x-2*c*x1+x2)+2*r*c*y1-r*r*y2;
    x2=x1; x1=x; y2=y1; y1=fixdenorm(y); return y;
}
// Two allpass branches form a quadrature pair for single-sideband shifting.
ap2(x,c) { History x1(0); History x2(0); History y1(0); History y2(0);
    y=c*(x+y2)-x2; x2=x1; x1=x; y2=y1; y1=y; return y; }
qshift(x,phase) {
    History previous(0);
    a=ap2(ap2(ap2(ap2(x,.161758),.733029),.94535),.990598);
    b=ap2(ap2(ap2(ap2(x,.479401),.876218),.976599),.9975);
    y=a*cos(phase*twopi)-previous*sin(phase*twopi); previous=b; return y;
}
'''
    for p in P: s+=f"Param {p['key']}({p['default']});\n"
    s+='''Param note(48); Param gate(0); Param velocity(0); Param bend(0);
History env(0); History pitch(48); History lfo(0); History shiftphase(0);
History oldalgo(0); History transition(1);
History fb1(0); History fb2(0); History fb3(0); History fb4(0);
Delay d1(524288); Delay d2(524288); Delay d3(524288); Delay d4(524288);
Delay apL(32768); Delay apR(32768); Delay chorusL(8192); Delay chorusR(8192);
'''
    for i in range(6): s+=f'History ph{i}({i*.137}); History prev{i}(0);\n'
    for p in P:
        if p['key'] not in ['algorithm','playmode','modsource']:
            s+=f"History s_{p['key']}({p['default']});\n"
    s+='sm=1-exp(-1/(samplerate*.012));\n'
    for p in P:
        if p['key'] not in ['algorithm','playmode','modsource']:
            s+=f"s_{p['key']}+=({p['key']}-s_{p['key']})*sm;\n"
    s+='''
aid=clamp(floor(algorithm),0,8);
changed=aid!=oldalgo; oldalgo=aid;
transition=changed?0:min(1,transition+1/(samplerate*.02));
pitch+=(note-pitch)*(s_glide<1?1:1-exp(-1/(samplerate*s_glide*.001)));
target=playmode>0?1:gate*velocity;
env+=(target-env)*(1-exp(-1/(samplerate*.001*(target>env?s_attack:s_release))));
lfo=wrap(lfo+s_rate/samplerate,0,1);
mod=modsource<.5?env:(modsource<1.5?sin(twopi*lfo):.1);
m=clamp(s_morph*.01+mod*s_mod_morph*.01,0,1);
b=s_basis+mod*s_mod_basis*.12;
fl=clamp(s_field*.01+mod*s_mod_field*.01,-1,1);
tm=clamp(s_time*pow(2,mod*s_mod_time*.04),5,2000);
fm=clamp(s_form*.01+mod*s_mod_form*.01,0,1);
f=clamp(440*pow(2,((playmode>0?48:pitch)+b+bend-69)/12),.1,samplerate*.22);
w=s_warp*.01; sp=s_span*.01; fu=s_fuse*.01; sc=s_scan*.01; se=s_seed*.01;
neg=max(0,-w); pos=max(0,w); fneg=max(0,-fu); fpos=max(0,fu);
cluster=aid==2||aid>=6; reflekta=aid==1||aid==5||aid==6||aid==8;
width=max(0,sp); left=0; right=0;
'''
    for i in range(6):
        s+=f'old{i}=prev{i};\n'
    for i in range(6):
        prev=(i+1)%6
        s+=f'''
// Oscillator {i+1}: each cluster position has its own pitch AND wave pair.
cl{i}=random2(m*7,se*20,{i*19+11})*2-1;
pair{i}=random2(m*7,se*20,{i*23+71});
off{i}=({i}/3-0.5)*sp*24;
if(aid>=3 && aid<=5) {{off{i}+=abs(sp)*(randscan(se*20,{i*31+5})-.5)*12;}}
if(cluster) {{off{i}=cl{i}*abs(sp)*36;}}
if(aid==6) {{ degree{i}=floor(abs(off{i})/12)*7; step{i}=floor(wrap(abs(off{i}),0,12)*7/12); sem{i}=step{i}==0?0:step{i}==1?2:step{i}==2?4:step{i}==3?5:step{i}==4?7:step{i}==5?9:11; off{i}=sign(off{i})*(floor(degree{i}/7)*12+sem{i}); }}
if(aid==0) {{off{i}={0 if i==0 else 1}*sp*24;}}
if(aid==1) {{off{i}=({1 if i==0 else 0})*sp*24;}}
partner{i}=aid<2?old{1 if i==0 else 0}:(aid==2?old{prev}:old{(i+1)%4});
xmod{i}=aid==0?-neg*partner{i}*3:(aid==1?0:pos*partner{i}*3);
fr{i}=clamp(f*pow(2,off{i}/12+xmod{i}),.1,samplerate*.38);
ph{i}=wrap(ph{i}+fr{i}/samplerate,0,1);
pm{i}=neg*partner{i}*.45;
if(aid==0||aid==3) {{pm{i}=0;}}
if(aid==2) {{pm{i}=neg*old{i}*.7;}}
if(aid==1) {{pm{i}=abs(w)*(partner{i}+({1 if i==0 else -1}*w>0?old{i}:0))*.75;}}
shape{i}=cluster?pair{i}:clamp(m+max(0,-sp)*(randscan(se*20,{i+3})-.5),0,1);
if(aid==0) {{shape{i}={"m" if i==0 else "sc"};}}
p{i}=wrap(ph{i}+pm{i}+(aid==2?noise()*fpos*.018:0),0,1);
wav{i}=vrilwave(p{i},shape{i},aid==0?0:sc,fr{i});
o{i}=mix(wav{i},sin(twopi*p{i}),aid==2);
if(aid==3) {{bits{i}=pow(2,16-neg*14); o{i}=mix(o{i},round(o{i}*bits{i})/bits{i},neg);}}
if(aid==5) {{o{i}=sin(o{i}*(1+fpos*8));}}
if(aid==0 && {i}==0) {{o{i}=mix(o{i},o{i}*old1,pos);}}
if(aid==2) {{o{i}=mix(o{i},o{i}*partner{i},sc);}}
prev{i}=o{i};
active{i}=aid<2?{1 if i==0 else 0}:(aid==2?1:{1 if i<4 else 0});
pan{i}=.5+({i%2}*2-1)*width*.45;
left+=o{i}*sqrt(1-pan{i})*active{i}; right+=o{i}*sqrt(pan{i})*active{i};
'''
    s+='''
count=aid<2?1:(aid==2?6:4);
left/=sqrt(count)*1.8; right/=sqrt(count)*1.8;
if(aid==1 || aid>=6) {left=mix(left,tanh(left*(1+fpos*10)),fpos);right=mix(right,tanh(right*(1+fpos*10)),fpos);}
chmix=aid==4?abs(fu):((aid==0||aid==2||aid>=6)?fneg:(aid==3?fpos:0));
chorusL.write(left); chorusR.write(right);
left=mix(left,chorusL.read(samplerate*(.009+.003*sin(twopi*lfo)),interp="cubic"),chmix*.5);
right=mix(right,chorusR.read(samplerate*(.013+.004*cos(twopi*lfo)),interp="cubic"),chmix*.5);
ingain=s_inputgain<=-69.99?0:pow(10,s_inputgain/20);
left=tanh(left+in1*ingain); right=tanh(right+in2*ingain);
cut=clamp(2200*pow(2,fl*5),25,samplerate*.38);
res=(aid==0||aid==3||aid==4)?fpos*.9:.12;
fshape=fl>0?fl*.8:0; if(aid==3) {fshape-=fneg;}
left=tone(left,cut,res,fshape); right=tone(right,cut,res,fshape);
if(aid==3) {left+=sin(ph0*twopi)*fneg*.18;right+=sin(ph0*twopi)*fneg*.18;}
left=notch(notch(left,180+randscan(se*20,34)*2600,.98),500+randscan(se*20,87)*5400,.975);
right=notch(notch(right,190+randscan(se*20,59)*2600,.98),510+randscan(se*20,113)*5400,.975);
// VCA precedes both delay structures, preserving tails after note-off.
v=env*s_vca*.01; dryL=left*v; dryR=right*v;
base=tm*.001*samplerate;
audiomod=(aid==1||aid==5)?fneg*.018*samplerate*prev0:0;
r1=d1.read(clamp(base*(.43+randscan(se*20,2)*.19)+audiomod,4,524280),interp="cubic");
r2=d2.read(clamp(base*(.61+randscan(se*20,7)*.23)-audiomod,4,524280),interp="cubic");
r3=d3.read(clamp(base*(.79+randscan(se*20,13)*.17)+audiomod*.7,4,524280),interp="cubic");
r4=d4.read(clamp(base*(1.01+randscan(se*20,19)*.27)-audiomod*.7,4,524280),interp="cubic");
// Orthogonal feedback matrix grows diffusion as FORM increases.
density=reflekta?.35+fm*.65:fm;
a1=mix(r1,(r1+r2+r3+r4)*.5,density);
a2=mix(r2,(r1-r2+r3-r4)*.5,density);
a3=mix(r3,(r1+r2-r3-r4)*.5,density);
a4=mix(r4,(r1-r2-r3+r4)*.5,density);
shiftHz=sign(s_cell)*pow(abs(s_cell)*.01,2)*1400;
shiftphase=wrap(shiftphase+shiftHz/samplerate,0,1);
s1=qshift(a1,shiftphase); s2=qshift(a2,shiftphase); s3=qshift(a3,shiftphase); s4=qshift(a4,shiftphase);
feedmix=s_feed>=0?.5:1;
// CELL at zero bypasses the quadrature network for a transparent neutral point.
shiftamt=min(1,abs(s_cell)*10);
f1=mix(a1,mix(a1,s1,feedmix),shiftamt); f2=mix(a2,mix(a2,s2,feedmix),shiftamt);
f3=mix(a3,mix(a3,s3,feedmix),shiftamt); f4=mix(a4,mix(a4,s4,feedmix),shiftamt);
damp=.08+(1-fm)*.6;
fb1+=damp*(f1-fb1); fb2+=damp*(f2-fb2); fb3+=damp*(f3-fb3); fb4+=damp*(f4-fb4);
feedback=min(.985,abs(s_feed)*.00985);
d1.write(tanh(dryL*.65+fb1*feedback)); d2.write(tanh(dryR*.65+fb2*feedback));
d3.write(tanh(dryR*.45+fb3*feedback)); d4.write(tanh(dryL*.45+fb4*feedback));
wetL=(r1+r3)*.65; wetR=(r2+r4)*.65;
// Reflekta uses an extra modulated allpass diffuser, Dungeon retains metallic taps.
atL=apL.read(clamp(samplerate*(.003+fm*.031)+audiomod*.3,2,32760),interp="cubic");
atR=apR.read(clamp(samplerate*(.0043+fm*.037)-audiomod*.3,2,32760),interp="cubic");
apc=reflekta?.65*fm:0;
azL=wetL+atL*apc; azR=wetR+atR*apc;
apL.write(azL); apR.write(azR); wetL=atL-azL*apc; wetR=atR-azR*apc;
blend=clamp(s_mix*.01,0,1); gain=s_output<=-69.99?0:pow(10,s_output/20);
out1=tanh(dcblock((dryL*cos(blend*pi*.5)+wetL*sin(blend*pi*.5)))*gain)*transition;
out2=tanh(dcblock((dryR*cos(blend*pi*.5)+wetR*sin(blend*pi*.5)))*gain)*transition;
'''
    return s
