const { STATUS } = require('../game/constants');
const { GameError } = require('../game/errors');
const { roles,byId,validateDeck,DEFAULT_PHASES,selectionCards } = require('./scorpionRoles');
const audioDurations = require('./scorpionCueDurations.json');

const metadata={id:'WEREWOLF',title:'ليلة العقارب',englishTitle:'Scorpion Night',subtitle:'حكايات الحارة',description:'بطاقات سرّية حول طاولة الحارة، ليلة ونقاش وتصويت',minPlayers:4,maxPlayers:16};
const REVEAL_MIN_MS=5000, REVEAL_TIMEOUT_MS=20000, NIGHT_STEP_MS=17000, DISCUSSION_MS=300000, VOTE_MS=65000;
const AUDIO_MARGIN_MS=350;
const cueDuration=(id,fallback=3500)=>id?(audioDurations[id]||fallback):0;
const OPEN_CUES={MIMIC:'copycat_open',COPIED_HELPER:'copied_helper_open',COPIED_NIGHT_GIRL:'copied_night_girl_open',SCORPIONS:'scorpions_open',
 MINION:'helper_open',MASON:'companions_open',SEER:'seer_open',ROBBER:'robber_open',
 TROUBLEMAKER:'troublemaker_open',DRUNK:'drunk_open',INSOMNIAC:'night_girl_open'};
const CLOSE_CUES={MIMIC:'copycat_close',COPIED_HELPER:'copied_helper_close',COPIED_NIGHT_GIRL:'copied_night_girl_close',SCORPIONS:'scorpions_close',
 MINION:'helper_close',MASON:'companions_close',SEER:'seer_close',ROBBER:'robber_close',
 TROUBLEMAKER:'troublemaker_close',DRUNK:'drunk_close',INSOMNIAC:'night_girl_close'};
