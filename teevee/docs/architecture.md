This document consolidates the original system architecture with the new "Signal Artifacts" expansion. It redefines the Synesthetic Map and the precise signal flow to ensure the Audio and Video engines remain mechanically isomorphic.

# System Architecture 2.0: Teevee

## I. Core Concept

Teevee uses a **Parallel Twin Engine** architecture. Two simultaneous processing chains are driven by a unified control system.

  * **The Audio Engine (MSP):** High-fidelity, 64-bit, artifact-free DSP.
  * **The Video Engine (Jitter):** A reactive "Heads-Up Display" that visualizes the audio manipulations using metaphorical shaders.

**The Goal:** "What you see is what you hear." A 1:1 mapping of video aesthetics to audio physics.

-----

## II. The Expanded Synesthetic Map

This map defines how visual transformations translate to audio DSP. It is divided into **Core Transforms** (Geometry), **Artifacts** (Resolution/Color), and **Temporal States**.

### A. Core Transforms (Geometry)

*Manipulating the position and orientation of the medium.*

| Parameter | Visual Metaphor (GPU) | Audio Mechanism (MSP) | The Shared Experience |
| :--- | :--- | :--- | :--- |
| **SCROLL** | **Vertical Pan** (Y-Axis Offset) | **Delay Line** (Time Offset) | Pushing the content away into the "past." |
| **ZOOM** | **UV Scaling** (Stretch/Squash) | **Varispeed** (Repitch) | Stretching the medium. Zoom In = Slow Down. |
| **ROTATE** | **2D Rotation** (Twist) | **Frequency Shift** (Spectrum Shift) | Displacing content from its center/fundamental. |

### B. Signal Artifacts (Texture)

*Degrading the quality and integrity of the signal.*

| Parameter | Visual Metaphor (GPU) | Audio Mechanism (MSP) | The Shared Experience |
| :--- | :--- | :--- | :--- |
| **MOSAIC** | **Pixelation** (Spatial Res) | **Downsampling** (Time Quantization) | The grid becomes visible. "Robotic" ringing. |
| **ABERRATION**| **RGB Shift** (Channel Offset) | **Multiband Delay** (Spectral Split) | The constituent parts (colors/freqs) separate. |
| **BLOOM** | **Glow/Bleed** (Saturation) | **Overdrive** (Harmonic Distortion) | Energy overflows its container. Edges blur. |
| **SOLARIZE** | **Luma Inversion** (Threshold) | **Wavefolding** (Foldover) | Peaks are too high and wrap around. Metallic. |
| **CRUSH** | **Posterization** (Color Depth) | **Bit Reduction** (Amp Quantization) | The gradient steps become visible. Low-Fi. |

### C. Time & Space (Motion)

*Manipulating the persistence and flow of the signal.*

| Parameter | Visual Metaphor (GPU) | Audio Mechanism (MSP) | The Shared Experience |
| :--- | :--- | :--- | :--- |
| **SHUTTER** | **Strobe** (Frame Gating) | **Tremolo** (Amplitude Gating) | A rhythmic mechanical chopping of the stream. |
| **GHOSTING** | **Double Vision** (Lag) | **Slapback** (Short Delay) | A distinct "shadow" of the signal following it. |
| **SMEAR** | **Frame Feedback** (Blur) | **Reverb** (Decay) | The refusal of the signal to die. Infinite tails. |

-----

## III. System Topology & Signal Flow

To maintain the metaphor, the Audio and Video engines must follow the exact same logical order of operations.

**The Golden Chain:**
`Input` $\to$ `Geometry` $\to$ `Resolution` $\to$ `Distortion` $\to$ `Gating` $\to$ `Space` $\to$ `Output`

### Path A: The Audio Engine (MSP)

*File: `tv.audio.maxpat` & `tv.fx.maxpat`*

