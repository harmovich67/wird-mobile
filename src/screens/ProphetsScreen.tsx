import React, { useState, useEffect } from 'react';
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
import { Prophet, ProphetPassage, Ayah } from '../types';
import prophetsData from '../data/prophets.json';
import versesData from '../data/quran_verses.json';
import { addPassage, getUserSettings } from '../utils/storage';
import { getAyahRangeUrls } from '../utils/reciters';
import { usePlaylist } from '../utils/audioPlaylist';

interface Props {
  onNavigate: (tab: string, params?: any) => void;
}

const prophets = prophetsData as Prophet[];
const verses = versesData as unknown as Record<string, Ayah[]>;

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicDigits = (n: number) =>
  String(n)
    .split('')
    .map((d) => ARABIC_DIGITS[Number(d)])
    .join('');

const getPassageAyahs = (p: ProphetPassage): Ayah[] =>
  (verses[String(p.surah)] || []).filter((a) => a.ayah >= p.from && a.ayah <= p.to);

const ayahRange = (p: ProphetPassage) =>
  p.from === p.to ? `${p.surah_name} · ${toArabicDigits(p.from)}` : `${p.surah_name} · ${toArabicDigits(p.from)}–${toArabicDigits(p.to)}`;

export const ProphetsScreen: React.FC<Props> = ({ onNavigate }) => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [openPassageId, setOpenPassageId] = useState<string | null>(null);
  const [reciter, setReciter] = useState<string | undefined>(undefined);

  const { playingKey: playingId, toggle, stop: stopAudio } = usePlaylist(() =>
    Alert.alert('تنبيه صوتي', 'تعذر تشغيل التسجيل الصوتي، يرجى التأكد من اتصال الإنترنت.')
  );

  useEffect(() => {
    getUserSettings().then((s) => setReciter(s.reciter));
  }, []);

  // Plays the passage ayah by ayah with the reciter chosen in Settings.
  const togglePassageAudio = (passage: ProphetPassage) =>
    toggle(passage.id, getAyahRangeUrls(reciter, passage.surah, passage.from, passage.to));

  const memorizePassage = async (passage: ProphetPassage) => {
    const ayahs = getPassageAyahs(passage);
    if (!ayahs.length) return;
    try {
      await addPassage({
        title: passage.title,
        sourceType: 'quran',
        reference: `سورة ${passage.surah_name} (${passage.from} - ${passage.to})`,
        surahNumber: passage.surah,
        fromAyah: passage.from,
        toAyah: passage.to,
        text: ayahs.map((a) => `${a.text} ﴿${toArabicDigits(a.ayah)}﴾`).join(' '),
      });
      Alert.alert('تمت الإضافة', 'أضيف المقطع إلى ورد الحفظ بنجاح!', [
        { text: 'متابعة القراءة', style: 'cancel' },
        { text: 'الانتقال للحفظ', onPress: () => onNavigate('study') },
      ]);
    } catch {
      Alert.alert('خطأ', 'تعذر إضافة المقطع، حاول مرة أخرى.');
    }
  };

  const selected = prophets.find((p) => p.slug === selectedSlug) || null;

  const backToList = () => {
    stopAudio();
    setOpenPassageId(null);
    setSelectedSlug(null);
  };

  // ---------- Detail view ----------
  if (selected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backRow} onPress={backToList} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={18} color="#fae7a5" />
            <Text style={styles.backText}>كل القصص</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selected.name_ar}</Text>
          <Text style={styles.headerSub}>{selected.title_ar}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.mentionPill}>
              <Ionicons name="book" size={12} color="#e2ba59" />
              <Text style={styles.mentionText}>ورد ذكره {toArabicDigits(selected.mentions)} مرة في القرآن</Text>
            </View>
            <Text style={styles.summary}>{selected.summary_ar}</Text>
          </View>

          <Text style={styles.sectionLabel}>الدروس والعبر</Text>
          <View style={styles.card}>
            {selected.lessons.map((lesson, i) => (
              <View key={i} style={styles.lessonRow}>
                <View style={styles.lessonNum}>
                  <Text style={styles.lessonNumText}>{toArabicDigits(i + 1)}</Text>
                </View>
                <Text style={styles.lessonText}>{lesson}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>المقاطع القرآنية</Text>
          {selected.passages.map((passage) => {
            const isOpen = openPassageId === passage.id;
            const isPlaying = playingId === passage.id;
            return (
              <View key={passage.id} style={styles.passageCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setOpenPassageId(isOpen ? null : passage.id)}
                  style={styles.passageHead}
                >
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
                  <View style={styles.passageHeadText}>
                    <Text style={styles.passageTitle}>{passage.title}</Text>
                    <Text style={styles.passageRef}>{ayahRange(passage)}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.passageTheme}>{passage.theme}</Text>

                {isOpen && (
                  <View style={styles.passageBody}>
                    <Text style={styles.ayahText}>
                      {getPassageAyahs(passage).map((a) => `${a.text} ﴿${toArabicDigits(a.ayah)}﴾ `).join('')}
                    </Text>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, isPlaying && styles.actionBtnActive]}
                        activeOpacity={0.85}
                        onPress={() => togglePassageAudio(passage)}
                      >
                        <Ionicons
                          name={isPlaying ? 'stop' : 'play'}
                          size={15}
                          color={isPlaying ? '#06291e' : '#fae7a5'}
                        />
                        <Text style={[styles.actionText, isPlaying && styles.actionTextActive]}>
                          {isPlaying ? 'إيقاف' : 'استماع'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        activeOpacity={0.85}
                        onPress={() => memorizePassage(passage)}
                      >
                        <Ionicons name="add-circle-outline" size={16} color="#fae7a5" />
                        <Text style={styles.actionText}>أضف للحفظ</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ---------- List view ----------
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>قصص الأنبياء</Text>
        <Text style={styles.headerSub}>من القرآن الكريم، مع الاستماع والإضافة لورد الحفظ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {prophets.map((prophet, index) => (
          <TouchableOpacity
            key={prophet.slug}
            style={styles.listCard}
            activeOpacity={0.85}
            onPress={() => setSelectedSlug(prophet.slug)}
          >
            <View style={styles.listAvatar}>
              <Text style={styles.listAvatarText}>{toArabicDigits(index + 1)}</Text>
            </View>
            <View style={styles.listInfo}>
              <Text style={styles.listName}>{prophet.name_ar}</Text>
              <Text style={styles.listTitle}>{prophet.title_ar}</Text>
              <Text style={styles.listMeta}>
                {toArabicDigits(prophet.passages.length)} مقاطع · ذُكر {toArabicDigits(prophet.mentions)} مرة
              </Text>
            </View>
            <Ionicons name="chevron-back" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ))}
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
    paddingBottom: 14,
    backgroundColor: '#07251c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 186, 89, 0.2)',
  },
  backRow: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fae7a5',
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
  contentScroll: {
    padding: 16,
    paddingBottom: 90,
  },
  listCard: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0d3527',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
  },
  listAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(226, 186, 89, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fae7a5',
  },
  listInfo: {
    flex: 1,
    alignItems: rtlAlignRight,
  },
  listName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'right',
  },
  listTitle: {
    fontSize: 12,
    color: '#e2ba59',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  listMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#0d3527',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
    marginBottom: 16,
  },
  mentionPill: {
    flexDirection: rtlRow,
    alignItems: 'center',
    alignSelf: rtlAlignRight,
    gap: 6,
    backgroundColor: 'rgba(226, 186, 89, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  mentionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e2ba59',
  },
  summary: {
    fontSize: 14,
    lineHeight: 26,
    color: '#e2e8f0',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 10,
    textAlign: 'right',
  },
  lessonRow: {
    flexDirection: rtlRow,
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  lessonNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  lessonNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
  },
  lessonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 23,
    color: '#cbd5e1',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  passageCard: {
    backgroundColor: '#092d21',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  passageHead: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  passageHeadText: {
    flex: 1,
    alignItems: rtlAlignRight,
  },
  passageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fae7a5',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  passageRef: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    textAlign: 'right',
  },
  passageTheme: {
    fontSize: 12,
    lineHeight: 20,
    color: '#cbd5e1',
    marginTop: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  passageBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 186, 89, 0.2)',
  },
  ayahText: {
    fontSize: 22,
    lineHeight: 46,
    color: '#fae7a5',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionsRow: {
    flexDirection: rtlRow,
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(250, 231, 165, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
  },
  actionBtnActive: {
    backgroundColor: '#fae7a5',
    borderColor: '#fae7a5',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fae7a5',
  },
  actionTextActive: {
    color: '#06291e',
  },
});
