import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { PillButton } from '../components/PillButton';
import { Screen } from '../components/Screen';
import { SunBlob } from '../components/SunBlob';
import { saveProfile } from '../lib/storage/repo';
import { colors, radius, spacing } from '../theme/tokens';
import { type } from '../theme/typography';

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState('');

  const begin = async () => {
    await saveProfile({ firstName: name.trim() || undefined, onboarded: true });
    router.replace('/');
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={FadeIn.duration(700)} style={styles.sunWrap}>
          <SunBlob size={200} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(150).duration(600)} style={styles.title}>
          Hi. I'm so glad{'\n'}you're here.
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(300).duration(600)} style={styles.body}>
          When you're caught comparing yourself to someone and feeling small, open me. We'll sit with
          it for a few minutes, draw a card or two, and I'll remind you of your own footing.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(450).duration(600)}>
          <Text style={styles.label}>What should I call you? (optional)</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="your first name"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={begin}
          />
          <Text style={styles.note}>
            Just so my letters to you feel personal. It stays on your device, no account, nothing
            sent anywhere.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.cta}>
          <PillButton label={name.trim() ? `Let's begin, ${name.trim()}` : "Let's begin"} onPress={begin} full />
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sunWrap: { alignItems: 'center', marginTop: spacing.xl },
  title: { ...type.display, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md },
  body: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  label: { ...type.bodyMd, color: colors.textPrimary, marginBottom: 10 },
  input: {
    ...type.body,
    color: colors.textPrimary,
    backgroundColor: colors.frostStrong,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  note: { ...type.small, color: colors.textTertiary, marginTop: 10 },
  cta: { marginTop: spacing.xxl },
});
