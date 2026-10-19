import roleRegistry from '../../server/src/games/scorpionRoles';
import {SCORPION_IMAGE_SOURCES,MISSING_SCORPION_CARD_ART} from './scorpionRoleSources';

export const SCORPION_ROLES=roleRegistry.roles;
export const SCORPION_ROLE_BY_ID=roleRegistry.byId;
export const getScorpionSelectionCards=roleRegistry.selectionCards;
export {MISSING_SCORPION_CARD_ART};
const IMAGES=SCORPION_IMAGE_SOURCES;
const MASON_VARIANTS=[IMAGES.MASON,IMAGES.MASON_2].filter(Boolean);
const VILLAGER_VARIANTS=[IMAGES.VILLAGER,IMAGES.VILLAGER_2,IMAGES.VILLAGER_3].filter(Boolean);
export const SCORPION_COURTYARD=require('../../assets/scurbion nights assets/Midnight Plum Courtyard Board.png');
export function getScorpionCardArt(id,index=0) {
 if(id==='MASON')return MASON_VARIANTS.length?MASON_VARIANTS[index%MASON_VARIANTS.length]:null;
 if(id==='VILLAGER')return VILLAGER_VARIANTS.length?VILLAGER_VARIANTS[index%VILLAGER_VARIANTS.length]:null;
 return IMAGES[id]||null;
}
export function getScorpionRole(id){return SCORPION_ROLE_BY_ID[id]||null;}
