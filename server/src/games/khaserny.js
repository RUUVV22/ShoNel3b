const {STATUS}=require('../game/constants');
const {GameError}=require('../game/errors');
const metadata={id:'KHASERNY',title:'خسّرني!',englishTitle:'Stump Me!',subtitle:'ست فئات، تحديات بلا حدود',description:'اختار الفئة، جاوب قبل ما يخلص الوقت، وتحدى الشلة',minPlayers:2,maxPlayers:20};
const categories=[
{id:'MOVIES',title:'أفلام ومسلسلات',emoji:'🎬',questions:[['شو اسم المدرسة في هاري بوتر؟','هوغوورتس'],['مين بطل فيلم تايتانيك؟','ليوناردو دي كابريو'],['شو اسم الأسد بطل فيلم ديزني الشهير؟','سيمبا']]},
{id:'MUSIC',title:'أغاني وموسيقى',emoji:'🎵',questions:[['شو اسم الآلة اللي فيها مفاتيح سوداء وبيضاء؟','البيانو'],['كم وتر في الجيتار التقليدي؟','ستة'],['شو اسم الإيقاع اللي يقسم الموسيقى؟','الميزان']]},
{id:'FOOD',title:'أكل وطبخ',emoji:'🍋',questions:[['شو المكون الأساسي للحمص؟','الحمص'],['من أي بلد أصل أكلة السوشي؟','اليابان'],['شو اسم الحلوى الأردنية الشهيرة بالجبنة والقطر؟','الكنافة']]},
{id:'PLACES',title:'بلدان وأماكن',emoji:'🌍',questions:[['شو عاصمة الأردن؟','عمّان'],['شو أكبر محيط بالعالم؟','المحيط الهادئ'],['في أي قارة تقع البرازيل؟','أمريكا الجنوبية']]},
{id:'SPORTS',title:'رياضة وألعاب',emoji:'🏆',questions:[['كم لاعب بفريق كرة القدم داخل الملعب؟','11'],['شو اسم القطعة اللي بتحمي الملك بالشطرنج؟','ما في قطعة محددة'],['كم حلقة في شعار الألعاب الأولمبية؟','خمسة']]},
{id:'RIDDLES',title:'ألغاز وسوالف',emoji:'💡',questions:[['إيش الشي اللي كل ما أخذت منه كبر؟','الحفرة'],['شي له أسنان وما بعض؟','المشط'],['شو الشي اللي بيكتب وما بيقرأ؟','القلم']]},
];
const canStart=room=>room.players.filter(p=>p.connected).length>=2&&room.players.length<=20;
function createSession(round,random,room){const ids=room.players.filter(p=>p.connected).map(p=>p.id);return {status:STATUS.ACTIVE,round,phase:'PICK',players:ids,turn:0,used:[],category:null,question:null,answer:null,judgments:[],scores:Object.fromEntries(ids.map(id=>[id,0])),winner:null};}
function act(s,player,payload){
  const current=s.players[s.turn%s.players.length];
  if(s.phase==='PICK'){
    if(player.id!==current)throw new GameError('NOT_YOUR_TURN');
    const category=categories.find(c=>c.id===payload.category);
    if(!category)throw new GameError('INVALID_GAME_ACTION');
    const remaining=category.questions.map((q,i)=>({q,i})).filter(x=>!s.used.includes(category.id+':'+x.i));
    const chosen=remaining[0]||{q:category.questions[0],i:0};
    s.used.push(category.id+':'+chosen.i);s.category=category.id;s.question=chosen.q[0];s.answer=chosen.q[1];s.phase='QUESTION';
  }else if(s.phase==='QUESTION'){
    if(player.id!==current)throw new GameError('NOT_YOUR_TURN');
    if(payload.action!=='reveal')throw new GameError('INVALID_GAME_ACTION');
    s.phase='JUDGE';
  }else if(s.phase==='JUDGE'){
    if(!['correct','incorrect'].includes(payload.action)||!s.players.includes(player.id)||player.id===current||s.judgments.some(j=>j.player===player.id))throw new GameError('INVALID_GAME_ACTION');
    s.judgments.push({player:player.id,correct:payload.action==='correct'});
    if(s.judgments.length>=s.players.length-1){
      const yes=s.judgments.filter(j=>j.correct).length;
      if(yes>s.judgments.length/2)s.scores[current]+=10;
      s.turn++;s.judgments=[];s.category=null;s.question=null;s.answer=null;
      s.phase=s.turn>=s.players.length*3?'RESULT':'PICK';
      if(s.phase==='RESULT'){s.status=STATUS.FINISHED;const high=Math.max(...Object.values(s.scores));s.winner=s.players.filter(id=>s.scores[id]===high);}
    }
  }else throw new GameError('INVALID_GAME_ACTION');
}
function serialize(s,viewer){return {khaserny:{phase:s.phase,round:s.round,categories:categories.map(({id,title,emoji})=>({id,title,emoji})),
currentPlayerId:s.players[s.turn%s.players.length],turn:s.turn,question:s.question,category:s.category,
answer:s.phase==='JUDGE'||s.phase==='RESULT'?s.answer:null,judged:s.judgments.some(j=>j.player===viewer.id),
judgmentsCount:s.judgments.length,scores:s.scores,winner:s.winner}};}
module.exports={metadata,canStart,createSession,act,serialize,categories};
