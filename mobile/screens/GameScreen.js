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
  const { width } = useWindowDimensions();
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
  const boardWidth = Math.min(width - 58, 492);
  const cardGap = 8;
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

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <GameHeader
        title={`كود نيمز | الجولة ${gameState.round}`}
        subtitle={`${gameState.roomId} • ${playerRole}`}
        onBack={leave}
        rightIcon={muted ? 'volume-mute-outline' : 'volume-high-outline'}
        onRightPress={toggleMute}
      />

      <GameLogo id="CODENAMES" size={70} style={styles.logo} />
      <TurnTransitionOverlay team={gameState.currentTeam} />

      <View style={styles.scoreRow}>
        {teams.map((team) => (
          <View key={team} style={[styles.score, { borderColor: teamColor(team) }]}>
            <View style={[styles.scoreDot, { backgroundColor: teamColor(team) }]} />
            <ArabicText weight="bold" style={styles.scoreName}>{TEAM_LABEL[team]}</ArabicText>
            <ArabicText weight="extraBold" style={[styles.scoreNumber, { color: teamColor(team) }]}>{gameState.remainingCards[team]}</ArabicText>
          </View>
        ))}
      </View>

      <View style={styles.turnSection}>
        <TurnIndicator team={gameState.currentTeam} isMyTurn={isMyTurn} />
      </View>

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

      <CluePanel
        clue={gameState.clue}
        clueHistory={gameState.clueHistory}
        showHistory
        team={gameState.currentTeam}
        canGiveClue={gameState.status === STATUS.ACTIVE && isMyTurn && isSpymaster && !gameState.clue}
        waitingForClue={isMyTurn}
        loading={busyAction === 'game:give-clue'}
        onGiveClue={actions.giveClue}
      />

      {canSelect ? (
        <View style={styles.agentActions}>
          <ArabicText style={styles.guesses}>المحاولات المتاحة: {gameState.guessesRemaining}</ArabicText>
          <PrimaryButton compact title="إنهاء الدور" icon="stop-circle-outline" variant="ghost" loading={busyAction === 'game:end-turn'} disabled={Boolean(selectingCardId)} onPress={actions.endTurn} />
        </View>
      ) : null}

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
  screen: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
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
