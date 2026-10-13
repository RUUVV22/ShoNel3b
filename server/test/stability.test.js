const assert = require('node:assert/strict');
const {test} = require('node:test');
const {RoomManager} = require('../src/game/RoomManager');
const {STATUS} = require('../src/game/constants');
const khaserny = require('../src/games/khaserny');

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

test('Scorpion Night waits for all connected night actors and disallows self-votes',()=>{
  const {manager,room,ids}=makeRoom();
  try {
    manager.selectGame({socketId:'s0',gameId:'WEREWOLF'});
    room.werewolfRoleDeck=['WOLF','WOLF','SEER','ROBBER','VILLAGER','VILLAGER','VILLAGER'];
    manager.startGame('s0');
    assert.deepEqual(Object.values(room.gameSession.original).slice(0,4),['WOLF','WOLF','SEER','ROBBER']);
    assert.throws(()=>manager.gameAction('s0',{action:'advance'}),e=>e.code==='WAITING_FOR_ACTIONS');
    manager.gameAction('s0',{action:'role'});
    assert.throws(()=>manager.gameAction('s0',{action:'advance'}),e=>e.code==='WAITING_FOR_ACTIONS');
    manager.gameAction('s1',{action:'role'});
    manager.gameAction('s0',{action:'advance'});
    assert.equal(room.gameSession.activeOrder[room.gameSession.step],'SEER');
    assert.throws(()=>manager.gameAction('s0',{action:'advance'}),e=>e.code==='WAITING_FOR_ACTIONS');
    manager.gameAction('s2',{action:'role',target:ids[0]});
    manager.gameAction('s0',{action:'advance'});
    manager.gameAction('s3',{action:'role',target:ids[0]});
    manager.gameAction('s0',{action:'advance'});
    assert.equal(room.gameSession.phase,'DISCUSSION');
    manager.gameAction('s0',{action:'advance'});
    assert.throws(()=>manager.gameAction('s0',{action:'vote',target:ids[0]}),e=>e.code==='INVALID_CARD');
    manager.gameAction('s0',{action:'vote',target:ids[1]});
    assert.throws(()=>manager.gameAction('s0',{action:'vote',target:ids[2]}),e=>e.code==='INVALID_GAME_ACTION');
    for(let i=1;i<4;i++)manager.gameAction('s'+i,{action:'vote',target:ids[(i+1)%4]});
    assert.equal(room.status,STATUS.ACTIVE);
    manager.gameAction('s0',{action:'advance'});
    assert.equal(room.status,STATUS.FINISHED);
  }finally{manager.clear();}
});

test('Scorpion and scorpioness can both finish their paired night action',()=>{
  const {manager,room,code,ids}=makeRoom();
  try{
    manager.selectGame({socketId:'s0',gameId:'WEREWOLF'});
    room.werewolfRoleDeck=['SCORPION','SCORPIONESS','VILLAGER','VILLAGER','VILLAGER','VILLAGER','VILLAGER'];
    manager.startGame('s0');
    const a=manager.serializeFor(code,ids[0]).werewolf;
    const b=manager.serializeFor(code,ids[1]).werewolf;
    assert.equal(a.isActor,true);
    assert.equal(b.isActor,true);
    assert.deepEqual(a.scorpionPartnerIds,[ids[1]]);
    assert.deepEqual(b.scorpionPartnerIds,[ids[0]]);
    assert.equal(manager.serializeFor(code,ids[2]).werewolf.scorpionPartnerIds,undefined);
    manager.gameAction('s0',{action:'role'});
    assert.throws(()=>manager.gameAction('s0',{action:'advance'}),e=>e.code==='WAITING_FOR_ACTIONS');
    manager.gameAction('s1',{action:'role'});
    manager.gameAction('s0',{action:'advance'});
    assert.equal(room.gameSession.phase,'DISCUSSION');
  }finally{manager.clear();}
});

test('Scorpion Night host may finish voting after another player disconnects',()=>{
  const {manager,room,ids}=makeRoom();
  try{
    manager.selectGame({socketId:'s0',gameId:'WEREWOLF'});
    room.werewolfRoleDeck=Array(7).fill('VILLAGER');
    manager.startGame('s0');
    manager.gameAction('s0',{action:'advance'});
    manager.gameAction('s0',{action:'advance'});
    for(let i=0;i<3;i++) manager.gameAction('s'+i,{action:'vote',target:ids[(i+1)%4]});
    assert.throws(()=>manager.gameAction('s0',{action:'advance'}),e=>e.code==='NOT_READY');
    manager.disconnect('s3');
    manager.gameAction('s0',{action:'advance'});
    assert.equal(room.status,STATUS.FINISHED);
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
