import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Stack } from 'expo-router';
import { Check, Star, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePhotoStore, formatFileSize, PhotoGroup, Photo } from '@/lib/photo-store';
import { useColorScheme } from '@/lib/useColorScheme';
import { cn } from '@/lib/cn';
import { DeleteConfirmation, AnimatedPhotoWrapper } from '@/components/DeleteConfirmation';

function AnimatedPhotoItem({
  photo,
  isDark,
  group,
  isSelected,
  isBest,
  isDeleting,
  onPress,
  onLongPress,
}: {
  photo: Photo;
  isDark: boolean;
  group: PhotoGroup;
  isSelected: boolean;
  isBest: boolean;
  isDeleting: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <AnimatedPhotoWrapper isDeleting={isDeleting}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        className="p-1"
        style={{ width: '33.33%' }}
      >
        <View className="relative">
          <Image
            source={{ uri: photo.uri }}
            className="w-full aspect-square rounded-xl"
            style={{
              borderWidth: isSelected ? 3 : 0,
              borderColor: '#14B8A6',
            }}
          />

          {/* Best badge */}
          {isBest ? (
            <View className="absolute top-2 left-2 bg-teal-500 px-2 py-1 rounded-full flex-row items-center">
              <Star size={12} color="#fff" fill="#fff" />
              <Text className="text-white text-xs font-bold ml-1">Keep</Text>
            </View>
          ) : null}

          {/* Selection indicator */}
          <View
            className={cn(
              'absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center',
              isSelected ? 'bg-teal-500' : 'bg-black/40'
            )}
          >
            {isSelected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
          </View>

          {/* Size label */}
          <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded">
            <Text className="text-white text-xs">{formatFileSize(photo.fileSize)}</Text>
          </View>
        </View>
      </Pressable>
    </AnimatedPhotoWrapper>
  );
}

function DuplicateGroupCard({
  group,
  isDark,
  expandedGroupId,
  setExpandedGroupId,
  deletingPhotoIds,
}: {
  group: PhotoGroup;
  isDark: boolean;
  expandedGroupId: string | null;
  setExpandedGroupId: (id: string | null) => void;
  deletingPhotoIds: Set<string>;
}) {
  const selectedPhotoIds = usePhotoStore(s => s.selectedPhotoIds);
  const togglePhotoSelection = usePhotoStore(s => s.togglePhotoSelection);
  const selectAllExceptBest = usePhotoStore(s => s.selectAllExceptBest);
  const markAsBest = usePhotoStore(s => s.markAsBest);

  const isExpanded = expandedGroupId === group.id;
  const selectedInGroup = group.photos.filter(p => selectedPhotoIds.has(p.id)).length;
  const duplicatesSize = group.photos
    .filter(p => p.id !== group.bestPhotoId)
    .reduce((sum, p) => sum + p.fileSize, 0);

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedGroupId(isExpanded ? null : group.id);
  };

  return (
    <Pressable
      onPress={toggleExpand}
      className={cn(
        'mx-4 mb-3 rounded-2xl overflow-hidden',
        isDark ? 'bg-gray-800' : 'bg-white'
      )}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {/* Preview thumbnails */}
            <View className="flex-row mr-3" style={{ width: 72 }}>
              {group.photos.slice(0, 3).map((photo, idx) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.uri }}
                  className="w-10 h-10 rounded-lg"
                  style={{
                    marginLeft: idx > 0 ? -12 : 0,
                    borderWidth: 2,
                    borderColor: isDark ? '#1f2937' : '#fff',
                  }}
                />
              ))}
            </View>

            <View className="flex-1">
              <Text className={cn(
                'text-base font-semibold',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {group.photos.length} Duplicates
              </Text>
              <Text className={cn(
                'text-sm',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )}>
                Can free {formatFileSize(duplicatesSize)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            {selectedInGroup > 0 && (
              <View className="bg-teal-500/20 px-2 py-1 rounded-full mr-2">
                <Text className="text-teal-500 text-xs font-bold">{selectedInGroup}</Text>
              </View>
            )}
            {isExpanded ? (
              <ChevronUp size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            ) : (
              <ChevronDown size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            )}
          </View>
        </View>

        {/* Quick action */}
        {!isExpanded && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              selectAllExceptBest(group.id);
            }}
            className="mt-3 bg-teal-500/10 py-2 rounded-xl"
          >
            <Text className="text-teal-500 text-center font-semibold text-sm">
              Select All Except Best
            </Text>
          </Pressable>
        )}
      </View>

      {/* Expanded photos grid */}
      {isExpanded ? (
        <View className="px-4 pb-4">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              selectAllExceptBest(group.id);
            }}
            className="mb-3 bg-teal-500/10 py-2 rounded-xl"
          >
            <Text className="text-teal-500 text-center font-semibold text-sm">
              Select All Except Best
            </Text>
          </Pressable>

          <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
            {group.photos.map((photo) => {
              const isSelected = selectedPhotoIds.has(photo.id);
              const isBest = photo.id === group.bestPhotoId;
              const isDeleting = deletingPhotoIds.has(photo.id);

              return (
                <AnimatedPhotoItem
                  key={photo.id}
                  photo={photo}
                  isDark={isDark}
                  group={group}
                  isSelected={isSelected}
                  isBest={isBest}
                  isDeleting={isDeleting}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    togglePhotoSelection(photo.id);
                  }}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    markAsBest(group.id, photo.id);
                  }}
                />
              );
            })}
          </View>

          <Text className={cn(
            'text-xs text-center mt-2',
            isDark ? 'text-gray-500' : 'text-gray-400'
          )}>
            Long press to mark as Best
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function DuplicatesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const duplicates = usePhotoStore(s => s.duplicates);
  const selectedPhotoIds = usePhotoStore(s => s.selectedPhotoIds);
  const photos = usePhotoStore(s => s.photos);
  const deleteSelectedPhotos = usePhotoStore(s => s.deleteSelectedPhotos);

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingPhotoIds, setDeletingPhotoIds] = useState<Set<string>>(new Set());

  const selectedCount = selectedPhotoIds.size;
  const selectedSize = photos
    .filter(p => selectedPhotoIds.has(p.id))
    .reduce((sum, p) => sum + p.fileSize, 0);

  const totalDuplicatesSize = duplicates.reduce((sum, g) => {
    const duplicateSizes = g.photos
      .filter(p => p.id !== g.bestPhotoId)
      .reduce((s, p) => s + p.fileSize, 0);
    return sum + duplicateSizes;
  }, 0);

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
          title: 'Duplicates',
        }}
      />

      {duplicates.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className={cn(
            'rounded-full p-5 mb-4',
            isDark ? 'bg-gray-800' : 'bg-teal-50'
          )}>
            <Copy size={40} color="#14B8A6" />
          </View>
          <Text className={cn(
            'text-lg font-semibold text-center mb-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            No Duplicates Found
          </Text>
          <Text className={cn(
            'text-base text-center',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            Scan your photos from the Home tab to find duplicate files
          </Text>
        </View>
      ) : (
        <>
          {/* Summary bar */}
          <View className={cn(
            'mx-4 mt-4 mb-2 p-3 rounded-xl flex-row justify-between items-center',
            isDark ? 'bg-gray-800' : 'bg-teal-50'
          )}>
            <Text className={cn(
              'text-sm',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              {duplicates.length} duplicate groups found
            </Text>
            <Text className="text-teal-500 font-semibold text-sm">
              Free up to {formatFileSize(totalDuplicatesSize)}
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
          >
            {duplicates.map((group) => (
              <DuplicateGroupCard
                key={group.id}
                group={group}
                isDark={isDark}
                expandedGroupId={expandedGroupId}
                setExpandedGroupId={setExpandedGroupId}
                deletingPhotoIds={deletingPhotoIds}
              />
            ))}
          </ScrollView>

          {/* Delete button */}
          {selectedCount > 0 && (
            <View
              className="absolute bottom-0 left-0 right-0 p-4"
              style={{
                backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <Pressable
                onPress={confirmDelete}
                className="bg-teal-500 rounded-xl py-4 flex-row items-center justify-center"
                disabled={isDeleting}
              >
                <Trash2 size={20} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">
                  {isDeleting ? 'Deleting...' : `Delete ${selectedCount} (${formatFileSize(selectedSize)})`}
                </Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      <DeleteConfirmation
        visible={showDeleteConfirmation}
        photoCount={selectedCount}
        sizeToFree={formatFileSize(selectedSize)}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        accentColor="#14B8A6"
      />
    </View>
  );
}
