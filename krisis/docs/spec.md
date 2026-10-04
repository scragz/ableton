# Krisis — M4L Device Spec

Oct 3, 2026 · @Jaycee Lydian

## Overview

Krisis is a monolithic Max for Live audio effect: three saturating, inductor-style bandpass voices with distortion inside the resonance loop, plus XYZ chaotic modulation and wah/autowah behaviour. Set simply, it should pass for a real inductor wah; pushed, it becomes a bank of coupled, self-oscillating resonators.

**Goals**

- Convincing wah pedal tone, including the level-dependent upward frequency shift of a saturating inductor.
- Three voices that spread, link and cross-couple in several topologies, including a formant (vowel) mode.
- Chaotic modulation from Thomas and Chua attractors, with musically useful stereo behaviour.
- Dual mono by default, with Offset and Mid/Side stereo modes.
- Equal loudness across clip modes, drive and Q via gain matching, so dry/wet behaves like a mix control.
- Optional multi-input mode fed from three tracks.
- One device with internal modules, full state saved with the Live set.

**Non-goals**

- Component-level simulation of a specific pedal circuit.
- A chain of separate devices.

## Signal flow

&#91;embedded content: Krisis signal flow · main chain and modulation\]

All nonlinear filtering happens inside the oversampled voice bank; modulation enters there, and gain matching, decode and safety run after it at base rate. In Multi-input mode, pairs B and C can also feed voices directly or inject into their loops.

## Core voice

Each voice is a zero-delay-feedback state-variable filter (Simper/Zavalishin form) using the bandpass tap, with two nonlinearities: inductor core saturation and a clipper in the resonance loop.

| Element | Implementation | Audible result |
| --- | --- | --- |
| Core saturation | Coefficient g scaled by (1 + Core × s1²), clamped | Louder input pushes the resonant peak upward, like a saturating inductor |
| Loop clipper | Injection, State or Both (see Clip modes) | Drive interacts with Q; high Q self-oscillates into a stable limit cycle |
| Clip curve | tanh, asymmetric diode, foldback, hard clip | Asymmetric diode adds even harmonics and DC (handled in the loop) |
| Output tap | Raw v1 (peak gain = Q) feeds the loop; output tap switchable raw or normalized (k × v1) | Raw keeps the “hotter at high Q” character; normalized holds peak gain at unity |

**Oversampling and solving**

- 4x oversampling by wrapping the voice gen\~ in `poly~ @up 4`. A Quality switch (2x / 4x / 8x) trades CPU for aliasing.
- Semi-implicit solve: the nonlinearities read the previous sample’s state. Add 1–2 Newton iterations only if extreme settings sound smeared.
- Clamp g so tan() never blows up near Nyquist; cap Freq at about 0.45 × the oversampled rate.
- Clamp Drive to a minimum of 0.01, since state clipping divides by it.

**Per-voice parameters:** Freq, Q, Drive, Feedback, Core, Curve.

**gen\~ sketch** (untested, one voice, all three clip modes):

```
History s1(0), s2(0), bpz(0);
Param fc(800); Param q(4); Param drive(1); Param fb(0.3); Param core(0.3);
Param mode(0);                                   // 0 Injection, 1 State, 2 Both
d  = max(drive, 0.01);
g  = clamp(tan(pi*fc/samplerate) * (1 + core*s1*s1), 0.0001, 10);
k  = (mode == 1) ? (1/q) * (1 - 0.9*fb) : 1/q;   // State: fb becomes resonance boost
v0 = in1 + ((mode != 1) ? fb*tanh(d*bpz) : 0);   // injection clip
a1 = 1/(1 + g*(g + k)); a2 = g*a1; a3 = g*a2;
v3 = v0 - s2;
v1 = a1*s1 + a2*v3;
v2 = s2 + a2*s1 + a3*v3;
s1n = 2*v1 - s1;
s1 = (mode >= 1) ? tanh(d*s1n)/d : s1n;          // state clip
s2 = 2*v2 - s2;
bpz = v1;
out1 = v1;
```

## Clip modes

A three-position switch selects where the distortion sits in the loop; the Feedback knob means “more ring” in every position.

