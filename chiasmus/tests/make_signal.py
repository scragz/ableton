"""Write tests/chiasmus-test.wav: 8 s, a decaying pluck on each beat at 120 bpm plus off-beat hats, -12 dBFS peak."""
import math, random, struct, wave
from pathlib import Path
sr = 44100; n = sr * 8; out = [0.0] * n
random.seed(7)
for b in range(16):
    t0 = int(b * 0.5 * sr); f = [220, 330, 262, 392][b % 4]
    for i in range(int(0.45 * sr)):
        if t0 + i < n: out[t0 + i] += math.sin(2 * math.pi * f * i / sr) * math.exp(-i / (0.12 * sr)) * 0.25
    t1 = t0 + int(0.25 * sr)
    for i in range(int(0.03 * sr)):
        if t1 + i < n: out[t1 + i] += (random.random() * 2 - 1) * math.exp(-i / (0.006 * sr)) * 0.12
w = wave.open(str(Path(__file__).with_name('chiasmus-test.wav')), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
w.writeframes(b''.join(struct.pack('<hh', int(v * 32767), int(v * 32767)) for v in out)); w.close()
