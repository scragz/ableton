# Fluxion — Max for Live MIDI effect

One Fluxion rhythm channel with 16 editable steps, a draggable temporal curve,
and Main / Aux 1 / Aux 2 note streams. No player grid, samples, audio, CV, or VCA.

## Load the device

1. Run `node scripts/build.mjs`. It writes a **frozen** `device/fluxion.amxd`
   with the eight runtime scripts from `src/` embedded; distribute that one file.
2. Drag **device/fluxion.amxd** onto a MIDI track in Ableton Live with Max for Live.
3. Start Live's transport. The default is one repeating four-beat step, with
   Main on channel 1 / note 36. Aux 1 (channel 2 / note 43) and Aux 2
   (channel 3 / note 45) default to OFF. Velocity defaults to 100.
4. Extend **Loop last** to include more steps. Edit steps independently of playback.

The build freezes the device itself, writing the same container layout as Live's
frozen factory devices (patch plus `fluxion-ui.js`, `fluxion-theme.js`,
`fluxion-control.js`, `fluxion-hit.js`, `fluxion-engine.js`, `fluxion-voice.js`, `fluxion-rhythm.js`,
`fluxion-state.js`). The layout is not
documented by Ableton; if Live rejects a build, open `device/fluxion.maxpat` with
`src/` on Max's search path and use **Freeze Device** manually. Test and preview
files in `src/` are never embedded.

### JSON / wrapper fallback

`Fluxion.maxpat` is the same patch as ordinary JSON. Open it in Max directly,
or use **File → New From Clipboard** with the entire JSON file. For an existing
Max MIDI Effect wrapper, copy all the objects and patch cords from this patch into
the wrapper, replacing its initial MIDI passthrough. Save the wrapper in this folder
so Max can locate the scripts. Enable **Open in Presentation**, with device width
1100 and height 169. Keep its MIDI-effect type. Then save/freeze from Live's Max editor.

The JSON describes Max objects and wiring; it does not contain the five JavaScript
dependencies. Pasting JSON alone without these files will not produce a working editor.

## The face

Every value in this device is a **real Live parameter** — 309 of them — so all but
four are automatable and mappable by Live's own modulators, by Max for Live LFOs,
by macros and by MIDI.

Per-step values are **banked**. Each of the 16 steps owns a complete set of
parameters (`Step 7 Mask Shift`, `Step 12 Gate`, …) and only the selected bank is
on screen. Banking is what makes them mappable at all: Live's modulators map by
clicking a control, so a parameter with no visible widget cannot be reached. To map
an LFO to one step's Mask Shift, select that step, hit Map, click the field. The
mapping stays on that step, because every bank is a distinct parameter.

Only four things are Stored Only — kept in the set, kept out of the automation
list: **All**, **Mod**, **Panic**, and the selected step. They are interface state,
not sound.

There is **no `pattr` blob** any more. Live stores parameters, so the parameter set
*is* the device state. That also retires the blob-versus-parameter recall race the
earlier builds had to guard with a load gate.

`fluxion-control.js` owns no values. It decides which bank is visible, copies an
edit across banks when ALL is on, and sends the face the little it needs to draw.
`fluxion-engine.js` assembles its 16-step state from `step <bank> <key> <value>`
messages and schedules from that. The face jsui is `ignoreclick 1, background 1`
background art — without both flags it covers the widgets and swallows every click
— and the two controls that still need the mouse (the step row, the curve graph)
get transparent `fluxion-hit.js` catchers over regions no widget occupies.

### Three consequences worth knowing

**Modulation lands on the next step edge.** A parameter move updates that step's
plan but cancels nothing already scheduled, so an LFO at control rate cannot thrash
the scheduler or drop notes. Hand edits behave the same way: they take effect the
next time that step is planned, at most 80 ms later.

**ALL is expensive in undo.** Copying one edit across 16 banks is 16 real parameter
writes, so Live's undo history fills quickly. Ableton's own production guidelines
warn about exactly this. Leave ALL off unless you are using it.

**Lane channels are no longer forced distinct.** Each is an independent parameter,
so two lanes can share a channel if you set them that way.

## Editing

- **1–16:** select the step to edit. The amber underline indicates playback and
  never changes the selected step. Alt/Option-click toggles a step's mute.
- **Loop first / last:** choose an inclusive step range. Length is per step, in
  sixteenth notes; it is not necessarily one sixteenth per button.
- **Curve:** drag the graph to bend the distribution. Double-click returns to linear.
- **Multi curve:** select `1` (normal), `2.0–2.2`, `3.0–3.3`, through
  `8.0–8.8`. The integer is the number of equal subgrids; the decimal is the
  bend pattern. Click either half or drag to browse; double-click returns to `1`.
  Curve sets the overall strength and sign; the graph shows the selected pattern
  and subdivision boundaries. ALL applies both division count and variation.
