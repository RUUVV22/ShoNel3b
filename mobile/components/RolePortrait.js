import React from 'react';
import Svg,{Rect,Circle,Path,Ellipse,Line,Defs,LinearGradient,Stop} from 'react-native-svg';
import {colors} from '../theme/colors';

// Original illuminated-storybook character illustration, intentionally not copied
// from any existing board game. Individual silhouettes use role-specific costume motifs.
const motifs={
 WOLF:'M23 54 L10 17 L38 33 L63 18 L86 33 L111 17 L99 55',
 SCORPION:'M18 80 Q14 12 63 28 Q115 13 108 65 Q108 110 87 103',
 SCORPIONESS:'M20 54 Q60 8 105 54 L112 20',
 SEER:'M22 46 Q63 4 105 46',
 ROBBER:'M17 45 Q62 8 107 45',
 TROUBLEMAKER:'M20 38 L38 17 L62 31 L87 17 L107 38',
 VILLAGER:'M28 49 Q63 14 98 49'
};
export function RolePortrait({role='VILLAGER',size=190}){
 const accent=role==='WOLF'?colors.coral:role==='SCORPIONESS'?colors.mustard:colors.coral;
 return <Svg width={size} height={size*1.18} viewBox="0 0 126 148">
 <Defs><LinearGradient id="portraitFill" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFE4AA"/><Stop offset="1" stopColor="#DFAE77"/></LinearGradient></Defs>
 <Rect x="2" y="2" width="122" height="144" rx="18" fill={colors.cream} stroke={colors.plum} strokeWidth="4"/>
 <Rect x="9" y="9" width="108" height="130" rx="13" fill="#ECD4A4" stroke={colors.coral} strokeWidth="1.5"/>
 <Path d="M13 117 Q62 64 113 117 L113 135 L13 135 Z" fill={colors.plum}/>
 <Path d="M20 135 Q22 94 62 91 Q103 94 106 135Z" fill={accent} stroke={colors.plum} strokeWidth="4"/>
 <Path d="M35 103 L62 122 L90 103" fill="none" stroke={colors.mustard} strokeWidth="4"/>
 <Ellipse cx="63" cy="65" rx="29" ry="37" fill="url(#portraitFill)" stroke={colors.plum} strokeWidth="3"/>
 <Path d={motifs[role]||motifs.VILLAGER} fill="none" stroke={colors.plum} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
 <Path d="M43 62 Q51 58 55 62 M71 62 Q79 58 83 62" fill="none" stroke={colors.plum} strokeWidth="2.5"/>
 <Circle cx="50" cy="65" r="2.5" fill={colors.plum}/><Circle cx="76" cy="65" r="2.5" fill={colors.plum}/>
 <Path d="M55 82 Q63 88 71 82" stroke={colors.plum} fill="none" strokeWidth="2"/>
 <Line x1="17" y1="17" x2="24" y2="17" stroke={colors.plum} strokeWidth="2"/>
 <Line x1="102" y1="17" x2="109" y2="17" stroke={colors.plum} strokeWidth="2"/>
 <Circle cx="63" cy="11" r="3" fill={colors.coral}/>
 </Svg>;
}