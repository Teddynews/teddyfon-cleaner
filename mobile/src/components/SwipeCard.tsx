import React from 'react';
import { View, Text, Image, Dimensions, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Photo, formatFileSize } from '@/lib/photo-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeCardProps {
  photo: Photo;
  onSwipeLeft: (photo: Photo) => void;
  onSwipeRight: (photo: Photo) => void;
  isTop: boolean;
}

export function SwipeCard({ photo, onSwipeLeft, onSwipeRight, isTop }: SwipeCardProps) {
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
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Keep indicator (right swipe) */}
        <Animated.View style={[styles.indicator, styles.keepIndicator, keepIndicatorStyle]}>
          <View style={styles.indicatorCircle}>
            <Check size={40} color="#fff" strokeWidth={3} />
          </View>
          <Text style={styles.indicatorText}>KEEP</Text>
        </Animated.View>

        {/* Delete indicator (left swipe) */}
        <Animated.View style={[styles.indicator, styles.deleteIndicator, deleteIndicatorStyle]}>
          <View style={[styles.indicatorCircle, styles.deleteCircle]}>
            <X size={40} color="#fff" strokeWidth={3} />
          </View>
          <Text style={[styles.indicatorText, styles.deleteText]}>DELETE</Text>
        </Animated.View>

        {/* Photo info overlay */}
        <View style={styles.infoOverlay}>
          <Text style={styles.filename} numberOfLines={1}>{photo.filename}</Text>
          <Text style={styles.filesize}>{formatFileSize(photo.fileSize)}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

interface SwipeCardStackProps {
  photos: Photo[];
  onSwipeLeft: (photo: Photo) => void;
  onSwipeRight: (photo: Photo) => void;
}

export function SwipeCardStack({ photos, onSwipeLeft, onSwipeRight }: SwipeCardStackProps) {
  const visibleCards = photos.slice(0, 3);

  return (
    <View style={styles.stackContainer}>
      {visibleCards.map((photo, index) => {
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
            <SwipeCard
              photo={photo}
              onSwipeLeft={onSwipeLeft}
              onSwipeRight={onSwipeRight}
              isTop={isTop}
            />
          </View>
        );
      })}

      {photos.length === 0 && (
        <View style={styles.emptyContainer}>
          <Check size={64} color="#0EA5E9" />
          <Text style={styles.emptyTitle}>All Done!</Text>
          <Text style={styles.emptySubtitle}>No more photos to review</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH * 1.2,
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1f2937',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  image: {
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
  indicatorCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  deleteCircle: {
    backgroundColor: '#ef4444',
  },
  indicatorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  deleteText: {
    color: '#ef4444',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0EA5E9',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
});
