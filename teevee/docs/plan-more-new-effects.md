# Expansion Spec: The Signal Artifacts

## I. The Updated Synesthetic Map

| Parameter | Visual Metaphor (GPU) | Audio Mechanism (MSP) | The Shared Experience |
| :--- | :--- | :--- | :--- |
| **CRUSH** | **Posterization** (Color Banding) | **Bit Reduction** (Quantization) | "Low-Fi." The gradient steps become visible. The medium loses resolution. |
| **BLOOM** | **Glow/Bleed** (Light Saturation) | **Overdrive** (Harmonic Distortion) | "Hot." The signal energy overflows its container. Edges blur into warmth. |
| **SHUTTER** | **Strobe** (Frame Gating) | **Tremolo** (Amplitude Gating) | "Interruption." A rhythmic mechanical chopping of the sensory stream. |

-----

## II. Module 1: CRUSH (The Digital Grater)

**Concept:** Reducing the fidelity of the data representation (Y-Axis/Amplitude).

### Path A: Audio (MSP)

  * **Object:** `degrade~` (Standard Max Object).
  * **Logic:**
      * **Param:** `crush_amt` (0.0 to 1.0).
      * **Mapping:**
          * `scale 0. 1. 24 4` $\to$ **Bit Depth**. (24-bit clean $\to$ 4-bit destroyed).
          * *Optional:* `scale 0. 1. 1. 0.2` $\to$ **Sample Rate Ratio** (Downsampling).
  * **Signal Flow:** `Input` $\to$ `degrade~` $\to$ `Output`.

### Path B: Video (GenJit)

  * **Metaphor:** **Posterization**. Limiting the number of colors available to draw the image.
  * **Shader Code:**
    ```glsl
    Param crush(0); // 0.0 (Clean) to 1.0 (Destroyed)

    // Map 0-1 to a "Step" count (255.0 down to 2.0)
    // We use a power curve so the effect is subtle at first, then drastic.
    float steps = mix(255.0, 2.0, pow(crush, 0.5));

    vec4 col = sample(tex_input, uv);

    // Quantize RGB values
    col.rgb = floor(col.rgb * steps) / steps;

    out = col;
    ```

-----

## III. Module 2: BLOOM (The Analog Heat)

**Concept:** Pushing the signal amplitude until it distorts and bleeds.

### Path A: Audio (MSP)

  * **Object:** `overdrive~` or `tanh~` (Hyperbolic Tangent).
  * **Logic:**
      * **Param:** `bloom_amt` (0.0 to 1.0).
      * **Mapping:** `scale 0. 1. 1. 8.` $\to$ Drive factor.
  * **Signal Flow:**
    1.  `Input` \* `Drive`
    2.  `tanh~` (Soft clipping)
    3.  `Output` \* `Compensation` (Lower volume as drive increases to maintain unity gain).

### Path B: Video (GenJit)

  * **Metaphor:** **Light Bleed**. Bright pixels should spill over into dark neighbors.
  * **Technique:** A "Cheap 5-Tap Blur" combined with an Additive Blend.
  * **Shader Code:**
    ```glsl
    Param bloom(0); // 0.0 to 1.0 intensity

    vec4 src = sample(tex_input, uv);

    // Sample 4 diagonals at a slight offset
    float spread = 0.015; // Width of the glow
    vec4 b1 = sample(tex_input, uv + vec2(spread, spread));
    vec4 b2 = sample(tex_input, uv + vec2(-spread, spread));
    vec4 b3 = sample(tex_input, uv + vec2(spread, -spread));
    vec4 b4 = sample(tex_input, uv + vec2(-spread, -spread));

    // Average the neighbors
    vec4 blur = (b1 + b2 + b3 + b4) * 0.25;

    // Threshold: Only let bright parts bloom
    // Simple Luma check: dot product with standard luma weights
    float luma = dot(blur.rgb, vec3(0.299, 0.587, 0.114));
    vec4 glow = blur * smoothstep(0.4, 1.0, luma);

    // Additive Blend (Source + Glow)
    out = src + (glow * bloom * 2.0);
    ```

-----

## IV. Module 3: SHUTTER (The Interrupter)

**Concept:** A master LFO chopping the output.

### Path A: Audio (MSP)

  * **Object:** `phasor~` driving a `rect~` or hard math.
  * **Logic:**
      * **Param:** `shutter_speed` (0.0 to 1.0).
      * **Mapping:** `scale 0. 1. 0. 20.` $\to$ Hz (Frequency).
  * **Signal Flow:**
      * `phasor~ (Freq)` $\to$ `>~ 0.5` $\to$ Creates 0/1 Square Wave.
      * `Input` \* `Square Wave` $\to$ `Output`.
      * *Note:* If `shutter_speed` is 0, add logic to force the gate to 1 (Always Open) so audio passes.

### Path B: Video (GenJit)

  * **Metaphor:** **Strobe**. Black frames injected rhythmically.
  * **Shader Code:**
    ```glsl
    Param shutter(0); // 0.0 to 20.0 (Hz)
    Param time(0);    // System time

    vec4 col = sample(tex_input, uv);

    // Generate Square Wave based on Time
    // sign(sin(...)) gives -1 or 1. Map to 0 or 1.
    float gate = step(0.0, sin(time * shutter * 6.283));

    // If shutter is 0, gate should be 1 (always on)
    float active = step(0.001, shutter); // 0 if shutter is off, 1 if on
    float mask = mix(1.0, gate, active);

    out = col * mask;
    ```

-----

## V. Integration Strategy

### Recommended Signal Chain Order

Audio and Video should follow the same logical order to maintain the metaphor.

1.  **Input**
2.  **Core (Scroll / Zoom / Rotate)** $\leftarrow$ *Already implemented*
3.  **Bloom** (Saturate the signal while it's dry)
4.  **Crush** (Degrade the saturated signal)
5.  **Shutter** (Chop the degraded signal)
6.  **Smear** (Reverb/Trails) $\leftarrow$ *Already implemented*
      * *Why last?* If you Shutter *after* the Reverb, you kill the tails unnaturally. If you Shutter *before* the Reverb, the chop sounds rhythmic, but the reverb fills the gaps smoothly (Dub Techno style).

### Max Patch Structure (`tv.fx.maxpat`)

Create a new sub-patch `tv.fx.maxpat` that houses these three effects to keep `tv.main` clean.

**Inlets:**

1.  Audio L
2.  Audio R
3.  Video Texture
4.  Param: Crush (0-1)
5.  Param: Bloom (0-1)
6.  Param: Shutter (0-1)

**Outlets:**

1.  Audio L
2.  Audio R
3.  Video Texture
