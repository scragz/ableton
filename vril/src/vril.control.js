// MIDI note stack and native parameter dispatch. All sound runs in gen~.
autowatch = 0;
inlets = 1;
outlets = 1;
var held = [], sustain = false, bendValue = 0;
function emit(k,v) { outlet(0,k,v); }
function init() {
    for (var i=0;i<SCHEMA.length;i++) {
        var p=SCHEMA[i], o=this.patcher.getnamed(p.key);
        if(o) emit(p.key, Number(o.getvalueof()));
    }
    held=[]; sustain=false; emit('gate',0); emit('velocity',0);
}
function anything() {
    var a=arrayfromargs(arguments);
    if(a.length) emit(messagename,Number(a[0]));
}
function current() {
    if(!held.length) { emit('gate',0); return; }
    var n=held[held.length-1];
    emit('note',n.pitch); emit('velocity',n.velocity/127); emit('gate',1);
}
function note(p,v) {
    p=Math.round(p); v=Math.round(v);
    for(var i=held.length-1;i>=0;i--) if(held[i].pitch===p) held.splice(i,1);
    if(v>0) held.push({pitch:p,velocity:v,down:true});
    // Deferred releases remain sounding while the pedal is held.
    current();
}
function midi(p,v) {
    if(v>0) { note(p,v); return; }
    if(sustain) {
        for(var i=0;i<held.length;i++) if(held[i].pitch===p) held[i].down=false;
    } else note(p,0);
}
function cc(value,controller) {
    if(controller===64) {
        sustain=value>=64;
        if(!sustain) {
            held=held.filter(function(n){return n.down;}); current();
        }
    }
    if(controller===120 || controller===123) panic();
}
function bend(v) { bendValue=v*2; emit('bend',bendValue); }
function panic() { held=[]; sustain=false; emit('gate',0); emit('velocity',0); this.patcher.getnamed('playmode').message(0); outlet(0,'reset'); }
function randomize() {
    this.patcher.getnamed('seed').message(Math.random()*100);
    this.patcher.getnamed('scan').message(Math.random()*100);
}

// live.routing reports current indices and available labels independently.
function routingmenu(key,args) {
    var a=arrayfromargs(args); if(!a.length || a[0]==='<none>')a=['None'];
    var o=this.patcher.getnamed(key);
    o.message.apply(o,['_parameter_range'].concat(a));
}
function type_names(){routingmenu('input_type',arguments);}
function channel_names(){routingmenu('input_channel',arguments);}
function type_index(v){this.patcher.getnamed('input_type').message('set',v);}
function channel_index(v){this.patcher.getnamed('input_channel').message('set',v);}
function input_type(v){this.patcher.getnamed('routing').message('type',v);}
function input_channel(v){this.patcher.getnamed('routing').message('channel',v);}
