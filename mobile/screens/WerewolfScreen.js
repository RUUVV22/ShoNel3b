import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Animated,ImageBackground,Platform,Pressable,ScrollView,StyleSheet,View,useWindowDimensions} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import {Ionicons} from '@expo/vector-icons';
import {ScreenContainer} from '../components/ScreenContainer';
import {ArabicText} from '../components/ArabicText';
import {PrimaryButton} from '../components/PrimaryButton';
import {CharacterAvatar} from '../components/CharacterAvatar';
import {useGame} from '../context/GameContext';
import {useRoundInputs} from '../hooks/useRoundInputs';
import {SCORPION_COURTYARD,getScorpionCardArt,getScorpionRole} from '../constants/scorpionAssets';
import {ScorpionPokerCard} from '../components/ScorpionPokerCard';
import {ScorpionAudioLayer} from '../components/ScorpionAudioLayer';
import {WerewolfRoleSetup} from '../components/WerewolfRoleSetup';
import {SCORPION_CARD_HEIGHT_PER_WIDTH} from '../constants/scorpionCards';
import {playScorpionSfx,stopScorpionSfx} from '../services/scorpionSfxPlayer';
import {SCORPION_AUDIO_MODES,SCORPION_NARRATION} from '../constants/scorpionNarration';
import {playScorpionCue} from '../services/scorpionAudio';
import {colors} from '../theme/colors';

const BOARD_RATIO=1672/941;
const TEMP_DEFAULTS=Object.freeze({first:null,vote:null});
const AnimatedPressable=Animated.createAnimatedComponent(Pressable);
const NIGHT_LABELS={MIMIC:'المقلّد',COPIED_HELPER:'معلومات المساعد',SCORPIONS:'العقارب',
 MINION:'المساعد',MASON:'الصحاب',SEER:'العرّافة',ROBBER:'الحرامي',TROUBLEMAKER:'القلّاب',
 DRUNK:'السكران',INSOMNIAC:'بنت الليل',COPIED_NIGHT_GIRL:'بنت الليل المقلّدة'};
const WINNER_LABELS={VILLAGE:'🏆 أهل الحارة فازوا!',SCORPIONS:'🏆 العقارب فازوا!',
 TANNER:'🏆 كبش الفدا فاز وحده!',TANNER_AND_VILLAGE:'🏆 أهل الحارة وكبش الفدا فازوا!',NONE:'ما في فائز هالجولة'};
