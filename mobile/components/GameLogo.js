import React from 'react';
import {View, StyleSheet} from 'react-native';
import Svg,{Rect,Path,Circle,Line,Polygon,Ellipse} from 'react-native-svg';
import {ArabicText} from './ArabicText';
import {colors} from '../theme/colors';

// Four original, vector-drawn game identities. All scale cleanly on web/iOS/Android.
const THEMES={
 CODENAMES:{title:'كود نيمز',english:'CODE NAMES',tag:'الكلمة السرية',background:'#2E293F',accent:'#F2B529',light:'#FFF0CF'},
 WEREWOLF:{title:'ليلة العقارب',english:'NIGHT OF SECRETS',tag:'من يعيش حتى الفجر؟',background:'#3A233B',accent:'#E8A345',light:'#FFF0CF'},
 KHASERNY:{title:'خسّرني!',english:'STUMP ME!',tag:'قدّ التحدّي؟',background:'#B83E39',accent:'#F2B529',light:'#FFF0CF'},
 BOMB:{title:'مين فجّرني؟',english:'WHO BOMBED ME?',tag:'القنبلة بين أصحابك',background:'#F2B529',accent:'#E75A3C',light:'#351326'},
};

function Symbol({id,size}){
 const dark=colors.plum,cream=colors.cream,gold=colors.mustard,coral=colors.coral;
 return <Svg width={size} height={size} viewBox="0 0 112 112">
 {id==='CODENAMES'?<>
   <Rect x="11" y="16" width="90" height="81" rx="14" fill={cream} stroke={dark} strokeWidth="5"/>
   <Path d="M26 22 H85 L91 32 H20Z" fill={gold} stroke={dark} strokeWidth="3"/>
   <Rect x="26" y="43" width="26" height="34" rx="6" fill={coral} stroke={dark} strokeWidth="3" transform="rotate(-11 39 60)"/>
   <Rect x="53" y="39" width="32" height="41" rx="6" fill={gold} stroke={dark} strokeWidth="3" transform="rotate(10 69 60)"/>
   <Circle cx="48" cy="62" r="11" fill={dark}/>
   <Circle cx="48" cy="62" r="6" fill={cream}/>
   <Line x1="56" y1="70" x2="72" y2="86" stroke={dark} strokeWidth="7" strokeLinecap="round"/>
   <Path d="M18 88 L24 81 M88 19 L94 12" stroke={coral} strokeWidth="4" strokeLinecap="round"/>
 </>:null}
 {id==='WEREWOLF'?<>
   <Path d="M56 6 L101 25 L98 81 Q84 100 56 106 Q26 99 14 81 L11 25Z" fill={cream} stroke={dark} strokeWidth="5"/>
   <Path d="M69 20 A22 22 0 1 0 87 51 A17 17 0 1 1 69 20Z" fill={gold} stroke={dark} strokeWidth="2.5"/>
   <Path d="M28 84 L30 43 L45 56 L55 37 L68 56 L84 44 L87 83 Q57 100 28 84Z" fill={dark}/>
   <Path d="M45 70 L54 72 M66 72 L74 70" stroke={coral} strokeWidth="5" strokeLinecap="round"/>
   <Path d="M48 85 L58 79 L68 85" fill="none" stroke={gold} strokeWidth="4" strokeLinecap="round"/>
   <Circle cx="27" cy="25" r="3" fill={coral}/><Circle cx="93" cy="72" r="3" fill={gold}/>
 </>:null}
 {id==='KHASERNY'?<>
   <Path d="M15 24 Q57 -3 99 24 L92 83 Q56 103 21 83Z" fill={cream} stroke={dark} strokeWidth="5"/>
   <Path d="M31 28 L42 11 L57 28 L72 11 L86 28 L83 44 L31 44Z" fill={gold} stroke={dark} strokeWidth="3" strokeLinejoin="round"/>
   <Path d="M40 52 Q38 40 55 40 Q73 40 72 54 Q70 64 57 68 L57 72" fill="none" stroke={dark} strokeWidth="7" strokeLinecap="round"/>
   <Circle cx="57" cy="83" r="5" fill={coral}/>
   <Path d="M18 47 L8 43 M92 57 L104 53 M19 76 L8 83" stroke={coral} strokeWidth="5" strokeLinecap="round"/>
 </>:null}
 {id==='BOMB'?<>
   <Polygon points="56,5 65,19 82,9 82,27 104,27 91,46 108,59 91,68 100,91 77,87 69,106 55,95 42,107 35,88 12,90 23,71 5,59 23,46 12,26 35,27" fill={coral} stroke={dark} strokeWidth="4" strokeLinejoin="round"/>
   <Path d="M62 33 Q67 13 83 19 Q92 23 92 10" fill="none" stroke={dark} strokeWidth="5" strokeLinecap="round"/>
   <Path d="M88 7 L91 0 L96 9 L105 12 L97 17 L96 24 L88 19 L82 21 L83 13Z" fill={gold} stroke={dark} strokeWidth="2"/>
   <Circle cx="55" cy="62" r="31" fill={dark} stroke={cream} strokeWidth="3"/>
   <Ellipse cx="43" cy="47" rx="10" ry="7" fill={cream} opacity=".42" transform="rotate(-35 43 47)"/>
   <Path d="M39 62 Q41 57 46 62 M63 62 Q68 57 73 62" fill="none" stroke={cream} strokeWidth="3" strokeLinecap="round"/>
   <Path d="M44 77 Q56 87 68 77" fill="none" stroke={gold} strokeWidth="4" strokeLinecap="round"/>
 </>:null}
 </Svg>;
}

export function GameLogo({id='CODENAMES',size=80,compact=false,style}){
 const theme=THEMES[id]||THEMES.CODENAMES;
 return <View style={[styles.root,compact?styles.compact:null,style,{backgroundColor:theme.background,borderColor:theme.accent}]}>
 <View style={[styles.iconShell,{width:size,height:size,backgroundColor:theme.accent}]}>
   <Symbol id={id} size={size-8}/>
 </View>
 {!compact?<View style={styles.wordmark}>
  <ArabicText weight="extraBold" numberOfLines={1} adjustsFontSizeToFit style={[styles.title,{color:theme.light,fontSize:Math.max(19,Math.min(28,size*.31))}]}>{theme.title}</ArabicText>
  <ArabicText weight="bold" style={[styles.english,{color:theme.accent}]}>{theme.english}</ArabicText>
  <ArabicText style={[styles.tag,{color:theme.light}]}>{theme.tag}</ArabicText>
 </View>:null}
 </View>;
}
const styles=StyleSheet.create({
 root:{borderWidth:3,borderBottomWidth:6,borderRadius:19,flexDirection:'row-reverse',alignItems:'center',padding:7,gap:10,alignSelf:'stretch',minWidth:0},
 compact:{borderRadius:16,alignSelf:'auto',padding:3,borderWidth:2,borderBottomWidth:4,gap:0},
 iconShell:{alignItems:'center',justifyContent:'center',borderRadius:12,overflow:'hidden'},
 wordmark:{flex:1,minWidth:0,gap:0,alignItems:'flex-end'},
 title:{textAlign:'right',lineHeight:34},english:{fontSize:11,letterSpacing:1.1,textAlign:'right',writingDirection:'ltr'},
 tag:{fontSize:10,textAlign:'right',opacity:.85},
});
