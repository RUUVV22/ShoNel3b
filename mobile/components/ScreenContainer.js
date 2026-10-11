import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaperTexture } from './PaperTexture';
import { colors } from '../theme/colors';
import { spacing } from '../theme/layout';

export function ScreenContainer({ children, scroll = true, contentStyle, keyboard = false }) {
  const content = scroll ? (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, contentStyle]}>
      {children}
    </ScrollView>
  ) : <View style={[styles.fixedContent, contentStyle]}>{children}</View>;
  return (
    <View style={styles.background}>
      <PaperTexture />
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        {keyboard ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
            {content}
          </KeyboardAvoidingView>
        ) : content}
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.cream },
  safeArea: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl + 20 },
  fixedContent: { flex: 1, padding: spacing.lg },
});