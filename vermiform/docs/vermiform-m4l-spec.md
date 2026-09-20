# Vermiform Speech Synthesis Device — M4L Build Spec

Target: Max for Live audio effect/instrument, gen~ for DSP, JS/Node for Max for control logic. Based on the seven-core architecture of Martin Howse's ERD/WORM, reimplemented rather than ported (see licensing note at end).

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Max Patcher (.amxd)                                     │
│                                                            │
│  ┌───────────────┐   control msgs    ┌─────────────────┐ │
│  │ js/Node for Max│ ────────────────▶│  gen~ patch      │ │
│  │                │                   │  (audio thread)  │ │
│  │ - mode state   │◀──────────────────│                  │ │
│  │ - worm engine  │   poll/meter      │  - lattice filter│ │
│  │ - phrase/table │                   │  - resonator bank│ │
│  │   management   │   data writes     │  - excitation gen│ │
│  │ - UI logic     │ ────────────────▶ │  - RAM buffer    │ │
│  └───────────────┘                   │    (compost)      │ │
│         │                             └─────────────────┘ │
│         │ Live API                            │            │
│         ▼                                      ▼            │
│  live.object / live.observer          audio out (stereo)   │
└─────────────────────────────────────────────────────────┘
```

**Division of labor:**
- **gen~** owns everything that must run per-sample: filter recursion, resonator banks, excitation (pulse/noise) generation, and the RAM ring buffer for Compost modes. All state lives in `Data`/`History` objects inside the gen~ patch.
- **JS/Node** owns everything event- or UI-rate: which of the 64 modes is active, phrase/phoneme table lookup, text-to-speech parsing (ASCII → phoneme index sequence), the worming/corruption scheduler, and translating Live device params into the coefficient writes gen~ consumes.
- Never put per-sample math in JS. Never put mode-switching debounce/UI logic in gen~ — it's clumsy there and you gain nothing.

---

## 2. Global Parameter Model

Matches the hardware's five knob+CV pairs plus mode/trigger, exposed as Live-automatable device params:

| Param | Range | Live behavior | Routes to |
|---|---|---|---|
| Mode | 1–64 (int) | enum/stepped, no smoothing | JS: selects core + submode, loads coefficient set |
| Speed | 0–127 → 1/32× to 4× | continuous | gen~: sample-rate divider / phase increment |
| X | 0–127 | continuous | gen~ (pitch/offset/bend) — meaning is mode-dependent |
| Y | 0–127 | continuous | gen~ (duration/gate/step index) — mode-dependent |
| Z | 0–127 | continuous | JS→gen~ (phoneme/phrase/bank navigation) |
| Trigger | bang / gate | button or MIDI note-on | gen~: phase reset, or buffer freeze (mode-dependent via jumper analog) |
| Jumper A (sim) | toggle | Speed range: normal / 1/32× stretch | JS |
| Jumper B (sim) | toggle | Trigger mode: reset-on-trigger / mute-until-trigger | JS |

X/Y/Z semantic remapping per mode group happens entirely in JS — it relabels and rescales before writing to gen~'s `param` inlets, so gen~ never needs to know *why* a value changed, only what to do with it.

---

## 3. Algorithm Cores

### 3.1 Speak and Worm — TI LPC (TMS5100/5200/5220), Modes 1–21

**Model:** 10-stage lattice (reflection-coefficient) filter, glottal pulse/noise excitation.

```
Per sample:
  u[n] = energy * (voiced ? pulse_train(pitch) : white_noise())
  for k = 10 downto 1:
    b[k] = a[k-1] + K[k] * f[k]
    f[k] = f[k-1] + K[k] * a[k-1]     // lattice recursion, a/f are fwd/bwd residuals
  output = b[0] (or a[10], depending on convention)
