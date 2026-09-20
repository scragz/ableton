# Materia

**A monolithic Leibniz-style binary subsystem for Max for Live · Spec v0.2**

A single M4L device that runs a pool of 8-bit bus modules inspired by the Xaoc Leibniz Subsystem, with free routing, feedback, extended operations, and complete state saved with the Live set.

**Design stance:** inspired by, not faithful to, the hardware. Every useful extension is on by default. There is no "hardware-accurate" mode.

---

## Changelog

**v0.2**
- Named **Materia**.
- Full registered state (pipelines, counters, holds, oscillator phase, RNG) saved with the set, presets, and device duplicates.
- All extensions enabled; hardware-faithful toggle removed.
- Added second Erfurt (ERF2) and second Rostock (ROS2).
- Global clocks (TCLK, ICLK) and Erfurt overflow clocks added to the bus list.
- All open decisions resolved with defaults (§13).
- Race default is DELAY, backed by graph analysis on routing change (§6.3).
- State memory slots + recall-on-play for deterministic playback and export (§9.4).

---

## 1. Scope

| Module | In Materia | Origin |
|---|---|---|
| Drezno / Drezno II | ADC ×2, DAC ×2 | Leibniz |
| Berlin | ×1 | Leibniz |
| Erfurt | ×2 | Leibniz |
| Lipsk | ×2 | Leibniz |
| Gera | ×1, four logic modes | Leibniz + extension |
| Jena | ×1, generated tables | Leibniz-inspired |
| Rostock | ×2 | Leibniz + extension |
| Poczdam | ×1 | Leibniz + extension |
| Bytom | Absorbed into modulation taps (§8.3) | Leibniz-inspired |
| Ostankino II | Replaced by NOTE/VEL buses (instrument, §2.2) | — |
| Odessa / Hel | Out | — |
| Bit Matrix | ×1 | Materia original |

---

## 2. Device wrappers

One gen~ core, two Live device shells.

### 2.1 `Materia` — Audio Effect (v1)

