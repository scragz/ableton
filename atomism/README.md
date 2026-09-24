# Atomism

Stereo Max for Live audio effect: a granular shredder tuned for glitch, not texture. Tiny grains
(default 2.5 ms), heavy pitch randomization, and grain starts driven by a trigger source or a
chaos generator. Original design; spec in `docs/spec.md`.

## Signal path

Input → 4 s stereo `buffer~` (written continuously by gen~; **Hold** stops writing; **Feedback**
writes the shredded output back in) → gen~ scheduler → 16 gen~ grain voices (cubic reads, per-grain
window / rate / direction / pan, oldest voice stolen) → DC block → tanh → Dry/Wet → Output, clamped
at −0.3 dBFS.

Grains are read from the `buffer~` inside gen~ rather than through `groove~`: groove~ start
positions are message-timed (~1 ms jitter, one head), which is as long as the grain itself.

## Triggering

- **Source**: Free (grain clock at Density), Sync (one event per host Division tick; a free clock
  of the same length while the transport is stopped), Onset (input transients, **Sens**), Chaos.
- Outside Free, every event fires a **Burst** of grains spaced by Density.
- **Trig** is a momentary parameter: map an LFO, Envelope Follower, clip automation or another
  device to it for external triggering. A rising edge fires a burst in any Source.
- **Jitter** moves each grain start by up to ± one grain spacing. **Spray** reaches back into the buffer.

## Entropy

Every random draw (pitch, jitter, spray, size, reverse, pan) comes from one source:

- **Noise**: uncorrelated.
- **Logistic**: x → r·x·(1−x), one step per grain, r = 3.5 + 0.5 · Chaos. Every draw is a fixed
  function of that one value, so when the map is periodic (low Chaos, and the windows near
  r ≈ 3.83) the whole grain stream repeats with it. The draw used for pitch is x itself, whose
  distribution at high r piles up at both ends: expect the extremes of Random a lot.
- **Lorenz**: the classic attractor integrated continuously at **Speed** (time units per second),
  ρ = 18 + 32 · Chaos. Draws are its normalized x / y / z, so grains drift and flip between lobes.
  Below ρ ≈ 24.7 (Chaos < ~21 %) it settles onto a fixed point: every grain becomes identical.

In **Chaos** Source, events come from the Entropy too: Noise fires with probability Sens per
Burst-length tick, Logistic fires when the map exceeds 1 − Sens, Lorenz fires each time the orbit
climbs through a z level set by Sens (about one per loop; none once it has settled).

## Display

Grain map (x = how far back in the buffer, sqrt scale; y = pitch; orange reverse, blue forward),
window preview (faint curves = the shortest and longest grain Vary allows), pitch histogram,
Entropy view (return map of successive draws for Noise / Logistic, x–z trail for Lorenz), meters.

## Files and build

- `src/atomism.genexpr` DSP, `src/atomism.control.js` parameter → gen~ mapping and dimming,
  `src/atomism.panel.js` background face.
- `python3 scripts/build.py` writes `device/Atomism.maxpat` (editable), loose deps and the frozen
  `device/Atomism.amxd`. Deterministic.
- Tests: `node --test tests/dsp.test.cjs tests/js.test.cjs` (build first). `dsp` runs the GenExpr
  offline through a mechanical JS translation (`tests/harness.cjs`); `js` runs the control and
  panel scripts against stubs and checks the frozen device. Neither replaces loading it in Live.

## Deliberate roughness

- **Rect** window is unwindowed and **Click** has no attack: the clicks are the point.
- Upward pitch is not band-limited (up to +36 st): aliasing is part of the sound.
- A stolen voice is cut, not faded.
