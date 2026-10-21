import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { rtlRow, rtlAlignRight } from '../theme/rtl';
import { TajweedCategory } from '../types';
import tajweedData from '../data/tajweed.json';
import tajweedAudio from '../data/tajweed_audio.json';
import surahsData from '../data/surahs.json';
import { getUserSettings } from '../utils/storage';
import { getAyahAudioUrl } from '../utils/reciters';
import { getWordAudioUrl } from '../utils/wordService';
import { usePlaylist } from '../utils/audioPlaylist';

// Where each example word sits in the Mushaf (generated from the Quran text): surah, ayah, first word, word count.
interface ExampleRef {
  text: string;
  surah?: number;
  ayah?: number;
  word?: number;
  count?: number;
}
const exampleRefs = tajweedAudio as Record<string, ExampleRef[]>;
const surahName = (n: number) => surahsData.find((x) => x.number === n)?.name_ar ?? '';

// One URL per word, so a two-word example plays word after word.
const wordUrls = (ref: ExampleRef): string[] =>
  Array.from({ length: ref.count ?? 1 }, (_, i) => getWordAudioUrl(ref.surah!, ref.ayah!, ref.word! + i));

export const TajweedScreen: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>(tajweedData[0].id);
  const tabsRef = useRef<ScrollView>(null);
  const [reciter, setReciter] = useState<string | undefined>(undefined);
  const { playingKey, toggle } = usePlaylist(() =>
    Alert.alert('تنبيه صوتي', 'تعذر تشغيل الصوت، يرجى التأكد من اتصال الإنترنت.')
  );

  useEffect(() => {
    getUserSettings().then((st) => setReciter(st.reciter));
  }, []);

  const categories = tajweedData as TajweedCategory[];
  const activeCategory = categories.find((c) => c.id === selectedCat) || categories[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>أحكام التجويد</Text>
        <Text style={styles.headerSub}>دليل ميسر لتلاوة وترتيل كتاب الله بإتقان</Text>

        {/* Categories Horizontal Tabs */}
        <ScrollView
          ref={tabsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          onContentSizeChange={() => tabsRef.current?.scrollToEnd({ animated: false })}
        >
          {categories.map((cat) => {
            const isActive = cat.id === selectedCat;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catTab,
                  isActive && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
                onPress={() => setSelectedCat(cat.id)}
              >
                <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                  {cat.name_ar}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Rules list for selected category */}
      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.catIntroCard}>
          <Text style={styles.catIntroTitle}>{activeCategory.name_ar}</Text>
          <Text style={styles.catIntroDesc}>{activeCategory.description}</Text>
        </View>

        <Text style={styles.rulesHeader}>الأحكام والتفاصيل:</Text>

        {activeCategory.rules.map((rule) => (
          <React.Fragment key={rule.id}>
            <View style={styles.ruleCard}>
              <View style={styles.ruleHeader}>
                <View style={[styles.ruleColorDot, { backgroundColor: rule.color }]} />
                <Text style={styles.ruleName}>{rule.name_ar}</Text>
              </View>

              <View style={styles.lettersRow}>
                <Text style={styles.lettersLabel}>حروف الحكم:</Text>
                <Text style={styles.lettersValue}>{rule.letters}</Text>
              </View>

              <Text style={styles.ruleExplanation}>{rule.rule}</Text>

              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>أمثلة قرآنية (اضغط على الكلمة لسماع نطقها):</Text>
                <View style={styles.exampleChips}>
                  {(exampleRefs[rule.id] || [{ text: rule.example }]).map((ref, i) => {
                    const playable = ref.surah !== undefined;
                    const key = `${rule.id}:${i}`;
                    const isPlaying = playingKey === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        disabled={!playable}
                        activeOpacity={0.8}
                        onPress={() => toggle(key, wordUrls(ref))}
                        style={[styles.exampleChip, isPlaying && styles.exampleChipActive]}
                      >
                        {playable && (
                          <Ionicons
                            name={isPlaying ? 'stop-circle' : 'volume-high'}
                            size={16}
                            color={isPlaying ? '#06291e' : '#e2ba59'}
                          />
                        )}
                        <Text style={[styles.exampleText, isPlaying && styles.exampleTextActive]}>{ref.text}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {(() => {
                  const first = (exampleRefs[rule.id] || []).find((r) => r.surah !== undefined);
                  if (!first) return null;
                  const key = `${rule.id}:ayah`;
                  const isPlaying = playingKey === key;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => toggle(key, [getAyahAudioUrl(reciter, first.surah!, first.ayah!)])}
                      style={[styles.ayahPlayBtn, isPlaying && styles.exampleChipActive]}
                    >
                      <Ionicons
                        name={isPlaying ? 'stop' : 'play'}
                        size={14}
                        color={isPlaying ? '#06291e' : '#fae7a5'}
                      />
                      <Text style={[styles.ayahPlayText, isPlaying && styles.exampleTextActive]}>
                        استمع للحكم في الآية · {surahName(first.surah!)} {first.ayah}
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </View>
          </React.Fragment>
        ))}

        {/* Color Legend Card */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>دليل ألوان المصحف المجود:</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>أحمر: المدود بأنواعها</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>أخضر: الغنة، الإخفاء، والإدغام بغنة</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#0ea5e9' }]} />
            <Text style={styles.legendText}>أزرق: حروف القلقلة (قطب جد)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>برتقالي: الإقلاب (قلب النون ميماً)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
            <Text style={styles.legendText}>بنفسجي: أحكام الميم الساكنة</Text>
          </View>
        </View>
      </ScrollView>
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
  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(250, 231, 165, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
  },
  catTabText: {
    fontSize: 12,
    color: '#fae7a5',
    fontWeight: '700',
  },
  catTabTextActive: {
    color: '#06291e',
  },
  contentScroll: {
    padding: 16,
    paddingBottom: 90,
  },
  catIntroCard: {
    backgroundColor: '#0d3527',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  catIntroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fae7a5',
    textAlign: 'right',
  },
  catIntroDesc: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 22,
    marginTop: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rulesHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'right',
  },
  ruleCard: {
    backgroundColor: '#092d21',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  ruleHeader: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ruleColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'right',
  },
  lettersRow: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  lettersLabel: {
    fontSize: 12,
    color: '#fae7a5',
    fontWeight: '600',
    textAlign: 'right',
  },
  lettersValue: {
    fontSize: 12,
    color: '#f8fafc',
    textAlign: 'right',
  },
  ruleExplanation: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  exampleBox: {
    backgroundColor: 'rgba(5, 27, 20, 0.7)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.2)',
  },
  exampleLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
    textAlign: 'right',
  },
  exampleText: {
    fontSize: 16,
    color: '#fae7a5',
    textAlign: 'right',
  },
  exampleTextActive: {
    color: '#06291e',
  },
  exampleChips: {
    flexDirection: rtlRow,
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(250, 231, 165, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
  },
  exampleChipActive: {
    backgroundColor: '#fae7a5',
    borderColor: '#fae7a5',
  },
  ayahPlayBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    alignSelf: rtlAlignRight,
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
  },
  ayahPlayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fae7a5',
  },
  legendCard: {
    backgroundColor: '#07251c',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
    marginTop: 10,
    alignItems: 'flex-end',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fae7a5',
    marginBottom: 10,
    textAlign: 'right',
  },
  legendRow: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'right',
  },
});
