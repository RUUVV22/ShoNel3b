'use strict';
const {STATUS}=require('../game/constants');
const {GameError}=require('../game/errors');

const metadata={id:'MEN_WARAHA',title:'مين وراها',englishTitle:'WHO DID IT?',subtitle:'سر الحارة',description:'حققوا بسر صندوق أمانة الحارة: مين أخذه، من وين، وبأي غرض؟ تحرّك بنردين واكشف الأدلة.',englishDescription:'Investigate a missing neighborhood treasure: who took it, where, and with what item? Roll two dice and uncover evidence.',minPlayers:3,maxPlayers:6};
const suspects=[
 {id:'SALIM',name:'سالم',englishName:'Salim',color:'#B94B3E',role:'بائع التحف'},
 {id:'ZAINAB',name:'زينب',englishName:'Zainab',color:'#65458B',role:'صانعة الفوانيس'},
 {id:'NABIL',name:'نبيل',englishName:'Nabil',color:'#397B79',role:'الخبّاز'},
 {id:'HIND',name:'هند',englishName:'Hind',color:'#DA8C33',role:'حكواتية الحارة'},
 {id:'OM_YAZAN',name:'أم يزن',englishName:'Um Yazan',color:'#A34E71',role:'جارة الجميع'},
 {id:'FARIS',name:'فارس',englishName:'Faris',color:'#5A6640',role:'صاحب الورشة'},
];
const locations=[
 {id:'HAMMAM',name:'حمّام الحارة',englishName:'Neighborhood Hammam',x:3,y:2,symbol:'♨️'},
 {id:'DUKKAN',name:'دكّان الحارة',englishName:'Corner Shop',x:7,y:2,symbol:'🧺'},
 {id:'CAFE',name:'مقهى الحارة',englishName:'Tea Café',x:11,y:2,symbol:'☕'},
 {id:'SQUARE',name:'ساحة الحارة',englishName:'Village Square',x:3,y:6,symbol:'⛲'},
 {id:'MUKHTAR',name:'بيت المختار',englishName:'Mukhtar House',x:7,y:6,symbol:'🏠'},
 {id:'BAKERY',name:'الفرن',englishName:'Bakery',x:11,y:6,symbol:'🥖'},
 {id:'BARBER',name:'محل الحلاق',englishName:'Barber Shop',x:3,y:10,symbol:'✂️'},
 {id:'CARPENTER',name:'ورشة النجّار',englishName:'Carpenter Workshop',x:7,y:10,symbol:'🪚'},
 {id:'ROOFTOP',name:'سطح أحد البيوت',englishName:'Rooftop',x:11,y:10,symbol:'🌙'},
];
const items=[
 {id:'LANTERN',name:'فانوس قديم',englishName:'Old Lantern',symbol:'🏮'},
 {id:'KEY',name:'مفتاح نحاسي',englishName:'Brass Key',symbol:'🗝️'},
 {id:'HAMMER',name:'مطرقة نجّار',englishName:'Carpenter Hammer',symbol:'🔨'},
 {id:'ROPE',name:'حبل غسيل',englishName:'Clothesline Rope',symbol:'🪢'},
 {id:'JUG',name:'إبريق نحاسي',englishName:'Copper Jug',symbol:'🫖'},
 {id:'SCISSORS',name:'مقص حلاق',englishName:'Barber Scissors',symbol:'✂️'},
];
const cards={
 suspects:suspects.map(s=>({id:'S:'+s.id,name:s.name,englishName:s.englishName,kind:'suspect'})),
 locations:locations.map(s=>({id:'L:'+s.id,name:s.name,englishName:s.englishName,kind:'location'})),
 items:items.map(s=>({id:'I:'+s.id,name:s.name,englishName:s.englishName,kind:'item'})),
};
const allCards=[...cards.suspects,...cards.locations,...cards.items];
const cardMap=Object.fromEntries(allCards.map(c=>[c.id,c]));
const squares=new Set();
for(const y of [3,7,11])for(let x=1;x<=11;x++)squares.add(x+','+y);
for(const x of [2,6,10])for(let y=3;y<=11;y++)squares.add(x+','+y);
const doors=Object.fromEntries(locations.map(l=>[l.x+','+l.y,l.id]));
const startTiles=[[1,3],[5,3],[9,3],[1,7],[5,7],[9,7]];
const key=(x,y)=>x+','+y;
const parse=k=>k.split(',').map(Number);
function neighbors(tile){
 const [x,y]=parse(tile);
 return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]
  .map(([a,b])=>key(a,b)).filter(k=>squares.has(k)||doors[k]);
}
function paths(from){
 // A location is a terminal node: crossing through one is not allowed.
 const paths=new Map([[from,[from]]]);
 const queue=[from];
 for(let i=0;i<queue.length;i++){
   const here=queue[i];
   if(here!==from && doors[here])continue;
   for(const next of neighbors(here)){
     if(paths.has(next))continue;
     paths.set(next,[...paths.get(here),next]);
     queue.push(next);
   }
 }
 return paths;
}
function shuffle(input,random=Math.random){
 const values=[...input];
 for(let i=values.length-1;i>0;i--){
   const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));
   [values[i],values[j]]=[values[j],values[i]];
 }
 return values;
}
const canStart=room=>{
 const ps=room.players.filter(p=>p.connected);
 const choices=ps.map(p=>p.mysteryCharacter);
 return ps.length>=3&&ps.length<=6&&choices.every(c=>suspects.some(s=>s.id===c))&&new Set(choices).size===ps.length;
};
function createSession(round,random=Math.random,room){
 const players=room.players.filter(p=>p.connected);
 if(!canStart(room))throw new GameError('NOT_READY');
 const solution=[cards.suspects,cards.locations,cards.items].map(group=>group[Math.floor(random()*group.length)].id);
 const deck=shuffle(allCards.map(c=>c.id).filter(id=>!solution.includes(id)),random);
 const hands=Object.fromEntries(players.map(p=>[p.id,[]]));
 deck.forEach((card,i)=>hands[players[i%players.length].id].push(card));
 const playerIds=players.map(p=>p.id);
 const positions=Object.fromEntries(players.map((p,i)=>[p.id,key(...startTiles[suspects.findIndex(s=>s.id===p.mysteryCharacter)])]));
 const notes=Object.fromEntries(players.map(p=>[p.id,{}]));
 return {status:STATUS.ACTIVE,round,phase:'ROLL',turn:0,turnsTaken:0,players:playerIds,
  characters:Object.fromEntries(players.map(p=>[p.id,p.mysteryCharacter])),positions,hands,solution,
  dice:null,allowance:null,preview:null,lastMove:null,suggestion:null,pendingResponder:null,disproofCard:null,
  revealedTo:Object.fromEntries(playerIds.map(id=>[id,[]])),notebooks:notes,canAccuse:Object.fromEntries(playerIds.map(id=>[id,true])),
  winnerId:null,log:[{type:'start',text:'اختفى صندوق أمانة الحارة ليلة مهرجان الفوانيس! مين أخذه، من وين، وبأي غرض؟',en:'The neighborhood trust chest vanished during the Lantern Festival! Who took it, where, and with what item?'}],
  lastActivity:Date.now()};
}
function turnId(s){return s.players[s.turn%s.players.length];}
function assertTurn(s,player){if(turnId(s)!==player.id)throw new GameError('NOT_YOUR_TURN');}
function evidenceMatching(s,responder){
 const proposed=s.suggestion;
 return (s.hands[responder]||[]).filter(id=>[proposed.suspect,proposed.location,proposed.item].includes(id));
}
function findResponder(s){
 const index=s.players.indexOf(turnId(s));
 for(let i=1;i<s.players.length;i++){
   const id=s.players[(index+i)%s.players.length];
   if(evidenceMatching(s,id).length)return id;
 }
 return null;
}
function publicly(s,type,text,en){
 s.log.push({type,text,en:en||text,turn:s.turnsTaken+1});
 if(s.log.length>45)s.log.shift();
}
function endTurn(s){
 let attempts=0;
 while(attempts<s.players.length){
  s.turn=(s.turn+1)%s.players.length;
  s.turnsTaken++;
  if(s.canAccuse[turnId(s)])break;
  attempts++;
 }
 s.phase='ROLL';s.dice=null;s.allowance=null;s.preview=null;s.lastMove=null;
 s.suggestion=null;s.pendingResponder=null;s.disproofCard=null;s.lastActivity=Date.now();
}
function checkNoAccusers(s){
 if(s.players.every(id=>!s.canAccuse[id])){
  s.status=STATUS.FINISHED;s.phase='RESULT';s.winnerId=null;
  publicly(s,'finish','لم يعد هناك محقق يستطيع الاتهام؛ انكشفت الحقيقة للجميع.','All investigators lost their right to accuse. The solution is revealed.');
  return true;
 }
 return false;
}
function ensureId(card,kind){
 if(!cardMap[card]||cardMap[card].kind!==kind)throw new GameError('INVALID_CARD');
}
function roll(s,player,random){
 assertTurn(s,player);
 if(s.phase!=='ROLL')throw new GameError('INVALID_GAME_ACTION');
 const d1=1+Math.floor(random()*6),d2=1+Math.floor(random()*6);
 s.dice=[d1,d2];s.allowance=d1+d2;s.phase='MOVE';s.preview=null;
 publicly(s,'roll','رَمى '+player.name+' النردين: '+d1+' + '+d2+' = '+(d1+d2),player.name+' rolled '+d1+' + '+d2+' = '+(d1+d2));
}
function preview(s,player,destination){
 assertTurn(s,player);
 if(s.phase!=='MOVE')throw new GameError('INVALID_GAME_ACTION');
 const route=paths(s.positions[player.id]).get(destination);
 if(!route||route.length<2)throw new GameError('INVALID_TARGET');
 s.preview={target:destination,path:route,cost:route.length-1,reachable:route.length-1<=s.allowance};
}
function move(s,player){
 assertTurn(s,player);
 if(s.phase!=='MOVE'||!s.preview?.reachable)throw new GameError('INVALID_GAME_ACTION');
 const route=paths(s.positions[player.id]).get(s.preview.target);
 if(!route||route.join('|')!==s.preview.path.join('|')||route.length-1>s.allowance)
  throw new GameError('INVALID_TARGET');
 const target=s.preview.target;
 s.positions[player.id]=target;s.lastMove=route;s.preview=null;
 s.phase=doors[target]?'SUGGEST':'TURN_END';
 publicly(s,'move',player.name+' تحرّك '+(route.length-1)+' خطوات.'+(doors[target]?' ووصل إلى '+locations.find(l=>l.id===doors[target]).name+'.':''),player.name+' moved '+(route.length-1)+' steps'+(doors[target]?' and entered '+locations.find(l=>l.id===doors[target]).englishName:'')+'.');
}
function suggest(s,player,payload){
 assertTurn(s,player);
 if(s.phase!=='SUGGEST')throw new GameError('INVALID_GAME_ACTION');
 const currentLocation=doors[s.positions[player.id]];
 if(!currentLocation)throw new GameError('INVALID_GAME_ACTION');
 ensureId(payload.suspect,'suspect');ensureId(payload.item,'item');
 s.suggestion={suspect:payload.suspect,location:'L:'+currentLocation,item:payload.item,by:player.id};
 const res=findResponder(s);
 publicly(s,'suggest',player.name+' اقترح: '+cardMap[payload.suspect].name+' / '+locations.find(l=>l.id===currentLocation).name+' / '+cardMap[payload.item].name,player.name+' suggested: '+cardMap[payload.suspect].englishName+' / '+locations.find(l=>l.id===currentLocation).englishName+' / '+cardMap[payload.item].englishName);
 if(res){s.pendingResponder=res;s.phase='DISPROVE';}
 else {s.pendingResponder=null;s.phase='POST_SUGGEST';publicly(s,'none','ما حد قدر يدحض الاقتراح.','No investigator could disprove the suggestion.');}
}
function showEvidence(s,player,card){
 if(s.phase!=='DISPROVE'||s.pendingResponder!==player.id)throw new GameError('NOT_YOUR_TURN');
 if(!evidenceMatching(s,player.id).includes(card))throw new GameError('INVALID_CARD');
 const asker=turnId(s);
 s.revealedTo[asker].push({card,by:player.id,turn:s.turnsTaken+1});
 s.notebooks[asker][card]='seen';
 s.disproofCard=card;
 s.pendingResponder=null;
 s.phase='POST_SUGGEST';
 publicly(s,'disprove',player.name+' أظهر دليلاً للمحقق بسرية.',player.name+' privately revealed one piece of evidence.');
}
function accuse(s,player,payload){
 assertTurn(s,player);
 if(!s.canAccuse[player.id]||!['ROLL','MOVE','SUGGEST','POST_SUGGEST','TURN_END'].includes(s.phase))throw new GameError('INVALID_GAME_ACTION');
 ensureId(payload.suspect,'suspect');
 ensureId(payload.location,'location');
 ensureId(payload.item,'item');
 const guess=[payload.suspect,payload.location,payload.item];
 if(guess.every((x,i)=>x===s.solution[i])){
  s.winnerId=player.id;s.status=STATUS.FINISHED;s.phase='RESULT';
  publicly(s,'win',player.name+' كشف الحقيقة كاملة وفاز!',player.name+' solved the case and won!');
 }else{
  s.canAccuse[player.id]=false;
  publicly(s,'wrong',player.name+' اتهم شخصاً خطأ وفقد حق الاتهام، لكنه ما زال يكشف الأدلة عند الحاجة.',player.name+' accused incorrectly and can no longer accuse, but will still disprove suggestions.');
  if(!checkNoAccusers(s))endTurn(s);
 }
}
function act(s,player,payload={},random=Math.random){
 if(s.status!==STATUS.ACTIVE)throw new GameError('GAME_NOT_ACTIVE');
 const action=payload.action;
 if(action==='note'&&!s.players.includes(player.id))throw new GameError('UNAUTHORIZED');
 if(action==='note'){
  if(!cardMap[payload.card]||!['unknown','possible','excluded'].includes(payload.mark))throw new GameError('INVALID_CARD');
  if(s.hands[player.id].includes(payload.card)||s.revealedTo[player.id].some(r=>r.card===payload.card))throw new GameError('INVALID_CARD');
  s.notebooks[player.id][payload.card]=payload.mark==='unknown'?undefined:payload.mark;
  return;
 }
 if(action==='roll')return roll(s,player,random);
 if(action==='preview')return preview(s,player,payload.destination);
 if(action==='move')return move(s,player);
 if(action==='suggest')return suggest(s,player,payload);
 if(action==='show-evidence')return showEvidence(s,player,payload.card);
 if(action==='accuse')return accuse(s,player,payload);
 if(action==='end'){
  assertTurn(s,player);
  if(!['MOVE','SUGGEST','TURN_END','POST_SUGGEST'].includes(s.phase))throw new GameError('INVALID_GAME_ACTION');
  publicly(s,'end',player.name+' أنهى دوره.',player.name+' ended their turn.');
  endTurn(s);return;
 }
 throw new GameError('INVALID_GAME_ACTION');
}
function recover(s,room,expired=false){
 const connected=new Set(room.players.filter(p=>p.connected).map(p=>p.id));
 if(s.phase==='DISPROVE'){
  if(!expired && connected.has(s.pendingResponder))throw new GameError('RECOVERY_NOT_NEEDED');
  // Automatically show the first eligible card if disproof was interrupted.
  const card=evidenceMatching(s,s.pendingResponder)[0];
  if(card){
   const id=s.pendingResponder,asker=turnId(s);
   s.revealedTo[asker].push({card,by:id,turn:s.turnsTaken+1});
   s.notebooks[asker][card]='seen';
   publicly(s,'disprove','انقطع كاشف الدليل؛ أُرسل دليل مؤكد للمحقق بشكل خاص.','The evidence holder disconnected; one matching card was privately sent to the investigator.');
  }
  s.pendingResponder=null;s.phase='POST_SUGGEST';return;
 }
 const current=turnId(s);
 if(!expired && connected.has(current))throw new GameError('RECOVERY_NOT_NEEDED');
 publicly(s,'timeout', 'انتهت مهلة دور أحد اللاعبين أو انقطع اتصاله. انتقل الدور.','An inactive or disconnected investigator was skipped.');
 endTurn(s);
}
function serialize(s,viewer,room){
 const id=viewer.id,active=turnId(s);
 const from=s.positions[id];
 const reachable=s.phase==='MOVE'&&id===active?[...paths(from).entries()].filter(([,r])=>r.length-1<=s.allowance).map(([k])=>k):[];
 const previewState=s.phase==='MOVE'&&id===active?s.preview:null;
 return {mystery:{
  phase:s.phase,round:s.round,turn:s.turn,turnsTaken:s.turnsTaken,
  activePlayerId:active,players:s.players,characters:s.characters,positions:s.positions,
  suspects,locations,items,cards:allCards,
  streets:[...squares],entrances:locations.map(l=>({id:l.id,tile:key(l.x,l.y)})),
  dice:s.dice,allowance:s.allowance,
  reachable,preview:previewState,lastMove:s.lastMove,
  hand:s.hands[id]||[],notebook:s.notebooks[id]||{},revealedTo:s.revealedTo[id]||[],
  suggestion:s.suggestion,
  pendingResponderId:s.pendingResponder,
  eligibleEvidence:s.pendingResponder===id&&s.phase==='DISPROVE'?evidenceMatching(s,id):[],
  canAccuse:s.canAccuse,mayAccuse:s.canAccuse[id],
  winnerId:s.winnerId,
  solution:s.phase==='RESULT'?s.solution:undefined,
  log:s.log,
  canRecover:Boolean(room && (s.phase==='DISPROVE'
    ? !room.players.some(p=>p.id===s.pendingResponder && p.connected)
    : !room.players.some(p=>p.id===active && p.connected))),
 }};
}
module.exports={metadata,suspects,locations,items,allCards,cardMap,squares,doors,key,paths,shuffle,canStart,createSession,act,recover,serialize,turnId};
