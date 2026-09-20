autowatch = 1;
inlets = 1;
outlets = 1;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var ink = [0.9,0.91,0.88,1], muted = [0.48,0.54,0.53,1];
var gold = [0.85,0.72,0.43,1], teal = [0.40,0.78,0.71,1];
var values = {active:0, feedback:0.72, azimuth:0.5, elevation:0.5, wander:1, coupling:0.25};
var energy = 0, posX = 0.5, posY = 0.5, link = "GESTURES BEND RELATIONSHIPS";
var trace = [], flash = 0;
var pad = [410,32,154,111];

function col(c) { mgraphics.set_source_rgba(c); }
function rect(x,y,w,h,c) { col(c); mgraphics.rectangle(x,y,w,h); mgraphics.fill(); }
function line(x,y,u,v,c,width) { col(c); mgraphics.set_line_width(width || 1); mgraphics.move_to(x,y); mgraphics.line_to(u,v); mgraphics.stroke(); }
function text(s,x,y,size,c,bold) { col(c); mgraphics.select_font_face("Arial", "normal", bold ? "bold" : "normal"); mgraphics.set_font_size(size); mgraphics.move_to(x,y); mgraphics.show_text(s); }
function circle(x,y,r,c,fill) { col(c); mgraphics.ellipse(x-r,y-r,r*2,r*2); if(fill) mgraphics.fill(); else {mgraphics.set_line_width(1);mgraphics.stroke();} }
function value(k,v) { values[k] = v; mgraphics.redraw(); }
function connection(a,b) { link = a.toUpperCase() + "  >  " + b.toUpperCase(); flash = 1; mgraphics.redraw(); }
function meter(v) { energy = Math.max(0, Math.min(1,v)); flash *= 0.93; mgraphics.redraw(); }
function positionx(v) { posX=v; }
function positiony(v) {
    posY=v;
    if (values.active) { trace.push([posX,posY]); if(trace.length>45) trace.shift(); }
    else trace=[];
    mgraphics.redraw();
}
function paint() {
    rect(0,0,1000,169,[0.071,0.086,0.09,1]);
    rect(0,0,1000,2,gold);
    rect(400,23,174,127,[0.045,0.060,0.063,1]);
    text("S Y Z Y G Y",14,24,17,ink,true);
    text("FEEDBACK INSTRUMENT",15,40,8,muted,false);
    // Three aligned bodies form the identity mark.
    line(26,71,107,71,[0.27,0.31,0.30,1]);
    circle(34,71,10,gold,false); circle(66,71,15,teal,false); circle(101,71,7,ink,true);
    text(values.active ? "NETWORK ACTIVE" : "NETWORK AT REST",15,106,8,values.active ? teal : muted,true);
    for(var i=0;i<17;i++) rect(15+i*6,114,4,5,i<energy*55 ? teal : [0.16,0.20,0.20,1]);
    text("01 / EXCITE",146,18,9,gold,true);
    text("02 / NETWORK",272,18,9,gold,true);
    text("03 / AZIMUTH",414,18,9,teal,true);
    text("04 / MATTER",594,18,9,gold,true);
    text("05 / EVOLVE",722,18,9,gold,true);
    text("06 / OUTPUT",870,18,9,gold,true);
    [134,260,390,582,710,858].forEach(function(x){line(x,12,x,151,[0.18,0.22,0.22,1]);});
    for(var g=0;g<=4;g++) {
        var gx=pad[0]+g*pad[2]/4, gy=pad[1]+g*pad[3]/4;
        line(gx,pad[1],gx,pad[1]+pad[3],[0.12,0.17,0.17,1]);
        line(pad[0],gy,pad[0]+pad[2],gy,[0.12,0.17,0.17,1]);
    }
    for(var r=1;r<=3;r++) {
        col([0.18,0.27,0.25,0.55]); mgraphics.ellipse(487-r*22,87.5-r*15,r*44,r*30);mgraphics.stroke();
    }
    var mx=pad[0]+values.azimuth*pad[2], my=pad[1]+(1-values.elevation)*pad[3];
    line(mx-4,my,mx+4,my,muted); line(mx,my-4,mx,my+4,muted);
    for(var t=1;t<trace.length;t++) line(pad[0]+trace[t-1][0]*pad[2],pad[1]+(1-trace[t-1][1])*pad[3],pad[0]+trace[t][0]*pad[2],pad[1]+(1-trace[t][1])*pad[3],[0.4,0.78,0.71,t/trace.length*0.55],1.5);
    var px=pad[0]+posX*pad[2], py=pad[1]+(1-posY)*pad[3];
    circle(px,py,9,[0.4,0.78,0.71,0.12],true); circle(px,py,3.2,teal,true);
    text("L",403,88,7,muted); text("R",566,88,7,muted);
    text("X "+posX.toFixed(2)+"    Y "+posY.toFixed(2),426,160,8,teal,false);
    line(14,152,386,152,[0.18,0.22,0.22,1]);
    line(592,152,986,152,[0.18,0.22,0.22,1]);
    text("SELF-ORGANIZING SOUND",15,163,7,muted,false);
    text(link,593,163,7,flash>0.2 ? teal : muted,false);
    text("v0.1",965,163,7,muted,false);
}
function onclick(x,y) { ondrag(x,y,1); }
function ondrag(x,y,button) {
    if(button && x>=pad[0]-6 && x<=pad[0]+pad[2]+6 && y>=pad[1]-6 && y<=pad[1]+pad[3]+6) {
        outlet(0,"xy",Math.max(0,Math.min(1,(x-pad[0])/pad[2])),Math.max(0,Math.min(1,1-(y-pad[1])/pad[3])));
    }
}
