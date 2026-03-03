import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ScanSplashScreenProps {
  isVisible: boolean;
  scanProgress?: number;
}

export function ScanSplashScreen({ isVisible, scanProgress }: ScanSplashScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const pulseScale = useSharedValue(1);
  const dotOpacity1 = useSharedValue(0.3);
  const dotOpacity2 = useSharedValue(0.3);
  const dotOpacity3 = useSharedValue(0.3);

  useEffect(() => {
    if (isVisible) {
      // Pulse animation for logo
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Animated dots
      dotOpacity1.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        true
      );

      setTimeout(() => {
        dotOpacity2.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1,
          true
        );
      }, 200);

      setTimeout(() => {
        dotOpacity3.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1,
          true
        );
      }, 400);
    }
  }, [isVisible]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({ opacity: dotOpacity1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dotOpacity2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dotOpacity3.value }));

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0F172A', '#1E293B', '#0F172A']
          : [GLASS_THEME.colors.primary, GLASS_THEME.colors.success, GLASS_THEME.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <Image
              source={require('../../assets/images/teddyfoncleaner-logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* App Name */}
          <Text style={styles.appName}>TeddyFon Cleaner</Text>

          {/* Scanning Text */}
          <View style={styles.scanningContainer}>
            <Text style={styles.scanningText}>is scanning</Text>
            <View style={styles.dotsContainer}>
              <Animated.Text style={[styles.dot, dot1Style]}>.</Animated.Text>
              <Animated.Text style={[styles.dot, dot2Style]}>.</Animated.Text>
              <Animated.Text style={[styles.dot, dot3Style]}>.</Animated.Text>
            </View>
          </View>

          {/* Progress indicator */}
          {scanProgress !== undefined && scanProgress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{scanProgress}%</Text>
            </View>
          )}

          {/* Loading indicator */}
          <ActivityIndicator
            size="large"
            color="rgba(255, 255, 255, 0.8)"
            style={styles.loader}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  scanningText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 2,
  },
  dot: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
  },
  progressContainer: {
    width: SCREEN_WIDTH * 0.6,
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  loader: {
    marginTop: 16,
  },
});
