// This script is concatenated with schema and pure library by build.py.
autowatch=1;inlets=1;outlets=2;
var params={},stateBuffer=null,exchange=null,tableBuffer=null,matrixBuffer=null,meterBuffer=null;
var slots=[null,null],customMatrix=[1,2,4,8,16,32,64,128],userTables=[],mappingPaths=['','','',''];
var pending=null,ready=false,request=1,selectedTab='ADC1',armed=0,observer=null,lastGood=Array(320).fill(0);
var timer=new Task(tick,this),saveTimer=new Task(markDirty,this),mapTask=new Task(finishMapping,this),statusText='';
SCHEMA.forEach(function(p){params[p.key]=p.default;});
for(var u=0;u<8;u++){userTables[u]=[];for(var j=0;j<256;j++)userTables[u].push(j);}
function send(k,v){outlet(0,k,v);}
function view(){outlet(1,arrayfromargs(arguments));}
function bind(st,ex,tb,mt,me){stateBuffer=new Buffer(st);exchange=new Buffer(ex);tableBuffer=new Buffer(tb);matrixBuffer=new Buffer(mt);meterBuffer=new Buffer(me);initialize();}
function initialize(){if(!exchange)return;send('ready',0);var all=Materia.tables();tableBuffer.poke(1,0,all);writeUsers();updateMatrix();Object.keys(params).forEach(function(k){send(k,params[k]);});graph();clockDiv();if(pending){applyState(pending);pending=null;}ready=true;send('ready',1);tab(selectedTab);timer.interval=50;timer.repeat();saveTimer.interval=250;saveTimer.repeat();}
function init(){if(!exchange)return;setupAPI();}
function setupAPI(){try{observer=new LiveAPI(function(a){if(armed && a[0]==='selected_parameter')mapTask.schedule(0);},'live_set view');observer.property='selected_parameter';restoreMappings();}catch(e){status('Mapping available in Live');}}
function anything(){var a=arrayfromargs(arguments),k=messagename;if(params.hasOwnProperty(k)){params[k]=Number(a[0]);send(k,params[k]);if(/_(src|gate|a|b|bus|sync|mode)$/.test(k))graph();if(k==='m_preset'||k==='m_seed')updateMatrix();if(k==='tclk_div')clockDiv();view('param',k,params[k]);notifyclients();return;} }
function graph(){var f=Materia.delays(params);Object.keys(f).forEach(function(k){send('delay_'+k,f[k]);view('routedelay',k,f[k]);});view('delays',Object.keys(f).filter(function(k){return f[k];}).length);}
function clockDiv(){var beats=[.0625,.125,.25,.5,1,2,4,8,16,32][Math.floor(params.tclk_div)];var o=this.patcher.getnamed('clockphase');if(o)o.message(beats*480,'ticks');}
function transport(v){send('playing',v);}
function updateMatrix(){var a=params.m_preset===5?customMatrix:Materia.matrix(params.m_preset,Math.floor(params.m_seed));if(matrixBuffer)matrixBuffer.poke(1,0,a);view.apply(this,['matrix'].concat(a));}
function matrixcell(row,col){row=Math.floor(row);col=Math.floor(col);if(row<0||row>7||col<0||col>7)return;if(params.m_preset!==5)customMatrix=Materia.matrix(params.m_preset,params.m_seed);customMatrix[row]^=1<<col;this.patcher.getnamed('m_preset').message(5);params.m_preset=5;updateMatrix();notifyclients();}
function writeUsers(){if(tableBuffer)for(var i=0;i<8;i++)tableBuffer.poke(1,167936+i*256,userTables[i]);}
function drawpoint(table,index,value){table=Math.max(0,Math.min(7,Math.floor(table)));index=Math.max(0,Math.min(255,Math.floor(index)));value=Math.max(0,Math.min(255,Math.floor(value)));userTables[table][index]=value;if(tableBuffer)tableBuffer.poke(1,167936+table*256+index,value);notifyclients();}
function importtable(path){try{var f=new File(path,'read');if(!f.isopen)throw Error('Cannot read file');var raw='';while(f.position<f.eof)raw+=f.readline()+' ';f.close();var a=raw.trim()[0]==='['?JSON.parse(raw):raw.trim().split(/[\s,;]+/).map(Number);if(a.length!==256||a.some(function(v){return !isFinite(v);}))throw Error('Expected exactly 256 numeric values');var t=Math.min(7,Math.floor(params.j_table));userTables[t]=a.map(function(v){return Math.max(0,Math.min(255,Math.round(v)));});writeUsers();notifyclients();status('User table imported');}catch(e){status(String(e));}}
function coherent(){if(!exchange)return lastGood.slice();for(var tries=0;tries<8;tries++){var seq=exchange.peek(1,3),base=2048+(seq%2)*320;var data=exchange.peek(1,base,320);if(seq===exchange.peek(1,3)){lastGood=Array.prototype.slice.call(data);return lastGood.slice();}}return lastGood.slice();}
function restoreState(s){if(!exchange||!s||s.length!==320)return;exchange.poke(1,32,s);send('restore_request',++request);lastGood=s.slice();}
function getvalueof(){return JSON.stringify({version:2,state:coherent(),slots:slots,matrix:customMatrix,user:userTables,mappings:mappingPaths});}
function setvalueof(v){try{var data=typeof v==='string'?JSON.parse(v):JSON.parse(arrayfromargs(arguments).join(' '));if(!data||data.version!==2||!data.state||data.state.length!==320)return;if(!exchange){pending=data;return;}applyState(data);}catch(e){status('State restore failed: '+e);}}
function applyState(d){slots=d.slots||[null,null];customMatrix=d.matrix||customMatrix;userTables=d.user||userTables;mappingPaths=d.mappings||mappingPaths;writeUsers();updateMatrix();uploadSlots();restoreState(Materia.clearState(d.state,Math.floor(params.load_mode)));restoreMappings();}
function uploadSlots(){if(!exchange)return;for(var n=0;n<2;n++){if(slots[n])exchange.poke(1,1024+n*320,slots[n]);exchange.poke(1,5+n,slots[n]?1:0);}}
function store(n){n=Math.floor(n)-1;if(n<0||n>1)return;slots[n]=coherent();uploadSlots();notifyclients();status('Stored S'+(n+1));}
function recall(n){n=Math.floor(n)-1;if(n<0||n>1||!slots[n]){status('Slot empty');return;}restoreState(slots[n]);notifyclients();status('Recalled S'+(n+1));}
function clearconfirmed(which){if(which==='all')restoreState(Array(320).fill(0));else send('clear'+which,++request);notifyclients();status(which==='all'?'Machine cleared':'Rostock '+which+' cleared');}
function markDirty(){if(ready)notifyclients();}
function tab(name){selectedTab=String(name);SCHEMA.forEach(function(p){var o=this.patcher.getnamed(p.key),label=this.patcher.getnamed('label_'+p.key);var vis=p.tab===selectedTab || ['da_src','db_src','da_gain','db_gain'].indexOf(p.key)>=0;o.message('hidden',vis?0:1);if(label)label.message('hidden',vis?0:1);},this);
 ['matrixgrid','tableedit','importbutton','store1','store2','recall1','recall2','clearall','clearros1','clearros2','map1','map2','map3','map4','unmap1','unmap2','unmap3','unmap4'].forEach(function(k){var o=this.patcher.getnamed(k);if(!o)return;var show=(k==='matrixgrid'&&name==='MTX')||((k==='tableedit'||k==='importbutton')&&name==='JEN')||(/^(store|recall|clearall)/.test(k)&&name==='STATE')||(k==='clearros1'&&name==='ROS1')||(k==='clearros2'&&name==='ROS2')||(/^(map|unmap)/.test(k)&&name==='TAP'+k.slice(-1));o.message('hidden',show?0:1);},this);view('tab',name);}
