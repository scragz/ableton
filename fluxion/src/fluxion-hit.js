/* eslint-disable no-var, no-unused-vars -- Max invokes global callbacks and requires ES5 syntax. */
// A transparent click catcher.
//
// The face jsui spans the whole device and must be `ignoreclick 1, background 1`
// or it swallows every click meant for the native widgets on top of it (as every
// other device in this workspace does with its background jsui). The two controls
// that still need the mouse -- the step row and the curve graph -- therefore get
// one of these over their own rectangle, in a region with no widgets in it. It
// draws nothing; it translates mouse events into face coordinates and forwards
// them to the face script.
autowatch = 1;
inlets = 1;
outlets = 1;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

// jsarguments[0] is the filename; the origin of this panel within the face follows.
var originX = jsarguments.length > 1 ? Number(jsarguments[1]) : 0;
var originY = jsarguments.length > 2 ? Number(jsarguments[2]) : 0;

function paint() {}
function onclick(x, y, buttonState, cmd, shift, caps, option) {
    outlet(0, "click", x + originX, y + originY, option ? 1 : 0, shift ? 1 : 0);
}
function ondrag(x, y, buttonState, cmd, shift) {
    outlet(0, "mousedrag", x + originX, y + originY, buttonState ? 1 : 0, shift ? 1 : 0);
}
function ondblclick(x, y) { outlet(0, "dblclick", x + originX, y + originY); }