function selectedNightOrder(deck){
 const has=new Set(deck);
 return DEFAULT_PHASES.filter(phase=>{
  if(phase==='COPIED_HELPER'||phase==='COPIED_NIGHT_GIRL')return false;
  if(phase==='SCORPIONS')return has.has('SCORPION')||has.has('SCORPIONESS');
  return has.has(phase);
 });
}
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const fail=()=>{throw new GameError('INVALID_GAME_ACTION');};
const shuffle=(xs,random)=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const activeIds=(s,connected)=>s.seats.filter(id=>!connected||connected.includes(id));
function canStart(room) {
 const n=room.players.filter(p=>p.connected).length;
 return n>=4&&n<=16&&n===room.players.length;
}
function createSetupSession(round,room){
 if(!canStart(room))throw new GameError('NOT_READY');
 return {status:STATUS.ACTIVE,phase:'SETUP',round,
  seats:room.players.map(p=>p.id),selectedCards:[]};
}
function toggleSetupCard(session,player,cardKey){
 if(session.phase!=='SETUP')throw new GameError('INVALID_GAME_ACTION');
 const card=selectionCards(session.seats.length).find(item=>item.key===cardKey);
 if(!card)throw new GameError('INVALID_CARD');
 const existing=session.selectedCards.indexOf(cardKey);
 if(existing>=0)session.selectedCards.splice(existing,1);
 else {
  if(session.selectedCards.length>=session.seats.length+3)throw new GameError('INVALID_ASSIGNMENT');
  session.selectedCards.push(cardKey);
 }
}
function confirmSetup(session,room,random=Math.random,now=Date.now()){
 if(session.phase!=='SETUP')throw new GameError('INVALID_GAME_ACTION');
 const cards=selectionCards(session.seats.length);
 const selected=session.selectedCards.map(key=>cards.find(card=>card.key===key));
 if(selected.some(card=>!card)||new Set(session.selectedCards).size!==selected.length)
   throw new GameError('INVALID_ASSIGNMENT');
 const deck=selected.map(card=>card.roleId);
 if(!validateDeck(deck,session.seats.length))throw new GameError('INVALID_ASSIGNMENT');
 if(!session.seats.every(id=>room.players.some(p=>p.id===id&&p.connected)))
   throw new GameError('NOT_READY');
 return createSession(session.round,random,{...room,werewolfRoleDeck:deck},now);
}
const roleOfCard=(s,cardId)=>s.cards[cardId]?.copyRole||s.cards[cardId]?.role;
const roleNow=(s,id)=>roleOfCard(s,s.assignments[id]);
const affiliation=role=>role==='MIMIC'?'VILLAGE':byId[role]?.team||'VILLAGE';
const startRole=(s,id)=>s.original[id];
const copiedRole=(s,id)=>startRole(s,id)==='MIMIC' ? s.cards[s.startingCards[id]]?.copyRole : null;
const startEffective=(s,id)=>copiedRole(s,id)||startRole(s,id);
const startedAs=(s,id,role)=>startEffective(s,id)===role;
const teamMembers=(s)=>s.seats.filter(id=>['SCORPION','SCORPIONESS'].includes(startEffective(s,id)));
const observe=(s,id,phase,seen,description,location)=>{(s.observations[id]??=[]).push({phase,seen,description,...(location||{})});};
const record=(s,text,details={})=>s.log.push({index:s.log.length+1,text,...details});
function makeCue(s,id,now) {s.cue={id,at:now,sequence:(s.cue?.sequence||0)+1};}
function createSession(round,random=Math.random,room,now=Date.now()){
 if(!canStart(room))throw new GameError('NOT_READY');
 const players=room.players.filter(p=>p.connected);
 const seats=players.map(p=>p.id);
 const shuffled=shuffle(room.werewolfRoleDeck,random);
 const variants={};
 const cards=Object.fromEntries(shuffled.map((role,i)=>{
  const variant=variants[role]||0;
  variants[role]=variant+1;
  return ['card'+i,{id:'card'+i,role,copyRole:null,variant}];
 }));
 const startingCards=Object.fromEntries(seats.map((id,i)=>[id,'card'+i]));
 const original=Object.fromEntries(seats.map((id,i)=>[id,shuffled[i]]));
 return {status:STATUS.ACTIVE,round,phase:'REVEAL',step:0,phaseStartedAt:now,phaseOpensAt:now,revealAt:now+REVEAL_MIN_MS,
  deadline:now+REVEAL_TIMEOUT_MS,seats,startingCards,assignments:{...startingCards},original,
  center:shuffled.slice(seats.length).map((_,i)=>'card'+(seats.length+i)),cards,deck:[...room.werewolfRoleDeck],
  ready:{},voteReady:{},votes:{},actions:{},observations:Object.fromEntries(seats.map(id=>[id,[]])),
  log:[],cue:{id:'reveal_role',at:now,sequence:1},warnings:{},winner:null,eliminated:[],
  resultVotes:null,finalRoles:null};
}
const currentRole=s=>s.phase==='NIGHT'?s.nightOrder?.[s.step]||null:null;
function startNightStep(s,now){
 const role=currentRole(s),opening=OPEN_CUES[role],closing=CLOSE_CUES[role];
 s.phaseStartedAt=now;
 s.phaseOpensAt=now+(opening?cueDuration(opening)+AUDIO_MARGIN_MS:0);
 s.deadline=s.phaseOpensAt+NIGHT_STEP_MS;
 // Finish the closing announcement before the authoritative phase deadline.
 s.closeCueAt=s.deadline-Math.max(3000,cueDuration(closing,1600)+AUDIO_MARGIN_MS);
 s.closingIssued=false;
 enterStep(s);
 if(opening&&!role.startsWith('COPIED_'))makeCue(s,opening,now);
}
function enterNight(s,now){
 s.phase='NIGHT';s.step=0;s.nightOrder=selectedNightOrder(s.deck);
 s.phaseStartedAt=now;s.introPending=true;
 s.firstCueAt=now+cueDuration('night_start')+AUDIO_MARGIN_MS;
 // Don't allow actions before both the intro and the first role announcement finish.
 const first=OPEN_CUES[s.nightOrder[0]];
 s.phaseOpensAt=s.firstCueAt+cueDuration(first)+AUDIO_MARGIN_MS;
 s.deadline=s.phaseOpensAt+NIGHT_STEP_MS;
 s.closeCueAt=s.deadline-Math.max(3000,cueDuration(CLOSE_CUES[s.nightOrder[0]],1600)+AUDIO_MARGIN_MS);
 s.closingIssued=false;
 makeCue(s,'night_start',now);
 record(s,'بدأت الليلة، وأُخفيت جميع البطاقات.');
}
function enterStep(s){
 const role=currentRole(s);
 if(role==='COPIED_HELPER') for(const id of s.seats.filter(id=>startRole(s,id)==='MIMIC'&&copiedRole(s,id)==='MINION'))
   observe(s,id,role,teamMembers(s),'العقارب الذين بدأوا الليلة');
 if(role==='SCORPIONS')for(const id of teamMembers(s))
   observe(s,id,role,teamMembers(s).filter(other=>other!==id),'العقارب الذين استيقظوا معك');
 if(role==='MINION')for(const id of s.seats.filter(id=>startRole(s,id)==='MINION'))
   observe(s,id,role,teamMembers(s),'العقارب');
 if(role==='MASON')for(const id of s.seats.filter(id=>startedAs(s,id,'MASON')))
   observe(s,id,role,s.seats.filter(other=>other!==id&&startedAs(s,other,'MASON')),'الصحاب');
 if(role==='INSOMNIAC')for(const id of s.seats.filter(id=>startRole(s,id)==='INSOMNIAC'))
   observe(s,id,role,{role:roleNow(s,id),changed:roleNow(s,id)!==startRole(s,id)},'بطاقتك آخر الليل',
     {target:id,cardVariant:s.cards[s.assignments[id]]?.variant||0});
 if(role==='COPIED_NIGHT_GIRL')for(const id of s.seats.filter(id=>startRole(s,id)==='MIMIC'&&copiedRole(s,id)==='INSOMNIAC'))
   observe(s,id,role,{role:roleNow(s,id),changed:roleNow(s,id)!==startEffective(s,id)},'بطاقة المقلّد آخر الليل',
     {target:id,cardVariant:s.cards[s.assignments[id]]?.variant||0});
}
function enterDiscussion(s,now) {
 s.phase='DISCUSSION';s.phaseStartedAt=now;s.discussionStartAt=now+cueDuration('dawn')+AUDIO_MARGIN_MS;
 s.phaseOpensAt=s.discussionStartAt;s.deadline=s.discussionStartAt+DISCUSSION_MS;
 makeCue(s,'dawn',now);record(s,'طلع الفجر وبدأ النقاش.');
}
function enterVoting(s,now,early=false) {
 s.phase='VOTING';s.phaseStartedAt=now;s.voteOpensAt=now+cueDuration(early?'vote_early':'vote_now')+AUDIO_MARGIN_MS;
 s.phaseOpensAt=s.voteOpensAt;s.deadline=s.voteOpensAt+VOTE_MS;
 makeCue(s,early?'vote_early':'vote_now',now);record(s,'بدأ التصويت السري.');
}
function swapPlayers(s,a,b,actor){[s.assignments[a],s.assignments[b]]=[s.assignments[b],s.assignments[a]];
 record(s,'تبديل بطاقتين بين لاعبين.',{actor,targets:[a,b]});}
