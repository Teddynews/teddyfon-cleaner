import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  DimensionValue,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  showCloseButton?: boolean;
  showHandle?: boolean;
  maxHeight?: DimensionValue;
}

/**
 * GlassModal - A glassmorphism-styled bottom sheet modal
 *
 * Slides up from the bottom with a glass effect background.
 * Supports drag-to-dismiss gesture and optional close button.
 */
export function GlassModal({
  visible,
  onClose,
  title,
  children,
  style,
  showCloseButton = true,
  showHandle = true,
  maxHeight = '80%',
}: GlassModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
      });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    overlayOpacity.value = withTiming(0, { duration: 150 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        overlayOpacity.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
      }
    });

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Overlay */}
          <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          </Animated.View>

          {/* Modal Content */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.modalContainer,
                modalAnimatedStyle,
                { maxHeight, paddingBottom: insets.bottom + GLASS_THEME.spacing.lg },
                style,
              ]}
            >
              {/* Blur background */}
              <BlurView
                intensity={GLASS_THEME.blur.intensityHeavy}
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

              {/* Handle */}
              {showHandle ? (
                <View style={styles.handleContainer}>
                  <View
                    style={[
                      styles.handle,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(0, 0, 0, 0.2)',
                      },
                    ]}
                  />
                </View>
              ) : null}

              {/* Header */}
              {title || showCloseButton ? (
                <View style={styles.header}>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: isDark
                          ? GLASS_THEME.colors.textPrimaryDark
                          : GLASS_THEME.colors.textPrimaryLight,
                      },
                    ]}
                  >
                    {title}
                  </Text>
                  {showCloseButton ? (
                    <Pressable
                      onPress={handleClose}
                      style={({ pressed }) => [
                        styles.closeButton,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.05)',
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <X
                        size={20}
                        color={
                          isDark
                            ? GLASS_THEME.colors.textSecondaryDark
                            : GLASS_THEME.colors.textSecondaryLight
                        }
                      />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {/* Content */}
              <View style={styles.content}>{children}</View>
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: GLASS_THEME.radius.xxl,
    borderTopRightRadius: GLASS_THEME.radius.xxl,
    overflow: 'hidden',
    ...GLASS_THEME.shadows.heavy,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: GLASS_THEME.spacing.md,
    paddingBottom: GLASS_THEME.spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GLASS_THEME.spacing.xl,
    paddingVertical: GLASS_THEME.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: GLASS_THEME.spacing.xl,
  },
});

export default GlassModal;
