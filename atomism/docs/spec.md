# Atomism — spec (v0.2, as built)

Stereo Max for Live audio effect. A granular shredder tuned for glitch, not texture:
tiny grains (default 2.5 ms, range 0.3–50 ms), heavy pitch randomization, and grain-start
jitter driven by a trigger source or a chaos generator. Original design, no reference hardware.

## Signal path

input → capture buffer (`buffer~ ---atomism-mem`, 4 s stereo, written continuously by gen~;
Hold stops writing; Feedback writes grain output back in) → gen~ scheduler → 16 gen~ grain
voices (cubic read from the buffer, per-grain window / rate / pan / direction) → DC block →
soft clip → Dry/Wet → Output trim.

### Why gen~ reads the buffer instead of groove~

`groove~` is one play head whose position is set by messages, i.e. scheduler-tick accurate
(~1 ms jitter, no overlap). With 1–5 ms grains that jitter is the same order as the grain,
and overlapping grains would need a bank of groove~s fed by message-rate starts. Reading the
`buffer~` inside gen~ keeps every grain start sample-accurate and lets the scheduler own each
voice's window, rate and direction — the "control the ugliness precisely" part.
The buffer is still a real `buffer~`, so the panel can draw it.

## Scheduler

Two layers:

1. **Events** from the Source: Free (the grain clock runs continuously), Sync (host tempo
   divisions), Onset (transients in the input), Chaos (the chaos map crossing a threshold),
   and the **Trig** parameter (rising edge — map any Live modulator / automation / another
   device to it for external triggering).
2. **Grains**: each event opens a burst of *Burst* grains spaced at 1/Density.
   In Free, Burst is ignored (the clock never closes).

Grain start time is displaced by **Jitter** (0–100 % of the grain spacing).
Read position is displaced back into the buffer by **Spray** (0–1000 ms).

## Entropy

Every random draw (jitter, spray, pitch, size, reverse, pan) comes from one source:

- **Noise** — uncorrelated white noise.
- **Logistic** — iterates of x → r·x·(1−x), one step per grain. **Chaos** sets r from 3.5
  (period-4 cycles: patterned, repeating glitches) to 4.0 (full chaos), passing through the
  periodic windows around 3.83 where the pattern snaps back. This is what makes the shredding
  feel *structured* rather than random.
- **Lorenz** — continuous attractor at **Speed**, ρ = 18 + 32 · Chaos. Draws drift instead of step.

## Parameters (23)

| Section | Parameter | Range | Default |
| --- | --- | --- | --- |
| Trigger | Source | Free / Sync / Onset / Chaos | Free |
| | Density | 2–2000 grains/s (exp) | 120 |
| | Division | 1/64 … 1/4 incl. triplets | 1/16 |
| | Burst | 1–64 grains per event | 8 |
| | Sens | onset threshold % | 50 |
| | Trig | momentary, mappable | — |
| Grain | Size | 0.3–50 ms (exp) | 2.5 |
| | Vary | 0–100 % (length × 2^±2 at 100 %) | 30 |
| | Window | Rect / Tri / Hann / Click | Tri |
| | Reverse | 0–100 % probability | 25 |
| | Jitter | 0–100 % | 40 |
| | Spray | 0–1000 ms | 60 |
| Pitch | Pitch | −24…+24 st | 0 |
| | Random | ±0–24 st | 12 |
| | Quantize | Off / Semi / Fifth / Oct | Off |
| Entropy | Entropy | Noise / Logistic / Lorenz | Logistic |
| | Chaos | 0–100 % (r 3.5–4.0 / ρ 18–50) | 85 |
| | Speed | 0.02–50 Lorenz time units/s | 2 |
| Buffer | Hold | on/off | off |
| | Feedback | 0–100 % | 0 |
| Output | Width | 0–100 % random pan | 50 |
| | Dry/Wet | 0–100 % | 100 |
| | Output | −24…+12 dB | 0 |

Window: *Rect* is deliberately unwindowed (clicks are the point), *Click* is an instant
attack with an exponential decay.

## Display

One well: x = distance back into the buffer (right = now), y = grain pitch, one tick per grain,
fading with age; brightness = grain level, colour = forward / reverse. A strip below shows the
entropy source (chaos iterate trace or noise) so the pattern is visible.

## Bounds

16 voices, oldest stolen. Grain rate clamped to ±4 octaves total. DC block after the sum,
tanh soft clip on the feedback write and on the output, output ceiling −0.3 dBFS.
