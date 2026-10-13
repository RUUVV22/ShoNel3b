const {test}=require('node:test');
const assert=require('node:assert/strict');
const {io:client}=require('socket.io-client');
const {createGameServer}=require('../src/createServer');
const {RoomManager}=require('../src/game/RoomManager');
const {STATUS}=require('../src/game/constants');
const mystery=require('../src/games/mystery');
const connect=url=>new Promise((resolve,reject)=>{
 const socket=client(url,{forceNew:true,transports:['websocket'],reconnection:false});
 socket.once('connect',()=>resolve(socket));socket.once('connect_error',reject);
});
const ack=(socket,event,payload={})=>new Promise((resolve,reject)=>{
 const timeout=setTimeout(()=>reject(new Error('ACK timeout: '+event)),2500);
 socket.emit(event,payload,r=>{clearTimeout(timeout);resolve(r);});
});
test('real multiplayer room completes a deduction case with loss, solution reveal, rematch and lobby',async()=>{
 const backend=createGameServer({roomManager:{random:()=>0.14,reconnectWindowMs:8000}});
 const address=await backend.start(0,'127.0.0.1');
 const clients=[];
 try{
  for(let i=0;i<3;i++)clients.push(await connect('http://127.0.0.1:'+address.port));
  const created=await ack(clients[0],'room:create',{name:'First Player'});
  assert.equal(created.ok,true);
  for(let i=1;i<3;i++)assert.equal((await ack(clients[i],'room:join',{roomCode:created.roomCode,name:'Player '+i})).ok,true);
  assert.equal((await ack(clients[0],'lobby:select-game',{gameId:'MEN_WARAHA'})).ok,true);
  for(let i=0;i<3;i++)assert.equal((await ack(clients[i],'lobby:mystery-character',{characterId:mystery.suspects[i].id})).ok,true);
  const room=backend.roomManager.rooms.get(created.roomCode);
  assert.equal((await ack(clients[1],'game:start')).code,'NOT_HOST');
  assert.equal((await ack(clients[0],'game:start')).ok,true);
  const ids=room.players.map(p=>p.id);
  for(let i=0;i<3;i++){
    const view=backend.roomManager.serializeFor(created.roomCode,ids[i]).mystery;
    assert.equal(view.solution,undefined);
    assert.equal(view.hand.length,6);
    assert.equal(view.cards.length,21);
    assert.equal(view.revealedTo.length,0);
  }
  const wrong=mystery.suspects.find(x=>'S:'+x.id!==room.gameSession.solution[0]).id;
  for(let i=0;i<3;i++){
    assert.equal((await ack(clients[i],'game:action',{action:'accuse',suspect:'S:'+wrong,location:room.gameSession.solution[1],item:room.gameSession.solution[2]})).ok,true);
  }
  assert.equal(room.status,STATUS.FINISHED);
  for(const id of ids)assert.deepEqual(backend.roomManager.serializeFor(created.roomCode,id).mystery.solution,room.gameSession.solution);
  assert.equal((await ack(clients[0],'game:restart')).ok,true);
  assert.equal(room.status,STATUS.ACTIVE);
  assert.equal(room.gameSession.turn,0);
  assert.equal((await ack(clients[0],'game:return-lobby')).code,'GAME_NOT_FINISHED');
  // Successfully finish a second case with the hidden solution, then return to lobby.
  const solution=[...room.gameSession.solution];
  assert.equal((await ack(clients[0],'game:action',{action:'accuse',suspect:solution[0],location:solution[1],item:solution[2]})).ok,true);
  assert.equal(room.status,STATUS.FINISHED);
  assert.equal((await ack(clients[0],'game:return-lobby')).ok,true);
  assert.equal(room.status,STATUS.LOBBY);
  assert.equal(room.players.length,3);
 }finally{clients.forEach(c=>c.disconnect());await backend.stop();}
});
test('mystery room reconnect restores roll, position, hand and notebook privately',()=>{
 const manager=new RoomManager({random:()=>0.36,reconnectWindowMs:5000});
 const created=manager.createRoom({name:'First Player',socketId:'s0'});
 manager.joinRoom({roomCode:created.roomCode,name:'Second Player',socketId:'s1'});
 manager.joinRoom({roomCode:created.roomCode,name:'Third Player',socketId:'s2'});
 for(let i=0;i<3;i++)manager.selectMysteryCharacter('s'+i,mystery.suspects[i].id);
 manager.selectGame({socketId:'s0',gameId:'MEN_WARAHA'});
 manager.startGame('s0');
 const room=manager.rooms.get(created.roomCode);
 const id=room.players[0].id,secret=room.players[0].sessionToken;
 const first=manager.serializeFor(created.roomCode,id).mystery;
 manager.gameAction('s0',{action:'roll'});
 const destination=manager.serializeFor(created.roomCode,id).mystery.reachable.find(x=>x!==room.gameSession.positions[id]);
 manager.gameAction('s0',{action:'preview',destination});
 const card=mystery.allCards.find(c=>!first.hand.includes(c.id)).id;
 manager.gameAction('s0',{action:'note',card,mark:'possible'});
 const position=room.gameSession.positions[id];
 const before=manager.serializeFor(created.roomCode,id).mystery;
 manager.disconnect('s0');
 manager.reconnect({roomCode:created.roomCode,sessionToken:secret,socketId:'sNEW'});
 const after=manager.serializeFor(created.roomCode,id).mystery;
 assert.deepEqual(after.dice,before.dice);
 assert.deepEqual(after.preview,before.preview);
 assert.deepEqual(after.hand,before.hand);
 assert.equal(after.notebook[card],'possible');
 assert.equal(after.positions[id],position);
 assert.equal(manager.serializeFor(created.roomCode,room.players[1].id).mystery.notebook[card],undefined);
 manager.clear();
});
test('150-second inactivity mechanism can be simulated with short timeout; notifier runs',async()=>{
 const manager=new RoomManager({random:()=>0.19,mysteryTimeoutMs:40,reconnectWindowMs:30000});
 const {roomCode}=manager.createRoom({name:'First Player',socketId:'s0'});
 for(let i=1;i<3;i++)manager.joinRoom({roomCode,name:'Player '+i,socketId:'s'+i});
 for(let i=0;i<3;i++)manager.selectMysteryCharacter('s'+i,mystery.suspects[i].id);
 manager.selectGame({socketId:'s0',gameId:'MEN_WARAHA'});
 manager.startGame('s0');
 const room=manager.rooms.get(roomCode);
 await new Promise(resolve=>setTimeout(resolve,75));
 assert.ok(room.gameSession.turnsTaken>=1);
 assert.equal(room.status,STATUS.ACTIVE);
 manager.clear();
});
