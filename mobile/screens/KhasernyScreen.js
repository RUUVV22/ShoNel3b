import React, {useState} from 'react';
import {View,Pressable,StyleSheet} from 'react-native';
import {ScreenContainer} from '../components/ScreenContainer';
import {GameHeader} from '../components/GameHeader';
import {GameLogo} from '../components/GameLogo';
import {ArabicText} from '../components/ArabicText';
import {PrimaryButton} from '../components/PrimaryButton';
import {useGame} from '../context/GameContext';
import {colors} from '../theme/colors';
export function KhasernyScreen(){
 const {gameState:s,actions}=useGame();
 const [opponentId,setOpponentId]=useState(null);
 const g=s?.khaserny;if(!g)return null;
 const me=s.players.find(p=>p.id===s.currentPlayerId);const turn=me.id===g.currentPlayerId;
 const current=s.players.find(p=>p.id===g.currentPlayerId);
 return <ScreenContainer contentStyle={styles.wrap}>
 <GameHeader title="خسّرني؟ لا تحاول!" subtitle={'جولة '+g.round+' • '+s.roomId}/>
 <GameLogo id="KHASERNY" size={76}/>
 <View style={styles.intro}><ArabicText weight="extraBold" style={styles.heading}>ست فئات • تحدٍ واحد</ArabicText><ArabicText style={styles.subtitle}>الدور على {current?.name||'الشلة'}</ArabicText></View>
 <View style={styles.score}>{s.players.map(p=><View key={p.id} style={styles.scoreCard}><ArabicText style={styles.scoreText}>{p.name} • {g.scores[p.id]} نقطة</ArabicText></View>)}</View>
 {g.phase==='PICK'?<View style={styles.panel}><ArabicText weight="extraBold" style={styles.title}>اختار لاعب بدك تخسّره ثم اختار الفئة</ArabicText><View style={styles.categories}>{s.players.filter(p=>p.id!==me.id).map(p=><Pressable key={p.id} onPress={()=>setOpponentId(p.id)} style={styles.category}><ArabicText style={styles.categoryText}>{opponentId===p.id?'✓ ':''}{p.name}</ArabicText></Pressable>)}</View><View style={styles.categories}>{g.categories.map(c=><Pressable key={c.id} disabled={!turn||!opponentId} onPress={()=>actions.gameAction({category:c.id,opponentId})} style={[styles.category,!turn&&{opacity:.6}]}><ArabicText style={styles.emoji}>{c.emoji}</ArabicText><ArabicText weight="bold" style={styles.categoryText}>{c.title}</ArabicText></Pressable>)}</View></View>:null}
 {(g.phase==='QUESTION'||g.phase==='JUDGE')?<View style={styles.panel}><ArabicText style={styles.title}>{g.phase==='QUESTION'?'السؤال السري':'الجواب والتصويت'}</ArabicText><ArabicText weight="extraBold" style={styles.question}>{g.question}</ArabicText>
 {g.phase==='QUESTION'&&me.id===g.challengedPlayerId?<PrimaryButton title="اكشف الجواب بعد الإجابة" onPress={()=>actions.gameAction({action:'reveal'})}/>:null}
 {g.phase==='JUDGE'?<><ArabicText style={styles.answer}>الجواب: {g.answer}</ArabicText>
 {me.id!==g.challengedPlayerId&&!g.judged?<View style={styles.vote}><PrimaryButton title="جواب صحيح" onPress={()=>actions.gameAction({action:'correct'})}/><PrimaryButton title="غلط • يخسر 10 نقاط" variant="red" onPress={()=>actions.gameAction({action:'incorrect'})}/></View>:<ArabicText style={styles.subtitle}>التصويت جاري... {g.judgmentsCount} أصوات</ArabicText>}</>:null}</View>:null}
 {g.phase==='RESULT'?<View style={styles.panel}><ArabicText style={styles.heading}>خلصت السهرة!</ArabicText><ArabicText style={styles.subtitle}>الفائز: {s.players.filter(p=>g.winner.includes(p.id)).map(p=>p.name).join('، ')}</ArabicText>{me.isHost?<><PrimaryButton title="نعيد اللعب" onPress={actions.restartGame}/><PrimaryButton title="العودة للغرفة" variant="ghost" onPress={actions.returnToLobby}/></>:null}</View>:null}
 </ScreenContainer>;
}
const styles=StyleSheet.create({wrap:{gap:15,width:'100%',maxWidth:670,alignSelf:'center'},intro:{backgroundColor:colors.plum,borderRadius:23,padding:22,alignItems:'center'},heading:{color:colors.mustard,fontSize:27},subtitle:{color:colors.cream,fontSize:15},score:{flexDirection:'row-reverse',flexWrap:'wrap',gap:7},scoreCard:{backgroundColor:colors.mustard,padding:8,borderWidth:2,borderColor:colors.plum,borderRadius:10},scoreText:{color:colors.plum},panel:{backgroundColor:colors.plum,padding:17,borderRadius:18,gap:12},title:{color:colors.cream,fontSize:20},categories:{flexDirection:'row-reverse',flexWrap:'wrap',gap:9},category:{width:'47%',backgroundColor:colors.cream,alignItems:'center',justifyContent:'center',padding:13,borderWidth:2,borderBottomWidth:5,borderColor:colors.mustard,borderRadius:17},emoji:{fontSize:30},categoryText:{color:colors.plum,fontSize:15,textAlign:'center'},question:{color:colors.mustard,fontSize:27,textAlign:'center'},answer:{color:colors.cream,fontSize:20,textAlign:'center'},vote:{gap:9}});
