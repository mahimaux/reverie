import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { FrostCard } from '../../components/FrostCard';
import { PillButton } from '../../components/PillButton';
import { Screen } from '../../components/Screen';
import { SunBlob } from '../../components/SunBlob';
import { SUPPORT_RESOURCES } from '../../lib/api/safety';
import { useReading } from '../../features/reading/ReadingProvider';
import { colors, radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/typography';

/**
 * Supportive path (TRD §8). When free text signals serious distress we set the
 * reframe aside and offer real support — gently, never alarming.
 */
export default function Safety() {
  const router = useRouter();
  const { reset } = useReading();

  const home = () => {
    reset();
    router.replace('/');
  };

  return (
    <Screen scroll blobs={false}>
      <SunBlob size={240} style={styles.blob} intensity={0.5} />

      <Animated.View entering={FadeInDown.duration(600)} style={{ marginTop: spacing.xxl }}>
        <Text style={styles.title}>Hey. I'm really glad{'\n'}you told me.</Text>
        <Text style={styles.body}>
          What you're carrying sounds heavy, and it matters more than any card I could turn over. So
          I'm going to set the reading aside for now and just be here with you.
        </Text>
        <Text style={styles.body}>
          You don't have to go through this alone. If things feel like too much, please reach out to
          someone who can sit with you properly:
        </Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(300).duration(600)} style={styles.resources}>
        {SUPPORT_RESOURCES.map((r) => (
          <Pressable key={r.label} onPress={() => Linking.openURL(r.href)}>
            <FrostCard padding={18} style={styles.resCard}>
              <Text style={styles.resLabel}>{r.label}</Text>
              <Text style={styles.resDetail}>{r.detail}</Text>
            </FrostCard>
          </Pressable>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.cta}>
        <PillButton label="Okay, take me home" onPress={home} full />
        <Text style={styles.note}>
          Reverie isn't therapy or a crisis service. If you're in immediate danger, please contact
          your local emergency number.
        </Text>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', top: -100, alignSelf: 'center' },
  title: { ...type.display, color: colors.textPrimary },
  body: { ...type.body, color: colors.textSecondary, marginTop: spacing.lg, lineHeight: 24 },
  resources: { marginTop: spacing.xl, gap: spacing.md },
  resCard: { borderRadius: radius.card },
  resLabel: { ...type.bodyMd, color: colors.textPrimary },
  resDetail: { ...type.small, color: colors.textSecondary, marginTop: 4 },
  cta: { marginTop: spacing.xxl },
  note: { ...type.small, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
});
