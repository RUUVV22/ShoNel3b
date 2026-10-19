import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { SCORPION_CARD_BACK, SCORPION_CARD_HEIGHT_PER_WIDTH } from '../constants/scorpionCards';
import { getScorpionCardArt, getScorpionRole } from '../constants/scorpionAssets';

// The server never sends other players' cards until RESULT. Front artwork is
// rendered only for an authorized private reveal, observation, or final result.
export function ScorpionPokerCard({ roleId, variant = 0, width, faceUp = false, instant = false }) {
  const flip = useRef(new Animated.Value(faceUp ? 1 : 0)).current;
  useEffect(() => {
    if (instant) {
      flip.setValue(faceUp ? 1 : 0);
      return;
    }
    const animation = Animated.timing(flip, {
      toValue: faceUp ? 1 : 0,
      duration: 370,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [faceUp, flip, instant]);
  const art = roleId ? getScorpionCardArt(roleId, variant) : null;
  const backRotation = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const frontRotation = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const cardHeight = width * SCORPION_CARD_HEIGHT_PER_WIDTH;
  return (
    <View accessibilityLabel={faceUp ? (getScorpionRole(roleId)?.name || 'بطاقة') : 'بطاقة مقلوبة'}
      style={[styles.frame, { width, height: cardHeight, borderRadius: Math.max(3, width * 0.055) }]}>
      <Animated.View style={[styles.face, { transform: [{ rotateY: backRotation }] }]}>
        <Image source={SCORPION_CARD_BACK} resizeMode="stretch" style={styles.art} />
      </Animated.View>
      {roleId ? <Animated.View style={[styles.face, { transform: [{ rotateY: frontRotation }] }]}>
        {art ? (
          <Image source={art} resizeMode="stretch" style={styles.art} />
        ) : (
          <View style={styles.missing}>
            <ArabicText weight="bold" adjustsFontSizeToFit numberOfLines={2}
              style={[styles.missingName, { fontSize: Math.max(8, width * .15) }]}>
              {getScorpionRole(roleId)?.name || 'بطاقة'}
            </ArabicText>
            <ArabicText style={[styles.missingCaption, { fontSize: Math.max(6, width * .09) }]}>
              الرسم مفقود
            </ArabicText>
          </View>
        )}
      </Animated.View> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.plum, borderWidth: 1, borderColor: colors.mustard },
  face: { ...StyleSheet.absoluteFillObject, backfaceVisibility: 'hidden', overflow: 'hidden' },
  art: { width: '100%', height: '100%' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cream, padding: 2, gap: 1 },
  missingName: { color: colors.plum, textAlign: 'center' },
  missingCaption: { color: colors.coral, textAlign: 'center' },
});
