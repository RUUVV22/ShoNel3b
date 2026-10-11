import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { GameHeader } from '../components/GameHeader';
import { ArabicText } from '../components/ArabicText';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGame } from '../context/GameContext';
import { parseRoomCode } from '../utils/deepLinks';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/layout';

export function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { showNotice } = useGame();

  if (!permission) return <ScreenContainer scroll={false} />;
  if (!permission.granted) {
    return (
      <ScreenContainer scroll={false} contentStyle={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={60} color={colors.gold} />
        <ArabicText weight="bold" style={styles.permissionTitle}>السماح باستخدام الكاميرا</ArabicText>
        <ArabicText style={styles.permissionText}>تُستخدم الكاميرا فقط لمسح رمز QR الخاص بالغرفة.</ArabicText>
        <PrimaryButton title="السماح بالكاميرا" icon="camera" onPress={requestPermission} />
        <PrimaryButton title="العودة" variant="ghost" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  const handleScan = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    const roomCode = parseRoomCode(data);
    if (!roomCode) {
      showNotice('رمز QR لا يخص غرفة صالحة');
      setTimeout(() => setScanned(false), 1_200);
      return;
    }
    navigation.navigate('JoinRoom', { roomCode });
  };

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />
      <View style={styles.scrim}>
        <GameHeader title="مسح رمز الغرفة" onBack={() => navigation.goBack()} />
        <View style={styles.scanArea}>
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerBottomRight} />
          <View style={styles.cornerBottomLeft} />
        </View>
        <ArabicText weight="medium" style={styles.help}>ضع رمز QR داخل الإطار</ArabicText>
      </View>
    </View>
  );
}

const corner = { position: 'absolute', width: 38, height: 38, borderColor: colors.gold };
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  scrim: { flex: 1, paddingTop: 52, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: 'rgba(53,19,38,0.48)', justifyContent: 'space-between' },
  scanArea: { alignSelf: 'center', width: 260, height: 260, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.04)' },
  cornerTopRight: { ...corner, top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius.md },
  cornerTopLeft: { ...corner, top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius.md },
  cornerBottomRight: { ...corner, bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius.md },
  cornerBottomLeft: { ...corner, bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius.md },
  help: { color: colors.white, textAlign: 'center', fontSize: 16, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignSelf: 'center' },
  permissionScreen: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  permissionTitle: { fontSize: 24, textAlign: 'center' },
  permissionText: { color: colors.muted, fontSize: 14, textAlign: 'center', maxWidth: 320 },
});
