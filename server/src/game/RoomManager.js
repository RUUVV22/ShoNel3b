const crypto = require('node:crypto');
const { normalizeArabic } = require('./gameEngine');
const { getGame, listGames } = require('../games/registry');
const {
  TEAM,
  ROLE,
  STATUS,
  MAX_PLAYERS,
} = require('./constants');
const { GameError } = require('./errors');

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

class RoomManager {
  constructor({ random = Math.random, reconnectWindowMs = 120_000, mysteryTimeoutMs = 150_000, onAsyncChange = () => {} } = {}) {
    this.rooms = new Map();
    this.socketIndex = new Map();
    this.disconnectTimers = new Map();
    this.mysteryTimers = new Map();
    this.random = random;
    this.reconnectWindowMs = reconnectWindowMs;
    this.mysteryTimeoutMs = mysteryTimeoutMs;
    this.onAsyncChange = onAsyncChange;
  }

  createRoom({ name, socketId }) {
    const cleanName = this.validateName(name);
    const roomCode = this.generateRoomCode();
    const player = this.createPlayer({
      name: cleanName,
      socketId,
      team: TEAM.RED,
      role: ROLE.SPYMASTER,
      isHost: true,
    });

    const room = {
      roomId: roomCode,
      status: STATUS.LOBBY,
      hostId: player.id,
      players: [player],
      selectedGameId: null,
      gameSession: null,
      roundCounts: {},
      werewolfRoleDeck: null,
      mysteryCharacter: null,
      stateVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.rooms.set(roomCode, room);
    this.indexSocket(socketId, roomCode, player.id);
    return this.sessionResult(room, player);
  }

  joinRoom({ roomCode, name, socketId }) {
    const room = this.requireRoom(roomCode);
    const cleanName = this.validateName(name);

    if (room.status !== STATUS.LOBBY) throw new GameError('ROOM_STARTED');
    if (room.players.length >= 20) throw new GameError('ROOM_FULL');
    if (room.players.some((player) => normalizeArabic(player.name) === normalizeArabic(cleanName))) {
      throw new GameError('DUPLICATE_NAME');
    }

    const assignment = this.nextAssignment(room);
    const player = this.createPlayer({
      name: cleanName,
      socketId,
      team: assignment.team,
      role: assignment.role,
      isHost: false,
    });

    room.players.push(player);
    room.werewolfRoleDeck = null;
    this.touch(room);
    this.indexSocket(socketId, room.roomId, player.id);
    return this.sessionResult(room, player);
  }

  reconnect({ roomCode, sessionToken, socketId }) {
    const room = this.requireRoom(roomCode);
    const player = room.players.find((candidate) => candidate.sessionToken === sessionToken);
    if (!player) throw new GameError('INVALID_SESSION');

    this.clearDisconnectTimer(room.roomId, player.id);
    if (player.socketId) this.socketIndex.delete(player.socketId);
    player.socketId = socketId;
    player.connected = true;
    player.lastSeenAt = Date.now();

    if (!room.players.some((candidate) => candidate.isHost && candidate.connected)) {
      room.players.forEach((candidate) => { candidate.isHost = false; });
      player.isHost = true;
      room.hostId = player.id;
    }

    this.indexSocket(socketId, room.roomId, player.id);
    this.touch(room);
    return this.sessionResult(room, player);
  }

  disconnect(socketId) {
    const indexed = this.socketIndex.get(socketId);
    if (!indexed) return null;
    this.socketIndex.delete(socketId);

    const room = this.rooms.get(indexed.roomCode);
    if (!room) return null;
    const player = room.players.find((candidate) => candidate.id === indexed.playerId);
    if (!player || player.socketId !== socketId) return null;

    player.connected = false;
    player.socketId = null;
    player.lastSeenAt = Date.now();
    const wasHost = player.isHost;
    player.isHost = false;

    if (wasHost) this.transferHost(room);
    this.touch(room);

    const timerKey = this.timerKey(room.roomId, player.id);
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(timerKey);
      const currentRoom = this.rooms.get(room.roomId);
      const currentPlayer = currentRoom?.players.find((candidate) => candidate.id === player.id);
      if (!currentRoom || !currentPlayer || currentPlayer.connected) return;

      currentRoom.players = currentRoom.players.filter((candidate) => candidate.id !== player.id);
      currentRoom.werewolfRoleDeck = null;
      if (currentRoom.players.length === 0) {
        this.rooms.delete(currentRoom.roomId);
      } else {
        if (!currentRoom.players.some((candidate) => candidate.isHost)) this.transferHost(currentRoom);
        this.touch(currentRoom);
      }
      this.onAsyncChange(currentRoom.roomId);
    }, this.reconnectWindowMs);
    timer.unref?.();
    this.disconnectTimers.set(timerKey, timer);
    return { roomCode: room.roomId, playerId: player.id };
  }

  updatePlayer({ socketId, targetPlayerId, team, role }) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status !== STATUS.LOBBY) throw new GameError('LOBBY_ONLY');
    if (!Object.values(TEAM).includes(team) || !Object.values(ROLE).includes(role)) {
      throw new GameError('INVALID_ASSIGNMENT');
    }

    const target = room.players.find((candidate) => candidate.id === targetPlayerId);
    if (!target) throw new GameError('PLAYER_NOT_FOUND');

    if (role === ROLE.SPYMASTER) {
      room.players.forEach((candidate) => {
        if (candidate.id !== target.id && candidate.team === team && candidate.role === ROLE.SPYMASTER) {
          candidate.role = ROLE.AGENT;
        }
      });
    }

    target.team = team;
    target.role = role;
    this.touch(room);
    return room;
  }

  chooseTeam({ socketId, team }) {
    const { room, player } = this.requireSocketPlayer(socketId);
    if (room.status !== STATUS.LOBBY) throw new GameError('LOBBY_ONLY');
    if (!Object.values(TEAM).includes(team)) throw new GameError('INVALID_ASSIGNMENT');
    if (player.team === team) return room;

    const targetTeamHasSpymaster = room.players.some((candidate) => (
      candidate.id !== player.id
      && candidate.team === team
      && candidate.role === ROLE.SPYMASTER
    ));
    player.team = team;
    if (player.role === ROLE.SPYMASTER && targetTeamHasSpymaster) player.role = ROLE.AGENT;
    this.touch(room);
    return room;
  }

  removePlayer({ socketId, targetPlayerId }) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status !== STATUS.LOBBY) throw new GameError('LOBBY_ONLY');
    if (targetPlayerId === player.id) throw new GameError('UNAUTHORIZED');

    const target = room.players.find((candidate) => candidate.id === targetPlayerId);
    if (!target) throw new GameError('PLAYER_NOT_FOUND');
    if (target.socketId) this.socketIndex.delete(target.socketId);
    this.clearDisconnectTimer(room.roomId, target.id);
    room.players = room.players.filter((candidate) => candidate.id !== target.id);
    room.werewolfRoleDeck = null;
    this.touch(room);
    return { room, removedPlayer: target };
  }

  leaveRoom(socketId) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.socketIndex.delete(socketId);
    this.clearDisconnectTimer(room.roomId, player.id);
    room.players = room.players.filter((candidate) => candidate.id !== player.id);
    room.werewolfRoleDeck = null;

    if (room.players.length === 0) {
      this.rooms.delete(room.roomId);
    } else {
      if (player.isHost || !room.players.some((candidate) => candidate.isHost)) {
        this.transferHost(room);
      }
      this.touch(room);
    }
    return { roomCode: room.roomId, playerId: player.id };
  }

  selectGame({ socketId, gameId }) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status !== STATUS.LOBBY) throw new GameError('LOBBY_ONLY');
    if (!getGame(gameId)) throw new GameError('INVALID_GAME');
    room.selectedGameId = gameId;
    room.gameSession = null;
    this.touch(room);
    return room;
  }

  selectMysteryCharacter(socketId, characterId) {
    const {room,player}=this.requireSocketPlayer(socketId);
    if(room.status!==STATUS.LOBBY)throw new GameError('LOBBY_ONLY');
    const mystery=require('../games/mystery');
    if(!mystery.suspects.some(s=>s.id===characterId))throw new GameError('INVALID_ASSIGNMENT');
    if(room.players.some(p=>p.id!==player.id&&p.mysteryCharacter===characterId))throw new GameError('INVALID_ASSIGNMENT');
    player.mysteryCharacter=characterId;
    this.touch(room);
    return room;
  }

  configureWerewolf(socketId, deck) {
    const {room,player}=this.requireSocketPlayer(socketId);
    this.assertHost(room,player);
    if(room.status!==STATUS.LOBBY)throw new GameError('LOBBY_ONLY');
    const allowed=new Set(require('../games/werewolf').roles.map(role=>role.id));
    if(!Array.isArray(deck)||deck.length!==room.players.filter(p=>p.connected).length+3
      ||!deck.every(id=>allowed.has(id)))throw new GameError('INVALID_ASSIGNMENT');
    room.werewolfRoleDeck=[...deck];
    this.touch(room);
    return room;
  }

  startGame(socketId) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status !== STATUS.LOBBY) throw new GameError('LOBBY_ONLY');
    const game = getGame(room.selectedGameId);
    if (!game) throw new GameError('GAME_NOT_SELECTED');
    if (!game.canStart(room)) throw new GameError('NOT_READY');
    this.createGameSession(room, game);
    return room;
  }

  restartGame(socketId) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status !== STATUS.FINISHED) throw new GameError('GAME_NOT_FINISHED');
    const game = getGame(room.selectedGameId);
    if (!game) throw new GameError('INVALID_GAME');
    if (!game.canStart(room)) throw new GameError('NOT_READY');
    this.createGameSession(room, game);
    return room;
  }

  createGameSession(room, game) {
    const round = (room.roundCounts[room.selectedGameId] || 0) + 1;
    room.roundCounts[room.selectedGameId] = round;
    room.gameSession = game.createSession(round, this.random, room);
    room.status = room.gameSession.status;
    this.touch(room);
    this.armMysteryTimeout(room);
  }

  armMysteryTimeout(room) {
    const old=this.mysteryTimers.get(room.roomId);
    if(old)clearTimeout(old);
    this.mysteryTimers.delete(room.roomId);
    if(room.selectedGameId!=='MEN_WARAHA'||room.status!==STATUS.ACTIVE)return;
    if(!room.players.some(p=>p.connected))return;
    const timer=setTimeout(()=>{
      this.mysteryTimers.delete(room.roomId);
      const current=this.rooms.get(room.roomId);
      if(!current||current.status!==STATUS.ACTIVE||current.selectedGameId!=='MEN_WARAHA')return;
      try{
        require('../games/mystery').recover(current.gameSession,current,true);
        current.status=current.gameSession.status;
        this.touch(current);
        this.onAsyncChange(current.roomId);
        this.armMysteryTimeout(current);
      }catch(error){console.error('Mystery timeout recovery error:',error);}
    },this.mysteryTimeoutMs);
    timer.unref?.();
    this.mysteryTimers.set(room.roomId,timer);
  }

  returnToLobby(socketId) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.assertHost(room, player);
    if (room.status === STATUS.ACTIVE) throw new GameError('GAME_NOT_FINISHED');
    room.status = STATUS.LOBBY;
    room.gameSession = null;
    const timer=this.mysteryTimers.get(room.roomId);
    if(timer)clearTimeout(timer);
    this.mysteryTimers.delete(room.roomId);
    this.touch(room);
    return room;
  }

  requireCodenames(room) {
    if (room.selectedGameId !== 'CODENAMES' || !room.gameSession) {
      throw new GameError('INVALID_GAME_ACTION');
    }
    return getGame('CODENAMES');
  }

  giveClue({ socketId, word, count }) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.requireCodenames(room).giveClue(room.gameSession, player, word, count);
    this.touch(room);
    return room;
  }

  selectCard({ socketId, cardId }) {
    const { room, player } = this.requireSocketPlayer(socketId);
    const result = this.requireCodenames(room).selectCard(room.gameSession, player, cardId);
    room.status = room.gameSession.status;
    this.touch(room);
    return { room, ...result };
  }

  endTurn(socketId) {
    const { room, player } = this.requireSocketPlayer(socketId);
    this.requireCodenames(room).endTurn(room.gameSession, player);
    this.touch(room);
    return room;
  }

  serializeFor(roomCode, viewerId) {
    const room = this.requireRoom(roomCode);
    const viewer = room.players.find(candidate => candidate.id === viewerId);
    if (!viewer) throw new GameError('PLAYER_NOT_FOUND');
    const game = getGame(room.selectedGameId);
    return {
      roomId: room.roomId,
      status: room.status,
      hostId: room.hostId,
      selectedGameId: room.selectedGameId,
      availableGames: listGames(),
      gameCatalogVersion: 5,
      werewolfRoleDeck: room.status===STATUS.LOBBY ? room.werewolfRoleDeck : undefined,
      players: room.players.map(player => ({
        id: player.id,
        name: player.name,
        team: player.team,
        role: player.role,
        isHost: player.isHost,
        connected: player.connected,
        mysteryCharacter: player.mysteryCharacter || null,
      })),
      currentPlayerId: viewer.id,
      ...(game && room.gameSession ? game.serialize(room.gameSession, viewer, room) : {}),
      canStart: Boolean(game?.canStart(room)),
      minPlayers: game?.metadata.minPlayers || 4,
      maxPlayers: room.status === STATUS.LOBBY ? 20 : (game?.metadata.maxPlayers || 20),
      stateVersion: room.stateVersion,
      serverTime: Date.now(),
    };
  }

  canStart(room) {
    return Boolean(getGame(room.selectedGameId)?.canStart(room));
  }

  gameAction(socketId, payload) {
    const {room,player}=this.requireSocketPlayer(socketId);
    const game=getGame(room.selectedGameId);
    if(!game||room.status!==STATUS.ACTIVE)throw new GameError('GAME_NOT_ACTIVE');
    if(room.selectedGameId==='WEREWOLF'){
      if(payload.action==='advance'){
        this.assertHost(room,player);
        game.advance(room.gameSession,room.players.filter(p=>p.connected).map(p=>p.id));
      }else if(payload.action==='vote')game.vote(room.gameSession,player,payload.target);
      else game.action(room.gameSession,player,payload);
    }else if(room.selectedGameId==='KHASERNY'){
      if(payload.action==='recover'){
        this.assertHost(room,player);
        game.recover(room.gameSession,room);
      }else game.act(room.gameSession,player,payload,this.random);
    }else if(room.selectedGameId==='MEN_WARAHA'){
      if(payload.action==='recover'){
        this.assertHost(room,player);
        game.recover(room.gameSession,room,false);
      }else game.act(room.gameSession,player,payload,this.random);
    }else if(room.selectedGameId==='BOMB'){
      if(payload.action==='next'||payload.action==='recover') this.assertHost(room,player);
      if(payload.action==='recover') game.recover(room.gameSession,room);
      else game.act(room.gameSession,player,payload,this.random);
    }else throw new GameError('INVALID_GAME_ACTION');
    room.status=room.gameSession.status;
    this.touch(room);
    if(!(room.selectedGameId==='MEN_WARAHA'&&payload.action==='note'))this.armMysteryTimeout(room);
    return room;
  }

  requireRoom(roomCode) {
    const normalized = String(roomCode || '').trim().toUpperCase();
    if (!/^[A-Z2-9]{5}$/.test(normalized)) throw new GameError('INVALID_ROOM');
    const room = this.rooms.get(normalized);
    if (!room) throw new GameError('ROOM_NOT_FOUND');
    return room;
  }

  requireSocketPlayer(socketId) {
    const indexed = this.socketIndex.get(socketId);
    if (!indexed) throw new GameError('UNAUTHORIZED');
    const room = this.rooms.get(indexed.roomCode);
    const player = room?.players.find((candidate) => candidate.id === indexed.playerId);
    if (!room || !player || !player.connected || player.socketId !== socketId) {
      throw new GameError('UNAUTHORIZED');
    }
    return { room, player };
  }

  sessionResult(room, player) {
    return {
      roomCode: room.roomId,
      playerId: player.id,
      sessionToken: player.sessionToken,
      state: this.serializeFor(room.roomId, player.id),
    };
  }

  clear() {
    this.disconnectTimers.forEach((timer) => clearTimeout(timer));
    this.disconnectTimers.clear();
    this.mysteryTimers.forEach(timer=>clearTimeout(timer));
    this.mysteryTimers.clear();
    this.socketIndex.clear();
    this.rooms.clear();
  }

  nextAssignment(room) {
    const connected = room.players.filter((player) => player.connected);
    if (!connected.some((player) => player.team === TEAM.BLUE && player.role === ROLE.SPYMASTER)) {
      return { team: TEAM.BLUE, role: ROLE.SPYMASTER };
    }
    if (!connected.some((player) => player.team === TEAM.RED && player.role === ROLE.AGENT)) {
      return { team: TEAM.RED, role: ROLE.AGENT };
    }
    if (!connected.some((player) => player.team === TEAM.BLUE && player.role === ROLE.AGENT)) {
      return { team: TEAM.BLUE, role: ROLE.AGENT };
    }

    const redCount = connected.filter((player) => player.team === TEAM.RED).length;
    const blueCount = connected.filter((player) => player.team === TEAM.BLUE).length;
    return { team: redCount <= blueCount ? TEAM.RED : TEAM.BLUE, role: ROLE.AGENT };
  }

  createPlayer({ name, socketId, team, role, isHost }) {
    return {
      id: crypto.randomUUID(),
      sessionToken: crypto.randomBytes(24).toString('hex'),
      socketId,
      name,
      team,
      role,
      isHost,
      connected: true,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    };
  }

  validateName(name) {
    const clean = String(name || '').trim().replace(/\s+/g, ' ');
    if (clean.length < 2 || clean.length > 20) throw new GameError('INVALID_NAME');
    return clean;
  }

  generateRoomCode() {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      let code = '';
      for (let index = 0; index < 5; index += 1) {
        code += ROOM_ALPHABET[Math.floor(this.random() * ROOM_ALPHABET.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Unable to generate a unique room code.');
  }

  indexSocket(socketId, roomCode, playerId) {
    this.socketIndex.set(socketId, { roomCode, playerId });
  }

  assertHost(room, player) {
    if (room.hostId !== player.id || !player.isHost) throw new GameError('NOT_HOST');
  }

  transferHost(room) {
    room.players.forEach((player) => { player.isHost = false; });
    const nextHost = room.players.find((player) => player.connected);
    room.hostId = nextHost?.id || null;
    if (nextHost) nextHost.isHost = true;
  }

  touch(room) {
    room.updatedAt = Date.now();
    room.stateVersion += 1;
  }

  timerKey(roomCode, playerId) {
    return `${roomCode}:${playerId}`;
  }

  clearDisconnectTimer(roomCode, playerId) {
    const key = this.timerKey(roomCode, playerId);
    const timer = this.disconnectTimers.get(key);
    if (timer) clearTimeout(timer);
    this.disconnectTimers.delete(key);
  }
}

module.exports = { RoomManager };