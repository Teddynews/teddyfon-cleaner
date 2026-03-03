import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Linking, Alert, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import {
  Bell,
  Trash2,
  Info,
  ChevronRight,
  Shield,
  Star,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Copy,
  RefreshCw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePhotoStore, formatFileSize } from '@/lib/photo-store';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';

// Storage keys for settings
const SETTINGS_KEYS = {
  notifications: '@settings_notifications',
  autoSelectDuplicates: '@settings_auto_select_duplicates',
  keepOriginalQuality: '@settings_keep_original_quality',
  smartSuggestions: '@settings_smart_suggestions',
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const stats = usePhotoStore(s => s.stats);

  // Toggle states
  const [notifications, setNotifications] = useState(true);
  const [autoSelectDuplicates, setAutoSelectDuplicates] = useState(true);
  const [keepOriginalQuality, setKeepOriginalQuality] = useState(true);
  const [smartSuggestions, setSmartSuggestions] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [notif, autoSelect, quality, smart] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEYS.notifications),
        AsyncStorage.getItem(SETTINGS_KEYS.autoSelectDuplicates),
        AsyncStorage.getItem(SETTINGS_KEYS.keepOriginalQuality),
        AsyncStorage.getItem(SETTINGS_KEYS.smartSuggestions),
      ]);

      if (notif !== null) setNotifications(notif === 'true');
      if (autoSelect !== null) setAutoSelectDuplicates(autoSelect === 'true');
      if (quality !== null) setKeepOriginalQuality(quality === 'true');
      if (smart !== null) setSmartSuggestions(smart === 'true');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, String(value));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const handleNotificationsToggle = (value: boolean) => {
    setNotifications(value);
    saveSetting(SETTINGS_KEYS.notifications, value);
  };

  const handleAutoSelectToggle = (value: boolean) => {
    setAutoSelectDuplicates(value);
    saveSetting(SETTINGS_KEYS.autoSelectDuplicates, value);
  };

  const handleQualityToggle = (value: boolean) => {
    setKeepOriginalQuality(value);
    saveSetting(SETTINGS_KEYS.keepOriginalQuality, value);
  };

  const handleSmartToggle = (value: boolean) => {
    setSmartSuggestions(value);
    saveSetting(SETTINGS_KEYS.smartSuggestions, value);
  };

  const handlePhotoAccess = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openSettings();
  };

  const handleHelpCenter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Help Center',
      'TeddyFon Cleaner helps you find and remove duplicate, similar, and unnecessary photos.\n\n' +
      '- Swipe left to mark for deletion\n' +
      '- Swipe right to keep\n' +
      '- Long press to mark as "Best" photo\n' +
      '- Use Categories to find specific types\n\n' +
      'Need more help? Contact us at office@teddynews.de',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handleContactUs = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:office@teddynews.de?subject=TeddyFon%20Cleaner%20Support');
  };

  const handleRateApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Rate TeddyFon Cleaner',
      'Thank you for wanting to rate us! Your feedback helps us improve.',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'About TeddyFon Cleaner',
      'Version 1.0.0\n\n' +
      'TeddyFon Cleaner helps you reclaim storage space by identifying and removing duplicate, similar, and unnecessary photos.\n\n' +
      'Made with care by TeddyNews.',
      [{ text: 'OK' }]
    );
  };

  const handleClearCache = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsClearing(true);

    try {
      // Clear all cached data except stats
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(key =>
        !key.includes('stats') && !key.startsWith('@settings_')
      );
      await AsyncStorage.multiRemove(keysToRemove);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Cache Cleared', 'App cache has been cleared successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleResetStatistics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to reset all cleanup statistics? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@photo_cleaner_stats');
              // Reset stats in store
              usePhotoStore.setState({
                stats: {
                  totalPhotosScanned: 0,
                  photosDeleted: 0,
                  spaceSaved: 0,
                  lastCleanupDate: null,
                },
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Statistics Reset', 'Your cleanup statistics have been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset statistics. Please try again.');
            }
          },
        },
      ]
    );
  };

  const settingsGroups = [
    {
      title: 'Preferences',
      items: [
        {
          icon: Shield,
          title: 'Photo Access',
          subtitle: 'Manage permissions',
          type: 'link',
          onPress: handlePhotoAccess,
        },
        {
          icon: Bell,
          title: 'Notifications',
          subtitle: 'Cleanup reminders',
          type: 'toggle',
          value: notifications,
          onToggle: handleNotificationsToggle,
        },
      ],
    },
    {
      title: 'Cleanup Settings',
      items: [
        {
          icon: Copy,
          title: 'Auto-select Duplicates',
          subtitle: 'Automatically select duplicate photos',
          type: 'toggle',
          value: autoSelectDuplicates,
          onToggle: handleAutoSelectToggle,
        },
        {
          icon: Sparkles,
          title: 'Keep Original Quality',
          subtitle: 'Preserve full resolution when cleaning',
          type: 'toggle',
          value: keepOriginalQuality,
          onToggle: handleQualityToggle,
        },
        {
          icon: Sparkles,
          title: 'Smart Suggestions',
          subtitle: 'AI-powered cleanup recommendations',
          type: 'toggle',
          value: smartSuggestions,
          onToggle: handleSmartToggle,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          title: 'Help Center',
          subtitle: 'FAQs and guides',
          type: 'link',
          onPress: handleHelpCenter,
        },
        {
          icon: MessageSquare,
          title: 'Contact Us',
          subtitle: 'office@teddynews.de',
          type: 'link',
          onPress: handleContactUs,
        },
        {
          icon: Star,
          title: 'Rate App',
          subtitle: 'Help us improve',
          type: 'link',
          onPress: handleRateApp,
        },
        {
          icon: Info,
          title: 'About',
          subtitle: 'Version 1.0.0',
          type: 'link',
          onPress: handleAbout,
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          icon: Trash2,
          title: 'Clear Cache',
          subtitle: 'Free up app storage',
          type: 'link',
          onPress: handleClearCache,
          isLoading: isClearing,
        },
        {
          icon: RefreshCw,
          title: 'Reset Statistics',
          subtitle: 'Clear cleanup history',
          type: 'link',
          onPress: handleResetStatistics,
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? GLASS_THEME.colors.bgDark : GLASS_THEME.colors.bgLight }]}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Stats Summary Card with Glass Effect */}
      <View style={styles.statsSection}>
        <View style={[styles.statsCard, { borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.glassBorderLight }]}>
          <BlurView
            intensity={isDark ? 30 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : GLASS_THEME.colors.glassBgLight }]} />

          <View style={styles.statsContent}>
            <Text style={[styles.statsTitle, { color: isDark ? GLASS_THEME.colors.textPrimaryDark : GLASS_THEME.colors.textPrimaryLight }]}>
              Your Cleanup Stats
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: GLASS_THEME.colors.primary }]}>
                  {stats.photosDeleted}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
                  Photos Cleaned
                </Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.glassBorderLight }]} />

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: GLASS_THEME.colors.success }]}>
                  {formatFileSize(stats.spaceSaved)}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? GLASS_THEME.colors.textSecondaryDark : GLASS_THEME.colors.textSecondaryLight }]}>
                  Space Saved
                </Text>
              </View>
            </View>

            {stats.lastCleanupDate ? (
              <Text style={[styles.lastCleanup, { color: isDark ? GLASS_THEME.colors.textMutedDark : GLASS_THEME.colors.textMutedLight }]}>
                Last cleanup: {new Date(stats.lastCleanupDate).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Settings Groups */}
      {settingsGroups.map((group) => (
        <View key={group.title} style={styles.groupSection}>
          <Text style={[styles.groupTitle, { color: isDark ? GLASS_THEME.colors.textMutedDark : GLASS_THEME.colors.textMutedLight }]}>
            {group.title}
          </Text>

          <View style={[styles.groupCard, { borderColor: isDark ? GLASS_THEME.colors.glassBorderDark : GLASS_THEME.colors.glassBorderLight }]}>
            <BlurView
              intensity={isDark ? 25 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? GLASS_THEME.colors.glassBgDark : GLASS_THEME.colors.glassBgLight }]} />

            {group.items.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === group.items.length - 1;

              return (
                <Pressable
                  key={item.title}
                  onPress={item.type === 'link' ? item.onPress : undefined}
                  disabled={item.type === 'toggle' || (item as any).isLoading}
                  style={({ pressed }) => [
                    styles.settingItem,
                    !isLast && [styles.settingItemBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }],
                    { opacity: item.type === 'link' && pressed ? 0.7 : 1 },
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : `${GLASS_THEME.colors.primary}15` }]}>
                    <Icon size={18} color={GLASS_THEME.colors.primary} />
                  </View>

                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: isDark ? GLASS_THEME.colors.textPrimaryDark : GLASS_THEME.colors.textPrimaryLight }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.settingSubtitle, { color: isDark ? GLASS_THEME.colors.textMutedDark : GLASS_THEME.colors.textMutedLight }]}>
                      {item.subtitle}
                    </Text>
                  </View>

                  {item.type === 'toggle' && 'value' in item && 'onToggle' in item ? (
                    <View style={styles.switchContainer}>
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: GLASS_THEME.colors.primary }}
                        thumbColor="#fff"
                        ios_backgroundColor={isDark ? '#374151' : '#d1d5db'}
                      />
                    </View>
                  ) : null}

                  {item.type === 'link' ? (
                    <View style={styles.chevronContainer}>
                      <ChevronRight size={20} color={isDark ? GLASS_THEME.colors.textMutedDark : GLASS_THEME.colors.textMutedLight} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={require('../../../assets/images/teddyfoncleaner-logo.jpg')}
          style={styles.footerLogo}
        />
        <Text style={[styles.footerTitle, { color: isDark ? GLASS_THEME.colors.textMutedDark : GLASS_THEME.colors.textMutedLight }]}>
          TeddyFon Cleaner v1.0.0
        </Text>
        <Text style={[styles.footerSubtitle, { color: isDark ? 'rgba(107,114,128,0.6)' : 'rgba(156,163,175,0.8)' }]}>
          Made with care by TeddyNews
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statsCard: {
    borderRadius: GLASS_THEME.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...GLASS_THEME.shadows.light,
  },
  statsContent: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 48,
  },
  lastCleanup: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  groupSection: {
    marginTop: 24,
  },
  groupTitle: {
    paddingHorizontal: 20,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCard: {
    marginHorizontal: 16,
    borderRadius: GLASS_THEME.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...GLASS_THEME.shadows.light,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: GLASS_THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  switchContainer: {
    marginLeft: 'auto',
    paddingRight: 16,
  },
  chevronContainer: {
    marginLeft: 'auto',
    paddingRight: 16,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    paddingBottom: 16,
  },
  footerLogo: {
    width: 112,
    height: 112,
    marginBottom: 12,
    borderRadius: 22,
  },
  footerTitle: {
    fontSize: 14,
  },
  footerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
});
