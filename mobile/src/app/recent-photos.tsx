import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Stack } from 'expo-router';
import { Check, Trash2, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePhotoStore, formatFileSize, Photo } from '@/lib/photo-store';
import { useColorScheme } from '@/lib/useColorScheme';
import { cn } from '@/lib/cn';
import { DeleteConfirmation, AnimatedPhotoWrapper } from '@/components/DeleteConfirmation';

function AnimatedPhotoItem({
  photo,
  isDark,
  isSelected,
  isDeleting,
  onPress,
}: {
  photo: Photo;
  isDark: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  onPress: () => void;
}) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <AnimatedPhotoWrapper isDeleting={isDeleting}>
      <Pressable
        onPress={onPress}
        className="p-1"
        style={{ width: '33.33%' }}
      >
        <View className="relative">
          <Image
            source={{ uri: photo.uri }}
            className="w-full aspect-square rounded-xl"
            style={{
              borderWidth: isSelected ? 3 : 0,
              borderColor: '#10B981',
            }}
          />

          {/* Selection indicator */}
          <View
            className={cn(
              'absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center',
              isSelected ? 'bg-emerald-500' : 'bg-black/40'
            )}
          >
            {isSelected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
          </View>

          {/* Info overlay */}
          <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 rounded-b-xl">
            <Text className="text-white text-xs" numberOfLines={1}>
              {formatDate(photo.createdAt)}
            </Text>
            <Text className="text-gray-300 text-xs">
              {formatFileSize(photo.fileSize)}
            </Text>
          </View>
        </View>
      </Pressable>
    </AnimatedPhotoWrapper>
  );
}

export default function RecentPhotosScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const recentPhotos = usePhotoStore(s => s.recentPhotos);
  const selectedPhotoIds = usePhotoStore(s => s.selectedPhotoIds);
  const togglePhotoSelection = usePhotoStore(s => s.togglePhotoSelection);
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

  const totalSize = recentPhotos.reduce((sum, p) => sum + p.fileSize, 0);

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
    <View className={cn('flex-1', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
      <Stack.Screen
        options={{
          title: 'Recent Photos',
          headerRight: () => selectedCount > 0 ? (
            <Pressable onPress={clearSelection}>
              <Text className="text-emerald-500 text-base">Clear</Text>
            </Pressable>
          ) : null,
        }}
      />

      {recentPhotos.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className={cn(
            'rounded-full p-5 mb-4',
            isDark ? 'bg-gray-800' : 'bg-emerald-50'
          )}>
            <Clock size={40} color="#10B981" />
          </View>
          <Text className={cn(
            'text-lg font-semibold text-center mb-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            No Recent Photos
          </Text>
          <Text className={cn(
            'text-base text-center',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            No photos from the last 7 days were found
          </Text>
        </View>
      ) : (
        <>
          {/* Summary bar */}
          <View className={cn(
            'mx-4 mt-4 mb-2 p-3 rounded-xl flex-row justify-between items-center',
            isDark ? 'bg-gray-800' : 'bg-emerald-50'
          )}>
            <Text className={cn(
              'text-sm',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              {recentPhotos.length} recent photos
            </Text>
            <Text className="text-emerald-500 font-semibold text-sm">
              Total: {formatFileSize(totalSize)}
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          >
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -4, marginTop: 8 }}>
              {recentPhotos.map((photo) => {
                const isSelected = selectedPhotoIds.has(photo.id);
                const isPhotoDeleting = deletingPhotoIds.has(photo.id);

                return (
                  <AnimatedPhotoItem
                    key={photo.id}
                    photo={photo}
                    isDark={isDark}
                    isSelected={isSelected}
                    isDeleting={isPhotoDeleting}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      togglePhotoSelection(photo.id);
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
                backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <Pressable
                onPress={confirmDelete}
                className="bg-emerald-500 rounded-xl py-4 flex-row items-center justify-center"
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
        accentColor="#10B981"
      />
    </View>
  );
}
