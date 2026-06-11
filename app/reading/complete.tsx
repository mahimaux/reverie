import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MoodSlider } from '../../components/MoodSlider';
import { PillButton } from '../../components/PillButton';
import { Screen } from '../../components/Screen';
import { StickerTile } from '../../components/StickerTile';
import { Eyebrow } from '../../components/bits';
import { useReading } from '../../features/reading/ReadingProvider';
import { awardForToday } from '../../features/streaks/streak';
import { saveReading } from '../../lib/storage/repo';
import type { Sticker } from '../../lib/types';
import { colors, spacing } from '../../theme/tokens';
import { type } from '../../theme/typography';

export default function Complete() {
  const router = useRouter();
  const { reading, markComplete, setMoodAfter, reset } = useReading();

  const [sticker, setSticker] = useState<Sticker | null>(null);
  const [streakMsg, setStreakMsg] = useState('');
  const [mood, setMood] = useState(70);
  const [moodSaved, setMoodSaved] = useState(false);
  const ran = useRef(false);
  const showMood = !!reading && reading.moodBefore !== undefined;

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const done = markComplete();
      if (done) await saveReading(done);
      const award = await awardForToday();
      setStreakMsg(award.message);
      if (award.sticker) setSticker(award.sticker);
    })();
  }, []);

  const finish = async (goLetters?: boolean) => {
    if (showMood && !moodSaved && reading) {
      setMoodAfter(mood);
      await saveReading({ ...reading, completedAt: new Date().toISOString(), moodAfter: mood });
      setMoodSaved(true);
    }
    reset();
    if (goLetters) router.replace('/letters');
    else router.replace('/');
  };

  return (
    <Screen scroll>
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Eyebrow>Reading complete</Eyebrow>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(150).duration(600)} style={styles.title}>
          That's the whole reading.{'\n'}You showed up for you.
        </Animated.Text>

        {sticker && (
          <Animated.View entering={FadeIn.delay(450)} style={styles.stickerWrap}>
            <StickerTile sticker={sticker} size={130} animateIn />
            <Text style={styles.earned}>today's sticker · earned</Text>
          </Animated.View>
        )}

        {!!streakMsg && (
          <Animated.Text entering={FadeInDown.delay(650).duration(500)} style={styles.streak}>
            {streakMsg}
          </Animated.Text>
        )}

        {showMood && (
          <Animated.View entering={FadeInDown.delay(800).duration(500)} style={styles.moodBlock}>
            <Text style={styles.moodQ}>How are you feeling now?</Text>
            <MoodSlider value={mood} onChange={setMood} />
          </Animated.View>
        )}
      </View>

      <Animated.View entering={FadeInDown.delay(950).duration(500)} style={styles.cta}>
        <PillButton label="Read my letter" onPress={() => finish(true)} full />
        <PillButton label="Back home" variant="light" arrow={false} onPress={() => finish(false)} full
          style={{ marginTop: spacing.sm, justifyContent: 'center' }} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginTop: spacing.xl },
  title: { ...type.display, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md },
  stickerWrap: { alignItems: 'center', marginTop: spacing.xxl, gap: 12 },
  earned: { ...type.micro, color: colors.textSecondary, textTransform: 'uppercase' },
  streak: {
    ...type.serifBody,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  moodBlock: { width: '100%', marginTop: spacing.xxl, gap: spacing.md },
  moodQ: { ...type.title, color: colors.textPrimary, textAlign: 'center' },
  cta: { marginTop: spacing.xxl },
});
