# Fluxion — Max for Live MIDI effect

One Fluxion rhythm channel with 16 editable steps, a draggable temporal curve,
and Main / Aux 1 / Aux 2 note streams. No player grid, samples, audio, CV, or VCA.

## Load the device

1. Run `node scripts/build.mjs`. It writes a **frozen** `device/fluxion.amxd`
   with the five runtime scripts from `src/` embedded; distribute that one file.
2. Drag **device/fluxion.amxd** onto a MIDI track in Ableton Live with Max for Live.
3. Start Live's transport. The default is one repeating four-beat step, with
   Main on channel 1 / note 36. Aux 1 (channel 2 / note 43) and Aux 2
   (channel 3 / note 45) default to OFF. Velocity defaults to 100.
4. Extend **Loop last** to include more steps. Edit steps independently of playback.

The build freezes the device itself, writing the same container layout as Live's
frozen factory devices (patch plus `fluxion-ui.js`, `fluxion-engine.js`,
`fluxion-voice.js`, `fluxion-rhythm.js`, `fluxion-state.js`). The layout is not
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
- **Values:** drag up/down; Shift-drag for fine adjustments. Click the left half
  to decrement or the right half to increment. Double-click rhythm fields to reset.
- **ALL:** apply subsequent step-parameter changes to all 16 steps, including
  steps outside the loop. It does not copy the current step when enabled.
- **STEP ON/OFF:** mute the selected step's three outputs while preserving its length.
- **Aux modes:** drag or use the two halves to move through the modes; double-click
  switches the aux off. Probability toggles between **Trigger** and **Step**.
- **Channel / Note / Velocity:** configure each output. Choosing an occupied channel
  swaps the assignments, keeping all three channels distinct.
- **Note in:** where pitch and velocity come from. Click to cycle:
  - **OFF** — each lane's Note / Velocity settings (original behavior).
  - **LATCH** — put a MIDI sequencer (or clip) before Fluxion. Every gate plays the
    most recent incoming note at its velocity; the note keeps playing after the
    sequencer releases it. Silent until the first input note arrives.
  - **HOLD** — gates fire only while input notes are held (last-note priority).
  In LATCH/HOLD the Note and Velocity cells show **IN**; channels still apply.
  Fluxion decides *when* gates fire and how long they last; the sequencer decides
  *what* plays. Input gate lengths are ignored, and input MIDI is not passed through.
- **MUTE:** release held notes and stop generating. Unmute resumes at Live's position.
- **PANIC:** clear pending notes, release held notes, and engage MUTE. Unmute to resume.

All 16 steps, loop limits, routing, mute, selected step, and ALL are stored as a
`pattr` Blob parameter for Live set/device recall. This initial version does not
expose individual controls as Live automation parameters. Playback position is not saved.

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
node build.mjs
node --test multicurve.test.mjs
node preview.mjs
```

The local multi-curve suite checks all 43 modes, musical direction/strength,
monotonic timing and subgrid boundaries, legacy recall, selector gestures, ALL,
reset, MIDI event generation, and cancellation on edits.
Native Max inspection timed out during this change; the new selector and curve
behavior still require in-host validation.

The older app's `tests/max-for-live.test.mjs` expects this folder at `max-for-live/` in the
app repo, and its patch check still forbids `midiin`, which Note in now requires.

Tests cover parity with the web rhythm engine, raw MIDI channels and gates,
continuous playback without missing/duplicate events, unequal step lengths,
forward/backward seeks, loop wraps, mid-step restart, tempo changes, cancellation,
editor interactions, state serialization, and AMXD/patch dependency integrity.

`editor-preview.png` is rendered from the actual jsui drawing commands with a
test renderer. It is a source-level layout preview, **not a screenshot from Max**.
The tests execute the actual JavaScript in a Max API harness; they do not prove
Ableton integration or replace a native MIDI timing/recording check.

In Live, verify these remaining integration checks:

1. Load with no Max Console errors and inspect the compact editor.
2. Play, stop, jump forward/backward, and loop an odd-length region with unequal
   device step lengths. Check that the playhead and emitted notes agree.
3. Monitor raw MIDI after `midiflush`, including stop/panic note-offs on all channels.
4. Save and reopen a set with distinct values in all 16 steps; verify routing/state.
5. Freeze and reload the device, then verify your intended downstream routing.
