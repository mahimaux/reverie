/**
 * One-tap mood check (PRD §12 "relief" metric). A single draggable slider,
 * not a survey. Returns 0..100. Warm sun-gradient fill.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, radius, sunGradient } from '../theme/tokens';
import { type } from '../theme/typography';

interface Props {
  value: number; // 0..100
  onChange: (v: number) => void;
}

const TRACK_H = 14;
const THUMB = 30;

export function MoodSlider({ value, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue((value / 100) * 0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    x.value = (value / 100) * w;
  };

  const setVal = (px: number) => {
    if (width <= 0) return;
    const clamped = Math.max(0, Math.min(width, px));
    x.value = clamped;
    onChange(Math.round((clamped / width) * 100));
  };

  const pan = Gesture.Pan()
    .onBegin((e) => runOnJS(setVal)(e.x))
    .onChange((e) => runOnJS(setVal)(e.x));
  const tap = Gesture.Tap().onEnd((e) => runOnJS(setVal)(e.x));
  const gesture = Gesture.Simultaneous(pan, tap);

  const fillStyle = useAnimatedStyle(() => ({ width: x.value + THUMB / 2 }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - THUMB / 2 }] }));

  return (
    <View>
      <GestureDetector gesture={gesture}>
        <View style={styles.hit} onLayout={onLayout}>
          <View style={styles.track} />
          <Animated.View style={[styles.fillWrap, fillStyle]}>
            <LinearGradient
              colors={[...sunGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fill}
            />
          </Animated.View>
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>
      <View style={styles.legend}>
        <Text style={styles.legendTxt}>low</Text>
        <Text style={styles.legendTxt}>steady</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: THUMB, justifyContent: 'center' },
  track: {
    height: TRACK_H,
    borderRadius: radius.pill,
    backgroundColor: colors.frostStrong,
    borderWidth: 1,
    borderColor: colors.frostBorder,
  },
  fillWrap: {
    position: 'absolute',
    height: TRACK_H,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: { flex: 1 },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.surfaceDark,
    borderWidth: 3,
    borderColor: colors.bgIvory,
  },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendTxt: { ...type.micro, color: colors.textSecondary },
});
