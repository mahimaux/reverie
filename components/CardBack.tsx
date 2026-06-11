/**
 * Face-down tarot card back (PRD §8 / TRD §10): cream stock, a fine-line
 * celestial sun motif (the brand hero), and a hint of warm-gold foil.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import { colors, radius } from '../theme/tokens';

interface Props {
  width: number;
  height: number;
}

export function CardBack({ width, height }: Props) {
  const cx = width / 2;
  const cy = height / 2;
  const rays = Array.from({ length: 16 });
  const sun = Math.min(width, height) * 0.16;

  return (
    <View style={[styles.card, { width, height }]}>
      <Svg width={width} height={height}>
        {/* frame */}
        <Rect
          x={10}
          y={10}
          width={width - 20}
          height={height - 20}
          rx={radius.md}
          fill="none"
          stroke={colors.gold}
          strokeOpacity={0.45}
          strokeWidth={1}
        />
        <Rect
          x={16}
          y={16}
          width={width - 32}
          height={height - 32}
          rx={radius.sm}
          fill="none"
          stroke={colors.gold}
          strokeOpacity={0.22}
          strokeWidth={0.75}
        />

        {/* sun rays */}
        <G>
          {rays.map((_, i) => {
            const angle = (Math.PI * 2 * i) / rays.length;
            const inner = sun + 8;
            const outer = sun + (i % 2 === 0 ? 30 : 18);
            return (
              <Line
                key={i}
                x1={cx + Math.cos(angle) * inner}
                y1={cy + Math.sin(angle) * inner}
                x2={cx + Math.cos(angle) * outer}
                y2={cy + Math.sin(angle) * outer}
                stroke={colors.gold}
                strokeOpacity={0.55}
                strokeWidth={1}
                strokeLinecap="round"
              />
            );
          })}
          <Circle cx={cx} cy={cy} r={sun} fill="none" stroke={colors.gold} strokeOpacity={0.7} strokeWidth={1.2} />
          <Circle cx={cx} cy={cy} r={sun * 0.5} fill={colors.sunTo} fillOpacity={0.35} />
        </G>

        {/* scattered stars */}
        <Circle cx={width * 0.24} cy={height * 0.2} r={1.6} fill={colors.gold} fillOpacity={0.6} />
        <Circle cx={width * 0.78} cy={height * 0.26} r={1.2} fill={colors.gold} fillOpacity={0.5} />
        <Circle cx={width * 0.7} cy={height * 0.8} r={1.8} fill={colors.gold} fillOpacity={0.6} />
        <Circle cx={width * 0.26} cy={height * 0.78} r={1.3} fill={colors.gold} fillOpacity={0.5} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.cardCream,
    overflow: 'hidden',
  },
});
