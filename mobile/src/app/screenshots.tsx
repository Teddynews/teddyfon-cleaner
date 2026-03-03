import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Stack } from 'expo-router';
import { Check, Trash2, CheckSquare, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePhotoStore, formatFileSize, Photo } from '@/lib/photo-store';
import { useColorScheme } from '@/lib/useColorScheme';
import { cn } from '@/lib/cn';
import { DeleteConfirmation, AnimatedPhotoWrapper } from '@/components/DeleteConfirmation';

// New lighter color palette
const COLORS = {
  primary: '#5ED3E5',
  screenshots: '#A78BFA', // Purple for screenshots
  success: '#6DD5A0',
  delete: '#FF7B7B',
  bgLight: '#F7F9FC',
  bgDark: '#1A1F2E',
  cardLight: '#FFFFFF',
  cardDark: '#252D3D',
};

function AnimatedScreenshotItem({
  screenshot,
  isDark,
  isSelected,
  isDeleting,
  onPress,
}: {
  screenshot: Photo;
  isDark: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPhotoWrapper isDeleting={isDeleting}>
      <Pressable
        onPress={onPress}
        className="p-1"
        style={{ width: '33.33%' }}
      >
        <View className="relative">
          <Image
            source={{ uri: screenshot.uri }}
            className="w-full aspect-[9/16] rounded-xl"
            style={{
              borderWidth: isSelected ? 3 : 0,
              borderColor: COLORS.screenshots,
            }}
          />

          {/* Selection indicator */}
          <View
            className={cn(
              'absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center'
            )}
            style={{ backgroundColor: isSelected ? COLORS.screenshots : 'rgba(0,0,0,0.4)' }}
          >
            {isSelected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
          </View>

          {/* Info overlay */}
          <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 rounded-b-xl">
            <Text className="text-white text-xs" numberOfLines={1}>
              {screenshot.filename}
            </Text>
            <Text className="text-gray-300 text-xs">
              {formatFileSize(screenshot.fileSize)}
            </Text>
          </View>
        </View>
      </Pressable>
    </AnimatedPhotoWrapper>
  );
}

export default function ScreenshotsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const screenshots = usePhotoStore(s => s.screenshots);
  const selectedPhotoIds = usePhotoStore(s => s.selectedPhotoIds);
  const togglePhotoSelection = usePhotoStore(s => s.togglePhotoSelection);
  const selectAllScreenshots = usePhotoStore(s => s.selectAllScreenshots);
  const clearSelection = usePhotoStore(s => s.clearSelection);
  const deleteSelectedPhotos = usePhotoStore(s => s.deleteSelectedPhotos);
  const photos = usePhotoStore(s => s.photos);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingPhotoIds, setDeletingPhotoIds] = useState<Set<string>>(new Set());

  const selectedCount = selectedPhotoIds.size;
  const selectedSize = photos
    .filter(p => selectedPhotoIds.has(p.id))
    .reduce((sum, p) => sum + p.fileSize, 0);

  const totalScreenshotsSize = screenshots.reduce((sum, p) => sum + p.fileSize, 0);
  const allSelected = screenshots.length > 0 && screenshots.every(s => selectedPhotoIds.has(s.id));

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (allSelected) {
      clearSelection();
    } else {
      selectAllScreenshots();
    }
  };

  const confirmDelete = () => {
    if (selectedCount === 0) return;
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirmation(false);
    setIsDeleting(true);

    // Mark all selected photos as deleting for animation
    setDeletingPhotoIds(new Set(selectedPhotoIds));

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 250));

    // Actually delete
    await deleteSelectedPhotos();

    // Success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setIsDeleting(false);
    setDeletingPhotoIds(new Set());
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
  };

  return (
    <View className={cn('flex-1')} style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.bgLight }}>
      <Stack.Screen
        options={{
          title: 'Screenshots',
          headerRight: () => (
            <Pressable onPress={handleSelectAll} className="flex-row items-center">
              <CheckSquare size={18} color={COLORS.screenshots} />
              <Text style={{ color: COLORS.screenshots }} className="text-base ml-1">
                {allSelected ? 'Deselect' : 'Select All'}
              </Text>
            </Pressable>
          ),
        }}
      />

      {screenshots.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className={cn(
            'rounded-full p-5 mb-4'
          )}
          style={{ backgroundColor: isDark ? COLORS.cardDark : `${COLORS.screenshots}15` }}
          >
            <Camera size={40} color={COLORS.screenshots} />
          </View>
          <Text className={cn(
            'text-lg font-semibold text-center mb-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            No Screenshots Found
          </Text>
          <Text className={cn(
            'text-base text-center',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            Scan your photos from the Home tab to find screenshots
          </Text>
        </View>
      ) : (
        <>
          {/* Summary bar */}
          <View className={cn(
            'mx-4 mt-4 mb-2 p-3 rounded-xl flex-row justify-between items-center'
          )}
          style={{ backgroundColor: isDark ? COLORS.cardDark : `${COLORS.screenshots}15` }}
          >
            <Text className={cn(
              'text-sm',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              {screenshots.length} screenshots
            </Text>
            <Text style={{ color: COLORS.screenshots }} className="font-semibold text-sm">
              Total: {formatFileSize(totalScreenshotsSize)}
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          >
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -4, marginTop: 8 }}>
              {screenshots.map((screenshot) => {
                const isSelected = selectedPhotoIds.has(screenshot.id);
                const isDeleting = deletingPhotoIds.has(screenshot.id);

                return (
                  <AnimatedScreenshotItem
                    key={screenshot.id}
                    screenshot={screenshot}
                    isDark={isDark}
                    isSelected={isSelected}
                    isDeleting={isDeleting}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      togglePhotoSelection(screenshot.id);
                    }}
                  />
                );
              })}
            </View>
          </ScrollView>

          {/* Delete button */}
          {selectedCount > 0 ? (
            <View
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{
                backgroundColor: isDark ? 'rgba(26, 31, 46, 0.95)' : 'rgba(247, 249, 252, 0.95)',
              }}
            >
              <Pressable
                onPress={confirmDelete}
                className="rounded-xl py-4 flex-row items-center justify-center"
                style={{ backgroundColor: COLORS.screenshots }}
                disabled={isDeleting}
              >
                <Trash2 size={20} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">
                  {isDeleting ? 'Deleting...' : `Delete ${selectedCount} (${formatFileSize(selectedSize)})`}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}

      <DeleteConfirmation
        visible={showDeleteConfirmation}
        photoCount={selectedCount}
        sizeToFree={formatFileSize(selectedSize)}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        accentColor={COLORS.screenshots}
      />
    </View>
  );
}
