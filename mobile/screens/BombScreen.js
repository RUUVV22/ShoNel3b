import React from 'react';
import {View,Pressable,StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ScreenContainer} from '../components/ScreenContainer';
import {ArabicText} from '../components/ArabicText';
import {GameLogo} from '../components/GameLogo';
import {GameHeader} from '../components/GameHeader';
import {CharacterAvatar} from '../components/CharacterAvatar';
import {PrimaryButton} from '../components/PrimaryButton';
import {useGame} from '../context/GameContext';
import {colors} from '../theme/colors';

export function BombScreen(){
  const {gameState,actions,busyAction}=useGame();
  const game=gameState?.bomb;
  if(!game)return null;
  const me=gameState.players.find(p=>p.id===gameState.currentPlayerId);
  const isHost=Boolean(me?.isHost);
  const alive=gameState.players.filter(p=>game.aliveIds.includes(p.id));
  const knockedOut=gameState.players.filter(p=>game.eliminatedIds.includes(p.id));
  const isAlive=game.aliveIds.includes(me.id);
  const playerName=id=>gameState.players.find(p=>p.id===id)?.name||'لاعب';
  const choices=alive.filter(p=>p.id!==me.id);
  const busy=busyAction==='game:action';
  const phase=game.phase;
  const selectTarget=targetId=>actions.gameAction({action:game.isHolder?'pass':'guess',targetId});
  let instruction='';
  if(phase==='PASS')instruction=game.isHolder?'إنت ماسك القنبلة! اختار مين بدك تورّطه، وما حدا رح يعرف إنك المرسل.':'حدا بالشِلّة معه القنبلة وعم يختار ضحيته...';
  else if(phase==='GUESS')instruction=game.isRecipient?'القنبلة وصلت لعندك! احزر مين بعتها إلك. عندك تخمينة واحدة.':`القنبلة عند ${playerName(game.recipientId)}... هل رح يعرف المرسل؟`;
  else if(phase==='REVEAL')instruction=game.lastResult?.correct?'انكشف صاحب القنبلة! تخمين صحيح.':'المرسل ظل مجهول! تخمين غلط.';
  else instruction='طلع آخر ناجٍ من الجولة!';
  return <ScreenContainer contentStyle={styles.container}>
    <GameHeader title="مين فجّرني؟" subtitle={'الغرفة '+gameState.roomId}/>
    <GameLogo id="BOMB" size={92}/>
    <View style={styles.headline}>
      <View style={styles.pill}><ArabicText style={styles.pillText} weight="bold">الجولة {game.round}</ArabicText></View>
      <ArabicText style={styles.big} weight="extraBold">{phase==='FINISHED'?'🏆 الفايز الأخير':phase==='GUESS'?'💣 وصلتك المفاجأة!':phase==='REVEAL'?'✨ انكشفت الحقيقة!':'💥 القنبلة طايرة!'}</ArabicText>
      <ArabicText style={styles.instructions}>{instruction}</ArabicText>
      <ArabicText style={styles.counter} weight="bold">{alive.length} باقيين من {game.totalPlayers} لاعبين</ArabicText>
    </View>
    {phase==='PASS' && game.isHolder ? <View style={styles.actionPanel}>
      <ArabicText style={styles.panelTitle} weight="extraBold">إنت صاحب القنبلة!</ArabicText>
      <ArabicText style={styles.hint}>اضغط على اسم لاعب عشان تبعتله القنبلة بسرية. ما بتقدر تختار حالك.</ArabicText>
    </View>:null}
    {phase==='GUESS' && game.isRecipient ? <View style={styles.actionPanel}>
      <ArabicText style={styles.panelTitle} weight="extraBold">مين عطاك القنبلة؟</ArabicText>
      <ArabicText style={styles.hint}>اختار لاعب واحد. إذا عرفت المرسل بينقصي، وإذا غلطت بتطلع إنت.</ArabicText>
    </View>:null}
    {(phase==='PASS'&&game.isHolder||phase==='GUESS'&&game.isRecipient)?<View style={styles.options}>
       {choices.map(player=><Pressable key={player.id} accessibilityRole="button" accessibilityLabel={player.name} disabled={busy}
         onPress={()=>selectTarget(player.id)}
         style={({pressed})=>[styles.playerChoice,pressed&&styles.pressed,busy&&{opacity:.5}]}>
          <CharacterAvatar name={player.name} size={51} accent={colors.mustard}/>
          <ArabicText style={styles.choiceName} weight="bold">{player.name}</ArabicText>
          <Ionicons name={phase==='PASS'?'send':'help-circle'} color={colors.plum} size={23}/>
       </Pressable>)}
    </View>:null}
    {!isAlive&&phase!=='FINISHED'?<View style={styles.spectator}><Ionicons name="eye-outline" size={20} color={colors.mustard}/><ArabicText style={styles.hint}>إنت انقصيت، بس بتقدر تتابع باقي الجولة وتشجع الشِلّة.</ArabicText></View>:null}
    {isHost&&game.waitingForDisconnected?<View style={styles.result}><ArabicText style={styles.waiting}>اللاعب صاحب الدور فقد الاتصال. تقدر تنهي دوره حتى تكمل الشلة.</ArabicText><PrimaryButton title="إقصاء اللاعب المنقطع والمتابعة" variant="ghost" disabled={busy} onPress={()=>actions.gameAction({action:'recover'})}/></View>:null}
    {phase==='REVEAL'&&game.lastResult?<View style={styles.result}>
      <ArabicText style={styles.resultHead} weight="extraBold">{game.lastResult.disconnected?'⚠️ لاعب فقد الاتصال':game.lastResult.correct?'✅ تخمين صح!':'❌ تخمين غلط!'}</ArabicText>
      <ArabicText style={styles.resultText}>{game.lastResult.recipientId?'القنبلة انبعتت من '+playerName(game.lastResult.senderId)+' إلى '+playerName(game.lastResult.recipientId):'حامل القنبلة فقد الاتصال قبل ما يبعتها'}</ArabicText>
      {game.lastResult.guessedId?<ArabicText style={styles.resultText}>التخمين: {playerName(game.lastResult.guessedId)}</ArabicText>:null}
      <ArabicText style={styles.eliminated} weight="extraBold">انقصى {playerName(game.lastResult.eliminatedId)}!</ArabicText>
      {isHost?<PrimaryButton title="الجولة التالية" icon="arrow-forward" disabled={busy} onPress={()=>actions.gameAction({action:'next'})}/>:<ArabicText style={styles.waiting}>بنستنى المضيف يبلش الجولة الجاي...</ArabicText>}
    </View>:null}
    {phase==='FINISHED'?<View style={styles.winnerPanel}>
      <Ionicons name="trophy" size={58} color={colors.mustard}/>
      <ArabicText style={styles.winner} weight="extraBold">{playerName(game.winnerId)}</ArabicText>
      <ArabicText style={styles.resultText}>آخر لاعب صمد بعد {game.turnsPlayed} جولات إقصاء!</ArabicText>
      {isHost?<View style={styles.actionRow}>
       <PrimaryButton title="نعيد اللعبة" onPress={actions.restartGame}/>
       <PrimaryButton title="نرجع للشلة" variant="ghost" onPress={actions.returnToLobby}/>
      </View>:null}
    </View>:null}
    <View style={styles.listPanel}>
      <ArabicText style={styles.listTitle} weight="extraBold">اللي لسه باللعبة ({alive.length})</ArabicText>
      <View style={styles.roster}>{alive.map(player=><View key={player.id} style={styles.rosterItem}>
        <CharacterAvatar name={player.name} size={39} accent={colors.mustard}/>
        <ArabicText style={styles.rosterName}>{player.name}</ArabicText>
      </View>)}</View>
      {knockedOut.length?<><ArabicText style={styles.outTitle}>المقصيّين</ArabicText>
       <View style={styles.roster}>{knockedOut.map(p=><ArabicText key={p.id} style={styles.out}>{p.name}</ArabicText>)}</View>
      </>:null}
    </View>
  </ScreenContainer>;
}
const styles=StyleSheet.create({
 container:{maxWidth:690,width:'100%',alignSelf:'center',gap:15},
 headline:{backgroundColor:colors.plum,padding:22,borderRadius:23,gap:10,alignItems:'center',borderBottomWidth:6,borderColor:colors.coral},
 pill:{backgroundColor:colors.mustard,paddingHorizontal:15,paddingVertical:5,borderRadius:30},
 pillText:{color:colors.plum},big:{color:colors.mustard,fontSize:27,textAlign:'center'},
 instructions:{color:colors.cream,fontSize:18,textAlign:'center',lineHeight:28},
 counter:{color:colors.paperMuted,fontSize:13},actionPanel:{backgroundColor:colors.coral,padding:17,borderRadius:18,gap:6,borderWidth:2,borderColor:colors.plum},
 panelTitle:{fontSize:22,color:colors.plum},hint:{color:colors.cream,fontSize:15,textAlign:'right'},
 options:{gap:9},playerChoice:{backgroundColor:colors.cream,borderRadius:15,borderWidth:2,borderBottomWidth:5,borderColor:colors.plum,padding:11,flexDirection:'row-reverse',alignItems:'center',gap:12},
 choiceName:{flex:1,fontSize:19,color:colors.plum},pressed:{transform:[{translateY:2}]},
 spectator:{backgroundColor:colors.plum,flexDirection:'row-reverse',gap:9,padding:16,borderRadius:15},
 result:{backgroundColor:colors.plum,borderRadius:19,padding:20,gap:14,alignItems:'stretch'},
 resultHead:{color:colors.mustard,textAlign:'center',fontSize:24},
 resultText:{color:colors.cream,textAlign:'center',fontSize:17},
 eliminated:{color:colors.coral,textAlign:'center',fontSize:22},waiting:{color:colors.cream,textAlign:'center'},
 winnerPanel:{backgroundColor:colors.plum,borderRadius:20,padding:25,alignItems:'center',gap:15},
 winner:{color:colors.mustard,fontSize:32,textAlign:'center'},actionRow:{alignSelf:'stretch',gap:10},
 listPanel:{padding:17,borderRadius:18,borderWidth:2,borderColor:colors.plum,backgroundColor:colors.cream,gap:10},
 listTitle:{color:colors.plum,fontSize:18},roster:{flexDirection:'row-reverse',flexWrap:'wrap',gap:9},
 rosterItem:{flexDirection:'row-reverse',gap:6,alignItems:'center',backgroundColor:colors.mustard,padding:7,borderRadius:12},
 rosterName:{color:colors.plum},outTitle:{color:colors.inkMuted},out:{color:colors.inkMuted,textDecorationLine:'line-through',padding:7},
});
