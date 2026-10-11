import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

// A repeating hairline/dot pattern rather than a noisy bitmap, identical on web and mobile.
export function PaperTexture({ dark = false }) {
  const pigment = dark ? colors.cream : colors.plum;
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject} width="100%" height="100%">
      <Defs>
        <Pattern id={dark ? 'sho-paper-dark' : 'sho-paper-light'} width="38" height="38" patternUnits="userSpaceOnUse">
          <Circle cx="5" cy="9" r="0.65" fill={pigment} opacity={dark ? 0.11 : 0.08} />
          <Circle cx="30" cy="27" r="0.75" fill={pigment} opacity={dark ? 0.09 : 0.07} />
          <Line x1="13" y1="34" x2="15" y2="31" stroke={pigment} strokeWidth="0.4" opacity="0.08" />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={dark ? 'url(#sho-paper-dark)' : 'url(#sho-paper-light)'} />
    </Svg>
  );
}