function roleTitle(id){return getScorpionRole(id)?.name||'بطاقة مخفية';}
function Seat({player,index,count,size,onPress,selected,disabled,phase,ownSeat,resultRole,resultVariant,eliminated}) {
 const offset=useRef(new Animated.Value(0)).current;
 const dealt=useRef(new Animated.Value(phase==='REVEAL'?0:1)).current;
 const nudge=()=>{Animated.sequence([Animated.timing(offset,{toValue:-6,duration:100,useNativeDriver:true}),
  Animated.spring(offset,{toValue:0,useNativeDriver:true,friction:4})]).start();};
 // A staggered inner/outer ring prevents portrait cards from overlapping in
 // 15–20-player rooms, while small rooms retain one ring of seats.
 const twoRings=count>14;
 const outer=!twoRings||index%2===0;
 const ringCount=twoRings?(outer?Math.ceil(count/2):Math.floor(count/2)):count;
 const ringIndex=twoRings?Math.floor(index/2):index;
 const angle=-Math.PI/2+2*Math.PI*(ringIndex+(twoRings&&!outer?.5:0))/ringCount;
 const crowded=count>=14;
 const cardWidth=Math.max(22,Math.min(76,
   size.width/(count>15?20:count>10?16:count>6?12:9),
   (size.height*(crowded?.17:count>9?.20:.28)-(crowded?19:32))/SCORPION_CARD_HEIGHT_PER_WIDTH));
 const avatarWidth=crowded?Math.max(12,cardWidth*.46):Math.max(15,Math.min(26,cardWidth*.6));
 const labelSize=Math.max(8,Math.min(13,cardWidth*.23));
 const seatWidth=cardWidth+8;
 const seatHeight=avatarWidth+cardWidth*SCORPION_CARD_HEIGHT_PER_WIDTH+labelSize+7;
 const x=size.width*(.5+(twoRings?(outer?.355:.235):.31)*Math.cos(angle));
 // Keep both seating rings inside the illustrated courtyard.
 const y=size.height*(.5+(twoRings?(outer?.34:.18):.31)*Math.sin(angle));
 useEffect(()=>{
  if(phase==='REVEAL'){
   dealt.setValue(0);
   const animation=Animated.spring(dealt,{toValue:1,delay:650+index*45,
    friction:7,tension:110,useNativeDriver:true});
   animation.start();return()=>animation.stop();
  }
  dealt.setValue(1);
 },[phase,index,dealt]);
 const transform=[{
   translateX:dealt.interpolate({inputRange:[0,1],outputRange:[size.width*.5-x,0]}),
  },{
   translateY:dealt.interpolate({inputRange:[0,1],outputRange:[size.height*.5-y,0]}),
  },{scale:dealt.interpolate({inputRange:[0,1],outputRange:[.45,1]})}];
 return <AnimatedPressable accessibilityRole="button" accessibilityLabel={player.name+(selected?'، محدد':'')}
    hitSlop={8}
    onPress={phase==='DISCUSSION'?nudge:onPress} disabled={disabled&&phase!=='DISCUSSION'}
    style={[st.seat,{width:seatWidth,left:x-seatWidth/2,top:y-seatHeight/2,transform},
     selected&&st.selectedSeat,ownSeat&&st.ownSeat]}>
    <View style={[st.seatAvatar,{height:avatarWidth}]}><CharacterAvatar name={player.name} size={avatarWidth} /></View>
    <Animated.View style={{transform:[{translateY:offset}]}}>
      <ScorpionPokerCard roleId={resultRole} variant={resultVariant} faceUp={Boolean(resultRole)} width={cardWidth}/>
    </Animated.View>
    <ArabicText weight="bold" numberOfLines={1} adjustsFontSizeToFit
      style={[st.seatName,{fontSize:labelSize},!player.connected&&{opacity:.6}]}>{player.name}</ArabicText>
    {eliminated?<View style={st.eliminated}><ArabicText style={{color:colors.cream,fontSize:9}}>✕</ArabicText></View>:null}
 </AnimatedPressable>;
}
function Memory({observations,players}){
 if(!observations?.length)return <ArabicText style={st.infoText}>لسه ما في معلومات خاصة عندك.</ArabicText>;
 const playerName=id=>players.find(p=>p.id===id)?.name;
 const describe=value=>{
  if(Array.isArray(value))return value.length?value.map(v=>playerName(v)||roleTitle(v)).join('، '):'ما في حدا';
  if(typeof value==='object'&&value)return (value.changed?'تغيّرت':'ما تغيّرت')+' — '+roleTitle(value.role);
  return playerName(value)||roleTitle(value)||String(value);
 };
 return <View style={st.memory}>{observations.map((entry,i)=>
  <View key={i} style={st.memoryLine}>
   <ArabicText weight="bold" style={st.memoryTitle}>{entry.description}</ArabicText>
   <ArabicText style={st.memoryValue}>{describe(entry.seen)}</ArabicText>
  </View>)}</View>;
}
export function WerewolfScreen(){
 const {gameState:s,actions,busyAction,muted}=useGame();
 const {width,height}=useWindowDimensions();
 const game=s?.werewolf;
 const [now,setNow]=useState(Date.now());
 const [reveal,setReveal]=useState(false);
 const [revealPressedAt,setRevealPressedAt]=useState(0);
 const [memoryOpen,setMemoryOpen]=useState(false);
 const [audioMode,setAudioMode]=useState(SCORPION_AUDIO_MODES.SAME_ROOM);
 const [audioUnlocked,setAudioUnlocked]=useState(false);
 const [voteConfirm,setVoteConfirm]=useState(false);
 const [shuffled,setShuffled]=useState(false);
 const [audioAttempted,setAudioAttempted]=useState('');
 const serverOffsetRef=useRef(0);
 const sfxRoundRef=useRef(null);
 const sfxResultsRef=useRef(null);
 const scope=`${s?.roomId}:${game?.round}:${game?.phase}:${game?.step}:${game?.copiedRole}`;
 const {values,setField,reset,submitAndReset}=useRoundInputs(TEMP_DEFAULTS,scope);
 const players=(game?.seats||[]).map(id=>s?.players.find(p=>p.id===id)||{id,name:'لاعب',connected:false});
 const me=s?.players.find(p=>p.id===s?.currentPlayerId);
 const isHost=Boolean(me?.isHost);
 const sharedSfxAllowed=audioUnlocked&&!muted&&
  (audioMode===SCORPION_AUDIO_MODES.REMOTE||isHost);
 const isPortrait=height>width && width<900;
 const isBusy=busyAction==='game:action';
 const currentPhase=game?.currentRole;
 const activeRole=currentPhase==='MIMIC'&&game?.copiedRole?game.copiedRole:currentPhase;
 const isPairedScorpion=(game?.partnerIds?.length||0)>0;
 const observations=game?.privateObservation||[];
 const hasSidebar=width>height&&width>=640;
 const sidebarWidth=Math.round(Math.min(315,Math.max(215,width*.28)));
 const boardWidth=Math.floor(Math.min(width-(hasSidebar?sidebarWidth+32:18),(height-76)*BOARD_RATIO,1600));
 const boardHeight=boardWidth/BOARD_RATIO;
 const centerCardWidth=Math.max(25,Math.min(68,boardWidth*.064,boardHeight*.16/SCORPION_CARD_HEIGHT_PER_WIDTH));
 const centerCardHeight=centerCardWidth*SCORPION_CARD_HEIGHT_PER_WIDTH;
 const centerGap=Math.max(5,boardWidth*.012);
 const seatSize={width:boardWidth,height:boardHeight};
 const serverNow=now+serverOffsetRef.current;
 const countdownFrom=game?.phase==='DISCUSSION'&&game.discussionStartAt
  ?Math.max(serverNow,game.discussionStartAt)
  :game?.phase==='VOTING'&&game.voteOpensAt?Math.max(serverNow,game.voteOpensAt):serverNow;
 const remaining=Math.max(0,Math.ceil(((game?.deadline||now)-countdownFrom)/1000));
 const timeLabel=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(game?.serverNow)serverOffsetRef.current=game.serverNow-Date.now();},[game?.serverNow]);
 useEffect(()=>{
  if(Platform.OS==='web')return;
  let alive=true,previous=null;
  (async()=>{
   try {
    previous=await ScreenOrientation.getOrientationLockAsync();
    if(alive)await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
   } catch {}
  })();
  return ()=>{alive=false;if(previous!==null)ScreenOrientation.lockAsync(previous).catch(()=>{});
   else ScreenOrientation.unlockAsync().catch(()=>{});};
 },[]);
 useEffect(()=>{setReveal(false);setRevealPressedAt(0);setShuffled(false);setMemoryOpen(false);setVoteConfirm(false);reset();},[game?.round]);
 useEffect(()=>{if(game?.phase!=='VOTING')setVoteConfirm(false);},[game?.phase]);
 useEffect(()=>{
  if(game?.phase!=='REVEAL')return;
  const timer=setTimeout(()=>setShuffled(true),1250);
  return()=>clearTimeout(timer);
 },[game?.round,game?.phase]);
 useEffect(()=>{
  const cue=game?.cue;
  if(!cue||muted||!audioUnlocked)return;
  if(audioMode===SCORPION_AUDIO_MODES.SAME_ROOM&&!isHost)return;
  const token=cue.id+':'+cue.sequence;
  if(audioAttempted===token)return;
  setAudioAttempted(token);
  // Future recordings can be registered in the audio service by cue ID.
  playScorpionCue(cue,SCORPION_NARRATION[cue.id]).catch(()=>{});
 },[game?.cue?.id,game?.cue?.sequence,audioMode,isHost,muted,audioUnlocked]);
 useEffect(()=>{
  if(!audioUnlocked||muted||audioMode!==SCORPION_AUDIO_MODES.REMOTE||
    game?.phase!=='NIGHT'||!game?.isActor)return;
  let cueId=null;
  if(game.currentRole==='COPIED_HELPER')cueId='copied_helper_open';
  else if(game.currentRole==='COPIED_NIGHT_GIRL')cueId='copied_night_girl_open';
  else if(game.currentRole==='MIMIC'&&game.copiedRole)
    cueId='copied_'+game.copiedRole.toLowerCase()+'_open';
  if(cueId&&SCORPION_NARRATION[cueId])
    playScorpionCue({id:cueId,at:Date.now(),sequence:game.step},SCORPION_NARRATION[cueId]).catch(()=>{});
 },[game?.phase,game?.currentRole,game?.copiedRole,game?.isActor,audioMode,audioUnlocked,muted]);
 useEffect(()=>{
  if(!sharedSfxAllowed){stopScorpionSfx('courtyard_ambience');return;}
  playScorpionSfx('courtyard_ambience');
  return()=>stopScorpionSfx('courtyard_ambience');
 },[sharedSfxAllowed]);
 useEffect(()=>{
  if(!sharedSfxAllowed||!game||game.phase!=='REVEAL'||sfxRoundRef.current===game.round)return;
  sfxRoundRef.current=game.round;
  playScorpionSfx('shuffle_cards');
  const timers=[];
  const total=Math.min(5,game.seats?.length||0);
  for(let index=0;index<total;index++){
   timers.push(setTimeout(()=>playScorpionSfx('deal_card'),1500+index*190));
  }
  return()=>timers.forEach(clearTimeout);
 },[sharedSfxAllowed,game?.phase,game?.round,game?.seats?.length]);
 useEffect(()=>{
  if(!sharedSfxAllowed||!game||game.phase!=='RESULT'||sfxResultsRef.current===game.round)return;
  sfxResultsRef.current=game.round;
  // One public flip sound for the entire reveal, never one per player.
  playScorpionSfx('flip_card');
 },[sharedSfxAllowed,game?.phase,game?.round]);
 if(!game||!me)return null;
 const myId=me.id;
 const send=payload=>submitAndReset(()=>actions.gameAction(payload));
 const abilityAction=(target,second)=>send({action:'role',target,second});
 const waiting=game.acted||!game.isActor;
 const canChoose=game.phase==='NIGHT'&&game.isActor&&!game.acted&&!isBusy
  &&serverNow>=(game.phaseOpensAt||0);
 const requiresTwo=activeRole==='TROUBLEMAKER'||activeRole==='SCORPIONESS'&&currentPhase==='SCORPIONS'&&!isPairedScorpion;
 const seerCenter=activeRole==='SEER';
 const selectMiddle=index=>{
  if(!canChoose)return;
  if(currentPhase==='SCORPIONS'){
   if(activeRole==='SCORPIONESS'&&!isPairedScorpion){
    if(values.first===null)setField('first',index);
    else if(values.first!==index)abilityAction(values.first,index);
   }else if(activeRole==='SCORPION'&&!isPairedScorpion)abilityAction(index);
   return;
  }
  if(activeRole==='DRUNK')abilityAction(index);
  else if(seerCenter){
   if(values.first===null)setField('first',index);
   else if(values.first!==index)abilityAction(values.first,index);
  }
 };
 const selectPlayer=id=>{
  if(game.phase==='VOTING'&&!game.voted&&id!==myId&&!isBusy&&serverNow>=(game.voteOpensAt||0)){setField('vote',id);setVoteConfirm(false);return;}
  if(!canChoose||id===myId)return;
  if(currentPhase==='MIMIC'&&!game.copiedRole){abilityAction(id);return;}
  if(requiresTwo) {
   if(values.first===null)setField('first',id);
   else if(values.first!==id)abilityAction(values.first,id);
  }else if(['SEER','ROBBER'].includes(activeRole))abilityAction(id);
 };
 const canTargetPlayer=canChoose&&(
   currentPhase==='MIMIC'&&!game.copiedRole||
   activeRole==='SEER'||activeRole==='ROBBER'||activeRole==='TROUBLEMAKER');
 const selectableMiddle=canChoose&&(
   activeRole==='DRUNK'||activeRole==='SEER'||
   currentPhase==='SCORPIONS'&&!isPairedScorpion&&['SCORPION','SCORPIONESS'].includes(activeRole));
 const showPrivate=game.phase==='REVEAL'&&reveal||
   game.phase==='NIGHT'&&game.isActor||
   game.phase==='DISCUSSION'&&memoryOpen||
   game.phase==='VOTING'&&memoryOpen;
 const roleName=game.copiedRole?'المقلّد ← '+roleTitle(game.copiedRole):game.roleName;
 const startLandscape=async()=>{
  setAudioUnlocked(true);
  if(Platform.OS==='web') {
   try{await document.documentElement.requestFullscreen?.();}catch{}
   try{await window.screen.orientation.lock('landscape');}catch{}
  }
 };
 const themeTitle=game.phase==='REVEAL'?'اختاروا بطاقاتكم':game.phase==='NIGHT'?'الليل في الحارة':
  game.phase==='DISCUSSION'?'النهار • ناقشوا أصحابكم':game.phase==='VOTING'?'التصويت السري':'نتائج الليلة';
 if(isPortrait)return <ScreenContainer scroll={false} contentStyle={st.rotateScreen}>
   <Ionicons name="phone-landscape-outline" size={72} color={colors.mustard}/>
   <ArabicText weight="extraBold" style={st.rotateTitle}>لفّ جهازك بالعرض</ArabicText>
   <ArabicText style={st.rotateText}>ليلة العقارب لعبة بطاولة أفقية؛ رح تشوف كل اللاعبين لما تلف الجهاز.</ArabicText>
   <PrimaryButton title="جرّب العرض الكامل" onPress={startLandscape}/>
 </ScreenContainer>;
 if(game.phase==='SETUP')return <ScreenContainer scroll={false} contentStyle={st.setupScreen}>
   <ScorpionAudioLayer/>
   <View style={st.setupHeader}>
     <ArabicText weight="extraBold" style={st.gameTitle}>ليلة العقارب • تحضير البطاقات</ArabicText>
     <ArabicText style={st.room}>الغرفة {s.roomId} • الجولة {game.round}</ArabicText>
     {isHost?<Pressable accessibilityRole="button" onPress={actions.returnToLobby} style={st.audioButton}>
       <ArabicText style={st.audioText}>الرجوع للغرفة</ArabicText>
     </Pressable>:null}
   </View>
   <WerewolfRoleSetup game={game} editable={isHost}
     busy={isBusy} onToggle={cardKey=>actions.gameAction({action:'toggle-card',cardKey})}
     onConfirm={()=>actions.gameAction({action:'confirm-cards'})}/>
 </ScreenContainer>;
 return <ScreenContainer contentStyle={st.screen}>
   <ScorpionAudioLayer />
   <View style={st.topRow}>
    <ArabicText weight="extraBold" style={st.gameTitle}>ليلة العقارب <ArabicText style={st.subTitle}>• {themeTitle}</ArabicText></ArabicText>
    <View style={st.topRight}>
     <ArabicText weight="extraBold" style={st.time}>{timeLabel}</ArabicText>
     <ArabicText style={st.room}>الغرفة {s.roomId} • الجولة {game.round}</ArabicText>
     {!audioUnlocked?<Pressable onPress={startLandscape} style={st.audioButton}><ArabicText style={st.audioText}>تفعيل الصوت</ArabicText></Pressable>:null}
     {audioUnlocked?<Pressable onPress={()=>setAudioMode(mode=>mode===SCORPION_AUDIO_MODES.SAME_ROOM?SCORPION_AUDIO_MODES.REMOTE:SCORPION_AUDIO_MODES.SAME_ROOM)}
       style={st.audioButton}><ArabicText style={st.audioText}>{audioMode===SCORPION_AUDIO_MODES.SAME_ROOM?'🔊 صوت المضيف':'🔊 الصوت لكل جهاز'}</ArabicText></Pressable>:null}
    </View>
   </View>
   <View style={hasSidebar?st.gameRow:st.gameStack}>
   <View style={[st.board,{width:boardWidth,height:boardHeight}]}>
     <ImageBackground source={SCORPION_COURTYARD} resizeMode="contain" style={st.boardBackground}>
      {game.phase==='NIGHT'?<View pointerEvents="none" style={st.nightShade}/>:null}
      {players.map((p,i)=><Seat key={p.id} player={p} index={i} count={players.length}
       size={seatSize} ownSeat={p.id===myId} selected={values.vote===p.id||values.first===p.id}
       disabled={game.phase==='VOTING'?(game.voted||p.id===myId||serverNow<(game.voteOpensAt||0)):!canTargetPlayer}
       phase={game.phase} resultRole={game.phase==='RESULT'?game.assignments?.[p.id]:null}
       resultVariant={game.assignmentVariants?.[p.id]||0}
       eliminated={game.phase==='RESULT'&&game.eliminated?.includes(p.id)}
       onPress={()=>selectPlayer(p.id)}/>)}
      <View style={[st.middleCards,{top:(boardHeight-centerCardHeight-6)/2,
        left:(boardWidth-3*(centerCardWidth+4)-centerGap*2)/2,
        gap:centerGap}]}>
       {[0,1,2].map(i=><Pressable key={i} accessibilityRole="button"
         accessibilityLabel={'بطاقة الوسط '+(i+1)} disabled={!selectableMiddle}
         onPress={()=>selectMiddle(i)}
         style={[st.centerCard,{width:centerCardWidth+4,height:centerCardHeight+4},
           values.first===i&&st.selectedCenter]}>
         <ScorpionPokerCard
           roleId={game.phase==='RESULT'?game.center?.[i]:null}
           variant={game.centerVariants?.[i]||0}
           faceUp={game.phase==='RESULT'} width={centerCardWidth}/>
       </Pressable>)}
      </View>
      {game.phase==='REVEAL'&&!shuffled?<View style={st.dealOverlay}><ArabicText weight="extraBold" style={st.dealText}>✦ الأوراق بتنخلط… ✦</ArabicText></View>:null}
     </ImageBackground>
   </View>
   <ScrollView nestedScrollEnabled style={[st.controlsViewport,
     hasSidebar?{width:sidebarWidth,maxHeight:boardHeight}:{width:'100%'}]}
     contentContainerStyle={st.controlsContent} showsVerticalScrollIndicator={false}>
   {game.phase==='REVEAL'?<View style={st.bottomPanel}>
      <View style={st.inlineInfo}>
        <ScorpionPokerCard roleId={game.role} variant={game.roleArtVariant}
          faceUp={reveal&&!game.revealReady}
          width={Math.min(96,Math.max(68,sidebarWidth*.32))} />
        {reveal&&!game.revealReady?<View style={st.inlineCopy}>
          <ArabicText weight="extraBold" style={st.roleText}>{roleName}</ArabicText>
          <ArabicText style={st.infoText}>{getScorpionRole(game.role)?.ability}</ArabicText>
        </View>:null}
      </View>
      {!reveal?<PrimaryButton compact title="افتح بطاقتي بسرية" onPress={()=>{
        setAudioUnlocked(true);setReveal(true);setRevealPressedAt(Date.now());
        if(!muted)playScorpionSfx('flip_card');
      }}/>:null}
      {reveal?<PrimaryButton compact title={game.revealReady?'أنا جاهز ✓':'حفظت دوري، جاهز'}
        disabled={game.revealReady||Date.now()-revealPressedAt<5000||isBusy}
        onPress={async()=>{const reply=await send({action:'ready'});if(reply?.ok)setReveal(false);}}/>:null}
      <ArabicText style={st.infoText}>{game.revealReady?'بنستنى باقي اللاعبين…':'بعد ما تشوف بطاقتك، تذكّر دورك وحافظ على سرّك.'}</ArabicText>
   </View>:null}
   {game.phase==='NIGHT'?<View style={st.bottomPanel}>
      {game.isActor?<><View style={st.inlineCopy}>
        <ArabicText weight="extraBold" style={st.roleText}>{roleName} • {NIGHT_LABELS[currentPhase]}</ArabicText>
        <ArabicText style={st.infoText}>{getScorpionRole(activeRole)?.ability||'شوف معلوماتك بسرية.'}</ArabicText>
       </View>
       {observations.length?<Memory observations={observations} players={players}/>:null}
       {!game.acted&&!isBusy?<ArabicText style={st.infoText}>
         {!canChoose&&serverNow<(game.phaseOpensAt||0)?'استنى انتهاء النداء أولاً…':
         currentPhase==='MIMIC'&&!game.copiedRole?'اضغط على بطاقة لاعب لتنسخ دوره.':
         selectableMiddle?'اختار البطاقة أو البطاقتين من وسط الطاولة.':
         canTargetPlayer?'اضغط على لاعبين بالطاولة حسب قدرتك.':
         'شوف معلوماتك، وبعدين أكد دورك.'}
       </ArabicText>:null}
       {canChoose&&!canTargetPlayer&&!selectableMiddle?
         <PrimaryButton compact title="تمام، سكّرت عيوني" onPress={()=>send({action:'ack'})} disabled={isBusy}/>:null}
       {canChoose&&['ROBBER','TROUBLEMAKER'].includes(activeRole)?
         <PrimaryButton compact variant="ghost" title="ما بدي أبدّل" disabled={isBusy} onPress={()=>send({action:'role',skip:true})}/>:null}
       {game.acted?<ArabicText style={st.infoText}>تم حفظ الحركة بسرية. استنى الفجر.</ArabicText>:null}
      </>:<ArabicText style={st.infoText}>سكّر عيونك واحفظ دورك… اللي عليه الدور رح يشوف تعليماته على جهازه.</ArabicText>}
    </View>:null}
   {game.phase==='DISCUSSION'?<View style={st.bottomPanel}>
      <ArabicText style={st.infoText}>٥ دقائق للنقاش • حرّك بطاقتك بدون كشفها. القرار بالإجماع على بدء التصويت المبكر.</ArabicText>
      <PrimaryButton compact title={game.readyToVote?'جاهز للتصويت ✓':'صوّت الآن • أنا جاهز'}
        disabled={game.readyToVote||isBusy||serverNow<(game.discussionStartAt||0)} onPress={()=>send({action:'ready-vote'})}/>
      <PrimaryButton compact variant="ghost" title={memoryOpen?'إخفاء معلوماتي':'معلوماتي من الليل'}
       onPress={()=>setMemoryOpen(x=>!x)}/>
      {memoryOpen?<Memory observations={game.nightMemory} players={players}/>:null}
    </View>:null}
   {game.phase==='VOTING'?<View style={st.bottomPanel}>
     <ArabicText style={st.infoText}>{game.voted?'تم تسجيل صوتك بسرية.':'اختار لاعب من الطاولة، ثم أكد صوتك. ما بتقدر تصوّت لحالك.'}</ArabicText>
     {!game.voted&&values.vote?<PrimaryButton compact title={'تأكيد التصويت لـ '+players.find(p=>p.id===values.vote)?.name}
       disabled={isBusy||serverNow<(game.voteOpensAt||0)} onPress={()=>send({action:'vote',target:values.vote})}/>:null}
     <PrimaryButton compact variant="ghost" title={memoryOpen?'إخفاء معلوماتي':'مراجعة معلوماتي'} onPress={()=>setMemoryOpen(x=>!x)}/>
     {memoryOpen?<Memory observations={game.nightMemory} players={players}/>:null}
    </View>:null}
   {game.phase==='RESULT'?<ScrollView style={st.resultScroll} contentContainerStyle={st.results}>
      <ArabicText weight="extraBold" style={st.winner}>{WINNER_LABELS[game.winner]||'انتهت الليلة'}</ArabicText>
      <ArabicText style={st.resultText}>المقصيّون: {game.eliminated?.map(id=>players.find(p=>p.id===id)?.name).join('، ')||'لا أحد'}</ArabicText>
      <ArabicText style={st.resultText}>بطاقات الوسط: {game.center?.map(roleTitle).join(' • ')}</ArabicText>
      <ArabicText weight="bold" style={st.resultText}>الأصوات:</ArabicText>
      {Object.entries(game.votes||{}).map(([from,to])=><ArabicText key={from} style={st.resultText}>
       {players.find(p=>p.id===from)?.name} ← {to?players.find(p=>p.id===to)?.name:'امتنع'}</ArabicText>)}
      <ArabicText weight="bold" style={st.resultText}>تسلسل أحداث الليل:</ArabicText>
      {game.recap?.map((event,i)=><ArabicText key={i} style={st.resultText}>
       {event.index}. {event.actor?players.find(p=>p.id===event.actor)?.name+' — ':''}
       {event.text}
       {event.targets?.length?' ('+event.targets.map(id=>players.find(p=>p.id===id)?.name||'لاعب').join('، ')+')':''}
       {event.centerIndices?.length?' [وسط '+event.centerIndices.map(n=>n+1).join('، ')+']':''}
      </ArabicText>)}
      {isHost?<View style={st.resultActions}>
        <PrimaryButton compact title="جولة جديدة" onPress={actions.restartGame}/>
        <PrimaryButton compact variant="ghost" title="نرجع للغرفة" onPress={actions.returnToLobby}/>
      </View>:null}
    </ScrollView>:null}
   </ScrollView>
   </View>
  </ScreenContainer>;
}
const st=StyleSheet.create({
 screen:{backgroundColor:colors.plum,paddingHorizontal:8,paddingTop:4,paddingBottom:5,alignItems:'center',minWidth:0},
 setupScreen:{backgroundColor:colors.plum,paddingHorizontal:12,paddingTop:5,paddingBottom:7},
 setupHeader:{flexDirection:'row-reverse',alignItems:'center',gap:12,
  justifyContent:'space-between',flexWrap:'wrap',marginBottom:7},
 gameRow:{flexDirection:'row-reverse',alignItems:'flex-start',justifyContent:'center',
  alignSelf:'stretch',gap:12},
 gameStack:{alignItems:'center',alignSelf:'stretch',gap:6},
 controlsViewport:{flexShrink:1,minWidth:0},
 controlsContent:{flexGrow:1,paddingBottom:6},
 topRow:{height:46,alignSelf:'stretch',flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',gap:6},
 gameTitle:{fontSize:19,color:colors.mustard,flexShrink:1},subTitle:{fontSize:11,color:colors.cream},
 topRight:{flexDirection:'row-reverse',alignItems:'center',gap:8,flexWrap:'wrap',justifyContent:'flex-start'},
 time:{color:colors.mustard,fontSize:20,fontVariant:['tabular-nums']},room:{color:colors.cream,fontSize:11},
 audioButton:{borderRadius:9,backgroundColor:'#5B263F',paddingHorizontal:7,paddingVertical:4},
 audioText:{fontSize:10,color:colors.cream},
 board:{alignSelf:'center',justifyContent:'center',borderWidth:2,borderColor:colors.mustard,borderRadius:18,overflow:'hidden'},
 boardBackground:{width:'100%',height:'100%'},
 nightShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(14,8,26,0.25)'},
 seat:{position:'absolute',alignItems:'center',justifyContent:'center',paddingVertical:1,borderRadius:9,
 backgroundColor:'rgba(53,19,38,0.85)',borderWidth:1,borderColor:colors.mustard},
 seatAvatar:{height:29,justifyContent:'center',alignItems:'center'},
 cardBack:{backgroundColor:colors.plum,borderWidth:2,borderColor:colors.mustard,borderRadius:5,
 alignItems:'center',justifyContent:'center',marginVertical:2},
 cardGlyph:{fontSize:17,color:colors.mustard},seatName:{color:colors.cream,textAlign:'center'},
 selectedSeat:{borderWidth:3,borderColor:colors.coral,backgroundColor:'#B05D36'},
 ownSeat:{borderColor:colors.cream},
 eliminated:{position:'absolute',right:-3,top:-3,width:17,height:17,borderRadius:9,backgroundColor:colors.coral,alignItems:'center'},
 middleCards:{position:'absolute',flexDirection:'row',justifyContent:'space-around',alignItems:'center'},
 centerCard:{borderWidth:2,borderColor:colors.mustard,borderRadius:6,backgroundColor:colors.plum,alignItems:'center',justifyContent:'center'},
 selectedCenter:{borderColor:colors.coral,borderWidth:4},
 centerGlyph:{color:colors.mustard,fontSize:25},centerFace:{width:'100%',height:'100%'},
 dealOverlay:{position:'absolute',top:'41%',left:'25%',width:'50%',backgroundColor:colors.plum,padding:15,borderRadius:12,borderWidth:2,borderColor:colors.mustard},
 dealText:{textAlign:'center',color:colors.mustard,fontSize:21},
 bottomPanel:{minHeight:45,backgroundColor:'#5D2E43',borderRadius:12,alignSelf:'stretch',
 borderColor:colors.mustard,borderWidth:1,marginTop:4,padding:6,flexDirection:'row-reverse',
 alignItems:'center',justifyContent:'center',gap:7,flexWrap:'wrap'},
 inlineInfo:{flexDirection:'row-reverse',alignItems:'center',gap:8,maxWidth:430},
 roleArt:{height:68,width:65},inlineCopy:{gap:3,maxWidth:345,alignItems:'flex-end'},
 roleText:{color:colors.mustard,fontSize:18,textAlign:'right'},infoText:{color:colors.cream,fontSize:12,textAlign:'right'},
 memory:{maxWidth:620,flexDirection:'row-reverse',flexWrap:'wrap',gap:5},
 memoryLine:{borderRadius:8,padding:6,backgroundColor:colors.cream,gap:3},
 memoryTitle:{color:colors.plum,fontSize:11},memoryValue:{color:colors.plum,fontSize:13},
 resultScroll:{flex:1,alignSelf:'stretch',marginTop:4},results:{backgroundColor:colors.plum,gap:5,padding:9,alignItems:'center'},
 winner:{color:colors.mustard,fontSize:23},resultText:{color:colors.cream,fontSize:13},
 resultActions:{flexDirection:'row-reverse',gap:9},rotateScreen:{backgroundColor:colors.plum,justifyContent:'center',alignItems:'center',gap:18,padding:22},
 rotateTitle:{color:colors.mustard,fontSize:27,textAlign:'center'},
 rotateText:{color:colors.cream,fontSize:16,textAlign:'center'},
});