function tick(){if(!meterBuffer)return;view.apply(this,['meters'].concat(Array.prototype.slice.call(meterBuffer.peek(1,0,47))));if(selectedTab==='JEN'){var t=Math.min(Math.floor(params.j_table),Materia.counts[params.j_family]-1);var a=tableBuffer.peek(1,Materia.offsets[params.j_family]+t*256,256);this.patcher.getnamed('tableedit').message.apply(this.patcher.getnamed('tableedit'),['values'].concat(Array.prototype.slice.call(a)));} }
function status(s){statusText=s;view('status',s);}
function map(n){armed=Number(n);status('Select the parameter to map Tap '+n);}
function finishMapping(){if(!armed||!observer)return;try{var ids=observer.get('selected_parameter'),id=Number(ids[ids.length-1]);if(!id)return;var target=new LiveAPI(null,'id '+id),parent=new LiveAPI(null,'id '+id);parent.goto('canonical_parent');var self=new LiveAPI(null,'this_device');if(Number(parent.id)===Number(self.id)){status('Choose a parameter on another device');return;}mappingPaths[armed-1]=String(target.unquotedpath);this.patcher.getnamed('remote'+armed).message('id',id);status('Tap '+armed+' → '+target.get('name'));armed=0;notifyclients();}catch(e){status('Mapping failed: '+e);}}
function unmap(n){this.patcher.getnamed('remote'+n).message('id',0);mappingPaths[n-1]='';armed=0;notifyclients();status('Tap '+n+' unmapped');}
function restoreMappings(){for(var n=1;n<=4;n++){if(!mappingPaths[n-1])continue;try{var t=new LiveAPI(null,mappingPaths[n-1]);this.patcher.getnamed('remote'+n).message('id',Number(t.id));}catch(e){status('Re-map Tap '+n);}}}
function notifydeleted(){timer.cancel();saveTimer.cancel();mapTask.cancel();}

// Matrix edits enter through live.menu so save, automation, and the panel agree.
function setroute(key,value){
 var p=SCHEMA.filter(function(p){return p.key===String(key)&&p.enum&&p.enum.length===22;})[0];
 value=Number(value);if(!p||!isFinite(value)||value<0||value>21||Math.floor(value)!==value)return;
 this.patcher.getnamed(p.key).message(value);
}
function openrouting(){
 Object.keys(params).forEach(function(k){view('param',k,params[k]);});graph();
 this.patcher.getnamed('routing').message('front');
}
