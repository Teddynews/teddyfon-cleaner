import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePhotoStore, formatFileSize, Photo } from '@/lib/photo-store';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';

function DeletedPhotoItem({
  photo,
  isDark,
  onRestore,
}: {
  photo: Photo;
  isDark: boolean;
  onRestore: () => void;
}) {
  return (
    <View style={[styles.photoItem, { borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.glassBorderLight }]}>
      <BlurView
        intensity={isDark ? 20 : 30}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : GLASS_THEME.colors.glassBgLight }]} />

      {/* Thumbnail */}
      <Image source={{ uri: photo.uri }} style={styles.thumbnail} />

      {/* Info */}
      <View style={styles.photoInfo}>
        <Text
          style={[styles.photoFilename, { color: isDark ? GLASS_THEME.colors.textPrimaryDark : GLASS_THEME.colors.textPrimaryLight }]}
          numberOfLines={1}
        >
          {photo.filename}
        </Text>
        <Text style={[styles.photoSize, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
          {formatFileSize(photo.fileSize)}
        </Text>
      </View>

      {/* Restore button */}
      <Pressable onPress={onRestore} style={styles.restoreButton}>
        <View style={[styles.restoreButtonInner, { backgroundColor: `${GLASS_THEME.colors.success}20` }]}>
          <RotateCcw size={16} color={GLASS_THEME.colors.success} />
          <Text style={[styles.restoreText, { color: GLASS_THEME.colors.success }]}>Restore</Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function CleanedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const deletedPhotos = usePhotoStore(s => s.deletedPhotos);
  const restorePhoto = usePhotoStore(s => s.restorePhoto);
  const permanentlyDeletePhotos = usePhotoStore(s => s.permanentlyDeletePhotos);

  const [isDeleting, setIsDeleting] = useState(false);

  const totalSize = deletedPhotos.reduce((sum, p) => sum + p.fileSize, 0);

  const handleRestore = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    restorePhoto(id);
  };

  const handlePermanentDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Permanently Delete All?',
      `This will permanently remove ${deletedPhotos.length} photos from your device. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            await permanentlyDeletePhotos();
            setIsDeleting(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleRestoreAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Restore All Photos?',
      `This will restore ${deletedPhotos.length} photos back to your library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore All',
          onPress: () => {
            deletedPhotos.forEach(photo => restorePhoto(photo.id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  if (deletedPhotos.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? GLASS_THEME.colors.bgDark : GLASS_THEME.colors.bgLight }]}>
        {/* Teddy mascot */}
        <Image
          source={require('../../../assets/images/teddy-mascot.png')}
          style={styles.mascot}
          resizeMode="contain"
        />

        <Text style={[styles.emptyTitle, { color: isDark ? GLASS_THEME.colors.textPrimaryDark : GLASS_THEME.colors.textPrimaryLight }]}>
          No Deleted Photos
        </Text>

        <Text style={[styles.emptySubtitle, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
          Photos you delete will appear here before being permanently removed from your device.
        </Text>

        <View style={[styles.emptyTip, { borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.glassBorderLight }]}>
          <BlurView
            intensity={isDark ? 20 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : GLASS_THEME.colors.glassBgLight }]} />
          <Text style={[styles.emptyTipText, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
            Swipe left on photos or select them to move them here. Then delete them all at once!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? GLASS_THEME.colors.bgDark : GLASS_THEME.colors.bgLight }]}>
      {/* Summary bar */}
      <View style={styles.summarySection}>
        <View style={[styles.summaryCard, { borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : `${GLASS_THEME.colors.delete}30` }]}>
          <BlurView
            intensity={isDark ? 20 : 25}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : `${GLASS_THEME.colors.delete}08` }]} />
          <View style={styles.summaryContent}>
            <View style={styles.summaryLeft}>
              <Trash2 size={18} color={GLASS_THEME.colors.delete} />
              <Text style={[styles.summaryText, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
                {deletedPhotos.length} photos pending deletion
              </Text>
            </View>
            <Text style={[styles.summarySize, { color: GLASS_THEME.colors.delete }]}>
              {formatFileSize(totalSize)}
            </Text>
          </View>
        </View>

        {/* Warning banner */}
        <View style={[styles.warningCard, { backgroundColor: isDark ? '#3D2F1F' : '#FEF3C7' }]}>
          <AlertTriangle size={18} color="#F59E0B" />
          <Text style={[styles.warningText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
            Photos here are not yet deleted from your device
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        {deletedPhotos.map((photo) => (
          <DeletedPhotoItem
            key={photo.id}
            photo={photo}
            isDark={isDark}
            onRestore={() => handleRestore(photo.id)}
          />
        ))}
      </ScrollView>

      {/* Action buttons */}
      <View style={[styles.actionBar, { backgroundColor: isDark ? 'rgba(26, 31, 46, 0.95)' : 'rgba(247, 249, 252, 0.95)' }]}>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.actionContent}>
          <Pressable onPress={handleRestoreAll} style={styles.restoreAllButton}>
            <View style={[styles.restoreAllInner, { borderColor: GLASS_THEME.colors.success }]}>
              <RotateCcw size={18} color={GLASS_THEME.colors.success} />
              <Text style={[styles.restoreAllText, { color: GLASS_THEME.colors.success }]}>Restore All</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handlePermanentDelete}
            disabled={isDeleting}
            style={[styles.deleteButton, { backgroundColor: isDeleting ? '#FF9999' : GLASS_THEME.colors.delete }]}
          >
            <Trash2 size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>
              {isDeleting ? 'Deleting...' : `Delete Forever (${formatFileSize(totalSize)})`}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  mascot: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyTip: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: GLASS_THEME.radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyTipText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  summarySection: {
    padding: 16,
    gap: 8,
  },
  summaryCard: {
    borderRadius: GLASS_THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    marginLeft: 8,
  },
  summarySize: {
    fontWeight: '600',
    fontSize: 14,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: GLASS_THEME.radius.lg,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: GLASS_THEME.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...GLASS_THEME.shadows.light,
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  photoInfo: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  photoFilename: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  photoSize: {
    fontSize: 14,
  },
  restoreButton: {
    padding: 12,
    justifyContent: 'center',
  },
  restoreButtonInner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: GLASS_THEME.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  actionContent: {
    padding: 16,
    paddingBottom: 32,
  },
  restoreAllButton: {
    marginBottom: 12,
  },
  restoreAllInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: GLASS_THEME.radius.lg,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  restoreAllText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: GLASS_THEME.radius.lg,
    ...GLASS_THEME.shadows.glow(GLASS_THEME.colors.delete),
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
