"""Offline sanity check for a Live render of Chiasmus: bounded, no NaN/DC, envelope direction, tail decay.

Usage: python3 tests/check_render.py tests/chiasmus-test.wav tests/render-default.wav
"""
import numpy as np, wave, struct, sys
def read(p):
    import soundfile as sf
    d,sr=sf.read(p,always_2d=True); return d,sr
class sf:
    @staticmethod
    def read(p,always_2d=True):
        b=open(p,'rb').read(); i=12; fmt=None
        while i<len(b):
            cid=b[i:i+4]; sz=struct.unpack('<I',b[i+4:i+8])[0]; body=b[i+8:i+8+sz]
            if cid==b'fmt ': tag,ch,sr=struct.unpack('<HHI',body[:8]); bits=struct.unpack('<H',body[14:16])[0]
            if cid==b'data':
                if bits==32 and (tag==3 or tag==0xFFFE): d=np.frombuffer(body,dtype='<f4')
                elif bits==16: d=np.frombuffer(body,dtype='<i2')/32768.0
                elif bits==24:
                    a=np.frombuffer(body,dtype=np.uint8).reshape(-1,3); v=(a[:,0].astype(np.int32)|(a[:,1].astype(np.int32)<<8)|(a[:,2].astype(np.int32)<<16)); v=np.where(v>=1<<23,v-(1<<24),v); d=v/8388608.0
                else: d=np.frombuffer(body,dtype='<i4')/2147483648.0
                return d[:len(d)//ch*ch].reshape(-1,ch).astype(float),sr
            i+=8+sz+(sz&1)
def stats(p):
    d,sr=sf.read(p,always_2d=True); m=d.mean(1)
    print(p.split('/')[-1][:40], 'sr',sr,'dur %.2f'%(len(m)/sr),'peak %.3f'%np.abs(d).max(),'rms %.4f'%np.sqrt((m**2).mean()),'nan',np.isnan(d).any(), 'dc %.5f'%m.mean())
    h=int(sr*0.002); n=len(m)//h
    env=np.sqrt((m[:n*h].reshape(n,h)**2).mean(1)+1e-12); db=20*np.log10(env)
    dd=np.diff(db); act=db[1:]>db.max()-40
    up=np.sort(dd[act])[-20:].mean(); down=np.sort(dd[act])[:20].mean()
    print('   biggest 2ms rises %.1f dB, biggest falls %.1f dB  -> %s'%(up,down,'attack-led (forward)' if up>-down else 'release-led (reversed)'))
    # level over time (1 s blocks)
    b=sr; print('   1s rms dB:',' '.join('%.0f'%(20*np.log10(np.sqrt((m[i:i+b]**2).mean())+1e-9)) for i in range(0,len(m),b)))
import sys
for p in sys.argv[1:]: stats(p)
