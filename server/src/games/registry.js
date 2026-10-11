const codenames = require('./codenames');
const werewolf = require('./werewolf');
const khaserny = require('./khaserny');
// Each game owns its rules, serialisation and session state. The shared room
// knows only the selected game identifier and the session object.
const games = new Map([codenames,werewolf,khaserny].map(game=>[game.metadata.id,game]));
const getGame = (id) => games.get(id) || null;
const listGames = () => [...games.values()].map(game => ({ ...game.metadata }));
module.exports = { getGame, listGames };