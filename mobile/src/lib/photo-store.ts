import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

// Types
export interface Photo {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  fileSize: number; // in bytes
  createdAt: Date;
  type: 'photo' | 'video' | 'screenshot';
  groupId?: string;
}

export interface PhotoGroup {
  id: string;
  photos: Photo[];
  bestPhotoId: string;
  totalSize: number;
}

export interface CleanupStats {
  totalPhotosScanned: number;
  photosDeleted: number;
  spaceSaved: number; // in bytes
  lastCleanupDate: Date | null;
}

// Category types for Tinder filter - expanded
export type CategoryType = 'all' | 'similar' | 'screenshots' | 'large' | 'old' | 'recent' | 'blurry' | 'duplicates';

export interface CategoryInfo {
  id: CategoryType;
  name: string;
  count: number;
}

interface PhotoStore {
  // State
  photos: Photo[];
  selectedPhotoIds: Set<string>;
  similarGroups: PhotoGroup[];
  screenshots: Photo[];
  largeFiles: Photo[];
  oldPhotos: Photo[];
  recentPhotos: Photo[];
  blurryPhotos: Photo[];
  duplicates: PhotoGroup[];
  deletedPhotos: Photo[]; // Photos marked for deletion (trash)
  isLoading: boolean;
  isScanning: boolean;
  scanProgress: number;
  stats: CleanupStats;
  hasPermission: boolean;
  firstScanLimited: boolean;
  totalDevicePhotos: number;

  // Tinder mode state
  tinderFilterCategory: CategoryType;

  // Actions
  loadMockPhotos: () => void;
  scanPhotos: () => Promise<void>;
  selectPhoto: (id: string) => void;
  deselectPhoto: (id: string) => void;
  togglePhotoSelection: (id: string) => void;
  selectAllInGroup: (groupId: string) => void;
  selectAllExceptBest: (groupId: string) => void;
  selectAllScreenshots: () => void;
  clearSelection: () => void;
  deleteSelectedPhotos: () => Promise<void>;
  markAsBest: (groupId: string, photoId: string) => void;
  getSelectedCount: () => number;
  getSelectedSize: () => number;
  loadStats: () => Promise<void>;
  saveStats: () => Promise<void>;
  refreshAllArrays: () => void;

  // Deleted photos actions
  restorePhoto: (id: string) => void;
  permanentlyDeletePhotos: () => Promise<void>;
  clearDeletedPhotos: () => void;

  // Tinder mode actions
  setTinderFilterCategory: (category: CategoryType) => void;
  getShuffledPhotos: () => Photo[];
  getShuffledPhotosByCategory: (category: CategoryType) => Photo[];
  getCategories: () => CategoryInfo[];
}

// Screen dimension ratios for screenshot detection
const SCREEN_RATIOS = [
  { ratio: 844 / 390, name: 'iPhone 12/13/14' },
  { ratio: 926 / 428, name: 'iPhone 12/13/14 Pro Max' },
  { ratio: 896 / 414, name: 'iPhone XR/11' },
  { ratio: 812 / 375, name: 'iPhone X/XS/11 Pro' },
  { ratio: 736 / 414, name: 'iPhone 8 Plus' },
  { ratio: 667 / 375, name: 'iPhone 8' },
  { ratio: 2778 / 1284, name: 'iPhone 12 Pro Max' },
  { ratio: 2532 / 1170, name: 'iPhone 12' },
  { ratio: 2340 / 1080, name: 'Android FHD+' },
  { ratio: 1920 / 1080, name: 'Android FHD' },
  { ratio: 2400 / 1080, name: 'Android 20:9' },
];

const isScreenshotRatio = (width: number, height: number): boolean => {
  // Use portrait orientation
  const w = Math.min(width, height);
  const h = Math.max(width, height);
  const ratio = h / w;

  // Check if ratio matches any known screen ratio (with 5% tolerance)
  return SCREEN_RATIOS.some(screen => Math.abs(ratio - screen.ratio) < 0.1);
};

const isScreenshot = (photo: { filename: string; width: number; height: number }): boolean => {
  const filename = photo.filename.toLowerCase();

  // Check filename patterns
  if (filename.includes('screenshot') || filename.includes('screen_shot')) {
    return true;
  }

  // Check for screen recording patterns
  if (filename.includes('screen_recording') || filename.includes('screenrecording')) {
    return true;
  }

  // Check for common screenshot naming patterns
  if (filename.startsWith('img_') && filename.includes('screenshot')) {
    return true;
  }

  // Check ratio
  return isScreenshotRatio(photo.width, photo.height);
};

