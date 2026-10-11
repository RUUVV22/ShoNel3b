const { STATUS } = require('../game/constants');
const { GameError } = require('../game/errors');
const metadata = { id:'WEREWOLF', title:'ليلة العقارب', englishTitle:'Scorpion Night', subtitle:'أسرار القرية', description:'أدوار خفية ونقاش وتصويت ليلي', minPlayers:4, maxPlayers:20 };
const roles = [
  {id:'WOLF',name:'الذئب',team:'WOLF',action:'peek'},
  {id:'SEER',name:'العرافة',team:'VILLAGE',action:'peek'},
  {id:'ROBBER',name:'اللص',team:'VILLAGE',action:'swap'},
  {id:'TROUBLEMAKER',name:'المشاغبة',team:'VILLAGE',action:'swap2'},
  {id:'SCORPION',name:'العقرب',team:'VILLAGE',action:'peek'},
  {id:'SCORPIONESS',name:'العقربة',team:'VILLAGE',action:'protect'},
  {id:'VILLAGER',name:'المواطن',team:'VILLAGE',action:null},
  {id:'DRUNK',name:'السكّير',team:'VILLAGE',action:'swap-center'},
  {id:'INSOMNIAC',name:'السهران',team:'VILLAGE',action:'final-peek'},
  {id:'MINION',name:'التابع',team:'WOLF',action:'wolves'},
  {id:'MASON',name:'الماسوني',team:'VILLAGE',action:'partner'},
  {id:'TANNER',name:'الدبّاغ',team:'TANNER',action:null},
  {id:'HUNTER',name:'الصياد',team:'VILLAGE',action:null},
];
const roleById = id => roles.find(r=>r.id===id);
function canStart(room){return room.players.filter(p=>p.connected).length>=4 && room.players.length<=20;}
function createSession(round, random=Math.random, room) {
  const players=room.players.filter(p=>p.connected);
  const n=players.length;
  const defaultRoles=['WOLF','WOLF','SEER','ROBBER','TROUBLEMAKER','DRUNK','INSOMNIAC','MINION','MASON','MASON','TANNER','HUNTER','SCORPION','SCORPIONESS'];
  const requested=room.werewolfRoleDeck;
  const deck=Array.isArray(requested)&&requested.length===n+3 ? [...requested] : defaultRoles.slice(0,n+3);
  while(deck.length<n+3) deck.push('VILLAGER');
  while(deck.length>n+3) {
    const idx=deck.lastIndexOf('VILLAGER');
    if(idx>=0)deck.splice(idx,1);else deck.splice(deck.length-1,1);
  }
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  const assignments=Object.fromEntries(players.map((p,i)=>[p.id,deck[i]]));
  return {status:STATUS.ACTIVE,round,phase:'NIGHT',step:0,assignments,
    original:{...assignments},center:deck.slice(n),votes:{},actions:{},log:[], protectedId:null,
    activeOrder:['WOLF','MINION','MASON','SEER','ROBBER','TROUBLEMAKER','DRUNK','INSOMNIAC','SCORPION','SCORPIONESS'].filter(role=>deck.includes(role) && !(role==='SCORPIONESS'&&Object.values(assignments).includes('SCORPION'))),winner:null};
}
function currentRole(s){return s.activeOrder[s.step]||null;}
function action(s,player,payload) {
  if(s.phase!=='NIGHT')throw new GameError('INVALID_GAME_ACTION');
  const role=currentRole(s);
  if(s.original[player.id]!==role && !(role==='SCORPION' && s.original[player.id]==='SCORPIONESS' && Object.values(s.original).includes('SCORPION')))throw new GameError('UNAUTHORIZED');
  if(s.actions[player.id])throw new GameError('INVALID_GAME_ACTION');
  const target=payload?.target;
  const playerIds=Object.keys(s.assignments);
  if(role==='WOLF'){
    // Lone wolf can investigate a center card; wolves with partners learn identities by the role display.
    const solo=Object.values(s.original).filter(r=>r==='WOLF').length===1;
    if(solo && (!Number.isInteger(target)||target<0||target>2))throw new GameError('INVALID_CARD');
    s.actions[player.id]={centerIndex:solo?target:null,seen:solo?s.center[target]:null};
  }else if(role==='SEER'){
    const second=payload?.second;
    if (Number.isInteger(target) && Number.isInteger(second)) {
      if (target<0 || target>2 || second<0 || second>2 || target===second) throw new GameError('INVALID_CARD');
      s.actions[player.id]={target,second,seen:[s.center[target],s.center[second]]};
    } else {
      if (!playerIds.includes(target)||target===player.id) throw new GameError('INVALID_CARD');
      s.actions[player.id]={target,seen:s.assignments[target]};
    }
  }else if(role==='ROBBER'){
    if(!playerIds.includes(target)||target===player.id)throw new GameError('INVALID_CARD');
    const a=s.assignments[player.id];s.assignments[player.id]=s.assignments[target];s.assignments[target]=a;
    s.actions[player.id]={target,seen:s.assignments[player.id]};
  }else if(role==='TROUBLEMAKER'){
    const second=payload?.second;
    if(!playerIds.includes(target)||!playerIds.includes(second)||target===second||target===player.id||second===player.id)throw new GameError('INVALID_CARD');
    [s.assignments[target],s.assignments[second]]=[s.assignments[second],s.assignments[target]];
    s.actions[player.id]={target,second};
  }else if(role==='DRUNK'){
    if(!Number.isInteger(target)||target<0||target>2)throw new GameError('INVALID_CARD');
    const old=s.assignments[player.id];s.assignments[player.id]=s.center[target];s.center[target]=old;
    s.actions[player.id]={target,seen:null};
  }else if(role==='INSOMNIAC'){
    s.actions[player.id]={seen:s.assignments[player.id]};
  }else if(role==='MINION'){
    s.actions[player.id]={seen:Object.keys(s.original).filter(id=>s.original[id]==='WOLF')};
  }else if(role==='MASON'){
    s.actions[player.id]={seen:Object.keys(s.original).filter(id=>id!==player.id&&s.original[id]==='MASON')};
  }else if(role==='SCORPION'){
    const partner=Object.values(s.original).includes('SCORPIONESS');
    if(!partner && (!Number.isInteger(target)||target<0||target>2))throw new GameError('INVALID_CARD');
    s.actions[player.id]={seen:partner?(s.original[player.id]==='SCORPIONESS'?'العقرب موجود':'العقربة موجودة'):s.center[target],target:partner?null:target};
  }else if(role==='SCORPIONESS'){
    const partner=Object.values(s.original).includes('SCORPION');
    if(!partner && (!playerIds.includes(target)||target===player.id))throw new GameError('INVALID_CARD');
    s.protectedId=partner?null:target;
    s.actions[player.id]={target:partner?null:target,seen:partner?'العقرب موجود':'تمت حماية لاعب من التصويت'};
  }else throw new GameError('INVALID_GAME_ACTION');
}
function advance(s){
  if(s.phase==='NIGHT'){s.step+=1;if(s.step>=s.activeOrder.length)s.phase='DISCUSSION';}
  else if(s.phase==='DISCUSSION')s.phase='VOTING';
  else if(s.phase==='VOTING'){
    const votes=Object.values(s.votes);if(votes.length!==Object.keys(s.assignments).length)throw new GameError('NOT_READY');
    const tally={};for(const id of votes)tally[id]=(tally[id]||0)+1;
    const highest=Math.max(...Object.values(tally));
    const eliminated=highest<=1?[]:Object.keys(tally).filter(id=>tally[id]===highest && id!==s.protectedId);
    const wolves=Object.entries(s.assignments).filter(([,r])=>r==='WOLF').map(([id])=>id);
    if(eliminated.some(id=>s.assignments[id]==='HUNTER')){
      for(const id of [...eliminated]) if(s.assignments[id]==='HUNTER'&&s.votes[id]&&!eliminated.includes(s.votes[id])) eliminated.push(s.votes[id]);
    }
    const wolfKilled=eliminated.some(id=>wolves.includes(id));
    const noWolf=wolves.length===0;
    s.winner=eliminated.some(id=>s.assignments[id]==='TANNER')?(wolfKilled?'TANNER_AND_VILLAGE':'TANNER'):(wolfKilled||noWolf&&eliminated.length===0?'VILLAGE':'WOLF');
    s.eliminated=eliminated;s.phase='RESULT';s.status=STATUS.FINISHED;
  }
}
function vote(s,player,target){
  if(s.phase!=='VOTING'||s.votes[player.id])throw new GameError('INVALID_GAME_ACTION');
  if(!Object.hasOwn(s.assignments,target))throw new GameError('INVALID_CARD');
  s.votes[player.id]=target;
}
function serialize(s,viewer){
  const own=s.original[viewer.id];
  const group=Object.entries(s.original).filter(([,role])=>role==='WOLF').map(([id])=>id);
  return {werewolf:{phase:s.phase,step:s.step,currentRole:currentRole(s),role:own,
    roleName:roleById(own)?.name,round:s.round,viewerAction:s.actions[viewer.id]||null,
    wolves:own==='WOLF'?group:undefined,
    isActor:own===currentRole(s)||(currentRole(s)==='SCORPION'&&own==='SCORPIONESS'&&Object.values(s.original).includes('SCORPION')),acted:Boolean(s.actions[viewer.id]),
    votesCount:Object.keys(s.votes).length,voted:Boolean(s.votes[viewer.id]),playerCount:Object.keys(s.assignments).length,
    eliminated:s.phase==='RESULT'?s.eliminated:undefined,
    assignments:s.phase==='RESULT'?s.assignments:undefined,
    winner:s.winner,protectedId:s.phase==='RESULT'?s.protectedId:undefined}};
}
module.exports={metadata,canStart,createSession,action,advance,vote,serialize,roles};