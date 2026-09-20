# Soma: Max for Live instrument design notes

Status: manual review and proposed implementation direction; no device implemented yet.

Primary reference: [Three Body manual](three-body-manual.pdf), all 25 PDF pages reviewed. Page references below use PDF page numbers. These notes distinguish documented module behavior from proposed software choices. The aim is an instrument based on the module; the manual alone is insufficient for an exact hardware emulation.

## What gives the module its character

Three oscillators form a network of phase modulation (PM), frequency modulation (FM), and ratio tracking. Each oscillator can run independently at audio or LFO rates. The outer oscillators can follow the center's frequency at integer multiplier/divider ratios. Default modulation connections allow harmonic tones, stereo motion, and feedback that develops into noise without repatching. [pp. 4–12, 16–18]

The center's sine/cosine and saw/cosaw pairs are especially important: they start 90 degrees apart but receive PM in opposite directions. Their relationship changes under modulation, producing stereo motion. Simply taking an ordinary oscillator and delaying one channel would not reproduce this behavior. [pp. 8, 17–18]

## Default signal connections

| Source | Destination | Amount control |
| --- | --- | --- |
| Left sine | Center PM input 1 | Center Phase Index 1, with index CV |
| Right sine | Center PM input 2 | Center Phase Index 2, with index CV |
| Center sine | Left FM input | Left FM Index, with index CV |
| Center cosine | Right FM input | Right FM Index, with index CV |
| Left sine | Right PM input | Right Phase CV |
| Right sine | Left PM input | Left Phase CV |
| Center frequency reference | Both outer oscillators in Ratio mode | Each outer multiplier and divider |

Plugging into a normalized input replaces its default source. Index CV inputs default to full positive control voltage (10 V), so the associated amount knobs work with no external index modulation. The center also has an FM input and attenuator, with no default modulation source specified. [pp. 5, 7, 9]

Preserve the asymmetry: the center has two PM index VCAs; the outer oscillators have FM index VCAs. They are not three identical sets of modulation controls.

## Oscillator modes and tuning

Each oscillator has eight states, selected by three switches. [pp. 6–7]

| Type | Modulation switch | Range switch | Behavior |
| --- | --- | --- | --- |
| Free | Exponential | Low / High | LFO / audio oscillator with exponential FM |
| Free | Linear | Low / High | LFO / audio oscillator with through-zero linear FM |
| Ratio | Phase | Divide / Multiply | Frequency tracking; FM jack applies PM; ratio CV changes denominator / numerator |
| Ratio | Linear | Divide / Multiply | Frequency tracking with through-zero linear FM; ratio CV changes denominator / numerator |

In Free mode, coarse/fine controls tune pitch, V/Oct changes local pitch, and Transpose adds pitch to every Free oscillator, including LFOs. In Ratio mode, coarse/fine become multiplier/divider, V/Oct becomes ratio modulation, and Transpose has no direct effect. A ratio follower still changes frequency when its source changes.

The conceptual ratio is `tracked frequency × multiplier / divider`. Ratios must not be interpreted as equal-tempered semitone steps. The manual does not specify the maximum integers or exact CV-to-integer mapping.

The dedicated PM inputs remain active in every mode. Free-mode Sync is hard sync; Ratio-mode Sync supplies a frequency-tracking source. Default tracking follows frequency without locking phase. External period tracking averages eight rising-edge measurements; PLL tracking is an optional alternative. [pp. 6, 19–20]

## Waveforms and phase direction

| Output | Available on | Default PM direction |
| --- | --- | --- |
| Sine | All three | Subtract |
| Triangle | All three | Add |
| Saw | All three | Subtract |
| Square | All three | Subtract |
| Cosine | Center | Add, with a quarter-cycle offset |
| Cosaw | Center | Add, with a quarter-cycle offset |

The software should calculate these from shared oscillator phase state with the appropriate output-specific PM, rather than treating every output as a separate oscillator. [pp. 8, 17]

Optional hardware configurations worth exposing later: common positive PM direction for all waveforms; square outputs unaffected by PM; approximately 3 kHz / 6 kHz filtering on outer PM and center FM external inputs; and PLL external tracking. Calibration and power specifications do not need instrument controls. [pp. 18–23]

## Proposed Max for Live adaptation

Start with one complete three-oscillator voice, playable by MIDI, with a drone mode. Keep three visible oscillator sections and the default modulation connections. Add an amplitude envelope, velocity response, pitch bend, output gain, and a stereo output selector. These are software additions, not features described in the module manual.

