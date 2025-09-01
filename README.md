# QuickKcal - Calorie Tracking App

**"Log any meal in 10 seconds and instantly see if you're on target."**

QuickKcal is a React Native Expo app designed for busy people who want to track their food intake quickly and efficiently. Built with a focus on speed, simplicity, and beautiful design.

## Features

- **⚡ Quick Food Logging**: Log meals in under 10 seconds with smart search
- **📸 Meal Scan**: AI-powered photo recognition (mocked for demo)
- **🎯 Progress Tracking**: Visual progress ring showing remaining calories
- **📊 Macro Monitoring**: Track carbs, protein, and fat intake
- **🔧 Custom Goals**: Personalized calorie and macro targets based on BMR/TDEE
- **📱 Fully Responsive**: Works perfectly on iOS, Android, and Web
- **🔒 Privacy First**: All data stored locally on device
- **🎨 Beautiful UI**: Clean, modern design with smooth animations

## Tech Stack

- **Framework**: Expo SDK 53.0.0 + React Native
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Language**: JavaScript (ES6+)
- **Styling**: React Native StyleSheet
- **Icons**: @expo/vector-icons
- **Camera**: expo-camera + expo-image-picker
- **SVG**: react-native-svg for progress ring

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (Mac) or Android Studio (for mobile development)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd quickkcal
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   - **Web**: Opens automatically in browser
   - **iOS**: Press `i` to open in iOS Simulator
   - **Android**: Press `a` to open in Android Emulator
   - **Physical Device**: Scan QR code with Expo Go app

### Building for Production

- **Web**: `npm run build:web`
- **Android**: `npm run build:android`
- **iOS**: `npm run build:ios`

## Project Structure

```
quickkcal/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.js       # Home/Dashboard
│   │   ├── diary.js       # Food diary
│   │   ├── add.js         # Add/scan meals
│   │   └── profile.js     # Settings & goals
│   ├── details/[id].js    # Food entry details
│   ├── onboarding.js      # Initial setup
│   ├── about.js           # Help & info
│   └── _layout.js         # Root navigation
├── components/            # Reusable UI components
├── stores/                # Zustand state management
├── data/                  # Mock data & utilities
├── utils/                 # Helper functions
└── hooks/                 # Custom React hooks
```

## Key Screens

### 1. Onboarding
Multi-step setup to calculate personalized calorie goals using BMR/TDEE formulas.

### 2. Home (Dashboard)
- Circular progress ring showing remaining calories
- Quick stats: Base Goal, Food, Exercise
- Macro breakdown (Carbs, Protein, Fat)
- Primary "Log Food" action button

### 3. Diary
- Daily meal list organized by Breakfast/Lunch/Dinner/Snacks
- Date navigation with quick filters
- Search functionality across all entries
- Swipe actions for edit/delete

### 4. Add Food
- Smart food search with database results
- Custom food creation with nutritional info
- Meal scan feature (camera + photo library)
- Portion size calculator with multiple units

### 5. Profile & Settings
- Edit daily calorie goals and macro ratios
- Pre-built macro presets (Balanced, High-Protein, Low-Carb)
- App preferences and data management
- Privacy settings and export options

## Adding New Screens

1. **Create screen file** in appropriate `app/` subdirectory
2. **Add navigation** in `_layout.js` files
3. **Update state** in `stores/useAppStore.js` if needed
4. **Add components** in `components/` for reusable UI
5. **Test** on all platforms (iOS, Android, Web)

Example new screen:
```javascript
// app/insights.js
import React from 'react';
import { View, Text } from 'react-native';

export default function InsightsScreen() {
  return (
    <View>
      <Text>Weekly Insights</Text>
    </View>
  );
}
```

## Adding New Features

1. **Update data models** in `data/mockData.js`
2. **Extend store actions** in `stores/useAppStore.js`
3. **Create UI components** in `components/`
4. **Add utility functions** in `utils/helpers.js`
5. **Update navigation** if needed

## Next Steps

Here are concrete follow-up tasks to enhance QuickKcal:

### 🔥 High Priority
1. **Real Meal Scan API**: Integrate with food recognition services (Clarifai, Google Vision)
2. **Offline Sync Queue**: Queue food logs when offline, sync when connected
3. **Advanced Search**: Filters by brand, category, recent foods, favorites
4. **Barcode Scanner**: Quick UPC lookup for packaged foods
5. **Data Backup**: Export/import functionality with cloud sync

### 🚀 Medium Priority
6. **Weekly Insights**: Progress charts, streak tracking, weekly summaries
7. **Smart Notifications**: Meal timing reminders, goal achievement alerts
8. **Unit Conversions**: Imperial/metric toggle, volume/weight conversions

### 💡 Nice to Have
9. **Meal Templates**: Save common meals for quick logging
10. **Social Features**: Share progress, meal photos, friend challenges
11. **Integration**: Apple Health, Google Fit, fitness trackers
12. **Premium Features**: Advanced analytics, custom meal plans
13. **Voice Logging**: "Log 2 slices of pizza" voice command
14. **Dark Mode**: Full dark theme support

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## Support

- **Email**: support@quickkcal.com
- **Website**: https://quickkcal.com
- **Issues**: Report bugs via GitHub issues

## License

MIT License - see LICENSE file for details.

---

**QuickKcal**: Making healthy eating simple, one quick log at a time! 🥗⚡