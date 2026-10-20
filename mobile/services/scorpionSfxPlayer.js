import {SCORPION_SFX} from '../constants/scorpionSfx';

// All effects remain quieter than the narrator. Emphasis is reserved for
// important shared transitions; soft foley is ducked during spoken cues.
const players=new Map();
let narrating=false;
let releaseTimer=null;

function rebalance(){
  for(const [id,player] of players){
    const config=SCORPION_SFX[id]||{};
    const nominal=config.volume??0.25;
    const duck=config.emphasis?0.78:0.35;
    try{player.volume=Math.min(1,nominal*(narrating?duck:1));}catch{}
  }
}
export function setScorpionNarrationDucking(durationMs){
  if(releaseTimer)clearTimeout(releaseTimer);
  narrating=true;rebalance();
  releaseTimer=setTimeout(()=>{releaseTimer=null;narrating=false;rebalance();},
    Math.max(300,Math.min(30000,durationMs||3500)));
}
export function clearScorpionNarrationDucking(){
  if(releaseTimer)clearTimeout(releaseTimer);
  releaseTimer=null;narrating=false;rebalance();
}
export function registerScorpionSfx(id,player){
  players.set(id,player);rebalance();
  return()=>{if(players.get(id)===player)players.delete(id);};
}
export function playScorpionSfx(id){
  const player=players.get(id);
  if(!player)return false;
  try{
    if(id!=='courtyard_ambience')player.seekTo?.(0)?.catch?.(()=>{});
    player.play?.();
    return true;
  }catch{return false;}
}
export function stopScorpionSfx(id){
  try{players.get(id)?.pause?.();}catch{}
}
export function stopAllScorpionSfx(){
  for(const id of players.keys())stopScorpionSfx(id);
  clearScorpionNarrationDucking();
}