1.  **Input Buffer** (Circular Recording)
2.  **Geometry (The Read Head)**
      * **Scroll:** Delay offset (0–1000ms).
      * **Zoom:** Varispeed playback (0.5x–2.0x).
      * **Rotate:** Frequency Shifter (-500Hz to +500Hz).
3.  **Resolution**
      * **Mosaic:** `degrade~` (Sample Rate reduction).
4.  **Split**
      * **Aberration:** 3-band crossover (lores~ 300/3000, reson~) $\to$ mid/hi delayed, low dry.
5.  **Distortion**
      * **Bloom:** `overdrive~` / `tanh~` (Saturation).
      * **Solarize:** `gen~ sin(in1)` (True Wavefolding via sine shaping).
      * **Crush:** `degrade~` (Bit Depth reduction).
6.  **Gating**
      * **Shutter:** `phasor~` driven Tremolo (Square wave LFO).
7.  **Space**
      * **Ghosting:** Short `tapout~` (15-30ms) with high feedback (Metallic).
      * **Smear:** 4-tap FDN Reverb with lores~ damping and cross-channel feedback.
8.  **Output**

### Path B: The Video Engine (Jitter)

*File: `tv.viz.maxpat` (incorporating `tv.core.genjit`)*

1.  **Ingest** (Audio Features mapped to Matrix)
2.  **Geometry (Coordinates)**
      * **Scroll:** Offset Y.
      * **Zoom:** Scale UV.
      * **Rotate:** Rotate UV.
3.  **Resolution**
      * **Mosaic:** Quantize UV coordinates (Pixelate).
4.  **Split**
      * **Aberration:** Sample texture 3x with offsets for R, G, B.
5.  **Distortion**
      * **Bloom:** 4-Tap Blur + Threshold + Additive Blend.
      * **Solarize:** `abs(rgb - threshold)`.
      * **Crush:** Quantize RGB values (Posterize).
6.  **Gating**
      * **Shutter:** Multiplies output by Black based on Time LFO.
7.  **Space**
      * **Ghosting:** Mix with frame buffer from 2 frames ago.
      * **Smear:** Mix with immediate previous frame (Feedback).
8.  **Output**

-----

## IV. Module Architecture

The project structure is updated to house the new effects processing in dedicated sub-patches.

```text
Teevee_Project/
├── teevee.amxd             (The Shell)
├── modules/
│   ├── tv.main.maxpat      (Router)
│   ├── tv.audio.maxpat     (Path A: Core Geometry - Delay/Pitch/Shift)
│   ├── tv.fx.maxpat        (Path A: Artifacts - Crush/Bloom/Mosaic/etc)
│   ├── tv.ingest.maxpat    (Path B: Feature Extraction)
│   ├── tv.viz.maxpat       (Path B: Display System)
│   ├── tv.sync.maxpat      (Master Clock/LFOs)
│   └── tv.param.maxpat     (Parameter Handling)
└── code/
    ├── tv.core.genjit      (Video Gen: Geometry & Artifacts Shader)
    └── tv.encode.gendsp    (Audio Feature Extraction)
```

### Module Responsibilities

| Module | Responsibility | New Additions |
| :--- | :--- | :--- |
| **tv.audio** | **Geometry.** Handles the "Tape Head" logic. Buffer playback, pitch, and frequency shifting. | *Unchanged* |
| **tv.fx** | **Artifacts.** A serial chain of MSP objects handling the degradation and color effects. | Houses Mosaic, Aberration, Bloom, Solarize, Crush, Shutter, Ghosting. |
| **tv.viz** | **Visuals.** Manages the Jitter matrix and the Gen shader. | Now accepts 7 new parameters to pass to the shader. |
| **tv.core.genjit** | **The Shader.** The massive GLSL kernel processing the video. | Updated with all 7 new effect algorithms. |

-----

## V. Interaction Logic (Meta-States)

These operate outside the standard signal chain, affecting the *state* of the system.

### 1. FREEZE (The Datamosh) - Continuous Control

Freeze is implemented as a **continuous parameter** (0-1) rather than a binary switch, enabling a range of glitch effects:

