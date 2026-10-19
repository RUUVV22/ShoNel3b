const assert = require('node:assert/strict');
const {test} = require('node:test');
const {RoomManager} = require('../src/game/RoomManager');
const {STATUS} = require('../src/game/constants');
const khaserny = require('../src/games/khaserny');
const {confirmScorpionCards}=require('./scorpion-setup-helper');

function makeRoom(n=4,random=()=>0.999){
  const manager=new RoomManager({random,reconnectWindowMs:10_000});
  const created=manager.createRoom({name:'Player 0',socketId:'s0'});
  for(let i=1;i<n;i++)manager.joinRoom({roomCode:created.roomCode,name:'Player '+i,socketId:'s'+i});
  const room=manager.rooms.get(created.roomCode);
  return {manager,room,code:created.roomCode,ids:room.players.map(p=>p.id)};
}

test('Khaserny chooses every available question before reusing any in the same category',()=>{
  const players=Array.from({length:2},(_,i)=>({id:'p'+i,connected:true}));
  const session=khaserny.createSession(1,Math.random,{players});
  const seen=[];
  for(let t=0;t<4;t++){
    const chooser=players[t%2],recipient=players[(t+1)%2];
    khaserny.act(session,chooser,{category:'MOVIES',opponentId:recipient.id},()=>0);
    seen.push(session.question);
    assert.equal(khaserny.serialize(session,recipient).khaserny.answer,null);
    khaserny.act(session,recipient,{action:'reveal'});
    khaserny.act(session,chooser,{action:'correct'});
  }
  assert.equal(new Set(seen.slice(0,3)).size,3);
  assert.equal(seen[3],seen[0]);
});

test('Scorpion Night cannot skip synchronized phases and forbids self-votes',()=>{
 const {manager,room,ids}=makeRoom();
 try{
  manager.selectGame({socketId:'s0',gameId:'WEREWOLF'});
  manager.startGame('s0');
  confirmScorpionCards(manager,['SCORPION','SEER','ROBBER','VILLAGER','SCORPIONESS','VILLAGER','VILLAGER']);
  assert.equal(room.gameSession.phase,'REVEAL');
  assert.throws(()=>manager.gameAction('s0',{action:'advance'}),e=>e.code==='NOT_READY');
  const game=require('../src/games/werewolf');
  for(let i=0;i<20&&room.gameSession.phase!=='VOTING';i++){
   game.tick(room.gameSession,room.gameSession.deadline+1,()=>0.5);
  }
  assert.equal(room.gameSession.phase,'VOTING');
  room.gameSession.voteOpensAt=Date.now()-1;
  assert.throws(()=>manager.gameAction('s0',{action:'vote',target:ids[0]}),e=>e.code==='INVALID_CARD');
  manager.gameAction('s0',{action:'vote',target:ids[1]});
  assert.throws(()=>manager.gameAction('s0',{action:'vote',target:ids[2]}),e=>e.code==='INVALID_GAME_ACTION');
 }finally{manager.clear();}
});

test('Scorpion and scorpioness recognize each other without leaking to villagers',()=>{
 const {manager,room,code,ids}=makeRoom();
 try{
  manager.selectGame({socketId:'s0',gameId:'WEREWOLF'});
  manager.startGame('s0');
  confirmScorpionCards(manager,['SCORPION','SCORPIONESS','VILLAGER','VILLAGER','VILLAGER','VILLAGER','VILLAGER']);
  const game=require('../src/games/werewolf');
  for(let i=0;i<20&&(room.gameSession.phase!=='NIGHT'||game.currentRole(room.gameSession)!=='SCORPIONS');i++){
   game.tick(room.gameSession,room.gameSession.deadline+1,()=>.5);
  }
  const a=manager.serializeFor(code,ids[0]).werewolf;
  const b=manager.serializeFor(code,ids[1]).werewolf;
  assert.equal(a.isActor,true);assert.equal(b.isActor,true);
  assert.deepEqual(a.partnerIds,[ids[1]]);
  assert.deepEqual(b.partnerIds,[ids[0]]);
  assert.equal(manager.serializeFor(code,ids[2]).werewolf.partnerIds,undefined);
  room.gameSession.phaseOpensAt=Date.now()-1;
  manager.gameAction('s0',{action:'ack'});
  manager.gameAction('s1',{action:'ack'});
  assert.equal(room.gameSession.phase,'NIGHT');
 }finally{manager.clear();}
});

