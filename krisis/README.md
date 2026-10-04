# Krisis

Max for Live **audio effect**: three saturating, inductor-style band-pass voices per channel with
distortion inside the resonance loop, XYZ chaos modulation (Thomas / Chua) and wah / autowah. Set
simply it passes for an inductor wah; pushed, it is a bank of coupled, self-oscillating resonators.
Original design; spec in `docs/spec.md`. Zero latency, no lookahead.

Build: `cd krisis && python3 scripts/build.py`. All output goes to `device/` (gitignored): the frozen,
self-contained `Krisis.amxd` (device code `aaaa`) plus the editable `Krisis.maxpat`, loose JS,
`krisis.genexpr` and `krisis.gendsp` beside it.

## Signal flow

```
pair 1 (host) ─┬─ M/S encode? ─┬─► voice inputs ─┐            ┌──────────── oversampled 2/4/8x ────────────┐
pair B (3-4) ──┤               │  (Per Voice:    │            │ source clippers ─► own fb / ring / matrix │
pair C (5-6) ──┘               │   A←1 B←B C←C)  └─► interp ─►│   ─► Bias Leak HP ─► × Sustain gate        │
                               │                              │ ─► SVF A ─► SVF B ─► SVF C (Series chains) │
   envelopes ─► gate, treadle env, onsets, forcing            │ ─► sum × cal ─► 6th-order decimation LPF   │
   chaos (2 × RK4) ─► rows x/y/z ─► Freq / Q / Drive / …      └────────────────────────────────────────────┘
   treadle source ─► mass-spring ─► wah sweep                     ─► adaptive trim ─► DC block ─► M/S decode
                                                                  ─► dry/wet ─► Output ─► limiter ─► ceiling
```

### Voice

Zero-delay-feedback SVF (Simper / Zavalishin) on the band-pass tap, two nonlinearities:

- **Core**: `g = g0 · (1 + 1.5 · Core · u / (1 + u))`, `u = 4 · k · s1²`. Louder resonance pushes the
  peak up; the term saturates, so Core 100 % tops out at +1.3 octaves. Semi-implicit (previous state).
- **Loop clipper** (Clip mode): **Inject** re-injects `Feedback · √k · clip(Drive · v1) / Drive`, so the
  small-signal loop gain is Feedback × √Q (Q 4: rings past 50 %, oscillates near 100 %) and Drive sets
  where the loop saturates. **State** saturates the integrator state (`clip(Drive·s1)/Drive`) and turns
  Feedback into a resonance boost (k × (1 − 0.9 · Feedback)). **Both** injects into a saturating state;
  it locks into a self-sustaining tone with no input at Sustain 100 %.
- **Curve**: Tanh, Diode (asymmetric: negative side clips at 0.45, even harmonics and DC), Fold (sine
  fold), Hard.
- **Sustain** gates the whole injection with the input envelope: 0 rings out (30 ms hold), the middle
  gives seconds of tail, 100 % is a free-running drone that input only perturbs (a −140 dB dither lets it
  start from silence). **Bias Leak** is the high-pass in the injection path (0.5–40 Hz).
- **Output tap**: **Norm** (k · v1, unity peak) or **Raw** (v1, peak gain = Q). Gain Match uses the Norm
  table for both, so Raw stays hotter at high Q, as specified. **Body** adds the low-pass tap.

### Spread, link, topology

Master Freq + Spread place A / B / C: **Ratio** (±3 oct at 100 %), **Linear** (± 3000 Hz · Spread²),
**Harmonic** (1:2:3, 1:3:5 or 1:φ:φ²; Spread stretches the ratios, exact at 50 %), **Formant** (Spread
morphs a → e → i → o → u through Peterson & Barney's adult-male F1–F3; Freq shifts the table, 800 Hz =
unshifted), **Scatter** (offsets up to ±3 oct from a stored seed). **Link** (Voices page) blends each
voice's Freq / Q / Drive between its own value and the master: Freq at 0 % leaves a voice at 1 kHz + Tune.

