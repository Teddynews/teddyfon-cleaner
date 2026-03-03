import React from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { cn } from '@/lib/cn';

export default function BlurryPhotosScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className={cn('flex-1', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
      <Stack.Screen
        options={{
          title: 'Blurry Photos',
        }}
      />

      <View className="flex-1 items-center justify-center px-8">
        <View className={cn(
          'rounded-full p-5 mb-4',
          isDark ? 'bg-gray-800' : 'bg-red-50'
        )}>
          <AlertCircle size={40} color="#EF4444" />
        </View>
        <Text className={cn(
          'text-lg font-semibold text-center mb-2',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          Coming Soon
        </Text>
        <Text className={cn(
          'text-base text-center',
          isDark ? 'text-gray-400' : 'text-gray-500'
        )}>
          Blurry photo detection is not yet available. This feature requires advanced image analysis that will be added in a future update.
        </Text>
      </View>
    </View>
  );
}
