import React from 'react';
import {View,Pressable,StyleSheet} from 'react-native';
import {ScreenContainer} from '../components/ScreenContainer';
import {GameHeader} from '../components/GameHeader';
import {ArabicText} from '../components/ArabicText';
import {PrimaryButton} from '../components/PrimaryButton';
import {RolePortrait} from '../components/RolePortrait';
import {useGame} from '../context/GameContext';
import {colors} from '../theme/colors';
const steps={NIGHT:'الليل غطّى القرية',DISCUSSION:'الصبح طلع.. مين عم يكذب؟',VOTING:'وقت التصويت',RESULT:'انتهت الحكاية'};
const narration={
 WOLF:'تحت نور القمر، تفتح الذئاب عيونها وتتعرّف على بعضها. الذئب الوحيد ينظر إلى بطاقة من الوسط.',
 SEER:'العرافة تصحى وتستكشف بطاقة أحد اللاعبين أو بطاقة من وسط القرية.',
 ROBBER:'اللص يتسلل ويستبدل بطاقته مع بطاقة لاعب آخر، ويشوف هويته الجديدة.',
 TROUBLEMAKER:'المشاغبة تخلط الأوراق في الظلام: بدّل بطاقتين بين لاعبين بدون كشفهما.',
 SCORPION:'العقرب يبحث عن العقربة؛ وإن كان وحده ينظر إلى بطاقة من الوسط.',
 SCORPIONESS:'العقربة تبحث عن العقرب؛ وإن كانت وحدها تحمي لاعبًا واحدًا من الإقصاء.',
};
export function WerewolfScreen(){
 const {gameState:s,actions}=useGame();const g=s?.werewolf;if(!g)return null;
 const me=s.players.find(p=>p.id===s.currentPlayerId);
 const actor=g.isActor&&!g.acted;
 const choice=(target,second)=>actions.gameAction({action:'role',target,second});
 return <ScreenContainer contentStyle={styles.wrap}>
  <GameHeader title="ليلة العقارب" subtitle={'الجولة '+g.round+' • '+s.roomId}/>
  <View style={styles.banner}><ArabicText style={styles.ornament}>☾ ✶ ☽</ArabicText><ArabicText weight="extraBold" style={styles.heading}>{steps[g.phase]}</ArabicText><ArabicText style={styles.small}>قصص القرية وأسرار الليل</ArabicText></View>
  <View style={styles.role}><RolePortrait role={g.role} size={155}/><ArabicText style={styles.label}>بطاقتك السرية</ArabicText><ArabicText weight="extraBold" style={styles.roleName}>{g.roleName}</ArabicText>
  <ArabicText style={styles.small}>{g.role==='WOLF'&&g.wolves?.length>1?'الذئاب: '+s.players.filter(p=>g.wolves.includes(p.id)).map(p=>p.name).join('، '):''}</ArabicText>
  <ArabicText style={styles.small}>{g.viewerAction?.seen ? 'اكتشفت: '+g.viewerAction.seen :''}</ArabicText></View>
  {g.phase==='NIGHT'?<View style={styles.panel}><ArabicText weight="extraBold" style={styles.heading}>دور {g.currentRole}</ArabicText>
   <ArabicText style={styles.small}>{narration[g.currentRole]}</ArabicText><ArabicText style={styles.small}>{actor?'اختار هدفك بسرية من البطاقات':'استنى دورك.. لا تكشف بطاقتك!'}</ArabicText>
   {actor?<View style={styles.targets}>{((g.role==='WOLF'&&g.wolves?.length>1)||(g.role==='SCORPION'&&g.viewerAction?.seen==='العقربة موجودة')||g.role==='SCORPIONESS')?<Pressable style={styles.target} onPress={()=>choice(null)}><ArabicText style={styles.targetText}>تأكيد الدور / متابعة</ArabicText></Pressable>:null}{g.role!=='TROUBLEMAKER'&&g.role!=='WOLF'&&g.role!=='SCORPION'?s.players.filter(p=>p.id!==me.id).map(p=><Pressable key={p.id} style={styles.target} onPress={()=>choice(p.id)}><ArabicText style={styles.targetText}>{p.name}</ArabicText></Pressable>):null}
     {(g.role==='SEER'||g.role==='WOLF'||g.role==='SCORPION')?[0,1,2].map(i=><Pressable key={i} style={styles.target} onPress={()=>choice(i)}><ArabicText style={styles.targetText}>بطاقة الوسط {i+1}</ArabicText></Pressable>):null}
     {g.role==='TROUBLEMAKER'?s.players.filter(p=>p.id!==me.id).flatMap((p,i,arr)=>arr.slice(i+1).map(q=><Pressable key={p.id+q.id} style={styles.target} onPress={()=>choice(p.id,q.id)}><ArabicText style={styles.targetText}>{p.name} ↔ {q.name}</ArabicText></Pressable>)):null}
   </View>:null}
  </View>:null}
  {g.phase==='DISCUSSION'?<View style={styles.panel}><ArabicText style={styles.small}>ناقشوا بعض.. مين الذئب؟ مين العقرب؟</ArabicText></View>:null}
  {g.phase==='VOTING'?<View style={styles.panel}><ArabicText style={styles.small}>صوّتوا للشخص المشكوك فيه ({g.votesCount}/{g.playerCount})</ArabicText>
  <View style={styles.targets}>{s.players.filter(p=>p.id!==me.id).map(p=><Pressable key={p.id} disabled={g.voted} style={styles.target} onPress={()=>actions.gameAction({action:'vote',target:p.id})}><ArabicText style={styles.targetText}>{p.name}</ArabicText></Pressable>)}</View></View>:null}
  {g.phase==='RESULT'?<View style={styles.panel}><ArabicText weight="extraBold" style={styles.heading}>{g.winner==='WOLF'?'الذئاب فازت!':'أهل القرية فازوا!'}</ArabicText>
    {s.players.map(p=><ArabicText key={p.id} style={styles.small}>{p.name}: {g.assignments?.[p.id]}</ArabicText>)}</View>:null}
  {me.isHost&&(g.phase==='NIGHT'||g.phase==='DISCUSSION'||g.phase==='VOTING')?<PrimaryButton title="المرحلة التالية" icon="arrow-forward" onPress={()=>actions.gameAction({action:'advance'})}/>:null}
  {g.phase==='RESULT'&&me.isHost?<View style={styles.panel}><PrimaryButton title="جولة جديدة" onPress={actions.restartGame}/><PrimaryButton title="العودة للّمة" variant="ghost" onPress={actions.returnToLobby}/></View>:null}
 </ScreenContainer>;
}
const styles=StyleSheet.create({wrap:{gap:15,maxWidth:650,width:'100%',alignSelf:'center'},banner:{backgroundColor:colors.plum,padding:22,borderRadius:24,alignItems:'center',borderWidth:3,borderColor:colors.mustard},ornament:{color:colors.mustard,fontSize:40},heading:{fontSize:24,color:colors.mustard,textAlign:'center'},small:{color:colors.cream,fontSize:14,textAlign:'center'},role:{backgroundColor:colors.coral,padding:20,borderRadius:20,borderWidth:3,borderColor:colors.plum,alignItems:'center'},label:{color:colors.plum},roleName:{color:colors.plum,fontSize:30},panel:{backgroundColor:colors.plum,padding:16,borderRadius:20,gap:12},targets:{flexDirection:'row-reverse',flexWrap:'wrap',gap:8},target:{backgroundColor:colors.cream,padding:12,borderRadius:12,borderWidth:2,borderColor:colors.mustard},targetText:{color:colors.plum,fontSize:13}});
