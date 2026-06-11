import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { PillButton } from '../../components/PillButton';
import { PrinterReveal } from '../../components/PrinterReveal';
import { Screen } from '../../components/Screen';
import { ChapterProgress, Eyebrow, QuestionInput } from '../../components/bits';
import { useReading } from '../../features/reading/ReadingProvider';
import { getLetter, getLetterQuestions } from '../../lib/api/client';
import { useReducedMotion } from '../../lib/motion/reducedMotion';
import { getProfile } from '../../lib/storage/repo';
import type { GeneratedQuestion } from '../../lib/types';
import { colors, spacing } from '../../theme/tokens';
import { type } from '../../theme/typography';

type Phase = 'questions' | 'printing' | 'done';

export default function ChapterThree() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { reading, setLetterQA, setLetter } = useReading();

  const [phase, setPhase] = useState<Phase>('questions');
  const [questions, setQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [letter, setLetterText] = useState<string | null>(null);
  const [printed, setPrinted] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    if (!reading) {
      router.replace('/reading/feelings');
      return;
    }
    getLetterQuestions(reading.context).then(setQuestions);
  }, []);

  if (!reading) return null;

  const answered = questions?.filter((q) => (answers[q.id] || '').trim().length > 0) ?? [];
  const canPrint = (questions?.length ?? 0) > 0 && answered.length >= 1;

  const onPrint = async () => {
    if (!questions) return;
    const qa = questions.map((q) => ({ q: q.text, a: (answers[q.id] || '').trim() }));
    setLetterQA(qa);
    setPhase('printing');
    const profile = await getProfile();
    const res = await getLetter({ ...reading.context, letterQA: qa }, profile.firstName);
    setLetterText(res.letter);
    setLetter(res);
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen scroll padTop>
          <View style={styles.header}>
            <Eyebrow>Chapter 3 · Letter from future you</Eyebrow>
            <ChapterProgress current={3} />
          </View>

          {phase === 'questions' && (
            <View>
              <Animated.View entering={FadeInDown.duration(450)}>
                <Text style={styles.title}>One letter, from later</Text>
                <Text style={styles.sub}>
                  Future-you wants a word. Answer a few quick things and they'll write back.
                </Text>
              </Animated.View>

              {!questions ? (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.sunFrom} />
                  <Text style={styles.loadingTxt}>finding the right questions…</Text>
                </View>
              ) : (
                <Animated.View entering={FadeIn.duration(400)} style={styles.questions}>
                  {questions.map((q) => (
                    <QuestionInput
                      key={q.id}
                      text={q.text}
                      placeholder={q.placeholder}
                      value={answers[q.id] || ''}
                      onChangeText={(s) => setAnswers((a) => ({ ...a, [q.id]: s }))}
                    />
                  ))}
                </Animated.View>
              )}
              <View style={{ height: 100 }} />
            </View>
          )}

          {phase === 'printing' && (
            <View style={styles.printArea}>
              {!letter ? (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.sunFrom} />
                  <Text style={styles.loadingTxt}>the printer is warming up…</Text>
                </View>
              ) : (
                <PrinterReveal text={letter} reducedMotion={reduced} onDone={() => setPrinted(true)} />
              )}
            </View>
          )}
        </Screen>
      </KeyboardAvoidingView>

      {phase === 'questions' && questions && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <PillButton label="Print my letter" onPress={onPrint} disabled={!canPrint} full />
        </View>
      )}

      {phase === 'printing' && printed && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <PillButton label="Seal & finish" onPress={() => router.replace('/reading/complete')} full />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgIvory },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  title: { ...type.display, color: colors.textPrimary },
  sub: { ...type.body, color: colors.textSecondary, marginTop: 8, marginBottom: spacing.xl },
  loading: { alignItems: 'center', gap: 12, marginTop: spacing.xxl },
  loadingTxt: { ...type.small, color: colors.textSecondary, fontStyle: 'italic' },
  questions: { gap: spacing.xl },
  printArea: { marginTop: spacing.md },
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
