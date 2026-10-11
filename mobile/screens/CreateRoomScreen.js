import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameHeader } from '../components/GameHeader';
import { BrandLogo } from '../components/BrandLogo';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArabicText } from '../components/ArabicText';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function CreateRoomScreen({ navigation }) {
  const { actions, busyAction, lastName } = useGame();
  const { t } = useLanguage();
  const [name, setName] = useState(lastName);
  const submit = async () => {
    const response = await actions.createRoom(name);
    if (response.ok) navigation.replace('Lobby');
  };
  return (
    <ScreenContainer keyboard contentStyle={styles.content}>
      <GameHeader title={t('سوّي لَمّة!', 'HOST GAME NIGHT')} subtitle={t('غرفتك، أصحابك، لعبتك', 'Your room. Your friends. Your games.')}
        onBack={() => navigation.goBack()} />
      <View style={styles.intro}>
        <BrandLogo size={125} />
        <View style={styles.introText}>
          <ArabicText weight="extraBold" style={styles.heading}>{t('صاحب اللمّة؟', 'THE HOST!')}</ArabicText>
          <ArabicText style={styles.description}>{t('افتح غرفة، ابعث الرمز، واختار لعبة الكل يلعبها معك.', 'Open a room, share the code, and pick a game everyone can play.')}</ArabicText>
        </View>
      </View>
      <View style={styles.formCard}>
        <View style={styles.cardDecoration}><ArabicText style={styles.cardDecorationText}>✳</ArabicText></View>
        <ArabicText weight="extraBold" style={styles.formTitle}>{t('حضّر بطاقة دخولك', 'YOUR PARTY PASS')}</ArabicText>
        <FormField label={t('اسمك باللعبة', 'Your player name')} icon="person-outline" value={name}
          onChangeText={setName} placeholder={t('مثال: أحمد', 'e.g. Alex')} maxLength={20} autoCorrect={false}
          returnKeyType="done" onSubmitEditing={submit} />
        <PrimaryButton title={t('أنشئ الغرفة!', 'CREATE ROOM!')} icon="sparkles-outline" variant="red"
          loading={busyAction === 'room:create'} disabled={name.trim().length < 2} onPress={submit} />
      </View>
      <ArabicText style={styles.note}>{t('ما بدها تسجيل! بس اسم ورمز للغرفة.', 'No account needed, just a name and room code.')}</ArabicText>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: { justifyContent: 'center', maxWidth: 560, width: '100%', alignSelf: 'center' },
  intro: { flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.xl },
  introText: { flex: 1 },
  heading: { color: colors.plum, fontSize: 30, lineHeight: 38 },
  description: { color: colors.inkMuted, fontSize: 13, marginTop: 3, lineHeight: 20 },
  formCard: { overflow: 'hidden', gap: spacing.lg, padding: spacing.lg, borderWidth: 2.5,
    borderBottomWidth: 8, borderColor: colors.plum, borderRadius: radius.lg, backgroundColor: colors.plum,
    shadowColor: colors.plum, shadowOpacity: 0.23, shadowOffset: { width: 5, height: 6 }, shadowRadius: 0 },
  formTitle: { color: colors.mustard, fontSize: 21 },
  cardDecoration: { position: 'absolute', left: 10, top: 0 },
  cardDecorationText: { color: colors.coral, fontSize: 60 },
  note: { color: colors.inkMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.xl },
});