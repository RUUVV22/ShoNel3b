import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

const variants = {
  gold: { background: colors.mustard, foreground: colors.plum },
  red: { background: colors.coral, foreground: colors.plum },
  blue: { background: colors.mustard, foreground: colors.plum },
  ghost: { background: colors.cream, foreground: colors.plum },
  danger: { background: colors.coral, foreground: colors.plum },
};

export function PrimaryButton({ title, icon, variant = 'gold', loading = false, disabled = false, compact = false, style, onPress }) {
  const palette = variants[variant] || variants.gold;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading} onPress={onPress}
      style={({ pressed }) => [
        styles.button, compact && styles.compact,
        { backgroundColor: palette.background },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={palette.foreground} /> : (
          <>
            {icon ? <Ionicons name={icon} size={compact ? 17 : 22} color={palette.foreground} /> : null}
            <ArabicText weight="extraBold" style={[styles.label, compact && styles.compactLabel, { color: palette.foreground }]}>
              {title}
            </ArabicText>
          </>
        )}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 56, borderRadius: radius.md, borderColor: colors.plum,
    borderWidth: 2.5, borderBottomWidth: 6, justifyContent: 'center',
    paddingHorizontal: spacing.lg, shadowColor: colors.plum, shadowRadius: 0,
    shadowOpacity: 0.28, shadowOffset: { width: 3, height: 4 }, elevation: 3,
  },
  compact: { minHeight: 41, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderBottomWidth: 4 },
  content: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  label: { fontSize: 18, textAlign: 'center' },
  compactLabel: { fontSize: 14 },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ translateY: 3 }, { scale: 0.995 }], borderBottomWidth: 3 },
});