- **Values:** stock Live numboxes — drag, Shift-drag for fine adjustment, or click
  and type. Live enforces each field's range.
- **ALL:** apply subsequent step-parameter changes to all 16 steps, including
  steps outside the loop. It does not copy the current step when enabled.
- **STEP OFF:** mute the selected step's three outputs while preserving its length.
- **Aux modes:** a menu per aux lane. Probability picks **Trigger** or **Step**.
- **Channel / Note / Velocity:** configure each output. Choosing an occupied channel
  swaps the assignments, keeping all three channels distinct.
- **Note in:** where pitch and velocity come from:
  - **OFF** — each lane's Note / Velocity settings (original behavior).
  - **LATCH** — put a MIDI sequencer (or clip) before Fluxion. Every gate plays the
    most recent incoming note at its velocity; the note keeps playing after the
    sequencer releases it. Silent until the first input note arrives.
  - **HOLD** — gates fire only while input notes are held (last-note priority).
  In LATCH/HOLD the Note and Velocity cells go inert; channels still apply.
  Fluxion decides *when* gates fire and how long they last; the sequencer decides
  *what* plays. Input gate lengths are ignored, and input MIDI is not passed through.
- **MUTE:** release held notes and stop generating. Unmute resumes at Live's position.
- **PANIC:** clear pending notes, release held notes, and engage MUTE. Unmute to resume.

All 16 steps, loop limits, routing, mute, selected step, page, and ALL are stored
as a `pattr` Blob parameter for Live set/device recall. Playback position is not
saved. Per-step values are not themselves Live parameters; the Mod page below is
how they are automated and modulated.

## Modulation (Mod page)

**Mod** (top right) swaps the lower row for the modulation page; the step row and
the top strip stay put. The control script shows and hides the two widget sets, the
same way Materia switches its tabs.

Everything on the mod page is a real Live parameter and a native widget:
automatable, MIDI/macro-mappable, right-clickable, and a target for Max for Live
modulators and Live's own modulation.

### Global Offsets

Eight parameters that ride on top of every step's stored value. Density,
Curve, Diff, Phase, Compress, Humanize and Chance are offsets in the field's own
units and are neutral at 0; Gate is a percentage of the stored gate and is neutral
at 100%. Results are clamped to each field's normal range, so a global offset can
never push a step somewhere the editor could not.

### Mod Slots

Four assignable slots, each **Target / Step / Amount**:

- **Target** — any step field except Length. Off disables the slot.
- **Step** — `All`, or a single step 1–16.
- **Amount** — a percentage of the target field's full range, so one control
  behaves sensibly whatever it is pointed at. +100% on Curve is the full +5.

Length is deliberately not a target. The engine derives loop geometry from the
stored step lengths, so modulating length would desync planning from playback
position.

### What modulation does *not* touch

Parameters are applied to a **copy** of the step at plan time and are never written
back into the `pattr` blob. The blob is always the pattern; the parameters are
always modifiers on top of it. That is deliberate: Live restores blob and parameter
values in an unspecified order, and anything that wrote both would race on set load.
It also means a modulated or automated value never marks the set dirty, and
double-clicking a Mod field returns it to neutral without touching the sequence.

### When modulation is sampled

Values are sampled **once per step, when that step is first planned** — at most
`LOOKAHEAD_MS` (80 ms) before it sounds. Continuous modulation therefore never
cancels the pipe or replans notes already emitted; it lands on the next step edge.
Modulating at audio-ish rates will not produce smooth sweeps, and is not meant to:
the result is stepped, like a hardware sequencer sampling a CV at each gate.

Changing a slot's **Target** or **Step** is a configuration change rather than
modulation, so it drops the plan cache (but not the pipe) and takes effect at the
next unplanned step. Editing the pattern itself still cancels and replans as before.

## Transport behavior

The loop is anchored to Live's song start (**1.1.1 = beat 0**). The device computes
`songBeat modulo totalLoopLength`, then walks the selected steps using their
individual lengths. It does not count steps from when the device was loaded.
For example, step lengths 4, 8, 12 sixteenths produce a six-beat loop: song beat
8.5 is halfway through the second step of cycle two.

- Starting or resuming in the middle of a step uses its actual offset and sends
  upcoming notes. Past notes are not replayed and sustained notes are not chased.
- Backward seeks, detected forward seeks, and arrangement loop wraps clear queued
  output and release held notes before planning at the destination.
