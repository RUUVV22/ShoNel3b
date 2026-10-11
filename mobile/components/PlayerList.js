import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { CharacterAvatar } from './CharacterAvatar';
import { ROLE, ROLE_LABEL } from '../constants/game';
import { colors, teamColor } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function PlayerList({ players, editable, currentPlayerId, onToggleRole, onMoveTeam, onRemove }) {
  if (!players.length) {
    return <ArabicText style={styles.empty}>مقعد فاضي... مين رح يقعد هون؟</ArabicText>;
  }
  return (
    <View style={styles.list}>
      {players.map(player => (
        <View key={player.id} style={[styles.card, !player.connected && styles.offline,
          player.id === currentPlayerId && styles.ownCard]}>
          <View style={styles.cardTop}>
            <CharacterAvatar name={player.name} size={55} accent={teamColor(player.team)} />
            <View style={styles.nameWrap}>
              <View style={styles.nameRow}>
                {player.isHost ? <Ionicons name="star" size={13} color={colors.coral} /> : null}
                <ArabicText weight="extraBold" numberOfLines={1} style={styles.name}>
                  {player.name}{player.id === currentPlayerId ? ' • أنت' : ''}
                </ArabicText>
              </View>
              <ArabicText style={styles.connection}>{player.connected ? '● على الطاولة' : '○ غير متصل'}</ArabicText>
            </View>
          </View>
          <View style={styles.actionsRow}>
            <Pressable accessibilityRole="button" accessibilityLabel={'دور ' + player.name}
              disabled={!editable} onPress={() => onToggleRole(player)}
              style={[styles.role, player.role === ROLE.SPYMASTER && styles.spyRole]}>
              <ArabicText weight="bold" style={styles.roleText}>{ROLE_LABEL[player.role]}</ArabicText>
              {editable ? <Ionicons name="swap-vertical" color={colors.plum} size={12} /> : null}
            </Pressable>
            {editable && player.id !== currentPlayerId ? (
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" accessibilityLabel={'نقل ' + player.name} onPress={() => onMoveTeam(player)} style={styles.actionButton}>
                  <Ionicons name="swap-horizontal" size={16} color={colors.plum} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={'إزالة ' + player.name} onPress={() => onRemove(player)} style={styles.actionButton}>
                  <Ionicons name="close" size={17} color={colors.coral} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  list: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    flexGrow: 1, minWidth: 142, flexBasis: '45%', borderWidth: 2, borderBottomWidth: 5,
    borderColor: colors.plum, borderRadius: radius.md, backgroundColor: colors.cream,
    padding: spacing.sm, gap: spacing.sm,
    shadowColor: colors.plum, shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.16, shadowRadius: 0,
  },
  ownCard: { backgroundColor: '#FFF5DC' },
  offline: { opacity: 0.55 },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  nameWrap: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  name: { flexShrink: 1, color: colors.plum, fontSize: 14, lineHeight: 19 },
  connection: { color: colors.inkMuted, fontSize: 10 },
  actionsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 3 },
  role: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, paddingVertical: 5, paddingHorizontal: 8,
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.plum, backgroundColor: colors.cream },
  spyRole: { backgroundColor: colors.mustard },
  roleText: { color: colors.plum, fontSize: 11 },
  actions: { flexDirection: 'row-reverse', gap: 4 },
  actionButton: { width: 27, height: 27, borderRadius: 8, backgroundColor: '#F7E1BE',
    borderWidth: 1, borderColor: colors.plum, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.inkMuted, fontSize: 12, textAlign: 'center', padding: spacing.md },
});