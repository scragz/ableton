# Coagula

Max for Live **Instrument** (MIDI in, stereo out). Load one long sample (target ~1 hour); it is
analyzed once into four segmentations plus descriptors, then played back by descriptor-space
retrieval under live modulation. Spec: `docs/coagula-spec.md`.

Build: `python3 scripts/build.py` → `device/Coagula.amxd` (frozen, single file) plus the editable
`device/Coagula.maxpat` and loose deps. `python3 scripts/build.py --qa` → `tests/qa/Coagula QA.amxd`
with an OSC test port (never ship it).

## Architecture

| Part | File | Role |
| --- | --- | --- |
| Engine | `src/coagula-engine.js` (Node for Max) | Decode, frame analysis on worker threads, 4 segmentations, per-segment stats, sidecar I/O, buckets, kNN retrieval, selection order |
| Player | `src/coagula.genexpr` (gen~) | One pending-segment slot, Chain / Clock / MIDI triggering, 32 voices, equal-power crossfades, peak limiter |
| Control | `src/coagula-control.js` (js) | Starts the engine, parameter marshalling, Morph/Link, dimming, MIDI gate, sample path (pattr blob) |
| Face | `src/coagula-panel.js`, `src/coagula-space.js`, `src/coagula-wave.js` (jsui) | Sections and readouts; scatter plot / XY target; Source display (Drop Sample Here → waveform overview, analysis progress, last played segments) |

**Engine start-up.** `node.script` will not run a script that only exists inside a frozen device
(verified in Live 12.4 / Max 9.1: nothing starts). The control script reads the embedded
`coagula-engine.js` with Max's `File`, writes it to `/tmp/coagula-engine-<hash>.js`, and scripts a
`node.script` pointing at that file. Messages to Node go through `s/r ---tonode` (a `[t a]` in
between turned every message into the symbol `a`).

**Selection → playback.** gen~ raises out 3 whenever its pending slot is empty (Chain/Clock);
`edge~` → `need` → the engine marks the previous pick as playing, runs the selection order, and
sends `pend commit start len rate gain xf` (commit last, via `unpack`). Chain starts the next
segment at *end − crossfade* sample-accurately; Clock consumes the slot on each tick; MIDI commits on
note-on and fires immediately. Moving a playback parameter re-picks the waiting segment (throttled 15 ms).

## Differences from the spec

- **No MuBu.** Not installed, and its externals can't be embedded in a single frozen device.
  Analysis, persistence and retrieval run in Node; playback in gen~. Behaviour follows the spec;
  the "Verify before build" questions are moot. Answers where they still matter:
  - Flatness: geometric/arithmetic mean of the frame power spectrum.
  - Pitch: YIN on a ~11 kHz decimated copy (FFT autocorrelation), median of voiced frames.
  - Onsets: log spectral flux with an adaptive median threshold, backed up to the attack valley.
  - Hybrid variants split long onset segments into equal parts ≤ the limit (no stub remainders).
  - Sidecar format: one binary `.bin` per variant (float64 columns) + `manifest.json` written last.
    Swapped in with renames; the invalidated sidecar it replaces is removed.
  - Sample path: `pattr` blob parameter (Stored Only). The `live.drop` under the Source display is a Stored Only parameter too (it only accepted drops once parameter mode was on), kept in step with `set`; `decodemode 0` so we get the original file, not Live's temporary decode.
  - Waveform overview: 512 min/max bins of the mono sum, written to `overview.bin` in the sidecar (rebuilt from the audio for older sidecars).
  - UI blocking: none. Analysis runs out of process on worker threads (1-hour stereo WAV: ~8 s on
    the dev Mac); cached reload is well under a second.
- **Pause segments.** Onset-based variants also cut where loudness crosses an analysis *Gate*
  (−50 dB, advanced panel), so pauses exist as segments and the Silence bucket has members.
- **Axis ranges** use the 1st–99th percentile of the bucket, not raw min–max, so one tracker
  outlier can't squash the target space.
- **Max length** dial runs 20–1000 ms; the top position is **Off** (the panel draws the value).
- **Percent dials.** Target X/Y, Morph, Silence density, Unvoiced mix, Continuity and Jitter show
  0–100 %; the engine gets 0–1 (Jitter 0–50 % = 0–0.5).
- **Gain** is a native `live.gain~` fader in an Output section (not on the controller banks'
  order-sensitive dial list, but it is in bank 1).
- **Silence density default** is set to the new coagula's pause ratio (segment count share) when a
  new sample is dropped or loaded; reopening a Set keeps the saved value.
- **Analysis progress** reports frames % (the shared pass is almost all the work), then variant n/4.
- **Clock** runs while Run is on or a note is held; with Sync it also needs the transport running.
- Formats: WAV / RF64 / AIFF / AIFC parsed directly; anything else Max can read is converted once
  with macOS `afconvert` to a cached float WAV that both analysis and playback use.
- **macOS only** as built (`/tmp` extraction, `afconvert`, `~/Library/Caches/Coagula` fallback).
- Collect All and Save won't collect the sample (it is referenced by path). Not warned in the UI.

## Testing

Automated checks cover logic and packaging only. They never replace loading the device in Live.

- `node --test tests/*.test.cjs`: FFT, decoders, YIN, segmentation, sidecar invalidation and
  crash safety, selection order / guard / clamps / fall-through, and the GenExpr through a JS harness.
- `node tests/render.cjs <sample.wav> [seconds] [morph] [variant] [axis]` renders Chain mode offline
  with the real engine and GenExpr to `tests/render-*.wav`.
- QA build: `python3 tests/osc.py /drop <path>`, `/set <param> <value>`, `/note <p> <v>`,
  `/node qa /tmp/coagula-qa.log` (engine log), `/qalog <file>` (control log).

Checked in Live 12.4.6: engine starts from the frozen device; a speech file and a 1-hour stereo
WAV analyze, write the sidecar and reload from it; Chain, Clock and MIDI (with key tracking and
Retune) play; Morph drives the bundled dials; scatter plot clicks set Target X/Y; the Analysis page
shows counts. **Not yet checked:** Set save/reopen restoring the path, read-only folder fallback,
Sync against the transport, and anything by ear beyond the meters.
