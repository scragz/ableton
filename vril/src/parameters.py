"""Native Live parameters. Rectangles are presentation coordinates."""
ALGORITHMS = ['1 Analog / Dungeon', '2 Shaper / Reflekta', '3 Sines / Dungeon',
              '4 Crush / Dungeon', '5 Waves / Dungeon', '6 Waves / Reflekta',
              '7 Diatonic / Reflekta', '8 Cluster / Dungeon', '9 Cluster / Reflekta']
P = []
def dial(key, label, x, y, lo=0, hi=100, default=50, unit=5, **kw):
    P.append(dict(key=key, label=label, rect=[x,y,55,56], lo=lo, hi=hi,
                  default=default, unit=unit, kind='live.dial', **kw))
def menu(key,label,r,values,default=0):
    P.append(dict(key=key,label=label,rect=r,lo=0,hi=len(values)-1,default=default,
                  unit=9,kind='live.menu',enum=values))
def number(key,label,r,lo,hi,default,unit=0,**kw):
    P.append(dict(key=key,label=label,rect=r,lo=lo,hi=hi,default=default,
                  unit=unit,kind='live.numbox',**kw))
# Generator, in the panel's top-to-bottom order.
for key,label,x,y,lo,hi,d,u in [
 ('warp','Warp',14,24,-100,100,0,5),('span','Span',77,24,-100,100,0,5),
 ('morph','Morph',140,24,0,100,35,5),('fuse','Fuse',14,91,-100,100,0,5),
 ('basis','Basis',77,91,-48,48,0,7),('field','Field',140,91,-100,100,0,5)]:
 dial(key,label,x,y,lo,hi,d,u)
menu('algorithm','Algorithm',[217,27,161,18],ALGORITHMS)
dial('seed','Seed',235,60,0,100,27,5)
dial('scan','Scan',305,60,0,100,35,5)
for key,label,x,y,lo,hi,d,u in [
 ('mix','Mix',402,24,0,100,40,5),('feed','Feed',465,24,-100,100,35,5),
 ('form','Form',528,24,0,100,35,5),('time','Time',402,91,5,2000,280,2),
 ('cell','Cell',465,91,-100,100,0,5),('output','Output',528,91,-70,6,-12,4)]:
 dial(key,label,x,y,lo,hi,d,u,exp=3 if key=='time' else 1)
menu('playmode','Voice',[606,27,128,18],['MIDI','Drone'])
dial('attack','Attack',609,60,1,5000,12,2,exp=3)
dial('release','Release',674,60,5,12000,450,2,exp=3)
number('inputgain','Input',[988,133,118,17],-70,30,-70,4)
menu('modsource','Modulation',[758,27,97,18],['Envelope','LFO','Offset'])
number('rate','Rate',[887,27,68,18],.01,20,.25,3,exp=3)
for i,key in enumerate(['morph','basis','field','time','form']):
 dial('mod_'+key,key.title(),752+i*43,63,-100,100,0,5)
 P[-1]['rect'][2]=42
number('glide','Glide',[607,133,58,17],0,2000,0,2,exp=3)
number('vca','VCA',[675,133,58,17],0,200,100,5)
DEFAULTS={p['key']:p['default'] for p in P}
