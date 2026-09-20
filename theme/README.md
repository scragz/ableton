# Shared device theme

Stock Live look for every generated device in this folder (fluxion, hypna, soma, syzygy, vermiform). See DESIGN.md.

Roles map to Live theme color names in `theme.json`; see DESIGN.md for the table.

## Rules

- Look like a stock Live device: `live.dial` / `live.text` / `live.menu` / `live.numbox` / `live.tab` wherever a control is a plain parameter or action.
- No device titles, taglines, or hint text. Live's device header already names the device.
- Text on the face is either a **label** (names a control), a bold **section header**, or a **readout** (shows live state). Sections have no frames; dark dividers between them come from `thSections()`.
- jsui is for things Live has no widget for (scopes, XY pads, step/curve editors, meters). Chrome that must live inside a jsui uses `thButton` / `thField` so it matches the native widgets.

## Use

- Python builds: `sys.path.insert(0, str(ROOT.parent / 'theme'))`, `import theme as T`. `T.dial()` etc. return geometry only (stock colors); `T.label()`, `T.umenu()`, `T.textedit()` bind to Live theme colors; `T.write_jsui(dest, prefix, layout)` writes the jsui prelude and fieldset art.
- Node (Fluxion): `import { prelude } from '../../theme/theme.mjs'`.
- jsui: `include("<prefix>-theme.js")`. Each device gets its own copy under a unique name because Max resolves `include()` / `jsui` filenames globally across loaded devices.
