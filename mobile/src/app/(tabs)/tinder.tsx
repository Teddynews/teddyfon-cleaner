import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, Dimensions, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FolderOpen, X, Check, Trash2, RefreshCw, Home } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image as RNImage } from 'react-native';
import { usePhotoStore, formatFileSize, Photo, CategoryType, CategoryInfo } from '@/lib/photo-store';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface TinderCardProps {
  photo: Photo;
  onSwipeLeft: (photo: Photo) => void;
  onSwipeRight: (photo: Photo) => void;
  isTop: boolean;
  isDark: boolean;
}

function TinderCard({ photo, onSwipeLeft, onSwipeRight, isTop, isDark }: TinderCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withSpring(direction * SCREEN_WIDTH * 1.5, {
          velocity: event.velocityX,
          damping: 20,
          stiffness: 100,
        });

        runOnJS(triggerHaptic)();

        if (direction > 0) {
          runOnJS(onSwipeRight)(photo);
        } else {
          runOnJS(onSwipeLeft)(photo);
        }
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const keepIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const deleteIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <RNImage
          source={{ uri: photo.uri }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* Keep indicator (right swipe) */}
        <Animated.View style={[styles.indicator, styles.keepIndicator, keepIndicatorStyle]}>
          <View style={[styles.keepCircle, { backgroundColor: GLASS_THEME.colors.success }]}>
            <Check size={40} color="#fff" strokeWidth={3} />
          </View>
          <Text style={[styles.keepText, { color: GLASS_THEME.colors.success }]}>KEEP</Text>
        </Animated.View>

        {/* Delete indicator (left swipe) */}
        <Animated.View style={[styles.indicator, styles.deleteIndicator, deleteIndicatorStyle]}>
          <View style={[styles.deleteCircle, { backgroundColor: GLASS_THEME.colors.delete }]}>
            <X size={40} color="#fff" strokeWidth={3} />
          </View>
          <Text style={[styles.deleteText, { color: GLASS_THEME.colors.delete }]}>DELETE</Text>
        </Animated.View>

        {/* Photo info overlay with glass effect */}
        <View style={styles.infoOverlay}>
          <BlurView
            intensity={30}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
          <View style={styles.infoContent}>
            <Text style={styles.filename} numberOfLines={1}>{photo.filename}</Text>
            <Text style={styles.filesize}>{formatFileSize(photo.fileSize)}</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function TinderScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const photos = usePhotoStore(s => s.photos);
  const selectedPhotoIds = usePhotoStore(s => s.selectedPhotoIds);
  const selectPhoto = usePhotoStore(s => s.selectPhoto);
  const clearSelection = usePhotoStore(s => s.clearSelection);
  const deleteSelectedPhotos = usePhotoStore(s => s.deleteSelectedPhotos);
  const getShuffledPhotosByCategory = usePhotoStore(s => s.getShuffledPhotosByCategory);
  const getCategories = usePhotoStore(s => s.getCategories);
  const tinderFilterCategory = usePhotoStore(s => s.tinderFilterCategory);
  const setTinderFilterCategory = usePhotoStore(s => s.setTinderFilterCategory);

  const [swipeQueue, setSwipeQueue] = useState<Photo[]>([]);
  const [keptPhotos, setKeptPhotos] = useState<Photo[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedCount = selectedPhotoIds.size;
  const selectedSize = photos
    .filter(p => selectedPhotoIds.has(p.id))
    .reduce((sum, p) => sum + p.fileSize, 0);

  // Initialize/reset swipe queue when category changes or photos change
  useEffect(() => {
    if (photos.length > 0) {
      const shuffled = getShuffledPhotosByCategory(tinderFilterCategory);
      setSwipeQueue(shuffled);
      setKeptPhotos([]);
      clearSelection();
    }
    setCategories(getCategories());
  }, [tinderFilterCategory, photos.length]);

  const handleSwipeLeft = useCallback((photo: Photo) => {
    selectPhoto(photo.id);
    setSwipeQueue(prev => prev.filter(p => p.id !== photo.id));
  }, [selectPhoto]);

  const handleSwipeRight = useCallback((photo: Photo) => {
    setKeptPhotos(prev => [...prev, photo]);
    setSwipeQueue(prev => prev.filter(p => p.id !== photo.id));
  }, []);

  const handleCategorySelect = (category: CategoryType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTinderFilterCategory(category);
    setShowCategoryModal(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedCount === 0 || isDeleting) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsDeleting(true);
    await deleteSelectedPhotos();
    setIsDeleting(false);

    // Refresh the queue
    const shuffled = getShuffledPhotosByCategory(tinderFilterCategory);
    setSwipeQueue(shuffled);
    setKeptPhotos([]);
  };

  const handleResetQueue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shuffled = getShuffledPhotosByCategory(tinderFilterCategory);
    setSwipeQueue(shuffled);
    setKeptPhotos([]);
    clearSelection();
  };

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)');
  };

  const getCategoryLabel = (id: CategoryType): string => {
    switch (id) {
      case 'all': return 'All Photos';
      case 'similar': return 'Similar';
      case 'screenshots': return 'Screenshots';
      case 'large': return 'Large Files';
      case 'old': return 'Old Photos';
      case 'recent': return 'Recent';
      case 'blurry': return 'Blurry';
      case 'duplicates': return 'Duplicates';
      default: return 'All Photos';
    }
  };

  const visibleCards = swipeQueue.slice(0, 3);

  if (photos.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? GLASS_THEME.colors.bgDark : GLASS_THEME.colors.bgLight }]}>
        <Image
          source={require('../../../assets/images/teddyfoncleaner-logo.jpg')}
          style={styles.emptyMascot}
          resizeMode="contain"
        />
        <Text style={[styles.emptyTitle, { color: isDark ? GLASS_THEME.colors.textPrimaryDark : GLASS_THEME.colors.textPrimaryLight }]}>
          No Photos Yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
          Scan your photos from the Home tab first to start swiping.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? GLASS_THEME.colors.bgDark : GLASS_THEME.colors.bgLight }]}>
      {/* Header with glass effect */}
      <View style={styles.headerContainer}>
        <BlurView
          intensity={isDark ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : GLASS_THEME.colors.glassBgLight }]} />

        <View style={styles.headerContent}>
          {/* Logo and Stats */}
          <View style={styles.statsRow}>
            <Image
              source={require('../../../assets/images/teddyfoncleaner-logo.jpg')}
              style={styles.headerLogo}
            />
            <View style={styles.statBadge}>
              <Check size={16} color={GLASS_THEME.colors.success} />
              <Text style={[styles.statText, { color: GLASS_THEME.colors.success }]}>{keptPhotos.length}</Text>
            </View>
            <View style={styles.statBadge}>
              <X size={16} color={GLASS_THEME.colors.delete} />
              <Text style={[styles.statText, { color: GLASS_THEME.colors.delete }]}>{selectedCount}</Text>
            </View>
            <Text style={[styles.remainingText, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
              {swipeQueue.length} left
            </Text>
          </View>

          {/* Category filter button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCategoryModal(true);
            }}
            style={[styles.filterButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : `${GLASS_THEME.colors.primary}15` }]}
          >
            <FolderOpen size={18} color={isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.primary} />
            <Text style={[styles.filterText, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.primary }]}>
              {getCategoryLabel(tinderFilterCategory)}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Card stack */}
      <View style={styles.stackContainer}>
        {visibleCards.length > 0 ? (
          visibleCards.map((photo, index) => {
            const isTop = index === 0;
            return (
              <View
                key={photo.id}
                style={[
                  styles.cardWrapper,
                  {
                    zIndex: visibleCards.length - index,
                    transform: [
                      { scale: 1 - index * 0.05 },
                      { translateY: index * 8 },
                    ],
                  },
                ]}
              >
                <TinderCard
                  photo={photo}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  isTop={isTop}
                  isDark={isDark}
                />
              </View>
            );
          })
        ) : (
          <View style={styles.doneContainer}>
            <View style={[styles.doneIcon, { backgroundColor: `${GLASS_THEME.colors.primary}20` }]}>
              <Check size={48} color={GLASS_THEME.colors.primary} />
            </View>
            <Text style={[styles.doneTitle, { color: GLASS_THEME.colors.primary }]}>All Done!</Text>
            <Text style={[styles.doneSubtitle, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
              No more photos to review
            </Text>

            {/* Action buttons */}
            <View style={styles.doneButtons}>
              <Pressable
                onPress={handleResetQueue}
                style={[styles.doneButton, { borderColor: GLASS_THEME.colors.primary }]}
              >
                <RefreshCw size={18} color={GLASS_THEME.colors.primary} />
                <Text style={[styles.doneButtonText, { color: GLASS_THEME.colors.primary }]}>Start Over</Text>
              </Pressable>

              <Pressable
                onPress={handleGoHome}
                style={[styles.doneButtonPrimary, { backgroundColor: GLASS_THEME.colors.primary }]}
              >
                <Home size={18} color="#fff" />
                <Text style={styles.doneButtonPrimaryText}>Go Home</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Instructions with glass effect */}
      <View style={styles.instructionsContainer}>
        <BlurView
          intensity={isDark ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : GLASS_THEME.colors.glassBgLight }]} />

        <View style={styles.instructionsContent}>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionIcon, { backgroundColor: `${GLASS_THEME.colors.delete}20` }]}>
              <X size={16} color={GLASS_THEME.colors.delete} />
            </View>
            <Text style={[styles.instructionText, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
              Swipe left
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionIcon, { backgroundColor: `${GLASS_THEME.colors.success}20` }]}>
              <Check size={16} color={GLASS_THEME.colors.success} />
            </View>
            <Text style={[styles.instructionText, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
              Swipe right
            </Text>
          </View>
        </View>
      </View>

      {/* Delete button */}
      {selectedCount > 0 ? (
        <Pressable
          onPress={handleDeleteSelected}
          disabled={isDeleting}
          style={[
            styles.deleteSelectedButton,
            {
              marginBottom: insets.bottom + 16,
              backgroundColor: isDeleting ? '#FF9999' : GLASS_THEME.colors.delete,
            },
          ]}
        >
          <Trash2 size={20} color="#fff" />
          <Text style={styles.deleteSelectedText}>
            {isDeleting ? 'Deleting...' : `Delete ${selectedCount} (${formatFileSize(selectedSize)})`}
          </Text>
        </Pressable>
      ) : null}

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContentWrapper}>
            <BlurView
              intensity={isDark ? 50 : 70}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : GLASS_THEME.colors.glassBgLight }]} />

            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: isDark ? GLASS_THEME.colors.textPrimaryDark : GLASS_THEME.colors.textPrimaryLight }]}>
              Filter by Category
            </Text>

            <ScrollView style={styles.categoryList}>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategorySelect(category.id)}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: tinderFilterCategory === category.id
                        ? (isDark ? `${GLASS_THEME.colors.primary}20` : `${GLASS_THEME.colors.primary}10`)
                        : 'transparent',
                      borderColor: tinderFilterCategory === category.id
                        ? GLASS_THEME.colors.primary
                        : (isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.glassBorderLight),
                    },
                  ]}
                >
                  <View style={styles.categoryInfo}>
                    <Text style={[
                      styles.categoryName,
                      {
                        color: tinderFilterCategory === category.id
                          ? GLASS_THEME.colors.primary
                          : (isDark ? GLASS_THEME.colors.textPrimaryDark : GLASS_THEME.colors.textPrimaryLight),
                      },
                    ]}>
                      {category.name}
                    </Text>
                    <Text style={[styles.categoryCount, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
                      {category.count} photos
                    </Text>
                  </View>
                  {tinderFilterCategory === category.id ? (
                    <Check size={20} color={GLASS_THEME.colors.primary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
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
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 24,
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
  headerContainer: {
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontWeight: '700',
    marginLeft: 4,
  },
  remainingText: {
    fontSize: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  stackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH * 1.2,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: GLASS_THEME.radius.xl,
    overflow: 'hidden',
    ...GLASS_THEME.shadows.heavy,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  indicator: {
    position: 'absolute',
    top: 40,
    alignItems: 'center',
    gap: 8,
  },
  keepIndicator: {
    left: 20,
  },
  deleteIndicator: {
    right: 20,
  },
  keepCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  deleteCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  keepText: {
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  deleteText: {
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: GLASS_THEME.radius.xl,
    borderBottomRightRadius: GLASS_THEME.radius.xl,
  },
  infoContent: {
    padding: 16,
  },
  filename: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  filesize: {
    fontSize: 14,
    color: '#9ca3af',
  },
  doneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: '700',
  },
  doneSubtitle: {
    fontSize: 16,
  },
  doneButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: GLASS_THEME.radius.lg,
    borderWidth: 2,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: GLASS_THEME.radius.lg,
  },
  doneButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  instructionsContainer: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  instructionsContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  instructionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  instructionText: {
    fontSize: 14,
  },
  deleteSelectedButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: GLASS_THEME.radius.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...GLASS_THEME.shadows.glow(GLASS_THEME.colors.delete),
  },
  deleteSelectedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContentWrapper: {
    borderTopLeftRadius: GLASS_THEME.radius.xxl,
    borderTopRightRadius: GLASS_THEME.radius.xxl,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(156, 163, 175, 0.5)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: GLASS_THEME.radius.lg,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 14,
  },
});
