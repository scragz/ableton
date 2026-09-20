"""Measure recordings made by the real Max gen~ core in Ableton Live."""
from pathlib import Path
import array
import json
import math
import struct
import sys

ROOT = Path(__file__).resolve().parents[1]


def read_wave(path):
    data = path.read_bytes()
    assert data[:4] == b'RIFF' and data[8:12] == b'WAVE'
    pos, fmt, samples = 12, None, None
    while pos + 8 <= len(data):
        chunk, size = struct.unpack_from('<4sI', data, pos)
        body = data[pos+8:pos+8+size]
        if chunk == b'fmt ':
            fmt = struct.unpack_from('<HHIIHH', body)
        elif chunk == b'data':
            samples = array.array('f', body)
            if sys.byteorder != 'little':
                samples.byteswap()
        pos += 8 + size + size % 2
    assert fmt and fmt[0] == 3 and fmt[1] == 2 and fmt[5] == 32
    assert samples and all(math.isfinite(x) for x in samples)
    return fmt[2], samples


def rms(samples):
    return math.sqrt(sum(x*x for x in samples)/len(samples))


def main():
    report = {}
    for name in ['rest','default','sustain','extreme','long_dark','mono','panic']:
        sr, samples = read_wave(ROOT/'tests/runtime'/f'{name}.wav')
        peak = max(map(abs, samples))
        tail = samples[-sr*2:]
        report[name] = dict(sample_rate=sr, duration_seconds=len(samples)/2/sr,
                            peak=peak, rms=rms(samples), last_second_rms=rms(tail))
        assert peak <= 0.891, (name, peak)
        if name == 'rest':
            assert peak == 0
        elif name == 'panic':
            assert max(map(abs, tail)) == 0
        else:
            assert rms(tail) > 0.00001, f'{name} unexpectedly silent'
        if name == 'mono':
            # Width uses a 30 ms smoother; measure after it has settled.
            error = max(abs(tail[i]-tail[i+1]) for i in range(0,len(tail),2))
            report[name]['last_second_stereo_difference'] = error
            assert error < 1e-7
    (ROOT/'docs/verification/audio-results.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    print('PASS: finite bounded output, silent rest/panic, sustained feedback, and mono sum')


if __name__ == '__main__':
    main()
