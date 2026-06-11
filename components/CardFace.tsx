/**
 * The revealed face of a tarot card (minimal front, TRD §10). Cream stock with
 * a sun emblem and a single editorial word. The full personalised reading then
 * expands beneath it on the screen.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, sunGradient } from '../theme/tokens';
import { type } from '../theme/typography';

interface Props {
  width: number;
  height: number;
  word?: string;
}

export function CardFace({ width, height, word = 'for you' }: Props) {
  return (
    <View style={[styles.card, { width, height }]}>
      <View style={styles.center}>
        <LinearGradient
          colors={[...sunGradient]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={styles.sun}
        />
        <Text style={styles.word}>{word}</Text>
      </View>
      <Text style={styles.glyphTop}>✦</Text>
      <Text style={styles.glyphBottom}>☾</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.cardCream,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', gap: 16 },
  sun: { width: 76, height: 76, borderRadius: 38 },
  word: { ...type.serifQuote, color: colors.textPrimary, fontSize: 20 },
  glyphTop: { position: 'absolute', top: 14, left: 16, color: colors.gold, opacity: 0.6 },
  glyphBottom: { position: 'absolute', bottom: 14, right: 16, color: colors.gold, opacity: 0.6 },
});
