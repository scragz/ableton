## **Teevee (Live 12 Edition)**

### **The Signal Flow Blueprint**

1.  **Module A (Pre-Loop):** `Grain Delay` (Zoom) $\to$ `Shifter` (Rotate).
2.  **Module B (Feedback Loop):** `Delay` (Scroll/Buffer) $\to$ `Aberration Rack` $\to$ `Redux` (Mosaic/Crush) $\to$ `Roar` (Bloom/Solarize) $\to$ `Hybrid Reverb` (Smear) $\to$ `Utility` (Feedback Level).
3.  **Module C (Post-Loop):** `Auto Pan` (Shutter) $\to$ `Spectral Time` (Ghosting).

---

### **Module 1: PRE-LOOP GEOMETRY**
*Processing the dry signal before it enters the feedback loop.*

| Device | Parameter | Initial Setting | Macro Mapping | Range / Curve | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Grain Delay** | **Pitch** | 0.00 st | **PERSPECTIVE** | -12st $\to$ +12st | **ZOOM.** Warps the size/pitch of the input. |
| | Frequency | 5.0 Hz | **PERSPECTIVE** | 0.1Hz $\to$ 20Hz | Adds granular jitter as you zoom. |
| | Spray | 0.0 ms | -- | -- | |
| | Feedback | 0% | -- | -- | **Must be 0%**. |
| | Dry/Wet | 100% | -- | -- | |
| **2. Shifter** | Mode | Freq Shift | -- | -- | |
| | **Coarse** | 0.00 Hz | **SPIN** | -500Hz $\to$ +500Hz | **ROTATE.** Shifts the spectrum. |
| | **Wide** | 0.00% | **SPIN** | 0% $\to$ 100% | **Stereo Twist.** |
| | Dry/Wet | 100% | -- | -- | |

---

### **Module 2: THE FEEDBACK LOOP**
*These devices sit INSIDE your feedback chain/return track.*

| Device | Parameter | Initial Setting | Macro Mapping | Range / Curve | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Delay** | **Time** | 250 ms | **PERSPECTIVE** | 50ms $\to$ 2000ms | **SCROLL.** This is the Loop Buffer length. |
| | Feedback | 0% | -- | -- | **Must be 0%**. |
| | Dry/Wet | 100% | -- | -- | **Must be 100%**. |
| **2. Rack: Aberration**| *Chain 1: Low* | EQ Lo Pass | -- | -- | Clean Bass. |
| | *Chain 2: Mid* | EQ Mid Pass | -- | -- | |
| | **Delay (Mid)** | 1.00 ms | **BREAK** | 1ms $\to$ 30ms | **ABERRATION.** |
| | *Chain 3: High*| EQ Hi Pass | -- | -- | |
| | **Delay (High)**| 1.00 ms | **BREAK** | 1ms $\to$ 60ms | **ABERRATION.** |
| **3. Redux** | **Rate** | 20.0 kHz | **GRAIN** | 20kHz $\to$ 1kHz | **MOSAIC.** Inverted Range. |
| | **Bits** | 24 | **GRAIN** | 24 $\to$ 4 | **CRUSH.** Inverted Range. |
| **4. Roar** | **Drive (Stg 1)**| 0.0 dB | **GLOW** | 0dB $\to$ 18dB | **BLOOM.** |
| | **Amount (Stg 2)**| 0% | **GLOW** | 0% $\to$ 100% | **SOLARIZE.** (Fold Mode). |
| **5. Hybrid Reverb** | Algo | Dark Hall | -- | -- | **SMEAR.** |
| | **Decay** | 200 ms | **FRAME** | 200ms $\to$ 5000ms | Trails get longer with Frame knob. |
| | **Dry/Wet** | 0% | **FRAME** | 0% $\to$ 100% | Trails get louder with Frame knob. |
| **6. Utility** | **Gain** | -inf dB | **FRAME** | -35dB $\to$ -1dB | **FEEDBACK LEVEL.** Controls loop life. |

---

### **Module 3: POST-LOOP FX**
*Processing the final output (Dry + Feedback).*

| Device | Parameter | Initial Setting | Macro Mapping | Range / Curve | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Auto Pan** | Mode | Tremolo | -- | -- | |
| | Shape | Square | -- | -- | Hard gating. |
| | **Rate** | 0.10 Hz | **BREAK** | 0.1Hz $\to$ 15Hz | **SHUTTER** Speed. |
| | **Amount** | 0.0 % | **BREAK** | 0% $\to$ 75% | **SHUTTER** Depth. |
| **2. Spectral Time** | Mode | Re-Trigger | -- | -- | |
| | **Freeze** | Off | **BREAK** | Off $\to$ On | **DATAMOSH.** Map to activate at 95% range. |
| | **Dry/Wet** | 0.0 % | **FRAME** | 0% $\to$ 50% | **GHOSTING.** Visual Trails. |
| | Delay Time | 30ms | -- | -- | Fixed short slapback. |

---

### **Macro Summary (The Triptych Control Surface)**

* **PERSPECTIVE:** Zooms the image (Pitch) + Pushes it back in time (Scroll).
* **SPIN:** Rotates the colors (Freq Shift) + Stereo width.
* **GRAIN:** Pixelates (Mosaic) + Posterizes (Crush) the Loop.
* **GLOW:** Adds Bloom (Saturation) $\to$ Solarize (Wavefolding) to the Loop.
* **FRAME:** Increases Feedback Length (Utility) + Smears the Loop (Reverb) + Adds Trails (Ghosting).
* **BREAK:** Splits colors (Aberration) + Chops the screen (Shutter) + Freezes the buffer (Datamosh).
