/**
 * Selectable feeling-chip (PRD §5.1 / TRD §10). Pill, soft, taps to select;
 * selected state warms to the sun gradient.
 */
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, sunGradient } from '../theme/tokens';
import { type } from '../theme/typography';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FeelingChip({ label, selected, onPress }: Props) {
  const handle = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onPress();
  };
  return (
    <Pressable onPress={handle} accessibilityRole="button" accessibilityState={{ selected }}>
      {selected ? (
        <LinearGradient
          colors={[...sunGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.chip, styles.selected]}
        >
          <Text style={[type.bodyMd, styles.textSelected]}>{label}</Text>
        </LinearGradient>
      ) : (
        <Text style={[type.bodyMd, styles.chip, styles.idle]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  idle: {
    backgroundColor: colors.frostStrong,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    color: colors.textPrimary,
  },
  selected: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  textSelected: { color: '#3A1B00' },
});
