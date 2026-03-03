import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Stack } from 'expo-router';
import { Check, Trash2, Film, Play, Image as ImageIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePhotoStore, formatFileSize, Photo } from '@/lib/photo-store';
import { useColorScheme } from '@/lib/useColorScheme';
import { cn } from '@/lib/cn';
import { DeleteConfirmation, AnimatedPhotoWrapper } from '@/components/DeleteConfirmation';

// New lighter color palette
const COLORS = {
  primary: '#5ED3E5',
  largeFiles: '#FBBF24', // Amber for large files
  success: '#6DD5A0',
  delete: '#FF7B7B',
  bgLight: '#F7F9FC',
  bgDark: '#1A1F2E',
  cardLight: '#FFFFFF',
  cardDark: '#252D3D',
};

function AnimatedLargeFileItem({
  file,
  isDark,
  isSelected,
  isDeleting,
  onPress,
}: {
  file: Photo;
  isDark: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  onPress: () => void;
}) {
  const isVideo = file.type === 'video';

  return (
    <AnimatedPhotoWrapper isDeleting={isDeleting}>
      <Pressable
        onPress={onPress}
        className={cn(
          'mb-3 rounded-2xl overflow-hidden flex-row',
          isDark ? 'bg-gray-800' : 'bg-white',
          isSelected && 'border-2 border-amber-500'
        )}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Thumbnail */}
        <View className="relative">
          <Image
            source={{ uri: file.uri }}
            className="w-24 h-24"
          />
          {isVideo ? (
            <View className="absolute inset-0 items-center justify-center bg-black/30">
              <View className="w-10 h-10 rounded-full bg-white/90 items-center justify-center">
                <Play size={20} color="#111" fill="#111" />
              </View>
            </View>
          ) : null}
        </View>

        {/* Info */}
        <View className="flex-1 p-3 justify-center">
          <View className="flex-row items-center mb-1">
            {isVideo ? (
              <Film size={14} color={COLORS.largeFiles} />
            ) : (
              <ImageIcon size={14} color={COLORS.largeFiles} />
            )}
            <Text className={cn(
              'text-xs ml-1',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}>
              {isVideo ? 'Video' : 'Photo'}
            </Text>
          </View>

          <Text
            className={cn(
              'text-base font-medium mb-1',
              isDark ? 'text-white' : 'text-gray-900'
            )}
            numberOfLines={1}
          >
            {file.filename}
          </Text>

          <View className="flex-row items-center">
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${COLORS.largeFiles}20` }}>
              <Text style={{ color: COLORS.largeFiles }} className="text-sm font-bold">
                {formatFileSize(file.fileSize)}
              </Text>
            </View>
            <Text className={cn(
              'text-xs ml-2',
              isDark ? 'text-gray-500' : 'text-gray-400'
            )}>
              {file.width} x {file.height}
            </Text>
          </View>
        </View>

        {/* Selection indicator */}
        <View className="p-3 justify-center">
          <View
            className={cn(
              'w-6 h-6 rounded-full items-center justify-center'
            )}
            style={{ backgroundColor: isSelected ? COLORS.largeFiles : (isDark ? '#374151' : '#E5E7EB') }}
          >
            {isSelected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
          </View>
        </View>
      </Pressable>
    </AnimatedPhotoWrapper>
  );
}

export default function LargeFilesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const largeFiles = usePhotoStore(s => s.largeFiles);
  const selectedPhotoIds = usePhotoStore(s => s.selectedPhotoIds);
  const togglePhotoSelection = usePhotoStore(s => s.togglePhotoSelection);
  const deleteSelectedPhotos = usePhotoStore(s => s.deleteSelectedPhotos);
  const photos = usePhotoStore(s => s.photos);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingPhotoIds, setDeletingPhotoIds] = useState<Set<string>>(new Set());

  const selectedCount = selectedPhotoIds.size;
  const selectedSize = photos
    .filter(p => selectedPhotoIds.has(p.id))
    .reduce((sum, p) => sum + p.fileSize, 0);

  const totalLargeFilesSize = largeFiles.reduce((sum, p) => sum + p.fileSize, 0);

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
          title: 'Large Files',
        }}
      />

      {largeFiles.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className={cn(
            'rounded-full p-5 mb-4'
          )}
          style={{ backgroundColor: isDark ? COLORS.cardDark : `${COLORS.largeFiles}15` }}
          >
            <Film size={40} color={COLORS.largeFiles} />
          </View>
          <Text className={cn(
            'text-lg font-semibold text-center mb-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            No Large Files Found
          </Text>
          <Text className={cn(
            'text-base text-center',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            Scan your photos from the Home tab to find large files
          </Text>
        </View>
      ) : (
        <>
          {/* Summary bar */}
          <View className={cn(
            'mx-4 mt-4 mb-2 p-3 rounded-xl flex-row justify-between items-center'
          )}
          style={{ backgroundColor: isDark ? COLORS.cardDark : `${COLORS.largeFiles}15` }}
          >
            <Text className={cn(
              'text-sm',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              {largeFiles.length} large files
            </Text>
            <Text style={{ color: COLORS.largeFiles }} className="font-semibold text-sm">
              Total: {formatFileSize(totalLargeFilesSize)}
            </Text>
          </View>

          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {largeFiles.map((file) => {
              const isSelected = selectedPhotoIds.has(file.id);
              const isDeleting = deletingPhotoIds.has(file.id);

              return (
                <AnimatedLargeFileItem
                  key={file.id}
                  file={file}
                  isDark={isDark}
                  isSelected={isSelected}
                  isDeleting={isDeleting}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    togglePhotoSelection(file.id);
                  }}
                />
              );
            })}
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
                style={{ backgroundColor: COLORS.largeFiles }}
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
        accentColor={COLORS.largeFiles}
      />
    </View>
  );
}
