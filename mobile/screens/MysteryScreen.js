import React,{useState} from 'react';
import {Image,ImageBackground,Modal,Pressable,ScrollView,StyleSheet,View,useWindowDimensions} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ScreenContainer} from '../components/ScreenContainer';
import {GameHeader} from '../components/GameHeader';
import {GameLogo} from '../components/GameLogo';
import {PrimaryButton} from '../components/PrimaryButton';
import {ArabicText} from '../components/ArabicText';
import {ConnectionPill} from '../components/ConnectionPill';
import {MysteryBoard,MysteryNotebook,DICE_IMAGES,PLACE_ART} from '../components/MysteryBoard';
import {PORTRAITS} from '../components/MysteryLobbyPicker';
import {useRoundInputs} from '../hooks/useRoundInputs';
import {useGame} from '../context/GameContext';
import {soundService} from '../services/sounds';
import {colors} from '../theme/colors';
import {useLanguage} from '../context/LanguageContext';
const ITEM_ART={
 'I:LANTERN':require('../../assets/mystery/item_lantern.png'),
 'I:KEY':require('../../assets/mystery/item_key.png'),
 'I:HAMMER':require('../../assets/mystery/item_hammer.png'),
 'I:ROPE':require('../../assets/mystery/item_rope.png'),
 'I:JUG':require('../../assets/mystery/item_jug.png'),
 'I:SCISSORS':require('../../assets/mystery/item_scissors.png'),
};
const LESSONS=[
 ['القضية','اختفى صندوق أمانة الحارة ليلة مهرجان الفوانيس! بتحاول تكشف مين أخذه، بأي مكان، وبأي غرض. السر محفوظ في ثلاث بطاقات مخفية لدى السيرفر.'],
 ['النردين','بدورك ارمي نردين، كل واحد من ١ إلى ٦. مجموعهم ٢ إلى ١٢ خطوة. ما في إعادة رمي بالدور نفسه.'],
 ['التنقل','اضغط على مربع أو مكان لمعاينة مساره عبر الأزقة. كل خطوة أفقية أو عمودية تحسب حركة، والقطري ممنوع. الأخضر ضمن الرمية والأحمر للمسار. قبل ما تتحرك لازم تضغط تأكيد.'],
 ['إذا الهدف بعيد','إذا المقهى ١٠ خطوات ورميتك ٧، شوف الطريق وحدد مربّع قريب أخضر. تقدر تتابع للمقهى بالدور القادم. الحركات اللي ما تستعملها بتنتهي.'],
 ['الأماكن والأدوار','الأماكن إلها مداخل محددة. دخول مكان بيستهلك خطوة وبينهي الحركة. كل اللاعبين بقدروا يشتركوا بنفس المربع.'],
 ['الدليل','بداخل المكان اقترح شخص وغرض، والمكان بيتحدد من موقعك. أول لاعب حسب ترتيب الأدوار معه بطاقة من الاقتراح لازم يكشفها إلك بالسر. إذا ما عند حد دليل، بتكمل بدفترك.'],
 ['دفتر المحقق','الدفتر إلك وحدك؛ سجل احتمالاتك واستبعاداتك. بطاقاتك والأدلة اللي شفتها ما بتنرسل للاعبين التانيين.'],
 ['الاتهام والفوز','اتهام نهائي صحيح بيفوز فوراً. الغلط بيخليك تخسر حق الاتهام، لكن بتضل تكشف بطاقات لمن يطلب منك. وإذا الكل أخطأ، بينكشف الحل من دون فائز.'],
 ['الانقطاع','التحديث أو إعادة الاتصال بيرجعوا مكانك والنرد والدفتر. إذا دور لاعب انقطع، المضيف بقدر يساعد في استكمال الجولة، وفي مهلة ١٥٠ ثانية لخمول الدور.'],
];
const LESSONS_EN=[
 ['The case','The neighborhood trust chest vanished during Lantern Festival! Discover who took it, where, and which item was involved. The server alone holds the three hidden solution cards.'],
 ['Two dice','Roll two six-sided dice on your turn. The total, 2–12, is your movement allowance. You cannot reroll.'],
 ['Movement','Tap a square or an entrance to preview a valid route. Only four-direction moves are allowed; each step costs one. Green squares are within reach. Confirm your destination before moving.'],
 ['Too far?','If the café is 10 steps away but you roll 7, choose a reachable intermediate square on the previewed route. Resume moving next turn. Unused moves expire.'],
 ['Entrances','Enter a venue through its marked entrance. Entry costs one move and ends movement. Multiple investigators may share a square.'],
 ['Evidence','Inside a venue, suggest a suspect and item; the venue is determined by your current position. The first player in order with a matching evidence card privately shows one. If nobody can disprove, investigate further.'],
 ['Your notebook','Track which cards you own, which have been revealed to you, and your private exclusions or possibilities. Other players never see your notebook.'],
 ['Final accusation','A correct accusation wins. An incorrect one permanently removes your right to accuse, but you still reveal cards when required. If everyone is wrong, the solution is shown without a winner.'],
 ['Reconnect','Refreshing restores your position, dice, hand and notebook. The host can recover a disconnected player’s action; inactive turns also timeout after 150 seconds.'],
];
const labels={ROLL:'ارمِ النردين',MOVE:'وين بدك تروح؟',SUGGEST:'مين وراها؟',DISPROVE:'كشف الدليل',POST_SUGGEST:'راجع المعلومات',TURN_END:'خلّص دورك',RESULT:'انكشفت الحقيقة'};
const labelsEn={ROLL:'Roll two dice',MOVE:'Choose a destination',SUGGEST:'Make a suggestion',DISPROVE:'Disprove the suggestion',POST_SUGGEST:'Review the evidence',TURN_END:'Finish your turn',RESULT:'Mystery solved'};
const MYSTERY_INPUT_DEFAULTS=Object.freeze({suspect:null,item:null,accSuspect:null,accLocation:null,accItem:null});
const artFor=(game,id)=>{
 if(id?.startsWith('I:'))return ITEM_ART[id];
 if(id?.startsWith('S:'))return PORTRAITS[id.slice(2)];
 if(id?.startsWith('L:'))return PLACE_ART[id.slice(2)];
 return null;
};
const cardName=(game,id,language='ar')=>{const c=game.cards.find(c=>c.id===id);return (language==='en'?c?.englishName:c?.name)||'—';};
function Options({title,values,value,onChange}){
 return <View style={st.optionsWrap}>
  <ArabicText weight="bold" style={st.caption}>{title}</ArabicText>
  <View style={st.optionGrid}>{values.map(o=><Pressable key={o.id} onPress={()=>onChange(o.id)}
     accessibilityRole="radio" accessibilityState={{selected:value===o.id}}
     style={[st.option,value===o.id&&st.optionSelected]}>
     <ArabicText style={st.optionText}>{o.symbol?o.symbol+' ':''}{o.name}</ArabicText>
   </Pressable>)}</View>
 </View>;
}
function EvidenceCard({game,id}){
 const {language}=useLanguage();
 const image=artFor(game,id);
 return <View style={st.evidenceCard}>
  {image?<Image source={image} resizeMode="contain" style={st.evidenceImage}/>:null}
  <ArabicText weight="bold" style={st.evidenceName}>{cardName(game,id,language)}</ArabicText>
 </View>;
}
function PanelModal({visible,close,children}){
 return <Modal transparent visible={visible} animationType="slide" onRequestClose={close} statusBarTranslucent>
  <View style={st.modalBackground}><ScrollView contentContainerStyle={st.modalScroll}>
    <View style={st.modalPanel}><Pressable accessibilityRole="button" accessibilityLabel="إغلاق" onPress={close} style={st.close}>
     <Ionicons name="close-circle" size={29} color={colors.mustard}/>
    </Pressable>{children}</View>
  </ScrollView></View>
 </Modal>;
}
export function MysteryScreen(){
 const {language,t}=useLanguage();
 const {gameState,actions,busyAction,connectionStatus}=useGame();
 const {width}=useWindowDimensions();
 const [zoom,setZoom]=useState(1);
 const [notesOpen,setNotesOpen]=useState(false);
 const [helpOpen,setHelpOpen]=useState(false);
 const [lesson,setLesson]=useState(0);
 const [accOpen,setAccOpen]=useState(false);
 const game=gameState?.mystery;
 const {values,setField,reset,submitAndReset}=useRoundInputs(
   MYSTERY_INPUT_DEFAULTS,`${gameState?.roomId}:${game?.round}:${game?.turn}:${game?.phase}`
 );
 const {suspect,item,accSuspect,accLocation,accItem}=values;
 const lessonText=language==='en'?LESSONS_EN:LESSONS;
 if(!game)return null;
 const me=gameState.players.find(p=>p.id===gameState.currentPlayerId);
 const active=game.activePlayerId===me?.id;
 const isHost=Boolean(me?.isHost);
 const wide=width>1070,phone=width<650,busy=busyAction==='game:action';
 const current=gameState.players.find(p=>p.id===game.activePlayerId);
 const playerName=id=>gameState.players.find(p=>p.id===id)?.name||t('لاعب','Player');
 const nameOf=id=>cardName(game,id,language);
 const canAccuse=active&&game.mayAccuse&&['ROLL','MOVE','SUGGEST','POST_SUGGEST','TURN_END'].includes(game.phase);
 const liveLocation=game.entrances.find(e=>e.tile===game.positions[me?.id]);
 const currentLocation=game.locations.find(l=>l.id===liveLocation?.id);
 const suspectOptions=game.suspects.map(s=>({id:'S:'+s.id,name:t(s.name,s.englishName)}));
 const placeOptions=game.locations.map(l=>({id:'L:'+l.id,name:t(l.name,l.englishName)}));
 const itemOptions=game.items.map(i=>({id:'I:'+i.id,name:t(i.name,i.englishName),symbol:i.symbol}));
 const send=async payload=>{
   const result=await actions.gameAction(payload);
   if(result?.ok&&['roll','move','show-evidence'].includes(payload.action))soundService.play('select');
   return result;
 };
 const roster=<View style={st.roster}>
  <ArabicText weight="extraBold" style={st.title}>{t('محقّقين الحارة','Neighborhood Investigators')} ({gameState.players.filter(p=>p.connected).length}/{game.players.length})</ArabicText>
  <View style={st.rosterGrid}>{game.players.map((id,i)=>{
    const member=gameState.players.find(p=>p.id===id);
    const character=game.suspects.find(s=>s.id===game.characters[id]);
    return <View key={id} style={[st.rosterItem,game.activePlayerId===id&&st.rosterActive,!member?.connected&&{opacity:.5}]}>
      <Image source={PORTRAITS[game.characters[id]]} style={st.portrait} resizeMode="contain"/>
      <View style={{flex:1}}><ArabicText weight="bold" style={st.rosterName}>{member?.name||'لاعب'} {id===game.activePlayerId?'◀':''}</ArabicText>
       <ArabicText style={st.rosterSub}>{t(character?.name,character?.englishName)} · {member?.connected?t('متصل','Online'):t('منقطع','Offline')} · {game.canAccuse[id]?t('يحقق','Investigating'):t('ما بقدر يتهم','No accusations')}</ArabicText></View>
    </View>;
  })}</View>
 </View>;
 const board=<View style={st.boardArea}>
  <View style={st.boardControls}>
    <ArabicText weight="extraBold" style={st.title}>{t('خريطة التحقيق','Investigation Map')}</ArabicText>
    <View style={{flexDirection:'row',gap:7}}>
     <Pressable accessibilityRole="button" accessibilityLabel="تصغير الخريطة" style={st.zoom} onPress={()=>setZoom(z=>Math.max(.75,+(z-.2).toFixed(2)))}><Ionicons name="remove" color={colors.plum} size={21}/></Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel="تكبير الخريطة" style={st.zoom} onPress={()=>setZoom(z=>Math.min(1.6,+(z+.2).toFixed(2)))}><Ionicons name="add" color={colors.plum} size={21}/></Pressable>
    </View>
  </View>
  <MysteryBoard game={game} viewerId={me?.id} zoom={zoom} disabled={!active||game.phase!=='MOVE'||busy}
    onPreview={(tile,confirm)=>send(confirm?{action:'move'}:{action:'preview',destination:tile})}/>
  {active&&game.phase==='MOVE'?<PrimaryButton compact variant="ghost" disabled={busy} title={t('خلص تحركي الآن بدون استعمال كل الخطوات','End movement and forfeit unused steps')} onPress={()=>send({action:'end'})}/>:null}
 </View>;
 const turnPanel=<View style={st.turnPanel}>
  <ArabicText weight="extraBold" style={st.turnTitle}>{t(labels[game.phase]||'القضية',labelsEn[game.phase]||'The Case')}</ArabicText>
  <ArabicText style={st.turnHelp}>{active?t('الدور إلك!','Your turn!'):t('بنستنى ','Waiting for ')+playerName(game.activePlayerId)+t(' يخلص دوره.',' to finish their turn.')}</ArabicText>
  {game.phase==='ROLL'&&active?<PrimaryButton title={t('🎲 ارمِ النردين','🎲 Roll two dice')} disabled={busy} onPress={()=>send({action:'roll'})}/>:null}
  {game.dice?<View style={st.dice}>{game.dice.map((n,i)=><Image key={i} source={DICE_IMAGES[n]} style={st.die}/>)}
   <ArabicText weight="extraBold" style={st.diceText}>{game.allowance} {t('خطوة','steps')}</ArabicText></View>:null}
  {game.phase==='SUGGEST'&&active?<View style={st.form}>
    <ArabicText weight="extraBold" style={st.locationTag}>{t('📍 المكان الحالي: ','📍 Current location: ')}{t(currentLocation?.name,currentLocation?.englishName)}</ArabicText>
    <Options title={t('مين المشتبه فيه؟','Who is the suspect?')} values={suspectOptions} value={suspect} onChange={value=>setField('suspect',value)}/>
    <Options title={t('بأي غرض؟','Which item?')} values={itemOptions} value={item} onChange={value=>setField('item',value)}/>
    <PrimaryButton title={t('قدّم الاقتراح','Make suggestion')} disabled={!suspect||!item||busy} onPress={()=>submitAndReset(()=>send({action:'suggest',suspect,item}))}/>
    <PrimaryButton compact variant="ghost" disabled={busy} title={t('تجاوز الاقتراح وإنهاء دوري','Skip suggestion and end turn')} onPress={()=>send({action:'end'})}/>
  </View>:null}
  {game.phase==='DISPROVE'?<View style={st.form}>
     <ArabicText style={st.turnHelp}>{t('الاقتراح: ','Suggestion: ')}{nameOf(game.suggestion?.suspect)} / {nameOf(game.suggestion?.location)} / {nameOf(game.suggestion?.item)}</ArabicText>
     {me?.id===game.pendingResponderId?<><ArabicText weight="bold" style={st.warning}>{t('عندك دليل مطابق! اختر بطاقة واحدة لإظهارها فقط لصاحب الاقتراح.','You have matching evidence! Reveal one card privately to the investigator.')}</ArabicText>
       <View style={st.choices}>{game.eligibleEvidence.map(id=><Pressable key={id} disabled={busy} accessibilityRole="button"
         onPress={()=>send({action:'show-evidence',card:id})}><EvidenceCard game={game} id={id}/></Pressable>)}</View></>
      :<ArabicText style={st.turnHelp}>{t('بنستنى ','Waiting for ')}{playerName(game.pendingResponderId)}{t(' يعرض الدليل بسرية.',' to reveal evidence privately.')}</ArabicText>}
    </View>:null}
  {active&&['POST_SUGGEST','TURN_END'].includes(game.phase)?<PrimaryButton title={t('أنهِ دوري','End turn')} disabled={busy} onPress={()=>send({action:'end'})}/>:null}
  {canAccuse?<PrimaryButton compact variant="gold" title={t('🔎 اتهام نهائي','🔎 Final accusation')} onPress={()=>setAccOpen(true)}/>:null}
  {me&&!game.mayAccuse?<ArabicText style={st.warning}>{t('فقدت حق الاتهام، بس بتقدر تكشف الأدلة.','You can no longer accuse, but you must still disprove suggestions.')}</ArabicText>:null}
  {isHost&&game.canRecover?<PrimaryButton compact variant="ghost" title={t('تجاوز إجراء لاعب منقطع','Recover disconnected player action')} disabled={busy} onPress={()=>send({action:'recover'})}/>:null}
  <ArabicText style={st.turnHelp}>{t('الأدوار الخاملة بتنتقل بعد ١٥٠ ثانية. النرد والأدلة والحركة محفوظة وقت إعادة الاتصال.','Inactive turns advance after 150 seconds. Rolls, positions and notes are restored after reconnecting.')}</ArabicText>
  <View style={st.actions}>
    <Pressable accessibilityRole="button" onPress={()=>setNotesOpen(true)} style={st.menu}><Ionicons name="book-outline" size={18} color={colors.cream}/><ArabicText style={st.menuText}>{t('دفتري','Notebook')}</ArabicText></Pressable>
    <Pressable accessibilityRole="button" onPress={()=>setHelpOpen(true)} style={st.menu}><Ionicons name="help-circle-outline" size={18} color={colors.cream}/><ArabicText style={st.menuText}>{t('كيف نلعب؟','How to play')}</ArabicText></Pressable>
  </View>
 </View>;
 const events=<View style={st.events}><ArabicText weight="extraBold" style={st.title}>{t('📜 آخر أحداث الحارة','📜 Public Event Log')}</ArabicText>
  {game.log.slice(-10).reverse().map((entry,i)=><ArabicText key={i} style={st.eventText}>• {language==='en'?entry.en:entry.text}</ArabicText>)}
 </View>;
 const result=<View style={st.result}>
  <Image source={require('../../assets/mystery/win.jpg')} style={st.resultArt} resizeMode="cover"/>
  <ArabicText weight="extraBold" style={st.resultTitle}>{game.winnerId?t('🏆 انكشفت الحقيقة!','🏆 Mystery Solved!'):t('خلصت القضية من دون فائز','Nobody solved the case')}</ArabicText>
  {game.winnerId?<ArabicText style={st.resultText}>{playerName(game.winnerId)} {t('حل القضية!','solved the case!')}</ArabicText>:null}
  <ArabicText style={st.resultText}>{t('مين؟ ','Who? ')}{nameOf(game.solution?.[0])}</ArabicText>
  <ArabicText style={st.resultText}>{t('وين؟ ','Where? ')}{nameOf(game.solution?.[1])}</ArabicText>
  <ArabicText style={st.resultText}>{t('بأي غرض؟ ','With what item? ')}{nameOf(game.solution?.[2])}</ArabicText>
  {isHost?<><PrimaryButton title={t('جولة جديدة','Play again')} onPress={actions.restartGame}/><PrimaryButton title={t('نرجع للّمة','Return to room')} variant="ghost" onPress={actions.returnToLobby}/></>:null}
 </View>;
 return <ScreenContainer contentStyle={[st.root,phone&&{paddingHorizontal:9}]}>
   <GameHeader title={t('مين وراها','Who Did It?')} subtitle={t('سر صندوق الحارة • ','Neighborhood Mystery • ')+gameState.roomId}/>
   <View style={st.status}><ConnectionPill status={connectionStatus}/><ArabicText style={st.statusText}>{t('الجولة','Case')} {game.round} · {t('الدور','Turn')} {game.turnsTaken+1}</ArabicText></View>
   <ImageBackground source={require('../../assets/mystery/thumbnail.jpg')} resizeMode="cover" style={st.hero} imageStyle={{borderRadius:19}}>
     <GameLogo id="MEN_WARAHA" size={85} compact/>
   </ImageBackground>
   {game.phase==='RESULT'?result:<>
     {roster}
     {wide?<View style={st.wide}><View style={st.boardColumn}>{board}{events}</View><View style={st.sidebar}>{turnPanel}<MysteryNotebook game={game} send={send} busy={busy}/></View></View>
     :<>{turnPanel}{board}{events}</>}
     <View style={st.handPanel}>
      <ArabicText weight="extraBold" style={st.title}>{t('🗂 أوراقك السرية','🗂 Your private cards')} ({game.hand.length})</ArabicText>
      <ArabicText style={st.handHint}>{t('أنت فقط بتشوف أوراقك. الأدلة اللي وصلت إلك بتكون بالدفتر.','Only you can see these cards. Previously revealed evidence is saved in your notebook.')}</ArabicText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:9}}>
       {game.hand.map(id=><EvidenceCard key={id} game={game} id={id}/>)}
      </ScrollView>
     </View>
   </>}
   <PanelModal visible={notesOpen} close={()=>setNotesOpen(false)}><MysteryNotebook game={game} busy={busy} send={send} onClose={()=>setNotesOpen(false)}/></PanelModal>
   <PanelModal visible={accOpen} close={()=>{setAccOpen(false);reset();}}>
    <ArabicText weight="extraBold" style={st.turnTitle}>{t('🔎 اتهام نهائي','🔎 Final accusation')}</ArabicText>
    <ArabicText style={st.warning}>{t('إذا أخطأت، بتفقد حق الاتهام؛ فكّر منيح قبل التأكيد!','Wrong accusations permanently remove your right to accuse. Choose carefully!')}</ArabicText>
    <Options title={t('مين؟','Who?')} values={suspectOptions} value={accSuspect} onChange={value=>setField('accSuspect',value)}/>
    <Options title={t('وين؟','Where?')} values={placeOptions} value={accLocation} onChange={value=>setField('accLocation',value)}/>
    <Options title={t('بأي غرض؟','Which item?')} values={itemOptions} value={accItem} onChange={value=>setField('accItem',value)}/>
    <PrimaryButton title={t('أكيد، قدّم اتهامي','Confirm final accusation')} disabled={!accSuspect||!accLocation||!accItem||busy}
      onPress={async()=>{const r=await submitAndReset(()=>send({action:'accuse',suspect:accSuspect,location:accLocation,item:accItem}));if(r?.ok)setAccOpen(false);}}/>
   </PanelModal>
   <PanelModal visible={helpOpen} close={()=>setHelpOpen(false)}>
    <Image source={require('../../assets/mystery/loading.jpg')} style={st.tutorialArt}/>
    <ArabicText weight="extraBold" style={st.turnTitle}>{lessonText[lesson][0]} ({lesson+1}/{LESSONS.length})</ArabicText>
    <ArabicText style={st.lessonText}>{lessonText[lesson][1]}</ArabicText>
    <View style={st.actions}><PrimaryButton compact variant="ghost" title={t('السابق','Previous')} disabled={lesson===0} onPress={()=>setLesson(v=>v-1)}/>
     <PrimaryButton compact title={lesson===LESSONS.length-1?t('خلصنا','Done'):t('التالي','Next')} onPress={()=>lesson===LESSONS.length-1?(setHelpOpen(false),setLesson(0)):setLesson(v=>v+1)}/>
    </View>
   </PanelModal>
 </ScreenContainer>;
}
const st=StyleSheet.create({
 root:{width:'100%',maxWidth:1220,alignSelf:'center',gap:13,paddingBottom:50},
 status:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'},
 statusText:{fontSize:13,color:colors.plum},
 hero:{height:145,borderRadius:19,borderColor:colors.plum,borderWidth:3,justifyContent:'center',alignItems:'center',overflow:'hidden'},
 wide:{flexDirection:'row',gap:14,alignItems:'flex-start'},boardColumn:{flex:2.2,gap:13,minWidth:0},sidebar:{flex:1,gap:13,minWidth:300},
 roster:{backgroundColor:colors.cream,borderColor:colors.plum,borderWidth:2,padding:12,borderRadius:16,gap:7},
 title:{color:colors.plum,fontSize:20},
 rosterGrid:{flexDirection:'row-reverse',flexWrap:'wrap',gap:7,justifyContent:'space-between'},
 rosterItem:{flexDirection:'row-reverse',alignItems:'center',gap:7,backgroundColor:'#EAD2AC',padding:7,borderRadius:12,minWidth:140,flexBasis:'31%',flexGrow:1},
 rosterActive:{backgroundColor:'#F8CE75',borderWidth:2,borderColor:colors.coral},
 portrait:{width:39,height:48,borderRadius:7},rosterName:{fontSize:14,color:colors.plum},rosterSub:{fontSize:11,color:colors.inkMuted},
 boardArea:{gap:10},boardControls:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'},
 zoom:{padding:8,borderRadius:9,borderColor:colors.plum,borderWidth:2,backgroundColor:colors.mustard},
 turnPanel:{backgroundColor:colors.plum,borderBottomWidth:6,borderColor:colors.coral,borderRadius:18,padding:14,gap:11},
 turnTitle:{fontSize:23,color:colors.mustard},turnHelp:{fontSize:13,color:colors.cream,lineHeight:21},
 warning:{fontSize:14,color:'#FFC38A',lineHeight:22},
 dice:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'center',gap:9,flexWrap:'wrap'},
 die:{width:70,height:70},diceText:{fontSize:22,color:colors.mustard},
 form:{gap:11},locationTag:{backgroundColor:colors.mustard,padding:10,borderRadius:10,fontSize:15,color:colors.plum},
 optionsWrap:{gap:7},caption:{fontSize:16,color:colors.cream},
 optionGrid:{flexDirection:'row-reverse',flexWrap:'wrap',gap:7},
 option:{borderColor:colors.mustard,borderWidth:2,backgroundColor:colors.cream,borderRadius:11,padding:9,minWidth:96,flexShrink:1},
 optionSelected:{backgroundColor:colors.mustard,borderColor:colors.coral},
 optionText:{fontSize:12,color:colors.plum,textAlign:'center'},
 choices:{flexDirection:'row-reverse',gap:7,flexWrap:'wrap'},
 evidenceCard:{width:116,backgroundColor:colors.cream,padding:5,borderRadius:12,borderWidth:2,borderColor:colors.mustard,alignItems:'center',gap:5},
 evidenceImage:{height:94,width:103},evidenceName:{fontSize:12,color:colors.plum,textAlign:'center'},
 actions:{flexDirection:'row-reverse',flexWrap:'wrap',alignItems:'center',justifyContent:'space-evenly',gap:7},
 menu:{flexDirection:'row-reverse',gap:7,padding:10,backgroundColor:'#633049',borderRadius:10,alignItems:'center'},
 menuText:{fontSize:13,color:colors.cream},
 handPanel:{padding:12,backgroundColor:colors.cream,borderRadius:15,borderWidth:2,borderColor:colors.plum,gap:8},
 handHint:{fontSize:12,color:colors.inkMuted},
 events:{padding:14,borderRadius:15,borderWidth:2,borderColor:colors.plum,backgroundColor:colors.cream,gap:7},
 eventText:{fontSize:12,color:colors.plum,textAlign:'right'},
 result:{backgroundColor:colors.plum,borderRadius:18,padding:20,gap:11},
 resultArt:{width:'100%',height:170,borderRadius:14},
 resultTitle:{color:colors.mustard,fontSize:27,textAlign:'center'},
 resultText:{color:colors.cream,fontSize:17,textAlign:'center'},
 modalBackground:{flex:1,justifyContent:'center',backgroundColor:'#21131ECC',padding:10},
 modalScroll:{flexGrow:1,justifyContent:'center',alignItems:'center',paddingVertical:22},
 modalPanel:{width:'100%',maxWidth:650,borderColor:colors.mustard,borderWidth:3,backgroundColor:colors.plum,padding:16,borderRadius:18,gap:12},
 close:{alignSelf:'flex-start'},lessonText:{color:colors.cream,fontSize:18,lineHeight:29,textAlign:'right'},
 tutorialArt:{height:120,width:'100%',borderRadius:10},
});
