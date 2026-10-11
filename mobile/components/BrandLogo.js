import React from 'react';
import { Image, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

// Both are the user's original artwork; no stand-in logo is generated.
const logos = {
  ar: require('../../assets/Warm retro Arabic-only game logo.png'),
  en: require('../../assets/Warm retro English-only logo.png'),
};
export function BrandLogo({ size = 220, language: override, style }) {
  const { language } = useLanguage();
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Image
        source={logos[override || language] || logos.ar}
        resizeMode="contain"
        accessibilityLabel="Sho Nel3b game logo"
        style={{ width: size, height: size }}
      />
    </View>
  );
}