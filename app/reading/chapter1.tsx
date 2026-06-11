import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CardFace } from '../../components/CardFace';
import { FrostCard } from '../../components/FrostCard';
import { PillButton } from '../../components/PillButton';
import { Screen } from '../../components/Screen';
import { ShuffleDeck } from '../../components/ShuffleDeck';
import { ChapterProgress, Eyebrow, ThumbsFeedback } from '../../components/bits';
import { useReading } from '../../features/reading/ReadingProvider';
import { getReframe } from '../../lib/api/client';
import { useReducedMotion } from '../../lib/motion/reducedMotion';
import type { ChapterOneResult } from '../../lib/types';
import { colors, spacing } from '../../theme/tokens';
import { type } from '../../theme/typography';

export default function ChapterOne() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { reading, setChapterOne } = useReading();

  const [result, setResult] = useState<ChapterOneResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const started = useRef(false);

  // Kick off the AI call immediately; the shuffle masks the latency (TRD §3.1).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!reading) {
      router.replace('/reading/feelings');
      return;
    }
    (async () => {
      const res = await getReframe(reading.context.feelings, reading.context.situation);
      if (!res.safe) {
        router.replace('/reading/safety');
        return;
      }
      setResult(res.result);
      setChapterOne(res.result);
    })();
  }, []);

  if (!reading) return null;

  return (
    <Screen scroll padTop>
      <View style={styles.header}>
        <Eyebrow>Chapter 1 · Behind the scenes</Eyebrow>
        <ChapterProgress current={1} />
      </View>

      {!revealed ? (
        <View style={styles.deckArea}>
          <Text style={styles.prompt}>
            Take a breath. When you're ready, the cards know what to say.
          </Text>
          <ShuffleDeck
            count={3}
            front={<CardFace width={150} height={220} word="the truth" />}
            ready={result !== null}
            reducedMotion={reduced}
            onRevealed={() => setRevealed(true)}
          />
        </View>
      ) : (
        <Animated.View entering={FadeInDown.duration(500)} style={{ gap: spacing.md }}>
          <FrostCard padding={26}>
            <Text style={styles.beatLabel}>behind the scenes</Text>
            <Text style={styles.beat}>{result?.behindTheScenes}</Text>
            <View style={styles.divider} />
            <Text style={styles.beatLabel}>the flip</Text>
            <Text style={styles.beatSerif}>{result?.flip}</Text>
          </FrostCard>

          <ThumbsFeedback />

          <PillButton
            label="Keep going"
            onPress={() => router.push('/reading/chapter2')}
            full
            style={{ marginTop: spacing.sm }}
          />
          <View style={{ height: insets.bottom }} />
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  deckArea: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.xxl },
  prompt: {
    ...type.serifBody,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  beatLabel: {
    ...type.micro,
    color: colors.sunFrom,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  beat: { ...type.body, color: colors.textPrimary, fontSize: 16, lineHeight: 25 },
  beatSerif: { ...type.serifBody, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: spacing.lg },
});
