import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameHeader } from '../components/GameHeader';
import { GameLogo } from '../components/GameLogo';
import { TurnIndicator } from '../components/TurnIndicator';
import { CluePanel } from '../components/CluePanel';
import { CARD_SUSPENSE_MS, GameCard } from '../components/GameCard';
import { TurnTransitionOverlay } from '../components/TurnTransitionOverlay';
import { GameResultModal } from '../components/GameResultModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArabicText } from '../components/ArabicText';
import { useGame } from '../context/GameContext';
import { ROLE, STATUS, TEAM, TEAM_LABEL } from '../constants/game';
import { soundService } from '../services/sounds';
import { colors, teamColor } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function GameScreen({ navigation }) {
  const {
    actions,
    busyAction,
    gameState,
    muted,
    session,
    toggleMute,
  } = useGame();
  const { width, height } = useWindowDimensions();
  const [selectingCardId, setSelectingCardId] = useState(null);
  const revealedIds = useRef(null);
  const previousClue = useRef(null);
  const previousStatus = useRef(null);

  useEffect(() => {
    if (!session) navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    else if (gameState?.status === STATUS.LOBBY) navigation.replace('Lobby');
  }, [gameState?.status, navigation, session]);

  const me = gameState?.players.find((player) => player.id === gameState.currentPlayerId);
  const isMyTurn = me?.team === gameState?.currentTeam;
  const isSpymaster = me?.role === ROLE.SPYMASTER;
  const canSelect = gameState?.status === STATUS.ACTIVE && isMyTurn && !isSpymaster && Boolean(gameState.clue);
  // React Native / web share this layout; size by available viewport, not user agent.
  const desktopLayout = width >= 1050;
  const horizontalGutters = width < 440 ? 20 : width < 820 ? 32 : 48;
  const innerGutters = spacing.md * 2 + 16; // screen and tabletop padding
  const mobileBoardSpace = Math.max(250, width - horizontalGutters - innerGutters);
  const landscapeLimit = height < width && height < 560 ? Math.max(260, (height - 80) * 1.25) : 720;
  const boardWidth = Math.floor(desktopLayout
    ? Math.min(width - 430, Math.max(520, (height - 120) * 1.28), 1080)
    : Math.min(mobileBoardSpace, landscapeLimit));
  const cardGap = width < 370 ? 4 : width < 650 ? 5 : width < 1024 ? 7 : 9;
  const cardWidth = (boardWidth - cardGap * 4) / 5;
  const playerRole = isSpymaster ? 'قائد الفريق — ترى هويات البطاقات' : 'لاعب — اختر كلمات فريقك';

  useEffect(() => {
    const cards = gameState?.board || [];
    const nextRevealed = new Set(cards.filter((card) => card.revealed).map((card) => card.id));
    if (revealedIds.current) {
      const revealedCard = cards.find((card) => card.revealed && !revealedIds.current.has(card.id));
      if (revealedCard) {
        const revealer = gameState.players.find((player) => player.id === revealedCard.revealedBy);
        const effect = revealedCard.type === 'ASSASSIN'
          ? 'assassin'
          : revealedCard.type === revealer?.team
            ? 'correct'
            : 'wrong';
        soundService.play(effect);
      }
    }
    revealedIds.current = nextRevealed;
  }, [gameState?.board, gameState?.players]);

  useEffect(() => {
    const clueKey = gameState?.clue ? `${gameState.clue.team}:${gameState.clue.word}:${gameState.clue.count}` : null;
    if (clueKey && clueKey !== previousClue.current) soundService.play('clue');
    previousClue.current = clueKey;
  }, [gameState?.clue]);

  useEffect(() => {
    if (gameState?.status === STATUS.FINISHED && previousStatus.current === STATUS.ACTIVE && me) {
      soundService.play(gameState.winner === me.team ? 'victory' : 'defeat');
    }
    previousStatus.current = gameState?.status;
  }, [gameState?.status, gameState?.winner, me]);

  const teams = useMemo(() => [TEAM.RED, TEAM.BLUE], []);
  if (!gameState || !me) {
    return <ScreenContainer scroll={false} contentStyle={styles.center}><ArabicText style={styles.muted}>جارٍ تحميل الجولة…</ArabicText></ScreenContainer>;
  }

  const handleSelect = async (cardId) => {
    if (selectingCardId) return;
    setSelectingCardId(cardId);
    soundService.play('select');
    await new Promise((resolve) => setTimeout(resolve, CARD_SUSPENSE_MS));
    await actions.selectCard(cardId);
    setSelectingCardId(null);
  };

  const leave = () => Alert.alert(
    'مغادرة اللعبة',
    'هل تريد إلغاء مشاركتك والخروج من الغرفة؟',
    [
      { text: 'البقاء', style: 'cancel' },
      {
        text: 'مغادرة',
        style: 'destructive',
        onPress: async () => {
          await actions.leaveRoom();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ],
  );

  const scores = (
    <View style={styles.scoreRow}>
      {teams.map((team) => (
        <View key={team} style={[styles.score, { borderColor: teamColor(team) }]}>
          <View style={[styles.scoreDot, { backgroundColor: teamColor(team) }]} />
          <ArabicText weight="bold" style={styles.scoreName}>{TEAM_LABEL[team]}</ArabicText>
          <ArabicText weight="extraBold" style={[styles.scoreNumber, { color: teamColor(team) }]}>{gameState.remainingCards[team]}</ArabicText>
        </View>
      ))}
    </View>
  );
  const turn = <View style={styles.turnSection}><TurnIndicator team={gameState.currentTeam} isMyTurn={isMyTurn} /></View>;
  const board = (
    <View style={[styles.tabletop, { width: boardWidth + 16 }]}>
      <View style={[styles.board, { width: boardWidth, gap: cardGap }]}>
        {gameState.board.map((card) => (
          <GameCard
            key={card.id}
            card={card}
            width={cardWidth}
            selecting={selectingCardId === card.id}
            disabled={!canSelect || Boolean(selectingCardId) || busyAction === 'game:select-card'}
            onPress={handleSelect}
          />
        ))}
      </View>
    </View>
  );
  const clueControls = (
    <>
      <CluePanel
        clue={gameState.clue}
        clueHistory={gameState.clueHistory}
        showHistory
        team={gameState.currentTeam}
        canGiveClue={gameState.status === STATUS.ACTIVE && isMyTurn && isSpymaster && !gameState.clue}
        waitingForClue={isMyTurn}
        loading={busyAction === 'game:give-clue'}
        onGiveClue={actions.giveClue}
        scopeKey={`${gameState.roomId}:${gameState.round}:${gameState.currentTeam}:${gameState.clueHistory?.length || 0}`}
      />
      {canSelect ? (
        <View style={styles.agentActions}>
          <ArabicText style={styles.guesses}>المحاولات المتاحة: {gameState.guessesRemaining}</ArabicText>
          <PrimaryButton compact title="إنهاء الدور" icon="stop-circle-outline" variant="ghost" loading={busyAction === 'game:end-turn'} disabled={Boolean(selectingCardId)} onPress={actions.endTurn} />
        </View>
      ) : null}
    </>
  );

  return (
    <ScreenContainer contentStyle={[styles.screen, desktopLayout && styles.wideScreen]}>
      <GameHeader
        title={`فك الشيفرة | الجولة ${gameState.round}`}
        subtitle={`${gameState.roomId} • ${playerRole}`}
        onBack={leave}
        rightIcon={muted ? 'volume-mute-outline' : 'volume-high-outline'}
        onRightPress={toggleMute}
      />

      <TurnTransitionOverlay team={gameState.currentTeam} />
      {desktopLayout ? (
        <View style={styles.desktopColumns}>
          {board}
          <View style={styles.sidebar}>
            <GameLogo id="CODENAMES" size={62} style={styles.logo} />
            {scores}
            {turn}
            {clueControls}
          </View>
        </View>
      ) : (
        <>
          <GameLogo id="CODENAMES" size={width < 440 ? 45 : 62} style={styles.logo} />
          {scores}
          {turn}
          {board}
          {clueControls}
        </>
      )}

      <GameResultModal
        visible={gameState.status === STATUS.FINISHED}
        winner={gameState.winner}
        reason={gameState.resultReason}
        myTeam={me.team}
        isHost={me.isHost}
        loading={busyAction === 'game:restart'}
        onReplay={actions.restartGame}
        onLobby={actions.returnToLobby}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { width: '100%', minWidth: 0, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  wideScreen: { maxWidth: 1500, alignSelf: 'center' },
  desktopColumns: { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'center', gap: spacing.xl },
  sidebar: { width: 315, flexShrink: 0, gap: spacing.sm },
  logo: { marginVertical: spacing.lg },
  turnSection: { marginBottom: spacing.lg },
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.plum },
  tabletop: { alignSelf: 'center', backgroundColor: colors.plum, borderColor: colors.plum,
    borderWidth: 2, borderBottomWidth: 6, borderRadius: radius.lg, padding: 6, marginBottom: spacing.lg,
    shadowColor: colors.plum, shadowOffset: { width: 3, height: 4 }, shadowOpacity: 0.22, shadowRadius: 0 },
  scoreRow: { flexDirection: 'row-reverse', gap: spacing.md, marginBottom: spacing.lg },
  score: { flex: 1, minHeight: 43, flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm,
    borderWidth: 2, borderBottomWidth: 5, borderRadius: radius.sm, backgroundColor: colors.plum },
  scoreDot: { width: 7, height: 22, borderRadius: 4 },
  scoreName: { flex: 1, fontSize: 11 },
  scoreNumber: { fontSize: 18, textAlign: 'center' },
  board: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', marginVertical: spacing.xs },
  agentActions: { flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.lg },
  guesses: { color: colors.plum, fontSize: 12 },
});
