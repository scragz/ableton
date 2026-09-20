/* Vermiform control layer. TABLES is embedded by the build. Max JS ES5. */
autowatch=1;inlets=1;outlets=2;
var S={mode:1,speed:64,x:64,y:48,z:0,rate:0,depth:35,operation:0,stretch:0,armed:0,drone:0,output:-12,width:35,trigger:0};
var selected=TABLES.modes[0],lastSpeech=1,sourceMode=1,sequence=[],frameIndex=0,frameTicks=0,frameTime=0,wormTime=0,clockTime=0;
var textValue='the worm speaks',phoneList=[46,51,16,4],working={},walk=[],locked=false,frozen=false,notes=[],sustained={},pedal=false,notePitch=60,bendValue=0,velocity=.8,oneShot=false,gateOpen=false,triggerId=0,ready=false,switching=false;
var storedXYZ={x:64,y:48,z:0},pendingXYZ={},rng=17321,operations=['Jitter','Frame bleed','Bit rot','Loop lock','Order swap'];
var frameTask=new Task(tick,this),switchTask=new Task(commitMode,this),dirtyTask=new Task(storeState,this),flashTask=new Task(unflash,this);
var ACTIONS=['corrupt','clean','panic','triggerReset'];
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function rand(){rng=(Math.imul ? Math.imul(rng,1664525) : (rng*1664525)) + 1013904223; rng=rng>>>0;return rng/4294967296;}
function copy(a){return JSON.parse(JSON.stringify(a));}
function send(k,v){outlet(0,k,v);}
function obj(k){return this.patcher ? this.patcher.getnamed(k) : null;}
function ui(k){var o=obj(k);if(o){var args=arrayfromargs(arguments).slice(1);if(k=='textinput'&&args[0]=='set')args=['set'].concat(String(args[1]).split(' '));o.message.apply(o,args);}}
function status(s){outlet(1,'status',s);}
function param(k,v){if(S[k]===undefined)return;v=Number(v);if(!isFinite(v))return;
 if(k=='mode'){S.mode=Math.round(clamp(v,1,64));selectMode();return;}
 if(frozen&&(k=='x'||k=='y'||k=='z')&&S.mode<63){pendingXYZ[k]=v;return;}
 var old=S[k];S[k]=v;
 if(k=='trigger'){if(v>0 && old<=0)trigger();return;}
 if(k=='rate' && v===0)clean();
 if(k=='armed' && v && !old){gateOpen=false;oneShot=false;}
 // Switching Drone off is a full stop, same as the Stop button; switching it on re-reads the sequence.
 if(k=='drone'){if(v && !old){gateOpen=!S.armed;resequence();}else if(!v && old){panic();}}
 if((k=='x'||k=='y'||k=='z') && !frozen){editSequence(k);}
 if(k=='depth'&&v===0)clean();
 if(k=='output')send('output',v);
 if(k=='width')send('width',v/100);
 if(k=='stretch'||k=='speed')send('speed',clockRate());
 updateGate();publishFrame();labels();
}
function anything(){var a=arrayfromargs(arguments);if(S[messagename]!==undefined)param(messagename,a[0]);}
function setparam(k,v){ui(k,v);param(k,v);}
// Named clockRate, not speed: Max calls a JS function matching an incoming message name directly,
// so a function called speed() would intercept the Speed dial and anything() would never see it.
function clockRate(){var n=S.speed;return Math.pow(2,n<64?(n-64)*5/64:(n-64)*2/63)/(S.stretch?32:1);}
function corePick(n){n=Math.round(clamp(n,0,6));var starts=[1,22,29,37,47,50,63];setparam('mode',starts[n]);}
function subPick(n){var starts=[1,22,29,37,47,50,63],ends=[21,28,36,46,49,62,64];setparam('mode',clamp(starts[selected.core]+n,starts[selected.core],ends[selected.core]));}
function selectMode(){
 if(selected.core!=6&&S.mode>=63)storedXYZ={x:S.x,y:S.y,z:S.z};
 selected=TABLES.modes[S.mode-1];if(S.mode<63){lastSpeech=S.mode;sourceMode=S.mode;}else sourceMode=lastSpeech;
 frozen=false;locked=false;working={};walk=[];send('freeze',0);send('switchgate',0);switching=true;
 switchTask.cancel();switchTask.schedule(12);labels();
}
function commitMode(){send('speed',clockRate());send('compost',S.mode>=63?1:0);send('freeze',frozen?1:0);send('core',TABLES.modes[sourceMode-1].core);send('switchgate',1);send('output',S.output);send('width',S.width/100);switching=false;resequence();if(S.mode>=63){send('start',S.x/127);send('length',S.y/127);send('window',S.z/127);}publishFrame();updateGate();}
// The text field only feeds the TTS modes (7, 24, 30, 39, 40, and Compost recording one of them).
// Elsewhere it dims and ignores clicks. Colours come from Live's theme at the time of the mode change.
function themeColor(name,fallback){try{if(typeof max!=='undefined'&&max.getcolor){var c=max.getcolor(name);if(c&&c.length>=3)return [c[0],c[1],c[2],c.length>3?c[3]:1];}}catch(e){}return fallback;}
function textState(){var o=obj('textinput');if(!o)return;var on=source().type=='tts';
 o.message('ignoreclick',on?0:1);
 o.message('textcolor',on?themeColor('live_control_fg',[.85,.85,.85,1]):themeColor('live_lcd_title',[.75,.75,.75,1]).slice(0,3).concat([.45]));}
