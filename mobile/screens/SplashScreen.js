import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BrandLogo } from '../components/BrandLogo';
import { PaperTexture } from '../components/PaperTexture';
import { ArabicText } from '../components/ArabicText';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/layout';

export function SplashScreen({ navigation }) {
  const { t } = useLanguage();
  const pop = useRef(new Animated.Value(0.8)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => navigation.replace('Home'), 1900);
    return () => clearTimeout(timer);
  }, [fade, navigation, pop]);

  return (
    <View style={styles.screen}>
      <PaperTexture />
      <View style={styles.sunTop} />
      <View style={styles.sunBottom} />
      <Animated.View style={[styles.poster, { opacity: fade, transform: [{ scale: pop }] }]}>
        <View style={styles.tape} />
        <View style={styles.starLeft}><ArabicText style={styles.starText}>✳</ArabicText></View>
        <View style={styles.starRight}><ArabicText style={styles.starText}>✦</ArabicText></View>
        <BrandLogo size={254} />
        <View style={styles.rule} />
        <ArabicText weight="extraBold" style={styles.subtitle}>{t('لمّة أحلى، ألعاب أكثر!', 'MORE GAMES. MORE MEMORIES.')}</ArabicText>
        <ArabicText style={styles.body}>{t('جمّع الشِلّة واختاروا اللعبة', 'Get the gang together and pick a game')}</ArabicText>
        <View style={styles.tokens}>
          {[colors.coral, colors.mustard, colors.cream].map((color, index) => (
            <View key={index} style={[styles.token, { backgroundColor: color }]} />
          ))}
        </View>
      </Animated.View>
      <ArabicText style={styles.footer}>SHO NEL3B? • GAME NIGHT CLUB</ArabicText>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, overflow: 'hidden' },
  poster: { alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 480, minHeight: 450, borderWidth: 3, borderBottomWidth: 9, borderColor: colors.plum,
    borderRadius: 36, backgroundColor: colors.plum, padding: spacing.lg, shadowColor: colors.plum, shadowOpacity: 0.32, shadowRadius: 0, shadowOffset: { width: 7, height: 9 } },
  tape: { width: 90, height: 15, backgroundColor: colors.mustard, position: 'absolute', top: -10, transform: [{ rotate: '-4deg' }], borderWidth: 1.5, borderColor: colors.plum },
  sunTop: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: colors.mustard, top: -76, right: -65, borderWidth: 3, borderColor: colors.plum },
  sunBottom: { position: 'absolute', width: 185, height: 185, borderRadius: 94, backgroundColor: colors.coral, bottom: -95, left: -65, borderWidth: 3, borderColor: colors.plum },
  starLeft: { position: 'absolute', top: 62, left: 26, transform: [{ rotate: '-18deg' }] },
  starRight: { position: 'absolute', top: 88, right: 24 },
  starText: { fontSize: 43, color: colors.mustard },
  rule: { width: 128, height: 5, backgroundColor: colors.coral, borderRadius: 5, marginTop: -7, marginBottom: spacing.lg },
  subtitle: { color: colors.cream, fontSize: 24, lineHeight: 34, textAlign: 'center' },
  body: { color: colors.paperMuted, fontSize: 14, textAlign: 'center', marginTop: 6 },
  tokens: { flexDirection: 'row', gap: 9, marginTop: spacing.xl },
  token: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: colors.cream },
  footer: { position: 'absolute', bottom: 24, color: colors.inkMuted, fontSize: 11, letterSpacing: 2, textAlign: 'center' },
});