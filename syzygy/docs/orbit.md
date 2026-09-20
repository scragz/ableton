# Orbit — Esoteric Feedback Instrument | Lucien Dargue Series

### Orbit
#### Lucien Dargue Series for Max for Live
*Noise Archive and Damage Phonography*

---

Over the past year I've been studying feedback network interactions in `gen~` and on the Electro-Smith Daisy platform, a programmable hardware module for running DSP algorithms outside the computer. This research draws directly from the work of Jaap Vink, Roland Kayn, and Agostino Di Scipio: systems where sound emerges from networks of interactions rather than from linear synthesis structures.

Many people have asked me to bring some of the ideas behind Endogen into the Ableton / Max for Live world. Orbit is the first step in that direction: the first device in the Lucien Dargue series.

### Separate research
My work on procedural sound systems and de-authoring is also the subject of a published research exposition: *Envion ~ Toward an Epistemic Ecology of Sonic Emergence (2026)*, available on the Research Catalogue, an international database for artistic research.

[Read on Research Catalogue →](https://www.researchcatalogue.net/)

---

## What Orbit Is

Orbit is not a port of Endogen but a fragment of its philosophy translated into M4L: excitation engines, dense feedback networks, and signals constantly influencing each other.

Endogen lives in SuperCollider. This instrument is built mostly in `gen~`, which has been giving me great possibilities for designing unstable feedback structures directly inside Max for Live. The result behaves less like a synth and more like a living feedback instrument.

The internal logic is intentionally very esoteric. Touching one parameter often re-indexes others somewhere else in the system, sometimes unpredictably. Even as the developer, I don't always know which variable will be affected.

---

## Stasis and Internal Regulation

Orbit is designed as a feedback instrument capable of sustaining long periods of dynamic stasis while internal interactions continue to evolve beneath the surface. Nested feedback relationships generate pressure, drift, and transformation inside the network, allowing the system to remain active even when its overall behaviour appears stable.

A crucial element of this balance is an internal companding structure that allows the instrument to regulate its own energy. Rather than relying on conventional limiting, the system continuously reshapes its dynamic range so feedback can remain active without collapsing into uncontrolled overload.

Because of this internal regulation, Orbit can maintain extended sonic states that slowly reorganize themselves over time, moving from extremely delicate micro-textures and suspended resonances to dense accumulations of sound while preserving a fragile equilibrium.

Reaching this behaviour required extensive benchmarking of the DSP core, including experiments on embedded hardware platforms. Part of the development process involved repeatedly testing feedback structures outside the computer environment in order to refine the timbral behaviour of the system. The goal was to model a sound character that could feel extremely cinematic and spatial, yet remain ambiguous and unstable: a texture capable of shifting between presence and disappearance while the feedback network continues reorganizing itself internally.

* **Orbit — Stasis and Internal Regulation:** In this short clip the system runs untouched, showing how internal feedback regulation sustains evolving textures without external input.
* **Orbit — Detail View:** Detail of Orbit's `gen~` codebox — the same DSP core also runs on the Electro-Smith Daisy embedded platform.

---

## How It Works

From the outside Orbit looks like a compact Max for Live device with a handful of controls. Inside, it's a nested modular system: multiple DSP modules connected through feedback paths, modulation buses, and internal signal routing. Nothing follows a linear chain. Signals are always influencing each other, and that's the point.

### The Stochastic Parameter Matrix
One of the core mechanisms is a stochastic parameter matrix. When you move a control, an internal process fires a burst of events. These events pass through a routing matrix that holds references to many parameters across different modules. The system then picks, randomly, which parameter will actually be affected.

So moving one knob might change something in a completely different part of the system. Sometimes the influence is indirect. Sometimes it cascades through several layers before anything audible happens. You can't fully predict which connection will activate. Parameters behave less like independent controls and more like agents in a network. This routing matrix is an original system I developed specifically during the design of Orbit.

### Feedback Dynamics
The instrument is fundamentally built around feedback. As feedback parameters increase, the system passes through different behavioural regimes: simple echo structures, interacting delay patterns, self-oscillation, unstable feedback clouds, chaotic behaviour. These transitions don't happen smoothly: the system jumps between states.

### Bifurcations
In dynamical systems theory there's a concept called bifurcation: when a control parameter crosses a threshold, the system suddenly changes its behaviour. It doesn't gradually shift: it splits into a new regime. Prigogine described something similar in his work on dissipative structures: systems far from equilibrium that self-organize into new patterns when pushed past critical points.

Orbit works in a similar way. When feedback crosses certain thresholds, the system reaches a bifurcation point. What happens next depends on small perturbations: internal noise, delay fluctuations, stochastic modulation, clock instabilities. Because of this, the system is not deterministic. Two identical gestures can lead to completely different sonic evolutions. This is not a bug. It's how far-from-equilibrium systems actually work.

### Autopoiesis
There's a concept from biology that describes this kind of behaviour better than any audio engineering term: autopoiesis. Maturana and Varela introduced it in the 1970s to describe living systems that continuously produce and maintain themselves through their own internal processes. An autopoietic system doesn't need external instructions to sustain its organisation: it regenerates its own structure from within.

Orbit's feedback network works in a similar way. The system doesn't wait for the user to tell it what to do next. Signals feed back into each other, modulate each other, destabilize and restabilize each other, and through this continuous internal exchange, new sonic structures emerge. The instrument maintains itself, reorganizes itself, and evolves on its own. When a bifurcation occurs and the current state can no longer hold, the network doesn't collapse into silence. It finds a new configuration and keeps going.

This is not a metaphor. It's how the DSP architecture actually operates. The feedback paths, the stochastic routing, the companding stages: they form a closed loop of interactions where each module's output becomes another module's input. The sound is not generated by a single source. It is produced by the network as a whole, continuously, from within.

> **Autopoiesis — self-organizing feedback network**
> Autopoiesis — a system that continuously produces and reorganizes itself through its own internal feedback relationships.

---

## Listening and Patience

Orbit rewards waiting. Randomization helps the system explore new states, but the most interesting behaviour usually appears when feedback structures self-organize over time. The system can produce anything from extremely dense and violent textures to barely audible micro-events, from unstable resonant clusters to slowly evolving sonic environments.

Because of this range, Orbit is suited for experimental composition, electroacoustic work, theatre and film sound design, installation, and noise-based performance. But it asks for a certain attitude: less controlling, more listening.

### Azimuth and Psychoacoustic Scatter
Orbit includes a dual-channel azimuth system based on a 4×4 grid of scatter junctions: a network of cross-stations that can route any signal to any output in any mix while preserving equal-power summing. On the interface this appears as the central X/Y controller.

The azimuth can be operated in three ways:
1. Manually by dragging the X/Y position
2. Through an external controller mapped to the two axes
3. Through a pair of internal LFOs running at independent random speeds per channel

In LFO mode the spatial position of the sound drifts continuously and unpredictably, creating movement that the ear perceives as organic rather than mechanical.

The result is not just a panner. Because each channel is processed through the scatter network independently, the system produces hard stereo separations and phase relationships that are surprisingly psychoacoustic: the sound acquires a spatial depth and width that goes well beyond simple left/right positioning. The stereo field itself becomes part of the timbral character of the instrument, shaping how Orbit sits in a mix and how the listener perceives its internal movement.

### Sound That Doesn't Fatigue
Another important aspect of the instrument only becomes clear through listening over time.

Orbit is designed so that its sound does not fatigue the ear easily. The system slowly evolves, revealing subtle internal reorganizations that emerge from the non-linear relationships inside the feedback network. Because the behaviour is not based on linear synthesis chains but on interacting structures, the sound continuously reshapes itself. Small perturbations propagate through the system, producing gradual changes in density, resonance, and spectral balance.

This is one of the reasons why the textures can remain engaging for long listening sessions without becoming static.

### Sample-Level Resolution
Modern DSP technology makes this possible in a way that was previously very difficult to achieve. Working at precise sample-level resolution allows feedback behaviours that traditionally belonged to unstable analog circuits to be explored and modeled with much greater control. The result is a system where non-linear feedback can be shaped rather than simply endured.

---

## Development Notes

During development I spent many hours listening to the instrument running continuously in preview, sometimes for entire evenings, simply observing how the sound reorganized itself over time. In the early stages this also meant enduring many extreme feedback states and unstable frequency accumulations, a process that could be mentally exhausting, but which proved essential in refining the balance and character of the instrument.

Through this process the goal gradually became clear: to build a system whose sonic structures can unfold over long periods of time without collapsing into monotony, allowing the listener to remain inside the evolving behaviour of the feedback itself.

---

## No Presets. Capture the Moment.

This needs to be said clearly: **it is practically impossible to save a preset in Orbit and expect it to sound the same way twice.**

The reason is structural. At any given moment, the sound you're hearing is the result of thousands of internal variables interacting simultaneously: feedback states, delay buffer contents, stochastic modulation positions, companding thresholds, resonance accumulations. A preset can store parameter values, but it cannot store the entire history of interactions that led the system to that specific sonic state. The moment you reload, the network starts from a different internal condition, and the evolution diverges almost immediately.

This is not a limitation. It's a direct consequence of how non-linear feedback systems work. The same initial parameters can produce radically different trajectories depending on microscopic differences in timing, noise, and internal state.

My advice is simple: **treat Orbit like a camera for sound.** When you hear something you like—a texture, a resonance, a transition—record it. That particular combination of relationships, the specific chain of events that produced that timbre, will not happen again. Not because the instrument is broken, but because the space of possible states is so vast that the probability of the same configuration occurring twice is essentially zero.

Hit record, capture the moment, and move on. The next moment will be different.

---
