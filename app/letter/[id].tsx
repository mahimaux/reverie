import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen } from '../../components/Screen';
import { SunBlob } from '../../components/SunBlob';
import { Eyebrow } from '../../components/bits';
import { getReadings } from '../../lib/storage/repo';
import type { Reading } from '../../lib/types';
import { colors, radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/typography';

export default function LetterDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [reading, setReading] = useState<Reading | null>(null);

  useEffect(() => {
    getReadings().then((all) => setReading(all.find((r) => r.context.id === id) || null));
  }, [id]);

  return (
    <Screen scroll blobs={false}>
      <SunBlob size={260} style={styles.blob} intensity={0.45} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹ letters</Text>
        </Pressable>
        <Eyebrow>A letter</Eyebrow>
      </View>

      {reading?.letter ? (
        <Animated.View entering={FadeIn.duration(500)}>
          <Text style={styles.date}>
            {new Date(reading.completedAt || reading.context.createdAt).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.paper}>
            <Text style={styles.letter}>{reading.letter.letter}</Text>
          </Animated.View>
          {reading.context.situation ? (
            <Text style={styles.context}>
              the day this was written, you wrote: “{reading.context.situation}”
            </Text>
          ) : null}
        </Animated.View>
      ) : (
        <Text style={styles.missing}>This letter couldn't be found.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', top: -80, right: -80 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  back: { ...type.bodyMd, color: colors.textSecondary },
  date: { ...type.micro, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: spacing.md },
  paper: {
    backgroundColor: colors.cardCream,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    padding: spacing.xl,
  },
  letter: { ...type.serifBody, color: colors.textPrimary, fontSize: 17, lineHeight: 29 },
  context: {
    ...type.small,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  missing: { ...type.body, color: colors.textSecondary, marginTop: spacing.xxl, textAlign: 'center' },
});
