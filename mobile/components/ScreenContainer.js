import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaperTexture } from './PaperTexture';
import { colors } from '../theme/colors';
import { spacing } from '../theme/layout';

export function ScreenContainer({ children, scroll = true, contentStyle, keyboard = false }) {
  const {width}=useWindowDimensions();
  const adaptivePadding={paddingHorizontal:width<440?10:width<820?16:24,paddingTop:width<440?12:20};
  const content = scroll ? (
    <ScrollView style={{flex:1,width:'100%'}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, adaptivePadding, contentStyle]}>
      {children}
    </ScrollView>
  ) : <View style={[styles.fixedContent, adaptivePadding, contentStyle]}>{children}</View>;
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
  scrollContent: { flexGrow: 1, width: '100%', maxWidth: '100%', minWidth: 0, padding: spacing.lg, paddingBottom: spacing.xxl + 20, boxSizing:'border-box' },
  fixedContent: { flex: 1, width:'100%', minWidth:0, padding: spacing.lg },
});