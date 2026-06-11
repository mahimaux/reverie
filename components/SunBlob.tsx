/**
 * The brand hero: a soft radial "sun" gradient blob (PRD §8 / TRD §10).
 * Rendered with an SVG radial gradient so the falloff is genuinely soft,
 * echoing the reference image's orange→peach sun.
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/tokens';

interface Props {
  size?: number;
  style?: StyleProp<ViewStyle>;
  intensity?: number; // 0..1 overall opacity
}

export function SunBlob({ size = 280, style, intensity = 1 }: Props) {
  const id = React.useId();
  return (
    <Svg width={size} height={size} style={style} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="45%" r="55%">
          <Stop offset="0%" stopColor={colors.sunFrom} stopOpacity={0.95 * intensity} />
          <Stop offset="45%" stopColor={colors.sunMid} stopOpacity={0.85 * intensity} />
          <Stop offset="78%" stopColor={colors.sunTo} stopOpacity={0.45 * intensity} />
          <Stop offset="100%" stopColor={colors.sunTo} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}