| Freeze Value | Audio Behavior | Visual Metaphor |
| :--- | :--- | :--- |
| **0.0** | Live pass-through, buffer constantly updates | Normal video playback |
| **0.01 - 0.5** | Slow stutter (0.5-10 Hz gate), mostly live | Occasional frame drops |
| **0.5 - 0.99** | Fast stutter (10-20 Hz gate), mostly frozen | Heavy frame repeat/glitch |
| **1.0** | Full freeze, buffer stops updating entirely | Frozen frame (datamosh) |

**Implementation Details:**

```text
Freeze (0-1)
    ↓
┌─────────────────────────────────────────────────────────┐
│ Three-way logic:                                        │
│                                                         │
│ 1. Live Check: freeze <~ 0.01 → outputs 1 when live     │
│                                                         │
│ 2. Stutter Gate:                                        │
│    freeze → scale~ 0.01 0.99 20. 0.5 → phasor~ Hz       │
│    phasor~ → <~ 0.1 → 10% duty cycle write window       │
│    (Higher freeze = faster phasor = shorter writes)     │
│                                                         │
│ 3. Full Freeze Check: freeze >=~ 0.99 → !-~ 1.          │
│    When fully frozen, disable stutter gate entirely     │
│                                                         │
│ Final: live_check + (stutter * not_full_freeze)         │
│        → clip~ 0. 1. → write enable signal              │
└─────────────────────────────────────────────────────────┘
```

  * **Video:** `jit.poke~` stops writing. The matrix stops updating. The visualizer renders the "stuck" frame, allowing the effects (Zoom/Rotate) to manipulate the static image.

### 2. SCRUB (The Tape Slip) - Not Yet Implemented

  * **Audio:** Random noise added to read pointer. Causes pitch warble and timing jitter.
  * **Video:** Random noise added to the X-Axis offset. Causes "tracking error" horizontal shaking.

-----

## VI. Parameter Scaling Reference

All parameters are normalized (0.0 - 1.0) coming from the UI.

| Parameter | Audio Scale | Audio Object | Video Scale | Video Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Mosaic** | 1.0 $\to$ 0.05 SR | `degrade~` | 2048.0 $\to$ 10.0 cells | `floor(uv*cells)` |
| **Aberration**| 0ms $\to$ 40ms | `tapout~` | 0.0 $\to$ 0.05 offset | `uv + vec2(shift,0)` |
| **Bloom** | 1.0 $\to$ 8.0 Drive | `overdrive~` | 0.0 $\to$ 1.0 Intensity | Blur + Add |
| **Solarize** | 1.0 $\to$ 8.0 Drive | `gen~ sin` | 0.0 $\to$ 1.0 Thresh | `abs(col - sol)` |
| **Crush** | 24 $\to$ 4 Bits | `degrade~` | 255 $\to$ 2 Steps | `floor(col*steps)` |
| **Shutter** | 0Hz $\to$ 20Hz | `phasor~` | 0Hz $\to$ 20Hz | `sin(time * Hz)` |
| **Ghosting** | 0 $\to$ 0.8 Fdbk | `tapout~` | 0 $\to$ 0.5 Mix | Frame Buffer Mix |

-----

## Appendix I. M4L Object Compatibility (IMPORTANT)

### Objects NOT Available in M4L
These objects caused "No such object" errors:
- `gigaverb~` - Use tapin~/tapout~ or lores~ instead
- `freeverb~` - Use tapin~/tapout~ or lores~ instead
- `vdelay~` - Use buffer~/record~/groove~ or tapin~/tapout~ instead
- `wrap~` - Use `%~` (modulo) instead
- `yafr2` - Has internal `clip` objects that don't understand signals
- `pong~` - Use alternative wavefolding or ring modulation

