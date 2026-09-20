// Source rows x destination columns; route changes go through native Live parameters.
autowatch=1;inlets=1;outlets=1;
mgraphics.init();mgraphics.relative_coords=0;mgraphics.autofill=0;
var BUS=['ZERO','CONST','ADC1','ADC2','BER','ERF1','ERF2','LP1','LP2','GER','JEN','ROS1','ROS2','PZ.1','PZ.2','MTX','TCLK','ICLK','ERF1.OVF','ERF2.OVF','NOTE','VEL'];
var state={},activity=[],delays={},filter=0,usedOnly=false,hoverRow=-1,hoverCol=-1,chosen='',connected=0;
ROUTES.forEach(function(r){state[r.key]=r.default;});
function rgba(k,alpha){var c=max.getcolor(k);if(alpha!==undefined)c[3]=alpha;return c;}
function fill(x,y,w,h,k,a){mgraphics.set_source_rgba(rgba(k,a));mgraphics.rectangle(x,y,w,h);mgraphics.fill();}
function label(s,x,y,size,k){mgraphics.set_source_rgba(rgba(k||'live_control_fg'));mgraphics.select_font_face('Arial');mgraphics.set_font_size(size||11);mgraphics.move_to(x,y);mgraphics.show_text(s);}
function line(x,y,x2,y2,k,a){mgraphics.set_source_rgba(rgba(k,a));mgraphics.set_line_width(1);mgraphics.move_to(x,y);mgraphics.line_to(x2,y2);mgraphics.stroke();}
function dot(x,y,r,k){mgraphics.set_source_rgba(rgba(k));mgraphics.ellipse(x-r,y-r,r*2,r*2);mgraphics.fill();}
function layout(){
 var w=box.rect[2]-box.rect[0],h=box.rect[3]-box.rect[1];
 var cols=ROUTES.filter(function(r){return filter===0||(filter===1&&!r.clock)||(filter===2&&r.clock);});
 var rows=[];for(var i=0;i<22;i++)if(!usedOnly||ROUTES.some(function(r){return state[r.key]===i;}))rows.push(i);
 var left=176,top=170,cw=Math.min(68,(w-left-18)/cols.length),rh=Math.min(27,(h-top-61)/rows.length);
 return {w:w,h:h,cols:cols,rows:rows,left:left,top:top,cw:cw,rh:rh,right:left+cols.length*cw,bottom:top+rows.length*rh};
}
function active(r){
 if(r.key==='a1_clk')return state.a1_mode===2;
 if(r.key==='a2_clk')return state.a2_mode===2;
 if(r.key==='j_clk')return state.j_sync===1;
 if(r.key==='p_clk')return state.p_mode===2;
 if(r.key==='p_bus')return state.p_mode!==0;
 return true;
}
function inactiveReason(r){
 if(r.key==='a1_clk'||r.key==='a2_clk')return r.tab+' Clock must be BUS';
 if(r.key==='j_clk')return 'Jena must be SYNC';
 if(r.key==='p_clk')return 'Poczdam must be CLOCKED';
 if(r.key==='p_bus')return 'Poczdam must be BIT or CLOCKED';
 return '';
}
function paint(){
 var g=layout();fill(0,0,g.w,g.h,'live_surface_bg');
 label('PATCH MATRIX',16,25,13);label('Click to connect. Click a connection to clear it.',176,25,11);
 ['All','Data','Clocks'].forEach(function(t,i){fill(16+i*64,42,60,22,filter===i?'live_control_selection':'live_control_bg');label(t,25+i*64,57,11,filter===i?'live_control_fg_on':'live_control_fg');});
 fill(222,42,116,22,usedOnly?'live_control_selection':'live_control_bg');label('Used buses only',230,57,11,usedOnly?'live_control_fg_on':'live_control_fg');
 dot(383,53,4,'live_value_arc');label('Data',394,57,10);fill(445,49,8,8,'live_lcd_control_fg');label('Clock',461,57,10);
 label('Dim header = inactive input',550,57,10);label('Orange underline = one-sample feedback delay',750,57,10);
 label('SOURCE BUS',16,157,10);label('D7           D0  C',90,157,9);
 // Module names span related destinations; secondary labels rotate for readability.
 var start=0;
 while(start<g.cols.length){var end=start+1;while(end<g.cols.length&&g.cols[end].tab===g.cols[start].tab)end++;
  var x=g.left+start*g.cw;fill(x,77,(end-start)*g.cw-2,18,'live_control_bg');
  var title=g.cols[start].tab;label(title,x+Math.max(2,((end-start)*g.cw-title.length*6)/2),90,10);start=end;
 }
 for(var c=0;c<g.cols.length;c++){
  var r=g.cols[c],x=g.left+c*g.cw,live=active(r);
  fill(x,97,g.cw-2,g.top-97,live?'live_control_bg':'live_lcd_frame',live?1:.3);
  mgraphics.save();mgraphics.translate(x+g.cw*.62,g.top-7);mgraphics.rotate(-Math.PI/2);label(r.port,0,0,10,live?'live_control_fg':'live_control_text_zombie');mgraphics.restore();
  if(delays[r.key])fill(x,g.top-3,g.cw-2,3,'live_lcd_control_fg');
 }
 connected=0;
 for(var ri=0;ri<g.rows.length;ri++){
  var bus=g.rows[ri],y=g.top+ri*g.rh,cy=y+g.rh/2;
  fill(12,y,g.right-12,g.rh-1,ri===hoverRow?'live_selection':ri%2?'live_control_bg':'live_surface_bg',ri===hoverRow?.35:ri%2?.30:1);
  label(BUS[bus],18,cy+4,11,bus>=20?'live_control_text_zombie':'live_control_fg');
  var value=activity[bus*2]||0;for(var b=0;b<8;b++)fill(92+b*7,cy-3,5,6,(value>>(7-b))&1?'live_value_arc':'live_lcd_frame');
  fill(154,cy-3,6,6,activity[bus*2+1]?'live_lcd_control_fg':'live_lcd_frame');
  for(c=0;c<g.cols.length;c++){
   r=g.cols[c];x=g.left+c*g.cw;var selected=state[r.key]===bus;
   if(c===hoverCol)fill(x,y,g.cw-1,g.rh-1,'live_selection',.13);
   if(selected){connected++;var ink=bus===0?'live_control_text_zombie':r.clock?'live_lcd_control_fg':'live_value_arc';
    if(r.clock)fill(x+g.cw/2-5,cy-5,10,10,ink);else dot(x+g.cw/2,cy,5,ink);
    if(!active(r)){mgraphics.set_source_rgba(rgba('live_surface_bg',.50));mgraphics.rectangle(x+2,y+1,g.cw-4,g.rh-2);mgraphics.fill();}
   }else dot(x+g.cw/2,cy,1,'live_lcd_frame');
  }
 }
 for(c=0;c<=g.cols.length;c++){var split=c===0||c===g.cols.length||g.cols[c].tab!==g.cols[c-1].tab;line(g.left+c*g.cw-1,97,g.left+c*g.cw-1,g.bottom,split?'live_control_fg':'live_lcd_frame',split?.35:.2);}
 var message='One source per input. ZERO disconnects. NOTE and VEL are silent in the audio effect.';
 if(hoverCol>=0&&hoverCol<g.cols.length){r=g.cols[hoverCol];var source=hoverRow>=0&&hoverRow<g.rows.length?g.rows[hoverRow]:state[r.key];message=BUS[source]+'  →  '+r.label+'  |  Current: '+BUS[state[r.key]];if(!active(r))message+='  |  '+inactiveReason(r);else if(delays[r.key])message+='  |  Feedback delayed one sample';}
 else if(chosen)message=chosen;
 label(message,16,g.h-32,11);label('Routing edits use the same saved, automatable parameters as the device.',16,g.h-12,10);
}
function param(k,v){state[k]=Number(v);mgraphics.redraw();}
function routedelay(k,v){delays[k]=Number(v);mgraphics.redraw();}
function meters(){activity=arrayfromargs(arguments);mgraphics.redraw();}
function tab(){}function status(){}function matrix(){}
function onresize(){mgraphics.redraw();}onresize.local=1;
function onidle(x,y){var g=layout();hoverRow=y>=g.top&&y<g.bottom?Math.floor((y-g.top)/g.rh):-1;hoverCol=x>=g.left&&x<g.right?Math.floor((x-g.left)/g.cw):-1;mgraphics.redraw();}
function onidleout(){hoverRow=-1;hoverCol=-1;mgraphics.redraw();}
function onclick(x,y){
 if(y>=42&&y<64){if(x>=16&&x<208){filter=Math.min(2,Math.floor((x-16)/64));hoverCol=-1;}else if(x>=222&&x<338)usedOnly=!usedOnly;mgraphics.redraw();return;}
 var g=layout();if(x<g.left||x>=g.right||y<g.top||y>=g.bottom)return;
 var c=Math.floor((x-g.left)/g.cw),r=g.cols[c],bus=g.rows[Math.floor((y-g.top)/g.rh)];
 var next=state[r.key]===bus?0:bus;
 chosen=BUS[next]+'  →  '+r.label;
 outlet(0,'setroute',r.key,next);
}

function anything(){}
function getvalueof(){return ROUTES.map(function(r){return state[r.key];});}
