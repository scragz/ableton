# Autocatalysis: design notes

Why the engine is shaped the way it is. The README describes what the device does; this file
records the reasoning, the decisions and the approaches that were tried and dropped.

## Brief

- Guitar-into-amp-on-stage feedback.
- An **instrument**, not an effect: MIDI plays it and nothing needs to come in.
- **Stereo offset**: two amps at different distances.
- No hardware insert.
- Monolithic: one device, one gen~.

## Physics kept

| Real thing | Model | Why it matters |
| --- | --- | --- |
| Loop delay = distance / c | Fractional air delay per amp | A frequency only sustains when the loop phase lines up, and candidates sit 1/τ apart. Walking toward the amp walks those candidates across the string's harmonics, which gives the harmonic jumps |
| Strings choose the pitch | 6 waveguides, injection scaled to their loss | Without high-Q string selection it is PA squeal, not guitar feedback |
| Shared saturation | Preamp and power tanh shared by every mode | Winner-take-all: one feedback pitch locks in |
| Fingers damp strings | Released strings are damped and their coupling cut | Releasing a note stops the feedback instead of leaving muted strings to carry it |
| Pickup position | Neck / bridge combs | Each pickup hears different harmonics, which gives the two amps different material for stereo |
| Supply sag | Reservoir S, gain ∝ S² | Compression and bloom |
| Hollow body howl | Body resonators coupled to the pickups | The body can feed back by itself, as hollow bodies do |

## Decisions

- **No pitch tracking.** The first draft was an effect: it tuned resonators to sigmund~ peaks of a
  DI guitar. As an instrument, MIDI gives the pitches exactly, so the analysis stage went away and
  the strings became real waveguides with plucks.
- **Two amps, one guitar.** Both amps hear the same strings. Stereo comes from the neck and bridge
  pickups, the two distances, and each amp's own supply and reaction state. Giving each amp its own
  strings would make two unrelated instruments.
- **Injection normalisation** is `(1 − g_free)^0.7`, with g_free the string's per-period gain when
  free to ring.
  - Full normalisation (`1 − g`) makes the loop gain independent of sustain, but then damped strings
    feed back as easily as held ones.
  - No normalisation makes high notes feed back 30 dB more easily than low ones.
  - The 0.7 power sits in between: more sustain means a little more feedback, and a damped string is
    about 35 dB down at any pitch.
- **Released strings lose coupling (×0.06), and the drive is low-passed at 1.5 kHz.** Before this,
  releasing a note left a 2.7 kHz squeal running through the six damped strings' broadband floor.
- **The Brusselator replaced the sag-only "breathing".** A reservoir plus a saturated loop is a 2-D
  system with negative trace, so it is always a damped focus and never breathes. An amplitude
  expander (gain rising with level) didn't fix that either: it still settled. The Brusselator brings
  its own limit cycle, and feeding the amp's level into A gives the cross-coupling: loud settles,
  near the edge pulses.
- **Seek solves for the spot; it doesn't search.** Two blind searches failed.
  - *Extremum seeking* (dither the delay, correlate with the target band's energy). Mode
    competition is winner-take-all, so the target band's energy is flat until the switch happens.
    The gradient is noise.
  - *Sweep-and-lock* (sweep the delay across a fundamental period, stop when the target wins). The
    incumbent mode holds on through gain compression, so a newly aligned target needs to sit still
    to grow. By the time it does, the sweep has moved on, so in use it mostly went back and forth.
    It also never locked with chords (the 50 %-of-output test) or while the amp was breathing.
  - The fix uses the fact that the loop is known. Every linear stage is a filter whose coefficients
    are on hand: TPT SVFs are exact bilinear transforms, s = j·tan(ω/2)/g. Every delay is known.
    The tanh stages are memoryless, apart from ADAA's half sample each.
  - So the open-loop phase at each harmonic is computed directly, and the offsets that zero it for
    the target come out in closed form. Candidates are ranked by competitor alignment, weighted by
    the string's resonance gain (1 / (1 − g·|H_loop(ω)|)). Lock means the target is the strongest
    of the note's first four harmonics. Seek only moves on from a spot that never caught.
  - Offline grid (E2/A2/E3/A3/E4 × 0.5/1.2/2.0/3.1 m, one held note, 8 s): Fund 16/20 (the four
    misses are low E, flagged Weak), Oct 20/20, 12th 17/20. The old sweep on the same grid scored
    Fund 20/20, Oct 4/20, 12th 14/20. That was with one note held still in the harness, which is
    kinder than playing.
  - 2 Oct is mostly flagged Weak at the default Spread: the neck pickup nulls harmonic 4.
- **Pickup comb delay is β·N, not 2β·N.** The first version doubled it, which put the neck pickup's
  null on the octave (k·2β = 1) instead of on harmonic 4 (k·β = 1). That was also why Oct seemed
  hard to seek.
- **Bias DC goes through the same ADAA.** Subtracting `tanh(bias)` left an ADAA residue (about
  1e-5) that seeded feedback with no note played. Running the DC point through the identical ADAA
  makes silence exactly 0.
- **No functions in the GenExpr**, and refresh-block values are History. This follows the
  workspace's harness convention, and gen~ locals do not persist between samples. The six strings
  come from one Python template in `scripts/dsp.py`.

## Forks not taken (yet)

- An analysis source that follows the loop instead of MIDI (resonators chasing their own output).
  This would drift away from the played notes. It could come back as a "Drift" mode.
- Amp-to-amp cross-coupling beyond what they share through the guitar.
- Per-string inharmonicity and fret position. A room-mic output.
