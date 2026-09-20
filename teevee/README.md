# Teevee

Teevee is an audio effect for Max for Live inspired by video processing techniques. It transforms sound using time and spectral manipulations analogous to video effects, producing rich, evolving textures.

## The Effect

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
| **SMEAR** | **Frame Feedback** (Blur) | **Lowpass Filter** (High-Freq Decay) | The refusal of the signal to die. Muffled tails. |

### D. Meta-States

*Affecting the overall state of the system.*

| Parameter | Visual Metaphor (GPU) | Audio Mechanism (MSP) | The Shared Experience |
| :--- | :--- | :--- | :--- |
| **FREEZE** | **Frame Hold** (Datamosh) | **Buffer Gate** (Stutter/Hold) | Time itself stops. The moment is trapped. |

**FREEZE** is a continuous control (0-1): at 0 audio passes through normally; between 0-1 it creates rhythmic stutter effects; at 1 the buffer is completely frozen, looping the captured moment indefinitely while other effects (Zoom, Rotate) continue to manipulate it.

## Architecture

See [docs/architecture.md](docs/architecture.md) for full technical details.
