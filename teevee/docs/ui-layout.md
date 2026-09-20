# Teevee UI Panel Layout v8

This document describes the updated UI layout for the Teevee M4L device with all 10 effects organized into logical groups.

## Design Principles

1. **Grouped by Function**: Parameters are organized into GEOMETRY, TEXTURE, and SPACE categories
2. **Visual Hierarchy**: Related effects are placed together for intuitive workflow
3. **Consistent Styling**: All knobs use the same size and font, Freeze button matches the visual style

## Parameter Groups

### GROUP 1: GEOMETRY (Core Transforms)
*Manipulating position, scale, and orientation*

1. **SCROLL** - Vertical Pan / Delay (0-1)
2. **ZOOM** - UV Scaling / Varispeed (0-1)
3. **ROTATE** - 2D Rotation / Freq Shift (0-1)

### GROUP 2: TEXTURE (Signal Artifacts)
*Degrading quality and integrity*

4. **MOSAIC** - Pixelation / Downsampling (0-1)
5. **ABERRATION** - RGB Shift / Multiband Delay (0-1)
6. **BLOOM** - Glow / Overdrive (0-1)
7. **SOLARIZE** - Luma Inversion / Wavefolding (0-1)
8. **CRUSH** - Posterization / Bit Reduction (0-1)

### GROUP 3: SPACE (Time & Motion)
*Manipulating persistence and flow*

9. **SHUTTER** - Strobe / Tremolo (0-1)
10. **GHOSTING** - Double Vision / Slapback (0-1)
11. **SMEAR** - Frame Feedback / Reverb (0-1)
12. **FREEZE** - Buffer Loop / Datamosh (toggle: 0/1)

## Recommended M4L Panel Layout

```
┌────────────────────────────────────────────────────────────────┐
│  TEEVEE v8 - Parallel Twin Engine                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│    SCROLL           MOSAIC      BLOOM         SHUTTER          │
│      ◉               ◉           ◉              ◉              │
│                                                                │
│    ZOOM          ABERRATION   SOLARIZE       GHOSTING          │
│      ◉               ◉           ◉              ◉              │
│                                                                │
│    ROTATE           CRUSH      FREEZE           SMEAR          │
│      ◉               ◉           ◉              ◉              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## UI Element Specifications

### Knobs (live.dial)
- **Size**: Consistent across all parameters
- **Font**: Same size for all labels
- **Range**: 0.0 - 1.0 (normalized)
- **Appearance Mode**: Triangle or Dot
- **Show Value**: Yes

### Freeze Button (live.toggle or live.text)
- **Type**: Toggle button
- **Label Position**: Top (matching knob labels)
- **Font Size**: Same as knob labels
- **States**: 0 (off) / 1 (on)
- **Size**: Aligned with knob width

### Group Labels
- **Font**: Bold, slightly larger than parameter labels
- **Color**: Accent color to distinguish sections
- **Position**: Above each group

## Parameter Inlet Order (tv.param.maxpat)

The following inlet order maps to the UI layout:

1. Scroll (0-1)
2. Zoom (0-1)
3. Rotation (0-1)
4. Mosaic (0-1)
5. Aberration (0-1)
6. Bloom (0-1)
7. Solarize (0-1)
8. Crush (0-1)
9. Shutter (0-1)
10. Ghosting (0-1)
11. Smear (0-1)
12. Freeze (0/1)
13. Dimension (matrix size)

## Scaling Reference

### Audio Engine Scaling

| Parameter | Input | Audio Range | Object |
|-----------|-------|-------------|--------|
| Scroll | 0-1 | 0-1000ms | Delay offset |
| Zoom | 0-1 | 0.5-2.0x | Varispeed |
| Rotate | 0-1 | -500 to +500Hz | freqshift~ |
| Mosaic | 0-1 | 1.0-0.05 | degrade~ SR |
| Aberration | 0-1 | 0-40ms | tapout~ |
| Bloom | 0-1 | 1.0-8.0 drive | tanh~ |
| Solarize | 0-1 | 0-1 threshold | pong~ |
| Crush | 0-1 | 24-4 bits | degrade~ bits |
| Shutter | 0-1 | 0-20Hz | phasor~ |
| Ghosting | 0-1 | 0-0.8 feedback | tapout~ |
| Smear | 0-1 | 0-1 wet/dry | reverb |

### Visual Engine Scaling

| Parameter | Input | Visual Range | Logic |
|-----------|-------|--------------|-------|
| Scroll | 0-1 | 0-1 | Y offset |
| Zoom | 0-1 | 0.5-2.0 | UV scale |
| Rotate | 0-1 | -π to +π | Rotation |
| Mosaic | 0-1 | 2048-10 cells | UV quantize |
| Aberration | 0-1 | 0-0.05 offset | RGB shift |
| Bloom | 0-1 | 0-1 intensity | Blur + Add |
| Solarize | 0-1 | 0-1 threshold | abs(col-thresh) |
| Crush | 0-1 | 255-2 steps | Color quantize |
| Shutter | 0-1 | 0-20Hz | Temporal mask |
| Ghosting | 0-1 | 0-0.5 mix | Frame buffer |
| Smear | 0-1 | 0-0.95 feedback | Frame feedback |

## Implementation Notes

### Max for Live Device (teevee.amxd)

1. Open the M4L device in Edit mode
2. Add 7 new `live.dial` objects for the new parameters
3. Position them according to the layout above
4. Ensure all labels are positioned on top
5. Set consistent font sizes across all UI elements
6. Replace or update the Freeze button to match styling
7. Add group label comments for visual organization
8. Connect each dial to the corresponding inlet in `tv.param`

### Freeze Button Styling Fix

The Freeze button should:
- Have its label ("FREEZE") positioned **on top** of the button
- Use the **same font size** as the parameter knob labels
- Be **vertically aligned** with the knobs in the same row
- Use a `live.toggle` or `live.text` with consistent styling

Example settings for `live.toggle`:
```
Parameter Name: freeze
Short Name: FREEZE
Type: Button
Active Color: Accent color
Inactive Color: Background color
```

## Workflow Benefits

This layout supports natural creative workflows:

1. **Start with Geometry**: Set up basic movement and positioning
2. **Add Texture**: Layer in degradation and artifacts for character
3. **Apply Space**: Add temporal dimension with echo and smear effects
4. **Freeze for Exploration**: Lock the buffer to explore extreme parameter settings on frozen material

## Future Considerations

- **Presets**: Consider preset management for parameter combinations
- **Modulation**: LFO/envelope routing could be added per-group
- **Visual Feedback**: Consider adding small scope/visualization per section
