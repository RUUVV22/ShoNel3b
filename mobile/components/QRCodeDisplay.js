import React from 'react';
import { Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ArabicText } from './ArabicText';
import { PrimaryButton } from './PrimaryButton';
import { roomJoinUrl } from '../utils/deepLinks';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function QRCodeDisplay({ roomCode, compact = false }) {
  const link = roomJoinUrl(roomCode);
  const share = () => Share.share({
    title: 'انضم إلى غرفة شو نلعب',
    message: `انضم إلى غرفة شو نلعب برمز ${roomCode}\n${link}`,
    url: link,
  });

  return (
    <View style={[styles.panel, compact && styles.compactPanel]}>
      <View style={styles.qrShell}>
        <QRCode value={link} size={compact ? 118 : 164} color={colors.ink} backgroundColor={colors.white} />
      </View>
      {!compact ? (
        <>
          <ArabicText style={styles.help}>امسح الرمز بأي كاميرا للانضمام مباشرة</ArabicText>
          <PrimaryButton compact title="مشاركة الغرفة" icon="share-social-outline" variant="ghost" onPress={share} />
        </>
      ) : (
        <PrimaryButton compact title="مشاركة" icon="share-social-outline" variant="ghost" onPress={share} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,240,207,0.07)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  compactPanel: { flex: 1, padding: spacing.sm, borderWidth: 1.5, borderColor: colors.cream },
  qrShell: { padding: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md },
  help: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
