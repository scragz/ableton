// Mono last-note priority, counted repeated notes, sustain and 14-bit pitch bend.
// Every note-on hits the low-pass gate; releasing notes only returns pitch to a still-held note.
autowatch = 1;
inlets = 1;
outlets = 1;
var held = [], sustained = [], pedal = {}, status = 0, bytes = [];
var serial = 0, panicSerial = 0;
function send(name,value) { outlet(0,[name,value]); }
function key(n,c) { return n+":"+c; }
function newest() {
    var a=held.concat(sustained); a.sort(function(x,y){return x.time-y.time;});
    return a.length ? a[a.length-1] : null;
}
function sound(retrigger) {
    var n=newest();
    if(!n) return;
    send("midi_note",n.note); send("velocity",n.velocity/127);
    if(retrigger) send("trigger",++serial);
}
function note(n,v,c) {
    c=c||0;
    if(v>0) {
        sustained=sustained.filter(function(x){return key(x.note,x.channel)!==key(n,c);});
        held.push({note:n,velocity:v,channel:c,time:++serial}); sound(true);
    } else {
        var before=newest(), removed=null;
        for(var i=0;i<held.length;i++) if(held[i].note===n && held[i].channel===c) {removed=held.splice(i,1)[0];break;}
        if(removed && pedal[c]) sustained.push(removed);
        var after=newest();
        if(after && before && after.time!==before.time) sound(false);
    }
}
function control(cc,v,c) {
    if(cc===64) {
        pedal[c]=v>=64;
        if(!pedal[c]) { sustained=sustained.filter(function(x){return x.channel!==c;}); sound(false); }
    } else if(cc===120 || cc===123) {
        held=held.filter(function(x){return x.channel!==c;});
        sustained=sustained.filter(function(x){return x.channel!==c;});
        if(cc===120) send("panic",++panicSerial);
    } else if(cc===121) {
        pedal[c]=false; sustained=sustained.filter(function(x){return x.channel!==c;}); send("bend",0);
    }
}
function msg_int(v) {
    if(v>=248) return; // Realtime bytes may occur in the middle of a message.
    if(v>=128) { status=v<240 ? v : 0; bytes=[]; return; }
    if(!status) return;
    bytes.push(v);
    var kind=status&240, c=status&15, length=(kind===192||kind===208)?1:2;
    if(bytes.length<length) return;
    if(kind===144) note(bytes[0],bytes[1],c);
    else if(kind===128) note(bytes[0],0,c);
    else if(kind===176) control(bytes[0],bytes[1],c);
    else if(kind===224) { var b=bytes[0]+128*bytes[1]-8192; send("bend",b/(b<0?8192:8191)); }
    bytes=[];
}
function panic() {
    held=[]; sustained=[]; pedal={}; status=0; bytes=[];
    send("panic",++panicSerial);
}
function object(name) {
    var o=this.patcher.getnamed(name);
    if(!o) { var r=this.patcher.getnamed("routing"); if(r) o=r.subpatcher().getnamed(name); }
    return o;
}
function setcontrol(name,value) { var o=object(name); if(o) o.message(value); }
function initialize() {
    // Bang restored Live parameter values; never overwrite them with a preset.
    for(var name in defaults) { var o=object(name); if(o) o.message("bang"); }
}
function preset(index) {
    index=Math.round(index);
    var p=patches[index]; if(!p) return;
    for(var name in defaults) if(name!=="output_db") setcontrol(name,defaults[name]);
    for(var name in p) setcontrol(name,p[name]);
}
// __PRESETS__
