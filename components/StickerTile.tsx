/**
 * A collectible sticker (PRD §6). A warm gradient disc with a celestial glyph
 * and 2-3 words of motivation. Milestones get a gold ring. Not-yet-earned
 * stickers render in a soft greyed/locked state so you can see what's left.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { colors, shadowSoft, sunGradient } from '../theme/tokens';
import { type } from '../theme/typography';
import type { Sticker } from '../lib/types';

interface Props {
  sticker: Sticker;
  size?: number;
  animateIn?: boolean;
  locked?: boolean;
}

export function StickerTile({ sticker, size = 96, animateIn, locked }: Props) {
  const Wrapper: any = animateIn ? Animated.View : View;
  const wrapperProps = animateIn ? { entering: ZoomIn.springify().damping(14) } : {};

  if (locked) {
    return (
      <View style={styles.tile}>
        <View style={[styles.lockedDisc, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.lockedGlyph, { fontSize: size * 0.3 }]}>{sticker.art}</Text>
          <View style={styles.lockBadge}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        </View>
        <Text style={[styles.label, styles.lockedLabel]} numberOfLines={2}>
          {sticker.label}
        </Text>
      </View>
    );
  }

  return (
    <Wrapper {...wrapperProps} style={styles.tile}>
      <LinearGradient
        colors={sticker.milestone ? ['#FFEFD9', '#FFD0A3', '#FF9D4D'] : [...sunGradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[
          styles.disc,
          { width: size, height: size, borderRadius: size / 2 },
          sticker.milestone && styles.milestone,
        ]}
      >
        <Text style={[styles.glyph, { fontSize: size * 0.34 }]}>{sticker.art}</Text>
      </LinearGradient>
      <Text style={styles.label} numberOfLines={2}>
        {sticker.label}
      </Text>
    </Wrapper>
  );
}

/** Empty placeholder slot for the sticker book grid. */
export function StickerSlot({ size = 96 }: { size?: number }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.empty, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.emptyGlyph}>✧</Text>
      </View>
      <Text style={[styles.label, { color: colors.textTertiary }]}> </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', gap: 8, width: 110 },
  disc: { alignItems: 'center', justifyContent: 'center', ...shadowSoft },
  milestone: { borderWidth: 2, borderColor: colors.gold },
  glyph: { color: '#3A1B00' },
  label: { ...type.label, color: colors.textPrimary, textAlign: 'center' },

  lockedDisc: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(138,131,120,0.14)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  lockedGlyph: { color: colors.textTertiary, opacity: 0.55 },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bgIvory,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  lockIcon: { fontSize: 12 },
  lockedLabel: { color: colors.textTertiary },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  emptyGlyph: { color: colors.textTertiary, fontSize: 22 },
});
