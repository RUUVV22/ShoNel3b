const assert=require('node:assert/strict');
const {test}=require('node:test');
const wolf=require('../src/games/werewolf');
const trivia=require('../src/games/khaserny');
const players=Array.from({length:4},(_,i)=>({id:'p'+i,connected:true}));
test('Werewolf hides secrets and resolves votes',()=>{
 const s=wolf.createSession(1,()=>0.4,{players});
 const view=wolf.serialize(s,players[0]).werewolf;
 assert.equal(view.assignments,undefined);
 assert.equal(view.phase,'NIGHT');
 for(let i=0;i<6;i++)wolf.advance(s);
 wolf.advance(s);
 for(let i=0;i<4;i++)wolf.vote(s,players[i],players[(i+1)%4].id);
 wolf.advance(s);
 assert.equal(s.status,'FINISHED');
});
test('Six category quiz keeps answers secret and scores approved answers',()=>{
 const s=trivia.createSession(1,Math.random,{players});
 assert.equal(trivia.categories.length,6);
 trivia.act(s,players[0],{category:'MOVIES'});
 assert.equal(trivia.serialize(s,players[1]).khaserny.answer,null);
 trivia.act(s,players[0],{action:'reveal'});
 for(let i=1;i<4;i++)trivia.act(s,players[i],{action:'correct'});
 assert.equal(s.scores.p0,10);
});
