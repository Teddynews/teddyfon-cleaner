import { StyleSheet, Platform } from 'react-native';

/**
 * Glassmorphism Design Theme for TeddyFon Cleaner
 *
 * This theme provides a cohesive glass-like aesthetic throughout the app,
 * featuring translucent backgrounds, subtle blurs, and soft shadows.
 */

export const GLASS_THEME = {
  colors: {
    // Primary brand colors
    primary: '#5ED3E5',
    primaryLight: '#7EDCF0',
    primaryDark: '#3CBDD0',

    // Secondary colors
    secondary: '#FBF5D9',
    secondaryDark: '#E8DFC0',

    // Status colors
    success: '#6DD5A0',
    successLight: '#8DDDB5',
    delete: '#FF7B7B',
    deleteLight: '#FF9999',
    warning: '#FBBF24',

    // Background colors
    bgLight: '#F7F9FC',
    bgDark: '#1A1F2E',

    // Card backgrounds
    cardLight: '#FFFFFF',
    cardDark: '#252D3D',

    // Glass effect backgrounds
    glassBgLight: 'rgba(255, 255, 255, 0.75)',
    glassBgDark: 'rgba(28, 28, 28, 0.52)',
    glassBgLightSubtle: 'rgba(255, 255, 255, 0.4)',
    glassBgDarkSubtle: 'rgba(28, 28, 28, 0.35)',

    // Glass borders
    glassBorderLight: 'rgba(255, 255, 255, 0.3)',
    glassBorderDark: 'rgba(255, 255, 255, 0.1)',

    // Text colors
    textPrimaryLight: '#111827',
    textPrimaryDark: '#FFFFFF',
    textSecondaryLight: '#6B7280',
    textSecondaryDark: '#9CA3AF',
    textMutedLight: '#9CA3AF',
    textMutedDark: '#6B7280',

    // Tab bar
    tabBarBgLight: 'rgba(255, 255, 255, 0.85)',
    tabBarBgDark: 'rgba(17, 24, 39, 0.85)',
    tabBarBorderLight: 'rgba(229, 231, 235, 0.8)',
    tabBarBorderDark: 'rgba(31, 41, 55, 0.8)',
  },

  blur: {
    intensity: 20,
    intensityLight: 25,
    intensityMedium: 15,
    intensityHeavy: 35,
    tintLight: 'light' as const,
    tintDark: 'dark' as const,
  },

  shadows: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 8,
    },
    glow: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    }),
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

// Helper functions for creating glass styles
export const createGlassStyle = (isDark: boolean) => ({
  backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : GLASS_THEME.colors.glassBgLight,
  borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.glassBorderLight,
  borderWidth: 1,
});

export const createCardStyle = (isDark: boolean) => ({
  backgroundColor: isDark ? GLASS_THEME.colors.cardDark : GLASS_THEME.colors.cardLight,
  borderRadius: GLASS_THEME.radius.xl,
  ...GLASS_THEME.shadows.light,
});

export const createButtonGlassStyle = (isDark: boolean, variant: 'primary' | 'secondary' | 'destructive' | 'outline' = 'primary') => {
  const baseStyle = {
    borderRadius: GLASS_THEME.radius.lg,
    borderWidth: 1,
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyle,
        backgroundColor: GLASS_THEME.colors.primary,
        borderColor: GLASS_THEME.colors.primaryLight,
        ...GLASS_THEME.shadows.glow(GLASS_THEME.colors.primary),
      };
    case 'secondary':
      return {
        ...baseStyle,
        backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : GLASS_THEME.colors.glassBgLight,
        borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.glassBorderLight,
        ...GLASS_THEME.shadows.light,
      };
    case 'destructive':
      return {
        ...baseStyle,
        backgroundColor: GLASS_THEME.colors.delete,
        borderColor: GLASS_THEME.colors.deleteLight,
        ...GLASS_THEME.shadows.glow(GLASS_THEME.colors.delete),
      };
    case 'outline':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.primary,
      };
    default:
      return baseStyle;
  }
};

// Common glass-styled components styles
export const glassStyles = StyleSheet.create({
  card: {
    borderRadius: GLASS_THEME.radius.xl,
    overflow: 'hidden',
  },
  cardContent: {
    padding: GLASS_THEME.spacing.lg,
  },
  button: {
    borderRadius: GLASS_THEME.radius.lg,
    paddingVertical: GLASS_THEME.spacing.md,
    paddingHorizontal: GLASS_THEME.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderRadius: GLASS_THEME.radius.lg,
    paddingVertical: GLASS_THEME.spacing.md,
    paddingHorizontal: GLASS_THEME.spacing.lg,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: GLASS_THEME.radius.xxl,
    borderTopRightRadius: GLASS_THEME.radius.xxl,
    paddingTop: GLASS_THEME.spacing.md,
    paddingBottom: GLASS_THEME.spacing.xxxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: GLASS_THEME.spacing.lg,
    backgroundColor: 'rgba(156, 163, 175, 0.5)',
  },
});

export default GLASS_THEME;