Suggested output choices:

- Center sine / cosine for the main stereo voice.
- Center saw / cosaw for a brighter stereo voice.
- Left / right outer waveforms for stereo FM.
- A mixer for hearing the oscillators together.

Map MIDI pitch to the common pitch reference for Free oscillators; let Ratio oscillators follow their selected source. Consider an explicit keyboard-tracking toggle for LFOs as a convenience, since the hardware's global Transpose also affects them. Start with the center Free/High and outer oscillators in Ratio mode. Keep modulation amounts at zero in the initial patch.

Use source selectors to replace default modulation connections without requiring a virtual cable interface. Add internal modulation envelopes/LFOs after the audio core works. External audio tracking and host-clock tracking need separate routing and behavior design. Polyphony can follow once the cost and sound of a single complete voice are established.

## Proposed audio architecture

Put the coupled oscillators and feedback in one `gen~` engine per voice. Gen supports per-sample processing and explicit single-sample feedback via `history`; this lets us define the feedback timing deliberately. This is an implementation proposal, not a claim about the hardware's internal update ordering. [Cycling '74 Gen overview](https://docs.cycling74.com/userguide/gen/_gen_overview/), [Gen operators](https://docs.cycling74.com/userguide/gen/gen~_operators/)

Use signed phase increments for through-zero linear FM and wrap phase correctly in both directions. Apply PM at waveform generation, separately from the phase accumulator's frequency update. Smooth continuous UI controls without erasing deliberate stepped ratio changes. Keep audio-rate modulation in the audio engine.

Prototype selectable 2× / 4× / 8× oversampling around the complete interacting engine using `poly~`, with resampling filters enabled. Measure CPU and aliasing before selecting defaults or enabling multiple voices. Cycling '74 documents power-of-two upsampling and resampling filters in [the poly~ reference](https://docs.cycling74.com/reference/poly~/).

The hardware uses a 12.5 MHz internal audio path and approximately 96 kHz output conversion. Modest software oversampling will not establish equivalent alias performance, especially for deep feedback and discontinuous waves. Frequency limits, waveform treatment, and downsampling filters require listening and spectral checks. [p. 3]

## Manual ambiguities and limits

- Page 5 labels both outer FM sources as center sine; page 9 explicitly identifies center cosine for the right side. Use page 9's explicit routing description.
- Page 7's input table swaps the oscillator labels for Phase Index and FM Index, and describes FM Index as controlling phase. The panel, block diagram, and controls description establish center PM index VCAs and outer FM index VCAs.
- Sync threshold is approximately 0.7 V on page 3 and approximately 1 V on pages 7 and 19. Exact comparator behavior is unresolved.
- Page 10 describes division using octave wording that should not be used as a mathematical tuning specification. Use the documented multiplier/divider concept.
- Exact tuning ranges, ratio bounds, modulation gain curves, filter topology, internal feedback latency, and internal ratio-reference behavior under center FM are not specified. Neither is the center's no-input behavior when switched to Ratio. Label prototype decisions explicitly; verify against hardware or implementation details if closer matching becomes a goal.
- The manual's FM/PM theory is practical guidance, not a complete DSP specification. In particular, its assertion that FM modulators must be below the carrier should not become a frequency clamp in our implementation.

## Build and verification order

1. Implement oscillator phase, tuning, modes, ratios, and all waveform outputs. Check zero-modulation frequencies, quarter-cycle offsets, and negative-frequency operation.
2. Add the default PM/FM paths, explicit feedback timing, and opposing PM output directions. Recreate the manual's ratio-PM and stereo-FM patches. Check zero-index isolation and replacement of normalized sources.
3. Compare oversampling settings at multiple host sample rates under high notes, deep FM, cross-PM, and bright waveforms. Check mono fold-down, bounded output, and CPU use.
4. Add MIDI, envelope/drone behavior, automation, saved parameters, and presentation controls. Verify note-off, repeated notes, pitch bend, reload, and actual playback in Live.
5. Add polyphony and advanced routing/tracking once the initial voice is musically useful and measured.

The first deliverable should demonstrate the manual's harmonic ratio patch, center stereo PM patch, and outer stereo FM patch in a playable instrument. Verification inside Max and Live remains necessary; a structurally valid patch file alone does not prove successful compilation or sound.
