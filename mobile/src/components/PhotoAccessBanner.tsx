import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Images, AlertCircle } from 'lucide-react-native';

interface PhotoAccessBannerProps {
  onAccessGranted?: (photoCount: number) => void;
}

export function PhotoAccessBanner({ onAccessGranted }: PhotoAccessBannerProps) {
  const insets = useSafeAreaInsets();
  const [bannerState, setBannerState] = useState<{
    visible: boolean;
    hasAccess: boolean;
    photoCount: number;
    message: string;
  }>({
    visible: false,
    hasAccess: false,
    photoCount: 0,
    message: '',
  });

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const hideBanner = () => {
    setBannerState(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const checkPhotoAccess = async () => {
      try {
        // Check current permission status
        const { status } = await MediaLibrary.getPermissionsAsync();

        if (status === 'granted') {
          // Get photo count
          const assets = await MediaLibrary.getAssetsAsync({
            mediaType: ['photo', 'video'],
            first: 1,
          });

          const totalCount = assets.totalCount;
          const formattedCount = totalCount.toLocaleString();

          setBannerState({
            visible: true,
            hasAccess: true,
            photoCount: totalCount,
            message: `Access granted: ${formattedCount} photos found`,
          });

          if (onAccessGranted) {
            onAccessGranted(totalCount);
          }
        } else if (status === 'denied') {
          setBannerState({
            visible: true,
            hasAccess: false,
            photoCount: 0,
            message: 'Photo library access denied',
          });
        } else {
          // Request permission
          const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();

          if (newStatus === 'granted') {
            const assets = await MediaLibrary.getAssetsAsync({
              mediaType: ['photo', 'video'],
              first: 1,
            });

            const totalCount = assets.totalCount;
            const formattedCount = totalCount.toLocaleString();

            setBannerState({
              visible: true,
              hasAccess: true,
              photoCount: totalCount,
              message: `Access granted: ${formattedCount} photos found`,
            });

            if (onAccessGranted) {
              onAccessGranted(totalCount);
            }
          } else {
            setBannerState({
              visible: true,
              hasAccess: false,
              photoCount: 0,
              message: 'Photo library access required',
            });
          }
        }

        // Animate in
        translateY.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(1, { duration: 300 });

        // Auto-hide after 5 seconds
        translateY.value = withDelay(
          5000,
          withTiming(-100, { duration: 300 }, (finished) => {
            if (finished) {
              runOnJS(hideBanner)();
            }
          })
        );
        opacity.value = withDelay(5000, withTiming(0, { duration: 300 }));
      } catch (error) {
        console.error('Error checking photo access:', error);
        setBannerState({
          visible: true,
          hasAccess: false,
          photoCount: 0,
          message: 'Error accessing photo library',
        });

        translateY.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(1, { duration: 300 });

        translateY.value = withDelay(
          5000,
          withTiming(-100, { duration: 300 }, (finished) => {
            if (finished) {
              runOnJS(hideBanner)();
            }
          })
        );
        opacity.value = withDelay(5000, withTiming(0, { duration: 300 }));
      }
    };

    checkPhotoAccess();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!bannerState.visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 8 },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        {bannerState.hasAccess ? (
          <Images size={20} color="#111827" style={styles.icon} />
        ) : (
          <AlertCircle size={20} color="#dc2626" style={styles.icon} />
        )}
        <Text
          style={[
            styles.text,
            !bannerState.hasAccess && styles.errorText,
          ]}
        >
          {bannerState.message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  errorText: {
    color: '#dc2626',
  },
});
