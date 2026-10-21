import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { rtlRow } from '../theme/rtl';
import { DhikrCategory } from '../types';
import adhkarData from '../data/adhkar.json';

const { width } = Dimensions.get('window');

const TASBEEH_PHRASES = [
  'سُبْحَانَ اللَّهِ',
  'الْحَمْدُ لِلَّهِ',
  'لَا إِلَهَ إِلَّا اللَّهُ',
  'اللَّهُ أَكْبَرُ',
  'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
  'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
  'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِهِ',
];

export const AdhkarScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('morning');
  const [remainingCounts, setRemainingCounts] = useState<Record<string, number>>({});

  // Digital Tasbeeh State
  const [tasbeehCount, setTasbeehCount] = useState(0);
  const [tasbeehTarget, setTasbeehTarget] = useState(33);
  const [tasbeehPhraseIdx, setTasbeehPhraseIdx] = useState(0);

  const categories = adhkarData as DhikrCategory[];
  const currentCat = categories.find((c) => c.category === activeTab);

  const handleDhikrPress = (id: string, initialCount: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const current = remainingCounts[id] ?? initialCount;
    if (current > 0) {
      setRemainingCounts((prev) => ({
        ...prev,
        [id]: current - 1,
      }));
    }
  };

  const handleTasbeehTap = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setTasbeehCount((prev) => {
      const next = prev + 1;
      if (tasbeehTarget > 0 && next % tasbeehTarget === 0) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
      return next;
    });
  };

  const resetTasbeeh = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    setTasbeehCount(0);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الأذكار والسبحة الرقمية</Text>
        <Text style={styles.headerSub}>حصن المسلم اليومي ومسبحة التسبيح الذكية</Text>

        {/* Tab Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'morning' && styles.tabItemActive]}
            onPress={() => setActiveTab('morning')}
          >
            <Ionicons name="sunny" size={15} color={activeTab === 'morning' ? '#06291e' : '#fae7a5'} />
            <Text style={[styles.tabItemText, activeTab === 'morning' && styles.tabItemTextActive]}>
              أذكار الصباح
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'evening' && styles.tabItemActive]}
            onPress={() => setActiveTab('evening')}
          >
            <Ionicons name="moon" size={15} color={activeTab === 'evening' ? '#06291e' : '#fae7a5'} />
            <Text style={[styles.tabItemText, activeTab === 'evening' && styles.tabItemTextActive]}>
              أذكار المساء
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'sleep' && styles.tabItemActive]}
            onPress={() => setActiveTab('sleep')}
          >
            <Ionicons name="bed" size={15} color={activeTab === 'sleep' ? '#06291e' : '#fae7a5'} />
            <Text style={[styles.tabItemText, activeTab === 'sleep' && styles.tabItemTextActive]}>
              أذكار النوم
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'prayer' && styles.tabItemActive]}
            onPress={() => setActiveTab('prayer')}
          >
            <Ionicons name="sparkles" size={15} color={activeTab === 'prayer' ? '#06291e' : '#fae7a5'} />
            <Text style={[styles.tabItemText, activeTab === 'prayer' && styles.tabItemTextActive]}>
              بعد الصلاة
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'tasbeeh' && styles.tabItemActive]}
            onPress={() => setActiveTab('tasbeeh')}
          >
            <Ionicons name="radio-button-on" size={15} color={activeTab === 'tasbeeh' ? '#06291e' : '#fae7a5'} />
            <Text style={[styles.tabItemText, activeTab === 'tasbeeh' && styles.tabItemTextActive]}>
              السبحة الرقمية
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Screen Body */}
      {activeTab === 'tasbeeh' ? (
        // Electronic Digital Tasbeeh Mode
        <View style={styles.tasbeehContainer}>
          {/* Selected Phrase Switcher */}
          <TouchableOpacity
            style={styles.phraseSelector}
            onPress={() =>
              setTasbeehPhraseIdx((prev) => (prev + 1) % TASBEEH_PHRASES.length)
            }
          >
            <Text style={styles.phraseText}>{TASBEEH_PHRASES[tasbeehPhraseIdx]}</Text>
            <Text style={styles.phraseSwitchHint}>اضغط لتغيير صيغة الذكر ↻</Text>
          </TouchableOpacity>

          {/* Big Counter Bead Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.tasbeehBead}
            onPress={handleTasbeehTap}
          >
            <View style={styles.tasbeehInnerCircle}>
              <Text style={styles.tasbeehCountText}>{tasbeehCount}</Text>
              <Text style={styles.tasbeehSubCount}>
                {tasbeehTarget > 0 ? `الهدف: ${tasbeehTarget}` : 'حر'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Targets & Reset */}
          <View style={styles.tasbeehControls}>
            <View style={styles.targetsRow}>
              {[33, 99, 100, 0].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.targetPill, tasbeehTarget === t && styles.targetPillActive]}
                  onPress={() => setTasbeehTarget(t)}
                >
                  <Text
                    style={[styles.targetPillText, tasbeehTarget === t && styles.targetPillTextActive]}
                  >
                    {t === 0 ? 'مفتوح' : `${t}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={resetTasbeeh}>
              <Ionicons name="refresh" size={18} color="#f87171" />
              <Text style={styles.resetBtnText}>تصفير العداد</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Regular Adhkar List
        <ScrollView contentContainerStyle={styles.adhkarScroll} showsVerticalScrollIndicator={false}>
          {currentCat?.items.map((item) => {
            const count = remainingCounts[item.id] ?? item.count;
            const isDone = count === 0;

            return (
              <React.Fragment key={item.id}>
                <View style={[styles.dhikrCard, isDone && styles.dhikrCardDone]}>
                  <Text style={styles.dhikrText}>{item.text}</Text>

                  {item.fadl ? (
                    <View style={styles.fadlBox}>
                      <Text style={styles.fadlText}>فضل الذكر: {item.fadl}</Text>
                    </View>
                  ) : null}

                  <View style={styles.dhikrFooter}>
                    <TouchableOpacity
                      style={[styles.counterBtn, isDone && styles.counterBtnDone]}
                      activeOpacity={0.8}
                      onPress={() => handleDhikrPress(item.id, item.count)}
                    >
                      {isDone ? (
                        <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                      ) : (
                        <Text style={styles.counterBtnText}>{count}</Text>
                      )}
                      <Text style={styles.counterBtnLabel}>
                        {isDone ? 'تم بحمد الله' : 'المتبقي'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </React.Fragment>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 12,
    backgroundColor: '#07251c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 186, 89, 0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fae7a5',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerSub: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tabsScroll: {
    flexGrow: 1,
    flexDirection: rtlRow,
    gap: 8,
    marginTop: 14,
    paddingBottom: 4,
  },
  tabItem: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(250, 231, 165, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
  },
  tabItemActive: {
    backgroundColor: '#fae7a5',
  },
  tabItemText: {
    fontSize: 12,
    color: '#fae7a5',
    fontWeight: '700',
  },
  tabItemTextActive: {
    color: '#06291e',
  },
  adhkarScroll: {
    padding: 16,
    paddingBottom: 90,
  },
  dhikrCard: {
    backgroundColor: '#0d3527',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
  },
  dhikrCardDone: {
    opacity: 0.7,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  dhikrText: {
    fontSize: 18,
    lineHeight: 34,
    color: '#f8fafc',
    textAlign: 'right',
  },
  fadlBox: {
    backgroundColor: 'rgba(5, 27, 20, 0.6)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderRightWidth: 3,
    borderRightColor: '#fae7a5',
  },
  fadlText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 20,
    textAlign: 'right',
  },
  dhikrFooter: {
    alignItems: 'center',
    marginTop: 14,
  },
  counterBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(250, 231, 165, 0.15)',
    borderWidth: 1.5,
    borderColor: '#fae7a5',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  counterBtnDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  counterBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fae7a5',
  },
  counterBtnLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  tasbeehContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  phraseSelector: {
    backgroundColor: '#0d3527',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.35)',
    alignItems: 'center',
    width: '100%',
  },
  phraseText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fae7a5',
    textAlign: 'center',
  },
  phraseSwitchHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
  tasbeehBead: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: (width * 0.65) / 2,
    backgroundColor: '#0d3527',
    borderWidth: 5,
    borderColor: '#e2ba59',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fae7a5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  tasbeehInnerCircle: {
    width: width * 0.52,
    height: width * 0.52,
    borderRadius: (width * 0.52) / 2,
    backgroundColor: '#07251c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250, 231, 165, 0.3)',
  },
  tasbeehCountText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fae7a5',
  },
  tasbeehSubCount: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  tasbeehControls: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  targetsRow: {
    flexDirection: rtlRow,
    gap: 10,
  },
  targetPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#0d3527',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  targetPillActive: {
    backgroundColor: '#fae7a5',
    borderColor: '#fae7a5',
  },
  targetPillText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  targetPillTextActive: {
    color: '#06291e',
  },
  resetBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resetBtnText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
  },
});
