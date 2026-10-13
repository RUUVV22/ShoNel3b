import React, {useEffect} from 'react';
import { ScreenContainer } from '../components/ScreenContainer';
import { ArabicText } from '../components/ArabicText';
import { useGame } from '../context/GameContext';
import { GameScreen as CodenamesScreen } from './GameScreen';
import { WerewolfScreen } from './WerewolfScreen';
import { KhasernyScreen } from './KhasernyScreen';
import { BombScreen } from './BombScreen';
import { MysteryScreen } from './MysteryScreen';
import { colors } from '../theme/colors';
import { STATUS } from '../constants/game';

// Games own their UI; the shell owns room and navigation.
const GAME_SCREENS = { CODENAMES: CodenamesScreen, WEREWOLF: WerewolfScreen, KHASERNY: KhasernyScreen, BOMB: BombScreen, MEN_WARAHA: MysteryScreen };
export function GameSessionScreen(props) {
  const { gameState, session } = useGame();
  const { navigation } = props;
  useEffect(() => {
    if (gameState?.selectedGameId === 'CODENAMES') return; // Existing Codenames navigation stays in GameScreen.
    if (!session) navigation.reset({ index: 0, routes: [{name:'Home'}] });
    else if (gameState?.status === STATUS.LOBBY) navigation.replace('Lobby');
  }, [gameState?.status, gameState?.selectedGameId, navigation, session]);
  if (!gameState || gameState.status === STATUS.LOBBY) return null;
  const Component = GAME_SCREENS[gameState.selectedGameId];
  if (!Component) return (
    <ScreenContainer scroll={false} contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
      <ArabicText style={{ color: colors.plum }}>اللعبة غير متاحة بعد</ArabicText>
    </ScreenContainer>
  );
  return <Component {...props} />;
}