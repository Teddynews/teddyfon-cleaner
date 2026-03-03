import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Images, Camera, Film, ChevronRight, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { usePhotoStore, formatFileSize } from '@/lib/photo-store';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';
import { cn } from '@/lib/cn';
import { ScanSplashScreen } from '@/components/ScanSplashScreen';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const photos = usePhotoStore(s => s.photos);
  const similarGroups = usePhotoStore(s => s.similarGroups);
  const screenshots = usePhotoStore(s => s.screenshots);
  const largeFiles = usePhotoStore(s => s.largeFiles);
  const isScanning = usePhotoStore(s => s.isScanning);
  const scanProgress = usePhotoStore(s => s.scanProgress);
  const stats = usePhotoStore(s => s.stats);
  const scanPhotos = usePhotoStore(s => s.scanPhotos);
  const loadStats = usePhotoStore(s => s.loadStats);
  const firstScanLimited = usePhotoStore(s => s.firstScanLimited);
  const totalDevicePhotos = usePhotoStore(s => s.totalDevicePhotos);

  const [showSplash, setShowSplash] = useState(true);
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [hasScannedOnce, setHasScannedOnce] = useState(false);

  const scanButtonScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    loadStats();
  }, []);

  // Show splash screen on every focus (Home tab press) and auto-scan
  useFocusEffect(
    useCallback(() => {
      setShowSplash(true);
      setMinSplashDone(false);

      // Minimum 2 second display time for splash
      const minTimer = setTimeout(() => {
        setMinSplashDone(true);
      }, 2000);

      // Start scan
      const startScan = async () => {
        await scanPhotos();
        setHasScannedOnce(true);
      };
      startScan();

      return () => {
        clearTimeout(minTimer);
      };
    }, [])
  );

  // Hide splash when both conditions are met: min time passed AND scanning done
  useEffect(() => {
    if (minSplashDone && !isScanning) {
      setShowSplash(false);
    }
  }, [minSplashDone, isScanning]);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const totalPhotos = photos.length;
  const totalStorage = photos.reduce((sum, p) => sum + p.fileSize, 0);
  const potentialSavings =
    similarGroups.reduce((sum, g) => {
      const duplicateSizes = g.photos
        .filter(p => p.id !== g.bestPhotoId)
        .reduce((s, p) => s + p.fileSize, 0);
      return sum + duplicateSizes;
    }, 0) +
    screenshots.reduce((sum, p) => sum + p.fileSize, 0) +
    largeFiles.reduce((sum, p) => sum + p.fileSize, 0) * 0.5;

  const handleScan = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scanButtonScale.value = withSpring(0.95, {}, () => {
      scanButtonScale.value = withSpring(1);
    });
    await scanPhotos();
  };

  const scanButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanButtonScale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const categories = [
    {
      title: 'Similar Photos',
      subtitle: 'Review duplicates',
      count: similarGroups.length,
      icon: Images,
      color: GLASS_THEME.colors.primary,
      route: '/similar-photos',
    },
    {
      title: 'Screenshots',
      subtitle: 'Clean up captures',
      count: screenshots.length,
      icon: Camera,
      color: '#A78BFA',
      route: '/screenshots',
    },
    {
      title: 'Large Files',
      subtitle: 'Videos & big photos',
      count: largeFiles.length,
      icon: Film,
      color: GLASS_THEME.colors.warning,
      route: '/large-files',
    },
  ];

  const displayPhotoCount = firstScanLimited ? '10,000' : totalPhotos.toLocaleString();

  return (
    <View style={{ flex: 1 }}>
      {/* Splash Screen Overlay */}
      <ScanSplashScreen isVisible={showSplash} scanProgress={isScanning ? scanProgress : undefined} />

      <ScrollView
        className={cn('flex-1')}
        style={{ backgroundColor: isDark ? GLASS_THEME.colors.bgDark : GLASS_THEME.colors.bgLight }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
      {/* Hero Section with Glass Effect */}
      <LinearGradient
        colors={isDark
          ? ['#1E3A4C', '#1A3B3F', '#1A3832']
          : [GLASS_THEME.colors.primary, GLASS_THEME.colors.success, '#7EDCB5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroContent}>
          <View style={styles.headerRow}>
            <Image
              source={require('../../../assets/images/teddyfoncleaner-logo.jpg')}
              style={styles.logo}
            />
            <Text style={styles.headerTitle}>TeddyFon Cleaner</Text>
          </View>

          {/* Glass Stats Card */}
          <View style={styles.statsCardContainer}>
            <BlurView
              intensity={25}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Photos</Text>
                <Text style={styles.statValue}>{displayPhotoCount}</Text>
                {firstScanLimited && totalDevicePhotos > 0 ? (
                  <Text style={styles.statSubtext}>
                    (of {totalDevicePhotos.toLocaleString()} on device)
                  </Text>
                ) : null}
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Storage Used</Text>
                <Text style={styles.statValue}>{formatFileSize(totalStorage)}</Text>
              </View>
            </View>
          </View>

          {/* Potential Savings Glass Badge */}
          {potentialSavings > 0 ? (
            <View style={styles.savingsContainer}>
              <BlurView
                intensity={20}
                tint="light"
                style={StyleSheet.absoluteFill}
              />
              <View style={[StyleSheet.absoluteFill, styles.savingsOverlay]} />
              <View style={styles.savingsContent}>
                <Zap size={20} color="#fff" />
                <Text style={styles.savingsText}>
                  Free up to {formatFileSize(potentialSavings)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Scan Button with Glass Effect */}
          <Pressable onPress={handleScan} disabled={isScanning}>
            <Animated.View style={scanButtonAnimatedStyle}>
              <View style={styles.scanButtonWrapper}>
                <Animated.View style={[styles.scanButtonPulse, pulseAnimatedStyle]} />
                <View style={styles.scanButton}>
                  <BlurView
                    intensity={30}
                    tint="light"
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[StyleSheet.absoluteFill, styles.scanButtonOverlay]} />
                  {isScanning ? (
                    <View style={styles.scanButtonContent}>
                      <ActivityIndicator size="small" color={GLASS_THEME.colors.primary} />
                      <Text style={styles.scanButtonText}>
                        Scanning... {scanProgress}%
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.scanButtonText}>
                      {totalPhotos > 0 ? 'Scan Again' : 'Start Scan'}
                    </Text>
                  )}
                </View>
              </View>
            </Animated.View>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#111827' }]}>
          Cleanup Categories
        </Text>

        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Pressable
              key={category.title}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(category.route as any);
              }}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: isDark
                    ? GLASS_THEME.colors.cardDark
                    : GLASS_THEME.colors.cardLight,
                },
              ]}
            >
              <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                <Icon size={24} color={category.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryTitle, { color: isDark ? '#fff' : '#111827' }]}>
                  {category.title}
                </Text>
                <Text style={[styles.categorySubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  {category.subtitle}
                </Text>
              </View>
              <View style={styles.categoryRight}>
                <View style={[styles.categoryBadge, { backgroundColor: `${category.color}20` }]}>
                  <Text style={[styles.categoryCount, { color: category.color }]}>
                    {category.count}
                  </Text>
                </View>
                <ChevronRight size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Stats Section */}
      {stats.photosDeleted > 0 ? (
        <View style={styles.progressSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#111827' }]}>
            Your Progress
          </Text>
          <View
            style={[
              styles.progressCard,
              { backgroundColor: isDark ? GLASS_THEME.colors.cardDark : GLASS_THEME.colors.cardLight },
            ]}
          >
            <View style={styles.progressStats}>
              <View style={styles.progressItem}>
                <Text style={[styles.progressValue, { color: GLASS_THEME.colors.primary }]}>
                  {stats.photosDeleted}
                </Text>
                <Text style={[styles.progressLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Photos Cleaned
                </Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={[styles.progressValue, { color: GLASS_THEME.colors.success }]}>
                  {formatFileSize(stats.spaceSaved)}
                </Text>
                <Text style={[styles.progressLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Space Saved
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroGradient: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  logo: {
    width: 75,
    height: 75,
    marginRight: 10,
    borderRadius: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '300',
  },
  statsCardContainer: {
    width: '100%',
    borderRadius: GLASS_THEME.radius.xl,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  statSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  savingsContainer: {
    width: '100%',
    borderRadius: GLASS_THEME.radius.lg,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(109, 213, 160, 0.3)',
  },
  savingsOverlay: {
    backgroundColor: 'rgba(109, 213, 160, 0.35)',
  },
  savingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  savingsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  scanButtonWrapper: {
    position: 'relative',
  },
  scanButtonPulse: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 100,
  },
  scanButton: {
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...GLASS_THEME.shadows.medium,
  },
  scanButtonOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButtonText: {
    color: GLASS_THEME.colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: GLASS_THEME.radius.xl,
    marginBottom: 8,
    ...GLASS_THEME.shadows.light,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: GLASS_THEME.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 1,
  },
  categorySubtitle: {
    fontSize: 12,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
    marginRight: 6,
  },
  categoryCount: {
    fontWeight: '700',
    fontSize: 13,
  },
  progressSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  progressCard: {
    borderRadius: GLASS_THEME.radius.xl,
    padding: 14,
    ...GLASS_THEME.shadows.light,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
