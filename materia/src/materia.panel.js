autowatch=1;inlets=1;outlets=1;mgraphics.init();mgraphics.relative_coords=0;mgraphics.autofill=0;
var tabs=['ADC1','ADC2','BER','ERF1','ERF2','LP1','LP2','GER','JEN','ROS1','ROS2','PZ','MTX','TAP1','TAP2','TAP3','TAP4','STATE','DAC A','DAC B'];
var names=['ZERO','CONST','ADC1','ADC2','BER','ERF1','ERF2','LP1','LP2','GER','JEN','ROS1','ROS2','PZ.1','PZ.2','MTX','TCLK','ICLK','E1.OVF','E2.OVF','NOTE','VEL'];
var current='ADC1',data=[],delayed=0,msg='',p={};
function color(k){return max.getcolor(k);}
function ink(k){mgraphics.set_source_rgba(color(k));}
function rect(x,y,w,h,k){ink(k);mgraphics.rectangle(x,y,w,h);mgraphics.fill();}
function text(s,x,y,size,k){ink(k||'live_control_fg');mgraphics.select_font_face('Arial');mgraphics.set_font_size(size||10);mgraphics.move_to(x,y);mgraphics.show_text(s);}
function paint(){
 rect(0,0,1360,169,'live_surface_bg');rect(0,0,280,169,'live_lcd_bg');rect(1180,4,1,161,'live_contrast_frame');for(var i=0;i<22;i++){var col=Math.floor(i/11),row=i%11,x=8+col*137,y=9+row*14;text(names[i],x,y+8,9,'live_lcd_title');for(var b=0;b<8;b++)rect(x+43+b*9,y,7,9,(Math.floor((data[i*2]||0)/Math.pow(2,7-b))%2)?'live_value_arc':'live_lcd_frame');rect(x+119,y,7,9,data[i*2+1]?'live_value_arc':'live_lcd_frame');}
 tabs.forEach(function(t,i){var x=290+(i%10)*88,y=5+Math.floor(i/10)*22;rect(x,y,84,18,t===current?'live_control_selection':'live_control_bg');text(t,x+6,y+12,9,t===current?'live_control_fg_on':'live_control_fg');});
 text(current==='BER'&&data[45]?'STEP clock at sample-rate limit · lower Frequency or use CYCLE':current==='GER'?'Lit bits pass in AND mode':current==='LP1'||current==='LP2'?'Lit bits flip the input':current==='STATE'?'State includes pipelines, phase and random generators':current==='MTX'?'Rows = output bits · columns = input bits':current==='JEN'?'Draw in a User table, or import 256 values':'',294,159,9);
 text(data[44]?'RACE':'SETTLED',1190,110,9,data[44]?'live_value_bar_two':'live_control_fg');text(delayed+' delayed · 1×',1260,110,8);text(msg.substring(0,84),294,169-1,8);
 // Live byte strips beside each currently visible source selector.
 if(typeof SCHEMA!=='undefined')SCHEMA.forEach(function(q){if(q.enum&&q.enum.length===22&&(q.tab===current||q.key==='da_src'||q.key==='db_src')){var r=q.rect,byte=data[(p[q.key]===undefined?q.default:p[q.key])*2]||0;for(var b=0;b<8;b++)rect(r[0]+r[2]-40+b*5,r[1]-7,3,3,((byte>>b)&1)?'live_value_arc':'live_lcd_frame');}});
}
function meters(){data=arrayfromargs(arguments);mgraphics.redraw();}
function tab(t){current=t;mgraphics.redraw();}
function delays(n){delayed=n;mgraphics.redraw();}
function status(){msg=arrayfromargs(arguments).join(' ');mgraphics.redraw();}
function param(k,v){p[k]=v;mgraphics.redraw();}
function matrix(){var o=this.patcher.getnamed('matrixgrid');o.message.apply(o,['values'].concat(arrayfromargs(arguments)));}
function onclick(x,y){if(x>=290&&x<1170&&y<49){var i=Math.floor((x-290)/88)+(y>=27?10:0);if(tabs[i])outlet(0,'tab',tabs[i]);}else if(x<280&&y>=7){var i=Math.floor((x-8)/137)*11+Math.floor((y-9)/14);var t=names[i];if(t==='PZ.1'||t==='PZ.2')t='PZ';if(tabs.indexOf(t)>=0)outlet(0,'tab',t);}}

function routedelay(){}
