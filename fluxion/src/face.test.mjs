import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const base = new URL('./', import.meta.url);
const read = name => fs.readFileSync(new URL(name, base), 'utf8');
const patch = JSON.parse(read('../device/Fluxion.maxpat')).patcher;
const boxes = patch.boxes.map(b => b.box);
const byId = Object.fromEntries(boxes.map(b => [b.id, b]));
const params = boxes.filter(b => b.saved_attribute_attributes);
const valueof = b => b.saved_attribute_attributes.valueof;
const wired = (src, dst) => patch.lines.some(l => l.patchline.source[0] === src && l.patchline.destination[0] === dst);
const rosters = byId.facemsg.text.split(',').map(s => s.trim().split(/\s+/));
const bankIds = rosters.filter(r => r[0] === 'roster').map(r => r.slice(2));
const modIds = rosters.find(r => r[0] === 'modpage').slice(1);

function script(file, extra = {}) {
    const sent = [], widgets = {};
    const patcher = {
        getnamed(name) {
            if (!widgets[name]) widgets[name] = {
                name, value: null, hidden: null, ignoreclick: null, sets: [],
                message(kind, v) {
                    if (kind === 'hidden') this.hidden = v;
                    else if (kind === 'ignoreclick') this.ignoreclick = v;
                    else if (typeof kind === 'number') { this.value = kind; this.sets.push(kind); }
                },
            };
            return widgets[name];
        },
    };
    const context = vm.createContext({
        outlet: (...args) => sent.push(args), post() {}, patcher, notifyclients() {},
        arrayfromargs: args => Array.from(args), error: m => { throw Error(m); },
        mgraphics: new Proxy({}, { get: (o, k) => o[k] || (() => {}) }),
        Task: function (fn, self) { this.fn = fn; this.schedule = () => fn.call(self); this.cancel = () => {}; },
        ...extra,
    });
    context.include = name => vm.runInContext(read(name), context);
    context.include(file);
    return { context, sent, widgets };
}
function control() {
    const c = script('fluxion-control.js');
    bankIds.forEach((ids, i) => c.context.roster(i, ...ids));
    c.context.modpage(...modIds);
    // Parameters emit their initial values at load; replay enough to be realistic.
    for (const id of ['w_selected', 'w_page', 'w_loopstart', 'w_loopend', 'w_input', 'w_all'])
        c.context.global(id, valueof(byId[id]).parameter_initial[0]);
    return c;
}
const mirrorOf = sent => JSON.parse(sent.filter(m => m[1] === 'mirror').pop()[2]);

test('every per-step value is its own mappable Live parameter, banked by step', () => {
    assert.equal(bankIds.length, 16);
    const perStep = bankIds[0].length;
    assert.equal(params.length, 16 * perStep + 8 + 9 + 20);
    for (let bank = 0; bank < 16; bank++) {
        assert.equal(bankIds[bank].length, perStep);
        for (const id of bankIds[bank]) {
            const box = byId[id];
            assert.ok(box, `${id} missing`);
            assert.equal(box.parameter_enable, 1);
            assert.equal(valueof(box).parameter_invisible, undefined,
                `${id} must be in the automation list or no modulator can map it`);
            assert.equal(box.presentation, 1, `${id} must be clickable to be map-able`);
            // Live's modulators map by clicking the control, so only the selected
            // bank is on screen; the rest are hidden, not absent.
            assert.equal(box.hidden, bank === 0 ? undefined : 1);
            assert.ok(wired(id, 're_' + id) && wired('re_' + id, 'engine'), `${id} does not reach the engine`);
            assert.ok(wired(id, 'rc_' + id) && wired('rc_' + id, 'control'), `${id} does not reach the control`);
        }
    }
    // Same field, same slot in every bank: the fan-out and the layout both rely on it.
    for (let bank = 1; bank < 16; bank++)
        assert.deepEqual(bankIds[bank].map(id => id.replace(/^s\d+_/, '')),
            bankIds[0].map(id => id.replace(/^s\d+_/, '')));
    assert.ok(bankIds[0].some(id => id.endsWith('_maskshift')), 'Mask Shift must be mappable');
});