| Mode | Where it clips | Character | Feedback knob |
| --- | --- | --- | --- |
| Injection | Clipped bandpass output re-injected at the input | Harmonics re-resonate through the filter | Injection amount |
| State | Integrator state s1 saturated | Q becomes level-dependent, closer to a transistor wah | Resonance boost (reduces k) |
| Both | Injection drives into state saturation | Can lock into a self-sustaining tone with no input | Injection amount |

**Switching**

- Crossfade about 10 ms between two parallel solves when the mode changes, to avoid clicks.
- Each mode has its own gain calibration (see Gain staging).

**Sustain (active in Injection and Both)**

- The injection path is gated by the input envelope; Sustain sets the gate’s release.
- 0 = rings out and dies. Mid = long resonant tails. 1 = free-running drone that input only perturbs.

**DC in the loop**

- A highpass in the feedback path removes DC from asymmetric clipping before it biases the clipper.
- Its cutoff (Bias Leak, about 1–20 Hz) is exposed: a low setting lets the asymmetry drift slowly as a feature.

## Spread, link and topology

A master Freq plus a Spread knob places the three voices; continuous link amounts and a topology switch set how they interact.

**Spread modes**

| Mode | Placement of voices A / B / C | Notes |
| --- | --- | --- |
| Ratio | Log-symmetric around master | Default |
| Linear Hz | Fixed Hz offsets | Beats and inharmonic clusters at wide spread |
| Harmonic | 1:2:3, 1:3:5 or 1:φ:φ² (sub-switch) | Tonal, pitch-like resonances |
| Formant | F1/F2/F3 from a vowel table; Spread morphs a→e→i→o→u | Talkbox territory |
| Seeded scatter | Random offsets from a stored seed | Recallable with the preset |

**Link**

- Each of Freq, Q and Drive has a Link amount from 0 to 1.
- 1 = voices track the master (plus spread offsets); 0 = fully independent; between = loose coupling.

**Topology**

| Topology | Routing | Notes |
| --- | --- | --- |
| Parallel | Input to all three; outputs summed | Default |
| Series | A → B → C | Gain compensation required; drive compounds fast |
| Ring | A’s output into B’s injection, B into C, C into A | Coupled resonators: sync, beating, chaos without modulation |
| Matrix | 3×3 cross-feed amounts, one clipper per path | Superset of Ring; most unstable |

Ring and Matrix inject into the feedback path, so they behave like the Injection clip point even in State mode. Their cross-feed amounts are modulation targets.

## Stereo modes

Dual mono is the default: six voices, three per channel. Offset and Mid/Side reuse the same six voices with different routing.

| Mode | Routing | Character | Default chaos stereo |
| --- | --- | --- | --- |
| Dual mono | L and R each get A/B/C with identical settings | Stereo signal, mono-identical filtering | Thomas axis rotation |
| Offset | Dual mono; R frequencies shifted by a Width ratio | Classic spread; formants split between ears at extreme Width | Divergence |
| Mid/Side | Encode M/S; M and S each get A/B/C; decode | Filter the centre without smearing the image | Chaos on S only (breathing width) |

**Edge cases**

- Side typically sits 10–20 dB below Mid, so a shared Drive leaves S nearly clean. Provide an S Drive offset.
- Side-only resonance cancels when summed to mono.
- Wah treadle is linked across channels by default; unlinking is opt-in.
- M/S encode and decode run at base rate, outside the oversampled voices.

## Chaos modulation

An attractor switch selects Thomas or Chua; three normalized outputs (x, y, z) feed a routing matrix. Integration is RK4 at control rate, with an optional audio-rate mode.

**Thomas**

```latex
\dot{x} = \sin y - b x,\quad \dot{y} = \sin z - b y,\quad \dot{z} = \sin x - b z
```

- One parameter, exposed as **Entropy** (b): about 0.208 is chaotic; toward 0 it becomes a random walk; higher settles into order.
- Cyclically symmetric, so x, y and z behave alike, which suits three identical voices.

**Chua**

```latex
\dot{x} = \alpha\,(y - x - f(x)),\quad \dot{y} = x - y + z,\quad \dot{z} = -\beta y
```

```latex
f(x) = m_1 x + \tfrac{1}{2}(m_0 - m_1)\left(|x+1| - |x-1|\right),\quad m_0 = -\tfrac{8}{7},\ m_1 = -\tfrac{5}{7}
```

