# Calcinatio

Calcinatio is a stereo Max for Live audio effect. Put it on an audio track and play a clip to process a sample, or leave the input silent for seeded feedback generation. **Mute Input** removes the track audio while keeping the noise seed and feedback running.

The signal path is: input plus continuous noise seed → DC block → order selectable nonlinear core → DC block → short modulated comb delay with a separate `tanh` guard inside the feedback path → output limiter → output trim. The quantizer has its own dither so low bit depth and Degrade first cannot swallow the seed. The final output is clamped to the selected ceiling even if output trim is raised.

The Order menu offers Fold → Fuzz → Degrade, Degrade → Fold → Fuzz, and Fuzz → Degrade → Fold. **Stereo** uses independent seeds and drift/modulation phases. **Mono** sums the input and uses the left core for both output channels.

## Files

- `device/Calcinatio.amxd` is the single frozen collective with the patch, embedded Gen code, and both Live themed JSUI assets.
- `src/Calcinatio.maxpat` is the editable Max patch. `src/calcinatio.genexpr` is the DSP source.
- `scripts/build.py` rebuilds the patch and AMXD. `scripts/check_build.py` validates the collective, parameter graph, embedded assets, and deterministic output.
- `scripts/native_qa.py` creates a temporary bundled Max test patch for audio capture, covering silence startup in every order, sample processing, mono/stereo, and high feedback.

Run `python3 scripts/check_build.py` from this directory after changes. The structural check does not establish that Max compiled the Gen code or that Live produced audio; those require an active audio engine and actual recordings.
