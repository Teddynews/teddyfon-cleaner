# TeddyFon Cleaner

A phone storage cleaner app that helps users clean up unwanted photos from their photo library. Inspired by modern photo cleaner apps with a friendly, warm design.

## Features

### Splash Screen
- Shows TeddyFonCleaner logo centered on screen
- Displays "TeddyFon Cleaner is scanning..." text with animated dots
- Minimum 2 second display time
- Auto-shows every time user opens app or taps Home tab
- Progress bar during active scanning

### Real Device Photo Access
- Connects to your actual photo library using expo-media-library
- Loads up to 10,000 photos for fast scanning (1-2 minutes)
- If device has more than 10,000 photos, shows the limit with actual total below
- Shows access banner on startup with actual photo count

### Home Dashboard
- TeddyFonCleaner logo branding
- Total photos count (shows "10,000" with "(of X on device)" if limited)
- Storage used display
- Potential space savings indicator
- Scan button to analyze photo library
- Quick access to cleanup categories
- Auto-refreshes (shows splash) when tapping Home tab

### Tabs (5 Tabs)

**Home** - Dashboard with stats, TeddyFonCleaner logo, and scan button

**Swipe** (Heart icon) - Tinder-style swiping:
- TeddyFonCleaner logo in header
- Swipe RIGHT = Keep (light green indicator)
- Swipe LEFT = Delete (soft coral indicator)
- Filter by any category using folder icon
- Photos shown in random order
- "Start Over" and "Go Home" buttons when done

**Categories** - All cleanup categories:
1. All Photos - Every photo on your device
2. Similar Photos - Photos taken within 30 seconds of each other
3. Screenshots - Detected by filename patterns
4. Large Files - Videos and photos over 10MB
5. Old Photos - Older than 1 year
6. Recent Photos - Last 7 days
7. Duplicates - Same filename/size

**Cleaned** - Deleted photos management:
- Shows photos pending deletion
- Restore individual photos
- Restore all photos
- Permanently delete all from device
- Teddy mascot on empty state

**Settings** - All functional:
- Photo Access - Opens device settings
- Notifications - Toggle
- Auto-select Duplicates - Toggle
- Keep Original Quality - Toggle
- Smart Suggestions - Toggle
- Help Center - Shows usage guide
- Contact Us - office@teddynews.de
- Rate App - Thank you message
- About - Version info
- Clear Cache - Clears app cache
- Reset Statistics - Resets cleanup stats
- TeddyFonCleaner logo in footer

### Delete Flow
Photos are moved to the "Cleaned" tab first, not immediately deleted. Users can:
- Restore photos back to library
- Permanently delete all at once
- See total space to be freed

## Color Palette (Lighter MonkeyPhoto-Inspired)
- Primary: Light Teal `#5ED3E5`
- Secondary: Warm Cream `#FBF5D9`
- Success/Keep: Light Green `#6DD5A0`
- Delete: Soft Coral `#FF7B7B`
- Background Light: `#F7F9FC`
- Background Dark: `#1A1F2E`
- Cards Light: `#FFFFFF`
- Cards Dark: `#252D3D`

## Branding
- App Name: TeddyFon Cleaner
- Mascot: Teddy bear from TeddyNews
- Contact: office@teddynews.de

## Tech Stack
- Expo SDK 53
- React Native 0.76.7
- expo-media-library for photo access
- NativeWind/TailwindCSS for styling
- Zustand for state management
- react-native-reanimated for animations
- react-native-gesture-handler for swipe gestures
- expo-haptics for tactile feedback
- AsyncStorage for settings persistence
