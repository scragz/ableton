"""Original analytic speech material. No WORM firmware, ROMs or recordings."""
import math, json, wave, struct
from pathlib import Path
# F1-F3, voicing, duration in 25 ms frames. Broad speech targets, not chip ROMs.
BASE={
'PA':[400,1200,2500,0,3],'AA':[730,1090,2440,1,7],'AE':[660,1720,2410,1,6],
'AH':[640,1190,2390,1,5],'AO':[570,840,2410,1,7],'AW':[650,1100,2400,1,8],
'AY':[550,1800,2550,1,8],'EH':[530,1840,2480,1,5],'ER':[490,1350,1690,1,7],
'EY':[420,2100,2650,1,7],'IH':[390,1990,2550,1,4],'IY':[270,2290,3010,1,7],
'OW':[450,800,2400,1,8],'OY':[480,1500,2500,1,8],'UH':[440,1020,2240,1,5],
'UW':[300,870,2240,1,7],'B':[250,1000,2200,1,2],'CH':[500,2300,3100,0,3],
'D':[300,1700,2600,1,2],'DH':[400,1500,2600,.5,3],'F':[700,1800,3100,0,4],
'G':[300,1300,2400,1,2],'HH':[550,1500,2500,.1,3],'JH':[500,2000,3000,.4,3],
'K':[300,1500,2700,0,2],'L':[350,1150,2800,1,4],'M':[250,1000,2100,1,4],
'N':[280,1500,2300,1,4],'NG':[300,1300,2300,1,4],'P':[250,1100,2300,0,2],
'R':[350,1300,1700,1,4],'S':[800,2700,3500,0,5],'SH':[600,2100,2900,0,5],
'T':[350,2200,3100,0,2],'TH':[500,1800,3000,0,4],'V':[600,1600,2900,.5,4],
'W':[300,750,2200,1,4],'Y':[300,2200,2900,1,4],'Z':[650,2600,3400,.4,4],
'ZH':[600,2000,2900,.4,4]}
# SP0256's familiar 64-address arrangement; coefficient content is authored here.
NAMES='PA1 PA2 PA3 PA4 PA5 OY AY EH KK3 PP JH NN1 IH TT2 RR1 AX MM TT1 DH1 IY EY DD1 UW1 AO AA YY2 AE HH1 BB1 TH UH UW2 AW DD2 GG3 VV GG1 SH ZH RR2 FF KK2 KK1 ZZ NG LL WW XR WH YY1 CH ER1 ER2 OW DH2 SS NN2 HH2 OR AR YR GG2 EL BB2'.split()
ALIASES={'KK':'K','PP':'P','NN':'N','TT':'T','RR':'R','AX':'AH','MM':'M','DD':'D','YY':'Y','BB':'B','GG':'G','VV':'V','FF':'F','ZZ':'Z','LL':'L','WW':'W','XR':'R','WH':'W','OR':'AO','AR':'AA','YR':'ER','SS':'S','EL':'L'}
def reflection(f,bw):
    a=[1.]
    for hz,b in zip(f,bw):
        r=math.exp(-math.pi*b/8000); p=[1,-2*r*math.cos(2*math.pi*hz/8000),r*r]
        out=[0.]*(len(a)+2)
        for i,x in enumerate(a):
            for j,y in enumerate(p):out[i+j]+=x*y
        a=out
    ks=[]
    for order in range(10,0,-1):
        k=max(-.985,min(.985,a[order]));ks.insert(0,k)
        a=[(a[j]-k*a[order-j])/(1-k*k) for j in range(order)]
    return ks

def make_tables():
    phones=[]
    for i,name in enumerate(NAMES):
        base=''.join(c for c in name if not c.isdigit());base=ALIASES.get(base,base)
        f1,f2,f3,v,d=BASE[base]
        variant=int(name[-1]) if name[-1].isdigit() else 1
        shift=1+(variant-1)*.022
        f=[f1*shift,f2*shift,f3*shift,3300,3650]
        bw=[65,95,130,200,260]
        if v<.6:bw=[160,220,300,350,400]
        phones.append(dict(name=name,base=base,f=f,bw=bw,k=reflection(f,bw),voiced=v,energy=0 if base=='PA' else (.6 if v else .35),duration=d+(variant-1),pitch=1.))
    return phones

PHRASES=[
 ['the worm speaks','earth and memory','a voice beneath','hello human','speak to me','we are alive','out of order','return to earth'],
 ['one two three','four five six','seven eight nine','zero memory','system ready','signal found','please repeat','end of phrase'],
 ['soft tissue','broken circuit','under the skin','slower than thought','between the words','listen again','nothing is still','the mouth opens'],
 ['intruder alert','you are here','game over','prepare to speak','another world','enter the maze','watch the shadow','no escape']]
