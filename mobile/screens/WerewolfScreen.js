import React,{useEffect,useRef,useState} from 'react';
import {Animated,Alert,ImageBackground,Platform,Pressable,ScrollView,StyleSheet,View,useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import {Ionicons} from '@expo/vector-icons';
import {ScreenContainer} from '../components/ScreenContainer';
import {ArabicText} from '../components/ArabicText';
import {PrimaryButton} from '../components/PrimaryButton';
import {useGame} from '../context/GameContext';
import {SCORPION_COURTYARD,getScorpionRole} from '../constants/scorpionAssets';
import {ScorpionPokerCard} from '../components/ScorpionPokerCard';
import {ScorpionAudioLayer} from '../components/ScorpionAudioLayer';
import {WerewolfRoleSetup} from '../components/WerewolfRoleSetup';
import {SCORPION_CARD_HEIGHT_PER_WIDTH} from '../constants/scorpionCards';
import {playScorpionSfx,stopScorpionSfx} from '../services/scorpionSfxPlayer';
import {SCORPION_AUDIO_MODES,SCORPION_NARRATION} from '../constants/scorpionNarration';
import SCORPION_CUE_DURATIONS from '../../server/src/games/scorpionCueDurations.json';
import {playScorpionCue,stopAllScorpionNarration} from '../services/scorpionAudio';
import {colors} from '../theme/colors';

const EMPTY_SELECTION=Object.freeze({type:null,ids:[]});
const NIGHT_LABELS={MIMIC:'المقلّد',COPIED_HELPER:'معلومات المساعد',SCORPIONS:'العقارب',
 MINION:'المساعد',MASON:'الصحاب',SEER:'العرّافة',ROBBER:'الحرامي',TROUBLEMAKER:'القلّاب',
 DRUNK:'السكران',INSOMNIAC:'بنت الليل',COPIED_NIGHT_GIRL:'بنت الليل المقلّدة'};
const WINNER_LABELS={VILLAGE:'🏆 أهل الحارة فازوا!',SCORPIONS:'🏆 العقارب فازوا!',
 TANNER:'🏆 كبش الفدا فاز وحده!',TANNER_AND_VILLAGE:'🏆 أهل الحارة وكبش الفدا فازوا!',NONE:'ما في فائز هالجولة'};
function roleTitle(id){return getScorpionRole(id)?.name||'بطاقة مخفية';}

const SIXTEEN_POSITIONS=[
 [.21,.31],[.326,.31],[.442,.31],[.558,.31],[.674,.31],[.79,.31],
 [.105,.33],[.105,.53],[.105,.73],
 [.895,.33],[.895,.53],[.895,.73],
 [.325,.86],[.443,.86],[.557,.86],[.675,.86]
];
function seatPosition(index,count) {
 if(count===16)return SIXTEEN_POSITIONS[index];
 const angle=-Math.PI/2+Math.PI/count+2*Math.PI*index/count;
 return [.5+Math.cos(angle)*.385,.525+Math.sin(angle)*.32];
}
function Seat({player,index,count,size,onPress,selected,disabled,eligible,ownSeat,faceRole,faceVariant,eliminated,moving}){
 const [nx,ny]=seatPosition(index,count);
 const cardWidth=Math.max(26,Math.min(82,size.width/(count>=14?19:count>=10?15:count>=7?13:10),size.height/(count>=14?11:count>=10?9:7.5)));
 const nameSize=Math.max(9,Math.min(15,cardWidth*.22));
 const seatW=cardWidth+10,seatH=cardWidth*SCORPION_CARD_HEIGHT_PER_WIDTH+nameSize+13;
 return <Pressable accessibilityRole="button"
   accessibilityLabel={player.name+(selected?'، محدد':'')}
   accessibilityState={{disabled,selected}}
   hitSlop={4} onPress={onPress} disabled={disabled}
   style={[st.seat,{width:seatW,left:nx*size.width-seatW/2,top:ny*size.height-seatH/2},
    selected&&st.selectedSeat,ownSeat&&st.ownSeat,eligible&&st.eligibleSeat]}>
    <View style={moving?{opacity:0}:null}><ScorpionPokerCard roleId={faceRole} variant={faceVariant||0} faceUp={Boolean(faceRole)} width={cardWidth}/></View>
    <ArabicText weight="bold" numberOfLines={1} adjustsFontSizeToFit
      style={[st.seatName,{fontSize:nameSize},!player.connected&&{opacity:.55}]}>{player.name}</ArabicText>
    {ownSeat?<View style={st.localBadge}><Ionicons name="person" size={8} color={colors.plum}/></View>:null}
    {eliminated?<View style={st.eliminated}><Ionicons name="close" color={colors.cream} size={12}/></View>:null}
 </Pressable>;
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
export function WerewolfScreen({navigation}){
 const {gameState:s,actions,busyAction,muted,toggleMute}=useGame();
 const {width,height}=useWindowDimensions();
 const game=s?.werewolf;
 const [now,setNow]=useState(Date.now());
 const [reveal,setReveal]=useState(false);
 const [revealPressedAt,setRevealPressedAt]=useState(0);
 const [memoryOpen,setMemoryOpen]=useState(false);
 const [audioMode,setAudioMode]=useState(SCORPION_AUDIO_MODES.SAME_ROOM);
 const [audioUnlocked,setAudioUnlocked]=useState(false);
 const [eventsOpen,setEventsOpen]=useState(false);
 const [lobbyPanel,setLobbyPanel]=useState(false);
 const [peek,setPeek]=useState({players:{},center:{}});
 const [swap,setSwap]=useState(null);
 const swapProgress=useRef(new Animated.Value(0)).current;
 const [selection,setSelection]=useState(EMPTY_SELECTION);
 const [shuffled,setShuffled]=useState(false);
 const [audioAttempted,setAudioAttempted]=useState('');
 const serverOffsetRef=useRef(0);
 const sfxRoundRef=useRef(null);
 const sfxResultsRef=useRef(null);
 const scope=`${s?.roomId}:${game?.round}:${game?.phase}:${game?.step}:${game?.copiedRole}`;
 useEffect(()=>{setSelection(EMPTY_SELECTION);setPeek({players:{},center:{}});setSwap(null);},[scope]);
 const players=(game?.seats||[]).map(id=>s?.players.find(p=>p.id===id)||{id,name:'لاعب',connected:false});
 const me=s?.players.find(p=>p.id===s?.currentPlayerId);
 const isHost=Boolean(me?.isHost);
 const sharedSfxAllowed=audioUnlocked&&!muted&&
  (audioMode===SCORPION_AUDIO_MODES.REMOTE||isHost);
 const isPortrait=height>width && width<900;
 const isBusy=busyAction==='game:action';
 const currentPhase=game?.currentRole;
 const activeRole=currentPhase==='MIMIC'&&game?.copiedRole?game.copiedRole:
  currentPhase==='SCORPIONS'?(game?.role==='MIMIC'?game?.copiedRole:game?.role):currentPhase;
 const isPairedScorpion=(game?.partnerIds?.length||0)>0;
 const isSoloScorpioness=game?.phase==='NIGHT'&&game?.currentRole==='SCORPIONS'&&
  (game?.role==='SCORPIONESS'||game?.role==='MIMIC'&&game?.copiedRole==='SCORPIONESS')&&!isPairedScorpion;
 const observations=game?.privateObservation||[];
 const boardWidth=width;
 const boardHeight=height;
 const centerCardWidth=Math.max(25,Math.min(72,boardWidth*.065,boardHeight*.16/SCORPION_CARD_HEIGHT_PER_WIDTH));
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
 useEffect(()=>{if(muted||audioMode===SCORPION_AUDIO_MODES.SAME_ROOM&&!isHost)stopAllScorpionNarration();},[muted,audioMode,isHost]);
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
 useEffect(()=>{setReveal(false);setRevealPressedAt(0);setShuffled(false);setMemoryOpen(false);setEventsOpen(false);},[game?.round]);
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
  playScorpionCue(cue,SCORPION_NARRATION[cue.id],serverOffsetRef.current).catch(()=>{});
 },[game?.cue?.id,game?.cue?.sequence,audioMode,isHost,muted,audioUnlocked]);
 useEffect(()=>{
  const cue=game?.cue;
  if(!cue||!sharedSfxAllowed||Date.now()-cue.at>2500)return;
  const id=cue.id;
  if(id==='night_start')playScorpionSfx('night_bell');
  else if(id.endsWith('_open'))playScorpionSfx('role_wake');
  else if(id.endsWith('_close'))playScorpionSfx('role_sleep');
  else if(id==='dawn')playScorpionSfx('dawn_transition');
  else if(id==='one_minute_left'||id==='thirty_seconds_left')playScorpionSfx('timer_warning');
  else if(id==='vote_now'||id==='vote_early')playScorpionSfx('night_bell');
 },[game?.cue?.id,game?.cue?.sequence,sharedSfxAllowed]);
 useEffect(()=>{
  if(!audioUnlocked||muted||audioMode!==SCORPION_AUDIO_MODES.REMOTE||
    game?.phase!=='NIGHT'||!game?.isActor)return;
  let openId=null,closeId=null;
  if(game.currentRole==='COPIED_HELPER'){
    openId='copied_helper_open';closeId='copied_helper_close';
  }else if(game.currentRole==='COPIED_NIGHT_GIRL'){
    openId='copied_night_girl_open';closeId='copied_night_girl_close';
  }else if(game.currentRole==='MIMIC'&&game.copiedRole){
    openId='copied_'+game.copiedRole.toLowerCase()+'_open';
  }
  if(!openId||!SCORPION_NARRATION[openId])return;
  // These announcements are audible ONLY on the actor's own device.
  const serverNow=Date.now()+serverOffsetRef.current;
  if(game.currentRole!=='MIMIC'&&
      serverNow-game.phaseStartedAt>SCORPION_CUE_DURATIONS[openId]+1500)return;
  playScorpionCue({id:openId,at:Date.now(),sequence:game.step},SCORPION_NARRATION[openId]).catch(()=>{});
  if(!closeId||!SCORPION_NARRATION[closeId])return;
  const lead=Math.max(3000,(SCORPION_CUE_DURATIONS[closeId]||1600)+350);
  const delay=Math.max(0,(game.deadline-lead)-serverNow);
  const timer=setTimeout(()=>{
    playScorpionCue({id:closeId,at:Date.now(),sequence:game.step},SCORPION_NARRATION[closeId]).catch(()=>{});
  },delay);
  return()=>clearTimeout(timer);
 },[game?.phase,game?.step,game?.currentRole,game?.copiedRole,game?.isActor,
    game?.phaseStartedAt,game?.deadline,audioMode,audioUnlocked,muted]);
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
  // One shared reveal, followed by an appropriate results sting.
  playScorpionSfx('flip_card');
  const revealTimer=setTimeout(()=>playScorpionSfx('results_reveal'),800);
  const outcomeTimer=setTimeout(
    ()=>playScorpionSfx(game.winner==='NONE'?'lose_sting':'win_sting'),3600);
  return()=>{clearTimeout(revealTimer);clearTimeout(outcomeTimer);};
 },[sharedSfxAllowed,game?.phase,game?.round,game?.winner]);

 useEffect(()=>{
  const observations=game?.privateObservation||[];
  if(game?.phase!=='NIGHT'||!game?.isActor||!observations.length){
   setPeek({players:{},center:{}});return;
  }
  const playersVisible={},centerVisible={};
  for(const entry of observations){
   const role=typeof entry.seen==='string'?entry.seen:entry.seen?.role;
   // Only location-tagged, server-authorized observations may flip a card.
   if(entry.target&&role&&getScorpionRole(role))playersVisible[entry.target]={role,variant:entry.cardVariant||0};
   if(Array.isArray(entry.centerIndices)){
    entry.centerIndices.forEach((index,i)=>{
     const cardRole=Array.isArray(entry.seen)?entry.seen[i]:role;
     if(Number.isInteger(index)&&getScorpionRole(cardRole))centerVisible[index]={role:cardRole,variant:entry.cardVariants?.[i]||0};
    });
   }
  }
  setPeek({players:playersVisible,center:centerVisible});
  const timeout=setTimeout(()=>setPeek({players:{},center:{}}),5200);
  return()=>clearTimeout(timeout);
 },[scope,game?.phase,game?.isActor,game?.privateObservation?.length]);
 if(!game||!me)return null;
 const myId=me.id;
 const localSfx=id=>{if(audioUnlocked&&!muted)playScorpionSfx(id);};
 const send=async payload=>{
   const reply=await actions.gameAction(payload);
   if(reply?.ok)setSelection(EMPTY_SELECTION);
   return reply;
 };
 const animateSwap=(a,b)=>{
  swapProgress.setValue(0);
  setSwap({a,b});
  Animated.timing(swapProgress,{toValue:1,duration:660,useNativeDriver:true}).start(()=>setSwap(null));
 };
 const swapAt=location=>{
  if(location.type==='player'){
   const i=players.findIndex(p=>p.id===location.id);
   const [x,y]=seatPosition(Math.max(i,0),players.length);
   return [x*boardWidth,y*boardHeight-boardHeight*.013];
  }
  const start=(boardWidth-(centerCardWidth+10)*3-centerGap*2)/2;
  return [start+location.index*(centerCardWidth+10+centerGap)+centerCardWidth*.5+5,boardHeight*.46];
 };
 const canChoose=game.phase==='NIGHT'&&game.isActor&&!game.acted&&!isBusy
  &&serverNow>=(game.phaseOpensAt||0);
 const requiresTwo=activeRole==='TROUBLEMAKER'||
  (activeRole==='SCORPIONESS'&&currentPhase==='SCORPIONS'&&!isPairedScorpion);
 const canTargetPlayer=canChoose&&(
  currentPhase==='MIMIC'&&!game.copiedRole||
  ['SEER','ROBBER','TROUBLEMAKER'].includes(activeRole));
 const selectableMiddle=canChoose&&(
  ['DRUNK','SEER'].includes(activeRole)||
  currentPhase==='SCORPIONS'&&!isPairedScorpion&&['SCORPION','SCORPIONESS'].includes(activeRole));
 const chosen=selection.ids;
 const desired=selection.type==='center'
   &&(activeRole==='SEER'||isSoloScorpioness)||requiresTwo?2:1;
 const selectionValid=chosen.length===desired&&chosen.length>0;
 const selectAt=(type,id)=>{
  if(type==='vote'){
   if(game.phase!=='VOTING'||game.voted||id===myId||isBusy||serverNow<(game.voteOpensAt||0))return;
   localSfx('vote_select');
   setSelection({type:'vote',ids:[id]});return;
  }
  if(!canChoose||(type==='player'&&!canTargetPlayer)||
    (type==='center'&&!selectableMiddle))return;
  if(type==='player'&&id===myId)return;
  const max=type==='center'&&(activeRole==='SEER'||isSoloScorpioness)||requiresTwo?2:1;
  const original=selection.type===type?selection.ids:[];
  const next=original.includes(id)?original.filter(item=>item!==id):
    original.length>=max?[...original.slice(1),id]:[...original,id];
  localSfx(original.includes(id)?'deselect_card':'select_card');
  setSelection({type,ids:next});
 };
 const confirmAction=async()=>{
  if(!selectionValid||!canChoose)return;
  const reply=await send({action:'role',target:chosen[0],...(desired===2?{second:chosen[1]}:{})});
  if(reply?.ok){
   if(activeRole==='ROBBER')animateSwap({type:'player',id:myId},{type:'player',id:chosen[0]});
   else if(activeRole==='TROUBLEMAKER')animateSwap({type:'player',id:chosen[0]},{type:'player',id:chosen[1]});
   else if(activeRole==='DRUNK')animateSwap({type:'player',id:myId},{type:'center',index:chosen[0]});
   localSfx(['ROBBER','TROUBLEMAKER','DRUNK'].includes(activeRole)?'replace_card':'secret_look');
  }
 };
 const acknowledge=async()=>{
  const reply=await send({action:'ack'});
  if(reply?.ok)localSfx('button_click');
 };
 const canAcknowledge=canChoose&&!canTargetPlayer&&!selectableMiddle;
 const canSkip=canChoose&&['ROBBER','TROUBLEMAKER'].includes(activeRole);
 const roleName=game.copiedRole?'المقلّد ← '+roleTitle(game.copiedRole):game.roleName;
 const themeTitle=game.phase==='REVEAL'?'تعرّف على دورك':
  game.phase==='NIGHT'?'مرحلة الليل':
  game.phase==='DISCUSSION'?'وقت النقاش':
  game.phase==='VOTING'?'مرحلة التصويت':'النتائج';
 const privateEntries=game.phase==='NIGHT'?game.privateObservation:game.nightMemory;
 const events=game.phase==='NIGHT'&&game.currentRole
  ?'دور '+(NIGHT_LABELS[game.currentRole]||'إحدى الشخصيات'):themeTitle;
 const instruction=game.phase==='REVEAL'?
  game.revealReady?'بانتظار بقية اللاعبين':reveal?'احفظ دورك وخليه سر':'شوف بطاقتك بسرّية':
  game.phase==='NIGHT'?
   !game.isActor?'بانتظار دورك':
   game.acted?'تم تنفيذ قدرتك':
   !canChoose?'استنى انتهاء النداء…':
   currentPhase==='MIMIC'&&!game.copiedRole?'اختار لاعب لتنسخ دوره':
   requiresTwo?'اختار لاعبين':
   selectableMiddle&&activeRole==='DRUNK'?'اختار بطاقة من الوسط':
   activeRole==='SEER'?'اختار لاعب أو بطاقتين من الوسط':
   selectableMiddle&&!canTargetPlayer?'اختار بطاقة من الوسط':
   canTargetPlayer?'اختار لاعب':'شوف معلوماتك وأكّد دورك':
  game.phase==='DISCUSSION'?'وقت النقاش — اقنع أصحابك':
  game.phase==='VOTING'?
   game.voted?'تم تسجيل صوتك':'اختار لاعب للتصويت':'انتهت الليلة';
 const selectedName=players.find(p=>p.id===chosen[0])?.name||'';
 const canEnableVoice=!muted&&!audioUnlocked;
 const startLandscape=async()=>{
  setAudioUnlocked(true);
  if(Platform.OS==='web') {
   try{await document.documentElement.requestFullscreen?.();}catch{}
   try{await window.screen.orientation.lock('landscape');}catch{}
  }
 };
 const backToLobby=()=>{
  if(!isHost){setLobbyPanel(true);return;}
  const go=()=>actions.returnToLobby();
  if(Platform.OS==='web'){
    if(typeof window!=='undefined'&&window.confirm('ترجع كل الشلّة لنفس اللوبي؟'))go();
  }else Alert.alert('العودة للوبي','رح ترجع كل الشلّة للغرفة نفسها.',[
    {text:'إلغاء',style:'cancel'},{text:'العودة',onPress:go}
  ]);
 };
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
   {!audioUnlocked?<Pressable accessibilityRole="button" onPress={()=>setAudioUnlocked(true)} style={st.audioButton}>
    <ArabicText style={st.audioText}>🔊 تفعيل الصوت</ArabicText></Pressable>:null}
   {isHost?<Pressable onPress={backToLobby} style={st.audioButton}>
    <ArabicText style={st.audioText}>العودة للوبي</ArabicText></Pressable>:null}
  </View>
  <WerewolfRoleSetup game={game} editable={isHost} busy={isBusy}
   onToggle={cardKey=>{
    localSfx(game.selectedCards?.includes(cardKey)?'deselect_card':'select_card');
    actions.gameAction({action:'toggle-card',cardKey});
   }}
   onConfirm={()=>{localSfx('button_click');actions.gameAction({action:'confirm-cards'});}}/>
 </ScreenContainer>;
 return <View style={st.fullScreen}>
  <ScorpionAudioLayer/>
  <ImageBackground source={SCORPION_COURTYARD} resizeMode="cover"
   imageStyle={st.backgroundImage} style={st.fullScreen}>
   {game.phase==='NIGHT'?<View pointerEvents="none" style={st.nightShade}/>:null}
   <SafeAreaView style={st.safeLayer} edges={['top','left','right','bottom']}>
    <View style={st.headerLeft}>
     <Pressable accessibilityRole="button" accessibilityLabel="العودة للوبي"
      onPress={backToLobby} style={st.roundIcon}>
      <Ionicons name="arrow-back" size={19} color={colors.cream}/>
     </Pressable>
     <Pressable accessibilityRole="button"
      accessibilityLabel={canEnableVoice?'تفعيل الصوت':muted?'إلغاء الكتم':'كتم الصوت'}
      onPress={()=>{
       if(!audioUnlocked){setAudioUnlocked(true);if(muted)toggleMute();}
       else toggleMute();
      }} style={st.roundIcon}>
      <Ionicons name={muted||!audioUnlocked?'volume-mute':'volume-high'} size={19} color={colors.cream}/>
     </Pressable>
    </View>
    <View style={st.headerCenter} pointerEvents="none">
     <View style={st.titlePlaque}>
      <ArabicText weight="extraBold" style={st.heading}>ليلة العقارب</ArabicText>
     </View>
     <ArabicText weight="bold" style={st.phaseCaption}>{themeTitle}</ArabicText>
     <ArabicText weight="extraBold" style={st.timer}>{timeLabel}</ArabicText>
    </View>
    <View style={st.headerRight}>
     <View style={st.playersCount}>
      <Ionicons name="people" size={15} color={colors.mustard}/>
      <ArabicText weight="bold" style={st.countText}>{players.length} / 16</ArabicText>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel="أحداث الليل"
      onPress={()=>setEventsOpen(open=>!open)} style={st.eventsButton}>
      <ArabicText weight="bold" style={st.eventsText}>أحداث الليل</ArabicText>
      <Ionicons name={eventsOpen?'chevron-up':'chevron-down'} size={15} color={colors.cream}/>
     </Pressable>
     {eventsOpen?<View style={st.eventsPanel}>
      <ArabicText weight="bold" style={st.eventsTitle}>أحداث الليل</ArabicText>
      <ArabicText style={st.eventsLine}>{events}</ArabicText>
      <ArabicText style={st.eventsLine}>الجولة {game.round} • الغرفة {s.roomId}</ArabicText>
      {game.isActor&&privateEntries?.length?<Memory observations={privateEntries} players={players}/>:null}
      <Pressable onPress={()=>setAudioMode(mode=>mode===SCORPION_AUDIO_MODES.SAME_ROOM?
       SCORPION_AUDIO_MODES.REMOTE:SCORPION_AUDIO_MODES.SAME_ROOM)} style={st.modeButton}>
       <ArabicText style={st.eventsLine}>{audioMode===SCORPION_AUDIO_MODES.SAME_ROOM?
        'الصوت: جهاز المضيف':'الصوت: كل جهاز'} • تغيير</ArabicText>
      </Pressable>
     </View>:null}
    </View>
    {players.map((player,index)=>{
     const faceRole=game.phase==='RESULT'?game.assignments?.[player.id]:
      peek.players[player.id]?.role||
      (player.id===myId&&game.phase==='REVEAL'&&reveal&&!game.revealReady?game.role:null);
     const faceVariant=game.phase==='RESULT'?game.assignmentVariants?.[player.id]:
      peek.players[player.id]?.variant??(player.id===myId?game.roleArtVariant:0);
     const eligible=(canTargetPlayer&&player.id!==myId)||
      (game.phase==='VOTING'&&!game.voted&&player.id!==myId&&serverNow>=(game.voteOpensAt||0));
     return <Seat key={player.id} player={player} index={index} count={players.length}
       size={seatSize} ownSeat={player.id===myId}
       selected={(selection.type==='player'||selection.type==='vote')&&chosen.includes(player.id)}
       eligible={eligible} disabled={!eligible} faceRole={faceRole} faceVariant={faceVariant}
       moving={Boolean(swap&&[swap.a,swap.b].some(loc=>loc.type==='player'&&loc.id===player.id))}
       eliminated={game.phase==='RESULT'&&game.eliminated?.includes(player.id)}
       onPress={()=>selectAt(game.phase==='VOTING'?'vote':'player',player.id)}/>;
    })}
    <View style={[st.middleCards,{top:boardHeight*.46-centerCardHeight*.5,
      left:(boardWidth-(centerCardWidth+10)*3-centerGap*2)/2,gap:centerGap}]}>
     {[0,1,2].map(index=><Pressable key={index} accessibilityRole="button"
       accessibilityLabel={'بطاقة الوسط '+(index+1)}
       accessibilityState={{selected:selection.type==='center'&&chosen.includes(index)}}
       disabled={!selectableMiddle}
       onPress={()=>selectAt('center',index)}
       style={[st.centerCard,{width:centerCardWidth+10,height:centerCardHeight+23},
        selection.type==='center'&&chosen.includes(index)&&st.selectedCenter,
        selectableMiddle&&st.eligibleCenter]}>
       <View style={swap&&[swap.a,swap.b].some(loc=>loc.type==='center'&&loc.index===index)?{opacity:0}:null}><ScorpionPokerCard roleId={game.phase==='RESULT'?game.center?.[index]:peek.center[index]?.role}
        variant={game.phase==='RESULT'?game.centerVariants?.[index]||0:peek.center[index]?.variant||0}
        faceUp={game.phase==='RESULT'||Boolean(peek.center[index])} width={centerCardWidth}/></View>
       <ArabicText weight="extraBold" style={st.centerIndex}>{index+1}</ArabicText>
      </Pressable>)}
    </View>
    {swap?<View pointerEvents="none" style={st.swapLayer}>
     {[swap.a,swap.b].map((location,i)=>{
      const from=swapAt(location),to=swapAt(i===0?swap.b:swap.a);
      const motionX=swapProgress.interpolate({inputRange:[0,1],outputRange:[0,to[0]-from[0]]});
      const motionY=swapProgress.interpolate({inputRange:[0,1],outputRange:[0,to[1]-from[1]]});
      const cardWidth=location.type==='center'?centerCardWidth:
       Math.max(26,Math.min(82,boardWidth/(players.length>=14?19:players.length>=10?15:players.length>=7?13:10),
        boardHeight/(players.length>=14?11:players.length>=10?9:7.5)));
      return <Animated.View key={i} style={{position:'absolute',left:from[0]-cardWidth/2,
       top:from[1]-cardWidth*SCORPION_CARD_HEIGHT_PER_WIDTH/2,
       transform:[{translateX:motionX},{translateY:motionY}]}}>
       <ScorpionPokerCard width={cardWidth}/>
      </Animated.View>;
     })}
    </View>:null}
    {game.phase==='REVEAL'&&!shuffled?<View pointerEvents="none" style={st.dealOverlay}>
      <ArabicText weight="extraBold" style={st.dealText}>✦ الأوراق بتنخلط… ✦</ArabicText>
     </View>:null}
    {game.phase!=='RESULT'?<View style={[st.helper,{top:boardHeight*.615,
      width:Math.min(500,Math.max(245,boardWidth*.56)),left:(boardWidth-Math.min(500,Math.max(245,boardWidth*.56)))/2}]}>
     <ArabicText weight="extraBold" style={st.helperTitle}>{instruction}</ArabicText>
     {game.phase==='NIGHT'&&game.isActor&&canChoose&&
       (canTargetPlayer||selectableMiddle)&&!game.acted?<ArabicText style={st.helperHint}>
       {isSoloScorpioness?'العقربة تقارن الفريقين فقط، بدون كشف البطاقات':
        currentPhase==='MIMIC'&&game.copiedRole?'قدرتك المنسوخة: '+roleName:
        selection.type==='center'?'اختر بطاقات الوسط المناسبة':
        getScorpionRole(activeRole)?.ability||'اختار البطاقة المناسبة'}
       {chosen.length?' • '+chosen.length+' / '+desired:''}
      </ArabicText>:null}
     {game.phase==='REVEAL'&&!game.revealReady?<View style={st.helperButtons}>
      {!reveal?<SmallAction title="شوف بطاقتك" onPress={()=>{
       setAudioUnlocked(true);setReveal(true);setRevealPressedAt(Date.now());
       if(!muted)playScorpionSfx('flip_card');
      }}/>:<SmallAction title="حفظت دوري • جاهز" disabled={serverNow-revealPressedAt<5000||isBusy}
       onPress={async()=>{const reply=await send({action:'ready'});if(reply?.ok){setReveal(false);localSfx('button_click');}}}/>}
     </View>:null}
     {game.phase==='NIGHT'&&game.isActor?<>
      {game.acted?<ArabicText style={st.helperHint}>تم حفظ حركتك بسرية.</ArabicText>:null}
      {canChoose&&selectionValid?<View style={st.helperButtons}>
       <SmallAction title="تأكيد" onPress={confirmAction} disabled={isBusy}/>
       <SmallAction title="تغيير الاختيار" secondary onPress={()=>setSelection(EMPTY_SELECTION)}/>
      </View>:null}
      {canAcknowledge?<SmallAction title="تمام، سكّرت عيوني" onPress={acknowledge}/>:null}
      {canSkip?<SmallAction title="تخطي" secondary onPress={async()=>{
       const reply=await send({action:'role',skip:true});if(reply?.ok)localSfx('button_click');
      }}/>:null}
      {privateEntries?.length?<Pressable onPress={()=>setMemoryOpen(x=>!x)}>
       <ArabicText style={st.privateToggle}>{memoryOpen?'إخفاء معلوماتي':'معلوماتي من الليل'}</ArabicText>
      </Pressable>:null}
      {memoryOpen&&privateEntries?.length?<Memory observations={privateEntries} players={players}/>:null}
     </>:null}
     {game.phase==='DISCUSSION'?<View style={st.helperButtons}>
      <SmallAction title={game.readyToVote?'جاهز للتصويت ✓':'جاهز للتصويت'}
       disabled={game.readyToVote||isBusy||serverNow<(game.discussionStartAt||0)}
       onPress={async()=>{const reply=await send({action:'ready-vote'});if(reply?.ok)localSfx('button_click');}}/>
      <SmallAction secondary title={memoryOpen?'إخفاء معلوماتي':'معلوماتي'}
       onPress={()=>setMemoryOpen(x=>!x)}/>
      {memoryOpen?<Memory observations={game.nightMemory} players={players}/>:null}
     </View>:null}
     {game.phase==='VOTING'?<View style={st.helperButtons}>
      {game.voted?<ArabicText style={st.helperHint}>صوتك انحفظ.</ArabicText>:
       <SmallAction title={selection.type==='vote'&&chosen[0]?'تصويت • '+selectedName:'اختار لاعب'}
        disabled={isBusy||selection.type!=='vote'||!chosen[0]||serverNow<(game.voteOpensAt||0)}
        onPress={async()=>{const reply=await send({action:'vote',target:chosen[0]});if(reply?.ok)localSfx('vote_confirm');}}/>}
      <SmallAction secondary title={memoryOpen?'إخفاء معلوماتي':'معلوماتي'}
       onPress={()=>setMemoryOpen(x=>!x)}/>
      {memoryOpen?<Memory observations={game.nightMemory} players={players}/>:null}
     </View>:null}
    </View>:null}
    {game.phase==='RESULT'?<View style={[st.resultPanel,{maxHeight:Math.min(215,boardHeight*.36)}]}>
     <ArabicText weight="extraBold" style={st.winner}>{WINNER_LABELS[game.winner]||'انتهت الليلة'}</ArabicText>
     <ArabicText style={st.resultText}>المقصيّون: {game.eliminated?.map(id=>players.find(p=>p.id===id)?.name).join('، ')||'لا أحد'}</ArabicText>
     <ScrollView contentContainerStyle={st.resultDetails}>
      <ArabicText style={st.resultText}>بطاقات الوسط: {game.center?.map(roleTitle).join(' • ')}</ArabicText>
      {Object.entries(game.votes||{}).map(([from,to])=><ArabicText key={from} style={st.resultText}>
       {players.find(p=>p.id===from)?.name} ← {players.find(p=>p.id===to)?.name||'امتنع'}</ArabicText>)}
      {game.recap?.map((event,i)=><ArabicText key={i} style={st.resultText}>{event.index}. {event.text}</ArabicText>)}
     </ScrollView>
     {isHost?<View style={st.helperButtons}>
      <SmallAction title="جولة جديدة" onPress={actions.restartGame}/>
      <SmallAction title="العودة للوبي" secondary onPress={actions.returnToLobby}/>
     </View>:null}
    </View>:null}
    {lobbyPanel?<View style={st.lobbyOverlay}>
     <View style={st.lobbyContent}>
      <ArabicText weight="extraBold" style={st.winner}>غرفة الشلّة • {s.roomId}</ArabicText>
      <ArabicText style={st.eventsLine}>{players.map(p=>p.name).join(' • ')}</ArabicText>
      <ArabicText style={st.eventsLine}>اللعبة لسه شغالة. المضيف بقدر يرجع الكل للّوبي بدون ما حد يطلع من الغرفة.</ArabicText>
      <SmallAction title="العودة للطاولة" onPress={()=>setLobbyPanel(false)}/>
     </View>
    </View>:null}
   </SafeAreaView>
  </ImageBackground>
 </View>;
}
function SmallAction({title,onPress,secondary=false,disabled=false}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}}
  onPress={onPress} disabled={disabled}
  style={[st.smallButton,secondary&&st.smallSecondary,disabled&&{opacity:.45}]}>
  <ArabicText weight="bold" style={[st.smallButtonText,secondary&&{color:colors.plum}]}>{title}</ArabicText>
 </Pressable>;
}

