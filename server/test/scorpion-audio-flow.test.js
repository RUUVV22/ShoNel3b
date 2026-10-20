const assert=require('node:assert/strict');
const {test}=require('node:test');
const wolf=require('../src/games/werewolf');
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
 assert.equal(wolf.canStart({players:players(14)}),false);
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
});