test('names are unique and fit, and only interface state stays out of automation', () => {
    const names = params.map(b => valueof(b).parameter_longname);
    assert.equal(new Set(names).size, names.length);
    for (const b of params) assert.ok(valueof(b).parameter_shortname.length <= 15,
        `${valueof(b).parameter_shortname} too long for the automation lane`);
    const storedOnly = params.filter(b => valueof(b).parameter_invisible === 1).map(b => b.id);
    assert.deepEqual(storedOnly.sort(), ['w_all', 'w_page', 'w_panic', 'w_selected']);
    assert.equal(byId.w_selected.presentation, 0, 'the selection lives in the step row, not a widget');
    assert.ok(!boxes.some(b => String(b.text || '').startsWith('pattr')), 'the blob should be gone');
});

test('exactly one bank plus the globals is on screen at a time', () => {
    const shown = params.filter(b => b.presentation === 1 && !b.hidden).map(b => b.id);
    assert.equal(shown.length, bankIds[0].length + 16);
    const rect = id => byId[id].presentation_rect;
    const hits = (a, b) => rect(a)[0] < rect(b)[0] + rect(b)[2] && rect(b)[0] < rect(a)[0] + rect(a)[2]
        && rect(a)[1] < rect(b)[1] + rect(b)[3] && rect(b)[1] < rect(a)[1] + rect(a)[3];
    const live = [...shown, 'hit_steps', 'hit_curve'];
    for (let i = 0; i < live.length; i++)
        for (let j = i + 1; j < live.length; j++)
            assert.ok(!hits(live[i], live[j]), `${live[i]} overlaps ${live[j]}`);
});

test('selecting a step swaps which bank is visible', () => {
    const { context: c, widgets } = control();
    for (const id of bankIds[0]) assert.equal(widgets[id].hidden, 0);
    for (const id of bankIds[5]) assert.equal(widgets[id].hidden, 1);
    c.global('w_selected', 6);
    for (const id of bankIds[5]) assert.equal(widgets[id].hidden, 0, `${id} should be showing`);
    for (const id of bankIds[0]) assert.equal(widgets[id].hidden, 1);
    // The mod page hides every bank, whichever step is selected.
    c.global('w_page', 1);
    for (const id of bankIds[5]) assert.equal(widgets[id].hidden, 1);
    for (const id of modIds) assert.equal(widgets[id].hidden, 0);
});

test('ALL copies an edit across banks, and is off by default', () => {
    const { context: c, widgets } = control();
    c.bank(0, 'density', 9);
    for (let bank = 1; bank < 16; bank++)
        assert.equal(widgets[`s${bank}_density`].value, null, 'ALL is off, so nothing else moves');
    c.global('w_all', 1);
    c.bank(0, 'density', 12);
    for (let bank = 1; bank < 16; bank++)
        assert.equal(widgets[`s${bank}_density`].value, 12, `bank ${bank} did not follow`);
    // A modulator moving a bank that is not selected must not drag the others with it.
    c.bank(7, 'gate', 44);
    for (let bank = 0; bank < 16; bank++)
        if (bank !== 7) assert.equal(widgets[`s${bank}_gate`].value, null);
});

test('the face reports intentions; the control turns them into parameter writes', () => {
    const { context: c, widgets } = control();
    c.select(4);
    assert.equal(widgets.w_selected.value, 5, 'selection is one-based in the parameter');
    c.bank(0, 'enabled', 0);
    c.stepenabled(0);
    assert.equal(widgets.s0_enabled.value, 1, 'alt-click mutes the step');
    c.global('w_selected', 3);
    c.curve(2.5);
    assert.equal(widgets.s2_curve.value, 2.5, 'the curve drag writes the selected bank');
    c.curve(99);
    assert.equal(widgets.s2_curve.value, 5, 'and is clamped to the field');
});

