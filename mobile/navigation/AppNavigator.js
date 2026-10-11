import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateRoomScreen } from '../screens/CreateRoomScreen';
import { JoinRoomScreen } from '../screens/JoinRoomScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { GameSessionScreen } from '../screens/GameSessionScreen';
import { HowToPlayScreen } from '../screens/HowToPlayScreen';
import { useGame } from '../context/GameContext';
import { STATUS } from '../constants/game';
import { parseRoomCode } from '../utils/deepLinks';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

function normalizeJoinUrl(url) {
  const roomCode = parseRoomCode(url);
  if (!roomCode || /\/join\/[A-Z2-9]{5}(?:[/?#]|$)/i.test(String(url))) return url;
  return Linking.createURL(`join/${roomCode}`);
}

const nativeLinking = {
  prefixes: ['shonel3b://', 'codenames://', Linking.createURL('/')],
  async getInitialURL() {
    return normalizeJoinUrl(await Linking.getInitialURL());
  },
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({ url }) => listener(normalizeJoinUrl(url)));
    return () => subscription.remove();
  },
  config: {
    screens: {
      JoinRoom: 'join/:roomCode',
    },
  },
};

export function AppNavigator() {
  const { ready, session, gameState } = useGame();
  const [navigationReady, setNavigationReady] = useState(false);
  const initialWebRoomCode = useRef(
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? parseRoomCode(window.location.href)
      : null,
  );
  const handledWebRoomLink = useRef(false);

  useEffect(() => {
    const roomCode = initialWebRoomCode.current;
    if (
      Platform.OS !== 'web'
      || !navigationReady
      || !ready
      || !roomCode
      || handledWebRoomLink.current
      || !navigationRef.isReady()
    ) return;

    if (session?.roomCode === roomCode) {
      if (!gameState) return;
      navigationRef.reset({
        index: 0,
        routes: [{ name: gameState.status === STATUS.LOBBY ? 'Lobby' : 'Game' }],
      });
    } else {
      navigationRef.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          { name: 'JoinRoom', params: { roomCode } },
        ],
      });
    }

    handledWebRoomLink.current = true;
  }, [gameState, navigationReady, ready, session?.roomCode]);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={Platform.OS === 'web' ? undefined : nativeLinking}
      onReady={() => setNavigationReady(true)}
      theme={{
      dark: true,
      colors: {
        primary: colors.gold,
        background: colors.cream,
        card: colors.plum,
        text: colors.paper,
        border: colors.line,
        notification: colors.red,
      },
      fonts: {
        regular: { fontFamily: 'Tajawal_400Regular', fontWeight: '400' },
        medium: { fontFamily: 'Tajawal_500Medium', fontWeight: '500' },
        bold: { fontFamily: 'Tajawal_700Bold', fontWeight: '700' },
        heavy: { fontFamily: 'Tajawal_800ExtraBold', fontWeight: '800' },
      },
    }}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_left',
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
        <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Lobby" component={LobbyScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Game" component={GameSessionScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
