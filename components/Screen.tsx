/**
 * Standard screen wrapper: warm ivory background with two organic sun blobs
 * bleeding in from the edges (per the reference image), plus safe-area padding.
 */
import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/tokens';
import { SunBlob } from './SunBlob';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  blobs?: boolean;
  padTop?: boolean;
}

export function Screen({ children, scroll, contentStyle, blobs = true, padTop = true }: Props) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: padTop ? insets.top + spacing.sm : 0,
    paddingBottom: insets.bottom + spacing.lg,
    paddingHorizontal: spacing.lg,
  };

  const Body = scroll ? (
    <ScrollView
      contentContainerStyle={[pad, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, pad, contentStyle]}>{children}</View>
  );

  return (
    <View style={styles.root}>
      {blobs && (
        <>
          <SunBlob size={420} style={styles.blobTop} intensity={0.75} />
          <SunBlob size={320} style={styles.blobBottom} intensity={0.55} />
        </>
      )}
      {Body}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgIvory },
  flex: { flex: 1 },
  blobTop: { position: 'absolute', top: -180, right: -150 },
  blobBottom: { position: 'absolute', bottom: -160, left: -140 },
});
