import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

const FALLBACK_PUBLIC_APP_URL = 'https://ruuvv22.github.io/Arabic_CodeNames/';

export function parseRoomCode(value) {
  if (!value) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(String(value)).trim();
  } catch {
    return null;
  }

  const directCode = decoded.toUpperCase();
  if (/^[A-Z2-9]{5}$/.test(directCode)) return directCode;

  const deepLinkMatch = decoded.match(/^(?:shonel3b|codenames):\/\/join\/([A-Z2-9]{5})(?:[/?#].*)?$/i);
  if (deepLinkMatch) return deepLinkMatch[1].toUpperCase();

  try {
    const url = new URL(decoded);
    const queryCode = String(url.searchParams.get('room') || '').toUpperCase();
    if (/^[A-Z2-9]{5}$/.test(queryCode)) return queryCode;

    const pathMatch = url.pathname.match(/\/join\/([A-Z2-9]{5})(?:\/|$)/i);
    return pathMatch?.[1]?.toUpperCase() || null;
  } catch {
    return null;
  }
}

export function roomDeepLink(roomCode) {
  return `shonel3b://join/${String(roomCode || '').toUpperCase()}`;
}

export function publicAppUrl() {
  const configured = String(process.env.EXPO_PUBLIC_APP_URL || '').trim();
  if (/^https?:\/\//i.test(configured)) return configured.replace(/\/?$/, '/');
  if (Platform.OS === 'web') return Linking.createURL('/').replace(/\/?$/, '/');
  return FALLBACK_PUBLIC_APP_URL;
}

export function roomJoinUrl(roomCode) {
  const code = String(roomCode || '').trim().toUpperCase();
  const separator = publicAppUrl().includes('?') ? '&' : '?';
  return `${publicAppUrl()}${separator}room=${encodeURIComponent(code)}`;
}
