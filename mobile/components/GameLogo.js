import React from 'react';
import {Image, View, StyleSheet} from 'react-native';

// The original illustrated PNGs are bundled as static native/web assets.
// Game IDs stay stable for existing rooms and backend protocol compatibility.
const GAME_ART = {
  CODENAMES: require('../../assets/game-logos/codenames_logo.png'),
  WEREWOLF: require('../../assets/game-logos/werewolf_logo.png'),
  KHASERNY: require('../../assets/game-logos/khaserny_logo.png'),
  BOMB: require('../../assets/game-logos/meen_fajjarni_logo.png'),
  MEN_WARAHA: require('../../assets/mystery/logo.png'),
};

export function GameLogo({id='CODENAMES',size=80,compact=false,style}){
  const source=GAME_ART[id] || GAME_ART.CODENAMES;
  const width=compact ? Math.round(size*1.48) : Math.round(size*2.85);
  const height=compact ? size : Math.round(width*2/3);
  return <View style={[styles.frame,compact&&styles.compact,style]}>
    <Image source={source} resizeMode="contain" accessibilityLabel={
      id==='WEREWOLF'?'ليلة العقارب - Scorpion Night':
      id==='KHASERNY'?'خسرني':id==='BOMB'?'مين فجرني':id==='MEN_WARAHA'?'مين وراها':'كود نيمز'
    } style={{width,height,borderRadius:compact?9:15}} />
  </View>;
}
const styles=StyleSheet.create({
 frame:{alignSelf:'center',borderRadius:19,overflow:'hidden',borderWidth:2,borderColor:'#351326',backgroundColor:'#FFF0CF'},
 compact:{borderRadius:12,borderBottomWidth:4}
});
