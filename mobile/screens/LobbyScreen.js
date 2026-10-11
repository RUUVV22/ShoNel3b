import React, { useEffect, useRef } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameHeader } from '../components/GameHeader';
import { RoomCode } from '../components/RoomCode';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { TeamPanel } from '../components/TeamPanel';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArabicText } from '../components/ArabicText';
import { ConnectionPill } from '../components/ConnectionPill';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { WerewolfRoleSetup } from '../components/WerewolfRoleSetup';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { ROLE, STATUS, TEAM } from '../constants/game';
import { colors, teamColor } from '../theme/colors';
import { radius, spacing } from '../theme/layout';
import { roomJoinUrl } from '../utils/deepLinks';
import { soundService } from '../services/sounds';

export function LobbyScreen({ navigation }) {
  const { actions, busyAction, connectionStatus, gameState, session, showNotice } = useGame();
  const { t } = useLanguage();
  const previousPlayerCount = useRef(null);

  useEffect(() => {
    if (!session) navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    else if (gameState?.status === STATUS.ACTIVE || gameState?.status === STATUS.FINISHED) navigation.replace('Game');
  }, [gameState?.status, navigation, session]);

  useEffect(() => {
    const n = gameState?.players?.length;
    if (Number.isInteger(n) && Number.isInteger(previousPlayerCount.current) && n !== previousPlayerCount.current) {
      soundService.play(n > previousPlayerCount.current ? 'join' : 'leave');
    }
    if (Number.isInteger(n)) previousPlayerCount.current = n;
  }, [gameState?.players?.length]);

  if (!gameState) return (
    <ScreenContainer scroll={false} contentStyle={styles.loading}>
      <ArabicText style={styles.loadingText}>{t('بنرجّع لمّتك...', 'Restoring your room...')}</ArabicText>
    </ScreenContainer>
  );

  const me = gameState.players.find(player => player.id === gameState.currentPlayerId);
  const host = gameState.players.find(player => player.id === gameState.hostId);
  const isHost = Boolean(me?.isHost);
  const isCodenames = gameState.selectedGameId === 'CODENAMES';
  const selectedGame = (gameState.availableGames || []).find(game => game.id === gameState.selectedGameId);
  const serverNeedsUpdate = !(gameState.availableGames || []).some(game => game.id === 'WEREWOLF') || !(gameState.availableGames || []).some(game => game.id === 'KHASERNY');
  const redPlayers = gameState.players.filter(p => p.team === TEAM.RED);
  const bluePlayers = gameState.players.filter(p => p.team === TEAM.BLUE);
  const connectedCount = gameState.players.filter(p => p.connected).length;

  const toggleRole = player => actions.updatePlayer(player.id, player.team,
    player.role === ROLE.SPYMASTER ? ROLE.AGENT : ROLE.SPYMASTER);
  const moveTeam = player => actions.updatePlayer(player.id,
    player.team === TEAM.RED ? TEAM.BLUE : TEAM.RED, player.role);
  const confirm = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) onConfirm();
    } else {
      Alert.alert(title, message, [
        { text: t('إلغاء', 'Cancel'), style: 'cancel' },
        { text: t('تأكيد', 'Confirm'), style: 'destructive', onPress: onConfirm },
      ]);
    }
  };
  const removePlayer = player => confirm('إزالة لاعب', 'إزالة ' + player.name + ' من اللمّة؟',
    () => actions.removePlayer(player.id));
  const leave = () => confirm('مغادرة الغرفة', 'متأكد إنك بدك تترك اللمّة؟', async () => {
    await actions.leaveRoom();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  });
  const playerListProps = {
    editable: isHost, currentPlayerId: me?.id, onToggleRole: toggleRole, onMoveTeam: moveTeam, onRemove: removePlayer,
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <GameHeader title={t('غرفة الشِلّة', 'THE GAME ROOM')} subtitle={t('الكل هون.. شو نلعب؟', "Everyone's here. What's next?")} onBack={leave} />
      <View style={styles.pills}>
        <ConnectionPill status={connectionStatus} />
        <View style={styles.hostPill}>
          <Ionicons name="star" size={14} color={colors.plum} />
          <ArabicText weight="bold" style={styles.hostPillText}>
            {t('المضيف: ', 'Host: ')}{host?.name || '...'}
          </ArabicText>
        </View>
      </View>

      <View style={styles.roomPanel}>
        <View style={styles.roomHeading}>
          <ArabicText weight="extraBold" style={styles.roomHeadingText}>{t('✨ بطاقة اللمّة', '✦ YOUR PARTY PASS')}</ArabicText>
          <ArabicText style={styles.roomInstructions}>{t('ابعث الرمز لأصحابك وخلي اللمّة تكبر!', 'Share your code and gather the gang!')}</ArabicText>
        </View>
        <RoomCode code={gameState.roomId} onCopied={() => showNotice(t('نسخنا الرمز!', 'Room code copied!'), 'success')} />
        <View style={styles.qrWrap}>
          <QRCodeDisplay roomCode={gameState.roomId} compact />
          <View style={styles.inviteCopy}>
            <ArabicText weight="extraBold" style={styles.inviteTitle}>{t('جاهزين للّمة؟', 'INVITE YOUR FRIENDS')}</ArabicText>
            <ArabicText style={styles.inviteText}>{t('شارك الرابط أو خلّي صاحبك يمسح الرمز.', 'Share the link or scan this code.')}</ArabicText>
            <ArabicText style={styles.deepLink} numberOfLines={2}>{roomJoinUrl(gameState.roomId)}</ArabicText>
          </View>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <ArabicText weight="extraBold" style={styles.sectionTitle}>{t('اللي قاعدين معنا', 'AT THE TABLE')}</ArabicText>
        <View style={styles.countTag}><ArabicText weight="bold" style={styles.countText}>{connectedCount}/{gameState.maxPlayers}</ArabicText></View>
      </View>
      <View style={styles.roster}>
        {gameState.players.map(player => (
          <View key={player.id} style={[styles.rosterCard, !player.connected && styles.offline]}>
            <CharacterAvatar name={player.name} accent={teamColor(player.team)} size={47} />
            <ArabicText weight="bold" style={styles.rosterName} numberOfLines={1}>{player.name}</ArabicText>
            {player.isHost ? <Ionicons name="star" color={colors.coral} size={14} /> : null}
          </View>
        ))}
      </View>

      <View style={styles.sectionHead}>
        <ArabicText weight="extraBold" style={styles.sectionTitle}>{t('شو بدنا نلعب؟', "WHAT'S ON THE TABLE?")}</ArabicText>
        <ArabicText style={styles.sectionHint}>{isHost ? t('إنت صاحب القرار', 'Host chooses') : t('المضيف بختار', 'Host picks')}</ArabicText>
      </View>
      {serverNeedsUpdate ? <View style={styles.readiness}><Ionicons name="warning-outline" size={22} color={colors.plum}/><ArabicText style={styles.readinessText}>{t('السيرفر المتصل قديم! لازم تحدّث وتشغّل الـ Node.js backend الجديد (مش بس الويب). افحص عنوان السيرفر من الإعدادات بالصفحة الرئيسية.','This room is connected to an older backend. Deploy/restart the updated Node.js game server, not just the website. Check your server address in Home settings.')}</ArabicText></View> : null}
      {(gameState.availableGames || []).map(game => {
        const selected = game.id === gameState.selectedGameId;
        return (
          <Pressable key={game.id} accessibilityRole="button" accessibilityLabel={game.englishTitle || game.title}
            accessibilityState={{ selected, disabled: !isHost }}
            disabled={!isHost || busyAction === 'lobby:select-game'}
            onPress={() => actions.selectGame(game.id)}
            style={({ pressed }) => [styles.gameOption, selected && styles.gameSelected, pressed && styles.pressed]}>
            <View style={styles.gameSymbol}>
              <View style={[styles.tinyCard, { backgroundColor: colors.coral, transform: [{ rotate: '-13deg' }] }]} />
              <View style={[styles.tinyCard, { backgroundColor: colors.mustard, transform: [{ rotate: '13deg' }] }]} />
            </View>
            <View style={styles.gameCopy}>
              <ArabicText weight="extraBold" style={styles.gameTitle}>{t(game.title, game.englishTitle || game.title)}</ArabicText>
              <ArabicText style={styles.gameDesc}>{t(game.description, 'The secret-word party challenge')}</ArabicText>
              <ArabicText weight="medium" style={styles.gamePlayers}>{game.minPlayers}–{game.maxPlayers} {t('لاعبين', 'players')}</ArabicText>
            </View>
            <View style={[styles.selectMark, selected && styles.selectMarkActive]}>
              <Ionicons name={selected ? 'checkmark' : 'add'} color={colors.plum} size={23} />
            </View>
          </Pressable>
        );
      })}
      <View style={styles.future}>
        <Ionicons name="sparkles-outline" color={colors.inkMuted} size={17} />
        <ArabicText style={styles.futureText}>{t('ألعاب ثانية بالطريق.. نفس الغرفة، نفس الشِلّة!', 'More games coming. Same room, same friends!')}</ArabicText>
      </View>

      {gameState.selectedGameId === 'WEREWOLF' ? <WerewolfRoleSetup players={connectedCount} initial={gameState.werewolfRoleDeck} editable={isHost} onSave={actions.configureWerewolf} /> : null}
      {isCodenames ? (
        <>
          <View style={styles.sectionHead}>
            <ArabicText weight="extraBold" style={styles.sectionTitle}>{t('وزّعوا الفرق!', 'CHOOSE YOUR TEAM')}</ArabicText>
          </View>
          <ArabicText style={styles.teamHelp}>{t('اختار فريقك. المضيف بقدر يغيّر الأدوار وينقل اللاعبين.', 'Join a team. The host can manage roles and players.')}</ArabicText>
          <View style={styles.teams}>
            <TeamPanel team={TEAM.RED} players={redPlayers}
              selected={me?.team === TEAM.RED} joining={busyAction === 'lobby:choose-team'}
              onJoin={() => actions.chooseTeam(TEAM.RED)} {...playerListProps} />
            <TeamPanel team={TEAM.BLUE} players={bluePlayers}
              selected={me?.team === TEAM.BLUE} joining={busyAction === 'lobby:choose-team'}
              onJoin={() => actions.chooseTeam(TEAM.BLUE)} {...playerListProps} />
          </View>
        </>
      ) : null}

      <View style={[styles.readiness, gameState.canStart && styles.ready]}>
        <Ionicons name={gameState.canStart ? 'checkmark-circle' : 'information-circle'}
          size={20} color={colors.plum} />
        <ArabicText weight="bold" style={styles.readinessText}>
          {!selectedGame ? t('المضيف يختار اللعبة أولاً', 'Waiting for the host to choose a game')
            : gameState.canStart ? t('جاهزين! يلا نبلّش الجولة', "Everyone's ready to play!")
              : isCodenames ? t('كود نيمز تحتاج ٤: قائد ولاعب في كل فريق', 'Codenames needs 4 players: a spymaster and agent on each team') : t('بانتظار العدد المطلوب من اللاعبين','Waiting for enough players')}
        </ArabicText>
      </View>
      {isHost ? (
        <PrimaryButton title={selectedGame ? t('يلا نلعب!', 'START GAME!') : t('اختار لعبة أولاً', 'CHOOSE A GAME')}
          icon="play" variant="red" disabled={!gameState.canStart}
          loading={busyAction === 'game:start'} onPress={actions.startGame} />
      ) : (
        <View style={styles.waitingHost}>
          <Ionicons name="hourglass-outline" size={18} color={colors.cream} />
          <ArabicText weight="bold" style={styles.waitingHostText}>
            {t('بنستنى المضيف يبلّش اللعبة...', 'Waiting for the host to start...')}
          </ArabicText>
        </View>
      )}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  loading: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.plum },
  pills: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md },
  hostPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.plum, borderRadius: radius.pill,
    backgroundColor: colors.mustard, paddingHorizontal: 12, paddingVertical: 6 },
  hostPillText: { color: colors.plum, fontSize: 12 },
  roomPanel: { backgroundColor: colors.plum, borderWidth: 2.5, borderBottomWidth: 8, borderColor: colors.plum,
    borderRadius: 26, padding: spacing.lg, gap: spacing.md, overflow: 'hidden',
    shadowColor: colors.plum, shadowOffset: { width: 4, height: 5 }, shadowOpacity: 0.2, shadowRadius: 0 },
  roomHeading: { gap: 2 },
  roomHeadingText: { color: colors.cream, fontSize: 22 },
  roomInstructions: { color: colors.paperMuted, fontSize: 12 },
  qrWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  inviteCopy: { flex: 1, gap: 6 },
  inviteTitle: { color: colors.mustard, fontSize: 16 },
  inviteText: { color: colors.cream, fontSize: 12 },
  deepLink: { fontSize: 10, color: colors.paperMuted, writingDirection: 'ltr', textAlign: 'left' },
  sectionHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { color: colors.plum, fontSize: 22 },
  sectionHint: { color: colors.inkMuted, fontSize: 11 },
  countTag: { backgroundColor: colors.mustard, borderRadius: radius.pill, borderColor: colors.plum, borderWidth: 1.5, paddingVertical: 3, paddingHorizontal: 11 },
  countText: { color: colors.plum, fontSize: 13 },
  roster: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  rosterCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexBasis: '45%', flexGrow: 1, minWidth: 143,
    backgroundColor: colors.cream, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.plum, borderRadius: radius.md,
    padding: 6, shadowColor: colors.plum, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.14, shadowRadius: 0 },
  offline: { opacity: 0.5 },
  rosterName: { flex: 1, color: colors.plum, fontSize: 13 },
  gameOption: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, borderWidth: 2.5,
    borderBottomWidth: 6, borderColor: colors.plum, borderRadius: radius.lg, backgroundColor: colors.cream, padding: spacing.md },
  gameSelected: { backgroundColor: colors.mustard },
  pressed: { transform: [{ translateY: 2 }] },
  gameSymbol: { width: 73, height: 70, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', backgroundColor: colors.plum, borderRadius: 15 },
  tinyCard: { width: 26, height: 38, marginHorizontal: -2, borderWidth: 2, borderColor: colors.cream, borderRadius: 7 },
  gameCopy: { flex: 1, gap: 3 },
  gameTitle: { color: colors.plum, fontSize: 21 },
  gameDesc: { color: colors.plum, fontSize: 12 },
  gamePlayers: { color: colors.inkMuted, fontSize: 10 },
  selectMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cream, borderColor: colors.plum, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center' },
  selectMarkActive: { backgroundColor: colors.coral },
  future: { marginTop: spacing.sm, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, padding: spacing.sm },
  futureText: { color: colors.inkMuted, fontSize: 12, textAlign: 'center' },
  teamHelp: { fontSize: 12, color: colors.inkMuted, marginBottom: spacing.md },
  teams: { gap: spacing.md },
  readiness: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, backgroundColor: '#FFE0BD',
    borderWidth: 2, borderColor: colors.plum, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xl, marginBottom: spacing.md },
  ready: { backgroundColor: colors.mustard },
  readinessText: { flex: 1, color: colors.plum, fontSize: 12 },
  waitingHost: { minHeight: 56, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.plum, padding: spacing.md },
  waitingHostText: { color: colors.cream, textAlign: 'center', fontSize: 13 },
});