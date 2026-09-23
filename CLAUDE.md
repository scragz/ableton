# Max for Live devices — workspace guide

This folder is a workspace, not a repo. Each subfolder is its **own git repo**
(except `theme/`, which is shared code). Commit inside the device folder you changed.

## Devices

| Folder | Device | Type | Build | Reference / inspiration |
| --- | --- | --- | --- | --- |
| `chiasmus/` | Chiasmus | Audio effect: reverse delay, Grain (6 windowed voices) or Tape (one head, Hermite stop/fast-forward catch-up) engine; Free/Sync/Onset triggers, Rev/Alt/ABBA patterns, Cross (blend or per-chunk Scatter) between forward echo and re-reversing loop. Builds everything into `device/` (no `scripts/build/`) | `python3 scripts/build.py` | Survey of reverse delays; see README "Influences and differences" |
| `fluxion/` | Fluxion | MIDI effect: 16-step rhythm channel, curve editor, Main/Aux1/Aux2 note lanes. Every value is a Live parameter (309), per-step values banked 16x so modulators can map them | `node scripts/build.mjs` | Flux manual (`docs/flux-user-manual.pdf`) |
| `hypna/` | Hypna | Instrument: 5-voice prime-ratio drone, wavetables, reverb | `python3 scripts/build.py` | Drone module; see README "Differences from the reference" |
| `materia/` | Materia | Audio effect: pool of 8-bit Leibniz-style bus modules, free routing | `python3 scripts/build.py` | Xaoc Leibniz; spec in `docs/spec.md` (v0.2) |
| `soma/` | Soma | Instrument: three-oscillator PM/FM network + low-pass gate | `python3 scripts/build.py` | Three Body + Natural Gate manuals; `docs/instrument-design.md` |
| `syzygy/` | Syzygy (v2) | Instrument **and** audio effect (`Syzygy.amxd`, `Syzygy Audio.amxd`) from one source: resonator bodies (wood/glass/metal), feedback field | `python3 scripts/build.py` | `docs/orbit.md`; v1 lives in `legacy/` |
| `vermiform/` | Vermiform | Instrument: mono speech synth, 7 voice families, 64 modes, "worm" corruption engine | `python3 scripts/build.py` | ERD/WORM manual; `docs/vermiform-m4l-spec.md` |
| `vril/` | Vril | Instrument: 9 generator/processor algorithms | `python3 scripts/build.py` | Vhikk X manual + algorithm reference |
| `teevee/` | Teevee | Audio effect: video-metaphor DSP (MSP) + Jitter visualizer | none — hand-built `.maxpat` modules | `docs/architecture.md`, `docs/current-plan.md` |
| `theme/` | — | Shared stock-Live look for all generated devices | imported by builds | `DESIGN.md` |

Always run builds from the device folder (`cd <device> && python3 scripts/build.py`);
several scripts use CWD-relative paths.

## Shared architecture (all generated devices except teevee)

- **Source of truth is `src/` + `scripts/`.** Patches are generated as Max JSON by the
  build script — never hand-edit `.maxpat` / `.amxd` / `.gendsp` output; change the
  generator and rebuild.
- **DSP** is GenExpr (`src/*.genexpr`, or Python-generated: `materia/scripts/dsp.py`,
  `vril/src/engine.py`) embedded in a `gen~` codebox.
  GenExpr gotchas (hit in chiasmus): function definitions must precede every declaration and
  statement; declare `Delay` at top level; `peek` has no `interp` -- use
  `sample(buf, i, ch, index="samples", interp="cubic")`. A codebox compile error shows only as a
  blank `codebox` line in Live; open `scripts/build/<Name>.maxpat` in Live's bundled Max
  (`Ableton Live 12 Suite.app/Contents/App-Resources/Max/Max.app`) to read the message.
- **Control** is Max JS (`js`, or `v8` in materia and vril) handling MIDI, state, and UI
  logic. **Panels** are `jsui` scripts for things Live has no widget for. Where a
  device's face is mostly custom (fluxion), the jsui is *background chrome only* —
  sections, fieldset frames and row labels — with native `live.*` widgets laid over
  it in presentation and a control script marshalling them against the state. Page
  switching hides and shows widget sets with
  `this.patcher.getnamed(name).message('hidden', 0|1)` (materia's `tab()` is the
  reference); `ignoreclick` disables one without hiding it.
