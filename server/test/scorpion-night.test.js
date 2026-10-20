const assert=require('node:assert/strict');
const {test}=require('node:test');
const wolf=require('../src/games/werewolf');
const {RoomManager}=require('../src/game/RoomManager');
const {confirmScorpionCards}=require('./scorpion-setup-helper');
const players=(n=4)=>Array.from({length:n},(_,i)=>({id:'p'+i,connected:true}));
const build=(deck,n=4)=>wolf.createSession(1,()=>0.99999,{players:players(n),werewolfRoleDeck:deck},1_000_000);
const jump=(s,phase,role)=>{
 for(let i=0;i<20;i++){
  if(s.phase===phase&&(!role||wolf.currentRole(s)===role))return;
  wolf.tick(s,s.deadline+1,()=>0.1);
 }
 throw new Error('phase missing: '+phase+'/'+role);
};
const vote=(s,targets)=>{
 jump(s,'VOTING');
 targets.forEach((id,i)=>{if(id!==null)wolf.vote(s,{id:'p'+i},id,players().map(p=>p.id),s.deadline-1000);});
};
test('Start opens shared card selection; host toggles individual cards, and confirmation deals privately',()=>{
 const m=new RoomManager({random:()=>.99999});
 try{
  const created=m.createRoom({name:'Host',socketId:'s0'});
  for(let i=1;i<4;i++)m.joinRoom({roomCode:created.roomCode,name:'Player '+i,socketId:'s'+i});
  m.selectGame({socketId:'s0',gameId:'WEREWOLF'});
  m.startGame('s0');
  const room=m.rooms.get(created.roomCode);
  assert.equal(room.status,'ACTIVE');
  assert.equal(room.gameSession.phase,'SETUP');
  const publicView=m.serializeFor(created.roomCode,room.players[1].id).werewolf;
  assert.equal(publicView.requiredCards,7);
  assert.deepEqual(publicView.selectedCards,[]);
  assert.equal(publicView.role,undefined);
  assert.equal(publicView.assignments,undefined);
  assert.throws(()=>m.gameAction('s1',{action:'toggle-card',cardKey:'SCORPION:0'}),e=>e.code==='NOT_HOST');
  assert.throws(()=>m.gameAction('s0',{action:'toggle-card',cardKey:'NOT_A_CARD:0'}),e=>e.code==='INVALID_CARD');
  assert.throws(()=>m.gameAction('s0',{action:'confirm-cards'}),e=>e.code==='INVALID_ASSIGNMENT');
  m.gameAction('s0',{action:'toggle-card',cardKey:'SCORPION:0'});
  assert.deepEqual(m.serializeFor(created.roomCode,room.players[1].id).werewolf.selectedCards,['SCORPION:0']);
  m.gameAction('s0',{action:'toggle-card',cardKey:'SCORPION:0'});
  assert.deepEqual(room.gameSession.selectedCards,[]);
  for(let i=0;i<3;i++)m.gameAction('s0',{action:'toggle-card',cardKey:'VILLAGER:'+i});
  assert.throws(()=>m.gameAction('s0',{action:'toggle-card',cardKey:'VILLAGER:3'}),e=>e.code==='INVALID_CARD');
  for(const role of ['SEER','ROBBER','TANNER','HUNTER'])
    m.gameAction('s0',{action:'toggle-card',cardKey:role+':0'});
  assert.throws(()=>m.gameAction('s0',{action:'toggle-card',cardKey:'SCORPION:0'}),e=>e.code==='INVALID_ASSIGNMENT');
  assert.throws(()=>m.gameAction('s0',{action:'confirm-cards'}),e=>e.code==='INVALID_ASSIGNMENT');
  m.gameAction('s0',{action:'toggle-card',cardKey:'HUNTER:0'});
  m.gameAction('s0',{action:'toggle-card',cardKey:'SCORPION:0'});
  assert.throws(()=>m.gameAction('s1',{action:'confirm-cards'}),e=>e.code==='NOT_HOST');
  m.gameAction('s0',{action:'confirm-cards'});
  assert.equal(room.gameSession.phase,'REVEAL');
  assert.equal(room.gameSession.center.length,3);
  assert.equal(room.gameSession.seats.length,4);
  assert.equal(m.serializeFor(created.roomCode,room.players[1].id).werewolf.assignments,undefined);
  assert.equal(m.serializeFor(created.roomCode,room.players[1].id).werewolf.selectedCards,undefined);
 }finally{m.clear();}
});
test('Setup can return to lobby and a replay starts with empty card choices',()=>{
 const m=new RoomManager();
 try{
  const host=m.createRoom({name:'Host',socketId:'s0'});
  for(let i=1;i<4;i++)m.joinRoom({roomCode:host.roomCode,name:'Friend '+i,socketId:'s'+i});
  m.selectGame({socketId:'s0',gameId:'WEREWOLF'});
  m.startGame('s0');
  m.gameAction('s0',{action:'toggle-card',cardKey:'SCORPION:0'});
  assert.equal(m.returnToLobby('s0').status,'LOBBY');
  m.startGame('s0');
  assert.equal(m.serializeFor(host.roomCode,m.rooms.get(host.roomCode).players[0].id).werewolf.selectedCards.length,0);
 }finally{m.clear();}
});
test('host deck requires exactly N+3, pairs of companions, and at least one scorpion',()=>{
 assert.equal(wolf.validateDeck(['SCORPION','VILLAGER','VILLAGER','VILLAGER','SEER','ROBBER','TANNER'],4),true);
 assert.equal(wolf.validateDeck(Array(7).fill('VILLAGER'),4),false);
 assert.equal(wolf.validateDeck(['SCORPION','MASON','VILLAGER','VILLAGER','VILLAGER','VILLAGER','VILLAGER'],4),false);
 assert.equal(wolf.validateDeck(['SCORPION','MASON','MASON','VILLAGER','VILLAGER','VILLAGER','SEER'],4),true);
 assert.equal(wolf.validateDeck(['SCORPION','SCORPION','VILLAGER','VILLAGER','VILLAGER','VILLAGER','VILLAGER'],4),false);
});
test('authoritative deal has fixed seats, exactly three center cards, and private role visibility',()=>{
 const s=build(['SCORPION','SCORPIONESS','SEER','ROBBER','VILLAGER','TANNER','VILLAGER']);
 assert.equal(s.seats.length,4);assert.equal(s.center.length,3);
 assert.equal(new Set([...Object.values(s.assignments),...s.center]).size,7);
 const a=wolf.serialize(s,players()[0]).werewolf;
 const b=wolf.serialize(s,players()[1]).werewolf;
 assert.equal(a.role,'SCORPION');assert.equal(b.role,'SCORPIONESS');
 assert.equal(a.assignments,undefined);assert.equal(a.center,undefined);assert.equal(a.votes,undefined);
 assert.deepEqual(a.seats,['p0','p1','p2','p3']);
});
test('ready gate waits until five seconds and cannot be skipped by host',()=>{
 const s=build(['SCORPION','VILLAGER','VILLAGER','VILLAGER','SEER','ROBBER','TANNER']);
 for(const p of players())wolf.action(s,p,{action:'ready'},Math.random,null,1_000_200);
 assert.equal(s.phase,'REVEAL');assert.throws(()=>wolf.advance(s,null,1_001_000),e=>e.code==='NOT_READY');
 wolf.tick(s,1_005_100);
 assert.equal(s.phase,'NIGHT');assert.equal(wolf.currentRole(s),'SCORPIONS');
 assert.deepEqual(s.nightOrder,['SCORPIONS','SEER','ROBBER']);
});
test('copied scorpion counts as teammate and is invisible to others',()=>{
 const s=build(['MIMIC','SCORPION','VILLAGER','VILLAGER','SCORPIONESS','TANNER','VILLAGER']);
 jump(s,'NIGHT','MIMIC');wolf.action(s,players()[0],{action:'role',target:'p1'});
 assert.equal(s.cards[s.startingCards.p0].copyRole,'SCORPION');
 jump(s,'NIGHT','SCORPIONS');
 assert.deepEqual(wolf.serialize(s,players()[1]).werewolf.partnerIds,['p0']);
 assert.deepEqual(wolf.serialize(s,players()[0]).werewolf.partnerIds,['p1']);
 assert.equal(wolf.serialize(s,players()[2]).werewolf.partnerIds,undefined);
});
test('lone scorpioness compares affiliations without revealing exact middle roles',()=>{
 const s=build(['SCORPIONESS','VILLAGER','VILLAGER','VILLAGER','SCORPION','MINION','TANNER']);
 jump(s,'NIGHT','SCORPIONS');
 assert.throws(()=>wolf.action(s,players()[0],{action:'role',target:0,second:0}),e=>e.code==='INVALID_CARD');
 wolf.action(s,players()[0],{action:'role',target:0,second:1});
 const result=wolf.serialize(s,players()[0]).werewolf.privateObservation.at(-1);
 assert.equal(result.seen,'البطاقتان من نفس الفريق');
 assert.equal(wolf.serialize(s,players()[1]).werewolf.privateObservation.length,0);
});
test('seer and robber see only their private result; identity of the old role persists',()=>{
 const s=build(['SEER','ROBBER','SCORPION','VILLAGER','VILLAGER','SCORPIONESS','TANNER']);
 jump(s,'NIGHT','SEER');
 wolf.action(s,players()[0],{action:'role',target:'p2'});
 assert.equal(wolf.serialize(s,players()[0]).werewolf.privateObservation.at(-1).seen,'SCORPION');
 assert.equal(wolf.serialize(s,players()[1]).werewolf.privateObservation.length,0);
 jump(s,'NIGHT','ROBBER');
 wolf.action(s,players()[1],{action:'role',target:'p2'});
 assert.equal(wolf.roleNow(s,'p1'),'SCORPION');
 assert.equal(s.original.p1,'ROBBER');
 assert.equal(wolf.serialize(s,players()[1]).werewolf.privateObservation.at(-1).seen,'SCORPION');
});
test('drunk automatically swaps with middle when phase deadline expires',()=>{
 const s=build(['DRUNK','SCORPION','VILLAGER','VILLAGER','SCORPIONESS','TANNER','SEER']);
 jump(s,'NIGHT','DRUNK');
 const before=s.assignments.p0;
 wolf.tick(s,s.deadline+1,()=>0);
 assert.notEqual(s.assignments.p0,before);
 assert.equal(s.actions['DRUNK:p0'].timeout,true);
});
test('discussion warnings occur on threshold crossings and early vote requires unanimity',()=>{
 const s=build(['SCORPION','SCORPIONESS','VILLAGER','VILLAGER','TANNER','SEER','VILLAGER']);
 jump(s,'DISCUSSION');
 wolf.tick(s,s.deadline-59_900);assert.equal(s.cue.id,'one_minute_left');
 const old=s.cue.sequence;wolf.tick(s,s.deadline-59_800);assert.equal(s.cue.sequence,old);
 wolf.tick(s,s.deadline-29_950);assert.equal(s.cue.id,'thirty_seconds_left');
 for(const p of players().slice(0,3))wolf.action(s,p,{action:'ready-vote'});
 assert.equal(s.phase,'DISCUSSION');
 wolf.action(s,players()[3],{action:'ready-vote'});
 assert.equal(s.phase,'VOTING');assert.equal(s.cue.id,'vote_early');
});
test('votes are secret until final reveal; timeouts abstain rather than creating votes',()=>{
 const s=build(['SCORPION','VILLAGER','VILLAGER','VILLAGER','SEER','TANNER','VILLAGER']);
 jump(s,'VOTING');
 wolf.vote(s,players()[0],'p1',['p0','p1','p2','p3'],s.deadline-2000);
 assert.equal(wolf.serialize(s,players()[2]).werewolf.votes,undefined);
 assert.throws(()=>wolf.vote(s,players()[0],'p2'),e=>e.code==='INVALID_GAME_ACTION');
 assert.throws(()=>wolf.vote(s,players()[1],'p1'),e=>e.code==='INVALID_CARD');
 wolf.tick(s,s.deadline+1);
 assert.equal(s.phase,'RESULT');
 assert.deepEqual(s.resultVotes,{p0:'p1',p1:null,p2:null,p3:null});
 assert.equal(s.eliminated.length,0);
});
test('hunter chain, ties and tanner resolution use final cards',()=>{
 const hunter=build(['HUNTER','SCORPION','SCORPIONESS','VILLAGER','VILLAGER','VILLAGER','SEER']);
 vote(hunter,['p1','p0','p0','p0']);
 assert.deepEqual(new Set(hunter.eliminated),new Set(['p0','p1']));
 assert.equal(hunter.winner,'VILLAGE');
 const tanner=build(['TANNER','SCORPION','VILLAGER','VILLAGER','SCORPIONESS','SEER','VILLAGER']);
 vote(tanner,['p1','p0','p0','p1']);
 assert.deepEqual(new Set(tanner.eliminated),new Set(['p0','p1']));
 assert.equal(tanner.winner,'TANNER_AND_VILLAGE');
});
test('helper-only case and no-scorpion no-elimination case resolve correctly',()=>{
 const helper=build(['MINION','VILLAGER','VILLAGER','VILLAGER','SCORPION','VILLAGER','SEER']);
 vote(helper,['p1','p2','p1','p1']);
 assert.equal(helper.winner,'SCORPIONS');
 const empty=build(['VILLAGER','VILLAGER','VILLAGER','VILLAGER','SCORPION','SEER','TANNER']);
 vote(empty,['p1','p2','p3','p0']);assert.equal(empty.winner,'VILLAGE');
});
test('RoomManager confirms the in-game deck, reconnect privacy, and frozen seats',()=>{
 const m=new RoomManager({random:()=>0.9999,reconnectWindowMs:10});
 try{
  const h=m.createRoom({name:'Host',socketId:'s0'});
  for(let i=1;i<4;i++)m.joinRoom({roomCode:h.roomCode,name:'Friend '+i,socketId:'s'+i});
  m.selectGame({socketId:'s0',gameId:'WEREWOLF'});
  assert.equal(m.canStart(m.rooms.get(h.roomCode)),true);
  const deck=['SCORPION','MIMIC','VILLAGER','VILLAGER','TANNER','SEER','MINION'];
  m.startGame('s0');
  assert.equal(m.rooms.get(h.roomCode).gameSession.phase,'SETUP');
  confirmScorpionCards(m,deck);
  const s=m.rooms.get(h.roomCode).gameSession;
  assert.equal(s.seats.length,4);
  m.disconnect('s3');
  const viewer=m.serializeFor(h.roomCode,s.seats[0]).werewolf;
  assert.equal(viewer.assignments,undefined);
  assert.equal(viewer.role,'SCORPION');
  assert.equal(s.seats.length,4);
 }finally{m.clear();}
});
test('mimic performs copied robber action immediately; identity stays on the card after swapping',()=>{
 const s=build(['MIMIC','ROBBER','SCORPION','VILLAGER','SCORPIONESS','VILLAGER','TANNER']);
 jump(s,'NIGHT','MIMIC');
 wolf.action(s,players()[0],{action:'role',target:'p1'});
 wolf.action(s,players()[0],{action:'role',target:'p2'});
 assert.equal(wolf.roleNow(s,'p0'),'SCORPION');
 assert.equal(wolf.roleNow(s,'p2'),'ROBBER');
 assert.equal(s.cards[s.startingCards.p0].copyRole,'ROBBER');
 assert.throws(()=>wolf.action(s,players()[0],{action:'role',target:'p3'}),e=>e.code==='INVALID_GAME_ACTION');
 jump(s,'NIGHT','ROBBER');
 assert.equal(wolf.serialize(s,players()[0]).werewolf.isActor,false);
});
test('copied helper learns starting scorpions in reserved private helper phase',()=>{
 const s=build(['MIMIC','MINION','SCORPION','VILLAGER','SEER','VILLAGER','TANNER']);
 jump(s,'NIGHT','MIMIC');wolf.action(s,players()[0],{action:'role',target:'p1'});
 jump(s,'NIGHT','COPIED_HELPER');
 assert.deepEqual(wolf.serialize(s,players()[0]).werewolf.privateObservation[0].seen,['p2']);
 assert.equal(wolf.serialize(s,players()[2]).werewolf.privateObservation.length,0);
 jump(s,'NIGHT','MINION');
 assert.deepEqual(wolf.serialize(s,players()[1]).werewolf.privateObservation[0].seen,['p2']);
});
test('mimic who copies a companion joins their recognition and their role follows the card',()=>{
 const s=build(['MIMIC','MASON','MASON','SCORPION','VILLAGER','VILLAGER','TANNER']);
 jump(s,'NIGHT','MIMIC');wolf.action(s,players()[0],{action:'role',target:'p1'});
 jump(s,'NIGHT','MASON');
 assert.deepEqual(wolf.serialize(s,players()[0]).werewolf.privateObservation[0].seen,['p1','p2']);
 assert.deepEqual(wolf.serialize(s,players()[1]).werewolf.privateObservation[0].seen,['p0','p2']);
});
test('copied night girl checks her own final card in the reserved last phase',()=>{
 const s=build(['MIMIC','INSOMNIAC','TROUBLEMAKER','SCORPION','ROBBER','VILLAGER','TANNER']);
 jump(s,'NIGHT','MIMIC');wolf.action(s,players()[0],{action:'role',target:'p1'});
 jump(s,'NIGHT','TROUBLEMAKER');
 wolf.action(s,players()[2],{action:'role',target:'p0',second:'p3'});
 jump(s,'NIGHT','COPIED_NIGHT_GIRL');
 const view=wolf.serialize(s,players()[0]).werewolf;
 assert.equal(view.privateObservation[0].seen.changed,true);
 assert.equal(view.privateObservation[0].seen.role,'SCORPION');
 assert.equal(wolf.serialize(s,players()[3]).werewolf.isActor,false);
});
test('copied drunk must exchange a card on timeout during the mimic step',()=>{
 const s=build(['MIMIC','DRUNK','SCORPION','VILLAGER','SCORPIONESS','VILLAGER','TANNER']);
 jump(s,'NIGHT','MIMIC');wolf.action(s,players()[0],{action:'role',target:'p1'});
 const card=s.assignments.p0;
 wolf.tick(s,s.deadline+1,()=>0);
 assert.notEqual(card,s.assignments.p0);
 assert.equal(s.actions['MIMIC:p0'].timeout,true);
});
test('hunter elimination propagates transitively through copied hunter cards',()=>{
 const s=build(['MIMIC','HUNTER','VILLAGER','SCORPION','SCORPIONESS','VILLAGER','TANNER']);
 jump(s,'NIGHT','MIMIC');wolf.action(s,players()[0],{action:'role',target:'p1'});
 vote(s,['p1','p2','p0','p0']);
 assert.deepEqual(new Set(s.eliminated),new Set(['p0','p1','p2']));
});
