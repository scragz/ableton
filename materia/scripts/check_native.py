"""Compare actual Max-generated samples with the independent byte formulas."""
from pathlib import Path
import json,struct,math
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'docs/verification';tables=json.loads((ROOT/'scripts/build/tables.json').read_text())
def read(path):
 b=path.read_bytes();pos=12;fmt=None;data=None
 while pos+8<len(b):
  tag=b[pos:pos+4];n=struct.unpack_from('<I',b,pos+4)[0]
  if tag==b'fmt ':fmt=struct.unpack_from('<HHIIHH',b,pos+8)
  if tag==b'data':data=b[pos+8:pos+8+n]
  pos+=8+n+(n&1)
 assert fmt[0]==3 and fmt[1]==8 and fmt[-1]==32,fmt
 vals=struct.unpack('<'+'f'*(len(data)//4),data);return [vals[c::8] for c in range(8)],fmt[2]
def rms(v):return math.sqrt(sum(x*x for x in v)/len(v))
def byte(x):return max(0,min(255,math.floor((x+1)*127.5+.5)))
def dac(d):return d/127.5-1
results={};errors=[]
def check(name,fn=None):
 try:
  a,sr=read(D/(name+'.wav'));assert len(a[0])>1000;assert all(math.isfinite(x) for c in a for x in c)
  result={'samples':len(a[0]),'sample_rate':sr,'rms':rms(a[0]),'peak':max(map(abs,a[0]))}
  if fn:result.update(fn(a,sr) or {})
  results[name]=result
 except Exception as e:errors.append(name+': '+str(e))
def exact(fn):
 def run(a,sr):
  # Input and output are recorded in one native vector. Quantizer ties at zero
  # may differ by one code because the oscillator is evaluated in double precision.
  err=[abs(a[0][i]-fn(byte(a[6][i]))) for i in range(64,len(a[0]))]
  maxerr=max(err);bad=sum(e>1e-6 for e in err)
  assert maxerr<2/255+1e-6 and bad<len(err)*.005,(maxerr,bad,len(err))
  return {'max_error':maxerr,'non_tie_mismatches':sum(e>2/255+1e-6 for e in err)}
 return run
check('adc',exact(dac));check('silence',exact(lambda d:1/255));check('flip7',exact(lambda d:dac(d^128)));check('invert',exact(lambda d:dac(d^255)))
for mode in range(4):check('gera-'+str(mode),exact(lambda d,m=mode:dac([d&85,d|85,d^85,255-(d&85)][m])))
offsets=[0,4096,12288,77824,143360,151552,167936]
for f in range(7):
 k=0 if f==6 else 3;off=offsets[f];check('jena-'+str(f),exact(lambda d,off=off,k=k:dac((7*tables[off+k*256+d]+3*tables[off+(k+1)*256+d]+5)//10)))
def reverse(x):return int(f'{x:08b}'[::-1],2)
for m,fn in [(0,lambda d:d),(1,reverse),(2,lambda d:d^(d>>1)),(3,lambda d:((d<<1)|(d>>7))&255)]:check('matrix-'+str(m),exact(lambda d,fn=fn:dac(fn(d))))
def chain(a,sr):
 states=[];prev=None
 for x,y,z in zip(a[2],a[3],a[4]):
  s=tuple(round(v*255) for v in [x,y,z])
  if s!=prev:states.append(s);prev=s
 assert len(states)>100
 for x,y,z in states[3:]:assert y==(x-1)%256 and z==(x-2)%256,(x,y,z)
 return {'clock_events':len(states),'simultaneous_commit':True}
check('chain',chain)
for name in ['erfurt-feedback','loop-delay','loop-last','loop-noise','berlin-saturated','rostock-loop','rostock-scramble','rostock-hold','poczdam','ladder','custom','lp-filter','fourpole-filter','adc-rate','adc-bus','adc-zero','matrix-4']:check(name)
log=(D/'native.log').read_text();assert 'DONE 37' in log,log[-800:]
if 'ERROR ' in log:errors.append('Native Max reported errors; inspect native.log')
report={'scope':'Native Max Gen recordings; Live persistence, mappings, export and final Freeze checked separately.','passed':len(results),'failed':errors,'cases':results};(D/'audio-results.json').write_text(json.dumps(report,indent=2)+'\n');print(f'{len(results)}/37 native cases passed');print('\n'.join(errors));raise SystemExit(bool(errors))
