import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: 'light' | 'medium' | 'heavy';
  noPadding?: boolean;
  variant?: 'default' | 'elevated' | 'subtle';
}

/**
 * GlassCard - A glassmorphism-styled card component
 *
 * Uses BlurView from expo-blur to create a translucent glass effect.
 * Automatically adapts to light/dark mode.
 */
export function GlassCard({
  children,
  style,
  intensity = 'medium',
  noPadding = false,
  variant = 'default',
}: GlassCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getBlurIntensity = () => {
    switch (intensity) {
      case 'light':
        return GLASS_THEME.blur.intensityLight;
      case 'heavy':
        return GLASS_THEME.blur.intensityHeavy;
      case 'medium':
      default:
        return GLASS_THEME.blur.intensityMedium;
    }
  };

  const getBackgroundStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          ...GLASS_THEME.shadows.medium,
        };
      case 'subtle':
        return {
          ...GLASS_THEME.shadows.light,
        };
      default:
        return {
          ...GLASS_THEME.shadows.light,
        };
    }
  };

  const borderColor = isDark
    ? GLASS_THEME.colors.glassBorderDark
    : GLASS_THEME.colors.glassBorderLight;

  return (
    <View
      style={[
        styles.container,
        getBackgroundStyle(),
        { borderColor },
        style,
      ]}
    >
      <BlurView
        intensity={getBlurIntensity()}
        tint={isDark ? GLASS_THEME.blur.tintDark : GLASS_THEME.blur.tintLight}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark
              ? GLASS_THEME.colors.glassBgDark
              : GLASS_THEME.colors.glassBgLight,
          },
        ]}
      />
      <View style={[styles.content, noPadding && styles.noPadding]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: GLASS_THEME.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: GLASS_THEME.spacing.lg,
    position: 'relative',
  },
  noPadding: {
    padding: 0,
  },
});

export default GlassCard;