# Explicit pronunciations make the factory vocabulary independent of spelling rules.
LEXICON={
 'the':'DH AH','worm':'W ER M','speaks':'S P IY K S','earth':'ER TH','and':'AE N D','memory':'M EH M ER IY',
 'a':'AH','voice':'V OY S','beneath':'B IH N IY TH','hello':'HH EH L OW','human':'HH Y UW M AH N','speak':'S P IY K',
 'to':'T UW','me':'M IY','we':'W IY','are':'AA R','alive':'AH L AY V','out':'AW T','of':'AH V','order':'AO R D ER',
 'return':'R IH T ER N','one':'W AH N','two':'T UW','three':'TH R IY','four':'F AO R','five':'F AY V',
 'six':'S IH K S','seven':'S EH V AH N','eight':'EY T','nine':'N AY N','zero':'Z IY R OW','system':'S IH S T AH M',
 'ready':'R EH D IY','signal':'S IH G N AH L','found':'F AW N D','please':'P L IY Z','repeat':'R IH P IY T',
 'end':'EH N D','phrase':'F R EY Z','soft':'S AO F T','tissue':'T IH SH UW','broken':'B R OW K AH N',
 'circuit':'S ER K IH T','under':'AH N D ER','skin':'S K IH N','slower':'S L OW ER','than':'DH AE N',
 'thought':'TH AO T','between':'B IH T W IY N','words':'W ER D Z','listen':'L IH S AH N','again':'AH G EH N',
 'nothing':'N AH TH IH NG','is':'IH Z','still':'S T IH L','mouth':'M AW TH','opens':'OW P AH N Z',
 'intruder':'IH N T R UW D ER','alert':'AH L ER T','you':'Y UW','here':'HH IY R','game':'G EY M','over':'OW V ER',
 'prepare':'P R IH P EH R','another':'AH N AH DH ER','world':'W ER L D','enter':'EH N T ER','maze':'M EY Z',
 'watch':'W AA CH','shadow':'SH AE D OW','no':'N OW','escape':'EH S K EY P'}

def modes():
    result=[]
    def add(name,typ='vocab',x='Pitch',y='Length',z='Phrase',**kw):
        n=len(result)+1; core=0 if n<=21 else 1 if n<=28 else 2 if n<=36 else 3 if n<=46 else 4 if n<=49 else 5 if n<=62 else 6
        result.append(dict(mode=n,core=core,name=name,type=typ,x=x,y=y,z=z,**kw))
    add('Phrase banks',y='Bank');add('Low bitrate',y='Bank',bits=5);add('Absolute pitch',y='Bank',absolute=True);add('Length bend',x='Length',y='Bank')
    add('Frame scan','phoneme',z='Phoneme');add('Absolute frames','phoneme',z='Phoneme',absolute=True)
    add('Text to speech','tts',y='Position',z='Letter')
    for chip in ['5100','5200','5220']:add(chip+' registers','raw','Register','Value','Pitch')
    for i,(name,typ) in enumerate([('Phrase bleed','vocab'),('Phoneme bleed','phoneme'),('Vocabulary rot','phoneme'),('Pitch table I','vocab'),('Pitch table II','phoneme'),('Pitch + vocabulary','phoneme'),('Coefficient table I','vocab'),('Coefficient table II','phoneme'),('Pitch + coefficients I','vocab'),('Pitch + coefficients II','phoneme'),('Full memory rot','phoneme')]):add(name,'worm','Register','Bend','Phoneme' if typ=='phoneme' else 'Phrase',source=typ,bend=i+1)
    add('Allophones','phoneme',z='Phoneme');add('Absolute allophones','phoneme',z='Phoneme',absolute=True)
    add('Allophone TTS','tts',y='Position',z='Letter')
    for n in ['Phrase bank I','Phrase bank II','Built-in vocabulary']:add(n)
    add('Clock bend','worm','Register','Bend','Phrase',freeze=True)
    add('Phonemes','phoneme',z='Phoneme');add('Text to speech','tts',y='Position',z='Letter')
    add('Arcade bank I');add('Arcade bank II');add('Arcade overdrive','worm','Pitch','Bend');add('Clock overdrive','worm','Register','Bend');add('Raw formants','raw','Register','Value','Pitch',freeze=True)
    add('Absolute phonemes','phoneme',z='Phoneme',absolute=True)
    add('Vocabulary bank I',y='Bank');add('Vocabulary bank II',x='Length',y='Bank');add('Text pitch','tts',y='Position',z='Letter');add('Text length','tts','Length','Position','Letter')
    add('Phoneme list','list',y='Position',z='Phoneme');add('List length','list','Length','Position','Phoneme');add('Absolute list','list',y='Position',z='Phoneme',absolute=True)
    add('Selected vocabulary');add('Raw quantizer','raw','Register','Value');add('Frequency rot','worm','Register','Bend')
    add('Symmetry vocabulary');add('Absolute reconstruction',absolute=True);add('Segment bit rot','worm','Register','Bend')
    add('Klatt vocabulary');add('Cascade list','list','Position','Length','Phoneme');add('Cascade phoneme','phoneme',z='Phoneme');add('Absolute vocabulary',absolute=True)
    add('Parallel list','list','Position','Length','Phoneme');add('Parallel phoneme','phoneme',z='Phoneme');add('Absolute parallel','phoneme',z='Phoneme',absolute=True)
    add('Nasal vocabulary');add('Absolute nasal',absolute=True);add('Raw resonators','raw','Register','Value','Length');add('Articulatory voice','phoneme',z='Phoneme');add('Extended vocabulary');add('Extended absolute',absolute=True)
    add('Living buffer','compost','Start','Length','Window');add('Freeze buffer','compost','Start','Length','Window',freeze=True)
    return result

def write(dest):
    phones=make_tables();data=dict(schema=1,sampleRate=8000,phones=phones,phrases=PHRASES,lexicon=LEXICON,modes=modes())
    (dest/'vermiform.tables.json').write_text(json.dumps(data,indent=2)+'\n')
    # Quarter-cycle spectral segments. Gen reflects and alternates polarity to reconstruct a full cycle.
    samples=[]
    for p in phones:
        values=[]
        for i in range(128):
            phase=(i/127)*math.pi/2
            values.append(sum(math.sin(phase*h)*sum(math.exp(-((h*120-f)/b)**2) for f,b in zip(p['f'],[160,230,300,380,450]))/h for h in range(1,33,2)))
        peak=max(abs(v) for v in values) or 1
        samples.extend(int(v/peak*28000) for v in values)
    with wave.open(str(dest/'vermiform.segments.wav'),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(8000);w.writeframes(struct.pack('<'+'h'*len(samples),*samples))
    return data
