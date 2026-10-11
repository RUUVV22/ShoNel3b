const http = require('node:http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { RoomManager } = require('./game/RoomManager');
const { registerSocketHandlers } = require('./realtime/socketHandlers');
const { listGames } = require('./games/registry');

function createGameServer(options = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: options.corsOrigin || '*' }));
  app.use(express.json({ limit: '32kb' }));

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: options.corsOrigin || '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
    pingTimeout: 20_000,
    pingInterval: 25_000,
  });

  const roomManager = new RoomManager(options.roomManager);
  const realtime = registerSocketHandlers(io, roomManager);

  app.get('/health', (_request, response) => {
    response.json({
      ok: true,
      service: 'arabic-codenames-server',
      rooms: roomManager.rooms.size,
      games: listGames().map(({ id }) => id),
      gameCatalogVersion: 4,
      uptime: process.uptime(),
    });
  });

  app.get('/api/rooms/:roomCode', (request, response) => {
    const roomCode = String(request.params.roomCode || '').toUpperCase();
    const room = roomManager.rooms.get(roomCode);
    if (!room) {
      response.status(404).json({ ok: false, message: 'الغرفة غير موجودة' });
      return;
    }
    response.json({
      ok: true,
      roomCode,
      status: room.status,
      playerCount: room.players.length,
    });
  });

  function start(port = 3001, host = '0.0.0.0') {
    return new Promise((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(port, host, () => {
        httpServer.off('error', reject);
        resolve(httpServer.address());
      });
    });
  }

  function stop() {
    roomManager.clear();
    return new Promise((resolve) => {
      io.close(() => {
        if (!httpServer.listening) {
          resolve();
          return;
        }
        httpServer.close(() => resolve());
      });
    });
  }

  return { app, httpServer, io, roomManager, realtime, start, stop };
}

module.exports = { createGameServer };
