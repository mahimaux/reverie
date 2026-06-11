import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { FeelingChip } from '../../components/FeelingChip';
import { MoodSlider } from '../../components/MoodSlider';
import { PillButton } from '../../components/PillButton';
import { SunBlob } from '../../components/SunBlob';
import { ChapterProgress, Eyebrow } from '../../components/bits';
import { useReading } from '../../features/reading/ReadingProvider';
import { colors, radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/typography';

const FEELINGS = [
  'Not enough',
  'Behind in life',
  'Not pretty enough',
  'Not successful enough',
  'Less talented',
  'Invisible',
  'Falling behind',
  'Low confidence',
  'Like an impostor',
  'Jealous',
  'Stuck',
  'Unseen',
];

export default function FeelingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { start } = useReading();

  const [selected, setSelected] = useState<string[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const [situation, setSituation] = useState('');
  const [mood, setMood] = useState(35);
  const [showMood, setShowMood] = useState(false);

  const toggle = (f: string) => {
    setSelected((cur) => {
      if (cur.includes(f)) return cur.filter((x) => x !== f);
      if (cur.length >= 3) return cur; // cap at 3 (PRD §5.1)
      return [...cur, f];
    });
  };

  const feelings = [...selected, ...(custom.trim() ? [custom.trim()] : [])];
  const canStart = feelings.length >= 1 && situation.trim().length >= 3;

  const onStart = () => {
    if (!canStart) return;
    start(feelings.slice(0, 3), situation.trim(), showMood ? mood : undefined);
    router.push('/reading/chapter1');
  };

  return (
    <View style={styles.root}>
      <SunBlob size={360} style={styles.blob} intensity={0.6} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Text style={styles.back}>‹ back</Text>
            </Pressable>
            <ChapterProgress current={1} />
          </View>

          <Animated.View entering={FadeInDown.duration(450)}>
            <Eyebrow>Chapter 1 · Behind the scenes</Eyebrow>
            <Text style={styles.title}>What's the feeling?</Text>
            <Text style={styles.sub}>Pick up to three. There's no wrong answer here.</Text>
          </Animated.View>

          <View style={styles.chips}>
            {FEELINGS.map((f) => (
              <FeelingChip key={f} label={f} selected={selected.includes(f)} onPress={() => toggle(f)} />
            ))}
            <FeelingChip
              label="something else…"
              selected={customOpen}
              onPress={() => setCustomOpen((v) => !v)}
            />
          </View>

          {customOpen && (
            <Animated.View entering={FadeIn.duration(300)}>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                placeholder="name it in a word or two"
                placeholderTextColor={colors.textTertiary}
                style={styles.customInput}
              />
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.block}>
            <Text style={styles.qTitle}>What happened?</Text>
            <Text style={styles.sub}>Who are you comparing yourself to?</Text>
            <TextInput
              value={situation}
              onChangeText={setSituation}
              placeholder="e.g. An old friend just announced she bought a house and I'm still renting a tiny room. I felt like I'm so far behind…"
              placeholderTextColor={colors.textTertiary}
              style={styles.situation}
              multiline
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.moodBlock}>
            {!showMood ? (
              <Pressable onPress={() => setShowMood(true)}>
                <Text style={styles.moodToggle}>+ note how you feel right now (optional)</Text>
              </Pressable>
            ) : (
              <View style={{ gap: 12 }}>
                <Text style={styles.qTitle}>How are you feeling, honestly?</Text>
                <MoodSlider value={mood} onChange={setMood} />
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <PillButton label="Draw your cards" onPress={onStart} disabled={!canStart} full />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgIvory },
  blob: { position: 'absolute', top: -160, right: -120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  back: { ...type.bodyMd, color: colors.textSecondary },
  title: { ...type.display, color: colors.textPrimary, marginTop: 14 },
  sub: { ...type.body, color: colors.textSecondary, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.lg },
  customInput: {
    ...type.body,
    color: colors.textPrimary,
    backgroundColor: colors.frostStrong,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  block: { marginTop: spacing.xxl },
  qTitle: { ...type.title, color: colors.textPrimary },
  situation: {
    ...type.body,
    color: colors.textPrimary,
    backgroundColor: colors.frostStrong,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 130,
    marginTop: 14,
    textAlignVertical: 'top',
  },
  moodBlock: { marginTop: spacing.xl },
  moodToggle: { ...type.bodyMd, color: colors.sunFrom },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(242,236,228,0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
});
