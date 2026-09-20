#!/usr/bin/env python3
"""Validate actual Max recordings from native_qa.py (no simulated DSP)."""
import json,math,struct,sys
from pathlib import Path

def read(path):
    raw=path.read_bytes();pos=12;data=None;fmt=None
    while pos+8<=len(raw):
        tag=raw[pos:pos+4];n=struct.unpack_from('<I',raw,pos+4)[0]
        if tag==b'fmt ':fmt=struct.unpack_from('<HHIIHH',raw,pos+8)
        if tag==b'data':data=raw[pos+8:pos+8+n]
        pos+=n+8+(n%2)
    assert fmt[0]==3 and fmt[1]==2 and fmt[-1]==32,fmt
    values=struct.unpack('<'+'f'*(len(data)//4),data)
    return values[::2],values[1::2],fmt[2]

def main():
    root=Path(sys.argv[1]);log=(root/'native.log').read_text()
    assert 'DONE 33' in log,log
    assert 'ERROR' not in log,log
    results={}
    for path in sorted(root.glob('*.wav')):
        l,r,sr=read(path)
        assert len(l)>sr*.4
        assert all(math.isfinite(v) for v in l+r)
        peak=max(map(abs,l+r));rms=math.sqrt(sum(v*v for v in l+r)/(len(l)*2))
        assert peak<=1.00001,(path.name,peak)
        if path.stem in ['note-off','output-mute','vca-mute']:assert peak<1e-5,(path.name,peak)
        else:assert rms>1e-6,(path.name,rms)
        results[path.stem]=dict(samples=len(l),sample_rate=sr,peak=peak,rms=rms,
                               stereo_rms=math.sqrt(sum((a-b)**2 for a,b in zip(l,r))/len(l)))
    assert len(results)==33
    result=dict(scope='Native bundled Max compilation and actual stereo recordings; Live is checked separately.',passed=33,cases=results)
    (root/'audio-results.json').write_text(json.dumps(result,indent=2)+'\n')
    print('PASS: 33 native Max audio cases; finite bounded stereo output, all algorithms, MIDI gate/release, modulation, external input, and mute checks.')
    for i in range(9):
        v=results['algorithm-'+str(i)];print(f"Algorithm {i+1}: RMS {20*math.log10(v['rms']):.1f} dBFS, peak {20*math.log10(v['peak']):.1f} dBFS")
if __name__=='__main__':main()
