/**
 * Local-first document repository (TRD §4, §8: on-device by default, no account).
 * Uses AsyncStorage as a small JSON key-value store. Swappable for MMKV/SQLite
 * later — all access goes through this module.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Reading, Sticker, StreakState, UserProfile } from '../types';

const KEYS = {
  readings: 'reverie:readings',
  stickers: 'reverie:stickers',
  streak: 'reverie:streak',
  profile: 'reverie:profile',
  deviceId: 'reverie:deviceId',
} as const;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ---- Readings & letters ----
export const getReadings = () => readJSON<Reading[]>(KEYS.readings, []);
export async function saveReading(reading: Reading): Promise<void> {
  const all = await getReadings();
  const idx = all.findIndex((r) => r.context.id === reading.context.id);
  if (idx >= 0) all[idx] = reading;
  else all.unshift(reading);
  await writeJSON(KEYS.readings, all);
}

// ---- Stickers ----
export const getStickers = () => readJSON<Sticker[]>(KEYS.stickers, []);
export async function addSticker(sticker: Sticker): Promise<void> {
  const all = await getStickers();
  all.unshift(sticker);
  await writeJSON(KEYS.stickers, all);
}

// ---- Streak ----
const DEFAULT_STREAK: StreakState = { current: 0, longest: 0, lastEarnedDate: null };
export const getStreak = () => readJSON<StreakState>(KEYS.streak, DEFAULT_STREAK);
export const saveStreak = (s: StreakState) => writeJSON(KEYS.streak, s);

// ---- Profile ----
const DEFAULT_PROFILE: UserProfile = {
  notificationsOptIn: false,
  onboarded: false,
  createdAt: new Date().toISOString(),
};
export const getProfile = () => readJSON<UserProfile>(KEYS.profile, DEFAULT_PROFILE);
export async function saveProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getProfile();
  const next = { ...current, ...patch };
  await writeJSON(KEYS.profile, next);
  return next;
}

// ---- Anonymous device id (for backend rate limiting without accounts) ----
let cachedDeviceId: string | null = null;
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  let id = await AsyncStorage.getItem(KEYS.deviceId);
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem(KEYS.deviceId, id);
  }
  cachedDeviceId = id;
  return id;
}

// ---- Data controls (TRD §8: reset / delete all) ----
export async function wipeAll(): Promise<void> {
  // Keep the deviceId so rate-limit identity is stable across a local reset.
  await AsyncStorage.multiRemove([KEYS.readings, KEYS.stickers, KEYS.streak, KEYS.profile]);
}
