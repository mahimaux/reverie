import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { FrostCard } from '../components/FrostCard';
import { Screen } from '../components/Screen';
import { Eyebrow } from '../components/bits';
import { SUPPORT_RESOURCES } from '../lib/api/safety';
import { getProfile, saveProfile, wipeAll } from '../lib/storage/repo';
import { colors, radius, spacing } from '../theme/tokens';
import { type } from '../theme/typography';

export default function Settings() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [notif, setNotif] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getProfile().then((p) => {
        setName(p.firstName || '');
        setNotif(p.notificationsOptIn);
      });
    }, []),
  );

  const saveName = async () => {
    await saveProfile({ firstName: name.trim() || undefined });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const toggleNotif = async (v: boolean) => {
    setNotif(v);
    await saveProfile({ notificationsOptIn: v });
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset everything?',
      'This permanently deletes your readings, letters, stickers, and streak from this device. It can’t be undone.',
      [
        { text: 'Keep my data', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: async () => {
            await wipeAll();
            router.replace('/onboarding');
          },
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹ home</Text>
        </Pressable>
        <Eyebrow>Settings</Eyebrow>
      </View>

      <Text style={styles.title}>Settings</Text>

      <FrostCard padding={22} style={styles.section}>
        <Text style={styles.label}>Your first name</Text>
        <Text style={styles.hint}>So letters from future-you feel personal. Optional.</Text>
        <View style={styles.nameRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="your name"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            autoCapitalize="words"
            onSubmitEditing={saveName}
          />
          <Pressable onPress={saveName} style={styles.saveBtn}>
            <Text style={styles.saveTxt}>{savedFlash ? 'saved ✓' : 'save'}</Text>
          </Pressable>
        </View>
      </FrostCard>

      <FrostCard padding={22} style={styles.section}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Gentle daily nudges</Text>
            <Text style={styles.hint}>A soft reminder to check in. Never pushy. (Coming soon.)</Text>
          </View>
          <Switch
            value={notif}
            onValueChange={toggleNotif}
            trackColor={{ false: colors.hairline, true: colors.sunMid }}
            thumbColor={colors.bgIvory}
          />
        </View>
      </FrostCard>

      <FrostCard padding={22} style={styles.section}>
        <Text style={styles.label}>A gentle note</Text>
        <Text style={styles.hint}>
          Reverie is a supportive self-reflection ritual, not therapy, diagnosis, or a crisis
          service. If you're really struggling, these people are here for you:
        </Text>
        {SUPPORT_RESOURCES.map((r) => (
          <Pressable key={r.label} onPress={() => Linking.openURL(r.href)} style={styles.resRow}>
            <Text style={styles.resLabel}>{r.label}</Text>
            <Text style={styles.resDetail}>{r.detail}</Text>
          </Pressable>
        ))}
      </FrostCard>

      <FrostCard padding={22} style={styles.section}>
        <Text style={styles.label}>Privacy</Text>
        <Text style={styles.hint}>
          Everything you write stays on this device. No account, nothing stored on a server.
        </Text>
        <Pressable onPress={confirmReset} style={styles.reset}>
          <Text style={styles.resetTxt}>Reset / delete all my data</Text>
        </Pressable>
      </FrostCard>

      <Text style={styles.version}>Reverie · v1</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  back: { ...type.bodyMd, color: colors.textSecondary },
  title: { ...type.display, color: colors.textPrimary, marginBottom: spacing.lg },
  section: { marginBottom: spacing.md },
  label: { ...type.heading, color: colors.textPrimary },
  hint: { ...type.small, color: colors.textSecondary, marginTop: 6 },
  nameRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  input: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
    backgroundColor: colors.frostStrong,
    borderWidth: 1,
    borderColor: colors.frostBorder,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  saveBtn: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  saveTxt: { ...type.label, color: colors.textOnDark },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resRow: { marginTop: spacing.md },
  resLabel: { ...type.bodyMd, color: colors.textPrimary },
  resDetail: { ...type.small, color: colors.textSecondary, marginTop: 2 },
  reset: { marginTop: spacing.lg },
  resetTxt: { ...type.bodyMd, color: '#B4452F' },
  version: { ...type.small, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
});