// Helper to generate mock photos (fallback)
const generateMockPhotos = (): Photo[] => {
  const photos: Photo[] = [];
  let id = 1;

  // Generate 20 groups of similar photos (3-5 photos each)
  for (let group = 1; group <= 20; group++) {
    const photosInGroup = Math.floor(Math.random() * 3) + 3; // 3-5 photos
    const baseTime = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const baseSize = Math.floor(Math.random() * 3000000) + 500000; // 0.5-3.5 MB

    for (let i = 0; i < photosInGroup; i++) {
      const photoId = `photo-${id}`;
      photos.push({
        id: photoId,
        uri: `https://picsum.photos/seed/${group}-${i}/800/600`,
        filename: `IMG_${String(id).padStart(4, '0')}.jpg`,
        width: 800,
        height: 600,
        fileSize: baseSize + Math.floor(Math.random() * 200000),
        createdAt: new Date(baseTime.getTime() + i * 1000), // Same minute
        type: 'photo',
        groupId: `group-${group}`,
      });
      id++;
    }
  }

  // Generate 15 screenshots
  for (let i = 0; i < 15; i++) {
    photos.push({
      id: `screenshot-${i + 1}`,
      uri: `https://picsum.photos/seed/screenshot-${i}/390/844`,
      filename: `Screenshot_${String(i + 1).padStart(3, '0')}.png`,
      width: 390,
      height: 844,
      fileSize: Math.floor(Math.random() * 1500000) + 300000, // 0.3-1.8 MB
      createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      type: 'screenshot',
    });
  }

  // Generate 10 large videos/files
  for (let i = 0; i < 10; i++) {
    const isVideo = Math.random() > 0.3;
    photos.push({
      id: `large-${i + 1}`,
      uri: `https://picsum.photos/seed/large-${i}/1920/1080`,
      filename: isVideo ? `VID_${String(i + 1).padStart(4, '0')}.mp4` : `IMG_LARGE_${String(i + 1).padStart(4, '0')}.heic`,
      width: 1920,
      height: 1080,
      fileSize: Math.floor(Math.random() * 200000000) + 50000000, // 50-250 MB
      createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      type: isVideo ? 'video' : 'photo',
    });
  }

  return photos;
};

