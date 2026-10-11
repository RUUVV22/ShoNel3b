import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

// Deterministic tabletop tokens; silhouettes vary with the player's name.
export function CharacterAvatar({ name = '', size = 58, accent }) {
  const hash = [...name].reduce((n, char) => ((n * 33) + char.charCodeAt(0)) >>> 0, 7);
  const variant = hash % 4;
  const bg = accent || (hash % 2 === 0 ? colors.coral : colors.mustard);
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" accessibilityLabel={'Character for ' + name}>
      <Rect x="1.5" y="1.5" width="77" height="77" rx="19" fill={bg} stroke={colors.plum} strokeWidth="3" />
      <Circle cx="40" cy="37" r="17" fill={colors.plum} />
      <Path d="M11 78 C13 58 22 52 40 52 C58 52 67 58 69 78 Z" fill={colors.plum} />
      {variant === 0 ? <Path d="M24 34 Q20 15 40 17 Q60 15 56 34 Q45 27 40 24 Q35 31 24 34Z" fill={colors.plum} /> : null}
      {variant === 1 ? <Path d="M22 24 L58 24 L54 17 L28 17 Z" fill={colors.cream} stroke={colors.plum} strokeWidth="3" /> : null}
      {variant === 2 ? <Path d="M22 33 Q19 14 32 20 Q40 9 49 20 Q63 14 59 33" fill={colors.plum} stroke={colors.cream} strokeWidth="2" /> : null}
      {variant === 3 ? <Path d="M22 34 Q40 10 58 34 L58 27 Q40 11 22 27 Z" fill={colors.cream} stroke={colors.plum} strokeWidth="2" /> : null}
      <Circle cx="34" cy="38" r="1.8" fill={colors.cream} />
      <Circle cx="46" cy="38" r="1.8" fill={colors.cream} />
      <Path d="M36 46 Q40 49 44 46" stroke={colors.cream} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </Svg>
  );
}