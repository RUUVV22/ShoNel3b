import React from 'react';
import { I18nManager, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/tajawal';
import { GameProvider } from './mobile/context/GameContext';
import { LanguageProvider } from './mobile/context/LanguageContext';
import { AppNavigator } from './mobile/navigation/AppNavigator';
import { GlobalNotice } from './mobile/components/GlobalNotice';
import { GameAudio } from './mobile/components/GameAudio';
import { colors } from './mobile/theme/colors';

if (Platform.OS === 'web') {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }
} else {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
  });

  if (!fontsLoaded) return <View style={styles.loading} />;
  return (
    <SafeAreaProvider>
      <LanguageProvider>
      <GameProvider>
        <GameAudio />
        <StatusBar style="dark" />
        <AppNavigator />
        <GlobalNotice />
      </GameProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.cream },
});
