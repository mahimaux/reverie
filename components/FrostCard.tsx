/**
 * Frosted glass card (PRD §8 glassmorphism / TRD §10 --surface-frost).
 * BlurView with a translucent white wash and a hairline light border + soft shadow.
 * Falls back gracefully to a solid frost colour where blur is unavailable.
 */
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadowCard } from '../theme/tokens';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'default';
  padding?: number;
}

export function FrostCard({ children, style, intensity = 32, padding = 22 }: Props) {
  return (
    <View style={[styles.shadow, style]}>
      <BlurView intensity={intensity} tint="light" style={styles.blur}>
        <View style={[styles.wash, { padding }]}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.card,
    ...shadowCard,
    backgroundColor: 'transparent',
  },
  blur: {
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.frostBorder,
  },
  wash: {
    backgroundColor: colors.frost,
  },
});
