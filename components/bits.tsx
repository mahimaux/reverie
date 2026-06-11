/** Small shared UI pieces used across the reading flow. */
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius } from '../theme/tokens';
import { type } from '../theme/typography';

/** Uppercase eyebrow label with a small sun dot. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.eyebrowRow}>
      <View style={styles.dot} />
      <Text style={styles.eyebrow}>{children}</Text>
    </View>
  );
}

/** Three dots showing chapter progress (1, 2, 3). */
export function ChapterProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View style={styles.progress}>
      {[1, 2, 3].map((n) => (
        <View key={n} style={[styles.pdot, n === current && styles.pdotActive, n < current && styles.pdotDone]} />
      ))}
    </View>
  );
}

/** A generated short-answer question with its input (PRD §5.2 / §5.3). */
export function QuestionInput({
  text,
  placeholder,
  value,
  onChangeText,
}: {
  text: string;
  placeholder: string;
  value: string;
  onChangeText: (s: string) => void;
}) {
  return (
    <View style={styles.q}>
      <Text style={styles.qText}>{text}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={styles.qInput}
        multiline
      />
    </View>
  );
}

/** Quality thumbs on generated content (PRD §12 / TRD metrics). Local only. */
export function ThumbsFeedback() {
  const [v, setV] = useState<null | 'up' | 'down'>(null);
  const tap = (val: 'up' | 'down') => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setV(val);
  };
  return (
    <View style={styles.thumbs}>
      <Text style={styles.thumbsLabel}>did this land?</Text>
      <Pressable onPress={() => tap('up')} hitSlop={8}>
        <Text style={[styles.thumb, v === 'up' && styles.thumbOn]}>👍</Text>
      </Pressable>
      <Pressable onPress={() => tap('down')} hitSlop={8}>
        <Text style={[styles.thumb, v === 'down' && styles.thumbOn]}>👎</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.sunFrom },
  eyebrow: { ...type.micro, color: colors.textSecondary, textTransform: 'uppercase' },

  progress: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  pdot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.hairline },
  pdotActive: { width: 22, backgroundColor: colors.surfaceDark },
  pdotDone: { backgroundColor: colors.sunMid },

  q: { gap: 10 },
  qText: { ...type.heading, color: colors.textPrimary },
  qInput: {
    ...type.body,
    color: colors.textPrimary,
    backgroundColor: colors.frostStrong,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },

  thumbs: { flexDirection: 'row', alignItems: 'center', gap: 14, justifyContent: 'center' },
  thumbsLabel: { ...type.small, color: colors.textSecondary },
  thumb: { fontSize: 20, opacity: 0.4 },
  thumbOn: { opacity: 1 },
});
