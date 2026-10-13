import React,{useState,useEffect} from 'react';
import {Image,Pressable,ScrollView,StyleSheet,View,useWindowDimensions} from 'react-native';
import Svg,{Polygon,Circle,Line,Text as SvgText} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {ArabicText} from './ArabicText';
import {PrimaryButton} from './PrimaryButton';
import {colors} from '../theme/colors';
import {useLanguage} from '../context/LanguageContext';
export const PLACE_ART={
 HAMMAM:require('../../assets/mystery/place_hammam.jpg'),
 DUKKAN:require('../../assets/mystery/place_dukkan.jpg'),
 CAFE:require('../../assets/mystery/place_cafe.jpg'),
 SQUARE:require('../../assets/mystery/place_square.jpg'),
 MUKHTAR:require('../../assets/mystery/place_mukhtar.jpg'),
 BAKERY:require('../../assets/mystery/place_bakery.jpg'),
 BARBER:require('../../assets/mystery/place_barber.jpg'),
 CARPENTER:require('../../assets/mystery/place_carpenter.jpg'),
 ROOFTOP:require('../../assets/mystery/place_rooftop.jpg'),
};
export const DICE_IMAGES=[
 null,require('../../assets/mystery/die_1.png'),require('../../assets/mystery/die_2.png'),
 require('../../assets/mystery/die_3.png'),require('../../assets/mystery/die_4.png'),
 require('../../assets/mystery/die_5.png'),require('../../assets/mystery/die_6.png'),
];
const tiles=Array.from({length:169},(_,i)=>String(i%13)+','+String(Math.floor(i/13)));
export const point=tile=>{
 const [x,y]=tile.split(',').map(Number);
 return {x:366+(x-y)*23,y:53+(x+y)*12};
};
const diamond=pt=>String(pt.x)+','+String(pt.y-10)+' '+String(pt.x+21)+','+String(pt.y)+' '+String(pt.x)+','+String(pt.y+10)+' '+String(pt.x-21)+','+String(pt.y);
export function MysteryBoard({game,viewerId,zoom=1,onPreview,disabled}){
 const {t}=useLanguage();
 const street=new Set(game.streets),entrances=new Map(game.entrances.map(e=>[e.tile,e.id]));
 const reachable=new Set(game.reachable);
 const route=new Set(game.preview?.path||[]);
 const [pieceTile,setPieceTile]=useState(null);
 useEffect(()=>{
  const path=game.lastMove;
  if(!path||path.length<2){setPieceTile(null);return undefined;}
  setPieceTile(path[0]);let i=0;
  const timer=setInterval(()=>{
   i+=1;setPieceTile(path[Math.min(i,path.length-1)]);
   if(i>=path.length-1)clearInterval(timer);
  },125);
  return ()=>clearInterval(timer);
 },[game.lastMove?.join('|')]);
 const {width}=useWindowDimensions();
 return <View style={st.panel}>
  <View style={st.header}>
   <ArabicText weight="extraBold" style={st.title}>{t('🕌 خريطة الحارة','🕌 The Neighborhood')}</ArabicText>
   <ArabicText style={st.hint}>{t('اضغط مربّع أو مدخل للمعاينة','Tap a street square or entrance to preview')}</ArabicText>
  </View>
  <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{minWidth:Math.round(735*zoom)}}>
   <View style={{width:735*zoom,height:394*zoom,overflow:'hidden'}}>
    <View style={{width:735,height:394,transform:[{scale:zoom}],transformOrigin:'top left'}}>
      <Svg width={735} height={394}>
       {tiles.map(tile=>{
        const p=point(tile),walkable=street.has(tile)||entrances.has(tile);
        const fill=!walkable?'#CBA780':entrances.has(tile)?'#E8B55C':route.has(tile)?'#EF775C':reachable.has(tile)?'#94C9AB':'#F8E6C4';
        return <Polygon key={tile} points={diamond(p)} fill={fill} stroke="#A78963" strokeWidth={walkable?1.5:.7}
          onPress={walkable&&!disabled&&tile!==game.positions[viewerId]?()=>onPreview(tile):undefined}/>;
       })}
       {game.preview?.path?.slice(1).map((tile,i)=>{
        const a=point(game.preview.path[i]),b=point(tile);
        return <Line key={'r'+i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
         stroke={i<game.allowance?'#E75A3C':'#604D63'} strokeWidth="3.5"
         strokeDasharray={i<game.allowance?'0':'4 4'}/>;
       })}
       {game.entrances.map((entry,i)=>{
         const p=point(entry.tile);
         return <React.Fragment key={entry.id}>
           <Circle cx={p.x} cy={p.y} r={9} fill={colors.plum} stroke={colors.mustard} strokeWidth="2"/>
           <SvgText x={p.x} y={p.y+3.5} fill={colors.cream} fontSize="10" textAnchor="middle">{i+1}</SvgText>
         </React.Fragment>;
       })}
       {Object.entries(game.positions).map(([id,tile])=>{
        const p=point(id===game.activePlayerId&&pieceTile?pieceTile:tile);
        const number=game.players.indexOf(id);
        const fill=game.suspects.find(s=>s.id===game.characters[id])?.color||['#E75A3C','#64438C','#2F8E83','#C58A2F','#A44C79','#738341'][number%6];
        return <React.Fragment key={id}>
         <Circle cx={p.x} cy={p.y-7} r={11} fill={fill} stroke={colors.plum} strokeWidth="3"/>
         {id===viewerId?<Circle cx={p.x} cy={p.y-7} r={15} fill="none" stroke={colors.mustard} strokeWidth="2"/>:null}
         <Circle cx={p.x-4} cy={p.y-11} r={3} fill={colors.cream}/>
        </React.Fragment>;
       })}
      </Svg>
      {game.locations.map(l=>{
       const p=point(String(l.x)+','+String(l.y));
       return <Image key={l.id} pointerEvents="none" source={PLACE_ART[l.id]} resizeMode="cover"
        style={{position:'absolute',left:p.x-42,top:p.y-80,width:84,height:56,borderRadius:8,borderColor:colors.plum,borderWidth:2}}/>;
      })}
    </View>
   </View>
  </ScrollView>
  <View style={st.legend}>
   <ArabicText style={st.legendText}>{t('🟩 ضمن الرمية','🟩 Reachable')}</ArabicText>
   <ArabicText style={st.legendText}>{t('🟥 المسار','🟥 Route')}</ArabicText>
   <ArabicText style={st.legendText}>{t('🟨 مدخل المكان','🟨 Entrance')}</ArabicText>
  </View>
  {game.preview?<View style={st.preview}>
    <ArabicText weight="extraBold" style={st.previewText}>{t('المسار','Route')}: {game.preview.cost} / {t('المسموح','Allowance')}: {game.allowance}</ArabicText>
    <ArabicText style={st.previewText}>{game.preview.reachable?t('✓ تقدر توصل! أكّد مكانك','✓ Reachable! Confirm the move.'):t('✕ أبعد من رميتك؛ اختار مربع أخضر وسيب الباقي للدور الجاي.','✕ Too far. Select a green square on the route and continue next turn.')}</ArabicText>
    {game.preview.reachable&&!disabled?<PrimaryButton compact title={t('تأكيد الحركة','Confirm move')} onPress={()=>onPreview(null,true)}/>:null}
  </View>:null}
  <ArabicText weight="extraBold" style={st.title}>{t('🏘️ مداخل الحارة (١–٩)','🏘️ Nine neighborhood entrances')}</ArabicText>
  <View style={st.grid}>{game.locations.map(l=>
   <Pressable key={l.id} disabled={disabled} onPress={()=>onPreview(String(l.x)+','+String(l.y))}
     accessibilityRole="button" accessibilityLabel={t('معاينة '+l.name,'Preview '+l.englishName)} style={st.place}>
     <Image source={PLACE_ART[l.id]} style={st.placeImage} resizeMode="cover"/>
     <ArabicText style={st.placeName} weight="bold">{t(l.name,l.englishName)}</ArabicText>
   </Pressable>
  )}</View>
 </View>;
}
export function MysteryNotebook({game,send,busy=false,onClose}){
 const {t}=useLanguage();
 const known=new Set([...game.hand,...game.revealedTo.map(r=>r.card)]);
 const labels={excluded:'✕ مستبعد',possible:'؟ محتمل',seen:'✓ معروف'};
 return <View style={st.book}>
  <View style={st.bookTitle}><ArabicText weight="extraBold" style={st.title}>{t('📖 دفتر المحقق السري','📖 Private Detective Notebook')}</ArabicText>
   {onClose?<Pressable onPress={onClose} accessibilityRole="button" style={st.close}><Ionicons name="close" size={23} color={colors.cream}/></Pressable>:null}
  </View>
  <ArabicText style={st.bookHint}>{t('علاماتك محفوظة عند السيرفر ومش ظاهرة لأي لاعب غيرك. انقر لتغيير العلامة.','Your private markings are saved on the server. Tap a card to change its mark.')}</ArabicText>
  {[[t('الأشخاص','Suspects'),'suspect'],[t('الأماكن','Locations'),'location'],[t('الأغراض','Items'),'item']].map(([title,kind])=>
   <View key={kind} style={st.bookGroup}><ArabicText weight="extraBold" style={st.bookGroupTitle}>{title}</ArabicText>
    {game.cards.filter(c=>c.kind===kind).map(c=>{
     const mark=game.notebook[c.id],locked=known.has(c.id);
     const value=game.hand.includes(c.id)?t('🗂 معي','🗂 In hand'):game.revealedTo.some(r=>r.card===c.id)?t('👁 شفته','👁 Shown to me'):mark==='excluded'?t('✕ مستبعد','✕ Excluded'):mark==='possible'?t('؟ محتمل','? Possible'):'—';
     const next=!mark?'excluded':mark==='excluded'?'possible':'unknown';
     return <Pressable key={c.id} disabled={locked||busy} onPress={()=>send({action:'note',card:c.id,mark:next})}
      accessibilityRole="button" style={[st.bookEntry,locked&&{backgroundColor:'#CFE0BE'}]}>
       <ArabicText style={st.bookLabel}>{t(c.name,c.englishName)}</ArabicText><ArabicText style={st.bookMark}>{value}</ArabicText>
     </Pressable>;
    })}
   </View>
  )}
 </View>;
}
const st=StyleSheet.create({
 panel:{backgroundColor:'#F2DCAF',padding:10,borderRadius:18,borderColor:colors.plum,borderWidth:3,gap:9},
 header:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6},
 title:{fontSize:19,color:colors.plum},hint:{fontSize:12,color:colors.inkMuted},
 legend:{flexDirection:'row-reverse',gap:10,justifyContent:'center',flexWrap:'wrap'},
 legendText:{fontSize:11,color:colors.plum},
 preview:{backgroundColor:colors.plum,padding:12,borderRadius:13,gap:7},
 previewText:{color:colors.cream,fontSize:14},grid:{flexDirection:'row-reverse',flexWrap:'wrap',justifyContent:'space-between',gap:7},
 place:{width:'31%',minWidth:79,backgroundColor:colors.cream,borderWidth:2,borderRadius:10,borderColor:colors.plum,overflow:'hidden'},
 placeImage:{height:77,width:'100%'},placeName:{textAlign:'center',fontSize:11,color:colors.plum,padding:5},
 book:{padding:15,borderWidth:3,borderColor:colors.plum,backgroundColor:'#FFF1CF',borderRadius:17,gap:8},
 bookTitle:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center'},bookHint:{fontSize:12,color:'#654B42'},
 bookGroup:{gap:4,paddingTop:7,borderTopWidth:1,borderTopColor:'#CCAE88'},
 bookGroupTitle:{fontSize:16,color:colors.coral},
 bookEntry:{flexDirection:'row-reverse',justifyContent:'space-between',gap:5,borderRadius:6,padding:5},
 bookLabel:{fontSize:13,color:colors.plum},bookMark:{fontSize:12,color:colors.inkMuted},
 close:{backgroundColor:colors.plum,padding:5,borderRadius:8},
});
