# Chiasmus

Max for Live **audio effect**: a reverse delay with two engines — **Grain** (six windowed voices) and
**Tape** (one read head with continuous motion) — over one stereo buffer. Treat it like a pedal: zero
latency, no lookahead. Named for the rhetorical A-B-B-A reversal — the Cross knob lets each pass through the loop
re-reverse the last, so repeats alternate direction.

Build: `cd chiasmus && python3 scripts/build.py`. All output goes to `device/` (gitignored): the frozen,
self-contained `Chiasmus.amxd` (device code `aaaa`) plus the editable `Chiasmus.maxpat`, loose JS and
`chiasmus.gendsp` beside it. Unlike the other devices there is no `scripts/build/`.

## Signal flow

```
in ──┬───────────────────────────────────────────────────────── dry ──┐
     └─► write ─► [32 s stereo buffer] ─► 6 grain voices ─► diffuse ─► wet ─► duck ─► mix ─► out
            ▲                │ forward echo tap (period + pre)   │
            └── tone ◄ drive ◄──────── mix(echo, wet, Cross) ◄───┘  × Feedback
```

### Engines

**Grain.** A grain reads the most recent `rate × length` of audio, **backwards** from the write head (or
  forwards from `span` behind it). Reading starts at the newest sample, so reverse has no added
  latency beyond Pre.
Window: equal-power fades whose width is **Smooth** (1–50 % of the grain; grains overlap by that
  much so butt-joins stay constant-power), then skewed by **Swell** (+ = reverse-cymbal rise, − = pluck).
**Tape.** One head. Each chunk it plays backwards (Swell shapes the level), then a cubic Hermite
*catch-up* carries it back to the write head with position **and velocity** continuous: the head slows,
stops, fast-forwards, stops, and drops into the next reverse — no splice crossfade anywhere. **Smooth**
sets the catch-up length (5–50 % of the chunk), **Zip** how loud it is (0 = a long level dip, 100 = hear
the whole spin). A speed-tracking low-pass gives tape HF loss at 1× and tames the fast-forward. If a
new chunk arrives mid-play (Onset, Drift) the catch-up starts from wherever the head is, at its current
speed, like a real transport. **Wow** (both engines) is a shared wobble — 0.55 Hz wow, 6.3 Hz flutter,
slow random drift — that only ever reads *older* audio, so it never overtakes the write head.

### Loop

- **Cross** 0: feedback comes from a forward echo tap, so every repeat is reversed the same way.
  **Cross** 100: feedback is the grain output, so each pass re-reverses (R, F, R, F…) with drifting
  splice points. In between is a blend of both loops.
- **Scatter** on: instead of blending, each grain (or tape chunk) tosses a coin with probability Cross;
  winners go into the loop at full level, losers don't. Echo still returns at (1 − Cross). The loop gets
  its own diffusion chain so Diffuse smears it the same way as the output.

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
| Shape | Smooth / Swell | Grain: window width and skew. Tape: catch-up length and play-level skew (preview drawn live) |
| | Zip | Tape only (dimmed in Grain): level of the catch-up spin |
| | Wow | wow/flutter depth, both engines |
| | Engine | Grain / Tape |
| Loop | Feedback, Cross, Scatter, Diffuse, Tone, Drive | see above; Tone is a tilt around 800 Hz, Drive is tanh with gain compensation (always soft-limits the loop) |
| Output | Width, Duck, Dry/Wet, Output | Width pans alternate grains L/R; Duck ducks the wet by the input envelope |

Display: right edge = now. Each active grain — or the tape head — draws its read position (line 1
colour = reverse, line 2 = forward / fast-forward) with an arrow in its direction of travel; a stopped
tape head is a square. The top line reads chunk time (or division · bpm) · pattern · pitch, with Frozen
and the Onset flash dot on the right. Below: the grain window, or in Tape the catch-up level curve then
the play curve.

Layout: Time (Trigger over Division | Pre | Sens; bottom row Freeze | Time | Drift) · Direction ·
Shape (display, then Smooth / Swell / Zip / Wow and the Engine switch) · Loop · Output. Every bottom-row
knob sits on the same line.

Every control is a native `live.*` widget (dial / tab / menu / text) and a Live parameter. The only
jsui is the click-through background (`ignoreclick 1`) for sections, display and readouts.

Push banks: **Chiasmus** (Time, Feedback, Cross, Pitch, Smooth, Swell, Dry/Wet, Freeze), **Motion**
(Trigger, Division, Pre, Drift, Pattern, Flip, Fine, Sens), **Tape** (Engine, Zip, Wow, Scatter, Tone,
Drive, Diffuse), **Output** (Width, Duck, Output).

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
  **True pre-verse (swell ending on the dry hit, à la United Plugins Mirror) is not implemented** and
  won't be while this is a pedal-style device: it needs reported latency.
- Tape transport — Count to 5's variable-speed read head, tape-stop plugins. Here the stop/spin/restart
  is a velocity-continuous Hermite path computed per chunk.
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
- Tape engine (v2, same day): compiles clean; head display tracks catch-up (fast-forward) and reverse
  play; realtime run in Live decays to silence after the input stops. Offline Python model of the tape
  path (`Hermite catch-up + play`) keeps the head within 0.69 s of the write head at 400 ms.
- Gotcha while testing: Freeze renders run from the start of the arrangement, so a clip that isn't at
  bar 1 looks like the effect "resurrecting". Put the test clip at bar 1 before trusting a render.
- Live sometimes keeps a stale copy of a rebuilt frozen device; delete and re-add it after a build.
- **Not yet auditioned:** Sync, Onset, Scatter, Cross > 0, Pitch ≠ 0, Freeze, Wow, Diffuse/Drive extremes, Width/Duck.