### Objects Confirmed Working in M4L
- `buffer~`, `record~`, `groove~` - Varispeed buffer playback
- `buffer~`, `poke~`, `index~` - Circular buffer operations (use carefully)
- `tapin~`, `tapout~` - Fixed delay lines (message-rate delay time via inlet 1)
- `snapshot~` - Convert signal to message (requires metro/bang to trigger)
- `phasor~`, `scale~`, `-~`, `+~`, `*~`, `!-~`, `%~` - Basic DSP math
- `freqshift~` - Bode frequency shifter
- `lores~` - Resonant lowpass filter
- `degrade~` - Sample rate and bit depth reduction
- `tanh~` - Soft saturation/clipping
- `cycle~` - Sine oscillator
- `rect~` - Rectangle/square wave oscillator
- `line~` - Signal interpolation
- `selector~` - Signal switching
- `clip~` - Signal range limiting
- `r`, `s` - Receive/send with `---` prefix for M4L scoping
- `loadbang`, `metro` - Timing and initialization

### Critical Implementation Notes

1. **tapout~ Delay Time**: Must be message-rate, not signal. Use `snapshot~` with `metro` trigger to convert `line~` output to messages.

2. **groove~ vs poke~/index~**: For varispeed playback, `groove~` is more reliable than manual `poke~/index~` which can cause read/write collisions.

3. **snapshot~ Triggering**: Requires explicit bang input (inlet 1). Use `loadbang → t 1 → metro` pattern for continuous triggering.

4. **selector~ for Bypass**: Use `selector~ 2 1` with `sig~ 1` on input 1 for clean effect bypass without clicks.

-----

## Appendix II. tv.audio.maxpat Architecture (Geometry Core)

This module manipulates the time and frequency domains of the signal. It acts as the "Tape Head" with integrated freeze/stutter control.

```text
Input L/R
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 1: DELAY (SCROLL)                                 │
│ tapin~ 1100 → tapout~ (message-rate delay time)         │
│ line~ → snapshot~ 50 → delay time in ms                 │
│ [Param] Scroll (0-1000ms) controls delay offset         │
│ NOTE: tapout~ requires message-rate input, not signal   │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 2: VARISPEED (ZOOM) with FREEZE GATE              │
│ buffer~ ---tv_zoom_l/r 500ms                            │
│ record~ continuously writes to buffer                   │
│ Freeze gate controls record~ enable (inlet 2):          │
│   freeze-clip → sig~ 1 * gate → record~ enable          │
│   When freeze=0: gate=1, recording continues            │
│   When freeze>0: stutter gate controls write pulses     │
│   When freeze=1: gate=0, recording stops (frozen)       │
│ groove~ reads at variable speed (loop 1 on loadbang)    │
│ [Param] Zoom (0.5-2.0) → groove~ speed inlet            │
│ NOTE: groove~ handles interpolation automatically       │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 3: FREQ SHIFT (ROTATE)                            │
│ freqshift~ (Bode frequency shifter)                     │
│ [Param] Rotate (-500 to +500 Hz) controls shift         │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 4: LOWPASS FILTER (SMEAR)                         │
│ lores~ 20000 0.5 (resonant lowpass)                     │
│ scale~ 0. 1. 20000. 200. → cutoff frequency             │
│ [Param] Smear (0-1) → filter cutoff (20kHz→200Hz)       │
│ NOTE: Simple lowpass instead of full FDN reverb         │
└─────────────────────────────────────────────────────────┘
    ↓
Outlet L/R → To tv.fx.maxpat
```

### Freeze/Stutter Control

The Freeze parameter creates a continuum from live audio to fully frozen buffer:

```text
Freeze (0-1)
    ↓
┌─────────────────────────────────────────────────────────┐
│ FREEZE GATE: Phasor-based write control                 │
│                                                         │
│ freeze = 0:    Live pass-through (gate always open)     │
│ freeze 0→0.99: Stutter effect (phasor LFO gates write)  │
│                - Higher = faster stutter, less writing  │
│                - scale~ 0.01 0.99 20. 0.5 → phasor~ Hz  │
│                - phasor~ → <~ 0.1 → write gate (10% duty)│
│ freeze = 1:    Full freeze (gate always closed)         │
│                                                         │
│ Logic: (freeze < 0.01) + (stutter_gate * (freeze < 0.99))│
│        Combines live check with stutter for smooth blend│
└─────────────────────────────────────────────────────────┘
```

