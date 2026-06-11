import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { FrostCard } from '../components/FrostCard';
import { Screen } from '../components/Screen';
import { StickerTile } from '../components/StickerTile';
import { Eyebrow } from '../components/bits';
import { streakSummary } from '../features/streaks/streak';
import { DAILY_STICKERS, MILESTONE_STICKERS, type StickerDef } from '../features/streaks/stickerPool';
import { getStickers } from '../lib/storage/repo';
import type { Sticker } from '../lib/types';
import { colors, radius, spacing } from '../theme/tokens';
import { type } from '../theme/typography';

type Mode = 'all' | 'collected';

interface Entry {
  key: string;
  label: string;
  glyph: string;
  earned?: Sticker;
  milestone?: 7 | 30 | 100;
  hint: string;
}

export default function Stickers() {
  const router = useRouter();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [stats, setStats] = useState({ current: 0, longest: 0 });
  const [mode, setMode] = useState<Mode>('all');
  const [zoom, setZoom] = useState<Entry | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setStickers(await getStickers());
        const s = await streakSummary();
        setStats({ current: s.streak.current, longest: s.streak.longest });
      })();
    }, []),
  );

  // Earned lookup by label (a label is "unlocked" once it's been earned at least once).
  const earnedByLabel = useMemo(() => {
    const m = new Map<string, Sticker>();
    for (const s of stickers) if (!m.has(s.label)) m.set(s.label, s);
    return m;
  }, [stickers]);

  const daily: Entry[] = useMemo(
    () =>
      DAILY_STICKERS.map((d: StickerDef) => ({
        key: `daily-${d.label}`,
        label: d.label,
        glyph: d.glyph,
        earned: earnedByLabel.get(d.label),
        hint: 'Earn this on a future reading. Keep going!',
      })),
    [earnedByLabel],
  );

  const milestones: Entry[] = useMemo(
    () =>
      ([7, 30, 100] as const).map((m) => ({
        key: `m-${m}`,
        label: MILESTONE_STICKERS[m].label,
        glyph: MILESTONE_STICKERS[m].glyph,
        earned: stickers.find((s) => s.milestone === m),
        milestone: m,
        hint: `Unlocks at a ${m} day streak. You're at ${stats.current}.`,
      })),
    [stickers, stats.current],
  );

  const earnedCount = daily.filter((e) => e.earned).length;
  const dailyShown = mode === 'collected' ? daily.filter((e) => e.earned) : daily;
  const milestonesShown = mode === 'collected' ? milestones.filter((e) => e.earned) : milestones;

  const toEntrySticker = (e: Entry): Sticker =>
    e.earned ?? { id: e.key, label: e.label, art: e.glyph, earnedOn: '', milestone: e.milestone };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹ home</Text>
        </Pressable>
        <Eyebrow>Sticker book</Eyebrow>
      </View>

      <Text style={styles.title}>Your collection</Text>

      <View style={styles.statsRow}>
        <FrostCard padding={18} style={styles.stat}>
          <Text style={styles.statNum}>{stats.current}</Text>
          <Text style={styles.statLabel}>current streak</Text>
        </FrostCard>
        <FrostCard padding={18} style={styles.stat}>
          <Text style={styles.statNum}>{stats.longest}</Text>
          <Text style={styles.statLabel}>longest streak</Text>
        </FrostCard>
        <FrostCard padding={18} style={styles.stat}>
          <Text style={styles.statNum}>
            {earnedCount}
            <Text style={styles.statDenom}>/{daily.length}</Text>
          </Text>
          <Text style={styles.statLabel}>charms found</Text>
        </FrostCard>
      </View>

      {/* segmented menu */}
      <View style={styles.segment}>
        {(['all', 'collected'] as Mode[]).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[styles.segBtn, mode === m && styles.segActive]}>
            <Text style={[styles.segTxt, mode === m && styles.segTxtActive]}>
              {m === 'all' ? 'All stickers' : `Collected (${earnedCount})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Daily charms */}
      <Text style={styles.sectionTitle}>Daily charms</Text>
      <Text style={styles.sectionSub}>
        {mode === 'all'
          ? 'One lands each day you complete a reading. The greyed ones are still waiting for you.'
          : 'The little ones you’ve gathered so far.'}
      </Text>
      {dailyShown.length === 0 ? (
        <Text style={styles.empty}>None yet. Finish today’s reading to earn your first. 🤍</Text>
      ) : (
        <View style={styles.grid}>
          {dailyShown.map((e) => (
            <Pressable key={e.key} onPress={() => setZoom(e)}>
              <StickerTile sticker={toEntrySticker(e)} locked={!e.earned} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Milestones */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Milestones</Text>
      <Text style={styles.sectionSub}>Rarer stickers for longer streaks. No pressure, ever.</Text>
      {milestonesShown.length === 0 ? (
        <Text style={styles.empty}>Keep showing up and these will appear.</Text>
      ) : (
        <View style={styles.grid}>
          {milestonesShown.map((e) => (
            <Pressable key={e.key} onPress={() => setZoom(e)}>
              <StickerTile sticker={toEntrySticker(e)} locked={!e.earned} />
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={!!zoom} transparent animationType="fade" onRequestClose={() => setZoom(null)}>
        <Pressable style={styles.backdrop} onPress={() => setZoom(null)}>
          {zoom && (
            <Animated.View entering={FadeIn.duration(250)} style={styles.zoomCard}>
              <StickerTile sticker={toEntrySticker(zoom)} size={180} locked={!zoom.earned} />
              {zoom.earned ? (
                <>
                  <Text style={styles.zoomDate}>
                    earned{' '}
                    {new Date(zoom.earned.earnedOn).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  {zoom.milestone && (
                    <Text style={styles.zoomMilestone}>milestone · {zoom.milestone} days</Text>
                  )}
                </>
              ) : (
                <Text style={styles.zoomHint}>{zoom.hint}</Text>
              )}
            </Animated.View>
          )}
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  back: { ...type.bodyMd, color: colors.textSecondary },
  title: { ...type.display, color: colors.textPrimary, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { ...type.title, color: colors.textPrimary },
  statDenom: { ...type.body, color: colors.textSecondary },
  statLabel: { ...type.micro, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },

  segment: {
    flexDirection: 'row',
    backgroundColor: colors.frostStrong,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.xl,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  segActive: { backgroundColor: colors.surfaceDark },
  segTxt: { ...type.label, color: colors.textSecondary },
  segTxtActive: { color: colors.textOnDark },

  sectionTitle: { ...type.title, color: colors.textPrimary, marginBottom: 4 },
  sectionSub: { ...type.small, color: colors.textSecondary, marginBottom: spacing.lg },
  empty: { ...type.body, color: colors.textSecondary, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.xl },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18,17,16,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomCard: {
    backgroundColor: colors.bgIvory,
    borderRadius: 32,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: 14,
    marginHorizontal: spacing.xl,
  },
  zoomDate: { ...type.small, color: colors.textSecondary },
  zoomMilestone: { ...type.micro, color: colors.gold, textTransform: 'uppercase' },
  zoomHint: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
});