test('the draw mirror carries what the face needs and nothing it does not', () => {
    const { context: c, sent } = control();
    c.bank(0, 'density', 7);
    c.bank(0, 'curvemode', 5);
    c.bank(3, 'enabled', 1);
    c.global('w_loopend', 4);
    const view = mirrorOf(sent);
    assert.equal(view.selected, 0);
    assert.equal(view.loopEnd, 3);
    assert.equal(view.step.density, 7);
    assert.equal(view.enabled[3], false, 'the step row shows which steps are muted');
    assert.equal(view.enabled[0], true);
    assert.ok(view.label.length > 0);
    const mode = c.CURVE_MODES[5];
    assert.equal(view.step.divisions, mode.divisions);
    assert.equal(view.step.curveVariant, mode.variant);
});

test('Note In makes the pitch and velocity cells inert', () => {
    const { context: c, widgets } = control();
    for (let lane = 0; lane < 3; lane++) assert.equal(widgets['w_note' + lane].ignoreclick, 0);
    c.global('w_input', c.INPUT_MODES.indexOf('LATCH'));
    for (let lane = 0; lane < 3; lane++) {
        assert.equal(widgets['w_note' + lane].ignoreclick, 1);
        assert.equal(widgets['w_vel' + lane].ignoreclick, 1);
    }
    c.global('w_input', 0);
    for (let lane = 0; lane < 3; lane++) assert.equal(widgets['w_note' + lane].ignoreclick, 0);
});

test('the face panel cannot swallow clicks meant for the parameters on top of it', () => {
    assert.equal(byId.editor.ignoreclick, 1);
    assert.equal(byId.editor.background, 1);
    for (const id of ['hit_steps', 'hit_curve']) {
        assert.equal(byId[id].filename, 'fluxion-hit.js');
        assert.ok(!byId[id].ignoreclick);
        assert.ok(wired(id, 'editor'));
        assert.deepEqual([...byId[id].jsarguments].slice(1), byId[id].presentation_rect.slice(0, 2));
    }
    assert.ok(modIds.includes('hit_curve'), 'the curve catcher would block the mod page');
});

test('a linear curve runs corner to corner inside the well', () => {
    // The plot used to be shorter than the well it sits in, so a Normal curve
    // floated above the floor and stopped short of both sides.
    // Collect whole paths: text baselines and grid lines also move_to/line_to, so
    // the curve is identified by being the one 121-point stroke.
    const paths = [];
    let path = [];
    const record = (x, y) => path.push([x, y]);
    const finish = () => { if (path.length) paths.push(path); path = []; };
    const c = script('fluxion-ui.js', {
        mgraphics: new Proxy({ move_to: record, line_to: record, stroke: finish, fill: finish },
            { get: (o, k) => o[k] || (() => {}) }),
    });
    c.context.mirror(JSON.stringify({
        selected: 0, page: 0, loopStart: 0, loopEnd: 0, label: '1 Normal',
        enabled: Array(16).fill(true),
        step: { ...c.context.DEFAULT_STEP, curve: 0, divisions: 1, curveVariant: 0, enabled: false },
    }));
    c.context.paint();
    const plotted = paths.find(p => p.length === 121);
    assert.ok(plotted, 'the curve stroke was not drawn');
    const [gx, gy, gw, gh] = c.context.graph, inset = c.context.PLOT_INSET;
    const first = plotted[0], last = plotted[plotted.length - 1];
    assert.deepEqual(first, [gx + inset, gy + gh - inset], 'the curve must start at the bottom left');
    assert.deepEqual(last, [gx + gw - inset, gy + inset], 'and finish at the top right');
    // Half a stroke width of inset, no more: it must read as touching the corners.
    assert.ok(inset <= 1);
    // The hit marks sit along the well's floor -- inside it, so they read as part
    // of the graph, and clear of the device edge.
    const { TICKS_Y, TICKS_H } = c.context;
    assert.ok(TICKS_Y > gy + gh / 2, 'ticks belong at the bottom of the well');
    assert.ok(TICKS_Y + TICKS_H <= gy + gh, 'ticks must stay inside the well');
});