**Parallel** sums the three (−4.8 dB). **Series** feeds A's unity-peak output into B into C; only C is
calibrated, and the adaptive trim gets a wider range (−24…+36 dB) because the loss depends on Spread
(at wide Spread three band-passes in series pass very little). **Ring** injects A → B → C → A through the
source clippers (Cross amount). **Matrix**: 3 × 3 amounts (Matrix page), diagonal adds to a voice's own
feedback. Ring and Matrix behave like Inject even in State mode. Switching Clip mode or Topology morphs
over 10 ms inside the one solve.

### Stereo

**Dual** (L and R filtered alike), **Offset** (R voices shifted by Width, ±24 st), **M/S** (Mid and Side
each get A/B/C; **S Drive** offsets the Side drive, default +12 dB, because Side usually sits lower).
Encode / decode and everything outside the voice bank run at the base rate.

### Chaos

Thomas (`ẋ = sin y − bx` …; **Entropy** sets b = 0.4 × (1 − Entropy): 52 % ≈ 0.19 chaotic, 100 %
random walk, low = order) or Chua (classic m0 −8/7, m1 −5/7; **Alpha**, **Beta**), RK4 every 16 samples
or every sample with **Audio** (Rate × 40, FM-like). Outputs are normalized by slow-decaying min / max
tracking (12 s). **Forcing** adds the input envelope to ẋ. **Seed** / **Reset** recall the initial
conditions; **Freeze** holds the state. A lobe detector (sign of x, ±0.6 hysteresis) lights the dot in
the trail and can fire the treadle trigger.

**Mod page**: rows X / Y / Z, each a Target (Freq, Freq A/B/C, Q, Drive, Feedback, Cross, Spread, Treadle)
and a bipolar Depth (Freq ±2 oct, Q ±2 oct, Drive ±24 dB, Feedback ±0.5, Cross ×(1 ± 1.5), Spread and
Treadle ±0.5). **Stereo** (Auto follows the stereo mode): Rotate (R reads y, z, x), Diverge (a second
instance starts Divergence away — 10⁻⁶…10⁻¹ — and drifts off within seconds; Chua shows it best), Side
(chaos on S only), Same.

### Wah

**Stack** puts all three voices on the treadle at zero spread (Tune offsets still detune them),
**Solo** uses voice A only. The master Freq dial is replaced by **Treadle** (mappable, so a MIDI-CC
expression pedal works). **Range**: Cry (≈350 Hz–2.2 kHz), Vox (≈450 Hz–1.6 kHz) — approximate, not
measured — or Custom Min / Max. **Taper** blends a linear-Hz sweep into an exponential one.
**Treadle source**: Pedal, Env (Pedal page: Sens, Attack, Release, Up / Down), Chaos (Axis X / Y / Z or
Lobe), LFO (Rate or host-synced 1/16…4 bars; Sine, Tri, Saw Up / Down, Square, S&H), Trigger (input
onsets, plus Chua lobe switches when Axis = Lobe; Up / Down / Up-Dn / Decay over Time). Every source
sets a target that a mass-spring moves the treadle toward (**Mass** 40 Hz → 1 Hz, **Damping** ζ
0.05 → 2): low damping overshoots and settles like a foot. **Link** off gives R its own envelope /
trigger and a quarter-cycle LFO offset.

### Multi-input

`plugin~ 1 2 3 4 5 6`: pair B (in 3-4) and pair C (in 5-6) are chosen with the two menus under the Multi
menu. They set Live's DeviceIO routings (`this_device audio_inputs 1` / `2`) through the Live API; each
pair is its own DeviceIO, so the two are independent (`live.routing` handles only one port per device).
Live stores the routing with the device. Modes: **Single** (pair 1 only), **Per Voice** (A ← 1, B ← B,
C ← C), **X-Env** (Env and Trigger treadle sources read pair B; chaos Forcing reads pair C; audio from
pair 1), **X-Excite** (pairs B + C enter every voice's source clipper, so they ring pair 1's
resonators through Feedback / Cross; with both at 0 they do nothing).

### Gain staging

