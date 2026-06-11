/**
 * Receipt-printer reveal (TRD §9, third signature animation). A thermal printer
 * head sits at the top; cream paper feeds downward and the letter "prints" line
 * by line. Honours reduced-motion (all lines fade in at once).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, shadowSoft } from '../theme/tokens';
import { type } from '../theme/typography';

interface Props {
  text: string;
  reducedMotion?: boolean;
  onDone?: () => void;
}

const LINE_MS = 420;

export function PrinterReveal({ text, reducedMotion, onDone }: Props) {
  // Split into printable rows; keep blank lines as spacers.
  const lines = useMemo(() => text.replace(/\r/g, '').split('\n'), [text]);
  const [visible, setVisible] = useState(reducedMotion ? lines.length : 0);
  const feed = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(() => onDone?.(), 400);
      return () => clearTimeout(t);
    }
    feed.value = withTiming(1, { duration: 500 });
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisible(i);
      if (i >= lines.length) {
        clearInterval(id);
        setTimeout(() => onDone?.(), 600);
      }
    }, LINE_MS);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const paperStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - feed.value) * -12 }],
    opacity: 0.4 + feed.value * 0.6,
  }));

  return (
    <View style={styles.wrap}>
      {/* printer head */}
      <View style={styles.printer}>
        <View style={styles.slot} />
        <Text style={styles.printerLabel}>R E V E R I E   ·   to: you</Text>
      </View>

      {/* paper */}
      <Animated.View style={[styles.paper, paperStyle]}>
        <Serrated />
        <View style={styles.paperBody}>
          {lines.map((line, i) =>
            i < visible ? (
              <Animated.Text
                key={i}
                entering={reducedMotion ? FadeIn.duration(300) : FadeInDown.duration(320)}
                style={[styles.line, line.trim() === '' && styles.spacer]}
              >
                {line === '' ? ' ' : line}
              </Animated.Text>
            ) : null,
          )}
        </View>
        <Serrated flip />
      </Animated.View>
    </View>
  );
}

/** Zig-zag torn edge for the receipt paper. */
function Serrated({ flip }: { flip?: boolean }) {
  const teeth = Array.from({ length: 18 });
  return (
    <View style={[styles.serrated, flip && styles.serratedFlip]}>
      {teeth.map((_, i) => (
        <View key={i} style={styles.tooth} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  printer: {
    width: '92%',
    height: 54,
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    justifyContent: 'center',
    paddingHorizontal: 20,
    ...shadowSoft,
    zIndex: 2,
  },
  slot: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    width: '70%',
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  printerLabel: {
    ...type.micro,
    color: colors.textTertiary,
    letterSpacing: 2,
  },
  paper: {
    width: '86%',
    marginTop: -2,
    backgroundColor: colors.cardCream,
    ...shadowSoft,
  },
  paperBody: { paddingHorizontal: 22, paddingVertical: 10, backgroundColor: colors.cardCream },
  line: { ...type.serifBody, color: colors.textPrimary },
  spacer: { height: 10, lineHeight: 10 },
  serrated: { flexDirection: 'row', height: 8, overflow: 'hidden', backgroundColor: colors.cardCream },
  serratedFlip: { transform: [{ rotate: '180deg' }] },
  tooth: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.bgIvory,
  },
});
