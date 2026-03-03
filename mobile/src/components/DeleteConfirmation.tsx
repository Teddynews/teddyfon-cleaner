import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Trash2 } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 220;

interface DeleteConfirmationProps {
  visible: boolean;
  photoCount: number;
  sizeToFree: string;
  onConfirm: () => void;
  onCancel: () => void;
  accentColor?: string;
}

export function DeleteConfirmation({
  visible,
  photoCount,
  sizeToFree,
  onConfirm,
  onCancel,
  accentColor = '#ef4444',
}: DeleteConfirmationProps) {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(SHEET_HEIGHT, {
        damping: 20,
        stiffness: 300,
      });
      backdropOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const itemLabel = photoCount === 1 ? 'photo' : 'photos';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          </Pressable>
        </Animated.View>

        {/* Action Sheet */}
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Main action container */}
          <View style={styles.actionContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
                <Trash2 size={24} color={accentColor} />
              </View>
              <Text style={styles.title}>Delete {photoCount} {itemLabel}?</Text>
              <Text style={styles.subtitle}>This will free up {sizeToFree}</Text>
            </View>

            {/* Delete button */}
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.deleteButton,
                { backgroundColor: accentColor },
                pressed && styles.buttonPressed,
              ]}
            >
              <Trash2 size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>

          {/* Cancel button */}
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.cancelPressed,
            ]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Animated wrapper for photo items that supports deletion animation
interface AnimatedPhotoWrapperProps {
  children: React.ReactNode;
  isDeleting: boolean;
  onAnimationComplete?: () => void;
}

export function AnimatedPhotoWrapper({
  children,
  isDeleting,
  onAnimationComplete,
}: AnimatedPhotoWrapperProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isDeleting) {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      });
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 150 });
    }
  }, [isDeleting]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    paddingHorizontal: 8,
    paddingBottom: 34,
  },
  actionContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  cancelButton: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelPressed: {
    backgroundColor: 'rgba(50, 50, 50, 0.95)',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A84FF',
  },
});
