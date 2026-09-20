// Vermiform face: fieldsets, mode-dependent X/Y/Z labels, and readouts (phrase, mode, worm state, memory scope,
// write/read heads, phoneme, output level). Every control is a native object on top of this jsui.
autowatch=1;inlets=1;outlets=1;
mgraphics.init();mgraphics.relative_coords=0;mgraphics.autofill=0;
include("vermiform.theme.js");
var W=804,H=169;
var FIELDSETS=[[2,0,220,168,'Voice'],[226,0,160,168,'Speech'],[388,0,168,168,'Worm'],[558,0,244,168,'Memory']];
// Tiny-dial name columns (x, first row top); rows are 34 px apart. Must match tiny() in scripts/build.py.
var SPEECH_NAMES=[310,20],WORM_NAMES=[492,20];
var memory=null;
function scope(name){memory=new Buffer(name);}
var mode=1,modeName='Phrase banks',xl='Pitch',yl='Bank',zl='Phrase',type='vocab',phrase='the worm speaks',phone='PA1',lock=0,frozen=0,op='Jitter',rot=0,writepos=0,readpos=0,meter=0,samples=[],count=0;
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function paint(){
 var i;
 thSections(FIELDSETS);
 // Voice: current phrase and mode number / type.
 var tag=('0'+mode).slice(-2)+' \u00b7 '+type.charAt(0).toUpperCase()+type.slice(1);
 thText(tag,214,132,THEME.dim,THEME.size,2);
 thText(thFit(phrase,204-thMeasure(tag)-10,THEME.readout),10,132,THEME.text,THEME.readout);
 // Speech: X/Y/Z names follow the selected mode, drawn where live.dial would show its name.
 var names=['Speed','X \u00b7 '+xl,'Y \u00b7 '+yl,'Z \u00b7 '+zl];
 for(i=0;i<4;i++)thText(thFit(names[i],70),SPEECH_NAMES[0],SPEECH_NAMES[1]+i*34+9,THEME.label);
 thText('Rate',WORM_NAMES[0],WORM_NAMES[1]+9,THEME.label);thText('Depth',WORM_NAMES[0],WORM_NAMES[1]+34+9,THEME.label);
 // Worm: state readout.
 // Worm state as a glyph beside the header: hollow ring = source intact, filled dot = altered memory,
 // filled square = loop locked.
 wormGlyph(546,9);
 // Memory: scope with write (text) and read (handle2) heads, state, phoneme, output meter.
 var left=568,top=22,w=224,h=56;
 thWell(left,top,w,h);
 thLine(left,top+h/2+0.5,left+w,top+h/2+0.5,THEME.line);
 thColor(THEME.line1);mgraphics.set_line_width(1);
 for(i=0;i<240;i++){var x=left+i*w/240,y=top+h*.5-clamp(memory?memory.peek(1,Math.floor(i*2048/240)):(samples[(count+i)%240]||0),-1,1)*h*.46;if(i==0)mgraphics.move_to(x,y);else mgraphics.line_to(x,y);}
 mgraphics.stroke();
 thRect(left+clamp(writepos,0,1)*(w-1),top,1,h,THEME.text);
 thRect(left+clamp(readpos,0,1)*(w-1),top,1,h,THEME.handle2);
 thText(phone,left,94,THEME.text,THEME.readout);
 thText(frozen?'Frozen':(mode>=63?'Read / write':'Capturing'),left+w,94,frozen?THEME.handle1:THEME.dim,THEME.size,2);
 thMeter(left,146,w,3,meter*5);
}
function wormGlyph(cx,cy){
 var c=lock||rot?THEME.handle1:THEME.dim;
 if(lock){thRect(cx-3.5,cy-3.5,7,7,c);return;}
 thColor(c);mgraphics.ellipse(cx-3.5,cy-3.5,7,7);
 if(rot)mgraphics.fill();else{mgraphics.set_line_width(1);mgraphics.stroke();}
}
function labels(n,name,x,y,z,t){mode=n;modeName=name;xl=x;yl=y;zl=z;type=t;mgraphics.redraw();}
function anything(){var a=arrayfromargs(arguments);if(messagename=='phrase')phrase=a.join(' ');if(messagename=='phoneme')phone=a[0];if(messagename=='frozen')frozen=a[0];if(messagename=='worm'){op=a[0];lock=a[1];}if(messagename=='decay')rot=a[0];if(messagename=='writepos')writepos=a[0];if(messagename=='readpos')readpos=a[0];if(messagename=='meter')meter=a[0];if(messagename=='sample'){samples[count%240]=a[0];count=(count+1)%240;}mgraphics.redraw();}