function swapCenter(s,id,number){[s.assignments[id],s.center[number]]=[s.center[number],s.assignments[id]];
 record(s,'تبديل بطاقة لاعب مع بطاقة من الوسط.',{actor:id,centerIndices:[number]});}
function applyAbility(s,player,role,payload,phase,random=Math.random){
 const id=player.id,target=payload.target,second=payload.second;
 const playerIds=s.seats;
 const key=phase+':'+id;
 if(own(s.actions,key))fail();
 const other=playerIds.includes(target)&&target!==id;
 const both=other&&playerIds.includes(second)&&second!==id&&target!==second;
 const middle=n=>Number.isInteger(n)&&n>=0&&n<3;
 if(role==='SEER'){
  if(middle(target)&&middle(second)&&target!==second) {
   observe(s,id,phase,[roleOfCard(s,s.center[target]),roleOfCard(s,s.center[second])],'بطاقتان من الوسط',
     {centerIndices:[target,second],cardVariants:[s.cards[s.center[target]]?.variant||0,s.cards[s.center[second]]?.variant||0]});
   record(s,'العرّافة فحصت بطاقتين من الوسط.',{actor:id,centerIndices:[target,second]});
  }else if(other&&second===undefined){
   observe(s,id,phase,roleNow(s,target),'بطاقة اللاعب المختار',{target,cardVariant:s.cards[s.assignments[target]]?.variant||0});
   record(s,'العرّافة فحصت بطاقة لاعب.',{actor:id,targets:[target]});
  }else throw new GameError('INVALID_CARD');
 }else if(role==='ROBBER'){
  if(payload.skip!==true){
   if(!other)throw new GameError('INVALID_CARD');
   swapPlayers(s,id,target,id);observe(s,id,phase,roleNow(s,id),'البطاقة التي أخذتها',
     {target:id,cardVariant:s.cards[s.assignments[id]]?.variant||0});
  }
  else record(s,'الحرامي تجاوز التبديل.',{actor:id});
 }else if(role==='TROUBLEMAKER'){
  if(payload.skip!==true){
   if(!both)throw new GameError('INVALID_CARD');
   swapPlayers(s,target,second,id);
  }
  else record(s,'القلّاب تجاوز التبديل.',{actor:id});
 }else if(role==='DRUNK'){
  if(!middle(target))throw new GameError('INVALID_CARD');
  swapCenter(s,id,target);
 }else fail();
 s.actions[key]={done:true};return true;
}
function action(s,player,payload={},random=Math.random,connected,now=Date.now()){
 if(!s.seats.includes(player.id))throw new GameError('UNAUTHORIZED');
 if(s.phase==='REVEAL'){
  if(payload.action!=='ready'||s.ready[player.id])fail();
  s.ready[player.id]=true;
  if(s.seats.every(id=>s.ready[id])&&now>=s.revealAt)enterNight(s,now);
  return;
 }
 if(s.phase==='DISCUSSION'){
  if(now<s.discussionStartAt)throw new GameError('NOT_READY');
  if(payload.action!=='ready-vote'||s.voteReady[player.id])fail();
  s.voteReady[player.id]=true;
  if(activeIds(s,connected).every(id=>s.voteReady[id]))enterVoting(s,now,true);
  return;
 }
 if(s.phase==='VOTING'&&payload.action==='vote')return vote(s,player,payload.target,connected,now);
 if(s.phase!=='NIGHT')fail();
 if(now<s.phaseOpensAt)throw new GameError('NOT_READY');
 const phase=currentRole(s),id=player.id,base=startRole(s,id),effective=startEffective(s,id);
 const phaseKey=phase+':'+id;
 if(own(s.actions,phaseKey))fail();
 if(phase==='MIMIC'){
  if(base!=='MIMIC')throw new GameError('UNAUTHORIZED');
  if(!copiedRole(s,id)){
   if(!s.seats.includes(payload.target)||payload.target===id)throw new GameError('INVALID_CARD');
   const copied=startRole(s,payload.target);
   if(copied==='MIMIC')throw new GameError('INVALID_CARD');
   s.cards[s.startingCards[id]].copyRole=copied;
   // The mimic may unlock a *private* follow-up turn, but only when that
   // specific ability was actually copied. No unused phases run.
   if(copied==='MINION'&&!s.nightOrder.includes('COPIED_HELPER'))
     s.nightOrder.splice(s.step+1,0,'COPIED_HELPER');
   if(copied==='INSOMNIAC'&&!s.nightOrder.includes('COPIED_NIGHT_GIRL'))
     s.nightOrder.push('COPIED_NIGHT_GIRL');
   observe(s,id,phase,copied,'الدور الذي قلدته',
     {target:payload.target,cardVariant:s.cards[s.startingCards[payload.target]]?.variant||0});
   record(s,'المقلّد نسخ دور بطاقة لاعب.',{actor:id,targets:[payload.target]});
   if(!['SEER','ROBBER','TROUBLEMAKER','DRUNK'].includes(copied))s.actions[phaseKey]={done:true};
  }else {
   if(!['SEER','ROBBER','TROUBLEMAKER','DRUNK'].includes(effective))fail();
   applyAbility(s,player,effective,payload,phase,random);
  }
  return;
 }
 if(phase==='SCORPIONS'){
  if(!['SCORPION','SCORPIONESS'].includes(effective)||!startedAs(s,id,effective))throw new GameError('UNAUTHORIZED');
  const group=teamMembers(s);
  if(group.length===1){
   if(effective==='SCORPION'){
    if(!Number.isInteger(payload.target)||payload.target<0||payload.target>2)throw new GameError('INVALID_CARD');
    observe(s,id,phase,roleOfCard(s,s.center[payload.target]),'بطاقة من الوسط',
      {centerIndices:[payload.target],cardVariants:[s.cards[s.center[payload.target]]?.variant||0]});
    record(s,'العقرب الوحيد فحص بطاقة من الوسط.',{actor:id,centerIndices:[payload.target]});
   } else {
    if(!Number.isInteger(payload.target)||!Number.isInteger(payload.second)||
       payload.target<0||payload.target>2||payload.second<0||payload.second>2||payload.target===payload.second)
      throw new GameError('INVALID_CARD');
    const a=affiliation(roleOfCard(s,s.center[payload.target]));
    const b=affiliation(roleOfCard(s,s.center[payload.second]));
    observe(s,id,phase,a===b?'البطاقتان من نفس الفريق':'البطاقتان من فريقين مختلفين','نتيجة العقربة — هل بطاقتا الوسط من نفس الفريق؟');
    record(s,'العقربة قارنت فريقي بطاقتين من الوسط.',{actor:id,centerIndices:[payload.target,payload.second]});
   }
  }
  s.actions[phaseKey]={done:true};return;
 }
 if(phase==='MINION'&&base==='MINION'||phase==='MASON'&&effective==='MASON'||
    phase==='INSOMNIAC'&&base==='INSOMNIAC'||phase==='COPIED_HELPER'&&base==='MIMIC'&&effective==='MINION'||
    phase==='COPIED_NIGHT_GIRL'&&base==='MIMIC'&&effective==='INSOMNIAC'){
   if(payload.action!=='ack')fail();
   s.actions[phaseKey]={done:true};return;
 }
 if(effective!==phase||base==='MIMIC')throw new GameError('UNAUTHORIZED');
 if(['SEER','ROBBER','TROUBLEMAKER','DRUNK'].includes(phase)){
  applyAbility(s,player,phase,payload,phase,random);return;
 }
 throw new GameError('UNAUTHORIZED');
}
function automaticDrunks(s,phase,random){
 for(const id of s.seats){
  const role=startEffective(s,id);
  const mandatory=(phase==='DRUNK'&&startRole(s,id)==='DRUNK')||(phase==='MIMIC'&&startRole(s,id)==='MIMIC'&&role==='DRUNK');
  const key=phase+':'+id;
  if(mandatory&&!own(s.actions,key)){swapCenter(s,id,Math.floor(random()*3));s.actions[key]={timeout:true};}
 }
}
function resolve(s,now){
 const tally={};
 for(const target of Object.values(s.votes))tally[target]=(tally[target]||0)+1;
 const highest=Math.max(0,...Object.values(tally));
 const eliminated=new Set(highest<2?[]:Object.keys(tally).filter(id=>tally[id]===highest));
 let change=true;
 while(change){
  change=false;
  for(const id of [...eliminated]){
   if(roleNow(s,id)==='HUNTER'&&s.votes[id]&&!eliminated.has(s.votes[id])){
    eliminated.add(s.votes[id]);change=true;
   }
  }
 }
 const scorpions=s.seats.filter(id=>['SCORPION','SCORPIONESS'].includes(roleNow(s,id)));
 const scorpionKilled=[...eliminated].some(id=>scorpions.includes(id));
 const tannerKilled=[...eliminated].some(id=>roleNow(s,id)==='TANNER');
 const helper=s.seats.filter(id=>roleNow(s,id)==='MINION');
 let winner='NONE';
 if(tannerKilled)winner=scorpionKilled?'TANNER_AND_VILLAGE':'TANNER';
 else if(scorpionKilled)winner='VILLAGE';
 else if(scorpions.length)winner='SCORPIONS';
 else if(helper.length && helper.some(id=>!eliminated.has(id))&&[...eliminated].some(id=>!helper.includes(id)))winner='SCORPIONS';
 else if(!eliminated.size)winner='VILLAGE';
 s.winner=winner;s.eliminated=[...eliminated];s.finalRoles=Object.fromEntries(s.seats.map(id=>[id,roleNow(s,id)]));
 s.resultVotes=Object.fromEntries(s.seats.map(id=>[id,s.votes[id]||null]));
 s.phase='RESULT';s.status=STATUS.FINISHED;s.deadline=now;
 makeCue(s,'reveal_results',now);record(s,'انكشف التصويت والبطاقات النهائية.');
}
function vote(s,player,target,connected,now=Date.now()){
 if(s.phase!=='VOTING'||own(s.votes,player.id))fail();
 if(now<s.voteOpensAt)throw new GameError('NOT_READY');
 if(!s.seats.includes(target)||target===player.id)throw new GameError('INVALID_CARD');
 s.votes[player.id]=target;
 if(activeIds(s,connected).every(id=>own(s.votes,id)))resolve(s,now);
}
function tick(s,now=Date.now(),random=Math.random,connected){
 let changed=false;
 for(let guard=0;guard<40&&s.status===STATUS.ACTIVE;guard++){
  if(s.phase==='NIGHT'){
   if(s.introPending&&now>=s.firstCueAt){
    s.introPending=false;
    startNightStep(s,s.firstCueAt);
    changed=true;
   }
   if(!s.introPending&&!s.closingIssued&&now>=s.closeCueAt&&now<s.deadline){
    s.closingIssued=true;
    const close=CLOSE_CUES[currentRole(s)];
    if(close&&!currentRole(s)?.startsWith('COPIED_')){makeCue(s,close,now);changed=true;}
   }
  }
  const ready=s.phase==='REVEAL'&&now>=s.revealAt&&s.seats.every(id=>s.ready[id]);
  if(!ready&&now<s.deadline)break;
  const edge=ready?Math.min(now,s.deadline):s.deadline;
  if(s.phase==='REVEAL')enterNight(s,edge);
  else if(s.phase==='NIGHT'){
   automaticDrunks(s,currentRole(s),random);
   s.step++;
   if(s.step>=s.nightOrder.length)enterDiscussion(s,edge);
   else startNightStep(s,edge);
  }else if(s.phase==='DISCUSSION')enterVoting(s,edge);
  else if(s.phase==='VOTING')resolve(s,edge);
  else break;
  changed=true;
 }
 if(s.phase==='DISCUSSION'){
  const remaining=s.deadline-now;
  for(const [limit,id] of [[60000,'one_minute_left'],[30000,'thirty_seconds_left']]){
   if(remaining<=limit&&!s.warnings[id]){s.warnings[id]=true;makeCue(s,id,now);changed=true;}
  }
 }
 return changed;
}
function advance(s,connected,now=Date.now(),random=Math.random){
 // Legacy host action cannot skip the synchronized discussion/night timer.
 if(now<s.deadline)throw new GameError('NOT_READY');
 return tick(s,now,random,connected);
}
function serialize(s,viewer,room){
 if(s.phase==='SETUP')return {werewolf:{
  phase:'SETUP',round:s.round,seats:[...s.seats],selectedCards:[...s.selectedCards],
  requiredCards:s.seats.length+3,playerCount:s.seats.length,
  // No role assignments exist before the host confirms this selection.
 }};
 const id=viewer.id;
 const acting=s.phase==='NIGHT'&&(
   currentRole(s)==='MIMIC'&&startRole(s,id)==='MIMIC'||
   currentRole(s)==='SCORPIONS'&&['SCORPION','SCORPIONESS'].includes(startEffective(s,id))||
   currentRole(s)==='COPIED_HELPER'&&startRole(s,id)==='MIMIC'&&copiedRole(s,id)==='MINION'||
   currentRole(s)==='COPIED_NIGHT_GIRL'&&startRole(s,id)==='MIMIC'&&copiedRole(s,id)==='INSOMNIAC'||
   currentRole(s)==='MINION'&&startRole(s,id)==='MINION'||
   currentRole(s)==='MASON'&&startedAs(s,id,'MASON')||
   currentRole(s)==='INSOMNIAC'&&startRole(s,id)==='INSOMNIAC'||
   ['SEER','ROBBER','TROUBLEMAKER','DRUNK'].includes(currentRole(s))&&startRole(s,id)===currentRole(s)
 );
 const obs=s.observations[id]||[];
 const phase=currentRole(s);
 return {werewolf:{
   phase:s.phase,step:s.step,
   currentRole:phase?.startsWith('COPIED_')&&!acting?'PRIVATE_ACTION':phase,
   round:s.round,phaseStartedAt:s.phaseStartedAt,
   phaseOpensAt:s.phaseOpensAt,discussionStartAt:s.discussionStartAt,voteOpensAt:s.voteOpensAt,deadline:s.deadline,
   seats:[...s.seats],centerCount:3,cue:s.cue,serverNow:Date.now(),
   role:startRole(s,id),roleName:byId[startRole(s,id)]?.name,
   roleArtVariant:s.cards[s.startingCards[id]]?.variant||0,
   copiedRole:copiedRole(s,id),viewerAction:s.actions[phase+':'+id]||null,
   privateObservation:s.phase==='NIGHT'?obs.filter(o=>o.phase===phase):[],
   nightMemory:['DISCUSSION','VOTING','RESULT'].includes(s.phase)?obs:[],
   isActor:Boolean(acting),acted:Boolean(s.actions[phase+':'+id]),
   revealReady:Boolean(s.ready[id]),revealMinAt:s.revealAt,
   readyToVote:Boolean(s.voteReady[id]),voted:own(s.votes,id),
   partnerIds:s.phase==='NIGHT'&&phase==='SCORPIONS'&&acting?teamMembers(s).filter(other=>other!==id):undefined,
   winner:s.winner,eliminated:s.phase==='RESULT'?s.eliminated:undefined,
   assignments:s.phase==='RESULT'?s.finalRoles:undefined,
   assignmentVariants:s.phase==='RESULT'?Object.fromEntries(s.seats.map(pid=>[pid,s.cards[s.assignments[pid]]?.variant||0])):undefined,
   center:s.phase==='RESULT'?s.center.map(card=>roleOfCard(s,card)):undefined,
   centerVariants:s.phase==='RESULT'?s.center.map(card=>s.cards[card]?.variant||0):undefined,
   votes:s.phase==='RESULT'?s.resultVotes:undefined,
   recap:s.phase==='RESULT'?s.log:undefined,
   playerCount:s.seats.length,
 }};
}
module.exports={metadata,roles,validateDeck,selectionCards,canStart,createSetupSession,toggleSetupCard,
 confirmSetup,createSession,currentRole,action,tick,advance,vote,serialize,resolve,roleNow};
