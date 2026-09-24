// Device background art: section headers, dividers and wells. The surface itself is Live's. Generated per device by theme.py.
autowatch = 1;
inlets = 1;
outlets = 0;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
include("calcinatio-theme.js");
var LAYOUT = {"width":1030,"height":188,"fieldsets":[[0,0,150,188,"Input"],[150,0,250,188,"Core"],[400,0,130,188,"Degrade"],[530,0,250,188,"Feedback"],[780,0,250,188,"Output"]]};

function paint() {
    var i, g;
    for (i = 0; LAYOUT.wells && i < LAYOUT.wells.length; i++) { g = LAYOUT.wells[i]; thWell(g[0], g[1], g[2], g[3]); }
    if (LAYOUT.fieldsets) thSections(LAYOUT.fieldsets);
}
