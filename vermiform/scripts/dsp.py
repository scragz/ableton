"""Generate explicit Gen histories; filter computation stays on the audio thread."""
def code():
    s='''// Vermiform: original seven-core speech engine, fixed-rate historic voice clock.
resonator(x,hz,bw,step) {
 History z1(0); History z2(0);
 r=exp(-pi*clamp(bw,20,1500)/8000);
 a=2*r*cos(twopi*clamp(hz,80,3750)/8000);
 v=fixdenorm(clamp(x*(1-r)+a*z1-r*r*z2,-16,16));
 if(step){z2=z1;z1=v;}
 return z1;
}
Param core(0); Param speed(1); Param pitch(120); Param voiced(1); Param energy(.6);
Param gate(0); Param switchgate(1); Param output(-12); Param width(.35); Param velocity(.8);
Param compost(0); Param freeze(0); Param start(0); Param length(.4); Param window(0);
Param triggerid(0); Param phone(0); Param quant(256); Param bits(16); Param drive(1);
Param nasal(0); Param parallel(0); Param rot(0); Param rotindex(0);
Buffer segments;
Buffer scopes;
Data ring(524288,2);
Data coefficients(10);
History zx1(0); History zx2(0);
History clk(0); History phase(0); History previousTrigger(0);
History wp(0); History rp(0); History samplesStored(0);
History gain(0); History switchGain(0); History held(0); History filterOutput(0);
History spitch(120); History svoice(1); History senergy(0);
History sf1(730); History sf2(1090); History sf3(2440); History sf4(3300); History sf5(3650);
History sb1(65); History sb2(95); History sb3(130); History sb4(200); History sb5(260);
History sk1(0); History sk2(0); History sk3(0); History sk4(0); History sk5(0);
History sk6(0); History sk7(0); History sk8(0); History sk9(0); History sk10(0);
History l1(0); History l2(0); History l3(0); History l4(0); History l5(0);
History l6(0); History l7(0); History l8(0); History l9(0); History l10(0);
Delay stereo(4096);
'''
    for i in range(1,11):s+=f'Param k{i}(0);\n'
    for i,(f,b) in enumerate(zip([730,1090,2440,3300,3650],[65,95,130,200,260]),1):s+=f'Param f{i}({f}); Param b{i}({b});\n'
    s+='''
sm=1-exp(-1/(samplerate*.006));
gain+=(gate*velocity*pow(10,output/20)-gain)*sm;
switchGain+=(switchgate-switchGain)*(1-exp(-1/(samplerate*.002)));
spitch+=(pitch-spitch)*sm;svoice+=(voiced-svoice)*sm;senergy+=(energy-senergy)*sm;
'''
    for i in range(1,11):s+=f'sk{i}+=(clamp(k{i},-.985,.985)-sk{i})*sm;poke(coefficients,sk{i},{i-1});\n'
    for i in range(1,6):s+=f'sf{i}+=(f{i}-sf{i})*sm;sb{i}+=(b{i}-sb{i})*sm;\n'
    s+='''
clockNext=clk+min(.95,8000*speed/samplerate);
step=clockNext>=1;clk=wrap(clockNext,0,1);
trig=triggerid != previousTrigger;previousTrigger=triggerid;
if(trig){phase=0;rp=0;}
if(step){phase=wrap(phase+spitch/8000,0,1);}
// A band-limited-at-the-voice-clock harmonic glottis; noise is held at the same clock.
pulse=(phase<spitch/8000?1:0)-spitch/8000;
if(step){held=noise();}
excitation=mix(held*.35,pulse,svoice)*senergy;
// Ten-stage inverse lattice, backward residuals use only previous-sample state.
u10=excitation*.12;
'''
    for i in range(10,0,-1):s+=f'u{i-1}=u{i}-sk{i}*l{i};\n'
    s+='if(step){\n'
    for i in range(10,1,-1):s+=f'l{i}=fixdenorm(clamp(l{i-1}+sk{i-1}*u{i-2},-8,8));\n'
    s+='l1=fixdenorm(clamp(u0,-8,8));\n}\nlpc=tanh(u0*.55);\n'
    s+='''
// GI-inspired cascade: three distinct resonators driven by an allophone frame.
a1=resonator(excitation,sf1,sb1,step);
a2=resonator(a1,sf2,sb2,step);
a3=resonator(a2,sf3,sb3,step);
intelli=tanh((a1*.4+a2*15+a3*120)*2);
// Votrax-style parallel formants, with drive inside the excitation path.
vx=tanh(excitation*drive);
v1=resonator(vx,sf1,sb1,step);v2=resonator(vx,sf2,sb2,step);v3=resonator(vx,sf3,sb3,step);
vermis=tanh((v1+v2*.65+v3*.35)*2.4);
// SAM-inspired control quantization: centers are quantized before filter recursion.
qstep=4000/max(2,quant);
saw=(phase*2-1)*svoice+held*(1-svoice)*.5;
s1=resonator(saw*senergy,round(sf1/qstep)*qstep,sb1*1.6,step);
s2=resonator(saw*senergy,round(sf2/qstep)*qstep,sb2*1.6,step);
s3=resonator(saw*senergy,round(sf3/qstep)*qstep,sb3*1.6,step);
sam=tanh((s1+s2*.65+s3*.35)*2);
// Mozer-inspired symmetry decoder: quarter segment, reflect, alternate sign.
quadrant=floor(phase*4);frac=wrap(phase*4,0,1);
pos=(quadrant==1||quadrant==3)?1-frac:frac;
idx=clamp(floor(phone),0,63)*128+pos*127;
segment=peek(segments,idx,0,interp="linear",boundmode="clamp");
segment*=quadrant>=2?-1:1;
rotbits=max(2,16-floor(rot*13));scale=pow(2,rotbits-1);
segment=round(segment*scale)/scale;
segment*=rot>.05&&wrap(quadrant+rotindex,4,8)>6?-1:1;
digi=mix(held*.25,segment,svoice)*senergy;
// Klatt-style cascade / parallel bank, five poles and a nasal zero pair.
zeroInput=excitation;
nasalZero=zeroInput-2*cos(twopi*280/8000)*zx1+zx2;
if(step){zx2=zx1;zx1=zeroInput;}
kx=mix(zeroInput,nasalZero*.6,nasal);
c1=resonator(kx,sf1,sb1,step);c2=resonator(c1,sf2,sb2,step);c3=resonator(c2,sf3,sb3,step);
c4=resonator(c3,sf4,sb4,step);c5=resonator(c4,sf5,sb5,step);
p1=resonator(kx,sf1,sb1,step);p2=resonator(kx,sf2,sb2,step);p3=resonator(kx,sf3,sb3,step);
p4=resonator(kx,sf4,sb4,step);p5=resonator(kx,sf5,sb5,step);
klatt=mix(tanh((c1*.5+c2*8+c3*70+c4*250+c5*600)),tanh((p1+p2*.65+p3*.3+p4*.12+p5*.08)*2.2),parallel);
voice=core<.5?lpc:core<1.5?intelli:core<2.5?vermis:core<3.5?sam:core<4.5?digi:klatt;
levels=pow(2,bits-1);
if(step){filterOutput=round(voice*levels)/levels;}
mono=dcblock(filterOutput);
stereo.write(mono);
right=mix(mono,stereo.read(samplerate*.0067,interp="linear"),width);
// Ring writes the last speech core before its output gate. Compost stays alive.
if(!freeze){poke(ring,mono,wp,0);poke(ring,right,wp,1);if(wrap(wp,0,256)==0){poke(scopes,mono,floor(wp/256));}wp=wrap(wp+1,0,524288);samplesStored=min(524288,samplesStored+1);}
span=max(64,min(samplesStored,256+length*length*262000));
base=wrap(wp-span-start*max(0,samplesStored-span),0,524288);
rp=wrap(rp+speed,0,span);
rphase=rp/span;
win=mix(1,sin(pi*rphase)*sin(pi*rphase),window);
// Two overlapping windows suppress loop-edge clicks without emptying the ring.
aidx=wrap(base+rp,0,524288);bidx=wrap(base+wrap(rp+span*.5,0,span),0,524288);
wa=sin(pi*rphase);wa*=wa;
ra=peek(ring,aidx,0,interp="linear",boundmode="wrap");rb=peek(ring,bidx,0,interp="linear",boundmode="wrap");
rc=peek(ring,aidx,1,interp="linear",boundmode="wrap");rd=peek(ring,bidx,1,interp="linear",boundmode="wrap");
compL=mix(ra,ra*wa+rb*(1-wa),window);compR=mix(rc,rc*wa+rd*(1-wa),window);
out1=clamp(tanh(mix(mono,compL,compost)*1.2)*gain*switchGain,-.95,.95);
out2=clamp(tanh(mix(right,compR,compost)*1.2)*gain*switchGain,-.95,.95);
out3=wp/524288;out4=aidx/524288;out5=abs(out1);out6=mono;
'''
    return s
