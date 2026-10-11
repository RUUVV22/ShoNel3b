import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { PlayerList } from './PlayerList';
import { TEAM_LABEL } from '../constants/game';
import { colors, teamColor } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function TeamPanel({ team, players, remaining, selected, joining, onJoin, ...playerListProps }) {
  const color = teamColor(team);
  return (
    <View style={[styles.panel, selected && styles.selected]}>
      <View style={[styles.header, { backgroundColor: color }]}>
        <View style={[styles.teamDot, { backgroundColor: colors.plum }]} />
        <ArabicText weight="extraBold" style={styles.title}>
          {team === 'RED' ? 'الفريق المرجاني' : 'الفريق الذهبي'}
        </ArabicText>
        <View style={styles.playerCount}><ArabicText weight="bold" style={styles.playerCountText}>{players.length} ✦</ArabicText></View>
        {onJoin ? (
          <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled: selected || joining }}
            disabled={selected || joining} onPress={onJoin} style={[styles.joinButton, selected && styles.joined]}>
            <Ionicons name={selected ? 'checkmark' : 'add'} size={16} color={colors.plum} />
            <ArabicText weight="extraBold" style={styles.joinText}>{selected ? 'فريقك' : 'انضم'}</ArabicText>
          </Pressable>
        ) : null}
        {Number.isInteger(remaining) ? (
          <View style={styles.remaining}><ArabicText weight="extraBold" style={styles.remainingText}>{remaining}</ArabicText></View>
        ) : null}
      </View>
      <View style={styles.players}><PlayerList players={players} {...playerListProps} /></View>
    </View>
  );
}
const styles = StyleSheet.create({
  panel: { flex: 1, minWidth: 0, borderRadius: radius.lg, borderWidth: 2.5, borderBottomWidth: 6,
    borderColor: colors.plum, backgroundColor: colors.cream, overflow: 'hidden',
    shadowColor: colors.plum, shadowOffset: { width: 3, height: 4 }, shadowOpacity: 0.2, shadowRadius: 0 },
  selected: { borderBottomWidth: 8 },
  header: { flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, padding: spacing.md, minHeight: 56 },
  teamDot: { width: 11, height: 11, borderRadius: 6 },
  title: { flex: 1, minWidth: 95, color: colors.plum, fontSize: 17 },
  playerCount: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.cream },
  playerCountText: { color: colors.plum, fontSize: 11 },
  joinButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: colors.plum, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: colors.cream },
  joined: { backgroundColor: '#FFEAC0' },
  joinText: { color: colors.plum, fontSize: 11 },
  remaining: { backgroundColor: colors.plum, minWidth: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  remainingText: { color: colors.cream, fontSize: 12 },
  players: { padding: spacing.sm },
});