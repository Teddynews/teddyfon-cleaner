import React from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Images, Camera, Film, ChevronRight, Clock, Calendar, AlertCircle, Copy, Grid3X3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePhotoStore, formatFileSize } from '@/lib/photo-store';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';

export default function CategoriesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const photos = usePhotoStore(s => s.photos);
  const similarGroups = usePhotoStore(s => s.similarGroups);
  const screenshots = usePhotoStore(s => s.screenshots);
  const largeFiles = usePhotoStore(s => s.largeFiles);
  const oldPhotos = usePhotoStore(s => s.oldPhotos);
  const recentPhotos = usePhotoStore(s => s.recentPhotos);
  const blurryPhotos = usePhotoStore(s => s.blurryPhotos);
  const duplicates = usePhotoStore(s => s.duplicates);

  // Calculate potential savings for each category
  const similarPhotosSavings = similarGroups.reduce((sum, g) => {
    const duplicateSizes = g.photos
      .filter(p => p.id !== g.bestPhotoId)
      .reduce((s, p) => s + p.fileSize, 0);
    return sum + duplicateSizes;
  }, 0);

  const screenshotsSavings = screenshots.reduce((sum, p) => sum + p.fileSize, 0);
  const largeFilesSavings = largeFiles.reduce((sum, p) => sum + p.fileSize, 0) * 0.5;
  const oldPhotosSavings = oldPhotos.reduce((sum, p) => sum + p.fileSize, 0);
  const duplicatesSavings = duplicates.reduce((sum, g) => {
    const dupSizes = g.photos
      .filter(p => p.id !== g.bestPhotoId)
      .reduce((s, p) => s + p.fileSize, 0);
    return sum + dupSizes;
  }, 0);

  const categories = [
    {
      title: 'All Photos',
      subtitle: 'Browse all your photos',
      count: photos.length,
      itemLabel: 'photos',
      savings: 0,
      icon: Grid3X3,
      color: '#6366F1',
      route: '/all-photos',
    },
    {
      title: 'Similar Photos',
      subtitle: 'Review and remove duplicates',
      count: similarGroups.length,
      itemLabel: 'groups',
      savings: similarPhotosSavings,
      icon: Images,
      color: GLASS_THEME.colors.primary,
      route: '/similar-photos',
    },
    {
      title: 'Screenshots',
      subtitle: 'Clean up old screen captures',
      count: screenshots.length,
      itemLabel: 'screenshots',
      savings: screenshotsSavings,
      icon: Camera,
      color: '#A78BFA',
      route: '/screenshots',
    },
    {
      title: 'Large Files',
      subtitle: 'Videos and high-res photos',
      count: largeFiles.length,
      itemLabel: 'files',
      savings: largeFilesSavings,
      icon: Film,
      color: GLASS_THEME.colors.warning,
      route: '/large-files',
    },
    {
      title: 'Old Photos',
      subtitle: 'Photos older than 1 year',
      count: oldPhotos.length,
      itemLabel: 'photos',
      savings: oldPhotosSavings,
      icon: Calendar,
      color: '#F472B6',
      route: '/old-photos',
    },
    {
      title: 'Recent Photos',
      subtitle: 'Photos from last 7 days',
      count: recentPhotos.length,
      itemLabel: 'photos',
      savings: 0,
      icon: Clock,
      color: GLASS_THEME.colors.success,
      route: '/recent-photos',
    },
    {
      title: 'Blurry Photos',
      subtitle: 'Potentially blurry images',
      count: blurryPhotos.length,
      itemLabel: 'photos',
      savings: blurryPhotos.reduce((sum, p) => sum + p.fileSize, 0),
      icon: AlertCircle,
      color: GLASS_THEME.colors.delete,
      route: '/blurry-photos',
    },
    {
      title: 'Duplicates',
      subtitle: 'Exact duplicate files',
      count: duplicates.length,
      itemLabel: 'groups',
      savings: duplicatesSavings,
      icon: Copy,
      color: '#2DD4BF',
      route: '/duplicates',
    },
  ];

  const totalSavings = similarPhotosSavings + screenshotsSavings + largeFilesSavings + duplicatesSavings;

  if (photos.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? GLASS_THEME.colors.bgDark : GLASS_THEME.colors.bgLight }]}>
        <Image
          source={require('../../../assets/images/teddy-mascot.png')}
          style={styles.emptyMascot}
          resizeMode="contain"
        />
        <Text style={[styles.emptyTitle, { color: isDark ? GLASS_THEME.colors.textPrimaryDark : GLASS_THEME.colors.textPrimaryLight }]}>
          No Photos Scanned
        </Text>
        <Text style={[styles.emptySubtitle, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
          Scan your photos from the Home tab first to see cleanup categories.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? GLASS_THEME.colors.bgDark : GLASS_THEME.colors.bgLight }]}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Summary Card with Glass Effect */}
      {totalSavings > 0 ? (
        <View style={styles.summarySection}>
          <View style={[styles.summaryCard, { borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : `${GLASS_THEME.colors.success}30` }]}>
            <BlurView
              intensity={isDark ? 20 : 30}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#1E3D2E90' : `${GLASS_THEME.colors.success}10` }]} />

            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, { color: GLASS_THEME.colors.success }]}>
                Potential Space Savings
              </Text>
              <Text style={[styles.summaryValue, { color: isDark ? '#A5F3C0' : '#059669' }]}>
                {formatFileSize(totalSavings)}
              </Text>
              <Text style={[styles.summaryHint, { color: isDark ? 'rgba(109, 213, 160, 0.6)' : 'rgba(5, 150, 105, 0.7)' }]}>
                Review the categories below to free up space
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={[styles.sectionTitle, { color: isDark ? GLASS_THEME.colors.textPrimaryDark : GLASS_THEME.colors.textPrimaryLight }]}>
          Cleanup Categories
        </Text>

        {categories.map((category) => {
          const Icon = category.icon;
          const hasItems = category.count > 0;

          return (
            <Pressable
              key={category.title}
              onPress={() => {
                if (hasItems) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(category.route as any);
                }
              }}
              disabled={!hasItems}
              style={[
                styles.categoryCard,
                { borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.glassBorderLight },
                !hasItems && styles.categoryDisabled,
              ]}
            >
              <BlurView
                intensity={isDark ? 20 : 30}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : GLASS_THEME.colors.glassBgLight }]} />

              <View style={styles.categoryContent}>
                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                  <Icon size={28} color={category.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryTitle, { color: isDark ? GLASS_THEME.colors.textPrimaryDark : GLASS_THEME.colors.textPrimaryLight }]}>
                    {category.title}
                  </Text>
                  <Text style={[styles.categorySubtitle, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
                    {category.subtitle}
                  </Text>
                  {category.savings > 0 ? (
                    <Text style={styles.categorySavings}>
                      Save up to {formatFileSize(category.savings)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.categoryRight}>
                  <View style={[styles.categoryBadge, { backgroundColor: `${category.color}20` }]}>
                    <Text style={[styles.categoryCount, { color: category.color }]}>
                      {category.count}
                    </Text>
                  </View>
                  <Text style={[styles.categoryItemLabel, { color: isDark ? GLASS_THEME.colors.textMutedDark : GLASS_THEME.colors.textMutedLight }]}>
                    {category.itemLabel}
                  </Text>
                </View>
                {hasItems ? (
                  <ChevronRight size={20} color={isDark ? GLASS_THEME.colors.textMutedDark : GLASS_THEME.colors.textMutedLight} style={styles.chevron} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Info Card */}
      <View style={styles.infoSection}>
        <View style={[styles.infoCard, { borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.glassBorderLight }]}>
          <BlurView
            intensity={isDark ? 15 : 20}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : 'rgba(229, 231, 235, 0.5)' }]} />
          <Text style={[styles.infoText, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
            Tap a category to review photos. You can select photos to delete and free up storage space on your device.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyMascot: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryCard: {
    borderRadius: GLASS_THEME.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  summaryContent: {
    padding: 20,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryHint: {
    fontSize: 14,
    marginTop: 8,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  categoryCard: {
    borderRadius: GLASS_THEME.radius.xl,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    ...GLASS_THEME.shadows.light,
  },
  categoryDisabled: {
    opacity: 0.5,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: GLASS_THEME.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 14,
  },
  categorySavings: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  categoryCount: {
    fontWeight: '700',
  },
  categoryItemLabel: {
    fontSize: 12,
  },
  chevron: {
    marginLeft: 8,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  infoCard: {
    borderRadius: GLASS_THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
    lineHeight: 20,
  },
});
