If we turn **Freeze** from a switch into a knob, we move from **State** (On/Off) to **Rate** (Time).

We are essentially building a **Variable Refresh Rate** system.

In the physical world, this is like a strobe light where the dark periods are "frozen" moments rather than blackness. In the digital world, this simulates a lagging network connection or a "Sample & Hold" circuit.

Here is the specification for the **Freeze Knob (0.0 - 1.0)**.

---

### The New Synesthetic Map

| Parameter | Visual Metaphor (GPU) | Audio Mechanism (MSP) | The Shared Experience |
| :--- | :--- | :--- | :--- |
| **FREEZE (Knob)** | **Posterize Time** (Stop-Motion) | **Buffer Stutter** (Granular Hold) | The flow of time is quantized. The stream updates, then hangs, then updates. |

---

### Logic: The "Duty Cycle"

The knob controls the **Probability of Update** or the **Hold Duration**.

* **0.0 (Live):** The buffer updates continuously. (Standard behavior).
* **0.1 - 0.9 (Stutter):** The system captures a moment, holds it, loops it, then captures a new moment. The knob controls the length of the "Hold."
    * *Low:* Rapid-fire stutter (Machine gun effect).
    * *High:* Long pauses (Slide show effect).
* **1.0 (Frozen):** The buffer never updates. Infinite loop of the last captured moment.

---

### Path A: Audio (MSP) Implementation

Instead of a simple on/off gate, we need a **Pulse Generator** that toggles the recording permission.

**The Patch:**
We are manipulating the `poke~` (Write Head) inside `tv.audio`.

1.  **The Clock:**
    * `phasor~` driven by a frequency derived from the Freeze Knob.
    * *Mapping:* Freeze 0.0 = 0Hz (Logic bypass), Freeze 0.5 = 10Hz, Freeze 0.99 = 0.5Hz.
2.  **The Window (Duty Cycle):**
    * We only want to record for a brief moment (e.g., 50ms) and then hold for the rest of the cycle.
    * `deltaclip~` or `>~` on the phasor can create a trigger pulse.
3.  **The Gate:**
    * The trigger pulse controls a `*~` or `gate~` before the `poke~` object.
    * *Result:* The audio buffer contains "old" audio that repeats until the next pulse allows "new" audio to overwrite it.

**Refined Logic for Smoothness:**
Ideally, you use two buffers (A/B) and crossfade to avoid clicks, but for a "Glitch" aesthetic, a raw overwrite is acceptable.

* **Knob 0:** `gate~ 1` (Always writing).
* **Knob 0.5:** Write for 50ms, Hold for 200ms.
* **Knob 1.0:** `gate~ 0` (Never writing).

### Path B: Video (Jitter) Implementation

We need to stop the `jit.matrix` from accepting new frames based on the same logic.

**The Patch:**
Inside `tv.ingest`, we control the `qmetro` or the `jit.poke~` enable state.

1.  **The Trigger:**
    * Use the same `phasor~` logic from the Audio side (sent via `send~` / `snapshot~` or a synchronized `metro`).
2.  **The Sample & Hold:**
    * Use `jit.matrix @adapt 0`.
    * Only send a `bang` to the `jit.matrix` (to ingest new texture data) when the pulse fires.
    * Between pulses, do not bang the ingest matrix. The `tv.viz` module will simply re-render the existing (stale) matrix data.

**Visual Result:**
* **Knob 0:** Smooth 60fps video.
* **Knob 0.5:** Video looks like it drops to 12fps or 5fps.
* **Knob 1.0:** A still photograph.

---

### Why this is better than a button

1.  **Rhythmic Capability:** By placing the Freeze knob at ~20-40%, you get a rhythmic "chugging" texture that syncs audio repetition with visual frame-dropping. It feels like a broken robot.
2.  **Performance Gesture:** You can "ramp" the freeze. Slowly turning the knob up creates the sensation of the system running out of battery or grinding to a halt, ending in a total freeze.
3.  **Isomorphism:** It unifies the concept of "Frame Rate" (Video) and "Buffer Size/Grain" (Audio).

### Summary Spec for `tv.param` Update

* **Input:** 0-1 Float.
* **Logic:**
    * If `Input == 0`: Send `1` to Gates (Live).
    * If `Input == 1`: Send `0` to Gates (Frozen).
    * If `Input > 0 && < 1`:
        * Scale Input to Frequency `f` (e.g., 20Hz down to 0.5Hz).
        * Run `phasor~ f`.
        * Output `1` only when phasor phase < 0.1 (short write window).
        * Output `0` for the rest.
