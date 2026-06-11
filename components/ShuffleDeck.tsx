/**
 * ShuffleDeck — the signature ceremony (TRD §3.1, §3.2, §9).
 *
 * Phases:
 *  1. shuffling  — card backs riffle/settle; doubles as the AI loading state.
 *  2. spread     — cards fan out, face-down and tappable.
 *  3. revealing  — the tapped card glides to centre and flips to the SAME
 *                  prepared content (independent of which card was chosen).
 *
 * If the user taps before the AI result is ready, we hold on a gentle
 * "the cards are settling…" micro-state, then flip once it resolves.
 * Honours reduced-motion (fades instead of motion).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/tokens';
import { type } from '../theme/typography';
import { CardBack } from './CardBack';
import { FlipCard } from './FlipCard';

interface Props {
  count?: number;
  cardWidth?: number;
  cardHeight?: number;
  front: React.ReactNode; // the prepared reveal content
  ready: boolean; // AI result resolved
  onRevealed?: () => void;
  reducedMotion?: boolean;
  minShuffleMs?: number;
}

type Phase = 'shuffling' | 'spread' | 'revealing';

export function ShuffleDeck({
  count = 3,
  cardWidth = 150,
  cardHeight = 220,
  front,
  ready,
  onRevealed,
  reducedMotion,
  minShuffleMs = 1500,
}: Props) {
  const [phase, setPhase] = useState<Phase>('shuffling');
  const [pending, setPending] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);

  // shuffle → spread after a minimum ceremony time
  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p === 'shuffling' ? 'spread' : p)), minShuffleMs);
    return () => clearTimeout(t);
  }, [minShuffleMs]);

  // once a card is pending and the result is ready, reveal it
  useEffect(() => {
    if (pending !== null && ready && phase === 'spread') {
      setChosen(pending);
      setPhase('revealing');
    }
  }, [pending, ready, phase]);

  const onPick = (i: number) => {
    if (phase !== 'spread') return;
    setPending(i);
  };

  const waiting = pending !== null && !ready;

  return (
    <View style={styles.stage}>
      <View style={[styles.deck, { width: cardWidth * 2.4, height: cardHeight + 40 }]}>
        {phase === 'revealing' && chosen !== null ? (
          <RevealCard
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            front={front}
            reducedMotion={reducedMotion}
            onDone={onRevealed}
          />
        ) : (
          Array.from({ length: count }).map((_, i) => (
            <DeckCard
              key={i}
              index={i}
              count={count}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              phase={phase}
              picked={pending === i}
              reducedMotion={reducedMotion}
              onPick={() => onPick(i)}
            />
          ))
        )}
      </View>

      <Text style={styles.caption}>
        {phase === 'shuffling'
          ? 'shuffling the cards…'
          : waiting
            ? 'the cards are settling…'
            : phase === 'spread'
              ? 'when you’re ready, choose a card'
              : ' '}
      </Text>
    </View>
  );
}

/** A single face-down card: riffles while shuffling, fans out when spread. */
function DeckCard({
  index,
  count,
  cardWidth,
  cardHeight,
  phase,
  picked,
  reducedMotion,
  onPick,
}: {
  index: number;
  count: number;
  cardWidth: number;
  cardHeight: number;
  phase: Phase;
  picked: boolean;
  reducedMotion?: boolean;
  onPick: () => void;
}) {
  // fanned target slot
  const mid = (count - 1) / 2;
  const gap = cardWidth * 0.62;
  const targetX = (index - mid) * gap;
  const targetRot = (index - mid) * 7;
  const targetY = Math.abs(index - mid) * 10;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      tx.value = withTiming(phase === 'shuffling' ? 0 : targetX, { duration: 260 });
      ty.value = withTiming(phase === 'shuffling' ? 0 : targetY, { duration: 260 });
      rot.value = withTiming(phase === 'shuffling' ? 0 : targetRot, { duration: 260 });
      return;
    }
    if (phase === 'shuffling') {
      // riffle: alternating little jumps + rotation, staggered per card
      const dir = index % 2 === 0 ? 1 : -1;
      tx.value = withDelay(
        index * 60,
        withRepeat(
          withSequence(
            withTiming(dir * 16, { duration: 220, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 220, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
        ),
      );
      ty.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 260 }),
          withTiming(0, { duration: 260 }),
        ),
        -1,
        true,
      );
      rot.value = withRepeat(
        withSequence(
          withTiming(dir * 6, { duration: 240 }),
          withTiming(0, { duration: 240 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(tx);
      cancelAnimation(ty);
      cancelAnimation(rot);
      tx.value = withSpring(targetX, { damping: 16, stiffness: 120 });
      ty.value = withSpring(targetY, { damping: 16, stiffness: 120 });
      rot.value = withSpring(targetRot, { damping: 16, stiffness: 120 });
    }
  }, [phase, reducedMotion]);

  useEffect(() => {
    lift.value = withSpring(picked ? -18 : 0, { damping: 14 });
  }, [picked]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value + lift.value },
      { rotateZ: `${rot.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.card, aStyle]}>
      <Pressable onPress={onPick} disabled={phase !== 'spread'}>
        <CardBack width={cardWidth} height={cardHeight} />
      </Pressable>
    </Animated.View>
  );
}

/** The chosen card, centred, flipping to reveal. */
function RevealCard({
  cardWidth,
  cardHeight,
  front,
  reducedMotion,
  onDone,
}: {
  cardWidth: number;
  cardHeight: number;
  front: React.ReactNode;
  reducedMotion?: boolean;
  onDone?: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 180);
    const d = setTimeout(() => onDone?.(), reducedMotion ? 520 : 1100);
    return () => {
      clearTimeout(t);
      clearTimeout(d);
    };
  }, []);
  return (
    <View style={styles.card}>
      <FlipCard
        width={cardWidth}
        height={cardHeight}
        front={front}
        revealed={revealed}
        reducedMotion={reducedMotion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center' },
  deck: { alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  caption: {
    ...type.small,
    color: colors.textSecondary,
    marginTop: 28,
    fontStyle: 'italic',
  },
});
