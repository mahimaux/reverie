/**
 * 3D flip card (TRD §9, §3.2). Face-down → face-up flip on the tapped card,
 * revealing the SAME prepared content regardless of which card was chosen.
 * rotateY 0→180° with perspective; back-face hidden; spring easing.
 * Honours reduced-motion with a cross-fade fallback.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { radius, shadowCard } from '../theme/tokens';
import { CardBack } from './CardBack';

interface Props {
  width: number;
  height: number;
  front: React.ReactNode;
  revealed: boolean; // parent flips this true once the AI result is ready + card tapped
  onTap?: () => void;
  reducedMotion?: boolean;
}

export function FlipCard({ width, height, front, revealed, onTap, reducedMotion }: Props) {
  const progress = useSharedValue(0); // 0 = back, 1 = front

  useEffect(() => {
    if (revealed) {
      progress.value = reducedMotion
        ? withTiming(1, { duration: 240 })
        : withTiming(1, { duration: 620, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
    }
  }, [revealed, reducedMotion, progress]);

  const backStyle = useAnimatedStyle(() => {
    const rotateY = reducedMotion ? 0 : interpolate(progress.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity: reducedMotion ? 1 - progress.value : 1,
      backfaceVisibility: 'hidden',
    };
  });

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = reducedMotion ? 0 : interpolate(progress.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity: reducedMotion ? progress.value : 1,
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <Pressable onPress={onTap} disabled={revealed} accessibilityRole="button">
      <View style={{ width, height }}>
        <Animated.View style={[styles.face, backStyle]}>
          <CardBack width={width} height={height} />
        </Animated.View>
        <Animated.View style={[styles.face, styles.frontFace, { width, height }, frontStyle]}>
          {front}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: radius.md,
    ...shadowCard,
  },
  frontFace: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
