const { io } = require('socket.io-client');
const fs = require('node:fs');
async function main() {
  const host = io('http://localhost:3001');
  await new Promise(resolve => host.on('connect', resolve));
  const joined = await host.emitWithAck('room:create', { name: 'Islam' });
  if (!joined.ok) throw new Error(JSON.stringify(joined));
  const session = { roomCode: joined.roomCode, playerId: joined.playerId, sessionToken: joined.sessionToken };
  for (const name of ['Sami', 'Lina', 'Omar']) {
    const socket = io('http://localhost:3001');
    let state, busy = false;
    socket.on('state:update', next => { state = next; });
    await new Promise(resolve => socket.on('connect', resolve));
    const response = await socket.emitWithAck('room:join', { roomCode: joined.roomCode, name });
    if (!response.ok) throw new Error(name + ' could not join');
    setInterval(async () => {
      const game = state?.werewolf;
      if (busy || !game || state.status !== 'ACTIVE') return;
      const others = state.players.filter(p => p.id !== state.currentPlayerId && game.seats.includes(p.id));
      let payload;
      if (game.phase === 'REVEAL' && !game.revealReady) payload = { action: 'ready' };
      else if (game.phase === 'DISCUSSION' && !game.readyToVote) payload = { action: 'ready-vote' };
      else if (game.phase === 'VOTING' && !game.voted) payload = { action: 'vote', target: others[0].id };
      else if (game.phase === 'NIGHT' && game.isActor && !game.acted) {
        if (Date.now() < game.phaseOpensAt) return;
        const role = game.copiedRole || game.role;
        payload = { action: 'role' };
        if (['MINION', 'MASON', 'INSOMNIAC'].includes(role)) payload.action = 'ack';
        else if (game.currentRole === 'SCORPIONS') {
          payload.target = 0;
          if (role === 'SCORPIONESS') payload.second = 1;
        } else if (['MIMIC', 'SEER', 'ROBBER'].includes(role)) payload.target = others[0].id;
        else if (role === 'TROUBLEMAKER') { payload.target = others[0].id; payload.second = others[1].id; }
        else if (role === 'DRUNK') payload.target = 0;
      }
      if (!payload) return;
      busy = true;
      try {
        const result = await socket.emitWithAck('game:action', payload);
        console.log(name, payload.action, result.ok ? 'OK' : result.code || result.message);
      } finally { busy = false; }
    }, 1500);
  }
  for (const [event, payload] of [
    ['lobby:select-game', { gameId: 'WEREWOLF' }],
    ['game:start', {}],
  ]) {
    const result = await host.emitWithAck(event, payload);
    if (!result.ok) throw new Error(event + ': ' + JSON.stringify(result));
  }
  fs.writeFileSync('output/playwright/open-scorpion.cjs', 'async (page) => { await page.evaluate(session => localStorage.setItem("@arabic-codenames/session", JSON.stringify(session)), ' + JSON.stringify(session) + '); await page.reload(); }');
  console.log('ROOM', joined.roomCode);
}
main().catch(error => { console.error(error); process.exit(1); });
