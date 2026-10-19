const assert=require('node:assert/strict');
const {test}=require('node:test');
const wolf=require('../src/games/werewolf');
const trivia=require('../src/games/khaserny');
const players=Array.from({length:4},(_,i)=>({id:'p'+i,connected:true}));
test('Werewolf hides secrets and resolves votes',()=>{
 const s=wolf.createSession(1,()=>0.999,{players,
  werewolfRoleDeck:['SCORPION','SCORPIONESS','VILLAGER','VILLAGER','SEER','TANNER','VILLAGER']});
 const view=wolf.serialize(s,players[0]).werewolf;
 assert.equal(view.assignments,undefined);
 assert.equal(view.phase,'REVEAL');
 for(let i=0;i<20&&s.phase!=='VOTING';i++)wolf.tick(s,s.deadline+1,()=>0.3);
 assert.equal(s.phase,'VOTING');
 for(let i=0;i<4;i++)wolf.vote(s,players[i],players[(i+1)%4].id,undefined,s.voteOpensAt+1);
 assert.equal(s.status,'FINISHED');
});
test('Six category quiz keeps answers secret and scores approved answers',()=>{
 const s=trivia.createSession(1,Math.random,{players});
 assert.equal(trivia.categories.length,6);
 trivia.act(s,players[0],{category:'MOVIES',opponentId:'p1'});
 assert.equal(trivia.serialize(s,players[1]).khaserny.answer,null);
 trivia.act(s,players[1],{action:'reveal'});
 for(let i of [0,2,3])trivia.act(s,players[i],{action:'incorrect'});
 assert.equal(s.scores.p1,20);
});