import React, {useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, View, useWindowDimensions} from 'react-native';
import {ArabicText} from './ArabicText';
import {PrimaryButton} from './PrimaryButton';
import {ScorpionPokerCard} from './ScorpionPokerCard';
import {getScorpionSelectionCards,SCORPION_ROLE_BY_ID} from '../constants/scorpionAssets';
import {colors} from '../theme/colors';

export function WerewolfRoleSetup({game,editable,busy,onToggle,onConfirm}) {
 const {width,height}=useWindowDimensions();
 const allCards=useMemo(()=>getScorpionSelectionCards(game.playerCount),[game.playerCount]);
 const selected=new Set(game.selectedCards||[]);
 const needed=game.requiredCards;
 const chosen=allCards.filter(card=>selected.has(card.key));
 const counts=chosen.reduce((acc,card)=>(acc[card.roleId]=(acc[card.roleId]||0)+1,acc),{});
 const full=selected.size===needed;
 const valid=full&&Boolean((counts.SCORPION||0)+(counts.SCORPIONESS||0))&&
  (!counts.MASON||counts.MASON===2);
 const narrow=width<900;
 const gap=narrow?7:12;
 const columns=width<690?5:width<1100?8:width<1450?10:12;
 const usableWidth=Math.max(320,width-(narrow?48:90));
 const cardWidth=Math.min(126,Math.max(46,Math.floor((usableWidth-(columns-1)*gap)/columns)-14));
 const selectedStyle=st.selected;
 const capReached=selected.size>=needed;
 return <View style={st.screen}>
  <View style={st.header}>
   <View style={st.titleBlock}>
    <ArabicText weight="extraBold" style={st.title}>اختاروا بطاقات ليلة العقارب</ArabicText>
    <ArabicText style={st.help}>{editable?
     'اضغط على أي بطاقة لتختارها، واضغط عليها مرة ثانية لتشيلها.':
     'المضيف بختار بطاقات الجولة. تابع التشكيلة لحظة بلحظة.'}</ArabicText>
   </View>
   <View style={st.counter}>
    <ArabicText weight="extraBold" style={st.count}>{selected.size} / {needed}</ArabicText>
    <ArabicText style={st.countCaption}>اللاعبون {game.playerCount} + ٣ بطاقات للوسط • من أصل {allCards.length} بطاقة</ArabicText>
   </View>
  </View>
  <ScrollView style={st.scroller} contentContainerStyle={[st.cards,{gap,paddingBottom:12}]}
    nestedScrollEnabled showsVerticalScrollIndicator={false}>
   {allCards.map(card=>{
    const isSelected=selected.has(card.key);
    const disabled=!editable||busy||(!isSelected&&capReached);
    return <Pressable key={card.key} accessibilityRole="button"
      accessibilityLabel={SCORPION_ROLE_BY_ID[card.roleId]?.name}
      accessibilityState={{selected:isSelected,disabled}}
      onPress={()=>onToggle(card.key)} disabled={disabled}
      style={[st.tile,{width:cardWidth+12,padding:5},
        isSelected&&selectedStyle,disabled&&!isSelected&&editable&&st.unavailable]}>
      <ScorpionPokerCard width={cardWidth} roleId={card.roleId}
        variant={card.variant} faceUp instant/>
      {isSelected?<View style={st.tick}><ArabicText weight="extraBold" style={st.tickText}>✓</ArabicText></View>:null}
    </Pressable>;
   })}
  </ScrollView>
  <View style={st.footer}>
   <ArabicText style={[st.validation,{color:valid?colors.mustard:colors.cream}]}>
    {valid?'✓ التشكيلة جاهزة!':
      !full?'اختار '+(needed-selected.size)+' بطاقات إضافية':
      !(counts.SCORPION||counts.SCORPIONESS)?'لازم تختار العقرب أو العقربة':
      counts.MASON===1?'الصحاب لازم يكونوا الاثنين مع بعض':'التشكيلة غير صالحة'}
   </ArabicText>
   {editable?<PrimaryButton compact icon="play" title="اعتمد البطاقات ووزّعها"
     disabled={!valid||busy} loading={busy} onPress={onConfirm}/>:
    <ArabicText style={st.waiting}>بنستنى المضيف يعتمد التشكيلة…</ArabicText>}
  </View>
 </View>;
}
const st=StyleSheet.create({
 screen:{flex:1,minHeight:0,width:'100%',maxWidth:1600,alignSelf:'center',gap:8},
 header:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap'},
 titleBlock:{flex:1,minWidth:180,gap:3},
 title:{color:colors.mustard,fontSize:21,textAlign:'right'},
 help:{fontSize:12,color:colors.cream,textAlign:'right'},
 counter:{borderColor:colors.mustard,borderWidth:2,borderRadius:14,backgroundColor:'#59273e',padding:7,alignItems:'center'},
 count:{color:colors.mustard,fontSize:20},
 countCaption:{color:colors.cream,fontSize:11},
 scroller:{flex:1,minHeight:0,alignSelf:'stretch'},
 cards:{flexDirection:'row-reverse',flexWrap:'wrap',justifyContent:'center',alignItems:'flex-start',paddingTop:4},
 tile:{borderWidth:2,borderRadius:11,borderColor:'#774961',backgroundColor:'#51253b',position:'relative',alignItems:'center',justifyContent:'center'},
 selected:{borderColor:colors.coral,backgroundColor:'#7f3546',borderWidth:3},
 unavailable:{opacity:.55},
 tick:{position:'absolute',top:0,right:0,width:23,height:23,borderRadius:12,
  backgroundColor:colors.coral,borderColor:colors.cream,borderWidth:1,justifyContent:'center',alignItems:'center'},
 tickText:{color:colors.cream,fontSize:14},
 footer:{flexDirection:'row-reverse',gap:10,alignItems:'center',justifyContent:'center',
  flexWrap:'wrap',minHeight:43,paddingBottom:2},
 validation:{fontSize:14,fontWeight:'bold',textAlign:'center'},
 waiting:{fontSize:13,color:colors.cream,textAlign:'center'},
});
