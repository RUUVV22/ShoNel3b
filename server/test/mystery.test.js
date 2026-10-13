const {test}=require('node:test');
const assert=require('node:assert/strict');
const mystery=require('../src/games/mystery');
const {RoomManager}=require('../src/game/RoomManager');
const {STATUS}=require('../src/game/constants');

function setup(n=3,random=()=>0){
 const manager=new RoomManager({random,reconnectWindowMs:30000});
 const {roomCode}=manager.createRoom({name:'Player 0',socketId:'s0'});
 for(let i=1;i<n;i++)manager.joinRoom({roomCode,name:'Player '+i,socketId:'s'+i});
 const room=manager.rooms.get(roomCode);
 for(let i=0;i<n;i++)manager.selectMysteryCharacter('s'+i,mystery.suspects[i].id);
 manager.selectGame({socketId:'s0',gameId:'MEN_WARAHA'});
 manager.startGame('s0');
 return {manager,room,session:room.gameSession,ids:room.players.map(p=>p.id)};
}
const actor=(room,i)=>room.players[i];
test('mystery requires 3-6 distinct connected characters and rejects duplicates',()=>{
 const manager=new RoomManager({random:()=>0.5});
 const {roomCode}=manager.createRoom({name:'First Player',socketId:'s0'});
 manager.joinRoom({roomCode,name:'Second Player',socketId:'s1'});
 manager.joinRoom({roomCode,name:'Third Player',socketId:'s2'});
 const room=manager.rooms.get(roomCode);
 manager.selectGame({socketId:'s0',gameId:'MEN_WARAHA'});
 assert.equal(manager.canStart(room),false);
 manager.selectMysteryCharacter('s0','SALIM');
 assert.throws(()=>manager.selectMysteryCharacter('s1','SALIM'), e=>e.code==='INVALID_ASSIGNMENT');
 manager.selectMysteryCharacter('s1','ZAINAB');
 manager.selectMysteryCharacter('s2','NABIL');
 assert.equal(manager.canStart(room),true);
 manager.startGame('s0');
 assert.equal(room.status,STATUS.ACTIVE);
 manager.clear();
});
for(const n of [3,4,5,6]){
 test('mystery hides the solution and correctly distributes cards to '+n+' players',()=>{
  const {manager,room,session,ids}=setup(n,()=>0.33);
  try{
   assert.equal(session.solution.length,3);
   assert.equal(new Set(session.solution).size,3);
   const distributed=Object.values(session.hands).flat();
   assert.equal(distributed.length,mystery.allCards.length-3);
   assert.equal(new Set([...distributed,...session.solution]).size,mystery.allCards.length);
   assert.ok(Math.max(...Object.values(session.hands).map(h=>h.length))-Math.min(...Object.values(session.hands).map(h=>h.length))<=1);
   const view=manager.serializeFor(room.roomId,ids[0]).mystery;
   assert.equal(view.solution,undefined);
   assert.deepEqual(view.hand,session.hands[ids[0]]);
   assert.equal(view.revealedTo.length,0);
   assert.equal(view.cards.length,21);
   assert.equal(view.entrances.length,9);
   assert.equal(view.activePlayerId,ids[0]);
  }finally{manager.clear();}
 });
}
test('dice totals 2 to 12 and rolling once per turn are enforced',()=>{
 for(let i=1;i<=6;i++){
  for(let j=1;j<=6;j++){
   const {manager,room,session}=setup(3,(()=>{const q=[(i-.01)/6,(j-.01)/6];let c=0;return ()=>q[Math.min(c++,1)];})());
   try{
    // Session setup consumes random, so pass controlled dice via direct action.
    const r=[(i-.1)/6,(j-.1)/6];let ix=0;
    mystery.act(session,actor(room,0),{action:'roll'},()=>r[ix++]);
    assert.deepEqual(session.dice,[i,j]);
    assert.equal(session.allowance,i+j);
    assert.throws(()=>mystery.act(session,actor(room,0),{action:'roll'},()=>0),e=>e.code==='INVALID_GAME_ACTION');
   }finally{manager.clear();}
  }
 }
});
test('BFS respects connected four-way paths, walls, and separate location entry',()=>{
 const route=mystery.paths('1,3').get('3,2');
 assert.equal(route.length-1,3); // 1,3 > 2,3 > 3,3 > 3,2
 assert.equal(route.at(-1),'3,2');
 assert.equal(mystery.paths('1,3').has('0,0'),false);
 for(const path of mystery.paths('1,3').values()){
  for(let i=1;i<path.length;i++){
   const [x,y]=path[i].split(',').map(Number);
   const [a,b]=path[i-1].split(',').map(Number);
   assert.equal(Math.abs(x-a)+Math.abs(y-b),1);
  }
  assert.equal(path.slice(1,-1).some(tile=>mystery.doors[tile]),false);
 }
 assert.ok(mystery.paths('1,3').get('11,10').length>12);
});
test('preview beyond allowance cannot be confirmed; reachable intermediate can',()=>{
 const {manager,room,session}=setup();
 try{
  mystery.act(session,actor(room,0),{action:'roll'},()=>0); // 2 moves
  const start=session.positions[room.players[0].id];
  mystery.act(session,actor(room,0),{action:'preview',destination:'11,10'});
  assert.equal(session.preview.reachable,false);
  assert.ok(session.preview.cost>2);
  assert.throws(()=>mystery.act(session,actor(room,0),{action:'move'}),e=>e.code==='INVALID_GAME_ACTION');
  assert.equal(session.positions[room.players[0].id],start);
  mystery.act(session,actor(room,0),{action:'preview',destination:'3,3'});
  assert.equal(session.preview.cost,2);
  mystery.act(session,actor(room,0),{action:'move'});
  assert.equal(session.positions[room.players[0].id],'3,3');
  assert.equal(session.phase,'TURN_END');
  mystery.act(session,actor(room,0),{action:'end'});
  assert.equal(session.positions[room.players[0].id],'3,3');
  assert.equal(session.phase,'ROLL');
 }finally{manager.clear();}
});
test('entering a location costs one move, ends movement and enables suggestion',()=>{
 const {manager,room,session,ids}=setup();
 try{
  mystery.act(session,actor(room,0),{action:'roll'},()=>.51);
  mystery.act(session,actor(room,0),{action:'preview',destination:'3,2'});
  assert.equal(session.preview.cost,3);
  mystery.act(session,actor(room,0),{action:'move'});
  assert.equal(session.phase,'SUGGEST');
  assert.equal(session.positions[ids[0]],'3,2');
  assert.throws(()=>mystery.act(session,actor(room,0),{action:'preview',destination:'7,2'}),e=>e.code==='INVALID_GAME_ACTION');
 }finally{manager.clear();}
});
test('suggestion disproof is ordered and private; notebooks isolated',()=>{
 const {manager,room,session,ids}=setup(3,()=>0.1);
 try{
  mystery.act(session,actor(room,0),{action:'roll'},()=>.75);
  mystery.act(session,actor(room,0),{action:'preview',destination:'3,2'});
  mystery.act(session,actor(room,0),{action:'move'});
  // Select a suspect or item held by someone other than the asker.
  const chosen=Object.entries(session.hands).filter(([id])=>id!==ids[0]).flatMap(([pid,hand])=>hand.map(card=>({pid,card})));
  const suspect=chosen.find(x=>x.card.startsWith('S:'))?.card||session.solution[0];
  const item=chosen.find(x=>x.card.startsWith('I:'))?.card||session.solution[2];
  mystery.act(session,actor(room,0),{action:'suggest',suspect,item});
  if(session.phase==='DISPROVE'){
   const responder=session.pendingResponder;
   const responderPlayer=room.players.find(p=>p.id===responder);
   const card=mystery.serialize(session,responderPlayer,room).mystery.eligibleEvidence[0];
   assert.ok(card);
   assert.equal(mystery.serialize(session,actor(room,0),room).mystery.eligibleEvidence.length,0);
   assert.equal(mystery.serialize(session,actor(room,0),room).mystery.solution,undefined);
   assert.throws(()=>mystery.act(session,actor(room,0),{action:'show-evidence',card}),e=>e.code==='NOT_YOUR_TURN');
   mystery.act(session,responderPlayer,{action:'show-evidence',card});
   assert.equal(mystery.serialize(session,actor(room,0),room).mystery.revealedTo.length,1);
   assert.equal(mystery.serialize(session,actor(room,2),room).mystery.revealedTo.length,0);
   assert.equal(mystery.serialize(session,actor(room,0),room).mystery.notebook[card],'seen');
   assert.equal(session.log.some(event=>event.text.includes(card)),false);
  } else assert.equal(session.phase,'POST_SUGGEST');
  assert.equal(session.phase,'POST_SUGGEST');
 }finally{manager.clear();}
});
test('wrong accusations lose rights, preserve evidence, and all wrong ends with solution reveal',()=>{
 const {manager,room,session,ids}=setup(3,()=>0);
 try{
  for(let i=0;i<3;i++){
   const who=actor(room,i);
   const wrong=mystery.cards?null:mystery.suspects.find(x=>'S:'+x.id!==session.solution[0]).id;
   mystery.act(session,who,{action:'accuse',suspect:'S:'+wrong,location:session.solution[1],item:session.solution[2]});
   assert.equal(session.canAccuse[ids[i]],false);
  }
  assert.equal(session.phase,'RESULT');
  assert.equal(session.status,STATUS.FINISHED);
  assert.equal(session.winnerId,null);
  assert.deepEqual(mystery.serialize(session,actor(room,2),room).mystery.solution,session.solution);
 }finally{manager.clear();}
});
test('correct accusation wins, and another player cannot submit duplicate movement',()=>{
 const {manager,room,session}=setup();
 try{
  assert.throws(()=>mystery.act(session,actor(room,1),{action:'roll'}),e=>e.code==='NOT_YOUR_TURN');
  mystery.act(session,actor(room,0),{action:'roll'},()=>0);
  assert.throws(()=>mystery.act(session,actor(room,0),{action:'move'}),e=>e.code==='INVALID_GAME_ACTION');
  mystery.act(session,actor(room,0),{action:'accuse',suspect:session.solution[0],location:session.solution[1],item:session.solution[2]});
  assert.equal(session.status,STATUS.FINISHED);
  assert.equal(session.winnerId,room.players[0].id);
 }finally{manager.clear();}
});
test('host can recover disconnected evidence provider without publicly leaking card',()=>{
 const {manager,room,session,ids}=setup();
 try{
  mystery.act(session,actor(room,0),{action:'roll'},()=>.67);
  mystery.act(session,actor(room,0),{action:'preview',destination:'3,2'});
  mystery.act(session,actor(room,0),{action:'move'});
  // arrange a suggestion that matches one non-investigator card
  const nonOwn=Object.values(session.hands).flat().find(c=>!session.hands[ids[0]].includes(c)&&c.startsWith('S:'));
  const suspect=nonOwn||session.solution[0];
  mystery.act(session,actor(room,0),{action:'suggest',suspect,item:session.solution[2]});
  if(session.phase==='DISPROVE'){
   const pid=session.pendingResponder;
   const index=room.players.findIndex(p=>p.id===pid);
   manager.disconnect('s'+index);
   if(pid===ids[0])throw Error('invalid responder');
   manager.gameAction('s0',{action:'recover'});
   assert.equal(session.phase,'POST_SUGGEST');
   assert.equal(session.log.some(x=>x.text.includes(session.revealedTo[ids[0]][0]?.card)),false);
  }
 }finally{manager.clear();}
});
