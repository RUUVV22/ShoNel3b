const assert=require('node:assert/strict');
const {test}=require('node:test');
const bomb=require('../src/games/bomb');
const {RoomManager}=require('../src/game/RoomManager');
const {STATUS}=require('../src/game/constants');
const {confirmScorpionCards}=require('./scorpion-setup-helper');

const roomOf=n=>({players:Array.from({length:n},(_,i)=>({id:'p'+i,connected:true}))});

for(const count of [4,5,8,12,20]){
 test('Bomb game adapts to '+count+' joined players and ends with one winner',()=>{
  const players=roomOf(count).players;
  const s=bomb.createSession(1,()=>0, {players});
  assert.equal(s.aliveIds.length,count);
  assert.equal(s.bombHolderId,players[0].id);
  assert.equal(bomb.serialize(s,players[1]).bomb.bombHolderId,undefined);
  assert.equal(bomb.serialize(s,players[0]).bomb.isHolder,true);
  let round=0;
  while(s.status===STATUS.ACTIVE){
   assert.equal(s.phase,'PASS');
   const sender=s.bombHolderId;
   const recipient=s.aliveIds.find(id=>id!==sender);
   const currentPlayers=s.aliveIds.map(id=>({id}));
   const target=currentPlayers.find(p=>p.id===recipient);
   assert.throws(()=>bomb.act(s,{id:sender},{action:'pass',targetId:sender}),/غير نفسك/);
   bomb.act(s,{id:sender},{action:'pass',targetId:recipient});
   assert.equal(s.phase,'GUESS');
   assert.equal(bomb.serialize(s,target).bomb.recipientId,recipient);
   assert.equal(bomb.serialize(s,target).bomb.bombHolderId,undefined);
   const wrong=s.aliveIds.find(id=>id!==recipient&&id!==sender);
   const guessed=wrong||sender;
   bomb.act(s,target,{action:'guess',targetId:guessed});
   const loser=guessed===sender?sender:recipient;
   assert.equal(s.eliminatedIds.at(-1),loser);
   assert.equal(s.aliveIds.length,count-(++round));
   if(s.status===STATUS.ACTIVE){
    assert.equal(s.phase,'REVEAL');
    assert.equal(s.lastResult.senderId,sender);
    assert.equal(bomb.serialize(s,target).bomb.lastResult.eliminatedId,loser);
    bomb.act(s,{id:'host-who-may-have-lost'},{action:'next'},()=>.4);
    assert.equal(s.phase,'PASS');
   }
  }
  assert.equal(s.phase,'FINISHED');
  assert.equal(s.aliveIds.length,1);
  assert.equal(s.winnerId,s.aliveIds[0]);
  assert.equal(s.turnsPlayed,count-1);
 });
}

test('Guessing correctly eliminates the bomber, not the recipient',()=>{
 const players=roomOf(4).players;
 const s=bomb.createSession(1,()=>0,{players});
 bomb.act(s,players[0],{action:'pass',targetId:players[2].id});
 assert.throws(()=>bomb.act(s,players[1],{action:'guess',targetId:players[0].id}), e=>e.code==='NOT_YOUR_TURN');
 bomb.act(s,players[2],{action:'guess',targetId:players[0].id});
 assert.equal(s.lastResult.correct,true);
 assert.equal(s.lastResult.eliminatedId,players[0].id);
 assert.equal(s.aliveIds.includes(players[2].id),true);
});

test('RoomManager protects bomber identity and only host can advance results',()=>{
 const manager=new RoomManager({random:()=>0});
 const host=manager.createRoom({name:'المضيف',socketId:'socket0'});
 for(let i=1;i<5;i++)manager.joinRoom({roomCode:host.roomCode,name:'لاعب '+i,socketId:'socket'+i});
 const room=manager.selectGame({socketId:'socket0',gameId:'BOMB'});
 assert.equal(room.players.length,5);
 assert.equal(manager.startGame('socket0').status,STATUS.ACTIVE);
 const senderId=room.gameSession.bombHolderId;
 const senderIndex=room.players.findIndex(p=>p.id===senderId);
 const receiver=room.players.find(p=>p.id!==senderId);
 const spectator=room.players.find(p=>p.id!==receiver.id&&p.id!==senderId);
 const first=manager.serializeFor(host.roomCode,spectator.id);
 assert.equal(first.bomb.bombHolderId,undefined);
 assert.equal(first.bomb.isHolder,false);
 assert.equal(first.availableGames.length,5);
 assert.equal(first.gameCatalogVersion,5);
 manager.gameAction('socket'+senderIndex,{action:'pass',targetId:receiver.id});
 assert.equal(manager.serializeFor(host.roomCode,receiver.id).bomb.bombHolderId,undefined);
 const recvIndex=room.players.findIndex(p=>p.id===receiver.id);
 assert.equal(manager.gameAction('socket'+recvIndex,{action:'guess',targetId:senderId}).status,STATUS.ACTIVE);
 assert.equal(room.gameSession.phase,'REVEAL');
 assert.throws(()=>manager.gameAction('socket'+recvIndex,{action:'next'}),e=>e.code==='NOT_HOST');
 assert.equal(manager.gameAction('socket0',{action:'next'}).status,STATUS.ACTIVE);
 manager.clear();
});
test('All game choices derive their playable count from the actual room roster',()=>{
 const m=new RoomManager({random:()=>0.15});
 const session=m.createRoom({name:'المضيف',socketId:'s0'});
 for(let i=1;i<20;i++)m.joinRoom({roomCode:session.roomCode,name:'لاعب '+i,socketId:'s'+i});
 const room=m.rooms.get(session.roomCode);
 assert.equal(room.players.length,20);
 assert.equal(m.serializeFor(session.roomCode,room.players[0].id).maxPlayers,20);
 assert.throws(()=>m.joinRoom({roomCode:session.roomCode,name:'زيادة',socketId:'s20'}),e=>e.code==='ROOM_FULL');
 for(const gameId of ['CODENAMES','WEREWOLF','KHASERNY','BOMB']){
  m.selectGame({socketId:'s0',gameId});
  if(gameId==='WEREWOLF'){
   // Fixed 16-card deck (+3 center cards) supports at most 13 players.
   assert.equal(m.canStart(room),false);
   continue;
  }
  assert.equal(m.canStart(room),true,gameId+' supports current room');
  m.startGame('s0');
  assert.equal(room.status,STATUS.ACTIVE);
  if(gameId==='KHASERNY')assert.equal(Object.keys(room.gameSession.scores).length,20);
  if(gameId==='BOMB')assert.equal(room.gameSession.aliveIds.length,20);
  room.status=STATUS.FINISHED;
  m.returnToLobby('s0');
 }
 m.clear();
});
