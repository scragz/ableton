# Vril

A monophonic Max for Live instrument inspired by the nine launch algorithms in the supplied Vhikk X references. This is an original implementation of the described structures and control relationships, not the manufacturer's firmware or a claim of sonic equivalence.

## Build

```sh
python3 scripts/build.py
```

The build writes only `device/Vril.amxd`. It embeds the patch, Gen DSP, and MIDI/control JavaScript in a frozen Max collective inside an instrument AMXD. No samples, external objects, images, installed packages, staging directories, or companion files are needed. Repeated builds are byte-identical. Python 3 is the only build dependency.

The existing `.gitignore` excludes `device/`; rebuild after checking out the sources.

## Play

Load `device/Vril.amxd` on a MIDI track in Live with Max 9. Use MIDI for last-note-priority playing, or select Drone for a continuous C3 reference (MIDI note 48). Basis offsets the pitch in semitones. Sustain, velocity, two-semitone pitch bend, and glide are supported. Attack and Release shape the VCA before the processor, allowing delay tails after note-off. VCA above 100% drives the processor. Panic returns to MIDI mode, releases held notes, and resets the DSP state.

Generator controls remain grouped on the left; Seed/Scan and algorithm selection are central; processor controls are on the right. All interactive controls are native `live.dial`, `live.numbox`, `live.menu`, or `live.text` objects. There is no logo, illustration, custom-painted UI, or decorative copy. Twenty-eight sound parameters are available to automation, with four parameter banks for controllers.

The five modulation attenuverters share an envelope, bipolar sine LFO, or small offset source. With Offset selected, they act as fine adjustments, following the idea of the panel's unpatched CV normals. Basis modulation reaches one octave at full depth. All parameter state is stored by Live globally; per-algorithm hardware memory and encoder mode-switching are intentionally replaced by directly accessible parameters. Random changes Seed and Scan through their native controls so Live can store the resulting values.

Input Source and Channel select an optional stereo source using Live's audio routing. Raise Input Gain from its silent default to mix it before the filter and VCA. These two menus follow Live's routing state and are not automation parameters. Routing uses [`live.routing`](https://docs.cycling74.com/reference/live.routing) with `plugin~`; actual in-Live routing and recall still require validation.

## Algorithms

The menu follows the order in `docs/vhikk-x-algorithm-reference.pdf` (top/top, top/middle, top/bottom, middle/top, etc.). Only the nine documented launch algorithms are exposed. Future banks mentioned in the manual are not invented.

| # | Generator | WARP left / right | FUSE left / right | Processor |
|---|---|---|---|---|
| 1 | Analog carrier/modulator | Exponential cross-mod / ring mod | Chorus / filter resonance and shape | Dungeon |
| 2 | Dynamic waveshaping pair | Modulator feedback / carrier feedback | Audio-rate delay modulation / saturation | Reflekta |
| 3 | Six-sine cluster | Phase feedback / exponential cross-mod | Chorus / noise modulation | Dungeon |
| 4 | Four procedural wavetable oscillators | Bit reduction / exponential cross-mod | Bandpass + sine / chorus and resonance | Dungeon |
| 5 | Four procedural wavetable oscillators | Phase modulation / exponential cross-mod | Chorus / chorus and resonance | Dungeon |
| 6 | Four procedural wavetable oscillators | Phase modulation / exponential cross-mod | Audio-rate delay modulation / wavefolding | Reflekta |
| 7 | Diatonic cluster | Phase modulation / exponential cross-mod | Chorus / saturation | Reflekta |
| 8 | Continuous cluster | Phase modulation / exponential cross-mod | Chorus / saturation | Dungeon |
| 9 | Continuous cluster | Phase modulation / exponential cross-mod | Chorus / saturation | Reflekta |

Morph scans timbre or paired pitch/wave clusters. Span spreads pitch and, clockwise, stereo placement. Seed continuously changes deterministic internal offsets and delay taps. Scan varies waveform construction (or ring-mod mix in algorithm 3). The waves are calculated from band-limited harmonic sums rather than an external sample library.

Both processors use a four-line delay network with controllable diffusion, damping, and soft saturation. Reflekta adds modulated allpass diffusion. Cell controls a quadrature frequency shifter in the feedback loop. Feed is bipolar: left returns shifted feedback; right blends shifted and unshifted feedback for moving notches. Its distance from center sets feedback depth. Time is milliseconds; Form transforms sparse echoes toward diffuse tails. Output reaches digital silence at its minimum.

Vril uses Live's current sample rate; it does not force the hardware's fixed 96 kHz rate. Nonlinear FM/folding can produce aliasing at extreme settings. No claim of hardware calibration or bit accuracy is made.

## Verification

```sh
python3 scripts/check_build.py
node --test scripts/test_control.cjs
node scripts/check_dsp.cjs
```

The first command checks the instrument header, collective directory, embedded dependencies, graph connections, native controls, layout bounds, reproducibility, and single-file output. The second checks MIDI/control behavior. The third requires the bundled Max installation on this Mac, Node.js, and `clang++`; it parses the GenExpr and runs a separate numerical C++ harness. It checks all nine algorithms at 44.1/48/96 kHz with neutral and extreme bipolar controls, plus MIDI release and mute behavior. The experimental bundled parser's operator-chain reduction is corrected **in memory only** for this numerical test. No application or vendor files are modified.

**Native release verification is pending.** Desktop automation timed out while trying to open the editable validation patch, then failed to deliver the clipboard. Neither native Gen compilation, the rendered Max/Live panel, Live audio/MIDI playback, routing, session recall, nor opening the final frozen AMXD has been verified. The automated checks above do not substitute for those checks.

For native testing, `python3 scripts/native_qa.py` creates an isolated editable patch and recording harness under the system temporary directory. Open the printed `Vril Native QA.maxpat` in Ableton's bundled Max. It records 33 cases without connecting audio to speakers and saves the editable patch. Inspect `native.log` and the resulting WAV files. Then load the final AMXD in Live, inspect the native panel and Max console, exercise all algorithms, notes/releases/sustain/bend, input routing, Random/Panic, automation, and save/reopen the Live Set. Finally test a copy of the AMXD away from the sources to confirm dependency isolation.

Packaging references: [Cycling '74 — Freezing Max for Live devices](https://docs.cycling74.com/userguide/m4l/live_freezing/), Ableton's bundled Max Instrument template, and the frozen collective format used by the existing neighboring Max projects. All technical checks here concern the local artifact, not a published or host-certified release.