- Input: track audio L/R.
- Sidechain: use if the target Live version exposes sidechain to Max audio effects; otherwise omitted in v1. *Verify during build.*
- Output: stereo from DAC A / DAC B.
- No MIDI in (Live audio effects can't receive notes).

### 2.2 `Materia Instrument` (v2)

- MIDI note → Berlin frequency.
- Note gate → selectable: Erfurt reset, Rostock clock, Lipsk gate source.
- NOTE bus (note number) and VEL bus (velocity × 2) as bus sources. Live clips become byte sequencers.
- Monophonic. Polyphony = one core per `poly~` voice; deferred until CPU is measured.

---

## 3. Data model

### 3.1 Bus

```
bus = { d: uint8 [0..255], c: bool }
```

- `d` — 8 parallel data bits, D0 = LSB, D7 = MSB.
- `c` — clock line, carried as a **level**, not a pulse.
- Every consumer does its own rising-edge detection with its own `prev_c`.

### 3.2 Representation in gen~

- Bus data held as floats with integer values 0–255. Never normalized internally.
- After every arithmetic op: `& 255`, or `% 256` for subtraction paths.
- No smoothing, interpolation, or slew on anything bus-side. Filtering exists only after the DACs.

### 3.3 Bit-accuracy rules

1. Integer ops only between ADC and DAC.
2. `floor()` any param value before it enters a bitwise op.
3. Subtraction wraps: `(a - b + 256) % 256`.
4. Rounding laws defined once (§5.1) and reused.

---

## 4. Module pool and bus list

### 4.1 Instances

| ID | Module | Type |
|---|---|---|
| ADC1, ADC2 | Drezno ADC | Registered |
| DAC_A, DAC_B | Drezno DAC | Sink |
| BER | Berlin | Source |
| ERF1, ERF2 | Erfurt | Registered |
| LP1, LP2 | Lipsk | Combinational |
| GER | Gera | Combinational |
| JEN | Jena | Combinational (ASYNC) or Registered (SYNC) |
| ROS1, ROS2 | Rostock | Registered |
| PZ | Poczdam | Combinational (MANUAL/BIT) or Registered (CLOCKED) |
| MTX | Bit Matrix | Combinational |

### 4.2 Bus list

Every module input, gate source, clock source, and DAC source picks from this list via `live.menu`.

| # | Bus | `d` | `c` |
|---|---|---|---|
| 0 | ZERO | 0 | 0 |
| 1 | CONST | param 0–255 | 0 |
| 2 | ADC1 | hold | ADC1 clock |
| 3 | ADC2 | hold | ADC2 clock |
| 4 | BER | phase byte | Berlin clock |
| 5 | ERF1 | A | clock in |
| 6 | ERF2 | A | clock in |
| 7 | LP1 | out | pass-through |
| 8 | LP2 | out | pass-through |
| 9 | GER | out | pass-through |
| 10 | JEN | out | pass-through |
| 11 | ROS1 | out | clock in |
| 12 | ROS2 | out | clock in |
| 13 | PZ.1 | selected | selected |
| 14 | PZ.2 | other | other |
| 15 | MTX | out | pass-through |
| 16 | TCLK | 0 | transport-synced square |
| 17 | ICLK | 0 | free-running square |
| 18 | ERF1.OVF | 0 | overflow |
| 19 | ERF2.OVF | 0 | overflow |
| 20 | NOTE | note number | note gate |
| 21 | VEL | velocity × 2 | note gate |

- NOTE/VEL read as ZERO in the audio effect.
- Routing params are automatable. Mid-note switches are hard digital cuts.

### 4.3 Global clocks

| Param | Range | Default |
|---|---|---|
| `tclk_div` | 1/64 … 8 bars | 1/16 |
| `iclk_rate` | 0.01 Hz … fs/2 | 8 Hz |

---

## 5. Module specifications

### 5.1 Drezno ADC (×2)

| Param | Range | Default |
|---|---|---|
| `in` | L / R / Mid / Side | L (ADC1), R (ADC2) |
| `gain` | −24…+24 dB | 0 dB |
| `offset` | −1…+1 | 0 |
| `range` | Bipolar / Unipolar | Bipolar |
| `clk_mode` | CONT / RATE / BUS / ZERO-X | CONT |
| `rate` | 1 Hz…fs/2 | 8000 Hz |
| `clk_src` | Bus list | TCLK |

**Quantization**

```
x = (in_sample + offset) * gain_lin
u = range == BIPOLAR ? (x + 1) / 2 : x
u = clamp(u, 0, 1)
d = floor(u * 255 + 0.5)
```

**Clocking**

- Sample-and-hold: `d` latches on rising edge of the active clock.
- **CONT:** latches every sample; emits `c` toggling every sample so downstream registered modules still tick.
- **RATE:** internal phasor at `rate`; `c = phase < 0.5`.
- **BUS:** `c` of `clk_src`.
- **ZERO-X:** edge on positive-going zero crossings of the pre-quantized input. Pitch-tracked sample rate.

**Edge case:** silence → `d = 128` → DAC outputs `+1/255` DC. DC block defaults on.

### 5.2 Drezno DAC (×2)

| Param | Range | Default |
|---|---|---|
| `src` | Bus list | GER (A), LP2 (B) |
| `range` | Bipolar / Unipolar | Bipolar |
| `wmode` | IDEAL / LADDER / CUSTOM | IDEAL |
| `tol` | 0–25% | 5% |
| `seed` | int | 1 |
| `w0…w7` | −2…+2 | 1 |
| `gain` | −inf…+12 dB | 0 dB |
| `filt` | NONE / 1-pole LP / 4-pole LP | NONE |
| `cutoff` | 20 Hz–20 kHz | 16 kHz |
| `dcblock` | on/off | on |
| `dest` | L / R / Both | L (A), R (B) |

`tol` only affects LADDER, so its 5% default is dormant until LADDER is selected.

**Reconstruction**

```
IDEAL:   y = d / 255
LADDER:  wt_i = 2^i * (1 + tol * r_i)     // r_i ∈ [-1,1], seeded LCG, regenerated from seed
CUSTOM:  wt_i = 2^i * w_i
         y = Σ(bit_i * wt_i) / Σ|wt_i|
out = range == BIPOLAR ? y * 2 - 1 : y
```

### 5.3 Berlin

| Param | Range | Default |
|---|---|---|
| `freq` | 0.01 Hz–fs/2 | 110 Hz |
| `fine` | ±100 ct | 0 |
| `fm_src` | none / DAC A / DAC B / track in | none |
| `fm_amt` | 0–1 | 0 |
| `clk_mode` | STEP / CYCLE | STEP |
| `sync_src` | Bus list | ZERO |

```
phase = wrap(phase + (f0 * fm_mult) / fs, 0, 1)    // double precision
d     = floor(phase * 256)
STEP:  c = floor(phase * 512) & 1   // rising edge once per byte step
CYCLE: c = phase < 0.5              // one edge per waveform cycle
sync:  rising edge on sync_src.c → phase = 0
```

STEP saturates when `256·f0 > fs/2`: edges max out every 2 samples and codes skip. Saturation LED on the tab.

### 5.4 Erfurt (×2)

**Registered.** State `A ∈ [0,255]`.

| Param | Range | Default |
|---|---|---|
| `step_src` | CONST / bus list | CONST |
| `step` | 1–255 | 1 |
| `dir` | UP / DOWN | UP |
| `dir_gate_src`, `dir_gate_bit` | Bus + bit 0–7 | ZERO, 0 |
| `reset_src`, `reset_bit` | Bus + bit 0–7 | ZERO, 0 |
| `clk_src` | Bus list | BER (ERF1), TCLK (ERF2) |

Default intent: ERF1 is an audio-rate divider off Berlin; ERF2 is a transport-synced binary rhythm counter.

**On rising clock edge**

```
if reset edge: A = 0
s = step_src == CONST ? step : in.d
up = dir == UP XOR dir_gate_bit
A = up ? (A + s) % 256 : (A - s + 256) % 256
ovf = wrapped this edge
```

**Outputs**

- Main bus: `d = A`, `c = clk_src.c`.
- Bit k with `s = 1` divides the clock by `2^(k+1)`.
- `ERFn.OVF`: `c` goes high on a wrapping edge and stays high until the next clock edge.

**Signature patches**
- `ERF1.step_src = LP1`, `LP1.src = ERF1` → pseudo-chaotic accumulator.
- `ERF2.step_src = ERF1` → cascaded accumulators; ERF2 integrates ERF1's ramp.

### 5.5 Lipsk (×2)

**Combinational.**

| Param | Range | Default |
|---|---|---|
| `src` | Bus list | ADC1 (LP1), ADC2 (LP2) |
| `b0…b7` | toggles | all off |
| `gate_src` | Bus list | ZERO |
| `gate_rot` | 0–7 | 0 |
| `gate_inv` | on/off | off |
| `gate_law` | OR / XOR | OR |

```
G = rotl8(gate_bus.d, gate_rot) ^ (gate_inv ? 255 : 0)
M = gate_law == OR ? (S | G) : (S ^ G)
out.d = in.d ^ M
out.c = in.c
```

- OR: a gate bit forces a flip.
- XOR: a gate bit inverts the manual pattern for that bit.

### 5.6 Gera

**Combinational.**

| Param | Range | Default |
|---|---|---|
| `src` | Bus list | LP1 |
| `b0…b7` | toggles | all on |
| `gate_src`, `gate_rot`, `gate_inv` | as Lipsk | ZERO, 0, off |
| `mode` | AND / OR / XOR / NAND | AND |

```
M = S | G
AND:  out.d = in.d & M
OR:   out.d = in.d | M
XOR:  out.d = in.d ^ M
NAND: out.d = (~(in.d & M)) & 255
out.c = in.c
```

**UI polarity:** in AND mode a lit toggle means **pass**; all on = identity. Lipsk's lit toggle means **flip**. Different styling for each.

### 5.7 Jena

Generated tables, not a ROM clone.

| Param | Range | Default |
|---|---|---|
| `src` | Bus list | ZERO |
| `family` | see table | Identity & bit ops |
| `table` | index within family | 0 (identity) |
| `morph` | 0–1 | 0 |
| `sync` | ASYNC / SYNC | ASYNC |
| `clk_src` | Bus list | ZERO |

```
T_A = TABLE[family][table]
T_B = TABLE[family][table + 1]     // clamped to last table in family
v   = floor((1 - α) * T_A[in.d] + α * T_B[in.d] + 0.5)
out.d = clamp(v, 0, 255)
SYNC:  latches on rising edge
ASYNC: updates every sample
out.c = in.c
```

**Table families (generated at load)**

| Family | Tables | Content |
|---|---|---|
| Identity & bit ops | 16 | identity, bit-reverse, Gray, inverse Gray, rotations, parity |
| Folds | 32 | 1–32 triangle folds |
| Walsh (sequency) | 256 | `W_k[n]` ordered by zero crossings, out 0 / 255 |
| Walsh (Hadamard) | 256 | same functions, raw index order |
| Shapes | 32 | sine, tri, saw variants, exp, steps |
| Rhythm | 64 | 256-step gate patterns (Euclidean, seeded random) |
| User | 8 | drawn or imported; saved with set |

**Walsh identity**

```
W_k(n) = (-1)^popcount(k & n)
```

- `k = 2^j` → bit j of n.
- Multi-bit k → XOR of the selected bits.
- Bit Matrix (XOR) + CUSTOM-weighted DAC is a Walsh synthesizer; Jena's Walsh families are the table form.

### 5.8 Rostock (×2)

**Registered.** 64-slot ring buffer each.

| Param | Range | Default |
|---|---|---|
| `src` | Bus list | ADC1 (ROS1), ZERO (ROS2) |
| `length` | 1–64 | 16 (ROS1), 64 (ROS2) |
| `mode` | SHIFT / LOOP / SCRAMBLE / HOLD | SHIFT |
| `clk_src` | Bus list | TCLK |
| `seed` | int | 1 |
| `clear` | button | — |

**On rising clock edge**

```
SHIFT:    out = buf[(w - N) mod 64];  buf[w] = in.d;  w = (w+1) % 64
LOOP:     out = buf[(w - N) mod 64];  buf[w] = out;   w = (w+1) % 64
SCRAMBLE: out = buf[(w - 1 - lcg() % N) mod 64]; buf[w] = in.d; w = (w+1) % 64
HOLD:     no change
```

- `N = 1` → exactly one clock of delay.
- Changing N doesn't clear the buffer; shortening then lengthening resurrects old data.
- **Saved with set.** A LOOP-mode pipeline is a stored pattern (§9).
- **Signature patch:** `ROS2.src = ROS1`, ROS2 in LOOP with a different length → captured phrases recirculating against a live pipeline.

### 5.9 Poczdam

| Param | Range | Default |
|---|---|---|
| `srcA`, `srcB` | Bus list | ADC1, ADC2 |
| `sel_mode` | MANUAL / BIT / CLOCKED | MANUAL |
| `sel` | 0/1 | 0 |
| `sel_bus`, `sel_bit` | Bus + bit | ZERO, 0 |
| `sel_clk` | Bus list | TCLK |

```
S_raw = MANUAL ? sel : bit(sel_bus.d, sel_bit)
CLOCKED: S updates to S_raw only on rising edge of sel_clk
out1 = S ? B : A     // data and clock together
out2 = S ? A : B
```

### 5.10 Bit Matrix

**Combinational.**

| Param | Range | Default |
|---|---|---|
| `src` | Bus list | ZERO |
| `mode` | OR / XOR | XOR |
| `preset` | Identity / Reverse / Gray / Rotate+1 / Random perm / Custom | Identity |
| `seed` | int | 1 |

```
out.bit_i = combine_j (M[i][j] AND in.bit_j)   // combine = OR or XOR
out.c = in.c
```

- Identity is a pass-through in either mode.
- XOR default so any custom matrix produces Walsh combinations immediately.
- Custom 8×8 saved with set (§9).

---

## 6. Execution model

### 6.1 Per-sample sequence

```
1. SOURCES     transport phase, TCLK, ICLK, Berlin phase (+FM), ADC pre-scale
2. EXPOSE      registered modules present current state
3. SETTLE      combinational relaxation (§6.2), delayed edges read z^-1 (§6.3)
4. EDGES       each registered module detects rising edge on its settled clock
5. NEXT-STATE  registered modules compute next state from settled inputs
6. COMMIT      all registered modules update simultaneously; write state buffer
7. SETTLE      second relaxation pass
8. SINKS       DAC A/B, modulation taps, meters; store z^-1 values
```

- Two-phase commit (5–6) makes register chains on a shared clock (ERF1 → ROS1 → ROS2) shift correctly.
- The second settle gets new register values to the DACs in the same sample.

### 6.2 Settling

Combinational set: LP1, LP2, GER, JEN (ASYNC), PZ (MANUAL/BIT), MTX → 6 modules.

```
for pass in 0..6:
    evaluate LP1, LP2, GER, JEN, PZ, MTX, each reading latest bus values
```

- Six passes settle any acyclic combinational chain regardless of order.
- A 7th pass checks for change → `race` LED.

### 6.3 Combinational loops

A loop through only combinational modules has no stable state.

**Default: DELAY.** On every routing change, a `v8` script:

1. Builds the combinational dependency graph from source params.
2. Runs DFS in fixed module order (LP1, LP2, GER, JEN, PZ, MTX) to find back edges.
3. Sends a per-input `delayed` flag to gen~.

Flagged inputs read the previous sample's bus value. The graph becomes acyclic, settles cleanly, and behaves like a one-sample feedback path.

- DFS in fixed order means the same patch always breaks at the same edge.
- **Transient:** routing automation reaches gen~ before `v8` finishes. For a few ms after a routing change, a loop can race. gen~ falls back to LAST behavior during that window.

**`race_mode`**

| Mode | Behavior |
|---|---|
| DELAY (default) | Back edges delayed one sample. Stable, deterministic, audio-rate feedback. |
| LAST | No delays; take final pass. Order-dependent. |
| NOISE | No delays; bits that differ between the last two passes become seeded random bits. |

Loops through any registered module never race and never get delayed.

---

## 7. Clocking

- **Sources:** TCLK, ICLK, ADC clocks, Berlin STEP/CYCLE, ERFn.OVF, any bus `c`.
- **Edge detection:** per consumer, `edge = c && !prev_c`.
- **Max clock rate:** fs/2. Per-module "clock saturated" LED.
- **Transport stop:** TCLK stops; modules clocked by it hold.
- **Oversampling changes the sound:** at 4×, Berlin STEP saturates 4× higher and ADC CONT samples 4× as often. Default 1×.

---

## 8. I/O

### 8.1 Audio in

Track L/R → ADC1/ADC2 via each ADC's `in`.

### 8.2 Audio out

DAC A and DAC B, each with `dest`. Default A→L, B→R.

### 8.3 Modulation taps (×4)

Standard M4L Map pattern (`live.remote~`).

| Param | Range | Default |
|---|---|---|
| `src` | Bus list | ERF2 |
| `kind` | BYTE / BIT / MASK-OR | BIT |
| `bit` | 0–7 | tap 1–4 → bits 0–3 |
| `mask` | 8 toggles | all off |
| `depth`, `min`, `max` | 0–1 | 1, 0, 1 |

```
BYTE:    v = d / 255
BIT:     v = (d >> bit) & 1
MASK-OR: v = (d & mask) != 0
```

With defaults, unmapped taps sit idle. Once mapped, taps 1–4 read ERF2 bits 0–3 counting at TCLK 1/16: square waves with periods of 1/8 note, 1/4 note, 1/2 note, and 1 bar.

Parameter modulation is block-rate at best. Taps are for rhythm and slow control.

### 8.4 Meters

Bus × 8-bit LED strip + clock LED per bus, drawn in `jsui`/`v8ui` at display rate.

---

## 9. State and persistence

**Everything is saved with the Live set:** parameters, tables, matrix, and all registered module state. Reopening a set resumes exactly where it was saved.

### 9.1 Architecture

Persistent state lives in a `buffer~` named `---materia_state`, not in gen~ `History`. gen~ reads and writes it every sample through `Buffer`. Restoring the buffer restores the machine.

Per-instance buffers are required; `---` is replaced with a unique per-device prefix in M4L. *Verify gen~ resolves `---` names; if not, pass the resolved name at load.*

**Layout**

| Offset | Size | Content |
|---|---|---|
| 0 | 64 | ROS1 buffer |
| 64 | 1 | ROS1 write index |
| 65 | 1 | ROS1 out hold |
| 66 | 64 | ROS2 buffer |
| 130 | 1 | ROS2 write index |
| 131 | 1 | ROS2 out hold |
| 132 | 2 | ERF1 A, ERF1 OVF |
| 134 | 2 | ERF2 A, ERF2 OVF |
| 136 | 2 | ADC1 hold, ADC2 hold |
| 138 | 1 | JEN sync hold |
| 139 | 1 | PZ clocked S |
| 140 | 1 | Berlin phase (double) |
| 141 | 4 | LCG states (ROS1, ROS2, NOISE race, spare) |
| 145 | 16 | `prev_c` edge-detector states |
| 161 | 8 | z^-1 delayed bus values |
| 169 | — | reserved |

Separate blobs:

| Blob | Content |
|---|---|
| `materia_matrix` | Bit Matrix custom 8×8 |
| `materia_jena_user` | 8 × 256 user tables |
| `materia_slots` | State memory slots S1, S2 (§9.4) |

LADDER weights are regenerated from `seed`, not stored. TCLK phase is re-derived from transport.

### 9.2 Save

1. Live requests blob values (set save, preset save, device duplicate, copy).
2. `v8` sends a `snap` pulse to gen~.
3. On the next vector, gen~ copies live state into a snapshot region of the buffer in one pass.
4. `v8` reads the snapshot region and returns it as the blob.

The snapshot copy prevents a torn read while the audio thread keeps writing.

### 9.3 Load

`load_mode` param:

| Mode | Behavior |
|---|---|
| RESUME (default) | Restore full state |
| CLEAR PIPES | Restore everything except Rostock buffers |
| CLEAR ALL | Restore params/tables/matrix only; registers start at zero |

If audio is already running when the blob arrives, state jumps to the restored values. No crossfade: it's digital.

### 9.4 State memory and determinism

Chaotic patches (ERF ← LP ← ERF, NOISE race) diverge between live playback and offline export, because export starts from whatever state the device is in.

- **Slots S1, S2:** `store` / `recall` buttons capture and restore the full state buffer. Saved with set.
- **`recall_on_play`:** OFF / S1 / S2. On transport start, recall the chosen slot before the first sample.
- Default OFF.
- For reproducible exports: store S1 at the start of a take, set `recall_on_play = S1`.

### 9.5 Side effects to document

- **Presets (.adv) carry state.** A preset is a patch *and* a pattern. Loading a preset resumes its pipelines.
- **Duplicating a device or track duplicates state.** Two duplicates start identical; with chaotic patches they diverge from the same seed.
- **Undo:** blob changes and `clear`/`recall` don't create undo steps. Put confirmation on `clear`.
- **Freeze/flatten:** renders from current state unless `recall_on_play` is set.

---

## 10. Parameters

### 10.1 Count

| Section | ≈ Params |
|---|---|
| ADC ×2 | 14 |
| DAC ×2 (incl. custom weights) | 36 |
| Berlin | 6 |
| Erfurt ×2 | 18 |
| Lipsk ×2 | 28 |
| Gera | 13 |
| Jena | 6 |
| Rostock ×2 | 10 |
| Poczdam | 7 |
| Bit Matrix | 4 |
| Taps ×4 | 24 |
| Global (race_mode, oversample, CONST, TCLK div, ICLK rate, load_mode, recall_on_play) | 7 |
| **Total** | **~175** |

### 10.2 Naming

Automation lists and screen readers both read these. Long and short names:

- Long: `Lipsk 1 Bit 3`, `Rostock 2 Length`, `DAC A Source`
- Short: `L1 b3`, `R2 len`, `DA src`

---

## 11. Default patch

On insert, Materia is a stereo 8-bit passthrough with everything else idling:

```
Track L → ADC1 (CONT) → LP1 (no flips) → GER (all pass) → DAC A → L
Track R → ADC2 (CONT) → LP2 (no flips) ─────────────────→ DAC B → R

Idle but running:
  BER 110 Hz → ERF1 (divider)
  TCLK 1/16  → ERF2 (counter) → taps (unmapped)
  TCLK 1/16  → ROS1 ← ADC1 (N=16, SHIFT)
```

- First toggle flip on LP1 or GER is immediately audible on the left channel.
- ROS1 is already filling with ADC1's clocked bytes, so routing it to a DAC plays the last 16 steps of input.

---

## 12. UI

Fixed height 169 px; free width.

```
┌────────────┬──────────────────────────────────────────────┬────────────┐
│ BUS METER  │ [ADC][BER][ERF1][ERF2][LP1][LP2][GER][JEN]   │  DAC A     │
│ bus×8 LEDs │ [ROS1][ROS2][PZ][MTX][TAPS][STATE]           │  DAC B     │
│ + clk LEDs │                                              │  race LED  │
│            │   selected tab's params                      │  OS: 1×    │
└────────────┴──────────────────────────────────────────────┴────────────┘
```

- Bus meter doubles as navigation: click a row → jump to that module's tab.
- Every source menu shows the selected bus's live 8-dot strip beside it.
- Gera = "pass" styling, Lipsk = "flip" styling.
- STATE tab: load_mode, S1/S2 store/recall, recall_on_play, clear buttons.

---

### 12.1 Routing patch matrix

The **Patch Matrix** button opens a large routing window. Its 22 rows are source buses and its 34 columns are module inputs, grouped by module. Each column has one connection. Click a cell to connect it; click the selected connection again to select ZERO.

- **All / Data / Clocks** filters the destination columns.
- **Used buses only** hides source rows with no connections.
- Circles represent data inputs; squares represent clock inputs.
- Bus meters show the current byte and clock level beside each source row.
- Dim headers identify inputs inactive in the current module mode. Their routing can be prepared in advance.
- An orange underline marks an input with a one-sample feedback delay.
- Hover a cell to read the complete source and destination names and the existing connection.

Matrix edits update the existing Live parameters. Dropdown changes, automation, and recalled routes update the matrix. Berlin's analog FM selector stays on the Berlin tab because it selects audio signals rather than a byte bus.

---

## 13. Resolved decisions

| # | Decision | Default |
|---|---|---|
| 1 | Lipsk gate law | OR (param keeps XOR) |
| 2 | Berlin clock | STEP |
| 3 | Race handling | DELAY via v8 back-edge analysis |
| 4 | Faithfulness | All extensions on; no faithful mode |
| 5 | Extra instances | ERF2, ROS2 added |
| 6 | Instrument wrapper | v2 |
| 7 | Persistence | Full state with set; RESUME on load |

### Verify during build

- Sidechain availability for Max audio effects on target Live version.
- gen~ `Buffer` resolution of `---` names.
- Blob parameter save timing (does Live request values on every save and on duplicate?).
- CPU of 16-input `selector` × two 7-pass settles per sample.
- `v8` routing-change latency (sets the DELAY fallback window).

---

## 14. Implementation notes

### 14.1 gen~

- One codebox holds the whole graph. Buses as locals `d_ERF1`, `c_ERF1`, etc.
- Source selection: `selector(src + 1, d_ZERO, d_CONST, d_ADC1, …)`.
- All persistent state through `Buffer state("---materia_state")` via `peek`/`poke`. No `History` for anything that must survive a reload.
- Bitwise: `& | ^ << >>`; fall back to `bitand`/`bitor`/`bitxor`/`shiftleft`/`shiftright` if needed.
- Randomness: LCGs stored in the state buffer, not `noise`.

### 14.2 Tables

- `buffer~ ---materia_jena`, generated in `v8` at load. Index = `family_offset + table * 256 + d`.
- User tables copied into their family slot from the `materia_jena_user` blob on load.

### 14.3 Oversampling

- gen~ inside `poly~ @resampling 1`, `up 1/2/4`.
- v1 may ship 1× only.

---

## 15. Test plan

Offline via a test patcher; compare bytes against a Python/numpy reference.

| # | Patch | Expected |
|---|---|---|
| T1 | ADC CONT, sine → DAC IDEAL | Output within 1 code of input |
| T2 | Silence → ADC → DAC, DC off | `d = 128`, out `+1/255` |
| T3 | Triangle → ADC → LP1 b7 → DAC | Halves swapped, discontinuity at midpoint |
| T4 | LP1 all bits | Polarity inversion |
| T5 | GER all pass, AND | Identity |
| T6 | ERF step 1, clock f | Bit k at f / 2^(k+1) |
| T7 | ERF1 → ROS1 (N=1) → ROS2 (N=1), shared clock | Each stage one clock behind; no same-clock fall-through |
| T8 | ERF1 ← LP1 ← ERF1 | No race; deterministic sequence |
| T9 | LP1 ← LP2 ← LP1, DELAY | No race LED; back edge at LP1's input (fixed-order DFS) |
| T10 | Same, LAST / NOISE | Race LED on; documented behavior |
| T11 | Jena Walsh sequency k | k zero crossings per 256 steps |
| T12 | Jena Walsh `k = 2^j` vs bit j | Identical up to scaling |
| T13 | Berlin STEP, 256f > fs/2 | Edges every 2 samples; saturation LED |
| T14 | Transport stop, TCLK modules | Hold |
| T15 | Save set mid-LOOP, reopen (RESUME) | ROS1/ROS2 contents, ERF A, Berlin phase bit-exact |
| T16 | Duplicate device | Identical state at duplication time |
| T17 | Save/load preset | State travels with preset |
| T18 | `recall_on_play = S1`, chaotic patch, play twice | Byte-identical output both runs |
| T19 | Export vs. playback with T18 setup | Byte-identical |
| T20 | CLEAR PIPES load | Rostock empty, everything else restored |

---

## Appendix A — Engineering issues in the source research PDF

Kept for rationale.

| # | PDF claim | Problem | Materia |
|---|---|---|---|
| 1 | Fixed evaluation order (synchronous before combinational) | Combinational → registered chains latch stale values; contradicts its own "sort topologically" advice | Settle / two-phase commit / settle (§6) |
| 2 | Drezno: unpatched clock = voltage below −1 V | Magic sentinel | Explicit clock mode |
| 3 | Drezno: `bus.clock = risingEdge`, false when unclocked | Downstream registered modules never tick | CONT emits a real clock |
| 4 | Berlin: `CLK = phase < 0.5` | One tick per waveform cycle | STEP default |
