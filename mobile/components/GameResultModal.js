import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { PrimaryButton } from './PrimaryButton';
import { RESULT_LABEL, TEAM_LABEL } from '../constants/game';
import { colors, teamColor } from '../theme/colors';
import { radius, shadow, spacing } from '../theme/layout';
import { soundService } from '../services/sounds';

export function GameResultModal({ visible, winner, reason, myTeam, isHost, loading, onReplay, onLobby }) {
  const didWin = winner === myTeam;
  useEffect(() => {
    if (visible) soundService.play(didWin ? 'victory' : 'defeat');
  }, [didWin, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <LinearGradient colors={[colors.panelRaised, colors.inkSoft]} style={[styles.card, { borderColor: teamColor(winner) }]}>
          <View style={[styles.iconShell, { backgroundColor: teamColor(winner) }]}>
            <Ionicons name={didWin ? 'trophy' : 'flag'} size={38} color={colors.plum} />
          </View>
          <ArabicText weight="extraBold" style={styles.eyebrow}>{didWin ? 'انتصار!' : 'انتهت الجولة'}</ArabicText>
          <ArabicText weight="extraBold" style={[styles.winner, { color: teamColor(winner) }]}>
            فاز {TEAM_LABEL[winner]}
          </ArabicText>
          <ArabicText style={styles.reason}>{RESULT_LABEL[reason] || 'انتهت الجولة'}</ArabicText>
          {isHost ? (
            <View style={styles.actions}>
              <PrimaryButton title="جولة جديدة" icon="refresh" loading={loading} onPress={onReplay} />
              <PrimaryButton title="ارجع لِلّمّتنا" icon="people-outline" variant="ghost" onPress={onLobby} />
            </View>
          ) : (
            <ArabicText style={styles.waiting}>بانتظار المضيف لبدء جولة جديدة…</ArabicText>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    width: '100%',
    maxWidth: 430,
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: radius.lg,
    borderWidth: 2,
    ...shadow,
  },
  iconShell: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { color: colors.gold, fontSize: 18, textAlign: 'center' },
  winner: { fontSize: 28, textAlign: 'center', marginTop: spacing.xs },
  reason: { color: colors.paperMuted, fontSize: 15, textAlign: 'center', marginTop: spacing.sm },
  actions: { width: '100%', gap: spacing.md, marginTop: spacing.xl },
  waiting: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
