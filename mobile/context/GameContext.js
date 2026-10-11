import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ACTION_TIMEOUT_MS,
  DEFAULT_SERVER_URL,
  getInitialServerUrl,
  LAST_NAME_STORAGE_KEY,
  MUTE_STORAGE_KEY,
  SERVER_STORAGE_KEY,
  SESSION_STORAGE_KEY,
} from '../constants/config';
import { createGameSocket, normalizeServerUrl } from '../services/socket';
import { soundService } from '../services/sounds';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [session, setSession] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [muted, setMuted] = useState(false);
  const [lastName, setLastName] = useState('');
  const socketRef = useRef(null);
  const sessionRef = useRef(null);

  const showNotice = useCallback((message, type = 'error') => {
    if (!message) return;
    setNotice({ id: Date.now(), message, type });
  }, []);

  const clearLocalSession = useCallback(async () => {
    sessionRef.current = null;
    setSession(null);
    setGameState(null);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      AsyncStorage.getItem(SERVER_STORAGE_KEY),
      AsyncStorage.getItem(SESSION_STORAGE_KEY),
      AsyncStorage.getItem(MUTE_STORAGE_KEY),
      AsyncStorage.getItem(LAST_NAME_STORAGE_KEY),
    ]).then(([storedServer, storedSession, storedMuted, storedName]) => {
      if (!mounted) return;
      const parsedSession = storedSession ? JSON.parse(storedSession) : null;
      const initialMuted = storedMuted === 'true';
      setServerUrl(normalizeServerUrl(getInitialServerUrl(storedServer)) || DEFAULT_SERVER_URL);
      setSession(parsedSession);
      sessionRef.current = parsedSession;
      setMuted(initialMuted);
      soundService.setMuted(initialMuted);
      setLastName(storedName || '');
      setReady(true);
    }).catch(() => {
      setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!ready) return undefined;
    const socket = createGameSocket(serverUrl);
    socketRef.current = socket;

    const restoreSession = () => {
      setConnectionStatus('connected');
      const saved = sessionRef.current;
      if (!saved) return;
      socket.timeout(ACTION_TIMEOUT_MS).emit('room:reconnect', saved, (error, response) => {
        if (error) return;
        if (response?.ok) {
          setGameState(response.state);
          return;
        }
        if (['INVALID_SESSION', 'ROOM_NOT_FOUND'].includes(response?.code)) {
          clearLocalSession();
          showNotice(response.message);
        }
      });
    };

    socket.on('connect', restoreSession);
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('connect_error', () => setConnectionStatus('disconnected'));
    socket.on('state:update', setGameState);
    socket.on('action:error', (response) => showNotice(response?.message));
    socket.on('room:removed', async ({ message }) => {
      await clearLocalSession();
      showNotice(message || 'تمت إزالتك من الغرفة');
    });

    setConnectionStatus('connecting');
    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [clearLocalSession, ready, serverUrl, showNotice]);

  const emitAction = useCallback((event, payload = {}) => new Promise((resolve) => {
    const socket = socketRef.current;
    if (!socket) {
      const response = { ok: false, message: 'الخادم غير جاهز بعد' };
      showNotice(response.message);
      resolve(response);
      return;
    }

    setBusyAction(event);
    if (!socket.connected) socket.connect();
    socket.timeout(ACTION_TIMEOUT_MS).emit(event, payload, (error, response) => {
      setBusyAction(null);
      if (error) {
        const timeoutResponse = { ok: false, message: 'تعذر الاتصال بالخادم. تحقق من العنوان والشبكة' };
        showNotice(timeoutResponse.message);
        resolve(timeoutResponse);
        return;
      }
      if (!response?.ok) showNotice(response?.message || 'حدث خطأ غير متوقع');
      resolve(response || { ok: false });
    });
  }), [showNotice]);

  const persistJoinedSession = useCallback(async (response, name) => {
    const nextSession = {
      roomCode: response.roomCode,
      playerId: response.playerId,
      sessionToken: response.sessionToken,
    };
    sessionRef.current = nextSession;
    setSession(nextSession);
    setGameState(response.state);
    setLastName(name);
    await AsyncStorage.multiSet([
      [SESSION_STORAGE_KEY, JSON.stringify(nextSession)],
      [LAST_NAME_STORAGE_KEY, name],
    ]);
    soundService.play('join');
  }, []);

  const leaveRoom = useCallback(async () => {
    if (socketRef.current?.connected && sessionRef.current) {
      soundService.play('leave');
      await emitAction('room:leave');
    }
    await clearLocalSession();
  }, [clearLocalSession, emitAction]);

  const createRoom = useCallback(async (name) => {
    if (sessionRef.current) await leaveRoom();
    const response = await emitAction('room:create', { name });
    if (response.ok) await persistJoinedSession(response, String(name).trim());
    return response;
  }, [emitAction, leaveRoom, persistJoinedSession]);

  const joinRoom = useCallback(async (roomCode, name) => {
    const normalizedRoomCode = String(roomCode || '').trim().toUpperCase();
    if (sessionRef.current?.roomCode === normalizedRoomCode) return { ok: true, resumed: true };
    if (sessionRef.current) await leaveRoom();
    const response = await emitAction('room:join', { roomCode, name });
    if (response.ok) await persistJoinedSession(response, String(name).trim());
    return response;
  }, [emitAction, leaveRoom, persistJoinedSession]);

  const updateServerUrl = useCallback(async (value) => {
    const normalized = normalizeServerUrl(value);
    if (!normalized) {
      showNotice('اكتب عنواناً يبدأ بـ http:// أو https://');
      return false;
    }
    if (normalized !== serverUrl) {
      await leaveRoom();
      setServerUrl(normalized);
      await AsyncStorage.setItem(SERVER_STORAGE_KEY, normalized);
    }
    showNotice('تم حفظ عنوان الخادم', 'success');
    return true;
  }, [leaveRoom, serverUrl, showNotice]);

  const toggleMute = useCallback(async () => {
    const next = !muted;
    setMuted(next);
    soundService.setMuted(next);
    await AsyncStorage.setItem(MUTE_STORAGE_KEY, String(next));
  }, [muted]);

  const actions = useMemo(() => ({
    createRoom,
    joinRoom,
    leaveRoom,
    updatePlayer: (playerId, team, role) => emitAction('lobby:update-player', { playerId, team, role }),
    chooseTeam: (team) => emitAction('lobby:choose-team', { team }),
    removePlayer: (playerId) => emitAction('lobby:remove-player', { playerId }),
    selectGame: (gameId) => emitAction('lobby:select-game', { gameId }),
    startGame: () => emitAction('game:start'),
    giveClue: (word, count) => emitAction('game:give-clue', { word, count }),
    selectCard: (cardId) => emitAction('game:select-card', { cardId }),
    endTurn: () => emitAction('game:end-turn'),
    restartGame: () => emitAction('game:restart'),
    returnToLobby: () => emitAction('game:return-lobby'),
  }), [createRoom, emitAction, joinRoom, leaveRoom]);

  const value = useMemo(() => ({
    ready,
    serverUrl,
    connectionStatus,
    session,
    gameState,
    notice,
    setNotice,
    busyAction,
    muted,
    lastName,
    updateServerUrl,
    toggleMute,
    showNotice,
    actions,
  }), [
    actions,
    busyAction,
    connectionStatus,
    gameState,
    lastName,
    muted,
    notice,
    ready,
    serverUrl,
    session,
    showNotice,
    toggleMute,
    updateServerUrl,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used inside GameProvider');
  return value;
}
