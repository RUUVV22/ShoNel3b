const {selectionCards}=require('../src/games/scorpionRoles');
function confirmScorpionCards(manager,deck,socketId='s0') {
 const {room}=manager.requireSocketPlayer(socketId);
 if(room.gameSession?.phase!=='SETUP')throw new Error('Game must already be in the in-game SETUP phase');
 const pool=selectionCards(room.gameSession.seats.length);
 const counts={};
 for(const roleId of deck){
  const index=counts[roleId]||0;
  counts[roleId]=index+1;
  const card=pool.find(entry=>entry.roleId===roleId&&entry.variant===index);
  if(!card)throw new Error('Missing selectable card '+roleId+':'+index);
  manager.gameAction(socketId,{action:'toggle-card',cardKey:card.key});
 }
 manager.gameAction(socketId,{action:'confirm-cards'});
 return room.gameSession;
}
module.exports={confirmScorpionCards};
