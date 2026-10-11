import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { BrandLogo } from '../components/BrandLogo';
import { ArabicText } from '../components/ArabicText';
import { PrimaryButton } from '../components/PrimaryButton';
import { ConnectionPill } from '../components/ConnectionPill';
import { FormField } from '../components/FormField';
import { InstallAppButton } from '../components/InstallAppButton';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { PaperTexture } from '../components/PaperTexture';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { STATUS } from '../constants/game';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function HomeScreen({ navigation }) {
  const { serverUrl, connectionStatus, session, gameState, updateServerUrl } = useGame();
  const { language, changeLanguage, t } = useLanguage();
  const [editingServer, setEditingServer] = useState(false);
  const [serverDraft, setServerDraft] = useState(serverUrl);
  const heroScale = useRef(new Animated.Value(0.94)).current;
  useEffect(() => setServerDraft(serverUrl), [serverUrl]);
  useEffect(() => {
    Animated.spring(heroScale, { toValue: 1, friction: 6, tension: 68, useNativeDriver: true }).start();
  }, [heroScale]);
  const continueGame = () => {
    if (!gameState) return;
    navigation.navigate(gameState.status === STATUS.LOBBY ? 'Lobby' : 'Game');
  };
  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.topBar}>
        <View style={styles.languageRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Arabic" onPress={() => changeLanguage('ar')}
            style={[styles.langOption, language === 'ar' && styles.langSelected]}>
            <ArabicText weight="bold" style={[styles.langText, language === 'ar' && styles.langSelectedText]}>عربي</ArabicText>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="English" onPress={() => changeLanguage('en')}
            style={[styles.langOption, language === 'en' && styles.langSelected]}>
            <ArabicText weight="bold" style={[styles.langText, language === 'en' && styles.langSelectedText]}>EN</ArabicText>
          </Pressable>
        </View>
        <View style={styles.topRight}>
          <ConnectionPill status={connectionStatus} />
          <Pressable accessibilityRole="button" accessibilityLabel="Server settings" onPress={() => setEditingServer(v => !v)} style={styles.settings}>
            <Ionicons name="settings-outline" size={21} color={colors.cream} />
          </Pressable>
        </View>
      </View>

      <Animated.View style={[styles.hero, { transform: [{ scale: heroScale }] }]}>
        <PaperTexture dark />
        <View style={styles.decorationLeft}><ArabicText style={styles.decorationText}>✳</ArabicText></View>
        <View style={styles.decorationRight}><ArabicText style={styles.decorationText}>✦</ArabicText></View>
        <View style={styles.sticker}><ArabicText weight="extraBold" style={styles.stickerText}>
          {t('ليلة اللعب!', 'GAME NIGHT!')}
        </ArabicText></View>
        <BrandLogo size={230} />
        <ArabicText weight="extraBold" style={styles.heroSubtitle}>
          {t('يا جماعة... شو نلعب؟', "What are we playing tonight?")}
        </ArabicText>
        <ArabicText style={styles.heroBody}>
          {t('غرفة وحدة، أصحابك كلهم، وألعاب ما بتخلص.', 'One room. All your friends. Endless fun.')}
        </ArabicText>
        <View style={styles.confettiBar}><View style={styles.confettiCoral}/><View style={styles.confettiMustard}/><View style={styles.confettiCream}/></View>
      </Animated.View>

      {editingServer ? (
        <View style={styles.serverPanel}>
          <ArabicText weight="extraBold" style={styles.serverTitle}>{t('عنوان سيرفر اللعب', 'GAME SERVER ADDRESS')}</ArabicText>
          <ArabicText style={styles.serverHelp}>{t('استعمل عنوان السيرفر الذي يلعب عليه أصدقاؤك.', 'Use the server address shared by your friends.')}</ArabicText>
          <FormField icon="globe-outline" value={serverDraft} onChangeText={setServerDraft}
            autoCapitalize="none" autoCorrect={false} keyboardType="url"
            inputStyle={{ writingDirection: 'ltr', textAlign: 'left', fontSize: 13 }} />
          <PrimaryButton compact title={t('حفظ', 'Save')} onPress={async () => {
            if (await updateServerUrl(serverDraft)) setEditingServer(false);
          }} />
        </View>
      ) : null}

      <View style={styles.sectionHead}>
        <ArabicText weight="extraBold" style={styles.sectionTitle}>{t('يلا نلعب!', "LET'S PLAY!")}</ArabicText>
        <View style={styles.roundLabel}><ArabicText weight="bold" style={styles.roundText}>{t('اختاروا لعبتكم', 'PICK A GAME')}</ArabicText></View>
      </View>
      <View style={styles.actions}>
        {session ? (
          <PrimaryButton title={gameState ? t('كمّل مع شِلّتك', 'Back to my room') : t('بنرجّع الغرفة...', 'Restoring room...')}
            icon="refresh-circle-outline" disabled={!gameState} onPress={continueGame} />
        ) : null}
        <PrimaryButton title={t('أنشئ غرفة للّمة', 'Create a party room')} icon="add-circle-outline"
          variant="red" onPress={() => navigation.navigate('CreateRoom')} />
        <PrimaryButton title={t('انضم للشِلّة', 'Join your friends')} icon="enter-outline"
          variant="gold" onPress={() => navigation.navigate('JoinRoom')} />
      </View>

      <View style={styles.gameShelf}>
        <View style={styles.gameShelfHeading}>
          <ArabicText weight="extraBold" style={styles.shelfTitle}>{t('على الطاولة', 'ON THE TABLE')}</ArabicText>
          <View style={styles.shelfPill}><ArabicText weight="bold" style={styles.shelfPillText}>03 / 03</ArabicText></View>
        </View>
        <View style={styles.gameFeature}>
          <View style={styles.cardArt}>
            <View style={styles.avatarFanOne}><CharacterAvatar name="عاصم" size={48} accent={colors.coral} /></View>
            <View style={styles.avatarFanTwo}><CharacterAvatar name="ليلى" size={48} accent={colors.mustard} /></View>
          </View>
          <View style={styles.featureCopy}>
            <ArabicText weight="extraBold" style={styles.featureTitle}>{t('كود نيمز', 'CODENAMES')}</ArabicText>
            <ArabicText style={styles.featureDescription}>{t('تلميحة وحدة.. ومليون احتمال!', 'One clue. A million possibilities.')}</ArabicText>
          </View>
          <View style={styles.playTag}><ArabicText weight="bold" style={styles.playTagText}>{t('جاهزة', 'PLAYABLE')}</ArabicText></View>
        </View>
        <View style={[styles.gameFeature, { marginTop: 12, backgroundColor: colors.coral }]}>
          <View style={styles.cardArt}><ArabicText style={{fontSize:40}}>🐺</ArabicText></View>
          <View style={styles.featureCopy}>
            <ArabicText weight="extraBold" style={styles.featureTitle}>{t('ليلة العقارب','WEREWOLF')}</ArabicText>
            <ArabicText style={styles.featureDescription}>{t('أسرار القرية.. الذئاب والعقارب','Secret roles and a night of mystery')}</ArabicText>
          </View>
          <View style={styles.playTag}><ArabicText style={styles.playTagText}>NEW</ArabicText></View>
        </View>
        <View style={[styles.gameFeature, { marginTop: 12, backgroundColor: colors.cream }]}>
          <View style={styles.cardArt}><ArabicText style={{fontSize:40}}>🎲</ArabicText></View>
          <View style={styles.featureCopy}>
            <ArabicText weight="extraBold" style={styles.featureTitle}>{t('خسّرني!','STUMP ME!')}</ArabicText>
            <ArabicText style={styles.featureDescription}>{t('ست فئات.. مين رح يخسّر مين؟','Six categories. One winner.')}</ArabicText>
          </View>
          <View style={styles.playTag}><ArabicText style={styles.playTagText}>NEW</ArabicText></View>
        </View>
        <ArabicText style={styles.comingSoon}>{t('ثلاث ألعاب، غرفة واحدة!','Three games, one room!')}</ArabicText>
      </View>
      <View style={styles.bottomActions}>
        <Pressable onPress={() => navigation.navigate('HowToPlay')} style={styles.helpButton}>
          <Ionicons name="help-circle-outline" color={colors.plum} size={17} />
          <ArabicText weight="bold" style={styles.helpText}>{t('كيف نلعب كود نيمز؟', 'How to play Codenames')}</ArabicText>
        </Pressable>
        <InstallAppButton />
      </View>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: { maxWidth: 670, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  topRight: { flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center' },
  languageRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: colors.plum, borderRadius: radius.pill, padding: 4 },
  langOption: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill },
  langSelected: { backgroundColor: colors.mustard },
  langText: { color: colors.cream, fontSize: 12 },
  langSelectedText: { color: colors.plum },
  settings: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.plum },
  hero: { alignItems: 'center', backgroundColor: colors.plum, overflow: 'hidden', padding: spacing.lg,
    borderColor: colors.plum, borderWidth: 3, borderBottomWidth: 9, borderRadius: 34, minHeight: 334,
    shadowColor: colors.plum, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 0.27, shadowRadius: 0 },
  decorationLeft: { position: 'absolute', left: 20, top: 55, transform: [{ rotate: '-15deg' }] },
  decorationRight: { position: 'absolute', right: 20, top: 90 },
  decorationText: { color: colors.mustard, fontSize: 46 },
  sticker: { backgroundColor: colors.coral, paddingHorizontal: 15, paddingVertical: 4, borderRadius: radius.pill,
    borderColor: colors.cream, borderWidth: 2, alignSelf: 'flex-start', transform: [{ rotate: '-6deg' }] },
  stickerText: { color: colors.plum, fontSize: 13 },
  heroSubtitle: { color: colors.cream, textAlign: 'center', fontSize: 22, marginTop: -10 },
  heroBody: { textAlign: 'center', color: colors.paperMuted, fontSize: 13, marginTop: 3 },
  confettiBar: { flexDirection: 'row', gap: 7, marginTop: spacing.md },
  confettiCoral: { height: 6, width: 39, backgroundColor: colors.coral, borderRadius: 6 },
  confettiMustard: { height: 6, width: 39, backgroundColor: colors.mustard, borderRadius: 6 },
  confettiCream: { height: 6, width: 39, backgroundColor: colors.cream, borderRadius: 6 },
  sectionHead: { marginTop: spacing.xl, marginBottom: spacing.md, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.plum, fontSize: 25 },
  roundLabel: { backgroundColor: colors.mustard, borderWidth: 1.5, borderColor: colors.plum, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 3, transform: [{ rotate: '3deg' }] },
  roundText: { color: colors.plum, fontSize: 11 },
  actions: { gap: spacing.md },
  serverPanel: { backgroundColor: colors.plum, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, marginTop: spacing.lg },
  serverTitle: { color: colors.cream, fontSize: 18 },
  serverHelp: { color: colors.paperMuted, fontSize: 12 },
  gameShelf: { marginTop: spacing.xl, backgroundColor: colors.cream, borderWidth: 2, borderColor: colors.plum,
    borderBottomWidth: 6, borderRadius: radius.lg, padding: spacing.md },
  gameShelfHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  shelfTitle: { color: colors.plum, fontSize: 19 },
  shelfPill: { backgroundColor: colors.plum, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  shelfPillText: { color: colors.cream, fontSize: 11 },
  gameFeature: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, backgroundColor: colors.mustard,
    borderWidth: 2, borderColor: colors.plum, borderRadius: radius.md, padding: spacing.md },
  cardArt: { width: 74, height: 62, justifyContent: 'center' },
  avatarFanOne: { position: 'absolute', right: 22, transform: [{ rotate: '-12deg' }] },
  avatarFanTwo: { position: 'absolute', right: 0, transform: [{ rotate: '9deg' }] },
  featureCopy: { flex: 1 },
  featureTitle: { color: colors.plum, fontSize: 18 },
  featureDescription: { color: colors.plum, fontSize: 11 },
  playTag: { backgroundColor: colors.cream, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.plum },
  playTagText: { fontSize: 10, color: colors.plum },
  comingSoon: { color: colors.inkMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.md },
  bottomActions: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginTop: spacing.xl },
  helpButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  helpText: { color: colors.plum, fontSize: 13 },
});