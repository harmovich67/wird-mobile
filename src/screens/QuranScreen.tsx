import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { Colors } from '../theme/colors';
import { rtlRow } from '../theme/rtl';
import { Surah, Ayah, UserSettings, WordLookupResult } from '../types';
import surahsData from '../data/surahs.json';
import versesData from '../data/quran_verses.json';
import { addPassage, getUserSettings } from '../utils/storage';
import { lookupWord, splitAyahWords, getWordAudioUrl } from '../utils/wordService';
import { getAyahAudioUrl } from '../utils/reciters';
import { explainWordWithAi, explainAyahWithAi, AiAyahAnalysis } from '../utils/aiService';

interface Props {
  onNavigate: (tab: string, params?: any) => void;
}

export const QuranScreen: React.FC<Props> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [surahVerses, setSurahVerses] = useState<Ayah[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Audio player refs - persistent to avoid native release crashes
  const ayahPlayerRef = useRef<AudioPlayer | null>(null);
  const wordPlayerRef = useRef<AudioPlayer | null>(null);

  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);

  // Word modal state
  const [selectedWordData, setSelectedWordData] = useState<
    (WordLookupResult & { ayahText: string; surahName: string }) | null
  >(null);
  const [isWordModalVisible, setIsWordModalVisible] = useState(false);
  const [isAiExplainingWord, setIsAiExplainingWord] = useState(false);
  const [aiWordExplanation, setAiWordExplanation] = useState<string | null>(null);

  // Ayah AI Modal state
  const [selectedAyahForAi, setSelectedAyahForAi] = useState<{
    ayah: Ayah;
    surah: Surah;
    analysis?: AiAyahAnalysis;
    isLoading?: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const s = await getUserSettings();
      setSettings(s);
    })();
  }, []);

  // Turning AI off in Settings hides every AI entry point here; it defaults to on.
  const aiEnabled = settings?.aiEnabled !== false;

  // Cleanup players only when unmounting the screen
  useEffect(() => {
    return () => {
      try {
        if (ayahPlayerRef.current) {
          if (ayahPlayerRef.current.playing) ayahPlayerRef.current.pause();
          ayahPlayerRef.current.release();
          ayahPlayerRef.current = null;
        }
      } catch {}

      try {
        if (wordPlayerRef.current) {
          if (wordPlayerRef.current.playing) wordPlayerRef.current.pause();
          wordPlayerRef.current.release();
          wordPlayerRef.current = null;
        }
      } catch {}
    };
  }, []);

  const filteredSurahs = (surahsData as Surah[]).filter(
    (s) =>
      s.name_ar.includes(search) ||
      s.name_en.toLowerCase().includes(search.toLowerCase()) ||
      s.number.toString() === search
  );

  const openSurah = async (surah: Surah) => {
    const s = await getUserSettings();
    setSettings(s);
    setSelectedSurah(surah);
    const verses = (versesData as Record<string, Ayah[]>)[surah.number.toString()] || [];
    setSurahVerses(verses);
  };

  const closeSurah = async () => {
    try {
      if (ayahPlayerRef.current?.playing) {
        ayahPlayerRef.current.pause();
      }
    } catch {}

    try {
      if (wordPlayerRef.current?.playing) {
        wordPlayerRef.current.pause();
      }
    } catch {}

    setPlayingAyah(null);
    setPlayingWordKey(null);
    setSelectedSurah(null);
    setIsWordModalVisible(false);
    setSelectedAyahForAi(null);
  };

  // Play full Ayah audio safely using replace
  const playAyahAudio = async (surahNum: number, ayahNum: number) => {
    try {
      if (playingAyah === ayahNum) {
        try {
          if (ayahPlayerRef.current?.playing) {
            ayahPlayerRef.current.pause();
          }
        } catch {}
        setPlayingAyah(null);
        return;
      }

      setPlayingAyah(ayahNum);

      const audioUrl = getAyahAudioUrl(settings?.reciter, surahNum, ayahNum);

      if (!ayahPlayerRef.current) {
        ayahPlayerRef.current = createAudioPlayer(audioUrl);
      } else {
        try {
          ayahPlayerRef.current.replace(audioUrl);
        } catch {
          try { ayahPlayerRef.current.release(); } catch {}
          ayahPlayerRef.current = createAudioPlayer(audioUrl);
        }
      }
      ayahPlayerRef.current.play();
    } catch {
      setPlayingAyah(null);
      Alert.alert('تنبيه الصوتي', 'تعذر تشغيل التسجيل الصوتي، يرجى التأكد من اتصال الإنترنت.');
    }
  };

  // Play word audio safely using replace without destroying native object
  const playWordAudioOnly = (audioUrl: string, key?: string) => {
    try {
      if (key) setPlayingWordKey(key);

      if (!wordPlayerRef.current) {
        wordPlayerRef.current = createAudioPlayer(audioUrl);
      } else {
        try {
          wordPlayerRef.current.replace(audioUrl);
        } catch {
          try { wordPlayerRef.current.release(); } catch {}
          wordPlayerRef.current = createAudioPlayer(audioUrl);
        }
      }
      wordPlayerRef.current.play();
    } catch {
      // Audio playback fails silently without red screen
    }
  };

  // Handle word tap: Play pronunciation + lookup meaning + open sheet
  const handleWordPress = (
    surahNum: number,
    ayahNum: number,
    wordIndex: number,
    wordText: string,
    fullAyahText: string
  ) => {
    const key = `${surahNum}_${ayahNum}_${wordIndex}`;
    const result = lookupWord(surahNum, ayahNum, wordIndex, wordText);

    // Play word audio immediately
    playWordAudioOnly(result.audioUrl, key);

    setSelectedWordData({
      ...result,
      ayahText: fullAyahText,
      surahName: selectedSurah?.name_ar || '',
    });
    setAiWordExplanation(null);
    setIsWordModalVisible(true);
  };

  // Request AI explanation for word
  const handleAskAiAboutWord = async () => {
    if (!selectedWordData) return;
    if (!settings?.geminiApiKey) {
      Alert.alert(
        'مفتاح الذكاء الاصطناعي غير مسجل',
        'لتفعيل توجيهات وشروح الذكاء الاصطناعي (Gemini)، يرجى حفظ مفتاح API المجاني الخاص بك في شاشة الإعدادات.',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'الذهاب للإعدادات',
            onPress: () => {
              setIsWordModalVisible(false);
              closeSurah();
              onNavigate('settings');
            },
          },
        ]
      );
      return;
    }

    setIsAiExplainingWord(true);
    try {
      const explanation = await explainWordWithAi(
        selectedWordData.word,
        selectedWordData.ayahText,
        selectedWordData.surahName,
        selectedWordData.ayahNumber
      );
      setAiWordExplanation(explanation);
    } catch (err: any) {
      Alert.alert('تعذر استدعاء الذكاء الاصطناعي', err.message || 'يرجى التحقق من المفتاح واتصال الإنترنت.');
    } finally {
      setIsAiExplainingWord(false);
    }
  };

  // Open Ayah AI Guidance
  const handleOpenAyahAi = async (ayah: Ayah) => {
    if (!selectedSurah) return;
    if (!settings?.geminiApiKey) {
      Alert.alert(
        'مفتاح الذكاء الاصطناعي غير مسجل',
        'لاستخراج المتشابهات والتوجيه الذهني للحفظ بالذكاء الاصطناعي، يرجى حفظ مفتاح Gemini في شاشة الإعدادات.',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'الذهاب للإعدادات',
            onPress: () => {
              closeSurah();
              onNavigate('settings');
            },
          },
        ]
      );
      return;
    }

    setSelectedAyahForAi({ ayah, surah: selectedSurah, isLoading: true });
    try {
      const analysis = await explainAyahWithAi(ayah.text, selectedSurah.name_ar, ayah.ayah);
      setSelectedAyahForAi({ ayah, surah: selectedSurah, analysis, isLoading: false });
    } catch (err: any) {
      Alert.alert('خطأ', 'تعذر تحليل الآية بالذكاء الاصطناعي.');
      setSelectedAyahForAi(null);
    }
  };

  const handleAddToWird = async (ayah: Ayah) => {
    if (!selectedSurah) return;
    try {
      await addPassage({
        title: `سورة ${selectedSurah.name_ar} (آية ${ayah.ayah})`,
        sourceType: 'quran',
        reference: `سورة ${selectedSurah.name_ar} · ${selectedSurah.number}:${ayah.ayah}`,
        surahNumber: selectedSurah.number,
        fromAyah: ayah.ayah,
        toAyah: ayah.ayah,
        text: ayah.text,
      });
      Alert.alert('تمت الإضافة', `أضيفت الآية (${ayah.ayah}) من سورة ${selectedSurah.name_ar} إلى ورد الحفظ بنجاح!`, [
        { text: 'متابعة التصفح', style: 'cancel' },
        {
          text: 'الانتقال للحفظ',
          onPress: () => {
            closeSurah();
            onNavigate('study');
          },
        },
      ]);
    } catch {
      Alert.alert('خطأ', 'تعذر الحفظ في الذاكرة.');
    }
  };

  const renderSurahItem = ({ item }: { item: Surah }) => (
    <TouchableOpacity
      style={styles.surahCard}
      activeOpacity={0.75}
      onPress={() => openSurah(item)}
    >
      {/* Right side: Number and Arabic Name */}
      <View style={styles.surahRight}>
        <View style={styles.surahNumberCircle}>
          <Text style={styles.surahNumberText}>{item.number}</Text>
        </View>
        <View style={styles.surahInfo}>
          <Text style={styles.surahNameAr}>{item.name_ar}</Text>
          <Text style={styles.surahSubInfo}>
            {item.revelation === 'Meccan' ? 'مكية' : 'مدنية'} · {item.ayah_count} آيات
          </Text>
        </View>
      </View>

      {/* Left side: English Name and Arrow */}
      <View style={styles.surahLeft}>
        <Text style={styles.surahNameEn}>{item.name_en}</Text>
        <Ionicons name="chevron-back" size={16} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Quran Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المصحف الشريف</Text>
        <Text style={styles.headerSub}>تصفح سور القرآن الكريم · اضغط على أي كلمة لسماع نطقها وتفسيرها</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#fae7a5" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث برقم السورة أو اسمها..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Surahs List */}
      <FlatList
        data={filteredSurahs}
        keyExtractor={(item) => item.number.toString()}
        renderItem={renderSurahItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Surah Detail Modal */}
      <Modal
        visible={selectedSurah !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={closeSurah}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header (RTL: Back button on the RIGHT side) */}
          <LinearGradient colors={['#104938', '#06291e']} style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSurah} style={styles.modalBackBtn}>
              <View style={{ flexDirection: rtlRow, alignItems: 'center', gap: 4 }}>
                <Ionicons name="arrow-forward" size={20} color="#fae7a5" />
                <Text style={{ color: '#fae7a5', fontSize: 13, fontWeight: '700' }}>رجوع</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.modalTitleWrap}>
              <Text style={styles.modalTitle}>سورة {selectedSurah?.name_ar}</Text>
              <Text style={styles.modalSub}>
                {selectedSurah?.revelation === 'Meccan' ? 'مكية' : 'مدنية'} · {selectedSurah?.ayah_count} آيات
              </Text>
            </View>
            <View style={{ width: 60 }} />
          </LinearGradient>

          {/* Verses FlatList for high performance */}
          <FlatList
            data={surahVerses}
            keyExtractor={(item) => item.ayah.toString()}
            renderItem={({ item: v }) => {
              const isPlaying = playingAyah === v.ayah;
              const words = splitAyahWords(v.text);

              return (
                <View style={styles.verseBox}>
                  {/* Verse Header (RTL: Badge on right, actions on left) */}
                  <View style={styles.verseHeader}>
                    <View style={styles.verseNumberBadge}>
                      <Text style={styles.verseNumberText}>الآية {v.ayah}</Text>
                    </View>
                    <View style={styles.verseActions}>
                      {/* Audio Button */}
                      <TouchableOpacity
                        style={[styles.verseActionBtn, isPlaying && styles.verseActionBtnActive]}
                        onPress={() => playAyahAudio(selectedSurah!.number, v.ayah)}
                      >
                        <Ionicons
                          name={isPlaying ? 'pause' : 'volume-high'}
                          size={15}
                          color={isPlaying ? '#06291e' : '#fae7a5'}
                        />
                      </TouchableOpacity>

                      {/* AI Guidance Button */}
                      {aiEnabled && (
                        <TouchableOpacity
                          style={styles.verseActionAiBtn}
                          onPress={() => handleOpenAyahAi(v)}
                        >
                          <Ionicons name="sparkles" size={13} color="#fae7a5" />
                          <Text style={styles.verseActionAiBtnText}>تدبر ومتشابهات</Text>
                        </TouchableOpacity>
                      )}

                      {/* Add to Wird Button */}
                      <TouchableOpacity
                        style={styles.verseActionBtn}
                        onPress={() => handleAddToWird(v)}
                      >
                        <Ionicons name="add" size={16} color="#fae7a5" />
                        <Text style={styles.verseActionBtnText}>أضف للورد</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Ayah Words with React.Fragment to fix React 19 TextProps key error */}
                  <Text style={[styles.verseText, { fontSize: settings?.fontSize || 22 }]}>
                    {words.map((w, wIdx) => {
                      const wordIndex = wIdx + 1;
                      const isWordPlaying =
                        playingWordKey === `${selectedSurah!.number}_${v.ayah}_${wordIndex}`;
                      return (
                        <React.Fragment key={wIdx}>
                          <Text
                            onPress={() =>
                              handleWordPress(
                                selectedSurah!.number,
                                v.ayah,
                                wordIndex,
                                w,
                                v.text
                              )
                            }
                            style={[
                              styles.clickableWord,
                              isWordPlaying && styles.clickableWordPlaying,
                            ]}
                          >
                            {w}{' '}
                          </Text>
                        </React.Fragment>
                      );
                    })}
                    <Text style={styles.ayahMark}>﴿{v.ayah}﴾ </Text>
                  </Text>
                </View>
              );
            }}
            ListHeaderComponent={() => {
              if (selectedSurah?.number !== 1 && selectedSurah?.number !== 9) {
                return (
                  <View style={styles.bismillahBox}>
                    <Text style={styles.bismillahText}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
                  </View>
                );
              }
              return null;
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyVersesBox}>
                <Ionicons name="book-outline" size={48} color="#64748b" />
                <Text style={styles.emptyVersesTitle}>سورة {selectedSurah?.name_ar}</Text>
                <Text style={styles.emptyVersesText}>
                  عدد آيات السورة {selectedSurah?.ayah_count} آية.
                </Text>
              </View>
            )}
            contentContainerStyle={styles.versesScroll}
            initialNumToRender={12}
            maxToRenderPerBatch={16}
            windowSize={9}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* Word Meaning & Pronunciation Modal (100% Arabic RTL) */}
      <Modal
        visible={isWordModalVisible && selectedWordData !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsWordModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Word Header (RTL: Word & metadata on the RIGHT, Play Audio button on the LEFT) */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderRight}>
                <Text style={styles.sheetWordTitle}>« {selectedWordData?.word} »</Text>
                <Text style={styles.sheetWordMeta}>
                  سورة {selectedWordData?.surahName} · آية {selectedWordData?.ayahNumber} · الكلمة {selectedWordData?.index}
                </Text>
              </View>

              {/* Replay Pronunciation Button on the LEFT */}
              <TouchableOpacity
                style={styles.sheetPlayAudioBtn}
                onPress={() =>
                  selectedWordData && playWordAudioOnly(selectedWordData.audioUrl)
                }
              >
                <Ionicons name="volume-high" size={20} color="#06291e" />
                <Text style={styles.sheetPlayAudioBtnText}>استمع للفظ</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Word Meanings in Classical Books */}
              <View style={styles.sheetSection}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="book-outline" size={17} color="#fae7a5" />
                  <Text style={styles.sheetSectionTitle}>بيان غريب الكلمة ومعناها</Text>
                </View>

                {selectedWordData?.meanings && selectedWordData.meanings.length > 0 ? (
                  selectedWordData.meanings.map((m, idx) => (
                    <View key={idx} style={styles.meaningItem}>
                      <View style={styles.meaningSourceBadge}>
                        <Text style={styles.meaningSourceText}>
                          {m.book} ({m.author})
                        </Text>
                      </View>
                      <Text style={styles.meaningText}>{m.meaning}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.noMeaningBox}>
                    <Text style={styles.noMeaningText}>
                      هذه الكلمة من الكلمات القرآنية الجلية والمعروفة المعنى. راجع التفسير الميسر للآية أدناه أو استعن برفيق الحفظ الذكي.
                    </Text>
                  </View>
                )}
              </View>

              {/* Ayah Tafsir */}
              <View style={styles.sheetSection}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="reader-outline" size={17} color="#fae7a5" />
                  <Text style={styles.sheetSectionTitle}>التفسير الميسر للآية كاملة</Text>
                </View>
                <Text style={styles.tafsirText}>{selectedWordData?.tafsir}</Text>
              </View>

              {/* Gemini AI Word Coach */}
              {aiEnabled && (
                <View style={styles.sheetSection}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="sparkles" size={17} color="#fae7a5" />
                    <Text style={styles.sheetSectionTitle}>رفيق الحفظ الذكي (Gemini AI)</Text>
                  </View>

                  {aiWordExplanation ? (
                    <View style={styles.aiResultBox}>
                      <Text style={styles.aiResultText}>{aiWordExplanation}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.aiAskBtn, isAiExplainingWord && { opacity: 0.7 }]}
                      onPress={handleAskAiAboutWord}
                      disabled={isAiExplainingWord}
                    >
                      {isAiExplainingWord ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator size="small" color="#06291e" />
                          <Text style={styles.aiAskBtnText}>جارٍ التحليل واستخراج الدلالة...</Text>
                        </View>
                      ) : (
                        <View style={styles.loadingRow}>
                          <Ionicons name="bulb-outline" size={18} color="#06291e" />
                          <Text style={styles.aiAskBtnText}>
                            ✨ اشرح سر الكلمة ورابط حفظها بالذكاء الاصطناعي
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setIsWordModalVisible(false)}
              >
                <Text style={styles.sheetCloseBtnText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ayah AI Guidance Modal (100% Arabic RTL) */}
      <Modal
        visible={selectedAyahForAi !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAyahForAi(null)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderRight}>
                <Text style={styles.sheetWordTitle}>
                  تدبر سورة {selectedAyahForAi?.surah?.name_ar} (آية {selectedAyahForAi?.ayah?.ayah})
                </Text>
                <Text style={styles.sheetWordMeta}>توجيهات الحفظ والمتشابهات القرآنية</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedAyahForAi(null)}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Ayah Text Box */}
              <View style={styles.aiAyahTextBox}>
                <Text style={styles.aiAyahText}>{selectedAyahForAi?.ayah?.text}</Text>
              </View>

              {selectedAyahForAi?.isLoading ? (
                <View style={styles.aiLoadingContainer}>
                  <ActivityIndicator size="large" color="#fae7a5" />
                  <Text style={styles.aiLoadingText}>
                    جارٍ استحضار المتشابهات والتوجيه الذهني للحفظ...
                  </Text>
                </View>
              ) : selectedAyahForAi?.analysis ? (
                <>
                  {/* Tafsir & Tadabbur */}
                  {selectedAyahForAi.analysis.tafsir ? (
                    <View style={styles.sheetSection}>
                      <View style={styles.sectionTitleRow}>
                        <Ionicons name="book" size={17} color="#fae7a5" />
                        <Text style={styles.sheetSectionTitle}>التفسير والتدبر</Text>
                      </View>
                      <Text style={styles.tafsirText}>{selectedAyahForAi.analysis.tafsir}</Text>
                    </View>
                  ) : null}

                  {/* Mutashabihat */}
                  {selectedAyahForAi.analysis.mutashabihat ? (
                    <View style={styles.sheetSection}>
                      <View style={styles.sectionTitleRow}>
                        <Ionicons name="git-compare-outline" size={17} color="#38bdf8" />
                        <Text style={[styles.sheetSectionTitle, { color: '#38bdf8' }]}>
                          المتشابهات القرآنية وفروق الألفاظ
                        </Text>
                      </View>
                      <View style={styles.mutaBox}>
                        <Text style={styles.mutaText}>
                          {selectedAyahForAi.analysis.mutashabihat}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Memorization Tip */}
                  {selectedAyahForAi.analysis.memorizationTip ? (
                    <View style={styles.sheetSection}>
                      <View style={styles.sectionTitleRow}>
                        <Ionicons name="key-outline" size={17} color="#10b981" />
                        <Text style={[styles.sheetSectionTitle, { color: '#10b981' }]}>
                          مفتاح الحفظ والربط الذهني
                        </Text>
                      </View>
                      <View style={styles.tipBox}>
                        <Text style={styles.tipText}>
                          {selectedAyahForAi.analysis.memorizationTip}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </>
              ) : null}
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setSelectedAyahForAi(null)}
              >
                <Text style={styles.sheetCloseBtnText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 16,
    backgroundColor: '#07251c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 186, 89, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fae7a5',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  searchBar: {
    flexDirection: rtlRow,
    alignItems: 'center',
    backgroundColor: 'rgba(5, 27, 20, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  surahCard: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d3527',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.15)',
  },
  surahRight: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 14,
  },
  surahNumberCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(250, 231, 165, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumberText: {
    color: '#fae7a5',
    fontWeight: '700',
    fontSize: 14,
  },
  surahInfo: {
    alignItems: 'flex-end',
  },
  surahNameAr: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  surahSubInfo: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  surahLeft: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 8,
  },
  surahNameEn: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#041d15',
  },
  modalHeader: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 186, 89, 0.25)',
  },
  modalBackBtn: {
    padding: 6,
  },
  modalTitleWrap: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fae7a5',
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  versesScroll: {
    padding: 18,
    paddingBottom: 60,
  },
  bismillahBox: {
    alignItems: 'center',
    marginVertical: 14,
  },
  bismillahText: {
    fontSize: 22,
    color: '#fae7a5',
    fontWeight: '600',
    textAlign: 'center',
  },
  verseBox: {
    backgroundColor: '#092d21',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  verseHeader: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  verseNumberBadge: {
    backgroundColor: 'rgba(250, 231, 165, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verseNumberText: {
    color: '#fae7a5',
    fontSize: 11,
    fontWeight: '600',
  },
  verseActions: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 6,
  },
  verseActionBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(226, 186, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  verseActionBtnActive: {
    backgroundColor: '#fae7a5',
  },
  verseActionBtnText: {
    color: '#fae7a5',
    fontSize: 11,
    fontWeight: '600',
  },
  verseActionAiBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(226, 186, 89, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  verseActionAiBtnText: {
    color: '#fae7a5',
    fontSize: 11,
    fontWeight: '700',
  },
  verseText: {
    lineHeight: 44,
    color: '#f8fafc',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  clickableWord: {
    color: '#f8fafc',
  },
  clickableWordPlaying: {
    color: '#fae7a5',
    backgroundColor: 'rgba(250, 231, 165, 0.25)',
  },
  ayahMark: {
    color: '#fae7a5',
    fontSize: 18,
  },
  emptyVersesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyVersesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fae7a5',
    marginTop: 14,
    textAlign: 'center',
  },
  emptyVersesText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
  },

  // Sheet / Modal Styles (100% Arabic RTL)
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#08281d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.35)',
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetHeaderRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sheetWordTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fae7a5',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sheetWordMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sheetPlayAudioBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fae7a5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sheetPlayAudioBtnText: {
    color: '#06291e',
    fontWeight: '700',
    fontSize: 12,
  },
  sheetScroll: {
    marginTop: 14,
  },
  sheetSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionTitleRow: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sheetSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fae7a5',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  meaningItem: {
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  meaningSourceBadge: {
    backgroundColor: 'rgba(226, 186, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  meaningSourceText: {
    fontSize: 11,
    color: '#fae7a5',
    fontWeight: '600',
    textAlign: 'right',
  },
  meaningText: {
    fontSize: 14,
    color: '#f1f5f9',
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    width: '100%',
  },
  noMeaningBox: {
    paddingVertical: 4,
  },
  noMeaningText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tafsirText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  aiAskBtn: {
    backgroundColor: '#fae7a5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAskBtnText: {
    color: '#06291e',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 8,
  },
  aiResultBox: {
    backgroundColor: 'rgba(226, 186, 89, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
  },
  aiResultText: {
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sheetFooter: {
    marginTop: 10,
  },
  sheetCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetCloseBtnText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },

  // Ayah AI Guidance Specific Styles (RTL)
  aiAyahTextBox: {
    backgroundColor: 'rgba(250, 231, 165, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
  },
  aiAyahText: {
    fontSize: 18,
    color: '#fae7a5',
    lineHeight: 32,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  aiLoadingText: {
    color: '#fae7a5',
    fontSize: 13,
    textAlign: 'center',
  },
  mutaBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  mutaText: {
    color: '#e0f2fe',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tipBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  tipText: {
    color: '#d1fae5',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
