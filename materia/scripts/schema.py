"""Materia v0.2 parameter contract; shared by builder, DSP and tests."""
BUS=['ZERO','CONST','ADC1','ADC2','BER','ERF1','ERF2','LP1','LP2','GER','JEN','ROS1','ROS2','PZ.1','PZ.2','MTX','TCLK','ICLK','ERF1.OVF','ERF2.OVF','NOTE','VEL']
P=[]
def add(key,label,tab,default=0,lo=0,hi=255,enum=None):
 P.append(dict(key=key,label=label,tab=tab,default=int(default) if isinstance(default,bool) else default,lo=lo,hi=len(enum)-1 if enum else hi,enum=enum))
def menu(k,l,t,e,d=0):add(k,l,t,d,enum=e)
def bus(k,l,t,d=0):menu(k,l,t,BUS,d)
def bit(k,l,t,d=0):menu(k,l,t,['Off','On'],d)
for n in [1,2]:
 t=f'ADC{n}';p=f'a{n}_';menu(p+'in',t+' Input',t,['L','R','Mid','Side'],n-1);add(p+'gain',t+' Gain',t,0,-24,24);add(p+'offset',t+' Offset',t,0,-1,1);menu(p+'range',t+' Range',t,['Bipolar','Unipolar']);menu(p+'mode',t+' Clock',t,['CONT','RATE','BUS','ZERO-X']);add(p+'rate',t+' Rate',t,8000,1,96000);bus(p+'clk',t+' Clock source',t,16)
for n in ['A','B']:
 t='DAC '+n;p='d'+n.lower()+'_';bus(p+'src',t+' Source',t,9 if n=='A' else 8);menu(p+'range',t+' Range',t,['Bipolar','Unipolar']);menu(p+'wmode',t+' Weights',t,['IDEAL','LADDER','CUSTOM']);add(p+'tol',t+' Tolerance %',t,5,0,25);add(p+'seed',t+' Seed',t,1,1,16777215)
 for b in range(8):add(p+f'w{b}',t+f' Weight {b}',t,1,-2,2)
 add(p+'gain',t+' Gain dB',t,0,-80,12);menu(p+'filt',t+' Filter',t,['NONE','1-pole LP','4-pole LP']);add(p+'cutoff',t+' Cutoff',t,16000,20,20000);bit(p+'dc',t+' DC block',t,1);menu(p+'dest',t+' Destination',t,['L','R','Both'],n=='B')
add('ber_freq','Berlin Frequency','BER',110,.01,96000);add('ber_fine','Berlin Fine cents','BER',0,-100,100);menu('ber_fm','Berlin FM source','BER',['None','DAC A','DAC B','Track input']);add('ber_amt','Berlin FM amount','BER',0,0,1);menu('ber_mode','Berlin Clock','BER',['STEP','CYCLE']);bus('ber_sync','Berlin Sync source','BER')
for n in [1,2]:
 t=f'ERF{n}';p=f'e{n}_';bus(p+'src',t+' Step source',t,1);add(p+'step',t+' Step',t,1,1,255);menu(p+'dir',t+' Direction',t,['UP','DOWN']);bus(p+'gate',t+' Direction gate',t);add(p+'bit',t+' Direction bit',t,0,0,7);bus(p+'reset',t+' Reset source',t);add(p+'rbit',t+' Reset bit',t,0,0,7);bus(p+'clk',t+' Clock source',t,4 if n==1 else 16)
for t,p,src,on in [('LP1','l1_',2,0),('LP2','l2_',3,0),('GER','g_',7,1)]:
 bus(p+'src',t+' Source',t,src)
 for b in range(8):bit(p+f'b{b}',t+(' Pass ' if t=='GER' else ' Flip ')+str(b),t,on)
 bus(p+'gate',t+' Gate source',t);add(p+'rot',t+' Gate rotation',t,0,0,7);bit(p+'inv',t+' Gate invert',t);menu(p+'law',t+' Logic',t,['AND','OR','XOR','NAND'] if t=='GER' else ['OR','XOR'])
bus('j_src','Jena Source','JEN');menu('j_family','Jena Family','JEN',['Identity & bit ops','Folds','Walsh sequency','Walsh Hadamard','Shapes','Rhythm','User']);add('j_table','Jena Table','JEN',0,0,255);add('j_morph','Jena Morph','JEN',0,0,1);menu('j_sync','Jena Clock mode','JEN',['ASYNC','SYNC']);bus('j_clk','Jena Clock source','JEN')
for n in [1,2]:
 t=f'ROS{n}';p=f'r{n}_';bus(p+'src',t+' Source',t,2 if n==1 else 0);add(p+'length',t+' Length',t,16 if n==1 else 64,1,64);menu(p+'mode',t+' Mode',t,['SHIFT','LOOP','SCRAMBLE','HOLD']);bus(p+'clk',t+' Clock source',t,16);add(p+'seed',t+' Seed',t,1,1,16777215)
for key,label,default in [('a','A',2),('b','B',3)]:bus('p_'+key,'Poczdam Source '+label,'PZ',default)
menu('p_mode','Poczdam Select mode','PZ',['MANUAL','BIT','CLOCKED']);bit('p_sel','Poczdam Select B','PZ');bus('p_bus','Poczdam Select bus','PZ');add('p_bit','Poczdam Select bit','PZ',0,0,7);bus('p_clk','Poczdam Clock','PZ',16)
bus('m_src','Matrix Source','MTX');menu('m_mode','Matrix Logic','MTX',['OR','XOR'],1);menu('m_preset','Matrix Preset','MTX',['Identity','Reverse','Gray','Rotate+1','Random perm','Custom']);add('m_seed','Matrix Seed','MTX',1,1,16777215)
for n in range(1,5):
 t=f'TAP{n}';p=f't{n}_';bus(p+'src',t+' Source',t,6);menu(p+'kind',t+' Kind',t,['BYTE','BIT','MASK-OR'],1);add(p+'bit',t+' Bit',t,n-1,0,7);add(p+'mask',t+' Mask',t,0,0,255);add(p+'depth',t+' Depth',t,1,0,1);add(p+'min',t+' Minimum',t,0,0,1);add(p+'max',t+' Maximum',t,1,0,1)
menu('race_mode','Race handling','STATE',['DELAY','LAST','NOISE']);add('constant','Constant byte','STATE',0,0,255);menu('tclk_div','Transport clock','STATE',['1/64','1/32','1/16','1/8','1/4','1/2','1 bar','2 bars','4 bars','8 bars'],2);add('iclk_rate','Internal clock Hz','STATE',8,.01,96000);menu('load_mode','Load state','STATE',['RESUME','CLEAR PIPES','CLEAR ALL']);menu('recall_on_play','Recall on play','STATE',['OFF','S1','S2'])
TABS=['ADC1','ADC2','BER','ERF1','ERF2','LP1','LP2','GER','JEN','ROS1','ROS2','PZ','MTX','TAP1','TAP2','TAP3','TAP4','STATE','DAC A','DAC B']