- Classic values α ≈ 15.6, β ≈ 28. Exposed as Alpha and Beta.
- Orbits one lobe, then snaps to the other. A lobe-switch detector (sign change of x, with hysteresis) outputs a trigger event.

**Controls**

| Control | Function |
| --- | --- |
| Attractor | Thomas / Chua |
| Rate | Integration step size |
| Audio rate | Above about 20 Hz modulation becomes FM-like grit |
| Routing matrix | x/y/z → any of: voice Freq A/B/C, Q, Drive, cross-feed amounts, Spread |
| Depth | Per-row amount in the matrix |
| Forcing | Input envelope added to one state variable; loud input kicks the attractor between regions |
| Seed / Reset | Recallable initial conditions |
| Freeze | Holds the current state |
| Divergence | Initial-condition offset for divergence stereo (about 1e-6 upward) |

**Stereo behaviour (tied to stereo mode)**

- Dual mono → axis rotation: L reads x, y, z; R reads y, z, x. Cleanest with Thomas.
- Offset → divergence: two instances start nearly identical and drift apart over seconds.
- Mid/Side → chaos routed to S only.

**Normalization**

- Adaptive min/max tracking per axis with slow decay maps outputs to −1…1. Hardcoded bounds are unreliable; approximate Chua ranges are x ±2.5 and z ±4.
- Chua lobe triggers can retrigger the autowah treadle or step the topology.

## Wah and autowah

Wah mode links all three voices at zero spread (or solos voice A) and replaces the master Freq with a Treadle control; autowah drives that treadle through a mass-spring model rather than mapping an envelope straight to frequency.

**Wah voicing**

| Preset | Sweep range (approximate, from memory; verify against measurements) |
| --- | --- |
| Cry Baby style | about 350 Hz – 2.2 kHz |
| Vox style | about 450 Hz – 1.6 kHz |
| Custom | Min / Max set freely |

- **Taper:** audio-taper curve on the Treadle, adjustable from linear to log.
- **Body:** blends lowpass in with the bandpass, since a real wah leaks low end.
- **Core** and **Clip mode** carry over, so inductor saturation stays part of the voice.
- **Treadle** is a mappable Live parameter, so an expression pedal via MIDI CC works directly.

**Virtual treadle**

- The modulation source sets a target position; a mass-spring model with Mass and Damping moves the treadle toward it.
- Low damping overshoots and settles like a foot; high damping is smooth and robotic.

**Treadle sources**

| Source | Controls |
| --- | --- |
| Manual / pedal | Treadle |
| Envelope (self) | Sensitivity, Attack, Release, Direction (up/down) |
| Envelope (sidechain) | Same, from a multi-input pair |
| Chaos | One attractor axis, or Chua lobe triggers |
| LFO | Rate, Shape, Sync |
| Trigger | Transient-detected sweep with Shape and Time |

## Multi-input mode

