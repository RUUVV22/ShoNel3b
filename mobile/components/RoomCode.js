import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function RoomCode({ code, onCopied }) {
  const copy = async () => {
    await Clipboard.setStringAsync(code);
    onCopied?.();
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={'رمز الغرفة ' + code} onPress={copy} style={styles.container}>
      <View>
        <ArabicText weight="bold" style={styles.caption}>✦ رمز اللمّة ✦</ArabicText>
        <ArabicText weight="extraBold" style={styles.code}>{code}</ArabicText>
      </View>
      <View style={styles.copy}><Ionicons name="copy-outline" size={19} color={colors.plum} /></View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md,
    backgroundColor: colors.cream, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.plum,
    borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  caption: { color: colors.inkMuted, fontSize: 12 },
  code: { color: colors.plum, fontSize: 30, letterSpacing: 5, writingDirection: 'ltr', textAlign: 'right' },
  copy: { backgroundColor: colors.mustard, borderWidth: 1.5, borderColor: colors.plum,
    width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});