const st=StyleSheet.create({
 fullScreen:{flex:1,backgroundColor:colors.plum,width:'100%',overflow:'hidden'},
 backgroundImage:{width:'100%',height:'100%'},
 swapLayer:{...StyleSheet.absoluteFillObject,zIndex:19},
 safeLayer:{flex:1,position:'relative'},
 nightShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(20,9,29,0.2)'},
 headerLeft:{position:'absolute',top:8,left:9,zIndex:25,flexDirection:'row',gap:7},
 roundIcon:{height:37,width:37,borderRadius:22,backgroundColor:'#351326',
  borderWidth:2,borderColor:colors.cream,alignItems:'center',justifyContent:'center',
  shadowColor:colors.plum,shadowOffset:{width:2,height:3},shadowOpacity:.75,shadowRadius:1,
  elevation:4},
 headerCenter:{position:'absolute',top:5,left:'33%',width:'34%',
  alignItems:'center',zIndex:12},
 titlePlaque:{paddingHorizontal:18,paddingVertical:3,borderWidth:2,borderColor:colors.cream,
  borderRadius:14,backgroundColor:'#351326',shadowColor:colors.plum,
  shadowOffset:{width:2,height:3},shadowOpacity:.8,elevation:3},
 heading:{color:colors.mustard,fontSize:21,textAlign:'center'},
 phaseCaption:{color:colors.cream,fontSize:12,textAlign:'center',marginTop:2,
  backgroundColor:'rgba(53,19,38,.88)',borderRadius:7,paddingHorizontal:8},
 timer:{fontSize:23,color:colors.cream,fontVariant:['tabular-nums'],textAlign:'center',
  textShadowColor:colors.plum,textShadowOffset:{width:1,height:2},textShadowRadius:5},
 headerRight:{position:'absolute',top:8,right:9,zIndex:40,
  flexDirection:'row',alignItems:'flex-start',gap:6},
 playersCount:{height:35,flexDirection:'row',alignItems:'center',gap:4,
  backgroundColor:colors.plum,borderWidth:1,borderColor:colors.cream,
  borderRadius:12,paddingHorizontal:8},
 countText:{fontSize:12,color:colors.cream,fontVariant:['tabular-nums']},
 eventsButton:{height:35,paddingHorizontal:9,flexDirection:'row',alignItems:'center',gap:5,
  backgroundColor:colors.plum,borderWidth:1.5,borderColor:colors.cream,borderRadius:12},
 eventsText:{color:colors.cream,fontSize:12},
 eventsPanel:{position:'absolute',top:41,right:0,width:Math.min(275,285),padding:11,
  backgroundColor:'#351326',borderRadius:13,borderWidth:2,borderColor:colors.mustard,
  alignItems:'flex-end',gap:6,zIndex:100,elevation:12},
 eventsTitle:{color:colors.mustard,fontSize:16,textAlign:'right'},
 eventsLine:{color:colors.cream,fontSize:11,textAlign:'right'},
 modeButton:{padding:6,backgroundColor:'#67374e',borderRadius:8},
 seat:{position:'absolute',alignItems:'center',gap:2,justifyContent:'center',
  borderWidth:1.5,borderColor:colors.mustard,borderRadius:9,
  paddingVertical:2,backgroundColor:'rgba(53,19,38,.76)',
  shadowColor:colors.plum,shadowOpacity:.4,shadowRadius:2,elevation:2},
 seatName:{color:colors.cream,textAlign:'center',width:'100%'},
 ownSeat:{borderColor:colors.cream,borderWidth:2},
 eligibleSeat:{borderColor:colors.mustard,borderWidth:2.3},
 selectedSeat:{borderColor:colors.coral,borderWidth:3,backgroundColor:'rgba(231,90,60,.5)'},
 localBadge:{position:'absolute',right:-4,top:-4,width:16,height:16,borderRadius:9,
  backgroundColor:colors.mustard,borderWidth:1,borderColor:colors.cream,
  alignItems:'center',justifyContent:'center'},
 eliminated:{position:'absolute',left:-6,top:-4,width:18,height:18,borderRadius:10,
  backgroundColor:colors.coral,alignItems:'center',justifyContent:'center'},
 middleCards:{position:'absolute',flexDirection:'row',alignItems:'center'},
 centerCard:{backgroundColor:'rgba(53,19,38,.65)',borderWidth:1.6,
  borderColor:colors.mustard,borderRadius:8,alignItems:'center',justifyContent:'flex-start',
  paddingTop:2,shadowColor:colors.plum,shadowOffset:{width:2,height:3},shadowOpacity:.65,elevation:3},
 selectedCenter:{borderWidth:3,borderColor:colors.coral,backgroundColor:'rgba(231,90,60,.35)'},
 eligibleCenter:{borderColor:colors.mustard},
 centerIndex:{fontSize:12,color:colors.cream,textAlign:'center'},
 helper:{position:'absolute',alignSelf:'center',left:'20%',zIndex:10,
  paddingVertical:7,paddingHorizontal:12,backgroundColor:'rgba(53,19,38,.93)',
  borderWidth:1.5,borderColor:colors.cream,borderRadius:16,
  alignItems:'center',gap:4,maxHeight:230,
  shadowColor:colors.plum,shadowOffset:{width:3,height:4},shadowOpacity:.8,elevation:4},
 helperTitle:{fontSize:15,color:colors.mustard,textAlign:'center'},
 helperHint:{fontSize:10,color:colors.cream,textAlign:'center'},
 helperButtons:{flexDirection:'row-reverse',gap:5,flexWrap:'wrap',
  alignItems:'center',justifyContent:'center'},
 smallButton:{minHeight:28,minWidth:62,paddingHorizontal:11,paddingVertical:5,
  borderRadius:10,backgroundColor:colors.coral,borderWidth:1.5,borderColor:colors.cream,
  alignItems:'center',justifyContent:'center'},
 smallSecondary:{backgroundColor:colors.cream,borderColor:colors.mustard},
 smallButtonText:{fontSize:11,color:colors.cream,textAlign:'center'},
 privateToggle:{color:colors.cream,fontSize:11,textDecorationLine:'underline'},
 memory:{maxWidth:410,flexDirection:'row-reverse',flexWrap:'wrap',gap:5,justifyContent:'center'},
 memoryLine:{borderRadius:7,padding:5,backgroundColor:colors.cream,gap:2},
 memoryTitle:{color:colors.plum,fontSize:10},
 memoryValue:{color:colors.plum,fontSize:11},
 infoText:{color:colors.cream,fontSize:12},
 dealOverlay:{position:'absolute',left:'35%',top:'38%',width:'30%',padding:12,
  borderWidth:2,borderRadius:12,borderColor:colors.mustard,backgroundColor:colors.plum},
 dealText:{color:colors.mustard,fontSize:16,textAlign:'center'},
 resultPanel:{position:'absolute',left:'31%',top:'62%',width:'38%',borderRadius:14,
  padding:8,gap:4,alignItems:'center',borderWidth:2,borderColor:colors.mustard,
  backgroundColor:'rgba(53,19,38,.96)',zIndex:15},
 resultDetails:{gap:3,alignItems:'center'},
 winner:{color:colors.mustard,fontSize:18,textAlign:'center'},
 resultText:{color:colors.cream,fontSize:11,textAlign:'center'},
 lobbyOverlay:{...StyleSheet.absoluteFillObject,zIndex:150,backgroundColor:'rgba(22,6,19,.84)',
  justifyContent:'center',alignItems:'center',padding:25},
 lobbyContent:{backgroundColor:colors.plum,borderRadius:19,borderColor:colors.mustard,
  borderWidth:2,padding:20,maxWidth:450,alignItems:'center',gap:15},
 setupScreen:{backgroundColor:colors.plum,paddingHorizontal:12,paddingTop:5,paddingBottom:7},
 setupHeader:{flexDirection:'row-reverse',alignItems:'center',gap:12,
  justifyContent:'space-between',flexWrap:'wrap',marginBottom:7},
 gameTitle:{fontSize:19,color:colors.mustard},
 room:{color:colors.cream,fontSize:11},
 audioButton:{borderRadius:9,backgroundColor:'#5B263F',paddingHorizontal:7,paddingVertical:4},
 audioText:{fontSize:10,color:colors.cream},
 rotateScreen:{backgroundColor:colors.plum,justifyContent:'center',alignItems:'center',gap:18,padding:22},
 rotateTitle:{color:colors.mustard,fontSize:27,textAlign:'center'},
 rotateText:{color:colors.cream,fontSize:16,textAlign:'center'}
});