import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { rtlRow } from '../../theme/rtl';

interface TabItem {
  id: string;
  label: string;
  iconName: string;
  isMaterial?: boolean;
}

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'الرئيسية', iconName: 'home' },
  { id: 'quran', label: 'المصحف', iconName: 'book-open-page-variant', isMaterial: true },
  { id: 'study', label: 'الحفظ', iconName: 'repeat' },
  { id: 'hadith', label: 'الأحاديث', iconName: 'library' },
  { id: 'adhkar', label: 'الأذكار', iconName: 'moon' },
  { id: 'settings', label: 'الإعدادات', iconName: 'settings' },
];

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomTabBar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              activeOpacity={0.8}
              onPress={() => onTabChange(tab.id)}
            >
              {tab.isMaterial ? (
                <MaterialCommunityIcons
                  name={tab.iconName as any}
                  size={20}
                  color={isActive ? '#06291e' : '#cbd5e1'}
                />
              ) : (
                <Ionicons
                  name={tab.iconName as any}
                  size={20}
                  color={isActive ? '#06291e' : '#cbd5e1'}
                />
              )}
              <Text
                numberOfLines={1}
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0a3225',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  // Six tabs share the bar equally so they fit narrow phones without clipping.
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginHorizontal: 1,
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: '#fae7a5',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#06291e',
    fontWeight: '800',
  },
});