- Tempo changes preserve musical position and rebuild the pending schedule. They
  release held notes, so a tempo change can shorten a gate. This also applies to
  rhythm/routing edits, avoiding stale notes from the previous settings.
- Utility PPQ/divider outputs remain anchored to absolute song time.
- Stop and device deactivation release notes. Restarting returns to the appropriate
  position, even if Live's loop length differs from the device's loop length.
- Negative song positions produce no notes until beat zero.

`transport` is polled every 10 ms and reports absolute ticks at 480 ticks per
quarter note. A native `cpuclock` timestamp accompanies each report so JavaScript
queue latency does not masquerade as a seek. Forward discontinuity detection has
a 25 ms tolerance to accommodate host timing jitter; very small forward jumps may
briefly retain the old queue. Backward jumps are detected regardless of size.

JavaScript plans 80 ms ahead. Each planned message contains an **absolute tick
position**; a fresh native transport query converts that position into a delay.
Native `pipe` schedules the three-byte packet; `pack → iter → midiflush → midiout`
emits it. Between `pack` and `iter`, `fluxion-voice.js` substitutes the input
pitch/velocity at emit time (not plan time), so a sequencer note arriving just before
a gate is used; note-offs release the pitch that lane actually started. Its handlers
set `immediate = 1` to run in the scheduler thread — confirm timing in Live.
No JavaScript `Task` drives the note timing. Stop cancels the pipe before
flushing actually active notes. The output gate also checks current transport state.

This is scheduler-based MIDI, not sample-accurate DSP. Host seeks are detected at
the next poll; under heavy load, events already emitted before detection cannot
be recalled. Live timing, dense streams, save/reload, and downstream routing require
an in-host check before performance use.

## Rhythm behavior and MIDI routing

The manual in `docs/flux-user-manual.pdf` was read first, particularly rhythm
synthesis (pp. 4–9), MIDI velocity (p. 11), and auxiliary modes (p. 21).
`fluxion-rhythm.js` was derived from the web app's `lib/rhythm.ts` and is now
maintained locally so rebuilding cannot overwrite the device's curve catalog.
It preserves exponential time warping, divisions/differential, phase before
compression, clipping at step boundaries, humanization, probability, gate length,
masking, and the app's aux modes: OFF, COPY, SOS, FIRST, LAST, DEL 1–8,
TL 1–16, PPQ 1/2/4/8/16, and /2/4/8/16.

### Multi-curve catalog

There are 43 choices: normal `1`, then N + 1 variants for each division count N
from 2 through 8. Each subgrid keeps its start and end fixed; only the distribution
inside it bends. Density remains the total hit count for the step. Use a density
higher than the division count to hear the bends; hits exactly on subgrid boundaries
stay put. With Curve and Differential both zero, every mode is evenly spaced.

| Suffix | Pattern | Effect of Curve across subgrids | Available from |
| --- | --- | --- | --- |
| .0 | Repeat | Same strength and sign throughout | 2.0 |
| .1 | Alternate | Full positive / negative bends | 2.1 |
| .2 | Rise | Quarter strength growing to full strength | 2.2 |
| .3 | Fall | Full strength easing to quarter strength | 3.3 |
| .4 | Call / response | Full bend, then half-strength opposite bend | 4.4 |
| .5 | Arch | Gentler edges, stronger middle | 5.5 |
| .6 | Valley | Stronger edges, gentler middle | 6.6 |
| .7 | Wave | Smooth strength progression from positive to negative | 7.7 |
| .8 | 3-3-2 | Full bends on subgrids 1, 4, 7; gentler opposite responses elsewhere | 8.8 |

Negative Curve reverses each pattern's bend directions. Differential adds the
existing alternating offset to the bend amounts. Old saved states without a
variation load as `.0` and retain their previous timing, including the original
single-division Differential behavior. Variation is saved per step with the rest
of the sequence.

The manual confirms multiple divisions and differential curvature (p. 9), but
contains no numbered catalog or equations. These variations implement the recalled
numbering and musical behavior; they are **interpretations, not verified replicas
of the hardware presets**. The first five patterns follow the web app's available
variations; the larger families add Arch, Valley, Wave, and 3-3-2.

As in the web app, DEL units are sixteenths, TL restarts per step, and randomness
is seeded by step and cycle. The manual does not specify the hardware's equations
or DEL units. This is an adaptation of the working web app, not a claim of exact
hardware emulation. Hardware-only Boolean/CV aux modes are omitted. MIDI gate
lengths are clipped at step ends and the next same-lane hit; coincident same-pitch
hits on one lane collapse to one MIDI gate.

