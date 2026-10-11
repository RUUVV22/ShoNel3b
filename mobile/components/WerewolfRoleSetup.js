import React,{useState,useEffect} from 'react';
import {View,Pressable} from 'react-native';
import {ArabicText} from './ArabicText';
import {PrimaryButton} from './PrimaryButton';
import {colors} from '../theme/colors';
const roles={WOLF:'ذئب',SEER:'عرافة',ROBBER:'لص',TROUBLEMAKER:'مشاغبة',DRUNK:'سكير',INSOMNIAC:'سهران',MINION:'تابع',MASON:'ماسوني',TANNER:'دباغ',HUNTER:'صياد',SCORPION:'عقرب',SCORPIONESS:'عقربة',VILLAGER:'مواطن'};
const defaults=['WOLF','WOLF','SEER','ROBBER','TROUBLEMAKER','DRUNK','INSOMNIAC','MINION','MASON','MASON','TANNER','HUNTER','SCORPION','SCORPIONESS'];
const starting=n=>[...defaults.slice(0,n+3),...Array(Math.max(0,n+3-defaults.length)).fill('VILLAGER')];
export function WerewolfRoleSetup({players,initial,editable,onSave}){
 const [deck,setDeck]=useState(initial||starting(players));
 useEffect(()=>setDeck(initial||starting(players)),[players,initial?.join(',')]);
 const change=(id,delta)=>setDeck(old=>delta>0?(old.length<players+3?[...old,id]:old):old.includes(id)?old.filter((x,i)=>i!==old.lastIndexOf(id)):old);
 return <View style={{padding:16,backgroundColor:colors.plum,borderRadius:18,gap:10}}>
 <ArabicText weight="extraBold" style={{color:colors.mustard,fontSize:19}}>اختار التشكيلة • {deck.length}/{players+3}</ArabicText>
 <ArabicText style={{color:colors.cream}}>بطاقة لكل لاعب وثلاث بطاقات وسط. المضيف يختار الأدوار.</ArabicText>
 <View style={{flexDirection:'row-reverse',flexWrap:'wrap',gap:6}}>
 {Object.entries(roles).map(([id,label])=><View key={id} style={{flexDirection:'row-reverse',gap:6,padding:8,borderRadius:10,backgroundColor:colors.cream}}>
 <ArabicText style={{color:colors.plum}}>{label} ({deck.filter(x=>x===id).length})</ArabicText>
 {editable?<Pressable onPress={()=>change(id,-1)}><ArabicText style={{color:colors.coral}}>−</ArabicText></Pressable>:null}
 {editable?<Pressable onPress={()=>change(id,1)}><ArabicText style={{color:colors.plum}}>＋</ArabicText></Pressable>:null}
 </View>)}
 </View>
 {editable?<PrimaryButton compact title="اعتماد التشكيلة" disabled={deck.length!==players+3} onPress={()=>onSave(deck)}/>:null}
 </View>;
}