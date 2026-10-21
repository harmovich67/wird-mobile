import React, { useState } from 'react';
import { View, StyleSheet, I18nManager, DevSettings } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// All screens lay out Arabic RTL manually (row-reverse, flex-end, textAlign: 'right'),
// so native RTL must stay OFF — otherwise those flips are applied twice and content jumps left.
try {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
  // A previous build persisted forceRTL(true); the reset only applies after a reload.
  if (I18nManager.isRTL && __DEV__) DevSettings.reload();
} catch (e) {}

import { SplashScreen } from './src/components/Splash/SplashScreen';
import { BottomTabBar } from './src/components/Navigation/BottomTabBar';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { QuranScreen } from './src/screens/QuranScreen';
import { StudyScreen } from './src/screens/StudyScreen';
import { HadithScreen } from './src/screens/HadithScreen';
import { TajweedScreen } from './src/screens/TajweedScreen';
import { AdhkarScreen } from './src/screens/AdhkarScreen';
import { ProphetsScreen } from './src/screens/ProphetsScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Colors } from './src/theme/colors';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [navParams, setNavParams] = useState<any>(null);

  const handleNavigate = (tab: string, params?: any) => {
    setActiveTab(tab);
    setNavParams(params || null);
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen onNavigate={handleNavigate} />;
      case 'quran':
        return <QuranScreen onNavigate={handleNavigate} />;
      case 'study':
        return <StudyScreen passageParam={navParams?.passage} onNavigate={handleNavigate} />;
      case 'hadith':
        return <HadithScreen onNavigate={handleNavigate} />;
      case 'tajweed':
        return <TajweedScreen />;
      case 'adhkar':
        return <AdhkarScreen />;
      case 'prophets':
        return <ProphetsScreen onNavigate={handleNavigate} />;
      case 'quiz':
        return <QuizScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.screenWrapper}>{renderActiveScreen()}</View>

        {/* Global Bottom Tab Bar */}
        <BottomTabBar activeTab={activeTab} onTabChange={handleNavigate} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  screenWrapper: {
    flex: 1,
  },
});
