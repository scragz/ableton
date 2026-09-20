# Implementation Plan: Parallel Twin Engine Refactor

This plan guides the refactoring of **Teevee** into the complete **Parallel Twin Engine** architecture.

## Phase 1: The Architectural Split
*Goal: Separate "Geometry" from "Artifacts" and strictly define the Audio vs. Video domains.*

- [x] 1. Disconnect `tv.fx` from visual chain in `tv.main`.
- [x] 2. Re-route audio chain: `plugin~` - `tv.audio` - `tv.fx` - `plugout~`.
- [x] 3. Re-route visual chain: `tv.ingest` - `tv.viz`.
- [x] 4. Remove Stage 4 (Reverb/Smear) from `tv.audio.maxpat`.

## Phase 2: Build the Audio Artifacts Engine (`tv.fx.maxpat`)
*Goal: Create a serial chain of MSP objects for texture and space.*

- [x] 5. **MOSAIC**: Implement `degrade~` for sample rate reduction (Scale: 1.0 - 0.05).
- [x] 6. **ABERRATION**: Implement `svf~` 3-band split (250Hz / 2kHz) with `tapout~` delays on Mid/High.
- [x] 7. **BLOOM**: Implement `tanh~` saturation with gain compensation (Scale: 1 - 8 drive).
- [x] 8. **SOLARIZE**: Implement `fold~` or `pong~` for wavefolding distortion.
- [x] 9. **CRUSH**: Implement `degrade~` for bit depth reduction (Scale: 24 - 4 bits).
- [x] 10. **SHUTTER**: Implement `phasor~` - `>~ 0.5` for square wave gating (Scale: 0 - 20Hz).
- [x] 11. **GHOSTING**: Implement `tapin~`/`tapout~` (15ms) with feedback (0.8) for metallic slapback.
- [x] 12. **SMEAR**: Move Reverb (`tapin~` 5000ms) from `tv.audio` to end of chain.

## Phase 3: The Unified Visual Shader (`tv.core.genjit`)
*Goal: Consolidate all visual processing into a single GPU pass.*

- [x] 13. **MOSAIC**: Add UV quantization logic (Scale: 2048 - 10 cells).
- [x] 14. **ABERRATION**: Add RGB channel offset with radial falloff.
- [x] 15. **BLOOM**: Add 4-tap Gaussian blur + thresholding.
- [x] 16. **SOLARIZE**: Add `abs(color - threshold)` inversion logic.
- [x] 17. **CRUSH**: Add color quantization with dithering.
- [x] 18. **SHUTTER**: Add temporal LFO masking.
- [x] 19. **GHOSTING**: Add frame buffer mixing (accessing frames from 2-3 frames ago).

## Phase 4: Update `tv.viz.maxpat`
*Goal: Make this the container for the visual engine.*

- [x] 20. Add parameter receives (`r ---tv_param_*`) for all 10 effects.
- [x] 21. Connect `jit.gen` (`tv.core.genjit`) with proper feedback routing.

## Phase 5: Routing (`tv.param.maxpat`)
*Goal: Add the 7 new knobs and scaling logic.*

- [x] 22. Add 7 new parameter inlets to `tv.param.maxpat`.
- [x] 23. **MOSAIC Scaling**: Audio (1.0 - 0.05), Visual (2048 - 10).
- [x] 24. **ABERRATION Scaling**: Audio (0 - 40ms), Visual (0 - 0.05).
- [x] 25. **BLOOM Scaling**: Audio (1 - 8 drive), Visual (0 - 1).
- [x] 26. **SOLARIZE Scaling**: Audio/Visual (0 - 1 threshold).
- [x] 27. **CRUSH Scaling**: Audio (24 - 4 bits), Visual (255 - 2 steps).
- [x] 28. **SHUTTER Scaling**: Audio/Visual (0 - 20Hz).
- [x] 29. **GHOSTING Scaling**: Audio (0 - 0.8 fb), Visual (0 - 0.5 mix).
- [x] 30. Reorganize UI layout into logical groups (GEOMETRY, TEXTURE, SPACE).
- [x] 31. Create UI layout documentation (`ui-layout.md`).

## Testing & Optimization
- [ ] 30. Verify effect order matches exactly in audio and visual chains.
- [ ] 31. Test edge cases (0/1 values), texture wrapping, and precision.
- [ ] 32. Verify M4L compatibility (ensure no `gigaverb~`, `freeverb~`, `vdelay~`).
- [ ] 33. Monitor CPU usage and ensure GPU feedback stays on GPU.

## Future Prep
- [ ] 34. Note SCRUB X-axis correction per shader-refactor plan.
- [ ] 35. Prep for moving geometry effects to shader in next phase.
