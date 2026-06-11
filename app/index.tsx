import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FrostCard } from '../components/FrostCard';
import { PillButton } from '../components/PillButton';
import { Screen } from '../components/Screen';
import { Eyebrow } from '../components/bits';
import { streakSummary } from '../features/streaks/streak';
import { getProfile } from '../lib/storage/repo';
import { colors, radius, spacing } from '../theme/tokens';
import { type } from '../theme/typography';

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState<string | undefined>();
  const [summary, setSummary] = useState({ current: 0, longest: 0, count: 0, earnedToday: false });
  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const profile = await getProfile();
        if (!profile.onboarded) {
          router.replace('/onboarding');
          return;
        }
        const s = await streakSummary();
        if (active) {
          setName(profile.firstName);
          setSummary({
            current: s.streak.current,
            longest: s.streak.longest,
            count: s.count,
            earnedToday: s.earnedToday,
          });
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Screen scroll>
      <View style={styles.topRow}>
        <Eyebrow>Reverie</Eyebrow>
        <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
          <Text style={styles.gear}>⚙</Text>
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={styles.hello}>
          {greeting}
          {name ? `,\n${name}` : ''}
        </Text>
        <Text style={styles.date}>
          {weekday} {ordinal(now.getDate())}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)}>
        <FrostCard style={styles.hero} padding={26}>
          <Text style={styles.heroEyebrow}>today's reading</Text>
          <Text style={styles.heroTitle}>
            Feeling small{'\n'}next to someone?
          </Text>
          <Text style={styles.heroBody}>
            Tell me what stung. We'll draw a card, and it'll tell you what you needed to hear.
          </Text>
          <PillButton
            label="Start today's reading"
            onPress={() => router.push('/reading/feelings')}
            style={{ marginTop: spacing.lg }}
          />
        </FrostCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.statsRow}>
        <Pressable style={styles.statWrap} onPress={() => router.push('/stickers')}>
          <FrostCard padding={18} style={styles.stat}>
            <Text style={styles.statNum}>{summary.current}</Text>
            <Text style={styles.statLabel}>day streak</Text>
            <Text style={styles.statSub}>
              {summary.earnedToday ? "today's sticker earned ✦" : 'no sticker yet today'}
            </Text>
          </FrostCard>
        </Pressable>
        <Pressable style={styles.statWrap} onPress={() => router.push('/stickers')}>
          <FrostCard padding={18} style={styles.stat}>
            <Text style={styles.statNum}>{summary.count}</Text>
            <Text style={styles.statLabel}>stickers</Text>
            <Text style={styles.statSub}>in your book →</Text>
          </FrostCard>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(320).duration(500)}>
        <Pressable onPress={() => router.push('/letters')}>
          <View style={styles.darkCard}>
            <View>
              <Text style={styles.darkEyebrow}>Your letters</Text>
              <Text style={styles.darkTitle}>Notes from future you</Text>
            </View>
            <Text style={styles.darkArrow}>→</Text>
          </View>
        </Pressable>
      </Animated.View>

      <Text style={styles.disclaimer}>
        Reverie is a gentle self-reflection ritual, not therapy or a crisis service.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  gear: { fontSize: 22, color: colors.textSecondary },
  hello: { ...type.hero, color: colors.textPrimary },
  date: { ...type.title, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  hero: {},
  heroEyebrow: { ...type.micro, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 10 },
  heroTitle: { ...type.serifTitle, color: colors.textPrimary, marginBottom: 12 },
  heroBody: { ...type.body, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statWrap: { flex: 1 },
  stat: { gap: 2 },
  statNum: { ...type.display, color: colors.textPrimary },
  statLabel: { ...type.bodyMd, color: colors.textPrimary },
  statSub: { ...type.small, color: colors.textSecondary, marginTop: 4 },
  darkCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    padding: 24,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkEyebrow: { ...type.micro, color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 6 },
  darkTitle: { ...type.title, color: colors.textOnDark },
  darkArrow: { color: colors.textOnDark, fontSize: 22 },
  disclaimer: { ...type.small, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xl },
});