test('Scorpion Night finishes voting when connected players vote; disconnected player abstains',()=>{
 const {manager,room,ids}=makeRoom();
 try{
  manager.selectGame({socketId:'s0',gameId:'WEREWOLF'});
  manager.startGame('s0');
  confirmScorpionCards(manager,['SCORPION','VILLAGER','VILLAGER','VILLAGER','VILLAGER','VILLAGER','VILLAGER']);
  const game=require('../src/games/werewolf');
  for(let i=0;i<20&&room.gameSession.phase!=='VOTING';i++)game.tick(room.gameSession,room.gameSession.deadline+1,()=>.5);
  room.gameSession.voteOpensAt=Date.now()-1;
  manager.disconnect('s3');
  for(let i=0;i<3;i++)manager.gameAction('s'+i,{action:'vote',target:ids[(i+1)%3]});
  assert.equal(room.status,STATUS.FINISHED);
  assert.equal(Object.keys(room.gameSession.votes).length,3);
  assert.equal(room.gameSession.seats.length,4);
 }finally{manager.clear();}
});

test('Khaserny host can skip disconnected turns but cannot skip connected players',()=>{
  const {manager,room,ids}=makeRoom();
  try{
    manager.selectGame({socketId:'s0',gameId:'KHASERNY'});
    manager.startGame('s0');
    assert.throws(()=>manager.gameAction('s0',{action:'recover'}),e=>e.code==='RECOVERY_NOT_NEEDED');
    manager.disconnect('s0');
    assert.equal(room.hostId,ids[1]);
    manager.gameAction('s1',{action:'recover'}); // disconnected question chooser
    assert.equal(room.gameSession.turn,1);
    manager.gameAction('s1',{category:'MOVIES',opponentId:ids[0]});
    manager.gameAction('s1',{action:'recover'}); // disconnected challenged player
    assert.equal(room.gameSession.turn,2);
    manager.gameAction('s2',{category:'FOOD',opponentId:ids[1]});
    manager.gameAction('s1',{action:'reveal'});
    manager.gameAction('s2',{action:'correct'});
    manager.gameAction('s3',{action:'correct'});
    assert.deepEqual(manager.serializeFor(room.roomId,ids[1]).khaserny.waitingJudgeIds,[ids[0]]);
    manager.gameAction('s1',{action:'recover'}); // missing vote treated as correct
    assert.equal(room.gameSession.phase,'PICK');
    assert.equal(room.gameSession.turn,3);
  }finally{manager.clear();}
});

test('Bomb game can recover when sender or recipient disconnects',()=>{
  const {manager,room,ids}=makeRoom(4,()=>0);
  try{
    manager.selectGame({socketId:'s0',gameId:'BOMB'});
    manager.startGame('s0');
    assert.equal(room.gameSession.bombHolderId,ids[0]);
    assert.throws(()=>manager.gameAction('s0',{action:'recover'}),e=>e.code==='RECOVERY_NOT_NEEDED');
    manager.disconnect('s0');
    assert.equal(room.hostId,ids[1]);
    assert.equal(manager.serializeFor(room.roomId,ids[1]).bomb.waitingForDisconnected,true);
    manager.gameAction('s1',{action:'recover'});
    assert.equal(room.gameSession.eliminatedIds[0],ids[0]);
    manager.gameAction('s1',{action:'next'});
    assert.equal(room.gameSession.bombHolderId,ids[1]);
    manager.gameAction('s1',{action:'pass',targetId:ids[2]});
    manager.disconnect('s2');
    manager.gameAction('s1',{action:'recover'});
    assert.equal(room.gameSession.eliminatedIds[1],ids[2]);
    assert.equal(room.gameSession.aliveIds.length,2);
    manager.gameAction('s1',{action:'next'});
    manager.gameAction('s1',{action:'pass',targetId:ids[3]});
    manager.gameAction('s3',{action:'guess',targetId:ids[1]});
    assert.equal(room.status,STATUS.FINISHED);
  }finally{manager.clear();}
});