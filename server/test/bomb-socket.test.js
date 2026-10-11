const {test}=require('node:test');
const assert=require('node:assert/strict');
const {io:client}=require('socket.io-client');
const {createGameServer}=require('../src/createServer');
const {STATUS}=require('../src/game/constants');

const ack=(socket,event,payload={})=>new Promise((resolve,reject)=>{
 const timeout=setTimeout(()=>reject(new Error('timeout '+event)),3000);
 socket.emit(event,payload,response=>{clearTimeout(timeout);resolve(response);});
});
const connect=url=>new Promise((resolve,reject)=>{
 const s=client(url,{transports:['websocket'],forceNew:true,reconnection:false});
 s.once('connect',()=>resolve(s));s.once('connect_error',reject);
});
test('Four friends can play bomb through real Socket.IO, return to same room, and replay',async()=>{
 const server=createGameServer({roomManager:{random:()=>0}});
 const address=await server.start(0,'127.0.0.1');
 const sockets=[];
 try{
  for(let i=0;i<4;i++)sockets.push(await connect('http://127.0.0.1:'+address.port));
  const created=await ack(sockets[0],'room:create',{name:'Player zero'});
  for(let i=1;i<4;i++)assert.equal((await ack(sockets[i],'room:join',{roomCode:created.roomCode,name:'Player '+i})).ok,true);
  assert.equal((await ack(sockets[0],'lobby:select-game',{gameId:'BOMB'})).ok,true);
  assert.equal((await ack(sockets[1],'game:start')).code,'NOT_HOST');
  assert.equal((await ack(sockets[0],'game:start')).ok,true);
  const room=server.roomManager.rooms.get(created.roomCode);
  assert.equal(room.gameSession.aliveIds.length,4);
  for(let turn=0;turn<3;turn++){
   const s=room.gameSession;
   const sender=s.bombHolderId;
   const recipient=s.aliveIds.find(id=>id!==sender);
   const snd=room.players.findIndex(p=>p.id===sender);
   const rec=room.players.findIndex(p=>p.id===recipient);
   const spectator=room.players.find(p=>p.id!==sender&&p.id!==recipient);
   if(spectator)assert.equal(server.roomManager.serializeFor(created.roomCode,spectator.id).bomb.bombHolderId,undefined);
   assert.equal((await ack(sockets[snd],'game:action',{action:'pass',targetId:recipient})).ok,true);
   assert.equal(server.roomManager.serializeFor(created.roomCode,recipient).bomb.bombHolderId,undefined);
   assert.equal((await ack(sockets[rec],'game:action',{action:'guess',targetId:sender})).ok,true);
   if(room.status===STATUS.ACTIVE){
     assert.equal(room.gameSession.phase,'REVEAL');
     assert.equal((await ack(sockets[0],'game:action',{action:'next'})).ok,true);
   }
  }
  assert.equal(room.status,STATUS.FINISHED);
  assert.equal(room.gameSession.aliveIds.length,1);
  assert.equal((await ack(sockets[0],'game:return-lobby')).ok,true);
  assert.equal(room.players.length,4);
  assert.equal((await ack(sockets[0],'game:start')).ok,true);
  assert.equal(room.gameSession.aliveIds.length,4);
 }finally{
   sockets.forEach(s=>s.disconnect());
   await server.stop();
 }
});
