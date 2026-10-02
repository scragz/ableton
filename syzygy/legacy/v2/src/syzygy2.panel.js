// Syzygy face: fieldsets, body meters, the spatial XY pad, phrase phase, and the controller's status readout.
// Every button and dial is a native live.* object on top of this jsui.
autowatch=1;
inlets=1;outlets=1;
mgraphics.init();mgraphics.relative_coords=0;mgraphics.autofill=0;
include("syzygy2.theme.js");
var W=936,H=169;
var FIELDSETS=[[2,0,222,168,'Bodies'],[228,0,76,168,'Resonance'],[306,0,76,168,'Relationships'],[384,0,76,168,'Evolution'],
 [462,0,84,168,'Play'],[548,0,188,168,'Field'],[740,0,194,168,'Output']];
// Wood / glass / metal use Live's display colours so they follow the skin.
function body(i){return [THEME.handle1,THEME.line2,THEME.handle2][i];}
var values={active:0,hold:0,evolve:0,bow:0,alignment:0.8,coupling:0.22,instability:0.12};
var levels=[0,0,0],phase=0,x=0.5,y=0.5,history=[],message='',undos=0,frames=0;
var pad=[558,22,168,110];
function value(k,v){values[k]=v;mgraphics.redraw();}
function status(s){message=String(s);mgraphics.redraw();}
function undoavailable(n){undos=n;}
// Use a differently named flag: public handlers are functions in Max's global scope.
var captureBusy=0;
function busy(v){captureBusy=v;mgraphics.redraw();}
function recorded(v){frames=v;}
function meterA(v){levels[0]=Math.max(v,levels[0]*0.84);}
function meterB(v){levels[1]=Math.max(v,levels[1]*0.84);}
function meterC(v){levels[2]=Math.max(v,levels[2]*0.84);}
function phrase(v){phase=v;}
function positionx(v){x=v;}
function positiony(v){y=v;if(values.active&&!values.hold){history.push([x,y]);if(history.length>55)history.shift();}mgraphics.redraw();}
function circle(cx,cy,r,c,fill,alpha){thColor(c,alpha);mgraphics.ellipse(cx-r,cy-r,r*2,r*2);if(fill)mgraphics.fill();else{mgraphics.set_line_width(1);mgraphics.stroke();}}
// Word-wrap a readout into at most `lines` lines of `width` px.
function wrap(s,width,lines){
 var words=String(s).split(' '),out=[],cur='';
 for(var i=0;i<words.length;i++){var t=cur?cur+' '+words[i]:words[i];if(thMeasure(t)>width&&cur){out.push(cur);cur=words[i];}else cur=t;}
 if(cur)out.push(cur);
 if(out.length>lines){out=out.slice(0,lines);out[lines-1]=thFit(out[lines-1]+'…',width);}
 return out;
}
function paint(){
 var i;
 thRect(0,0,W,H,THEME.surface);
 thSections(FIELDSETS);
 // Body level meters under each level dial.
 for(i=0;i<3;i++)thMeter(12+i*72,70,56,3,levels[i]*3,body(i));
 // Spatial field.
 thWell(pad[0],pad[1],pad[2],pad[3]);
 for(i=1;i<4;i++){thLine(pad[0]+i*pad[2]/4+0.5,pad[1],pad[0]+i*pad[2]/4+0.5,pad[1]+pad[3],THEME.line);thLine(pad[0],pad[1]+i*pad[3]/4+0.5,pad[0]+pad[2],pad[1]+i*pad[3]/4+0.5,THEME.line);}
 for(i=1;i<history.length;i++)thLine(pad[0]+history[i-1][0]*pad[2],pad[1]+(1-history[i-1][1])*pad[3],pad[0]+history[i][0]*pad[2],pad[1]+(1-history[i][1])*pad[3],THEME.line1,1.5,i/history.length*0.6);
 circle(pad[0]+x*pad[2],pad[1]+(1-y)*pad[3],3.5,THEME.handle1,true);
 // Phrase phase readout.
 var phases=['Gather','Bloom','Fracture','Settle'];
 thText(values.evolve?phases[Math.min(3,Math.floor(phase*4))]:'Manual',pad[0],pad[1]+pad[3]+20,values.evolve?THEME.text:THEME.dim);
 thMeter(pad[0]+62,pad[1]+pad[3]+15,pad[2]-62,3,values.evolve?phase:0,THEME.meter);
 // Controller status readout.
 var lines=wrap(message,172,3);
 for(i=0;i<lines.length;i++)thText(lines[i],750,140+i*12,THEME.label);
}
function onclick(mx,my){ondrag(mx,my,1);}
function ondrag(mx,my,button){if(button&&mx>=pad[0]&&mx<=pad[0]+pad[2]&&my>=pad[1]&&my<=pad[1]+pad[3])outlet(0,'xy',(mx-pad[0])/pad[2],1-(my-pad[1])/pad[3]);}