function labels(){textState();
 var starts=[1,22,29,37,47,50,63];ui('corepicker','set',selected.core);ui('subpicker','clear');
 for(var i=0;i<TABLES.modes.length;i++)if(TABLES.modes[i].core==selected.core)ui('subpicker','append',TABLES.modes[i].mode+'  '+TABLES.modes[i].name);
 ui('subpicker','set',S.mode-starts[selected.core]);
 outlet(1,'labels',S.mode,selected.name,selected.x,selected.y,selected.z,selected.type);
 outlet(1,'frozen',frozen?1:0);outlet(1,'worm',operations[Math.round(S.operation)]||operations[0],locked?1:0);
}
function phoneIndex(name){for(var i=0;i<TABLES.phones.length;i++)if(TABLES.phones[i].base==name)return i;return 0;}
function parseText(text){
 var out=[],words=String(text).toLowerCase().replace(/[^a-z0-9' ]/g,' ').split(/\s+/),digits=['zero','one','two','three','four','five','six','seven','eight','nine'];
 var pairs={th:'TH',sh:'SH',ch:'CH',ph:'F',ng:'NG',ee:'IY',oo:'UW',ou:'AW',ow:'OW',ai:'EY',ay:'EY',oi:'OY',oy:'OY',er:'ER',ar:'AA',or:'AO'};
 var letters={a:'AE',b:'B',c:'K',d:'D',e:'EH',f:'F',g:'G',h:'HH',i:'IH',j:'JH',k:'K',l:'L',m:'M',n:'N',o:'AO',p:'P',q:'K',r:'R',s:'S',t:'T',u:'AH',v:'V',w:'W',x:'K S',y:'Y',z:'Z'};
 for(var w=0;w<words.length;w++){
   var word=words[w];if(!word)continue;if(/^\d$/.test(word))word=digits[Number(word)];var pronunciation=TABLES.lexicon[word],phones=[];
   if(pronunciation)phones=pronunciation.split(' ');
   else for(var c=0;c<word.length;c++){var pair=word.substr(c,2);if(pairs[pair]){phones.push(pairs[pair]);c++;}else if(c==word.length-1&&word[c]=='e'&&word.length>3){}else if(letters[word[c]])phones=phones.concat(letters[word[c]].split(' '));}
   for(var p=0;p<phones.length;p++)out.push(phoneIndex(phones[p]));out.push(2);
 }
 return out.length?out.slice(0,512):[0];
}
function text(){var a=arrayfromargs(arguments);textValue=a.join(' ').slice(0,160);resequence();dirty();}
function speak(){var field=obj('textinput');if(field)field.message('bang');trigger();}
function source(){return TABLES.modes[sourceMode-1];}
function resequence(){var C=S.mode>=63?storedXYZ:S;
 var m=source(),z=Math.round(C.z/127*63),bank=Math.min(3,Math.floor(C.y/128*4));
 if(m.type=='tts')sequence=parseText(textValue);
 else if(m.type=='list')sequence=phoneList.slice();
 else if(m.type=='phoneme'||m.source=='phoneme')sequence=[z];
 else {
   if(m.y!='Bank')bank=(m.mode==31||m.mode==33||m.mode==34)?3:(m.core+Math.floor((m.mode-1)/3))%4;
   var words=TABLES.phrases[bank],phrase=words[Math.min(7,Math.floor(C.z/128*8))];sequence=parseText(phrase);outlet(1,'phrase',phrase);
 }
 if(m.type=='tts')outlet(1,'phrase',textValue);if(m.type=='phoneme')outlet(1,'phrase',TABLES.phones[z].name);
 if(m.type=='list')outlet(1,'phrase','phoneme list');
 frameIndex=0;frameTicks=0;frameTime=0;
}
function editSequence(k){
 if(S.mode>=63){send('start',S.x/127);send('length',S.y/127);send('window',S.z/127);return;}
 var m=selected;
 if(m.type=='tts'&&k=='z'){
  var pos=Math.floor(S.y/127*31),alphabet=' abcdefghijklmnopqrstuvwxyz.,?!',letter=alphabet.charAt(Math.floor(S.z/128*alphabet.length));
  while(textValue.length<=pos)textValue+=' ';textValue=textValue.slice(0,pos)+letter+textValue.slice(pos+1);ui('textinput','set',textValue);dirty();resequence();
 }else if(m.type=='list'&&k=='z'){
  var index=Math.floor((m.x=='Position'?S.x:S.y)/128*16);while(phoneList.length<=index)phoneList.push(0);phoneList[index]=Math.round(S.z/127*63);dirty();resequence();
 }else if(k=='z'||(k=='y'&&m.y=='Bank'))resequence();
}
function duration(){var C=S.mode>=63?storedXYZ:S;var m=source(),v=m.x=='Length'?C.x:m.z=='Length'?C.z:(m.y=='Length'?C.y:48);return Math.pow(2,(v-48)/32);}
function getFrame(index){
 var id=sequence[index%sequence.length]||0,key=sourceMode+':'+id;
 return working[key]?copy(working[key]):copy(TABLES.phones[id]);
}
function modifyFrame(f){var C=S.mode>=63?storedXYZ:S;
 var m=source(),reg=Math.min(9,Math.floor(C.x/128*10)),amount=C.y/127,mode=m.mode;
 if(m.type=='raw'){
  if(mode<=10){var q=mode==8?8:mode==9?16:32;f.k[reg]=Math.round((amount*1.9-.95)*q)/q;}
  else if(mode==35){if(reg<5)f.f[reg]=120+amount*3400;else f.bw[reg-5]=25+amount*1200;}
  else if(mode==45){if(reg<5)f.f[reg]=100+amount*3500;else if(reg<8)f.bw[reg-5]=25+amount*900;else if(reg==8)f.quant=2+Math.round(amount*30);else f.pitch=.25+amount*3;}
  else if(mode==59){if(reg<5)f.bw[reg]=20+amount*1100;else f.pitch=.2+amount*5;}
 }
 if(mode>=11&&mode<=21){
  var b=m.bend;
  if(b<=3){f.k[reg]=clamp(f.k[reg]+Math.sin(frameIndex*1.7+reg)*amount*.7,-.97,.97);}
  if(b>=4&&b<=6||b>=9)f.pitch*=Math.pow(2,(Math.round(f.pitch*(4+reg))-4)*amount*.3);
  if(b>=7){f.k[reg]=Math.round(f.k[reg]*(2+Math.floor((1-amount)*30)))/(2+Math.floor((1-amount)*30));}
  if(b==3||b==6||b==11)f.energy*=.25+(1-amount)*.75;
 }
 if(mode==28){f.pitch*=.4+amount*3;f.f[reg%5]*=.5+amount*1.5;}
 if(mode==33||mode==34){f.f[reg%5]*=1+amount*1.7;f.bw[reg%5]=Math.max(20,f.bw[reg%5]*(1-amount*.85));}
 if(mode==46){f.f[reg%5]=Math.round(f.f[reg%5]/(25+amount*600))*(25+amount*600);}
 if(mode==60){f.f[0]*=.65+C.y/127*.7;f.f[1]*=1.2-C.y/127*.4;}
 for(var i=0;i<10;i++)f.k[i]=clamp(f.k[i],-.985,.985);
 for(var j=0;j<5;j++){f.f[j]=clamp(f.f[j],80,3750);f.bw[j]=clamp(f.bw[j],20,1500);}
 return f;
}
// Pitch knob: 64 = 120 Hz. Down 7 octaves to ~0.94 Hz (single glottal clicks ringing the filter),
// up 4 octaves to ~1.9 kHz. Hard limits sit under the 8 kHz voice clock's Nyquist.
var PITCH_MIN=.5,PITCH_MAX=3800;
function pitchCurve(n){return n<64?Math.pow(2,(n-64)*7/64):Math.pow(2,(n-64)*4/63);}
function publishFrame(){var C=S.mode>=63?storedXYZ:S;
 if(!sequence.length||switching)return;
 var m=source(),f=modifyFrame(getFrame(frameIndex)),id=sequence[frameIndex%sequence.length]||0;
 // Mid-phoneme intonation and stop closures retain a speech gesture at slow speeds.
 var progress=frameTicks/Math.max(1,f.duration),intonation=m.absolute?1:1+.06*Math.sin(frameIndex*.8)-progress*.055;
 var pitchControl=m.x=='Pitch'?C.x:m.z=='Pitch'?C.z:64;
 var pitch=120*pitchCurve(pitchControl)*Math.pow(2,(notePitch-60+bendValue)/12)*f.pitch*intonation;
 send('pitch',clamp(pitch,PITCH_MIN,PITCH_MAX));send('voiced',f.voiced);send('energy',f.energy);
 send('phone',f.segment===undefined?id:f.segment);send('nasal',/^(M|N|NG|ER)$/.test(f.base)? .65 : (m.mode==57||m.mode==58?.35:0));
 send('parallel',m.mode>=54&&m.mode<=58?1:0);
 send('quant',f.quant|| (m.core==3?(m.mode==45?2+Math.round(C.y/127*30):16):256));
 send('drive',m.mode==33||m.mode==34?1+C.y/127*14:1);
 send('bits',m.bits|| (m.core==3?7:16));
 send('rot',clamp((f.rot||0)+(m.mode==49?C.y/127:0),0,1));send('rotindex',Math.floor(C.x/128*8));
 for(var k=0;k<10;k++)send('k'+(k+1),f.k[k]);
 for(var j=0;j<5;j++){send('f'+(j+1),f.f[j]);send('b'+(j+1),f.bw[j]);}
 outlet(1,'phoneme',f.name,frameIndex,sequence.length);
}
function tick(){
 if(!ready||switching)return;
 // Fixed short task interval with fractional accumulation preserves very slow clocks.
 var step=5;clockTime+=step;frameTime+=step*clockRate();wormTime+=step;
 if(S.rate>0 && wormTime>=1000/(.1*Math.pow(200,S.rate/100))){wormTime=0;corrupt();}
 if(frameTime>=25*duration()){
  frameTime-=25*duration();frameTicks++;
  var f=getFrame(frameIndex);
  if(frameTicks>=f.duration){frameTicks=0;if(!locked){frameIndex++;if(frameIndex>=sequence.length){frameIndex=0;if(oneShot){oneShot=false;gateOpen=false;updateGate();}}}}
  publishFrame();
 }
}
function corrupt(){
 if(!sequence.length)return;
 var depth=S.depth/100;if(depth<=0){clean();return;}
 var op=Math.round(S.operation),id=sequence[frameIndex%sequence.length]||0,key=sourceMode+':'+id,f=getFrame(frameIndex),n=Math.max(1,Math.round(depth*10));
 if(op==0){for(var i=0;i<10;i++){walk[i]=clamp((walk[i]||0)*.85+(rand()-.5)*depth*.18,-.4,.4);f.k[i]+=walk[i];if(i<5)f.f[i]*=1+walk[i]*.8;}}
 if(op==1){var other=TABLES.phones[Math.floor(rand()*64)];for(var j=0;j<n;j++){var at=Math.floor(rand()*10);f.k[at]=other.k[at];if(at<5)f.f[at]=other.f[at];}}
 if(op==2){for(var k=0;k<n;k++){var at2=Math.floor(rand()*10),bit=Math.floor(rand()*(3+depth*10));var encoded=Math.round((f.k[at2]+1)*16383);f.k[at2]=((encoded^(1<<bit))&32767)/16383-1;if(at2<5)f.f[at2]=80+((Math.round(f.f[at2])^(1<<Math.floor(3+depth*8)))%3600);}}
 if(op==3){locked=!locked;}
 if(op==4){for(var h=0;h<n;h++){var a=Math.floor(rand()*10),b=Math.floor(rand()*10),tmp=f.k[a];f.k[a]=f.k[b];f.k[b]=tmp;}f.f.reverse();f.bw.reverse();}
 for(var t=0;t<10;t++)f.k[t]=clamp(f.k[t],-.985,.985);
 for(var q=0;q<5;q++)f.f[q]=clamp(f.f[q],80,3750);
 if(source().core==4){if(op==0)f.pitch=clamp(f.pitch+(rand()-.5)*depth,.25,3);if(op==1)f.segment=Math.floor(rand()*64);if(op==2)f.rot=depth;if(op==4){f.segment=63-id;f.rot=depth*.5;}}
 working[key]=f;publishFrame();outlet(1,'decay',depth);outlet(1,'worm',operations[op],locked?1:0);
}
function clean(){working={};walk=[];locked=false;wormTime=0;publishFrame();outlet(1,'decay',0);outlet(1,'worm',operations[Math.round(S.operation)],0);}
function trigger(){
 if(selected.freeze){frozen=!frozen;if(!frozen){for(var k in pendingXYZ)S[k]=pendingXYZ[k];pendingXYZ={};}send('freeze',S.mode==64&&frozen?1:0);labels();}
 else {frameIndex=0;frameTicks=0;frameTime=0;send('triggerid',++triggerId);}
 gateOpen=true;oneShot=!S.drone && notes.length===0;publishFrame();updateGate();
}
function updateGate(){send('gate',(S.drone&&(!S.armed||gateOpen))||notes.length>0||gateOpen?1:0);send('velocity',notes.length?velocity:.8);}
function note(p,v){p=Math.round(p);v=Math.round(v);var i;
 if(v>0){for(i=notes.length-1;i>=0;i--)if(notes[i]==p)notes.splice(i,1);notes.push(p);delete sustained[p];notePitch=p;velocity=v/127;oneShot=false;trigger();}
 else {if(pedal)sustained[p]=true;else for(i=notes.length-1;i>=0;i--)if(notes[i]==p)notes.splice(i,1);if(notes.length)notePitch=notes[notes.length-1];else {gateOpen=false;oneShot=false;}updateGate();publishFrame();}
}
function cc(v,n){if(n==64){pedal=v>=64;if(!pedal){for(var p in sustained){for(var i=notes.length-1;i>=0;i--)if(notes[i]==p)notes.splice(i,1);}sustained={};if(!notes.length)gateOpen=false;else notePitch=notes[notes.length-1];updateGate();publishFrame();}}if(n==120||n==123)allNotesOff();}
function bend(v){bendValue=(v-8192)/8192*2;publishFrame();}
function panic(){notes=[];sustained={};pedal=false;gateOpen=false;oneShot=false;S.drone=0;ui('drone','set',0);send('gate',0);clean();}
// Live sends all-notes-off (CC 120/123) when the transport or a clip stops. That releases held notes
// but must not cancel Drone, which stays on until it is switched off or Stop is pressed.
function allNotesOff(){notes=[];sustained={};pedal=false;if(!S.drone){gateOpen=false;oneShot=false;}updateGate();publishFrame();}
// Action buttons are live.text toggles so Live's theme draws them lit while pressed; JS unlights them
// shortly after, and dispatches here so an auto-corrupt from Rate never flashes the Corrupt button.
function action(k){flashTask.cancel();flashTask.schedule(120);
 if(k=='corrupt')corrupt();else if(k=='clean')clean();else if(k=='panic')panic();else if(k=='trigger')trigger();}
function unflash(){for(var i=0;i<ACTIONS.length;i++)ui(ACTIONS[i],'set',0);}
function dirty(){dirtyTask.cancel();dirtyTask.schedule(100);}
function storeState(){var state=JSON.stringify({text:textValue,list:phoneList});ui('memory','set',state);}
function restore(){var raw=arrayfromargs(arguments).join(' ');try{var d=JSON.parse(raw);if(typeof d.text=='string')textValue=d.text.slice(0,160);if(d.list&&d.list.length)phoneList=d.list.slice(0,16);ui('textinput','set',textValue);resequence();}catch(e){}}
function init(){if(ready)return;ready=true;ui('textinput','set',textValue);selectMode();frameTask.interval=5;frameTask.repeat();}
function loadbang(){init();}
function notifydeleted(){frameTask.cancel();switchTask.cancel();dirtyTask.cancel();flashTask.cancel();}
