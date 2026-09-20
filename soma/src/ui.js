// Coarse/Fine knobs become Mult/Div when an outer oscillator's Type is Ratio; each pair shares one position.
// Listens to every control message; it never outputs, so it cannot feed back into the controls bus.
autowatch = 1;
inlets = 1;
outlets = 0;
function show(name,visible) { var o=this.patcher.getnamed(name); if(o) o.hidden=visible ? 0 : 1; }
function anything() {
    if(messagename!=="type_l" && messagename!=="type_r") return;
    var side=messagename.substring(5), ratio=Math.round(arguments[0])===1;
    show("tune_"+side,!ratio); show("fine_"+side,!ratio);
    show("mult_"+side,ratio); show("div_"+side,ratio);
}
