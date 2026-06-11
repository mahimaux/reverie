import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FrostCard } from '../components/FrostCard';
import { Screen } from '../components/Screen';
import { Eyebrow } from '../components/bits';
import { getReadings } from '../lib/storage/repo';
import type { Reading } from '../lib/types';
import { colors, spacing } from '../theme/tokens';
import { type } from '../theme/typography';

export default function Letters() {
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);

  useFocusEffect(
    useCallback(() => {
      getReadings().then((all) => setReadings(all.filter((r) => r.letter)));
    }, []),
  );

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹ home</Text>
        </Pressable>
        <Eyebrow>Your letters</Eyebrow>
      </View>

      <Text style={styles.title}>Notes from{'\n'}future you</Text>
      <Text style={styles.sub}>Re-read these whenever the comparison creeps back in.</Text>

      {readings.length === 0 ? (
        <Text style={styles.empty}>
          No letters yet. Finish a reading and future-you will write you one. 🤍
        </Text>
      ) : (
        <View style={styles.list}>
          {readings.map((r, i) => {
            const preview = (r.letter?.letter || '').replace(/\n+/g, ' ').slice(0, 90);
            return (
              <Animated.View key={r.context.id} entering={FadeInDown.delay(i * 80).duration(400)}>
                <Pressable onPress={() => router.push(`/letter/${r.context.id}`)}>
                  <FrostCard padding={22}>
                    <Text style={styles.date}>
                      {new Date(r.completedAt || r.context.createdAt).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.preview}>{preview}…</Text>
                    <Text style={styles.read}>read letter →</Text>
                  </FrostCard>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  back: { ...type.bodyMd, color: colors.textSecondary },
  title: { ...type.display, color: colors.textPrimary },
  sub: { ...type.body, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.xl },
  empty: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  list: { gap: spacing.md },
  date: { ...type.micro, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
  preview: { ...type.serifBody, color: colors.textPrimary },
  read: { ...type.label, color: colors.sunFrom, marginTop: 12 },
});
