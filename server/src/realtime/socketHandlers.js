const { asAckError } = require('../game/errors');

function registerSocketHandlers(io, roomManager) {
  function emitRoom(roomCode) {
    const room = roomManager.rooms.get(roomCode);
    if (!room) return;

    room.players.forEach((player) => {
      if (!player.connected || !player.socketId) return;
      try {
        io.to(player.socketId).emit('state:update', roomManager.serializeFor(roomCode, player.id));
      } catch (error) {
        console.error('Failed to serialize room state:', error);
      }
    });
  }

  roomManager.onAsyncChange = emitRoom;

  io.on('connection', (socket) => {
    const handle = (eventName, action) => {
      socket.on(eventName, (payload = {}, acknowledgement = () => {}) => {
        try {
          const result = action(payload || {});
          acknowledgement({ ok: true, ...result });
        } catch (error) {
          const response = asAckError(error);
          acknowledgement(response);
          socket.emit('action:error', response);
        }
      });
    };

    handle('room:create', ({ name }) => {
      const result = roomManager.createRoom({ name, socketId: socket.id });
      socket.join(result.roomCode);
      emitRoom(result.roomCode);
      return result;
    });

    handle('room:join', ({ roomCode, name }) => {
      const result = roomManager.joinRoom({ roomCode, name, socketId: socket.id });
      socket.join(result.roomCode);
      emitRoom(result.roomCode);
      return result;
    });

    handle('room:reconnect', ({ roomCode, sessionToken }) => {
      const result = roomManager.reconnect({ roomCode, sessionToken, socketId: socket.id });
      socket.join(result.roomCode);
      emitRoom(result.roomCode);
      return result;
    });

    handle('room:leave', () => {
      const result = roomManager.leaveRoom(socket.id);
      socket.leave(result.roomCode);
      emitRoom(result.roomCode);
      return {};
    });

    handle('lobby:update-player', ({ playerId, team, role }) => {
      const room = roomManager.updatePlayer({
        socketId: socket.id,
        targetPlayerId: playerId,
        team,
        role,
      });
      emitRoom(room.roomId);
      return {};
    });

    handle('lobby:choose-team', ({ team }) => {
      const room = roomManager.chooseTeam({ socketId: socket.id, team });
      emitRoom(room.roomId);
      return {};
    });

    handle('lobby:remove-player', ({ playerId }) => {
      const { room, removedPlayer } = roomManager.removePlayer({
        socketId: socket.id,
        targetPlayerId: playerId,
      });
      if (removedPlayer.socketId) {
        io.to(removedPlayer.socketId).emit('room:removed', {
          message: 'قام المضيف بإزالتك من الغرفة',
        });
        io.sockets.sockets.get(removedPlayer.socketId)?.disconnect(true);
      }
      emitRoom(room.roomId);
      return {};
    });

    handle('lobby:select-game', ({ gameId }) => {
      const room = roomManager.selectGame({ socketId: socket.id, gameId });
      emitRoom(room.roomId);
      return {};
    });

    handle('game:action', payload => {
      const room=roomManager.gameAction(socket.id,payload);
      emitRoom(room.roomId);
      return {};
    });

    handle('lobby:mystery-character', ({characterId}) => {
      const room=roomManager.selectMysteryCharacter(socket.id,characterId);
      emitRoom(room.roomId);return {};
    });

    handle('game:start', () => {
      const room = roomManager.startGame(socket.id);
      emitRoom(room.roomId);
      return {};
    });

    handle('game:give-clue', ({ word, count }) => {
      const room = roomManager.giveClue({ socketId: socket.id, word, count });
      emitRoom(room.roomId);
      return {};
    });

    handle('game:select-card', ({ cardId }) => {
      const result = roomManager.selectCard({ socketId: socket.id, cardId });
      emitRoom(result.room.roomId);
      return { revealedType: result.revealedType, turnEnded: result.turnEnded };
    });

    handle('game:end-turn', () => {
      const room = roomManager.endTurn(socket.id);
      emitRoom(room.roomId);
      return {};
    });

    handle('game:restart', () => {
      const room = roomManager.restartGame(socket.id);
      emitRoom(room.roomId);
      return {};
    });

    handle('game:return-lobby', () => {
      const room = roomManager.returnToLobby(socket.id);
      emitRoom(room.roomId);
      return {};
    });

    socket.on('disconnect', () => {
      const result = roomManager.disconnect(socket.id);
      if (result) emitRoom(result.roomCode);
    });
  });

  return { emitRoom };
}

module.exports = { registerSocketHandlers };
