// Soma panel: section dividers (oscillator sections are untitled) with fieldsets around each FM / Phase cluster.
// Geometry is injected by scripts/build.py; colors follow Live's theme.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("soma-theme.js");
var LAYOUT = /*__LAYOUT__*/null;

function modulationFieldset(g) {
    var x = g[0] + 0.5, y = g[1] + 0.5, w = g[2] - 1, h = g[3] - 1;
    var r = 4, f = THEME.fieldset, legendX = x + f.legendInset;
    var gapEnd = legendX + thMeasure(g[4], THEME.size, f.legendFont) + 4;
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
    thText(g[4], legendX, y + THEME.size * 0.36, THEME.text, THEME.size, 0, f.legendFont);
}

function paint() {
    thSections(LAYOUT.sections);
    for (var i = 0; i < LAYOUT.fieldsets.length; i++) modulationFieldset(LAYOUT.fieldsets[i]);
}
