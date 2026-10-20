// Stable game roles. Artwork is mapped to the user's local PNGs in
// mobile/constants/scorpionAssets.js; never use role images for public card backs.
const roles = Object.freeze([
 {id:'MIMIC',name:'المقلّد',team:'COPY',max:1,ability:'ينسخ بطاقة لاعب ويستخدم قدرته حسب توقيتها.',cue:'copycat',art:'01-muqallid.png'},
 {id:'SCORPION',name:'العقرب',team:'SCORPIONS',max:1,ability:'يتعرّف على شركائه، وإن كان وحده يرى بطاقة من الوسط.',cue:'scorpions',art:'02-aqrab.png'},
 {id:'SCORPIONESS',name:'العقربة',team:'SCORPIONS',max:1,ability:'إذا ما كان معك عقرب ثاني: اختاري بطاقتين مختلفتين من وسط الطاولة. بتعرفي فقط إذا كانوا من نفس الفريق أو فريقين مختلفين؛ ما بتنكشف أدوارهم وما بتتبدّل البطاقات. وإذا معك عقرب ثاني، بتتعرفوا على بعض.',cue:'scorpions',art:'03-aqraba.png'},
 {id:'MINION',name:'المساعد',team:'SCORPIONS',max:1,ability:'يعرف العقارب ولا يعرفون هويته.',cue:'helper',art:'04-musaed.png'},
 {id:'MASON',name:'الصحاب',team:'VILLAGE',max:2,ability:'الصحاب يتعرّفون على بعضهم ليلة اللعب.',cue:'companions',art:'05-sahab-1.png'},
 {id:'SEER',name:'العرّافة',team:'VILLAGE',max:1,ability:'تشوف بطاقة لاعب أو بطاقتين من الوسط.',cue:'seer',art:'07-arrafa.png'},
 {id:'ROBBER',name:'الحرامي',team:'VILLAGE',max:1,ability:'يبدّل بطاقته مع لاعب ويرى ما أخذ؛ ممكن يتجاوز.',cue:'robber',art:'08-harami.png'},
 {id:'TROUBLEMAKER',name:'القلّاب',team:'VILLAGE',max:1,ability:'يبدّل بطاقتين للاعبين آخرين دون رؤيتهما.',cue:'troublemaker',art:'09-qallab.png'},
 {id:'DRUNK',name:'السكران',team:'VILLAGE',max:1,ability:'يبدّل بطاقته مع بطاقة من الوسط دون رؤيتها.',cue:'drunk',art:'10-sakran.png'},
 {id:'INSOMNIAC',name:'بنت الليل',team:'VILLAGE',max:1,ability:'تفحص بطاقتها في آخر الليل وتشوف إذا تغيّرت.',cue:'night_girl',art:'11-bint-alleil.png'},
 {id:'VILLAGER',name:'المواطن',team:'VILLAGE',max:3,ability:'من أهل الحارة، ليس له حركة ليلية.',cue:null,art:'12-muwatin-1.png'},
 {id:'HUNTER',name:'الفزّاع',team:'VILLAGE',max:1,ability:'إذا طلع من اللعبة، اللاعب اللي صوّت له يطلع معه.',cue:null,art:'15-fazza.png'},
 {id:'TANNER',name:'كبش الفدا',team:'INDEPENDENT',max:1,ability:'يفوز إذا تم إقصاؤه في التصويت النهائي.',cue:null,art:'16-kabsh-alfida.png'},
].map(role=>Object.freeze({
 ...role,
 timing:role.id==='MIMIC'?'FIRST':role.id==='INSOMNIAC'?'LATE':role.cue?'NIGHT':'NO_ACTION',
 cueIds:role.cue?Object.freeze({open:role.cue+'_open',close:role.cue+'_close'}):null,
})));
const byId=Object.fromEntries(roles.map(r=>[r.id,r]));
const DEFAULT_PHASES=Object.freeze(['MIMIC','COPIED_HELPER','SCORPIONS','MINION','MASON','SEER','ROBBER','TROUBLEMAKER','DRUNK','INSOMNIAC','COPIED_NIGHT_GIRL']);
// Every tile in the setup screen is a real selectable card, not a counter.
// Unique IDs let a second click remove that exact card, including duplicate
// villager and companion cards.
function selectionCards(playerCount) {
 const out=[];
 for(const role of roles) {
  const copies=role.max;
  for(let variant=0;variant<copies;variant++)out.push({
   key:role.id+':'+variant,roleId:role.id,variant,
  });
 }
 return out;
}
function validateDeck(deck,n) {
 if(!Array.isArray(deck)||deck.length!==n+3)return false;
 const counts={};
 for(const id of deck) {if(!byId[id])return false;counts[id]=(counts[id]||0)+1;if(counts[id]>byId[id].max)return false;}
 return Boolean((counts.SCORPION||0)+(counts.SCORPIONESS||0)) && (!counts.MASON||counts.MASON===2);
}
module.exports={roles,byId,DEFAULT_PHASES,validateDeck,selectionCards};
