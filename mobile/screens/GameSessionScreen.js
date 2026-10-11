import React from 'react';
import { ScreenContainer } from '../components/ScreenContainer';
import { ArabicText } from '../components/ArabicText';
import { useGame } from '../context/GameContext';
import { GameScreen as CodenamesScreen } from './GameScreen';
import { colors } from '../theme/colors';

// Games own their UI; the shell owns room and navigation.
const GAME_SCREENS = { CODENAMES: CodenamesScreen };
export function GameSessionScreen(props) {
  const { gameState } = useGame();
  if (!gameState) return null;
  const Component = GAME_SCREENS[gameState.selectedGameId];
  if (!Component) return (
    <ScreenContainer scroll={false} contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
      <ArabicText style={{ color: colors.plum }}>اللعبة غير متاحة بعد</ArabicText>
    </ScreenContainer>
  );
  return <Component {...props} />;
}