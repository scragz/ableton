// Shared jsui drawing helpers (ES5). Roles resolve to Live theme colors at paint time,
// so jsui content follows Live's skin. THEME data is injected by theme.py / theme.mjs.
var THEME_DATA = /*__THEME__*/null;
var THEME = { font: THEME_DATA.font, size: THEME_DATA.size, readout: THEME_DATA.readout, fieldset: THEME_DATA.fieldset };
(function () {
    function role(name) {
        return {
            get: function () {
                try {
                    if (typeof max !== "undefined" && max.getcolor) {
                        var c = max.getcolor(THEME_DATA.live[name]);
                        if (c && c.length >= 3) return [c[0], c[1], c[2], c.length > 3 ? c[3] : 1];
                    }
                } catch (e) {}
                return THEME_DATA.fallback[name];
            }
        };
    }
    for (var name in THEME_DATA.live) Object.defineProperty(THEME, name, role(name));
})();

function thColor(c, alpha) { mgraphics.set_source_rgba(c[0], c[1], c[2], alpha === undefined ? c[3] : c[3] * alpha); }
function thRect(x, y, w, h, c, alpha) { thColor(c, alpha); mgraphics.rectangle(x, y, w, h); mgraphics.fill(); }
function thFrame(x, y, w, h, c) {
    thColor(c || THEME.line); mgraphics.set_line_width(1);
    mgraphics.rectangle(x + 0.5, y + 0.5, w - 1, h - 1); mgraphics.stroke();
}
function thLine(x1, y1, x2, y2, c, width, alpha) {
    thColor(c || THEME.line, alpha); mgraphics.set_line_width(width || 1);
    mgraphics.move_to(x1, y1); mgraphics.line_to(x2, y2); mgraphics.stroke();
}
function thFont(size, face) { mgraphics.select_font_face(face || THEME.font); mgraphics.set_font_size(size || THEME.size); }
function thMeasure(s, size, face) { thFont(size, face); var m = mgraphics.text_measure(String(s)); return m ? m[0] : String(s).length * (size || THEME.size) * 0.55; }
// Truncate with an ellipsis so readouts never spill out of their slot.
function thFit(s, width, size) {
    s = String(s);
    if (thMeasure(s, size) <= width) return s;
    while (s.length > 1 && thMeasure(s + "…", size) > width) s = s.slice(0, -1);
    return s + "…";
}
// (x, y) is the baseline start. align: 0 left, 1 centre (x is the centre), 2 right (x is the right edge).
function thText(s, x, y, color, size, align, face) {
    s = String(s);
    var w = thMeasure(s, size, face);
    thColor(color || THEME.text);
    mgraphics.move_to(align === 1 ? x - w / 2 : align === 2 ? x - w : x, y);
    mgraphics.show_text(s);
}
// Centre a single line of text vertically inside a box.
function thBoxText(s, x, y, w, h, color, size, align) {
    size = size || THEME.size;
    var bx = align === 0 ? x + 5 : align === 2 ? x + w - 5 : x + w / 2;
    thText(thFit(s, w - 8, size), bx, y + h / 2 + size * 0.36, color, size, align === undefined ? 1 : align);
}
// Sections, like Live's devices: a bold header at the top-left of each block and dark divider lines
// between neighbouring blocks. Each section is [x, y, w, h, header]. Dividers are derived from geometry:
// a vertical line between side-by-side sections, a horizontal line between stacked ones, and a line
// above a section nested inside another.
function thSection(x, y, w, h, header) {
    var f = THEME.fieldset;
    if (header) thText(header, x + f.legendInset, y + f.legendBaseline, THEME.text, THEME.size, 0, f.legendFont);
}
function thSections(list) {
    var f = THEME.fieldset, near = f.adjacent, inset = f.dividerInset, i, j, a, b, lo, hi, mid;
    for (i = 0; i < list.length; i++) thSection(list[i][0], list[i][1], list[i][2], list[i][3], list[i][4]);
    for (i = 0; i < list.length; i++) for (j = 0; j < list.length; j++) {
        if (i === j) continue;
        a = list[i]; b = list[j];
        var aR = a[0] + a[2], aB = a[1] + a[3], bR = b[0] + b[2], bB = b[1] + b[3];
        var contains = b[0] >= a[0] && bR <= aR && b[1] >= a[1] && bB <= aB;
        if (contains) {
            // Nested: a rule above the inner section (unless it starts at the outer top).
            if (b[1] > a[1] + near) { mid = Math.round(b[1]) + 0.5; thLine(b[0] + inset, mid, bR - inset, mid, THEME.divider); }
            continue;
        }
        if (b[0] - aR >= -1 && b[0] - aR <= near) {
            lo = Math.max(a[1], b[1]) + inset; hi = Math.min(aB, bB) - inset;
            if (hi > lo) { mid = Math.round((aR + b[0]) / 2) + 0.5; thLine(mid, lo, mid, hi, THEME.divider); }
        }
        if (b[1] - aB >= -1 && b[1] - aB <= near) {
            // Stacked rows run edge to edge so the pieces join into one rule.
            lo = Math.max(a[0], b[0]) - near / 2; hi = Math.min(aR, bR) + near / 2;
            if (hi > lo) { mid = Math.round((aB + b[1]) / 2) + 0.5; thLine(lo, mid, hi, mid, THEME.divider); }
        }
    }
}
// Fieldset inside a section: rounded divider-coloured frame with a bold legend sitting on its top line
// (same drawing as Soma's FM / Phase clusters). Leave ~10 px between the frame top and its first control.
function thFieldset(x, y, w, h, legend) {
    x += 0.5; y += 0.5; w -= 1; h -= 1;
    var r = 4, f = THEME.fieldset, legendX = x + f.legendInset;
    var gapEnd = legend ? legendX + thMeasure(legend, THEME.size, f.legendFont) + 4 : legendX - 3;
    thColor(THEME.divider);
    mgraphics.set_line_width(1);
    mgraphics.new_path();
    mgraphics.move_to(gapEnd, y);
    mgraphics.line_to(x + w - r, y);
    mgraphics.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    mgraphics.line_to(x + w, y + h - r);
    mgraphics.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    mgraphics.line_to(x + r, y + h);
    mgraphics.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    mgraphics.line_to(x, y + r);
    mgraphics.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    mgraphics.line_to(legendX - 3, y);
    mgraphics.stroke();
    if (legend) thText(legend, legendX, y + THEME.size * 0.36, THEME.text, THEME.size, 0, f.legendFont);
}
// Dark inset used by displays and meters.
function thWell(x, y, w, h) { thRect(x, y, w, h, THEME.well); }
// live.text look-alike for controls that must stay inside a jsui.
function thButton(x, y, w, h, text, on, enabled) {
    enabled = enabled === undefined ? true : enabled;
    thRect(x, y, w, h, on ? THEME.accent : THEME.control);
    thBoxText(text, x, y, w, h, on ? THEME.ontext : enabled ? THEME.text : THEME.dim);
}
// live.numbox look-alike: control-coloured box with a centred value.
function thField(x, y, w, h, value, color, align) {
    thRect(x, y, w, h, THEME.control);
    thBoxText(value, x, y, w, h, color || THEME.text, THEME.size, align);
}
// Horizontal level meter.
function thMeter(x, y, w, h, level, color) {
    thWell(x, y, w, h);
    level = Math.max(0, Math.min(1, level));
    if (level > 0) thRect(x, y, Math.max(1, w * level), h, color || THEME.meter);
}
