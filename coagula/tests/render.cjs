// Offline render: the real engine (analysis + selection) driving the real GenExpr (via the harness)
// in Chain mode. Writes tests/render-<name>.wav and reports discontinuities at segment joins.
// usage: node tests/render.cjs <sample.wav> [seconds] [morph 0..1] [variant 0..3] [axis 0|1]
const E = require('../src/coagula-engine.js');
const { make } = require('./genharness.cjs');
const { writeWav } = require('./synth.cjs');
(async () => {
    const [file, secs = '10', morph = '0', variant = '1', axis = '0'] = process.argv.slice(2);
    const info = E.readAudioInfo(file), mono = E.decodeMono(file, info);
    const variants = await E.analyze(mono, info.sr, E.DEFAULT_APARAMS, () => {});
    const v = variants[E.VARIANTS[+variant]], B = E.prepare(v, -50);
    const m = +morph;
    const P = Object.assign({}, E.DEFAULT_PARAMS, { variant: +variant, axis: +axis, sildens: B.silRatio,
        k: Math.round(Math.pow(16, m)), jitter: 0.15 * m, xfade: 8 * Math.pow(7.5, m), continuity: 0.6 * (1 - m),
        maxlen: m < 0.05 ? 1000 : 1000 * Math.pow(0.12, (m - 0.05) / 0.95) });
    const G = { ready: 1, tmode: 0, gateon: 1 };
    const src = { frames: mono.length, ch: 1, a: mono };
    const h = make({ P: G, BUF: { src } });
    const st = { last: -1, history: [], note: null };
    const N = Math.round(+secs * 44100), L = new Float32Array(N), steps = {};
    let commit = 0, queued = -1;
    for (let n = 0; n < N; n++) {
        const r = h.step(n, 0);
        L[n] = r[0];
        if (r[2] > 0.5) {
            if (queued >= 0) { st.last = queued; st.history.push(queued); }
            const s = E.selectSegment(v, B, P, st, Math.random);
            steps[s.step] = (steps[s.step] || 0) + 1;
            const pp = E.playParams(v, s.index, P, info.sr);
            Object.assign(G, { pstart: pp.start, plen: pp.len, prate: pp.rate, pgain: 1, pxf: pp.xf, pcommit: ++commit });
            queued = s.index;
        }
    }
    let jump = 0, srcJump = 0;
    for (let n = 1; n < N; n++) jump = Math.max(jump, Math.abs(L[n] - L[n - 1]));
    for (let n = 1; n < mono.length; n++) srcJump = Math.max(srcJump, Math.abs(mono[n] - mono[n - 1]));
    const out = `tests/render-m${m}-v${variant}.wav`;
    writeWav(out, [L], 44100);
    console.log(out, 'segments', commit, JSON.stringify(steps), 'max step', jump.toFixed(3), 'source max step', srcJump.toFixed(3),
        'nan', L.some(x => !isFinite(x)));
})();
