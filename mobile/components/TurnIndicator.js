import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ArabicText } from './ArabicText';
import { TEAM_LABEL } from '../constants/game';
import { colors, teamColor } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function TurnIndicator({ team, isMyTurn }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.035, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [scale, team]);

  return (
    <Animated.View style={[styles.container, { borderColor: teamColor(team), transform: [{ scale }] }]}>
      <View style={[styles.dot, { backgroundColor: teamColor(team) }]} />
      <View style={styles.copy}>
        <ArabicText weight="bold" style={styles.label}>دور {TEAM_LABEL[team] || 'الفريق'}</ArabicText>
        <ArabicText style={[styles.meta, isMyTurn && styles.myTurn]}>{isMyTurn ? 'دورك الآن' : 'انتظر دور فريقك'}</ArabicText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 5,
    backgroundColor: colors.panel,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dot: { width: 12, height: 34, borderRadius: radius.pill },
  copy: { flex: 1 },
  label: { fontSize: 16 },
  meta: { color: colors.muted, fontSize: 12 },
  myTurn: { color: colors.gold },
});
