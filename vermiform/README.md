# Vermiform

A monophonic Max for Live speech instrument with seven voice families, 64 stepped modes, and an editable memory-corruption engine. Designed from `docs/vermiform-m4l-spec.md` and the ERD/WORM manual.

## Play

Load `device/Vermiform.amxd` on a MIDI track. Arm the track and play notes, or enable **DRONE** for continuous speech; Drone holds until you switch it off (which stops the voice, exactly as **STOP** does) and ignores Live's transport/clip stop. The middle Speed setting, 64, is normal speed. **1/32** stretches the entire speech clock. **STOP** silences the instrument and restores clean working frames.

Choose a **core**, then a **submode**. These two selectors control the single automatable **Mode** parameter (1–64). The labels above X, Y and Z follow the selected mode. MIDI adds pitch transposition around middle C; note priority is last played, sustain uses CC64, and pitch bend is ±2 semitones.

**ARM** mutes continuous playback until Trigger is pressed. **TRIGGER** restarts a phrase, or toggles freeze in modes 28, 35 and 64. A manual trigger without Drone plays one phrase. MIDI note-off closes the output gate when the last held/sustained note is released.

## Text and speech lists

In a TTS mode (7, 24, 30, 39, 40), enter up to 160 characters and press **SPEAK**. Y selects a character position and Z changes its letter. The supplied vocabulary has explicit pronunciations; other English words use a compact spelling-to-phoneme parser. This is intentionally robotic speech, not a natural-language voice service.

In list modes, the position control selects one of 16 slots and Z writes an allophone into that slot. Text and the phoneme list are saved with the device state.

## Worm engine

- **Rate:** zero disables scheduled corruption and restores the clean source. The active range is approximately 0.1–20 corruption events per second.
- **Depth:** how strongly each event changes the working speech frame.
- **Jitter:** bounded, correlated coefficient or pitch drift.
- **Frame bleed:** borrow data from another allophone.
- **Bit rot:** alter quantized coefficient bits or decoded segment resolution.
- **Loop lock:** alternate between repeating the current phoneme and advancing.
- **Order swap:** reorder reflection coefficients/formants or reverse the segment address.
- **CORRUPT:** apply one event. **RESTORE:** discard mutations and release loop lock.

Original source tables remain intact. Raw and bent modes apply their documented X/Y edits on top of the working frames; Restore clears additional worm-engine corruption while preserving those knob settings.

## Compost

Modes 63–64 keep synthesizing the last speech mode with its previous speech settings. The ring holds 524,288 stereo samples (about 11.9 seconds at 44.1 kHz). X moves the loop start, Y sets length, and Z blends overlapping windows. Mode 64's Trigger freezes/unfreezes writing. The scope shows the ring's sampled waveform and the live write/read positions. Memory itself is volatile and is not serialized into a Live Set.

The spec's start/length/window mapping is used for Compost. The original hardware manual instead labels Y End and Z Mode. Modes 61–62, omitted by the build spec, are included in Wormant as the manual specifies.

## Architecture and fidelity

This is an original implementation inspired by the documented chip families; it is not a ROM emulator or a firmware port. No original WORM firmware, chip ROMs, arcade recordings, or extracted commercial vocabulary are included. Factory phrases and allophone coefficients are newly authored. The seven families use:

1. Speak & Worm: ten-stage LPC lattice.
2. Intelliworm: allophone-driven cascade.
3. Vermis: parallel formant resonators and driven excitation.
4. Saw: quantized formant controls and low-resolution audio.
5. Digiwormer: quarter-wave symmetry reconstruction and segment bit rot.
6. Wormant: five-formant cascade/parallel network and nasal zeros.
7. Compost: stereo ring-buffer looping/freezing.

DSP runs in embedded `gen~`; JavaScript handles speech frames, text, MIDI and corruption. The historic speech clock runs at 8 kHz at normal Speed. Recursive states and coefficients are bounded, and the output has smoothing, DC rejection and soft limiting.

The single deliverable is the instrument variant. External-audio excitation and polyphonic layering are not included. The first eight-parameter controller bank is Mode, Speed, X, Y, Z, Worm Rate, Worm Depth, Trigger. This is a device controller bank; an Ableton Rack with macro knobs is not required or bundled.

## Repository

- `src/`: Gen source, JavaScript, generated original speech tables and waveform segments.
- `scripts/`: reproducible build and validation tools.
- `scripts/build/`: ignored, unfrozen staging device and its dependencies.
- `device/`: final frozen AMXD.
- `docs/`: original spec/manual and verification evidence.

Build: `python3 scripts/build.py`. Controller tests: `node scripts/test_control.cjs`. Native test harness: `python3 scripts/build_qa.py`, then load `scripts/build/Vermiform QA.amxd` in Live. It records all modes to `docs/verification/audio/` with speaker output muted. Analyze with `python3 scripts/check_audio.py`.

`scripts/build.py` freezes automatically: it stages editable sources in `scripts/build/`, then embeds them directly into `device/Vermiform.amxd`'s dependency footer (same container format Live writes when you freeze by hand), so the shipped device needs nothing beside it. Open `scripts/build/Vermiform.maxpat` in Max instead when you want to live-edit and reload a dependency without a full rebuild.