### Parameter Receives

  * `r ---tv_audio_scroll` → delay offset (0-1000ms)
  * `r ---tv_audio_zoom` → playback speed (0.5-2.0)
  * `r ---tv_audio_rotate` → freq shift (-500 to +500 Hz)
  * `r ---tv_audio_smear` → lowpass cutoff (0-1 normalized)
  * `r ---tv_audio_freeze` → freeze/stutter amount (0-1)

-----

## Appendix III. tv.fx.maxpat Architecture (Signal Artifacts)

This is a **serial processing chain** that applies texture, distortion, and spatial effects.

```text
Input L/R (From tv.audio)
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 1: MOSAIC (Resample)                              │
│ degrade~ 1. 24 (Audio degradation)                      │
│ [Param] Mosaic (1.0 -> 0.05) controls sample rate ratio │
│ Default 1.0 = no effect, 0.05 = heavy aliasing          │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 2: ABERRATION (3-Band Crossover Delay)            │
│ Signal splits into 3 bands:                             │
│   - Low: lores~ 300 Hz (no delay, passes through)       │
│   - Mid: lores~ 3000 → reson~ 300 3000 (bandpass)       │
│   - High: reson~ 3000 20000 (highpass)                  │
│ Mid/High each have tapin~ 100 → tapout~ delay           │
│ Delay times: Mid = param * 20ms, High = param * 40ms    │
│ Final: Sum of dry Low + delayed Mid + delayed High      │
│ [Param] Aberration (0-1) controls mid/hi delay spread   │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 3: BLOOM (Saturation)                             │
│ *~ drive → tanh~ (Soft Clip)                            │
│ [Param] Bloom (1.0 -> 8.0) controls drive amount        │
│ Drive of 1.0 = unity gain, minimal saturation           │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 4: SOLARIZE (True Wavefolding)                    │
│ signal * drive → gen~ sin(in1) → wavefolded output      │
│ Wet/dry crossfade: wet*param + dry*(1-param)            │
│ scale~ 0. 1. 1. 8. → drive amount (higher = more folds) │
│ [Param] Solarize (0-1) controls wet/dry + drive amount  │
│ NOTE: Using gen~ sin(in1) for true triangle wavefolding │
│       Drive multiplies signal before sin() for harder   │
│       foldover at peaks (the "wrap around" effect)      │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 5: CRUSH (Bit Depth)                              │
│ degrade~ 1. 24 (Bit quantization)                       │
│ [Param] Crush (24 -> 4 bits) controls bit depth         │
│ 24-bit = transparent, 4-bit = harsh quantization        │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 6: SHUTTER (Gating/Tremolo)                       │
│ rect~ (square wave LFO) for hard gating                 │
│ scale~ 0. 20. 0.1 30. → LFO rate (0.1Hz bypass trick)   │
│ >=~ 0.01 → +~ 1 → selector~ 2 1 (bypass when param=0)   │
│ sig~ 1 on selector input 1 for bypass                   │
│ [Param] Shutter (0 -> 20Hz) controls tremolo rate       │
│ NOTE: At param=0, selector outputs constant 1 (bypass)  │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 7: GHOSTING (Slapback)                            │
│ tapin~ 50 → tapout~ 20 (fixed 20ms delay)               │
│ delayed * param → wet signal                            │
│ dry + wet → output                                      │
│ [Param] Ghosting (0-1) controls wet mix amount          │
│ NOTE: No feedback - simple slapback echo                │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 8: SMEAR (FDN Reverb)                             │
│ 4-tap Feedback Delay Network per channel:               │
│   tapin~ 2000 → tapout~ with prime delay times          │
│   Left:  29, 67, 113, 179 ms                            │
│   Right: 37, 79, 127, 191 ms                            │
│ Each tap → lores~ for damping → sum → feedback loop     │
│ Cross-channel feedback for stereo width                 │
│ Wet/dry crossfade: wet*param + dry*(1-param)            │
│ scale~ 0. 1. 0.1 0.7 → feedback amount                  │
│ scale~ 0. 1. 5000. 1000. → damping filter cutoff        │
│ [Param] Smear (0-1) controls wet/dry + feedback + damp  │
│ NOTE: Using tapin~/tapout~ FDN since gigaverb~ unavail  │
└─────────────────────────────────────────────────────────┘
    ↓
Outlet L/R → Main Output
```

