import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function GameHeader({ title, subtitle, onBack, rightIcon, onRightPress }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="العودة" onPress={onBack} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="arrow-forward" size={22} color={colors.cream} />
        </Pressable>
      ) : <View style={styles.placeholder} />}
      <View style={styles.copy}>
        <ArabicText weight="extraBold" style={styles.title}>{title}</ArabicText>
        {subtitle ? <ArabicText style={styles.subtitle}>{subtitle}</ArabicText> : null}
      </View>
      {rightIcon ? (
        <Pressable accessibilityRole="button" accessibilityLabel="خيارات" onPress={onRightPress} style={styles.iconButton} hitSlop={8}>
          <Ionicons name={rightIcon} size={22} color={colors.cream} />
        </Pressable>
      ) : <View style={styles.placeholder} />}
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg,
    backgroundColor: colors.plum, borderWidth: 2, borderColor: colors.plum,
    borderBottomWidth: 6, borderRadius: radius.lg, padding: spacing.sm,
  },
  copy: { flex: 1, alignItems: 'center' },
  title: { fontSize: 21, textAlign: 'center', color: colors.cream },
  subtitle: { fontSize: 11, textAlign: 'center', color: colors.paperMuted },
  iconButton: { width: 42, height: 42, borderRadius: radius.sm, backgroundColor: colors.panelRaised,
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  placeholder: { width: 42, height: 42 },
});