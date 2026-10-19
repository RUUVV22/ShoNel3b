// Centralized ElevenLabs-ready metadata; audio files are intentionally NOT integrated.
// All cue text is metadata, never displayed as a substitute for missing playback.
const scripts = {
 reveal_role:['يا أهل الحارة، كل واحد يشوف بطاقته ويحفظ دوره… وخليها سر بينك وبين حالك.','REVEAL'],
 night_start:['الكل شاف بطاقته؟ يلا، سكّروا عيونكم… وخلّينا نبلّش ليلة العقارب.','NIGHT'],
 copycat_open:['يا مقلّد، افتح عيونك… اختار لاعب واتبع التعليمات اللي على شاشتك.','MIMIC'],
 copycat_close:['يا مقلّد، سكّر عيونك.','MIMIC'],
 scorpions_open:['يا عقرب، ويا عقربة… افتحوا عيونكم. تعرّفوا على بعض، وإذا طلع واحد منكم لحاله، يتبع التعليمات اللي على شاشته.','SCORPIONS'],
 scorpions_close:['يا عقرب ويا عقربة، سكّروا عيونكم.','SCORPIONS'],
 helper_open:['يا مساعد، افتح عيونك… واعرف مين العقارب.','MINION'],
 helper_close:['يا مساعد، سكّر عيونك.','MINION'],
 companions_open:['يا صحاب، افتحوا عيونكم… وتعرّفوا على بعض.','MASON'],
 companions_close:['يا صحاب، سكّروا عيونكم.','MASON'],
 seer_open:['يا عرّافة، افتحي عيونك… شوفي بطاقة لاعب، أو بطاقتين من النص.','SEER'],
 seer_close:['يا عرّافة، سكّري عيونك.','SEER'],
 robber_open:['يا حرامي، افتح عيونك… بتقدر تبدّل بطاقتك مع لاعب وتشوف شو أخدت.','ROBBER'],
 robber_close:['يا حرامي، سكّر عيونك.','ROBBER'],
 troublemaker_open:['يا قلّاب، افتح عيونك… بتقدر تبدّل بطاقتين بين لاعبين غيرك، بدون ما تشوفهم.','TROUBLEMAKER'],
 troublemaker_close:['يا قلّاب، سكّر عيونك.','TROUBLEMAKER'],
 drunk_open:['يا سكران، افتح عيونك… بدّل بطاقتك مع بطاقة من النص، بدون ما تشوفها.','DRUNK'],
 drunk_close:['يا سكران، سكّر عيونك.','DRUNK'],
 night_girl_open:['يا بنت الليل، افتحي عيونك… شوفي بطاقتك هسا، ضلّت نفسها ولا تغيّرت؟','INSOMNIAC'],
 night_girl_close:['يا بنت الليل، سكّري عيونك.','INSOMNIAC'],
 dawn:['يا أهل الحارة، افتحوا عيونكم! كل واحد يلمس بطاقته ويحرّكها شوي، بدون ما يقلبها. معكم خمس دقايق تحكوا وتكشفوا العقارب.','DISCUSSION'],
 one_minute_left:['ضلّت دقيقة واحدة… ركّزوا، مين حكايته مش راكبة؟','DISCUSSION'],
 thirty_seconds_left:['ضلّ ثلاثين ثانية… جهّزوا قراركم!','DISCUSSION'],
 vote_now:['خلص الوقت… صوّتوا هسّا!','VOTING'],
 vote_early:['الكل جاهز؟ يلا، صوّتوا هسّا!','VOTING'],
 reveal_results:['خلص التصويت… خلّينا نكشف البطاقات ونعرف الحقيقة!','RESULT'],
 copied_helper_open:['يا مقلّد المساعد، افتح عيونك وشوف مين العقارب.','COPIED_HELPER'],
 copied_helper_close:['يا مقلّد المساعد، سكّر عيونك.','COPIED_HELPER'],
 copied_night_girl_open:['يا مقلّد بنت الليل، افتح عيونك وشوف إذا بطاقتك تغيّرت.','COPIED_NIGHT_GIRL'],
 copied_night_girl_close:['يا مقلّد بنت الليل، سكّر عيونك.','COPIED_NIGHT_GIRL'],
};
const extra = {
 MIMIC:'المقلّد',MINION:'المساعد',MASON:'الصحاب',SEER:'العرّافة',ROBBER:'الحرامي',
 TROUBLEMAKER:'القلّاب',DRUNK:'السكران',INSOMNIAC:'بنت الليل',
 SCORPION:'العقرب',SCORPIONESS:'العقربة',VILLAGER:'المواطن',
 HUNTER:'الفزّاع',TANNER:'كبش الفدا',
};
// Private copied-role audio never broadcasts the role copied to the shared room.
for (const [id,name] of Object.entries(extra)) {
 scripts['copied_'+id.toLowerCase()+'_open'] = ['يا مقلّد، دور '+name+' صار إلك… اتبع التعليمات على شاشتك.','MIMIC'];
 scripts['copied_'+id.toLowerCase()+'_close'] = ['يا مقلّد، سكّر عيونك.','MIMIC'];
}
export const SCORPION_NARRATION = Object.freeze(Object.fromEntries(
 Object.entries(scripts).map(([id,[script,phase]])=>[id,Object.freeze({
  id,script,phase,assetPath:'assets/scorpion-narration/'+id+'.mp3',
  fallbackDurationMs: id.includes('open')?3500:id.includes('close')?1600:3800,
  scope:id.startsWith('copied_')?'private':'shared',
  waitBeforeAction:id.includes('open')||id==='night_start'||id==='reveal_role'
 })])
));
// Intended runtime policy: same-room host only; remote mode per-device opt in.
// Phase deadlines originate from the server, never from local audio duration.
export const SCORPION_AUDIO_MODES=Object.freeze({SAME_ROOM:'SAME_ROOM',REMOTE:'REMOTE'});