### Parameter Receives

  * `r ---tv_audio_mosaic` → sample rate ratio (1.0 → 0.05)
  * `r ---tv_audio_aberration` → delay spread (0 → 40ms)
  * `r ---tv_audio_bloom` → drive amount (1.0 → 8.0)
  * `r ---tv_audio_solarize` → ring mod wet/dry (0 → 1)
  * `r ---tv_audio_crush` → bit depth (24 → 4 bits)
  * `r ---tv_audio_shutter` → tremolo rate (0 → 20Hz)
  * `r ---tv_audio_ghosting` → slapback mix (0 → 1)
  * `r ---tv_audio_smear` → reverb wet/dry + feedback (0 → 1)

### Notes on M4L Compatibility

  * **Solarize**: Uses `gen~ sin(in1)` for true wavefolding (drives signal through sine function)
  * **Smear**: 4-tap FDN reverb using tapin~/tapout~ with prime delays and lores~ damping
  * **Aberration**: 3-band crossover (low/mid/high) with delayed mid and high bands

-----

## Appendix IV. tv.viz.maxpat Architecture (Visual Engine)

To handle the complexity of the new effects, distinct stages (like `jit.rota`) have been consolidated into a single Gen shader (`tv.core.genjit`).

```text
Bang (Frame Trigger)
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 1: INGEST                                         │
│ jit.matrix ---tv_viz_ram (Reads audio features)         │
│ jit.matrix 256 256 (Reshapes to 2D texture)             │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 2: PARAMETER COLLECTION                           │
│ r ---tv_param_* objects collect all 10 FX values        │
│ prepended as "param name value" messages                │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 3: THE SHADER (tv.core.genjit)                    │
│ This single object processes the entire chain in GPU:   │
│                                                         │
│ 1. Geometry: Offset(Scroll) -> Scale(Zoom) -> Rot(Rot)  │
│ 2. Mosaic: Quantize UV coords                           │
│ 3. Aberration: Multi-tap sample RGB                     │
│ 4. Bloom: Blur + Threshold + Add                        │
│ 5. Solarize: Luma Inversion                             │
│ 6. Crush: Quantize Color Steps                          │
│ 7. Shutter: Multiply by Black (Time LFO)                │
│ 8. Ghosting/Smear: Mix with feedback texture            │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 4: FEEDBACK LOOP                                  │
│ Output of Gen → jit.matrix ---tv_feedback               │
│ (This texture is fed back into Stage 3 input 2)         │
└─────────────────────────────────────────────────────────┘
    ↓
Outlet → Display
```

### Shader Parameter Logic (Inside tv.core.genjit)

  * **Scroll:** `offset_y`
  * **Zoom:** `scale`
  * **Rotate:** `theta`
  * **Mosaic:** `cells` (mapped 2048.0 to 10.0)
  * **Aberration:** `shift` (mapped 0.0 to 0.05)
  * **Bloom:** `intensity` (0.0 to 1.0)
  * **Solarize:** `threshold` (0.0 to 1.0)
  * **Crush:** `steps` (mapped 255.0 to 2.0)
  * **Shutter:** `freq` (0.0 to 20.0)
  * **Ghosting/Smear:** `feedback_amt` (0.0 to 0.99)
