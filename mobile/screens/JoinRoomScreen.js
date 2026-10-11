import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameHeader } from '../components/GameHeader';
import { BrandLogo } from '../components/BrandLogo';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArabicText } from '../components/ArabicText';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { parseRoomCode } from '../utils/deepLinks';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function JoinRoomScreen({ navigation, route }) {
  const { actions, busyAction, lastName } = useGame();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  useFocusEffect(useCallback(() => { setName(''); }, []));
  const [roomCode, setRoomCode] = useState(parseRoomCode(route.params?.roomCode) || '');
  useEffect(() => {
    const parsed = parseRoomCode(route.params?.roomCode);
    if (parsed) setRoomCode(parsed);
  }, [route.params?.roomCode]);
  const submit = async () => {
    const code = parseRoomCode(roomCode);
    if (!code) return;
    const response = await actions.joinRoom(code, name);
    if (response.ok) navigation.replace('Lobby');
  };
  return (
    <ScreenContainer keyboard contentStyle={styles.content}>
      <GameHeader title={t('انضم للشِلّة!', 'JOIN GAME NIGHT')} subtitle={t('رمز صغير وبصير كلنا مع بعض', 'One code brings everyone together')}
        onBack={() => navigation.goBack()} />
      <View style={styles.intro}>
        <BrandLogo size={116} />
        <View style={styles.introText}>
          <ArabicText weight="extraBold" style={styles.heading}>{t('مين مستنّيك؟', "YOU'RE INVITED!")}</ArabicText>
          <ArabicText style={styles.description}>{t('هات رمز الغرفة وفوت عالطاولة!', 'Enter your room code and pull up a chair.')}</ArabicText>
        </View>
      </View>
      <View style={styles.formCard}>
        <ArabicText weight="extraBold" style={styles.formTitle}>{t('بطاقة دخول اللمّة', 'YOUR INVITATION')}</ArabicText>
        <FormField label={t('رمز الغرفة', 'Room code')} icon="keypad-outline" value={roomCode}
          onChangeText={v => setRoomCode(v.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0,5))}
          placeholder="A7K92" maxLength={5} autoCapitalize="characters" autoCorrect={false}
          inputStyle={styles.codeInput} />
        <View style={styles.dividerRow}>
          <View style={styles.divider} /><ArabicText style={styles.or}>{t('أو امسح', 'OR SCAN')}</ArabicText><View style={styles.divider} />
        </View>
        <PrimaryButton compact title={t('امسح QR', 'SCAN QR CODE')} icon="qr-code-outline"
          variant="ghost" onPress={() => navigation.navigate('QRScanner')} />
        <FormField label={t('اسمك باللعبة', 'Your player name')} icon="person-outline" value={name}
          onChangeText={setName} placeholder={t('مثال: سارة', 'e.g. Sara')}
          maxLength={20} autoCorrect={false} returnKeyType="done" onSubmitEditing={submit} />
        <PrimaryButton title={t('يلا فوت!', 'JOIN THE ROOM!')} icon="enter-outline" variant="red"
          loading={busyAction === 'room:join'} disabled={!parseRoomCode(roomCode) || name.trim().length < 2} onPress={submit} />
      </View>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: { justifyContent: 'center', maxWidth: 560, width: '100%', alignSelf: 'center' },
  intro: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  introText: { flex: 1 },
  heading: { color: colors.plum, fontSize: 29 },
  description: { color: colors.inkMuted, fontSize: 13 },
  formCard: { gap: spacing.md, padding: spacing.lg, borderWidth: 2.5, borderBottomWidth: 8,
    borderColor: colors.plum, borderRadius: radius.lg, backgroundColor: colors.plum },
  formTitle: { color: colors.mustard, fontSize: 21 },
  codeInput: { writingDirection: 'ltr', textAlign: 'center', letterSpacing: 7, fontSize: 23 },
  dividerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  divider: { height: 1, flex: 1, backgroundColor: colors.line },
  or: { color: colors.paperMuted, fontSize: 11 },
});