import React from 'react';
import {Image,Pressable,StyleSheet,View,useWindowDimensions} from 'react-native';
import {ArabicText} from './ArabicText';
import {colors} from '../theme/colors';
import {useLanguage} from '../context/LanguageContext';

export const PORTRAITS={
 SALIM:require('../../assets/mystery/person_salim.png'),
 ZAINAB:require('../../assets/mystery/person_zainab.png'),
 NABIL:require('../../assets/mystery/person_nabil.png'),
 HIND:require('../../assets/mystery/person_hind.png'),
 OM_YAZAN:require('../../assets/mystery/person_om_yazan.png'),
 FARIS:require('../../assets/mystery/person_faris.png'),
};
export const SUSPECTS=[
 {id:'SALIM',name:'سالم',role:'بائع التحف'},
 {id:'ZAINAB',name:'زينب',role:'صانعة الفوانيس'},
 {id:'NABIL',name:'نبيل',role:'الخبّاز'},
 {id:'HIND',name:'هند',role:'حكواتية الحارة'},
 {id:'OM_YAZAN',name:'أم يزن',role:'جارة الجميع'},
 {id:'FARIS',name:'فارس',role:'صاحب الورشة'},
];
export function MysteryLobbyPicker({players,viewerId,onSelect,busy}){
 const {width}=useWindowDimensions();
 const {t,language}=useLanguage();
 const selected=players.find(p=>p.id===viewerId)?.mysteryCharacter;
 const compact=width<470;
 return <View style={styles.section}>
   <ArabicText weight="extraBold" style={styles.title}>{t('مين شخصيتك في الحارة؟','Choose your neighborhood character')}</ArabicText>
   <ArabicText style={styles.help}>{t('كل لاعب يختار شخصية مختلفة؛ لازم نكون ٣–٦ محققين ونختار كل الشخصيات قبل البداية.','Each player chooses a unique character. You need 3–6 investigators, all with characters chosen, to start.')}</ArabicText>
   <View style={styles.grid}>{SUSPECTS.map(s=>{
    const taken=players.find(p=>p.mysteryCharacter===s.id);
    const mine=selected===s.id,disabled=Boolean((taken&&!mine)||busy);
    return <Pressable key={s.id} accessibilityRole="button" accessibilityState={{disabled,selected:mine}} disabled={disabled}
     onPress={()=>onSelect(s.id)} style={[styles.card,{width:compact?'48%':'31%'},mine&&styles.selected,disabled&&!mine&&styles.taken]}>
       <Image source={PORTRAITS[s.id]} resizeMode="contain" style={styles.picture}/>
       <ArabicText weight="bold" style={styles.name}>{t(s.name,({SALIM:'Salim',ZAINAB:'Zainab',NABIL:'Nabil',HIND:'Hind',OM_YAZAN:'Um Yazan',FARIS:'Faris'})[s.id])}</ArabicText>
       <ArabicText style={styles.role}>{taken?(mine?t('✓ إنت','✓ You'):taken.name):t(s.role,({SALIM:'Antique Seller',ZAINAB:'Lantern Maker',NABIL:'Baker',HIND:'Storyteller',OM_YAZAN:'Neighbor',FARIS:'Carpenter'})[s.id])}</ArabicText>
     </Pressable>;
   })}</View>
   <ArabicText style={styles.help}>{t('جاهزين','Ready')}: {players.filter(p=>p.connected&&p.mysteryCharacter).length} / {players.filter(p=>p.connected).length}</ArabicText>
 </View>;
}
const styles=StyleSheet.create({
 section:{padding:14,borderRadius:19,backgroundColor:colors.plum,gap:12},
 title:{color:colors.mustard,fontSize:21},help:{color:colors.cream,fontSize:13},
 grid:{flexDirection:'row-reverse',flexWrap:'wrap',gap:7,justifyContent:'space-between'},
 card:{backgroundColor:colors.cream,borderColor:colors.mustard,borderWidth:3,borderBottomWidth:6,borderRadius:15,padding:6,alignItems:'center',minHeight:162,gap:2},
 selected:{borderColor:colors.coral,backgroundColor:'#FCE0AB'},taken:{opacity:.45},
 picture:{height:100,width:85},name:{color:colors.plum,fontSize:16},role:{color:colors.inkMuted,fontSize:11,textAlign:'center'},
});
