import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GlassButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  haptic?: boolean;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * GlassButton - A glassmorphism-styled button component
 *
 * Supports multiple variants (primary, secondary, destructive, outline, ghost)
 * and sizes (sm, md, lg). Includes press animations and optional haptic feedback.
 */
export function GlassButton({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  style,
  textStyle,
  haptic = true,
  fullWidth = false,
}: GlassButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (haptic && !disabled && !loading) {
      Haptics.impactAsync(
        variant === 'destructive'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
    }
    onPress?.();
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: GLASS_THEME.spacing.sm,
            paddingHorizontal: GLASS_THEME.spacing.md,
            borderRadius: GLASS_THEME.radius.md,
          },
          text: {
            fontSize: 14,
          },
        };
      case 'lg':
        return {
          container: {
            paddingVertical: GLASS_THEME.spacing.lg,
            paddingHorizontal: GLASS_THEME.spacing.xxl,
            borderRadius: GLASS_THEME.radius.xl,
          },
          text: {
            fontSize: 18,
          },
        };
      case 'md':
      default:
        return {
          container: {
            paddingVertical: GLASS_THEME.spacing.md,
            paddingHorizontal: GLASS_THEME.spacing.xl,
            borderRadius: GLASS_THEME.radius.lg,
          },
          text: {
            fontSize: 16,
          },
        };
    }
  };

  const getVariantStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    useBlur: boolean;
    blurIntensity: number;
  } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: GLASS_THEME.colors.primary,
            borderColor: GLASS_THEME.colors.primaryLight,
            borderWidth: 1,
            ...GLASS_THEME.shadows.glow(GLASS_THEME.colors.primary),
          },
          text: {
            color: '#FFFFFF',
          },
          useBlur: false,
          blurIntensity: 0,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDark
              ? GLASS_THEME.colors.glassBgDark
              : GLASS_THEME.colors.glassBgLight,
            borderColor: isDark
              ? GLASS_THEME.colors.glassBorderDark
              : GLASS_THEME.colors.glassBorderLight,
            borderWidth: 1,
            ...GLASS_THEME.shadows.light,
          },
          text: {
            color: isDark
              ? GLASS_THEME.colors.textPrimaryDark
              : GLASS_THEME.colors.textPrimaryLight,
          },
          useBlur: true,
          blurIntensity: GLASS_THEME.blur.intensityMedium,
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: GLASS_THEME.colors.delete,
            borderColor: GLASS_THEME.colors.deleteLight,
            borderWidth: 1,
            ...GLASS_THEME.shadows.glow(GLASS_THEME.colors.delete),
          },
          text: {
            color: '#FFFFFF',
          },
          useBlur: false,
          blurIntensity: 0,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: isDark
              ? GLASS_THEME.colors.glassBorderLight
              : GLASS_THEME.colors.primary,
            borderWidth: 1.5,
          },
          text: {
            color: isDark
              ? GLASS_THEME.colors.textPrimaryDark
              : GLASS_THEME.colors.primary,
          },
          useBlur: false,
          blurIntensity: 0,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: isDark
              ? GLASS_THEME.colors.textSecondaryDark
              : GLASS_THEME.colors.textSecondaryLight,
          },
          useBlur: false,
          blurIntensity: 0,
        };
      default:
        return {
          container: {},
          text: {},
          useBlur: false,
          blurIntensity: 0,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const buttonContent = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color as string}
          style={styles.loader}
        />
      ) : (
        <>
          {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              variantStyles.text,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {children}
          </Text>
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {variantStyles.useBlur ? (
        <>
          <BlurView
            intensity={variantStyles.blurIntensity}
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
        </>
      ) : null}
      {buttonContent}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: GLASS_THEME.spacing.sm,
  },
  iconRight: {
    marginLeft: GLASS_THEME.spacing.sm,
  },
  loader: {
    marginHorizontal: GLASS_THEME.spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
  fullWidth: {
    width: '100%',
  },
});

export default GlassButton;
