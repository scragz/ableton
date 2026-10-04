# Device theme — design doc

## Goal

Fluxion, Hypna, Soma, Syzygy and Vermiform should look like stock Live devices: native `live.*` controls in Live's own colors, bold section headers with dark dividers, and no dead space. Custom drawing is only for things Live has no widget for.

## Principles

1. **Stock first.** A plain parameter or action is a `live.dial` / `live.text` / `live.tab` / `live.menu` / `live.numbox` / `live.slider`, **with no color attributes**, so Live's theme draws it.
2. **Stock colors everywhere else.** The patcher has no `bgcolor`. Comments, `umenu` and `textedit` bind to Live theme colors (`saved_attribute_attributes … expression: themecolor.live_*`). jsui resolves colors with `max.getcolor("live_*")` at paint time.
3. **Only three kinds of text.** *Label* (names a control), *header* (names a section), *readout* (live state). No titles, taglines, banners, hint lines or flavor copy.
4. **Sections, then fieldsets.** Top-level sections get a bold header (Ableton Sans Bold 9, baseline 13 px below the section top) or no header when the grouping is obvious (Fluxion's curve). Dark 1px dividers (`live_contrast_frame`) sit between sections; `thSections()` derives them from the section rectangles. Clusters inside a section use `thFieldset()`: a rounded divider-coloured frame with the bold legend on its top line, ~8 px from the section edges and ~10 px above its first control.
5. **Use the space.** Stack switches in a column beside a knob grid instead of stretching rows across; turn short menus into stacked radio sets (`live.tab`) when there's height to spare; tighten any fieldset wider than its contents.
6. **Custom = functional.** jsui only for scopes, XY pads, step/curve editors, meters, gate glow. Chrome that must live inside a jsui (Fluxion) uses `thButton` / `thField`, which copy the stock widgets' colors.
7. **One source.** `theme/theme.json` → `theme.py` / `theme.mjs` → per-device `<prefix>-theme.js` (and `<prefix>-art.js`).

## Roles → Live theme colors

| Role | Live color | Use |
| --- | --- | --- |
| well | `live_lcd_bg` | displays, meter troughs, text entry |
| control | `live_control_bg` | jsui buttons/fields off |
| line | `live_lcd_frame` | grids inside displays |
| divider | `live_contrast_frame` | section dividers |
| text / label | `live_control_fg` | values, labels, section headers |
| dim | `live_lcd_title` | secondary readouts, disabled |
| accent | `live_control_selection` | on state, selected step, gate glow |
| ontext | `live_control_fg_on` | text on an accent fill |
| meter | `live_value_bar` | level / phase meters |
| line1 / line2 | `live_display_line_one` / `_two` | curves, scope trace, XY trail |
| handle1 / handle2 | `live_display_handle_one` / `_two` | playhead, read head, XY dot, alerts |

Fallback RGBA values in `theme.json` are Live's default dark theme as reported by Max; they're only used in Node tests. Known gap: jsui repaints on its next redraw after a Live theme switch, not instantly.

## Type & geometry

Ableton Sans Medium 9 (readouts 9.5), section headers Ableton Sans Bold 9, Title Case. Content starts about 20 px below a section top. Dials 44 × 48 with name above and value below; where a column is short on space, Live's tiny dial (`appearance 1`, fixed size, value beside the knob) with the name drawn above it, rows 34 px apart. Buttons, menus and fields 18 px. Rows 22 px apart. Device height 169.

## Per-device layout

| Device | Layout |
| --- | --- |
| Soma | Left / Right: Type over Mult/Div (Coarse/Fine in Hi mode), FM fieldset over Phase fieldset, Mix fader. Center: FM over Phase, Mix fader. Gate: Open/Decay faders, glow, Material over Ctrl. Output: preset + waveform menus over a 2×2 of Gate Mod / Glide / Width / Volume. Width 1028. No routing window; Center Coarse/Fine/Transpose and the routing parameters stay at engine defaults. |
| Hypna | Tuning + Wavetable stacked, Voices table, Motion, Space. Width 1036. |
| Syzygy | Sun · Earth · Moon (one section each: Pitch / Mass over Matter / Level; between the rows a level meter, Strike, and pitch / matter readouts; a colour dot beside each header keys the body to the orbit display) · Orbit (clickable orbit jsui well 146 × 146 — trails, alignment triangle, syzygy flash, drag-to-throw — then Rate / Chaos, Gravity / Tide, Form tab over Launch and Hold) · Excite (Mallet / Position, Bow / Align, Keys tab over All; Syzygy Audio swaps Keys for an Input dial) · Resonance (Root / Decay, Bright / Feed) · Output (Space / Doppler, Width / Output). Action buttons are self-unlighting live.text toggles (vermiform's pattern). Rows at y 20 / 104. Width 1064. |
| Vermiform | Voice (mode menus, TTS text field — dimmed and unclickable unless the source mode is TTS — phrase readout) · Speech (1/32 / Drone / Arm stacked, Trigger / Stop pinned at the bottom; Speed / X / Y / Z as tiny dials with mode-driven names) · Worm (operation radio column, Corrupt / Restore at the same height as Trigger / Stop; Rate / Depth tiny dials; state glyph beside the header: ring intact, dot altered, square loop locked) · Memory (scope, output / width, Reset). Width 804. |
| Chiasmus | Time (Trigger tab over Division menu, Pre, Sens; bottom row Freeze · Time · Drift) · Direction (Pattern tab over Flip; Pitch over Fine) · Shape (head display + envelope well over Smooth/Swell/Zip/Wow and the Grain/Tape tab) · Loop (Feedback/Cross/Diffuse over Tone/Drive/Scatter) · Output (Width/Duck over Dry/Wet/Output). All full-size dials; every bottom-row knob at y 104. Width 906. |
| Atomism | Trigger (Source 4-way tab over Division menu and momentary Trig; Density/Burst; Sens/Jitter) · Grain (Size/Vary, Spray/Reverse, Window tab over a window-preview well) · Buffer (grain map well over Feedback, Hold, Voices/entropy readouts) · Pitch (Pitch/Random, Quantize tab over a pitch-histogram well) · Entropy (Entropy tab over a return-map / Lorenz-trail well; Chaos/Speed) · Output (Width over Dry/Wet, meters over Output). Each stacked tab has a small functional well under it. Rows at y 20 / 104. Width 966. |
| Calcinatio | Input (Input over Seed, Mute between) · Core (Order as a stacked 3-way tab over a Mono/Stereo tab; then one column per stage: Fold/Stages, Bias/Drift, Bits/Hold) · Feedback (Delay/Feedback over Mod ms/Mod Hz) · Output (Dry/Wet over Output, Ceiling beside). Dials 52 × 48 so unit-suffixed names fit; rows at y 20 / 104. Width 606. |
| Coagula | Source (live.drop, Load / Analysis buttons, file / format / status / cache readouts) · Space (scatter jsui = XY target) · Play (Morph fader + Link, Target X/Y, Variant and Axis tabs, Silence + Match, Unvoiced) · Grain (k, X-Fade, Max Len, Sil Thr over Jitter, Contin., Guard, Transp; Max Len value drawn by the panel so the top reads Off) · Trigger (mode tab, Run / Sync / Key Trk / Retune stacked; Rate over Division) · Output (live.gain~). The Analysis toggle swaps Play/Grain/Trigger for the analysis settings page. Width 1012. |
| Autocatalysis | Strings (strings well — note names and ring levels, held strings lit — over Ring / Mute; Sustain / Damp, Pick / Body) · Amp (Drive / Tone, Bias / Spread, Cab tab over the two Supply meters) · Kinetics (Sag / Catalysis, Recover / Rate, reaction phase-portrait well 92 × 140) · Space (Distance / Stage, Offset, Seek over Harmonic tab; seek strip — Hunting / Locked, offset in degrees — under them) · Output (Feedback / Output, L / R meters). Rows at y 20 / 104. Width 854. |
| Krisis | Input (Stereo tab over Multi menu and the B / C routing umenus; Width / S Drive) · Master (Freq — Treadle in wah mode — / Q, Spread / Drive, Feedback / Core; Spread Mode menu over the Harmonic-set menu, Scatter seed or a readout; voice-frequency well, L left / R right) · Detail (headerless; a stored-only page tab Voices / Matrix / Mod / Pedal over rows of tiny dials 60 px apart, rows 34 px, names drawn by the panel) · Loop (Clip tab over Curve; Sustain / Leak; Topology tab over Cross) · Chaos (Attractor tab over Audio / Freeze / Reset / Seed; Rate / Forcing; Entropy or Alpha / Beta; trail well 84 × 80 over Diverge and readouts) · Wah (Mode tab over Range, Source, Link; Min / Max, Taper / Body, Mass / Damping) · Output (Quality tab, Tap, Match, Limit; Dry/Wet / Output; Trim over meters + gain reduction). Width 1506. |
| Fluxion | Steps / Loop / Input strip; Curve graph; Rhythm, Timing, Chance columns of label/value rows; Output lanes with per-lane aux mode + Ch/Note/Vel. |

Vril follows the same section style through the shared background jsui (`thSections`), not `panel` boxes: Max clamps a `panel` to four pixels wide, so a hairline rule has to be drawn.

## Naming

`Soma.amxd` + `soma-*.js`, `Hypna.amxd` + `hypna-*.js`. Every js filename is device-prefixed because Max resolves those names globally across loaded devices.