Live has supported extra M4L audio inputs since Live 10: `plugin~ 1 2 3 4 5 6` exposes three stereo pairs, and the two extra pairs can be routed from other tracks. Routings are set in stereo pairs, up to 32 pairs per device ([Cycling ’74: Audio Routes](https://cycling74.com/articles/audio-routes-using-audio-routes-tooling-for-your-mfl-devices)).

| Pair | Source |
| --- | --- |
| 1 (in 1–2) | Host track |
| 2 (in 3–4) | Routed track B |
| 3 (in 5–6) | Routed track C |

**Modes**

| Mode | Behaviour |
| --- | --- |
| Off | Pair 1 only |
| Per-voice | Pair 1 → voice A, pair 2 → B, pair 3 → C |
| Cross-envelope | Pairs 2 and 3 drive treadle or chaos forcing; audio stays from pair 1 |
| Cross-excitation | Pairs 2 and 3 are injected into the voices’ feedback paths, so one track rings another’s resonators |

**Risks (prototype first)**

- The `live.routing` reference says it handles one audio port at a time per device, and two instances point to the same port ([live.routing reference](https://docs.cycling74.com/reference/live.routing)). Choosing two independent sources likely means switching its index; confirm before designing the UI.
- Unknown whether Live’s delay compensation covers these routes. Test with a click track.
- No `send~`/`receive~` fallback: Live’s multithreaded track processing makes it jittery.

## Gain staging and safety

Gain matching is post-filter only, per voice: a static calibration curve plus a slow adaptive trim. Nothing in it touches the resonance loop, so it never changes how hard the clipper is hit.

**Layer 1: static calibration**

- An offline Max patch sweeps pink noise through every clip mode × Drive × Q and records output RMS against input RMS.
- Results are stored as one 2D table (Drive × Q) per clip mode in a `buffer~`, read with bilinear interpolation in gen\~.
- Each topology gets its own fixed scalar (three parallel voices sum about +4.8 dB over one).

**Layer 2: adaptive trim**

- Matches wet RMS to input RMS with a 1–3 s time constant, clamped to ±6 dB.
- Frozen while input is below a gate threshold, so self-oscillating tails and Sustain drones are left alone.

```
// post-voice, base rate (not oversampled); pseudocode
cal  = peek(calTable, drive, q, mode);          // static curve, interpolated
tgt  = rmsIn / (rmsOut * cal + 1e-9);
trim = (rmsIn > gate) ? slide(clamp(tgt, 0.5, 2), tau, tau) : trimHeld;
wet  = voice * cal * trim;
```

**Output chain**

1. Voice sum with topology scalar
2. Dry/wet (equal-loudness thanks to matching)
3. DC blocker
4. Soft limiter
5. Ceiling (default −0.3 dBFS)

**Controls:** Gain Match on/off, Trim Speed, Output, Limiter on/off.

## Parameters and UI

The device strip runs left to right in signal order, one panel per section; every control is a live.\* parameter so it can be mapped, automated and saved.

| Panel | Parameters |
| --- | --- |
| Input | Multi-input mode, pair B/C routing, Stereo mode, Width, S Drive offset |
| Master | Freq / Treadle, Spread, Spread mode, Q, Drive, Feedback, Core, Link amounts (Freq, Q, Drive) |
| Voices A/B/C | Per-voice Freq offset, Q, Drive, Level, Mute (expandable view) |
| Loop | Clip mode, Curve, Sustain, Bias Leak, Topology, Matrix amounts (expandable) |
| Chaos | Attractor, Rate, Entropy (Thomas) or Alpha/Beta (Chua), Audio rate, Forcing, Divergence, Seed, Freeze, Routing matrix (expandable) |
| Wah | Wah mode, Range preset, Min/Max, Taper, Body, Treadle source, Mass, Damping, Env controls, LFO controls |
| Output | Output tap (raw/normalized), Gain Match, Trim Speed, Dry/Wet, Output, Limiter, Quality (2x/4x/8x) |

- Matrix views (chaos routing, topology cross-feed) open as expandable panels to keep the strip compact.
- Push banks via `live.banks`: Master, Loop, Chaos, Wah.
- A small scope shows the three voices’ frequencies and the attractor trace.

## Build plan and open questions

Build one voice to a finished sound first, then multiply it; spike the multi-input routing at the start because it is the one platform unknown.

**Build order**

1. Routing spike: confirm two independent sidechain pairs and delay compensation in a throwaway device.
2. Single voice in gen\~ inside `poly~ @up 4`: SVF, Core, all clip modes, curves, Sustain, Bias Leak.
3. Calibration patch and static gain tables.
4. Three voices: spread modes, link amounts, Parallel and Series.
5. Stereo modes (six voices).
6. Ring and Matrix topologies.
7. Chaos: Thomas, Chua, routing matrix, forcing, stereo methods, lobe triggers.
8. Wah mode, virtual treadle, treadle sources.
9. Adaptive trim and output chain.
10. Multi-input modes.
11. UI, Push banks, presets.

**Risks**

- CPU: six voices at 8x with Matrix cross-feed may be heavy; Quality switch and per-voice mutes are the relief valves.
- Both mode plus Matrix plus chaos will find runaway states; the limiter is mandatory, not optional.
- Calibration grows with modes × topologies; may need fewer grid points plus the adaptive trim to cover gaps.

**Open questions**

- [ ] Should chaos stereo method have its own override switch, separate from stereo mode?
- [ ] Verify Cry Baby and Vox sweep ranges against measured responses.
- [ ] Matrix clippers: one shared curve or a curve per path?
- [ ] Which vowel formant set(s) for Formant mode?
- [ ] Starter preset list.