// Format file size helper
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const STATS_KEY = '@photo_cleaner_stats';
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
const OLD_PHOTO_DAYS = 365; // 1 year
const RECENT_PHOTO_DAYS = 7; // 7 days
const SIMILAR_TIME_THRESHOLD = 30 * 1000; // 30 seconds in milliseconds

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: [],
  selectedPhotoIds: new Set<string>(),
  similarGroups: [],
  screenshots: [],
  largeFiles: [],
  oldPhotos: [],
  recentPhotos: [],
  blurryPhotos: [],
  duplicates: [],
  deletedPhotos: [],
  isLoading: false,
  isScanning: false,
  scanProgress: 0,
  hasPermission: false,
  firstScanLimited: false,
  totalDevicePhotos: 0,
  stats: {
    totalPhotosScanned: 0,
    photosDeleted: 0,
    spaceSaved: 0,
    lastCleanupDate: null,
  },

  // Tinder mode state
  tinderFilterCategory: 'all' as CategoryType,

  loadMockPhotos: () => {
    const photos = generateMockPhotos();

    // Group similar photos
    const groupMap = new Map<string, Photo[]>();
    photos.forEach(photo => {
      if (photo.groupId) {
        const existing = groupMap.get(photo.groupId) || [];
        existing.push(photo);
        groupMap.set(photo.groupId, existing);
      }
    });

    const similarGroups: PhotoGroup[] = Array.from(groupMap.entries()).map(([groupId, groupPhotos]) => {
      // Mark the largest photo as "best"
      const sortedBySize = [...groupPhotos].sort((a, b) => b.fileSize - a.fileSize);
      const bestPhoto = sortedBySize[0];
      return {
        id: groupId,
        photos: groupPhotos,
        bestPhotoId: bestPhoto.id,
        totalSize: groupPhotos.reduce((sum, p) => sum + p.fileSize, 0),
      };
    });

    const screenshots = photos.filter(p => p.type === 'screenshot');
    const largeFiles = photos
      .filter(p => p.fileSize > LARGE_FILE_THRESHOLD)
      .sort((a, b) => b.fileSize - a.fileSize);

    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - OLD_PHOTO_DAYS * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - RECENT_PHOTO_DAYS * 24 * 60 * 60 * 1000);

    const oldPhotos = photos.filter(p => p.createdAt < oneYearAgo);
    const recentPhotos = photos.filter(p => p.createdAt > sevenDaysAgo);

    set({
      photos,
      similarGroups,
      screenshots,
      largeFiles,
      oldPhotos,
      recentPhotos,
      blurryPhotos: [], // Placeholder
      duplicates: [], // Placeholder
    });
  },

  scanPhotos: async () => {
    set({ isScanning: true, scanProgress: 0, firstScanLimited: false, totalDevicePhotos: 0 });

    const MAX_PHOTOS = 10000; // Limit to 10k for faster scanning
    const BATCH_SIZE = 1000; // Larger batch size for speed

    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        console.log('Permission denied, using mock data');
        set({ hasPermission: false });
        // Use mock data as fallback
        get().loadMockPhotos();
        set(state => ({
          isScanning: false,
          scanProgress: 100,
          stats: {
            ...state.stats,
            totalPhotosScanned: state.photos.length,
          },
        }));
        return;
      }

      set({ hasPermission: true });

      // Get total count first
      const totalAssets = await MediaLibrary.getAssetsAsync({
        first: 1,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      });

      const deviceTotalCount = totalAssets.totalCount;
      const scanLimit = Math.min(deviceTotalCount, MAX_PHOTOS);
      const isLimited = deviceTotalCount > MAX_PHOTOS;

      set({ totalDevicePhotos: deviceTotalCount, firstScanLimited: isLimited });

      if (deviceTotalCount === 0) {
        console.log('No photos found, using mock data');
        get().loadMockPhotos();
        set(state => ({
          isScanning: false,
          scanProgress: 100,
          stats: {
            ...state.stats,
            totalPhotosScanned: state.photos.length,
          },
        }));
        return;
      }

      const allPhotos: Photo[] = [];
      let hasNextPage = true;
      let endCursor: string | undefined = undefined;
      let processed = 0;

      while (hasNextPage && allPhotos.length < MAX_PHOTOS) {
        const assets = await MediaLibrary.getAssetsAsync({
          first: BATCH_SIZE,
          after: endCursor,
          mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
          sortBy: [MediaLibrary.SortBy.creationTime],
        });

        for (const asset of assets.assets) {
          if (allPhotos.length >= MAX_PHOTOS) break;

          // SKIP getting file sizes for each photo - estimate based on dimensions instead
          // This makes scanning MUCH faster (was the main bottleneck)
          const isVideo = asset.mediaType === MediaLibrary.MediaType.video;

          // Estimate file size based on dimensions and type
          // Average photo: ~2-4 bytes per pixel, videos: much larger
          let estimatedSize = 0;
          if (isVideo) {
            // Estimate video at ~10MB average (can't know duration without slow API call)
            estimatedSize = 10 * 1024 * 1024;
          } else {
            // Estimate photo size: ~3 bytes per pixel for JPEG compression
            estimatedSize = Math.round(asset.width * asset.height * 3);
          }

          const isScreenshotType = !isVideo && isScreenshot({
            filename: asset.filename,
            width: asset.width,
            height: asset.height,
          });

          const photo: Photo = {
            id: asset.id,
            uri: asset.uri,
            filename: asset.filename,
            width: asset.width,
            height: asset.height,
            fileSize: estimatedSize,
            createdAt: new Date(asset.creationTime),
            type: isVideo ? 'video' : isScreenshotType ? 'screenshot' : 'photo',
          };

          allPhotos.push(photo);
        }

        processed += assets.assets.length;
        hasNextPage = assets.hasNextPage && allPhotos.length < MAX_PHOTOS;
        endCursor = assets.endCursor;

        // Update progress
        const progress = Math.min(Math.round((allPhotos.length / scanLimit) * 100), 99);
        set({ scanProgress: progress });
      }

      // Now categorize all photos
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - OLD_PHOTO_DAYS * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - RECENT_PHOTO_DAYS * 24 * 60 * 60 * 1000);

      // Screenshots
      const screenshots = allPhotos.filter(p => p.type === 'screenshot');

      // Large files - use estimated size (photos > 5MB or high resolution)
      // Since we estimate, use dimension-based detection: over 4K resolution
      const largeFiles = allPhotos
        .filter(p => (p.width * p.height > 8000000) || p.type === 'video') // > 8MP or video
        .sort((a, b) => b.fileSize - a.fileSize);

      // Old photos (older than 1 year)
      const oldPhotos = allPhotos.filter(p => p.createdAt < oneYearAgo);

      // Recent photos (last 7 days)
      const recentPhotos = allPhotos.filter(p => p.createdAt > sevenDaysAgo);

      // Similar photos - group by photos taken within 30 seconds of each other
      const sortedByTime = [...allPhotos].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const similarGroups: PhotoGroup[] = [];
      let currentGroup: Photo[] = [];
      let groupId = 1;

      for (let i = 0; i < sortedByTime.length; i++) {
        const photo = sortedByTime[i];

        if (currentGroup.length === 0) {
          currentGroup.push(photo);
        } else {
          const lastPhoto = currentGroup[currentGroup.length - 1];
          const timeDiff = photo.createdAt.getTime() - lastPhoto.createdAt.getTime();

          if (timeDiff <= SIMILAR_TIME_THRESHOLD) {
            currentGroup.push(photo);
          } else {
            // Save current group if it has more than 1 photo
            if (currentGroup.length > 1) {
              const groupIdStr = `similar-group-${groupId}`;
              currentGroup.forEach(p => p.groupId = groupIdStr);

              const sortedBySize = [...currentGroup].sort((a, b) => b.fileSize - a.fileSize);
              similarGroups.push({
                id: groupIdStr,
                photos: currentGroup,
                bestPhotoId: sortedBySize[0].id,
                totalSize: currentGroup.reduce((sum, p) => sum + p.fileSize, 0),
              });
              groupId++;
            }
            currentGroup = [photo];
          }
        }
      }

      // Don't forget the last group
      if (currentGroup.length > 1) {
        const groupIdStr = `similar-group-${groupId}`;
        currentGroup.forEach(p => p.groupId = groupIdStr);

        const sortedBySize = [...currentGroup].sort((a, b) => b.fileSize - a.fileSize);
        similarGroups.push({
          id: groupIdStr,
          photos: currentGroup,
          bestPhotoId: sortedBySize[0].id,
          totalSize: currentGroup.reduce((sum, p) => sum + p.fileSize, 0),
        });
      }

      // Duplicates - group by same filename and size
      const duplicateMap = new Map<string, Photo[]>();
      allPhotos.forEach(photo => {
        const key = `${photo.filename}-${photo.fileSize}`;
        const existing = duplicateMap.get(key) || [];
        existing.push(photo);
        duplicateMap.set(key, existing);
      });

      const duplicates: PhotoGroup[] = [];
      let dupGroupId = 1;
      duplicateMap.forEach((photos, key) => {
        if (photos.length > 1) {
          const groupIdStr = `dup-group-${dupGroupId}`;
          const sortedByDate = [...photos].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          duplicates.push({
            id: groupIdStr,
            photos,
            bestPhotoId: sortedByDate[0].id, // Keep the newest
            totalSize: photos.reduce((sum, p) => sum + p.fileSize, 0),
          });
          dupGroupId++;
        }
      });

      set({
        photos: allPhotos,
        similarGroups,
        screenshots,
        largeFiles,
        oldPhotos,
        recentPhotos,
        blurryPhotos: [], // Placeholder - can't easily detect blur
        duplicates,
        isScanning: false,
        scanProgress: 100,
        stats: {
          ...get().stats,
          totalPhotosScanned: allPhotos.length,
        },
      });

    } catch (error) {
      console.error('Error scanning photos:', error);
      // Fallback to mock data
      get().loadMockPhotos();
      set(state => ({
        isScanning: false,
        scanProgress: 100,
        stats: {
          ...state.stats,
          totalPhotosScanned: state.photos.length,
        },
      }));
    }
  },

  refreshAllArrays: () => {
    const state = get();
    const photos = state.photos;

    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - OLD_PHOTO_DAYS * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - RECENT_PHOTO_DAYS * 24 * 60 * 60 * 1000);

    // Re-filter all categories based on remaining photos
    const screenshots = photos.filter(p => p.type === 'screenshot');
    const largeFiles = photos
      .filter(p => p.fileSize > LARGE_FILE_THRESHOLD)
      .sort((a, b) => b.fileSize - a.fileSize);
    const oldPhotos = photos.filter(p => p.createdAt < oneYearAgo);
    const recentPhotos = photos.filter(p => p.createdAt > sevenDaysAgo);

    // Update similar groups
    const updatedSimilarGroups = state.similarGroups
      .map(group => ({
        ...group,
        photos: group.photos.filter(p => photos.some(photo => photo.id === p.id)),
        totalSize: group.photos
          .filter(p => photos.some(photo => photo.id === p.id))
          .reduce((sum, p) => sum + p.fileSize, 0),
      }))
      .filter(group => group.photos.length > 1);

    // Update duplicates
    const updatedDuplicates = state.duplicates
      .map(group => ({
        ...group,
        photos: group.photos.filter(p => photos.some(photo => photo.id === p.id)),
        totalSize: group.photos
          .filter(p => photos.some(photo => photo.id === p.id))
          .reduce((sum, p) => sum + p.fileSize, 0),
      }))
      .filter(group => group.photos.length > 1);

    set({
      screenshots,
      largeFiles,
      oldPhotos,
      recentPhotos,
      similarGroups: updatedSimilarGroups,
      duplicates: updatedDuplicates,
    });
  },

  selectPhoto: (id) => {
    set(state => {
      const newSelected = new Set(state.selectedPhotoIds);
      newSelected.add(id);
      return { selectedPhotoIds: newSelected };
    });
  },

  deselectPhoto: (id) => {
    set(state => {
      const newSelected = new Set(state.selectedPhotoIds);
      newSelected.delete(id);
      return { selectedPhotoIds: newSelected };
    });
  },

  togglePhotoSelection: (id) => {
    set(state => {
      const newSelected = new Set(state.selectedPhotoIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedPhotoIds: newSelected };
    });
  },

  selectAllInGroup: (groupId) => {
    const state = get();
    const group = state.similarGroups.find(g => g.id === groupId) ||
                  state.duplicates.find(g => g.id === groupId);
    if (group) {
      set(state => {
        const newSelected = new Set(state.selectedPhotoIds);
        group.photos.forEach(p => newSelected.add(p.id));
        return { selectedPhotoIds: newSelected };
      });
    }
  },

  selectAllExceptBest: (groupId) => {
    const state = get();
    const group = state.similarGroups.find(g => g.id === groupId) ||
                  state.duplicates.find(g => g.id === groupId);
    if (group) {
      set(state => {
        const newSelected = new Set(state.selectedPhotoIds);
        group.photos.forEach(p => {
          if (p.id !== group.bestPhotoId) {
            newSelected.add(p.id);
          }
        });
        return { selectedPhotoIds: newSelected };
      });
    }
  },

  selectAllScreenshots: () => {
    set(state => {
      const newSelected = new Set(state.selectedPhotoIds);
      state.screenshots.forEach(p => newSelected.add(p.id));
      return { selectedPhotoIds: newSelected };
    });
  },

  clearSelection: () => {
    set({ selectedPhotoIds: new Set() });
  },

  deleteSelectedPhotos: async () => {
    const state = get();
    const selectedIds = state.selectedPhotoIds;

    if (selectedIds.size === 0) return;

    // Get photos to be deleted (move to trash first, not permanently deleted)
    const photosToDelete = state.photos.filter(p => selectedIds.has(p.id));

    // Remove selected photos from main state and move to deletedPhotos
    const remainingPhotos = state.photos.filter(p => !selectedIds.has(p.id));

    // Clear selection and update photos - move to deletedPhotos instead of permanent delete
    set(prevState => ({
      photos: remainingPhotos,
      selectedPhotoIds: new Set(),
      deletedPhotos: [...prevState.deletedPhotos, ...photosToDelete],
    }));

    // Refresh all derived arrays
    get().refreshAllArrays();
  },

  markAsBest: (groupId, photoId) => {
    set(state => ({
      similarGroups: state.similarGroups.map(group =>
        group.id === groupId ? { ...group, bestPhotoId: photoId } : group
      ),
      duplicates: state.duplicates.map(group =>
        group.id === groupId ? { ...group, bestPhotoId: photoId } : group
      ),
    }));
  },

  getSelectedCount: () => {
    return get().selectedPhotoIds.size;
  },

  getSelectedSize: () => {
    const state = get();
    return state.photos
      .filter(p => state.selectedPhotoIds.has(p.id))
      .reduce((sum, p) => sum + p.fileSize, 0);
  },

  loadStats: async () => {
    try {
      const statsJson = await AsyncStorage.getItem(STATS_KEY);
      if (statsJson) {
        const stats = JSON.parse(statsJson);
        set({
          stats: {
            ...stats,
            lastCleanupDate: stats.lastCleanupDate ? new Date(stats.lastCleanupDate) : null,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  },

  saveStats: async () => {
    try {
      const { stats } = get();
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  },

  // Tinder mode actions
  setTinderFilterCategory: (category: CategoryType) => {
    set({ tinderFilterCategory: category });
  },

  getShuffledPhotos: () => {
    const { photos } = get();
    // Fisher-Yates shuffle
    const shuffled = [...photos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  getShuffledPhotosByCategory: (category: CategoryType) => {
    const state = get();
    let photosToShuffle: Photo[] = [];

    switch (category) {
      case 'all':
        photosToShuffle = state.photos;
        break;
      case 'similar':
        photosToShuffle = state.similarGroups.flatMap(group => group.photos);
        break;
      case 'screenshots':
        photosToShuffle = state.screenshots;
        break;
      case 'large':
        photosToShuffle = state.largeFiles;
        break;
      case 'old':
        photosToShuffle = state.oldPhotos;
        break;
      case 'recent':
        photosToShuffle = state.recentPhotos;
        break;
      case 'blurry':
        photosToShuffle = state.blurryPhotos;
        break;
      case 'duplicates':
        photosToShuffle = state.duplicates.flatMap(group => group.photos);
        break;
      default:
        photosToShuffle = state.photos;
    }

    // Fisher-Yates shuffle
    const shuffled = [...photosToShuffle];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  getCategories: () => {
    const state = get();
    const similarPhotosCount = state.similarGroups.reduce((sum, g) => sum + g.photos.length, 0);
    const duplicatesCount = state.duplicates.reduce((sum, g) => sum + g.photos.length, 0);

    const categories: CategoryInfo[] = [
      { id: 'all', name: 'All Photos', count: state.photos.length },
      { id: 'similar', name: 'Similar Photos', count: similarPhotosCount },
      { id: 'screenshots', name: 'Screenshots', count: state.screenshots.length },
      { id: 'large', name: 'Large Files', count: state.largeFiles.length },
      { id: 'old', name: 'Old Photos', count: state.oldPhotos.length },
      { id: 'recent', name: 'Recent Photos', count: state.recentPhotos.length },
      { id: 'blurry', name: 'Blurry Photos', count: state.blurryPhotos.length },
      { id: 'duplicates', name: 'Duplicates', count: duplicatesCount },
    ];

    // Sort by count (most photos first), but keep "All Photos" at the top
    return categories.sort((a, b) => {
      if (a.id === 'all') return -1;
      if (b.id === 'all') return 1;
      return b.count - a.count;
    });
  },

  // Deleted photos actions
  restorePhoto: (id: string) => {
    const state = get();
    const photoToRestore = state.deletedPhotos.find(p => p.id === id);
    if (photoToRestore) {
      set({
        deletedPhotos: state.deletedPhotos.filter(p => p.id !== id),
        photos: [...state.photos, photoToRestore],
      });
      // Refresh all arrays to include restored photo in categories
      get().refreshAllArrays();
    }
  },

  permanentlyDeletePhotos: async () => {
    const state = get();
    if (state.deletedPhotos.length === 0) return;

    // Calculate space saved
    const spaceSaved = state.deletedPhotos.reduce((sum, p) => sum + p.fileSize, 0);
    const count = state.deletedPhotos.length;

    // Actually delete from device using MediaLibrary
    if (state.hasPermission) {
      try {
        const assetIds = state.deletedPhotos.map(p => p.id);
        await MediaLibrary.deleteAssetsAsync(assetIds);
      } catch (error) {
        console.error('Error permanently deleting from device:', error);
      }
    }

    // Clear deleted photos and update stats
    set(prevState => ({
      deletedPhotos: [],
      stats: {
        ...prevState.stats,
        photosDeleted: prevState.stats.photosDeleted + count,
        spaceSaved: prevState.stats.spaceSaved + spaceSaved,
        lastCleanupDate: new Date(),
      },
    }));

    await get().saveStats();
  },

  clearDeletedPhotos: () => {
    set({ deletedPhotos: [] });
  },
}));
