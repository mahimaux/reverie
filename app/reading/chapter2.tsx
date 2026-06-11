import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { CardFace } from '../../components/CardFace';
import { PillButton } from '../../components/PillButton';
import { Screen } from '../../components/Screen';
import { ShuffleDeck } from '../../components/ShuffleDeck';
import { ChapterProgress, Eyebrow, QuestionInput, ThumbsFeedback } from '../../components/bits';
import { useReading } from '../../features/reading/ReadingProvider';
import { getAffirmations, getSuperpowerQuestions } from '../../lib/api/client';
import { useReducedMotion } from '../../lib/motion/reducedMotion';
import type { ChapterTwoResult, GeneratedQuestion } from '../../lib/types';
import { colors, radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/typography';

type Phase = 'questions' | 'draw' | 'reveal';

export default function ChapterTwo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { reading, setSuperpowerQA, setChapterTwo } = useReading();

  const [phase, setPhase] = useState<Phase>('questions');
  const [questions, setQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ChapterTwoResult | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    if (!reading) {
      router.replace('/reading/feelings');
      return;
    }
    getSuperpowerQuestions(reading.context).then(setQuestions);
  }, []);

  if (!reading) return null;

  const answered = questions?.filter((q) => (answers[q.id] || '').trim().length > 0) ?? [];
  const canDraw = (questions?.length ?? 0) > 0 && answered.length >= 1;

  const onDraw = () => {
    if (!questions) return;
    const qa = questions.map((q) => ({ q: q.text, a: (answers[q.id] || '').trim() }));
    setSuperpowerQA(qa);
    setPhase('draw');
    getAffirmations({ ...reading.context, superpowerQA: qa }).then((r) => {
      setResult(r);
      setChapterTwo(r);
    });
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen scroll padTop>
          <View style={styles.header}>
            <Eyebrow>Chapter 2 · Your superpower</Eyebrow>
            <ChapterProgress current={2} />
          </View>

          {phase === 'questions' && (
            <View>
              <Animated.View entering={FadeInDown.duration(450)}>
                <Text style={styles.title}>Let's look at you for a sec</Text>
                <Text style={styles.sub}>
                  A few quick ones, short answers are perfect. This is how the cards get to know your
                  quiet strengths.
                </Text>
              </Animated.View>

              {!questions ? (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.sunFrom} />
                  <Text style={styles.loadingTxt}>reading the moment…</Text>
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

          {phase === 'draw' && (
            <View style={styles.deckArea}>
              <Text style={styles.prompt}>Three cards. Each one holds something true about you.</Text>
              <ShuffleDeck
                count={3}
                front={<CardFace width={140} height={210} word="you" />}
                ready={result !== null}
                reducedMotion={reduced}
                onRevealed={() => setPhase('reveal')}
              />
            </View>
          )}

          {phase === 'reveal' && (
            <Animated.View entering={FadeInDown.duration(500)} style={{ gap: spacing.md }}>
              <Text style={styles.revealTitle}>Three reminders, just for you</Text>
              {result?.affirmations.map((a, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(i * 150).duration(450)}
                  style={styles.affCard}
                >
                  <Text style={styles.affNum}>{['✦', '☾', '✸'][i]}</Text>
                  <Text style={styles.affText}>{a}</Text>
                </Animated.View>
              ))}
              <ThumbsFeedback />
              <PillButton
                label="One more"
                onPress={() => router.push('/reading/chapter3')}
                full
                style={{ marginTop: spacing.sm }}
              />
              <View style={{ height: insets.bottom }} />
            </Animated.View>
          )}
        </Screen>
      </KeyboardAvoidingView>

      {phase === 'questions' && questions && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <PillButton label="Draw your cards" onPress={onDraw} disabled={!canDraw} full />
        </View>
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
  deckArea: { alignItems: 'center', marginTop: spacing.lg, gap: spacing.xxl },
  prompt: { ...type.serifBody, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg },
  revealTitle: { ...type.title, color: colors.textPrimary, marginBottom: spacing.sm },
  affCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: colors.frostStrong,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    borderRadius: radius.card,
    padding: 20,
  },
  affNum: { color: colors.sunFrom, fontSize: 20 },
  affText: { ...type.serifBody, color: colors.textPrimary, flex: 1 },
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
