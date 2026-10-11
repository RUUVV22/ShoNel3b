import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function FormField({ label, icon, style, inputStyle, ...inputProps }) {
  return (
    <View style={[styles.field, style]}>
      {label ? <ArabicText weight="bold" style={styles.label}>{label}</ArabicText> : null}
      <View style={styles.inputShell}>
        {icon ? <Ionicons name={icon} size={21} color={colors.plum} /> : null}
        <TextInput placeholderTextColor={colors.inkMuted} {...inputProps}
          style={[styles.input, inputStyle]} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { color: colors.cream, fontSize: 14 },
  inputShell: {
    minHeight: 56, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, borderWidth: 2, borderBottomWidth: 4,
    borderColor: colors.plum, borderRadius: radius.md, backgroundColor: colors.cream,
  },
  input: {
    flex: 1, color: colors.plum, fontFamily: 'Tajawal_500Medium',
    fontSize: 16, textAlign: 'right', writingDirection: 'rtl', paddingVertical: 8,
  },
});