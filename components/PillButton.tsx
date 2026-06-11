/**
 * Pill button (TRD §10 components): dark fill, cream text, a small arrow —
 * exactly the CTA from the reference image. Variants: solid (dark), light
 * (frosted), and `icon` (the round dark arrow puck).
 */
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, shadowSoft } from '../theme/tokens';
import { type } from '../theme/typography';

type Variant = 'solid' | 'light' | 'ghost';

interface Props {
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  arrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PillButton({
  label,
  onPress,
  variant = 'solid',
  arrow = true,
  loading,
  disabled,
  style,
  full,
}: Props) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDark = variant === 'solid';
  const textColor = isDark ? colors.textOnDark : colors.textPrimary;

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    onPress?.();
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => (scale.value = withSpring(0.96, { damping: 18 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14 }))}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        full && styles.full,
        variant === 'solid' && styles.solid,
        variant === 'light' && styles.light,
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        aStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {!!label && <Text style={[type.bodyMd, { color: textColor }]}>{label}</Text>}
          {arrow && (
            <View style={[styles.arrowWrap, isDark ? styles.arrowOnDark : styles.arrowOnLight]}>
              <Text style={[styles.arrowGlyph, { color: isDark ? colors.surfaceDark : colors.textOnDark }]}>
                →
              </Text>
            </View>
          )}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  full: { alignSelf: 'stretch' },
  solid: { backgroundColor: colors.surfaceDark, ...shadowSoft },
  light: {
    backgroundColor: colors.frostStrong,
    borderWidth: 1,
    borderColor: colors.frostBorder,
  },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: 8 },
  disabled: { opacity: 0.45 },
  arrowWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOnDark: { backgroundColor: colors.bgIvory },
  arrowOnLight: { backgroundColor: colors.surfaceDark },
  arrowGlyph: { fontSize: 14, fontWeight: '600', marginTop: -1 },
});
