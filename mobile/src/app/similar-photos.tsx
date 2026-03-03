import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Check, Star, Trash2, ChevronDown, ChevronUp, Layers } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { usePhotoStore, formatFileSize, PhotoGroup, Photo } from '@/lib/photo-store';
import { useColorScheme } from '@/lib/useColorScheme';
import { cn } from '@/lib/cn';
import { SwipeCardStack } from '@/components/SwipeCard';
import { DeleteConfirmation, AnimatedPhotoWrapper } from '@/components/DeleteConfirmation';

// New lighter color palette
const COLORS = {
  primary: '#5ED3E5', // Light teal/turquoise
  secondary: '#FBF5D9', // Warm cream/beige
  success: '#6DD5A0', // Light green
  delete: '#FF7B7B', // Soft coral/red
  bgLight: '#F7F9FC',
  bgDark: '#1A1F2E',
  cardLight: '#FFFFFF',
  cardDark: '#252D3D',
};

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
              borderColor: '#ef4444',
            }}
          />

          {/* Best badge */}
          {isBest ? (
            <View className="absolute top-2 left-2 bg-yellow-500 px-2 py-1 rounded-full flex-row items-center">
              <Star size={12} color="#fff" fill="#fff" />
              <Text className="text-white text-xs font-bold ml-1">Best</Text>
            </View>
          ) : null}

          {/* Selection indicator */}
          <View
            className={cn(
              'absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center',
              isSelected ? 'bg-red-500' : 'bg-black/40'
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

function PhotoGroupCard({
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
                {group.photos.length} Similar Photos
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
              <View className="bg-red-500/20 px-2 py-1 rounded-full mr-2">
                <Text className="text-red-500 text-xs font-bold">{selectedInGroup}</Text>
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
            className="mt-3 py-2 rounded-xl"
            style={{ backgroundColor: `${COLORS.primary}15` }}
          >
            <Text style={{ color: COLORS.primary }} className="text-center font-semibold text-sm">
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
            className="mb-3 py-2 rounded-xl"
            style={{ backgroundColor: `${COLORS.primary}15` }}
          >
            <Text style={{ color: COLORS.primary }} className="text-center font-semibold text-sm">
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

export default function SimilarPhotosScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const similarGroups = usePhotoStore(s => s.similarGroups);
  const selectedPhotoIds = usePhotoStore(s => s.selectedPhotoIds);
  const photos = usePhotoStore(s => s.photos);
  const clearSelection = usePhotoStore(s => s.clearSelection);
  const deleteSelectedPhotos = usePhotoStore(s => s.deleteSelectedPhotos);
  const selectPhoto = usePhotoStore(s => s.selectPhoto);

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [swipeQueue, setSwipeQueue] = useState<Photo[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingPhotoIds, setDeletingPhotoIds] = useState<Set<string>>(new Set());

  const selectedCount = selectedPhotoIds.size;
  const selectedSize = photos
    .filter(p => selectedPhotoIds.has(p.id))
    .reduce((sum, p) => sum + p.fileSize, 0);

  const totalDuplicatesSize = similarGroups.reduce((sum, g) => {
    const duplicateSizes = g.photos
      .filter(p => p.id !== g.bestPhotoId)
      .reduce((s, p) => s + p.fileSize, 0);
    return sum + duplicateSizes;
  }, 0);

  const startSwipeMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Flatten all photos from groups for swipe mode
    const allPhotos = similarGroups.flatMap(g => g.photos);
    setSwipeQueue(allPhotos);
    setIsSwipeMode(true);
  };

  const handleSwipeLeft = (photo: Photo) => {
    selectPhoto(photo.id);
    setSwipeQueue(prev => prev.filter(p => p.id !== photo.id));
  };

  const handleSwipeRight = (photo: Photo) => {
    setSwipeQueue(prev => prev.filter(p => p.id !== photo.id));
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

    if (isSwipeMode) {
      setIsSwipeMode(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
  };

  if (isSwipeMode) {
    return (
      <View className={cn('flex-1')} style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.bgLight }}>
        <Stack.Screen
          options={{
            title: 'Swipe Mode',
            headerLeft: () => (
              <Pressable
                onPress={() => setIsSwipeMode(false)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: pressed ? `${COLORS.primary}15` : 'transparent',
                })}
              >
                <Text style={{ color: COLORS.primary }} className="text-base font-semibold">Done</Text>
              </Pressable>
            ),
          }}
        />

        <View className="flex-1 px-5 py-4">
          <SwipeCardStack
            photos={swipeQueue}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        </View>

        {selectedCount > 0 && (
          <Pressable
            onPress={confirmDelete}
            className="mx-4 mb-8 rounded-xl py-4 flex-row items-center justify-center"
            style={{ backgroundColor: COLORS.delete }}
          >
            <Trash2 size={20} color="#fff" />
            <Text className="text-white font-bold text-base ml-2">
              Delete {selectedCount} ({formatFileSize(selectedSize)})
            </Text>
          </Pressable>
        )}

        <DeleteConfirmation
          visible={showDeleteConfirmation}
          photoCount={selectedCount}
          sizeToFree={formatFileSize(selectedSize)}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          accentColor={COLORS.delete}
        />
      </View>
    );
  }

  return (
    <View className={cn('flex-1')} style={{ backgroundColor: isDark ? COLORS.bgDark : COLORS.bgLight }}>
      <Stack.Screen
        options={{
          title: 'Similar Photos',
          headerRight: () => (
            <Pressable
              onPress={startSwipeMode}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.primary,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: pressed ? `${COLORS.primary}15` : 'transparent',
              })}
            >
              <Layers size={18} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary }} className="text-base font-semibold ml-1">Swipe</Text>
            </Pressable>
          ),
        }}
      />

      {similarGroups.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className={cn(
            'rounded-full p-5 mb-4'
          )}
          style={{ backgroundColor: isDark ? COLORS.cardDark : `${COLORS.primary}15` }}
          >
            <Check size={40} color={COLORS.primary} />
          </View>
          <Text className={cn(
            'text-lg font-semibold text-center mb-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            No Similar Photos Found
          </Text>
          <Text className={cn(
            'text-base text-center',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}>
            Scan your photos from the Home tab to find similar photos
          </Text>
        </View>
      ) : (
        <>
          {/* Summary bar */}
          <View className={cn(
            'mx-4 mt-4 mb-2 p-3 rounded-xl flex-row justify-between items-center'
          )}
          style={{ backgroundColor: isDark ? COLORS.cardDark : `${COLORS.primary}15` }}
          >
            <Text className={cn(
              'text-sm',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              {similarGroups.length} groups found
            </Text>
            <Text style={{ color: COLORS.primary }} className="font-semibold text-sm">
              Free up to {formatFileSize(totalDuplicatesSize)}
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
          >
            {similarGroups.map((group) => (
              <PhotoGroupCard
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
                backgroundColor: isDark ? 'rgba(26, 31, 46, 0.95)' : 'rgba(247, 249, 252, 0.95)',
              }}
            >
              <Pressable
                onPress={confirmDelete}
                className="rounded-xl py-4 flex-row items-center justify-center"
                style={{ backgroundColor: COLORS.delete }}
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
        accentColor={COLORS.delete}
      />
    </View>
  );
}
