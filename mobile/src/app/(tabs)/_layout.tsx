import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Home, Layers, Heart, Settings, Trash2 } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { GLASS_THEME } from '@/lib/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: GLASS_THEME.colors.primary,
        tabBarInactiveTintColor: isDark
          ? GLASS_THEME.colors.textMutedDark
          : GLASS_THEME.colors.textMutedLight,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          height: 88,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? GLASS_THEME.colors.tabBarBgDark
                    : GLASS_THEME.colors.tabBarBgLight,
                  borderTopWidth: 0.5,
                  borderTopColor: isDark
                    ? GLASS_THEME.colors.glassBorderDark
                    : GLASS_THEME.colors.glassBorderLight,
                },
              ]}
            />
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: isDark ? GLASS_THEME.colors.bgDark : GLASS_THEME.colors.bgLight,
        },
        headerTintColor: isDark
          ? GLASS_THEME.colors.textPrimaryDark
          : GLASS_THEME.colors.textPrimaryLight,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'TeddyFon Cleaner',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tinder"
        options={{
          title: 'Swipe',
          headerTitle: 'Swipe Mode',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cleanup"
        options={{
          title: 'Categories',
          headerTitle: 'Categories',
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cleaned"
        options={{
          title: 'Cleaned',
          headerTitle: 'Deleted Photos',
          tabBarIcon: ({ color, size }) => <Trash2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