The device constructs MIDI note-on/off **status bytes for each output channel**
and uses `midiout`, never `noteout`. Live controls what happens downstream.
Standard Live routing can normalize or remap MIDI channels; separate status bytes
at this device's output are not proof of three independently routed Live tracks.
The three different default pitches also provide lane identities for note-based
routing if required. Your later routing device should inspect the raw stream at
the point where it receives it. This patch does not add virtual MIDI ports or an
external routing bridge.

References: [Max transport](https://docs.cycling74.com/reference/transport/),
[pipe](https://docs.cycling74.com/reference/pipe/),
[midiflush](https://docs.cycling74.com/reference/midiflush/),
[JavaScript scheduling](https://docs.cycling74.com/userguide/javascript/),
[pattr state](https://docs.cycling74.com/reference/pattr/),
[Ableton MIDI channel routing](https://help.ableton.com/hc/en-us/articles/360010389480-Using-MIDI-CC-in-Live).

## Build and verification

The build and focused tests use Node.js and the local files only. The preview
uses sharp from the Fluxion web app, expected at `../../fluxion` (override with
`FLUXION_APP=/path/to/fluxion`).

```sh
node scripts/build.mjs
node --test src/multicurve.test.mjs src/mods.test.mjs src/face.test.mjs
node src/preview.mjs
```

The local multi-curve suite checks all 43 modes, musical direction/strength,
monotonic timing and subgrid boundaries, legacy recall, selector gestures, ALL,
reset, MIDI event generation, and cancellation on edits. `mods.test.mjs` covers the
modulation layer: neutral no-ops, offset/scale arithmetic and clamping, slot
percentage scaling and accumulation, per-step scoping, the Length exclusion, curve
variant reclamping, Mod page hit regions, and the generated patch's parameter
integrity (unique Long Names, short names that fit the automation lane, a
`parameters` entry per object, and a patch cord from every parameter to the
engine). `face.test.mjs` drives the real widget-to-state chain through both
scripts: every widget's edit mapping, clamping on the round trip, ALL, channel
swapping, menu symbols, selection repaint without an engine replan, page
show/hide, the LATCH/HOLD inert cells, and blob recall. It also checks the
generated face for stray widgets, page roster coverage and rectangle overlaps.
Native Max inspection timed out during this change; the new selector and curve
behavior still require in-host validation.

The older app's `tests/max-for-live.test.mjs` expects this folder at `max-for-live/` in the
app repo, and its patch check still forbids `midiin`, which Note in now requires.

Tests cover parity with the web rhythm engine, raw MIDI channels and gates,
continuous playback without missing/duplicate events, unequal step lengths,
forward/backward seeks, loop wraps, mid-step restart, tempo changes, cancellation,
editor interactions, state serialization, and AMXD/patch dependency integrity.

`editor-preview.png` and `editor-preview-mod.png` are rendered from the actual jsui
drawing commands with a test renderer; the native widgets are sketched from the
generated patch's presentation rectangles, so they show placement, not how Live
draws them. Source-level layout previews, **not screenshots from Max**.
The tests execute the actual JavaScript in a Max API harness; they do not prove
Ableton integration or replace a native MIDI timing/recording check.

None of this proves the device works in Live. An earlier build of the native face
shipped its widgets with parameter mode off and they loaded blank and inert, which
only showed up in the host. Treat everything here as unverified until it is: the widget attribute values, `hidden` and
`ignoreclick` behaviour on `live.*` objects inside a frozen device, the parameter
ranges and units, automation and mapping, and step-boundary sampling under a real
modulator are all unverified.

In Live, verify these remaining integration checks:

1. Load with no Max Console errors and inspect the compact editor. Check that every
   value reads as a stock Live control, that the Mod button swaps the lower row
   cleanly, and that nothing from the hidden page is still drawing.
2. Play, stop, jump forward/backward, and loop an odd-length region with unequal
   device step lengths. Check that the playhead and emitted notes agree.
3. Monitor raw MIDI after `midiflush`, including stop/panic note-offs on all channels.
4. Save and reopen a set with distinct values in all 16 steps; verify routing/state.
5. Freeze and reload the device, then verify your intended downstream routing.
6. Confirm all 20 modulation parameters appear in the automation lane with sane
   ranges and units, that hand edits on the Mod page record automation, and that a
   Max for Live LFO on a Global offset produces stepped changes at step edges
   without dropping or retriggering notes.
7. Save a set with non-neutral modulation, reopen it, and confirm the pattern and
   the parameters both come back — and that the pattern is unchanged by whatever
   the parameters were doing when you saved.
8. Step through all 16 steps and confirm the widgets track the selection without
   audible interruption, and that typing an out-of-range value snaps back.