- **A full-face `jsui` must be `ignoreclick 1, background 1`.** Otherwise it covers
  every native widget and eats their clicks, and the device looks fine but is dead
  to the mouse. Controls that genuinely need the mouse get a small transparent
  catcher jsui over their own rectangle, placed where no widget sits, forwarding
  coordinates to the face script (fluxion's `fluxion-hit.js`). A catcher that
  overlaps another page's widgets must join that page's hide/show roster.
- **A `live.*` widget that shows a value must be a parameter.** `live.numbox`,
  `live.menu`, `live.dial` and a toggling `live.text` render blank and refuse input
  with `parameter_enable 0` — the parameter *is* the value. Parameter mode off is
  only for widgets carrying no value (background `jsui`, momentary `live.text`,
  `umenu`). To give a control Live's look and ranges without putting it in the
  automation list, define the parameter and set `parameter_invisible 1` (Stored
  Only). Anything stored is then restored by Live in an undefined order against a
  `pattr` blob, so a device should pick one: either the blob owns the values, or
  the parameters do. Fluxion went all-parameter and deleted its blob.
- **To make a per-step value mappable, it needs its own parameter AND a visible
  widget.** Live's modulators map by clicking a control, so a parameter with no
  widget on screen is unreachable. Bank them: one full parameter set per step,
  `hidden` on all but the selected bank (fluxion, 16 x 17). The cost is a long
  automation list and an "apply to all steps" control that spends one undo step per
  bank -- Ableton's production guidelines warn that internally-driven parameters can
  render Live's undo useless.
- **Parameters** are defined in Python (`param()` / `schema.py` / `parameters.py`) and
  emitted as native `live.*` objects with `saved_attribute_attributes.valueof`.
- **Staging:** `scripts/build/` holds the unfrozen editable patch + loose deps (open
  `scripts/build/<Name>.maxpat` in Max to live-edit). It's generated output.
- **Freezing:** builds write a single self-contained `device/<Name>.amxd` by embedding
  deps in the `mx@c` collective footer themselves (layout documented in
  `vermiform/scripts/build.py`, validated against Ableton's `maxdevtools`). Layout:
  `ampf` devicecode (`iiii` instrument, `aaaa` audio fx, `mmmm` MIDI fx) → `meta` → `ptch`
  → `mx@c` + `dlst`/`dire` entries (main entry flag 17, deps flag 0, HFS+ mtime).
  Undocumented by Ableton — if Live rejects a build, fall back to Freeze Device in Max.
- `device/` is **gitignored** in every repo — rebuild after checkout. Treat stale files
  in `device/` (e.g. soma's `Three Body*`, syzygy's v1 `syzygy.*`) as leftovers, not source.
- Target: Max 9 (appversion 9.0.9, x64) inside Live.

## Theme rules (see `theme/DESIGN.md` for the full spec)

- Look like a stock Live device: `live.dial/text/menu/numbox/tab/slider` with **no color
  attributes**; patcher has no `bgcolor`; comments/umenu/textedit bind to `themecolor.live_*`.
- Only three kinds of text: label, bold section header, readout. No titles, taglines,
  hint text, logos, or decorative copy.
- Sections separated by 1px dark dividers via `thSections()`; clusters via `thFieldset()`.
  Use background jsui for rules, not `panel` (Max clamps panels to ≥4 px).
- jsui only for scopes, XY pads, step/curve editors, meters, glow.
- Device height **169**. Dials 44×48; tiny dials for tight columns; rows 22 px; buttons/menus 18 px.
- Single source: `theme/theme.json` → `theme.py` (Python builds: `sys.path.insert(0, ROOT.parent/'theme')`,
  `import theme as T`) / `theme.mjs` (Fluxion) → per-device `<prefix>-theme.js` + `<prefix>-art.js`.
- **Every JS filename must be device-prefixed** (`hypna-*.js`, `vermiform.*.js`, …): Max
  resolves `js`/`jsui`/`include()` names globally across all loaded devices, so collisions
  silently load the wrong file.
- Materia currently builds its own full-width panel and does not import `theme`.

## Testing

Automated checks only cover logic/packaging — they never substitute for loading the
device in Live. Say so explicitly when reporting results.

- chiasmus: `python3 tests/check_render.py tests/chiasmus-test.wav <freeze render>` (render made in Live; see README)
- fluxion: `node --test src/multicurve.test.mjs src/mods.test.mjs src/face.test.mjs` (mods and face read `device/Fluxion.maxpat`, so build first)
- hypna: `node --test tests/*.test.cjs`, `python3 tests/structure.py` (tests reference `device/` loose files — may need the staging paths)
- materia: `python3 scripts/test_defaults.py`, `node scripts/test_reference.cjs`, `node scripts/test_routing.cjs` (need a build first — read `scripts/build/schema.json`)
- syzygy: `node tests/control2.test.cjs` (v2); `control.test.cjs` targets v1 source
- vermiform: `node scripts/test_control.cjs`
- vril: `python3 scripts/check_build.py`, `node --test scripts/test_control.cjs`, `node scripts/check_dsp.cjs` (needs local Max install + `clang++`)

**Native QA pattern:** `build_qa.py` / `native_qa.py` / `build_regression_qa.py` generate a
QA device/patch that records cases to WAV (speakers muted), then `check_audio.py` /
`check_native.py` analyse them. Evidence lives in `docs/verification/`. `native_send.py`
drives a running Max instance. Vril's native verification is still pending.

## Conventions

- These are **original implementations inspired by** hardware manuals, not emulations or
  firmware ports. Don't claim sonic equivalence; document adaptations (READMEs have a
  "differences from the reference" style section — keep it current).
- No extracted ROMs, samples, or vendor assets. Wavetables/tables are generated locally.
- Builds should be deterministic (vril is byte-identical across runs; don't introduce
  timestamps/randomness without reason).
- Parameters Live should automate are native `live.*` objects; state not suited to
  parameters goes in a `pattr` (Fluxion stores its whole pattern as a Blob).
  Where a device has both, keep them one-way: parameters are applied to a copy at
  use time and never written back into the blob, because Live restores blob and
  parameter values in an unspecified order and anything writing both will race on
  set load. Fluxion's Mod page is the reference for this.
- Keep DSP bounded: smoothing, DC blocking, soft limiting, mute above ~0.45·SR rather than alias.
- When adding a device: own git repo, `src/ scripts/ device/ docs/` layout, shared
  `.gitignore` (ignores `device/`), device-prefixed JS names, theme via `theme/`, and
  add it to the table above and to `theme/DESIGN.md`'s per-device layout.