```

- **Params:** K[1..10] (10 reflection coefficients, |K| < 1 for stability), pitch period, energy/gain, voiced/unvoiced flag.
- **gen~ notes:** store K[1..10] in a `Data` object (length 10, per active frame). Use `History` for the forward/backward residual delay lines — do NOT try to build a shift register with pointers, there aren't any.
- **Modes 1–4:** phrase bank playback — JS steps through a table of stored K-coefficient frames (one frame ≈ 25ms of speech, matches original TMS frame rate) and writes them into the gen~ `Data` object on each frame tick.
- **Modes 5–6:** raw frame access — Z knob indexes directly into the frame table, no phrase logic.
- **Mode 7:** TTS — needs a phoneme→coefficient-frame dictionary in JS (build once, store as JSON/dict).
- **Modes 8–10:** raw register write — X/Y/Z map directly to individual K values, bypass frame tables entirely.
- **Modes 11–21 (worming):** this is the corruption target. Options: freeze K[k] at boundary values (near ±1, risk of instability — clamp), randomize K[k] with correlated drift, swap coefficient order, or index into a **wrong** frame's coefficients on purpose (memory "bleed"). Implement as a corruption function in JS that mutates the `Data` buffer contents on a schedule (see §6).

### 3.2 Intelliworm — GI SP0256, Modes 22–28

**Model:** cascaded digital filter driven by stored ROM allophone frames (64 standard allophones).

- **Params:** allophone index (0–63), pitch, duration.
- **gen~ notes:** simpler than LPC — closer to a lookup-and-filter than full lattice recursion. Store allophone filter-coefficient sets as a `Data` array indexed by allophone number.
- **Mode 24:** TTS parser — text → allophone sequence, in JS.
- **Mode 28:** direct clock-bend — expose the internal update-rate divider as a raw parameter with freeze-on-trigger.

### 3.3 Vermis — Votrax SC-01/SC-02 (Gagnon architecture), Modes 29–36

**Model:** discrete formant bandpass filters + noise source + inflection generator (not lattice-based — this is the odd one out, closer to classic subtractive synthesis).

- **Params:** formant center frequencies/bandwidths (bank of parallel or cascade bandpass filters), inflection (pitch contour) generator, noise/tone mix.
- **gen~ notes:** implement as N parallel biquad bandpass filters (`biquad~`-equivalent in codebox, or hand-rolled Direct Form II) summed, driven by pulse+noise excitation. This maps naturally to gen~'s strengths — you're not fighting lattice recursion here.
- **Modes 33–35 (overdrive):** push formant filter clock/Q past stable range deliberately — this is your "aggressive metallic" mode, cheap to get and worth prioritizing early since it's a good stress-test of the resonator bank.
- **Modes 31–32:** arcade phrase banks — same frame-table pattern as LPC modes, different coefficient format.

### 3.4 Saw — Commodore 64 SAM, Modes 37–46

**Model:** software formant synthesis, similar resonator-bank shape to Vermis but lower-fidelity/lower-bitrate by design (this is the "cheap" voice of the set).

- **Params:** formant frequencies, low-bitrate quantization stage (deliberately bitcrush the control values, not just the audio, to match SAM's character).
- **gen~ notes:** reuse the Vermis resonator bank code, add a quantizer stage on the coefficient inputs. Modes 45–46 expose that quantizer's step size directly as a "worming" parameter — an easy, high-value corruption knob.

### 3.5 Digiwormer — Mozer/Digitalker, Modes 47–49

**Model:** time-domain waveform reconstruction from symmetry-compressed data (not a filter at all — closer to a lossy waveform codec).

- **Params:** vocabulary index, pitch tracking, (mode 49) bit-shift and phase-inversion amount on the reconstructed segments.
- **gen~ notes:** store reconstructed waveform segments as `buffer~`/`data` content, played back with pitch-tracked read-pointer speed. Mode 49's bit-shift/phase-invert is cheap: apply directly to the buffer read logic, easiest "worming" mode in the whole device — do this one early as a confidence-builder.

### 3.6 Wormant — Klatt/Klattalk, Modes 50–60

**Model:** cascade/parallel formant resonators (F1–F5) + glottal source + nasal zero-pair filter. Most parameter-rich core.

- **Params:** F1–F5 center freq + bandwidth, glottal source shape/amplitude, nasal zero-pair freq.
- **gen~ notes:** this is the most complex core computationally (most taps) but conceptually identical to Vermis's resonator bank, just more of them plus a nasal anti-resonance stage. Build Vermis first, extend to Wormant.
- **Mode 59:** raw register access to resonator bandwidths and glottal rate — highest-value manual-sound-design mode, prioritize alongside 50/53.

### 3.7 Compost — RAM buffer processor, Modes 63–64

**Model:** not speech synthesis — a ring buffer continuously fed by the output of whichever core last ran, exposed for granular scrubbing/freezing.

- **Params:** X = start point, Y = loop length, Z = window position (mode 63); trigger = freeze (mode 64).
- **gen~ notes:** standard granular buffer read/write, nothing exotic. This is your lowest-risk mode to implement and a good first end-to-end audio-out test once *any* core is producing signal.

---

## 4. UI Spec

Two device variants recommended:

**A. Audio Effect** — external audio in as excitation source (vocoder-style: your input drives the glottal/noise excitation instead of the internal generator). Good for the "worming" concept applied live to guitar/synth/voice.

**B. Instrument** — MIDI note-in drives pitch (X) and note-on drives trigger. Good for playing phrase/phoneme banks melodically.

**Layout (top to bottom):**

1. **Mode display/selector** — not a flat 1–64 dial. Group as a two-stage picker: Core (7 options: Speak/Intelli/Vermis/Saw/Digi/Klatt/Compost) → Submode within core. This is far more usable than the hardware's single continuous mode pot, and still maps back to a single 1–64 Live param underneath for automation compatibility (compute the flat index from the two-stage UI choice).
2. **Speed** knob, with Jumper-A toggle (normal / 1/32× stretch) next to it.
3. **X / Y / Z** knobs, each with a small text label that updates based on active mode (e.g. "X: Pitch" vs "X: Bend Intensity") — implement via a JS-driven `live.text`/`live.comment` object that just changes its displayed string, no audio implication.
4. **Trigger** button + Jumper-B toggle (reset-on-trigger / mute-until-trigger).
5. **Worm engine panel** (this doesn't exist on the hardware — it's your addition): corruption rate, corruption depth, and a "corrupt now" one-shot button. This is the part of the concept the hardware doc frames as central (software worming / memory rot), so give it real UI real estate, not a hidden submenu.
6. **Scope/meter**: a `jsui`-based buffer scope for Compost modes (visual only, fine to run at UI rate) showing current ring-buffer read/write position.
7. **8 Live macro mappings** (device's Macro Snapshot-ready): suggest Mode, Speed, X, Y, Z, Worm Rate, Worm Depth, Trigger — gives you a sensible default macro bank without extra config.

---

## 5. Worming / Corruption Engine (JS layer)

This is the conceptual core of the original device — don't treat it as an afterthought bolted onto "clean" synthesis.

**Corruption operations to implement** (apply to the active core's `Data` buffer contents):
- **Coefficient jitter** — add correlated random walk to K[k]/formant values, clamped to stability bounds.
- **Frame bleed** — read coefficients from an adjacent or random frame index instead of the requested one.
- **Bit rot** — flip/mask bits in the stored coefficient values directly (this is the most literal "memory decay" operation and the closest to the hardware doc's framing).
- **Loop lock** — force the microsequencer's repeat pointer to freeze, replaying one frame indefinitely.
- **Order swap** — reverse or shuffle the coefficient stack order (K[1]↔K[10] etc.) — cheap, dramatic, stable.

**Scheduling:** run corruption as a JS `Task` (or `metro`-driven bang into JS) at a rate set by the Worm Rate param, with Worm Depth scaling how many coefficients/how much bit-mask gets touched per tick. Keep the *un-corrupted* source table intact in a separate buffer so "corrupt now" / rate-zero can be a clean reset rather than requiring a reload.

---

## 6. Implementation Tips

- **gen~ codebox has no pointers and no arbitrary recursion.** One-sample delays go through `History`; multi-sample delay lines go through `Delay`; persistent tables go through `Data`. If you're translating literal C (e.g. from MAME's chip cores), you're translating *structure*, not doing a copy-paste port — budget time for this.
- **Stability guard on all recursive filters.** Clamp lattice K[k] to (-0.999, 0.999) and clamp resonator Q/bandwidth to sane ranges *before* corruption gets applied — the worming engine will otherwise find the unstable edge immediately and blow up outputs. A soft clip/limiter on the final gen~ output as a safety net is cheap insurance.
- **Mode switching without clicks.** Don't hot-swap `Data` buffer contents mid-block. Either switch at a zero-crossing/frame boundary, or crossfade old/new coefficient sets over a few ms in gen~ using a ramped mix parameter driven from JS.
- **64 modes as a Live enum param will jump discretely under automation** — that's actually correct/desired here (matches the hardware's mode-pot behavior), but document it so future-you doesn't "fix" it into smooth interpolation between unrelated algorithms.
- **poly~** if you want simultaneous multi-voice (e.g. chord-triggered phrase playback, or layering two cores). Each voice gets its own gen~ instance and `Data` state; the worm engine either corrupts per-voice or writes to a shared table depending on whether you want unison-corrupted or independently-decaying voices — worth exposing as a toggle.
- **Phrase/phoneme table format:** settle on one JSON schema early (e.g. `{core, frames: [{coeffs: [...], duration, pitch}]}`) so all seven cores' JS-side table logic is uniform, even though the underlying DSP differs per core.
- **Reference audio for tuning:** MAME has working emulation cores for TMS5220, SP0256, Votrax SC-01, and the S14001A (Mozer) chip — useful as ground truth to A/B your gen~ output against. If you pull literal coefficient tables or code structure from `microresearch/WORM`'s firmware, note it's GPL-2.0+: fine for reference/personal use, but check compliance implications before any commercial release of your M4L device.
- **Build order** (lowest-risk to highest-value):
  1. Compost buffer (mode 63) — gets you audio I/O and a working gen~/JS bridge with the simplest DSP.
  2. Digiwormer bit-shift (mode 49) — simplest "worming" payoff, validates the corruption-engine plumbing.
  3. Vermis resonator bank (modes 29–36) — establishes the parallel-filter pattern reused by Saw and Wormant.
  4. Speak and Worm LPC lattice (modes 1–21) — the hardest core, do it once the patterns above are proven.
  5. Intelliworm, Saw, Wormant — mostly reuse of established patterns at this point.
  6. Worm engine UI polish + macro mapping + two-stage mode picker last, once all cores exist to pick between.
