import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  TextInputProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * GlassInput - A glassmorphism-styled text input component
 *
 * Features a translucent glass background with blur effect,
 * animated focus states, and optional label/error display.
 */
export function GlassInput({
  label,
  error,
  style,
  inputStyle,
  containerStyle,
  placeholder,
  ...props
}: GlassInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isFocused, setIsFocused] = useState(false);

  const borderOpacity = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    borderOpacity.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderOpacity.value = withTiming(0, { duration: 200 });
  };

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? GLASS_THEME.colors.delete
      : isFocused
        ? GLASS_THEME.colors.primary
        : isDark
          ? GLASS_THEME.colors.glassBorderDark
          : GLASS_THEME.colors.glassBorderLight,
    borderWidth: error || isFocused ? 1.5 : 1,
  }));

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: isDark
                ? GLASS_THEME.colors.textSecondaryDark
                : GLASS_THEME.colors.textSecondaryLight,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <Animated.View style={[styles.container, animatedBorderStyle, style]}>
        <BlurView
          intensity={GLASS_THEME.blur.intensityMedium}
          tint={isDark ? GLASS_THEME.blur.tintDark : GLASS_THEME.blur.tintLight}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? GLASS_THEME.colors.glassBgDark
                : GLASS_THEME.colors.glassBgLight,
            },
          ]}
        />

        <TextInput
          style={[
            styles.input,
            {
              color: isDark
                ? GLASS_THEME.colors.textPrimaryDark
                : GLASS_THEME.colors.textPrimaryLight,
            },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={
            isDark
              ? GLASS_THEME.colors.textMutedDark
              : GLASS_THEME.colors.textMutedLight
          }
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: GLASS_THEME.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: GLASS_THEME.spacing.xs,
    marginLeft: GLASS_THEME.spacing.xs,
  },
  container: {
    borderRadius: GLASS_THEME.radius.lg,
    overflow: 'hidden',
    ...GLASS_THEME.shadows.light,
  },
  input: {
    paddingVertical: GLASS_THEME.spacing.md,
    paddingHorizontal: GLASS_THEME.spacing.lg,
    fontSize: 16,
    position: 'relative',
  },
  error: {
    color: GLASS_THEME.colors.delete,
    fontSize: 12,
    marginTop: GLASS_THEME.spacing.xs,
    marginLeft: GLASS_THEME.spacing.xs,
  },
});

export default GlassInput;
