const assert=require('node:assert/strict');
const {test}=require('node:test');
const wolf=require('../src/games/werewolf');
const {RoomManager}=require('../src/game/RoomManager');
const {selectionCards,roles}=require('../src/games/scorpionRoles');
const durations=require('../src/games/scorpionCueDurations.json');
const players=n=>Array.from({length:n},(_,i)=>({id:'p'+i,connected:true}));
function setup(deck,n=4){
 const s=wolf.createSession(1,()=>0.99999,{players:players(n),werewolfRoleDeck:deck},100000);
 for(const p of players(n))wolf.action(s,p,{action:'ready'},()=>0.5,null,100001);
 wolf.tick(s,s.revealAt+1,()=>0.5);
 return s;
}
test('Card catalog contains exactly 16 cards and only 3 identical villager identities',()=>{
 const pool=selectionCards(13);
 assert.equal(pool.length,16);
 assert.deepEqual(pool.filter(c=>c.roleId==='VILLAGER').map(c=>c.key),
  ['VILLAGER:0','VILLAGER:1','VILLAGER:2']);
 assert.equal(roles.find(r=>r.id==='VILLAGER').art,'12-muwatin-1.png');
 assert.equal(wolf.validateDeck(pool.map(c=>c.roleId),13),true);
 assert.equal(wolf.canStart({players:players(13)}),true);
 assert.equal(wolf.canStart({players:players(14)}),true);
 assert.equal(wolf.canStart({players:players(16)}),true);
 assert.equal(wolf.canStart({players:players(17)}),false);
 const expanded=selectionCards(16);
 assert.equal(expanded.length,19);
 assert.equal(expanded.filter(c=>c.roleId==='VILLAGER').length,6);
 assert.equal(wolf.validateDeck(expanded.map(c=>c.roleId),16),true);
 const large=wolf.createSession(1,()=>0.99999,
   {players:players(16),werewolfRoleDeck:expanded.map(c=>c.roleId)},100000);
 assert.equal(large.seats.length,16);
 assert.equal(large.center.length,3);
});
test('Only the inspecting player receives location, card artwork variant and role',()=>{
 const s=setup(['SCORPION','SEER','ROBBER','VILLAGER','VILLAGER','VILLAGER','HUNTER']);
 wolf.tick(s,s.firstCueAt,()=>0.5);
 wolf.tick(s,s.deadline,()=>0.5);
 assert.equal(wolf.currentRole(s),'SEER');
 wolf.action(s,players(4)[1],{action:'role',target:'p2'},()=>0.5,null,s.phaseOpensAt+1);
 const privateView=wolf.serialize(s,players(4)[1]).werewolf;
 const otherView=wolf.serialize(s,players(4)[0]).werewolf;
 assert.equal(privateView.privateObservation[0].target,'p2');
 assert.equal(privateView.privateObservation[0].seen,'ROBBER');
 assert.equal(privateView.privateObservation[0].cardVariant,0);
 assert.deepEqual(otherView.privateObservation,[]);
 assert.equal(otherView.assignments,undefined);
});
test('Host can return an active Scorpion game to the existing lobby without removing connected players',()=>{
 const m=new RoomManager();
 const created=m.createRoom({name:'QA Host',socketId:'host'});
 for(let i=1;i<4;i++)m.joinRoom({roomCode:created.roomCode,name:'QA '+i,socketId:'p'+i});
 m.selectGame({socketId:'host',gameId:'WEREWOLF'});
 m.startGame('host');
 const selected=['SCORPION:0','SEER:0','ROBBER:0','VILLAGER:0','VILLAGER:1','VILLAGER:2','HUNTER:0'];
 for(const cardKey of selected)m.gameAction('host',{action:'toggle-card',cardKey});
 m.gameAction('host',{action:'confirm-cards'});
 assert.equal(m.requireRoom(created.roomCode).gameSession.phase,'REVEAL');
 m.returnToLobby('host');
 const room=m.requireRoom(created.roomCode);
 assert.equal(room.status,'LOBBY');
 assert.equal(room.gameSession,null);
 assert.equal(room.selectedGameId,'WEREWOLF');
 assert.equal(room.players.length,4);
 assert.equal(room.players.every(p=>p.connected),true);
 assert.equal(m.werewolfTimers.has(room.roomId),false);
});
test('Only selected role turns run and each cue respects its MP3 duration',()=>{
 const s=setup(['SCORPION','VILLAGER','VILLAGER','VILLAGER','SEER','HUNTER','TANNER']);
 assert.deepEqual(s.nightOrder,['SCORPIONS','SEER']);
 assert.equal(s.cue.id,'night_start');
 assert.equal(s.firstCueAt,s.phaseStartedAt+durations.night_start+350);
 wolf.tick(s,s.firstCueAt,()=>0.5);
 assert.equal(s.cue.id,'scorpions_open');
 assert.equal(s.phaseOpensAt,s.firstCueAt+durations.scorpions_open+350);
 assert.throws(()=>wolf.action(s,players(4)[0],{action:'role',target:0},()=>0.5,null,s.phaseOpensAt-1),
  e=>e.code==='NOT_READY');
 const end=s.deadline;
 assert.equal(s.closeCueAt,end-Math.max(3000,durations.scorpions_close+350));
 wolf.tick(s,s.closeCueAt-1,()=>0.5);
 assert.equal(s.cue.id,'scorpions_open');
 wolf.tick(s,s.closeCueAt,()=>0.5);
 assert.equal(s.cue.id,'scorpions_close');
 assert.equal(s.phase,'NIGHT');
 wolf.tick(s,end,()=>0.5);
 assert.equal(wolf.currentRole(s),'SEER');
 assert.equal(s.cue.id,'seer_open');
 wolf.tick(s,s.deadline+1,()=>0.5);
 assert.equal(s.phase,'DISCUSSION');
});
test('Mimic inserts only its copied-role private follow-up when needed',()=>{
 const s=setup(['MIMIC','MINION','SCORPION','VILLAGER','VILLAGER','VILLAGER','SEER']);
 assert.deepEqual(s.nightOrder,['MIMIC','SCORPIONS','MINION','SEER']);
 wolf.tick(s,s.firstCueAt,()=>0.5);
 wolf.action(s,players(4)[0],{action:'role',target:'p1'},()=>0.5,null,s.phaseOpensAt+1);
 assert.deepEqual(s.nightOrder,['MIMIC','COPIED_HELPER','SCORPIONS','MINION','SEER']);
 wolf.tick(s,s.deadline+1,()=>0.5);
 assert.equal(wolf.currentRole(s),'COPIED_HELPER');
 assert.equal(s.phaseOpensAt,s.phaseStartedAt+durations.copied_helper_open+350);
 const before=s.cue.sequence;
 wolf.tick(s,s.closeCueAt,()=>0.5);
 assert.equal(s.closingIssued,true);
 assert.equal(s.cue.sequence,before,'private role must not broadcast its identity');
 const actor=wolf.serialize(s,players(4)[0]).werewolf;
 const outsider=wolf.serialize(s,players(4)[3]).werewolf;
 assert.equal(actor.currentRole,'COPIED_HELPER');
 assert.equal(outsider.currentRole,'PRIVATE_ACTION');
});
