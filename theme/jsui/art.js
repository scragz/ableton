// Device background art: section headers, dividers and wells. The surface itself is Live's. Generated per device by theme.py.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("__PRELUDE__");
var LAYOUT = /*__LAYOUT__*/null;

function paint() {
    var i, g;
    for (i = 0; LAYOUT.wells && i < LAYOUT.wells.length; i++) { g = LAYOUT.wells[i]; thWell(g[0], g[1], g[2], g[3]); }
    if (LAYOUT.fieldsets) thSections(LAYOUT.fieldsets);
}
