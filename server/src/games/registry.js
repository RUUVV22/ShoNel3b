const codenames = require('./codenames');
// Each game owns its rules, serialisation and session state. The shared room
// knows only the selected game identifier and the session object.
const games = new Map([[codenames.metadata.id, codenames]]);
const getGame = (id) => games.get(id) || null;
const listGames = () => [...games.values()].map(game => ({ ...game.metadata }));
module.exports = { getGame, listGames };