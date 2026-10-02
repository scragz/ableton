# Syzygy

Max for Live instrument (`Syzygy.amxd`) and audio effect (`Syzygy Audio.amxd`), built from one
source. A gravitational three-body simulation plays three modal resonators. The Sun, Earth and Moon
orbit each other, and the orbit is the modulation: when they line up (a *syzygy*) they get struck,
and closeness, depth in the potential well, speed and position all shape the sound.

v3. v1 (delay reservoirs) lives in `legacy/`, v2 (three polite modal bodies) in `legacy/v2/`.

## Engine

**Orbit.** Planar Newtonian gravity (G = 1, softening ε² = 0.001), integrated one symplectic-Euler
step per sample, so the orbit is smooth at any rate. Bounded by:
- a stiff wall at radius 1.6;
- a speed limit (6 units);
- contact: bodies are 0.12 across and push apart. Without contact, one close pass could trap all
  three in the softened core, spinning forever;
- momentum and centre-of-mass bleed (throws and chaos add both);
- a thermostat that pulls total energy back toward the launch energy. It weakens as **Chaos** rises.

**Forms**:
- **Eight**: the Chenciner–Montgomery figure-eight choreography. It is periodic, with six syzygies
  per period.
- **Lagrange**: a rotating equilateral triangle.
- **Euler**: a rotating line.
- **Swarm**: random, with zero momentum.

With equal masses, Lagrange and Euler are unstable: they hold for a while, then break up. That
breakup is the point. Unequal **Mass** breaks any form into chaos. **Chaos** adds slowly wandering
random forces. **Rate** is figure-eight cycles per second (0.01–10 Hz). **Launch** re-seeds the
form (Swarm draws new positions) and **Hold** freezes time.

**Bodies.** Each body is 8 complex one-pole modes. **Matter** morphs continuously through six
tables: Skin (membrane, Bessel ratios) → Wood (free bar) → String (harmonic) → Glass → Bell (hum,
prime, tierce…) → Gong. Ratios interpolate in log2. Mode coefficients refresh every 32 samples and
on every strike. **Bright** tilts partial gains and damps upper modes. **Position** weights modes
like a strike point (0.5 cancels the even modes). **Decay** is the ring time.

## What the orbit does to the sound

| Physics | Sound |
| --- | --- |
| Collinearity (a triangle-area measure, 0 = in line) | With **Align** up, a syzygy strikes the middle body hard and the outer two softly, harder for faster crossings. Contact collisions knock both bodies. |
| Pair distance (mass / d²) | **Gravity**: bodies trade energy. It works in two ways: linear coupling of the modes' real parts (sympathetic, strongest with shared partials), and friction-noise bleed scaled by the neighbour's level (works at any tuning). Past about 55 % the network self-sustains: a regulated drone that reshapes as the geometry moves. |
| Potential depth vs its recent average | **Tide**: gravitational redshift. Pitch drops deeper in the well, up to 12 · Tide semitones, soft-limited. |
| Speed | **Bow**: friction noise ∝ speed², normalised to ring time. |
| Position vs a listener at (0, −2.4) | Pan (x, scaled by **Width**), level and air loss by distance, and **Doppler** (a delay of up to 25 ms per unit distance, so radial motion bends pitch). |

**Feed** closes each body on itself through a soft clip, taken from the modes' real parts. Those are
in phase with the input at resonance. The imaginary parts are 90° off and mostly just detune. A
per-body level term and a global energy compander keep it bounded. **Space** is a 4-line Hadamard
FDN, damped and slowly modulated. The output has a tanh ceiling at 0.97.

## Playing

- **Mallet**: a half-sine pulse from 6 ms down to 0.12 ms, plus a click for hard hits. Its area is
  normalised, so modes below 1/length ring at the velocity. Louder hits are shorter and brighter.
- **Keys** (instrument):
  - **Root**: a note retunes all three bodies (note + each body's **Pitch**, default 0 / +7 / +12)
    and strikes them.
  - **Bodies**: each note claims a planet. It takes a free one, or steals the longest-held. A triad
    becomes three orbiting notes that the syzygies re-strike.
  - MIDI goes straight to gen~. It never writes a Live parameter, so undo and automation stay clean.
  - The **Root** dial and the last Root-mode note share pitch; whichever moved last wins.
- **Strike** per body, **All**, or drag a body in the orbit display. Letting go while moving
  throws it: the release velocity is kept, clamped to 2.5.
- The action buttons (Strike, All, Launch) are live.text toggles that the controller turns off
  120 ms after a press, because Live's theme only draws the lit state for a toggle.
- **Syzygy Audio**: the input (a soft-clipped mono sum, **Input** in place of Keys) excites all
  three bodies. There is no dry path; use a rack for parallel.

## Influences and differences

- The feedback-network ethos comes from *Orbit* (`docs/orbit.md`): self-regulating energy,
  bifurcations, "treat it like a camera". That reference has no three-body physics and no modal
  bodies. This device is an original design, not a port or an emulation.
- The figure-eight initial conditions are Chenciner & Montgomery (2000). The Lagrange and Euler
  configurations are the classical central configurations, with equal masses.

## Build and test

```
python3 scripts/build.py                 # device/Syzygy.amxd + Syzygy Audio.amxd (frozen) + editable .maxpat
node --test tests/dsp.test.cjs tests/js.test.cjs
node tests/render.cjs [prefix]           # offline audition renders -> tests/renders/*.wav (gitignored)
```

- `tests/harness.cjs` translates `src/syzygy3.genexpr` to JS mechanically. The GenExpr source
  deliberately has no functions: all 24 modes run in one loop with their state in `Data`. That keeps
  per-mode state explicit, and it is why the harness can stay a straight translation.
- The harness is an approximation: seeded noise, linear delay reads, no vector boundaries.
- `js.test.cjs` runs the control and jsui scripts in a context with post-ES5 builtins stripped, and
  checks the built patch: wiring, face layering, overlaps, banks and frozen deps.

## Status

- Offline: 24 tests pass.
- Not yet checked in Live:
  - gen~ compile;
  - CPU (24 modes + 7 delay lines);
  - the orbit display's grab/throw;
  - how it sounds.
