#!/usr/bin/env python3
"""Analyse a native QA run (device/qa/*.wav + native.log written by scripts/native_qa.js in Max).
Pure Python: reads 32-bit float WAVs directly. Exit code 1 if any check fails.

    python3 scripts/check_native.py
"""
import math
import struct
import sys
from pathlib import Path

QA = Path(__file__).resolve().parents[1] / 'device' / 'qa'
F0 = 110.0   # the cases play A2


def read_wav(path):
    data = path.read_bytes()
    assert data[:4] == b'RIFF' and data[8:12] == b'WAVE', path
    pos, fmt, frames = 12, None, None
    while pos + 8 <= len(data):
        tag, size = data[pos:pos + 4], struct.unpack_from('<I', data, pos + 4)[0]
        body = data[pos + 8:pos + 8 + size]
        if tag == b'fmt ':
            fmt = struct.unpack_from('<HHIIHH', body)
        elif tag == b'data':
            frames = body
        pos += 8 + size + (size & 1)
    code, ch, sr, _, _, bits = fmt
    if code == 0xFFFE:
        code = struct.unpack_from('<H', data, data.index(b'fmt ') + 8 + 24)[0]
    n = len(frames) // (bits // 8)
    if code == 3 and bits == 32:
        x = struct.unpack('<%df' % n, frames[:n * 4])
    elif code == 1 and bits == 16:
        x = [v / 32768 for v in struct.unpack('<%dh' % n, frames[:n * 2])]
    elif code == 1 and bits == 24:
        x = [int.from_bytes(frames[i:i + 3], 'little', signed=True) / 8388608 for i in range(0, n * 3, 3)]
    else:
        raise ValueError(f'{path}: format {code}/{bits}')
    return sr, list(x[0::ch]), list(x[1::ch]) if ch > 1 else list(x[0::ch])


def db(v):
    return 10 * math.log10(v + 1e-20)


def seg(sr, L, R, a, b):
    i, j = int(a * sr), min(len(L), int(b * sr))
    if j <= i:
        return dict(rms=-200, side=-200, peak=0, nan=False)
    e = sum((L[k] ** 2 + R[k] ** 2) / 2 for k in range(i, j)) / (j - i)
    s = sum(((L[k] - R[k]) / 2) ** 2 for k in range(i, j)) / (j - i)
    pk = max(max(abs(L[k]), abs(R[k])) for k in range(i, j))
    nan = any(not math.isfinite(L[k]) or not math.isfinite(R[k]) for k in range(i, j))
    return dict(rms=db(e), side=db(s), peak=pk, nan=nan)


def harmonics(sr, L, a, length, f0=F0, K=12):
    i, n = int(a * sr), int(length * sr)
    out = []
    for k in range(1, K + 1):
        w = 2 * math.pi * k * f0 / sr
        re = sum(L[i + m] * math.cos(w * m) for m in range(n))
        im = sum(L[i + m] * math.sin(w * m) for m in range(n))
        out.append(math.hypot(re, im) / n)
    return out


def strongest(h):
    return h.index(max(h)) + 1


def main():
    log = (QA / 'native.log').read_text() if (QA / 'native.log').exists() else ''
    print(log.strip() or '(no native.log)')
    fails = []

    def check(ok, what):
        print(('  ok   ' if ok else '  FAIL ') + what)
        if not ok:
            fails.append(what)

    check('DONE' in log, 'run finished')
    check('ERROR' not in log, 'no Max console errors')
    w = {}
    for f in sorted(QA.glob('*.wav')):
        w[f.stem] = read_wav(f)
    for name, (sr, L, R) in w.items():
        s = seg(sr, L, R, 0, len(L) / sr)
        print(f'{name:16s} {len(L) / sr:5.2f} s  rms {s["rms"]:6.1f} dB  peak {20 * math.log10(s["peak"] + 1e-12):6.1f} dB  side {s["side"]:6.1f} dB')
        check(not s['nan'] and s['peak'] <= 0.971, f'{name}: finite, under the 0.97 ceiling')

    def has(n):
        if n not in w:
            check(False, f'{n}.wav recorded')
            return False
        return True

    if has('silence'):
        check(seg(*w['silence'], 0, 1.5)['peak'] == 0, 'silence: exactly silent before any note')
    if has('pluck-dry'):
        sr, L, R = w['pluck-dry']
        a, b = seg(sr, L, R, 0.05, 0.6)['rms'], seg(sr, L, R, 2.4, 3.0)['rms']
        check(a > -30 and a - b > 10, f'pluck-dry: plucks ({a:.1f} dB) and decays ({b:.1f} dB)')
    if has('bloom'):
        sr, L, R = w['bloom']
        late = seg(sr, L, R, 3, 4)['rms']
        check(late > -20, f'bloom: sustains ({late:.1f} dB)')
        print('    harmonics', [round(20 * math.log10(v + 1e-12)) for v in harmonics(sr, L, 3.4, 0.4)])
    if has('release'):
        sr, L, R = w['release']
        on, off = seg(sr, L, R, 1.5, 2.4)['rms'], seg(sr, L, R, 3.8, 4.4)['rms']
        check(on > -20 and off < -60, f'release: {on:.1f} dB held -> {off:.1f} dB released')
    if has('mute'):
        sr, L, R = w['mute']
        on, off = seg(sr, L, R, 1.5, 2.4)['rms'], seg(sr, L, R, 3.0, 4.4)['rms']
        check(on > -20 and off < -70, f'mute: {on:.1f} dB -> {off:.1f} dB')
    if has('breathing'):
        sr, L, R = w['breathing']
        blocks = [seg(sr, L, R, t, t + 0.05)['rms'] for t in [3 + 0.05 * k for k in range(70)]]
        check(max(blocks) - min(blocks) > 6, f'breathing: level swings {max(blocks) - min(blocks):.1f} dB')
    if has('seek-off') and has('seek-on'):
        ho = strongest(harmonics(*w['seek-off'][:2], 7.2, 0.5))
        hn = strongest(harmonics(*w['seek-on'][:2], 7.2, 0.5))
        print(f'    seek off -> h{ho}, seek on -> h{hn}')
        check(hn == 1, 'seek-on: settles on the fundamental')
    if has('seek-oct'):
        ho = strongest(harmonics(*w['seek-oct'][:2], 7.2, 0.5))
        print(f'    seek octave -> h{ho}')
        check(ho == 2, 'seek-oct: settles on the octave')
    if has('stereo-mono'):
        sr, L, R = w['stereo-mono']
        check(seg(sr, L, R, 1, 3)['side'] < -90, 'stereo-mono: Offset 0 + Spread 0 is mono')
    if has('bloom'):
        sr, L, R = w['bloom']
        s = seg(sr, L, R, 2, 4)
        check(s['side'] - s['rms'] > -20, f'bloom: default Offset / Spread are stereo (side {s["side"] - s["rms"]:.1f} dB)')
    print('PASS' if not fails else f'{len(fails)} FAILED')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