1. **Static calibration**: `scripts/calibrate.cjs` runs the generated GenExpr offline with one voice,
   pink noise at −18 dBFS, over clip mode × curve × Drive (5) × log₂ Q (6) × Feedback (4) and writes
   `src/krisis.cal.json` (dB, ±40). The build bakes it into the GenExpr; gen~ reads it trilinearly
   every 16 samples per voice.
2. **Adaptive trim** on the voice sum per channel: wet RMS toward input RMS at Trim Speed, ±6 dB,
   frozen while the input is below −50 dBFS so tails and drones are left alone.

Output chain: DC block (wet only, so 0 % wet is bit-transparent), Dry/Wet (equal power), Output, soft
limiter (instant attack, 120 ms release, −2.5 dB threshold, soft knee above 0.6), ceiling −0.3 dBFS.
**Match** off bypasses both layers; **Limit** off leaves only the ceiling.

## Face

Input · Master (Freq or Treadle, Spread / Q, Drive / Feedback, Core; Spread Mode menu over the
Harmonic-set menu, Scatter seed or a readout; voice-frequency well, L left / R right, wah range shaded)
· Detail pages (Voices: Link row + A / B / C with Tune, Q, Drive, Level and an on button; Matrix; Mod;
Pedal) · Loop · Chaos (trail well: Thomas x/y, Chua x/z, R trail in Diverge; beside it an X / Y / Z strip with one dot per modulation output — filled L / Mid, ring R / Side — dim when that row is Off or at zero Depth) · Wah · Output (Quality,
Tap, Match, Limit; meters + gain reduction). Width 1506. Push banks: Master, Loop, Chaos, Wah.

## Files, build, tests

- `scripts/dsp.py` generates the GenExpr (six voices from one template, no GenExpr functions);
  `scripts/build.py` writes `device/`; `scripts/calibrate.cjs` regenerates `src/krisis.cal.json`.
- `src/krisis.control.js` parameter → gen~ mapping, page / mode visibility and dimming;
  `src/krisis.routing.js` the B / C input menus; `src/krisis.panel.js` the background face.
- Tests (build first): `node --test tests/dsp.test.cjs tests/js.test.cjs`. `dsp` runs the generated
  GenExpr offline through a mechanical JS translation (`tests/harness.cjs`); `js` runs the control,
  routing and panel scripts against stubs, checks widget overlap in every page / mode, ES5, and the frozen
  file. Neither replaces loading the device in Live.
- `node tests/harness.cjs '{"p_q":20,"p_fb":0.9}' 4 out.wav` renders the test signal.

## Differences from the spec

- Oversampling runs inside the gen~ codebox (a loop over 2 / 4 / 8 substeps, linear-interpolated input,
  6th-order Butterworth decimation at 0.42 × base rate) instead of `poly~ @up 4`: Quality switches at run
  time and the whole engine stays one testable GenExpr. Switching Quality is instant and may click.
- Clip-mode and topology changes morph inside one solve (10 ms) rather than crossfading two solves.
- Loop gain is Feedback × √Q with Drive as the saturation point (the spec's sketch, `fb · tanh(d · v1)` on
  the raw tap, oscillates at its own defaults).
- Ring / Matrix use one clipper per source voice, shared by its paths, with the amounts after it
  (resolves "one curve per path?": one shared Curve).
- Chaos stereo has its own override (Auto / Same / Rotate / Diverge / Side), resolving that open question.
- The sidechain envelope treadle source is the Env source in X-Env mode rather than a separate source.
- Body is active in every mode, not only Wah. Chua lobes do not step the topology.
- Calibration is an offline Node run of the real GenExpr, not a Max patch, and the trim is per channel on
  the voice sum, not per voice.

## Not verified yet

- Not loaded in Live yet: gen~ compile, CPU (six voices × 8x with Matrix is the heavy case), the Live API
  routing menus (dictionary format of `available_routing_types`), and whether Live's delay compensation
  covers the B / C routes (test with a click track).
- Cry / Vox ranges are from memory, not measurements.
