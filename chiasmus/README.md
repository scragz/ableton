# Chiasmus

Max for Live **audio effect**: a reverse delay built as a six-voice grain scheduler over one stereo
buffer. Named for the rhetorical A-B-B-A reversal — the Cross knob lets each pass through the loop
re-reverse the last, so repeats alternate direction.

Build: `cd chiasmus && python3 scripts/build.py` → frozen `device/Chiasmus.amxd` (device code `aaaa`).
Editable staging patch: `scripts/build/Chiasmus.maxpat`.

## Signal flow

```
in ──┬───────────────────────────────────────────────────────── dry ──┐
     └─► write ─► [32 s stereo buffer] ─► 6 grain voices ─► diffuse ─► wet ─► duck ─► mix ─► out
            ▲                │ forward echo tap (period + pre)   │
            └── tone ◄ drive ◄──────── mix(echo, wet, Cross) ◄───┘  × Feedback
```

- A grain reads the most recent `rate × length` of audio, **backwards** from the write head (or
  forwards from `span` behind it). Reading starts at the newest sample, so reverse has no added
  latency beyond Pre.
- Window: equal-power fades whose width is **Smooth** (1–50 % of the grain; grains overlap by that
  much so butt-joins stay constant-power), then skewed by **Swell** (+ = reverse-cymbal rise, − = pluck).
- **Cross** 0: feedback comes from a forward echo tap, so every repeat is reversed the same way.
  **Cross** 100: feedback is the grain output, so each pass re-reverses (R, F, R, F…) with drifting
  splice points. In between is a blend of both loops.

## Controls

| Section | Control | What it does |
| --- | --- | --- |
| Time | Trigger | **Free** (launch every Time), **Sync** (launch on each Division tick from `plugphasor~`; tempo read from the phasor slope; falls back to a free clock when the transport stops), **Onset** (a hit schedules one grain that captures the next chunk and ends, reversed, on the attack) |
| | Division / Time | chunk length (Division only in Sync, Time otherwise; the unused one is dimmed) |
| | Pre | extra delay before the reversed chunk plays (0–2 s) |
| | Drift | ± random chunk length per grain |
| | Sens | onset sensitivity (Onset only) |
| | Freeze | stop writing; grains keep chewing the last chunk |
| Direction | Pattern | Rev / Alt (R F R F) / ABBA (R F F R) |
| | Flip | chance that any grain inverts the pattern |
| | Pitch / Fine | read rate, ±12 st and ±50 ct; accumulates through Cross feedback |
| Shape | Smooth / Swell | grain window (drawn live in the display) |
| Loop | Feedback, Cross, Diffuse, Tone, Drive | see above; Tone is a tilt around 800 Hz, Drive is tanh with gain compensation (always soft-limits the loop) |
| Output | Width, Duck, Dry/Wet, Output | Width pans alternate grains L/R; Duck ducks the wet by the input envelope |

Display: right edge = now. Each active grain draws its read head (line 1 colour = reverse, line 2 =
forward) with an arrow in its direction of travel; Onset mode shows a flash dot. Below it, the grain
window from Smooth/Swell. Readouts: chunk time (or division · bpm), pattern · pitch, Frozen, wet meter.

Every control is a native `live.*` widget (dial / tab / menu / text) and a Live parameter. The only
jsui is the click-through background (`ignoreclick 1`) for sections, display and readouts.

Push banks: **Chiasmus** (Time, Feedback, Cross, Pitch, Smooth, Swell, Dry/Wet, Freeze), **Motion**
(Trigger, Division, Pre, Drift, Pattern, Flip, Fine, Sens), **Color** (Tone, Drive, Diffuse, Width, Duck, Output).

## Influences and differences

Original implementation; not an emulation of any of these.

- Chunk reverse + splice crossfade — Danelectro Back Talk, Eventide reverse, VCV prototypes. Here it
  is a grain scheduler, so length can change per chunk (Drift) without two fixed heads.
- Separate attack/decay shaping — EHX Attack Decay. Here one bipolar Swell plus Smooth.
- Pitch in the reversed path — Soundtoys Crystallizer, Walrus Descent, Count to 5. Limited to ±12 st
  to keep read distance inside the buffer at long chunk lengths.
- Direction probability — Red Panda Particle 2 Rev mode; alternating repeats — Akihiko Matsumoto's
  Reverse Delay. Pattern + Flip generalise both.
- Transient-triggered reverse — Rewind. Onset mode lands the reversed swell *after* the hit.
  **True pre-verse (swell ending on the dry hit, à la United Plugins Mirror) is not implemented**: it
  needs reported latency; left out of v1 on purpose.
- Freeze — Particle. Reverse into diffusion — Walrus Lore, EQD Avalanche Run.

## Limits / known gaps

- Sync phase alignment is per beat; divisions longer than a beat are not guaranteed to land on bar lines.
- Onset mode holds one pending grain; a second hit inside the capture window is ignored.
- Grain length is clamped so `pre + length × (1 + rate)` fits in 92 % of the 32 s buffer.
- Voice stealing (7th overlapping grain) cuts the oldest voice without a fade; with Smooth ≤ 50 %
  and moderate Drift at most ~3 grains overlap, so this should be rare.

## Verification

Automated checks cover packaging/logic only; they do not replace listening in Live.

- 2026-09-23, Live 12 Suite (in-process Max 9): device loads, gen~ compiles with no console errors
  (checked by opening the staged patch in Live's bundled Max), grain display runs.
- Freeze render of `tests/chiasmus-test.wav` (default settings, 100 % wet), analysed with
  `tests/check_render.py`: peak 0.49, no NaN, DC ≈ 0; envelope is release-led (reversed) where the
  input is attack-led; tail decays −37 → −100 dB over 4 s after input stops.
- **Not yet auditioned:** Sync, Onset, Cross > 0, Pitch ≠ 0, Freeze, Diffuse/Drive extremes, Width/Duck.
