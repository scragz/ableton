Here are four additional isomorphic manipulations that fit the **Teevee** system architecture, expanding the "Synesthetic Map" with video-centric artifacts translated into audio physics.

These focus on **resolution**, **color space**, and **signal integrity**.

### The Expanded Synesthetic Map

| Parameter | Visual Metaphor (GPU) | Audio Mechanism (MSP) | The Shared Experience |
| :--- | :--- | :--- | :--- |
| **MOSAIC** | **Pixelation** (Downsampling) | **Bitcrush / Decimate** (Aliasing) | Loss of definition. The grid becomes visible; the curve becomes steps. |
| **SOLARIZE** | **Luma Inversion / Threshold** | **Foldover Distortion** (Wavefolding) | The peaks are too bright/loud, so they invert. Signal wraps around itself. |
| **ABERRATION**| **RGB Shift** (Channel Offset) | **Multiband Delay** (Spectral Split) | The constituent parts (colors/frequencies) separate spatially. |
| **GHOSTING** | **Previous Frame Blend** (Interlacing) | **Convolution / Impulse** (Spectral Smear) | The "ghost" of the previous signal overlays the current one. |

-----

### Implementation Details

#### 1. MOSAIC (Pixelation - Aliasing)

*Concept:* Reducing the resolution of the medium. In video, this makes blocks. In audio, this makes "robotic" ringing and noise.

**Path A: Audio (MSP)**

  * **Object:** `degrade~` (Standard Max object, works in M4L).
  * **Logic:**
      * Link Visual "Block Size" to Audio "Sampling Rate" and "Bit Depth".
      * **Mapping:** 0-1 Parameter $\to$ `scale~ 1. 0. 44100 200` (Sample Rate) and `scale~ 1. 0. 24 4` (Bit Depth).
  * **Sonic Result:** Digital grit, loss of high-end, aliasing artifacts.

**Path B: Video (Jitter/Gen)**

  * **Shader Logic:** Quantize the UV coordinates.
    ```glsl
    // GenExpr
    Param mosaic_amount(0); // 0 to 1
    float cells = mix(512.0, 10.0, mosaic_amount);
    vec2 st = floor(uv * cells) / cells;
    out = sample(tex_input, st);
    ```

#### 2. SOLARIZE (Inversion - Foldover)

*Concept:* When a signal exceeds the maximum brightness/loudness, instead of clipping flat, it wraps back around to zero (or inverts).

**Path A: Audio (MSP)**

  * **Object:** Custom math or `pong~` (if available), or `lookup~` with a sine transfer function.
  * **Logic:** Simple foldover distortion.
      * Multiply input gain $\to$ Wrap output between -1.0 and 1.0.
      * `buffer~` with a transfer function that resembles a triangle wave or sine wave creates this "folding" sound.
  * **Sonic Result:** Aggressive, metallic distortion that changes timbre dynamically with volume.

**Path B: Video (Jitter/Gen)**

  * **Shader Logic:** Standard solarization algorithm.
    ```glsl
    // GenExpr
    Param solarize(0); // 0 to 1
    vec4 col = sample(tex_input, uv);
    // If luminance > threshold, invert
    if (solarize > 0) {
        col.rgb = abs(col.rgb - solarize);
    }
    out = col;
    ```

#### 3. ABERRATION (RGB Shift - Multiband/Haas)

*Concept:* The lens is broken. Red, Green, and Blue light travel at different speeds/angles. In audio, Low, Mid, and High frequencies arrive at different times.

**Path A: Audio (MSP)**

  * **Object:** `cross~` (crossover) into 3x `tapin~`/`tapout~` or simple `delay~`.
  * **Logic:**
      * Split Audio into Low (\<200Hz), Mid (200-2k), High (\>2k).
      * **Low:** 0ms delay.
      * **Mid:** Delay = Parameter * 20ms.
      * **High:** Delay = Parameter * 40ms.
  * **Sonic Result:** Phase cancellation, "swooshing" comb filtering, and spatial widening.

**Path B: Video (Jitter/Gen)**

  * **Shader Logic:** Sample the texture 3 times with different offsets.
    ```glsl
    // GenExpr
    Param aberration(0);
    float shift = aberration * 0.05;
    float r = sample(tex_input, uv + vec2(shift, 0)).r;
    float g = sample(tex_input, uv).g;
    float b = sample(tex_input, uv - vec2(shift, 0)).b;
    out = vec4(r, g, b, 1.0);
    ```

#### 4. GHOSTING (Interlace/Trailing - Spectral Convolution)

*Concept:* The "phosphors" on the screen take too long to dim. The previous image stays on screen. In audio, this is spectral freezing or heavy convolution.

**Path A: Audio (MSP)**

  * **Object:** `pfft~` (Spectral processing) - *Note: High CPU complexity.*
      * *Alternative (Low CPU):* A very short, high-feedback delay (slapback) tuned to "metallic" territory.
      * **Implementation:** `tapin~` $\to$ `tapout~ 15` (15ms) $\to$ `*~ 0.8` (Feedback).
  * **Sonic Result:** A metallic, resonant "pipe" sound that overlays the dry signal.

**Path B: Video (Jitter/Gen)**

  * **Shader Logic:** Simple weighted average with previous frame (already partially implemented in your "Smear", but this focuses on distinct "double vision" rather than blur).
      * Mix current frame with a frame buffered 2-3 frames ago (requires a larger `jit.matrix` ring buffer for video).

-----
