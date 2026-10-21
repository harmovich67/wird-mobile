import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { rtlRow } from '../theme/rtl';
import { MemoryPassage } from '../types';
import { getPassages, updatePassageReview } from '../utils/storage';
import { Ratings, Rating, calculateNextReview, formatIntervalPreview } from '../utils/sm2';
import { RecitePanel } from '../components/Study/RecitePanel';

interface Props {
  passageParam?: MemoryPassage;
  onNavigate: (tab: string, params?: any) => void;
}

type StudyMode = 'read' | 'hide' | 'blanks' | 'type';

export const StudyScreen: React.FC<Props> = ({ passageParam, onNavigate }) => {
  const [passages, setPassages] = useState<MemoryPassage[]>([]);
  const [currentPassage, setCurrentPassage] = useState<MemoryPassage | null>(null);
  const [mode, setMode] = useState<StudyMode>('read');
  const [hideRatio, setHideRatio] = useState<number>(0.5); // 0.25, 0.5, 0.75, 1
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [typedRecall, setTypedRecall] = useState('');
  const [recallScore, setRecallScore] = useState<number | null>(null);
  const [sessionFinished, setSessionFinished] = useState(false);

  useEffect(() => {
    loadPassages();
  }, [passageParam]);

  const loadPassages = async () => {
    const list = await getPassages();
    setPassages(list);
    if (passageParam) {
      setCurrentPassage(passageParam);
    } else if (list.length > 0) {
      // Pick first due or first in list
      const today = new Date().toISOString().split('T')[0];
      const due = list.find((p) => p.nextReviewDate <= today) || list[0];
      setCurrentPassage(due);
    }
  };

  const resetModeState = () => {
    setRevealedIndices(new Set());
    setTypedRecall('');
    setRecallScore(null);
  };

  const handleModeChange = (newMode: StudyMode) => {
    setMode(newMode);
    resetModeState();
  };

  const toggleRevealWord = (index: number) => {
    const next = new Set(revealedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setRevealedIndices(next);
  };

  // Compare user text with original passage
  const checkTypedRecall = () => {
    if (!currentPassage) return;
    const cleanOrig = currentPassage.text
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
      .replace(/[^\u0621-\u064A\s]/g, '')
      .trim();
    const cleanUser = typedRecall
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
      .replace(/[^\u0621-\u064A\s]/g, '')
      .trim();

    if (!cleanUser) {
      Alert.alert('تنبيه', 'يرجى كتابة ما تحفظه أولاً للتحقق من الدقة.');
      return;
    }

    const origWords = cleanOrig.split(/\s+/);
    const userWords = cleanUser.split(/\s+/);
    let correct = 0;

    userWords.forEach((uw, idx) => {
      if (origWords[idx] === uw) correct++;
    });

    const score = Math.min(100, Math.round((correct / Math.max(1, origWords.length)) * 100));
    setRecallScore(score);
  };

  const handleRate = async (rating: Rating) => {
    if (!currentPassage) return;

    const res = calculateNextReview(
      rating,
      currentPassage.interval,
      currentPassage.easeFactor,
      currentPassage.repetition
    );

    await updatePassageReview(
      currentPassage.id,
      res.interval,
      res.easeFactor,
      res.repetition,
      res.nextReviewDate,
      res.status,
      rating === Ratings.FORGOT ? 1 : 0
    );

    // Find next due passage
    const today = new Date().toISOString().split('T')[0];
    const updatedList = await getPassages();
    setPassages(updatedList);

    const remainingDue = updatedList.filter(
      (p) => p.id !== currentPassage.id && p.nextReviewDate <= today
    );

    if (remainingDue.length > 0) {
      setCurrentPassage(remainingDue[0]);
      resetModeState();
    } else {
      setSessionFinished(true);
    }
  };

  if (sessionFinished) {
    return (
      <View style={styles.container}>
        <View style={styles.finishCard}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={54} color="#fae7a5" />
          </View>
          <Text style={styles.finishTitle}>مبارك! أتممت مراجعات اليوم</Text>
          <Text style={styles.finishSub}>
            تم تحديث مواعيد التكرار المتباعد بنجاح. داوم على وردك لتثبيت ما حفظت.
          </Text>
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => {
              setSessionFinished(false);
              loadPassages();
              onNavigate('dashboard');
            }}
          >
            <Text style={styles.finishBtnText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentPassage) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmarks-outline" size={60} color="#64748b" />
          <Text style={styles.emptyTitle}>لا توجد نصوص مضافة للورد</Text>
          <Text style={styles.emptySub}>
            تصفح المصحف الشريف أو الأحاديث النبوية واضغط على «أضف للورد» لبدء الحفظ الذكي.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => onNavigate('quran')}
          >
            <Text style={styles.browseBtnText}>تصفح المصحف الآن</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Parse words for progressive hiding
  const words = currentPassage.text.split(' ');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>جلسة الحفظ والمراجعة</Text>
        <Text style={styles.headerSub}>{currentPassage.title} · {currentPassage.reference}</Text>

        {/* Study Modes Tabs */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'read' && styles.modeTabActive]}
            onPress={() => handleModeChange('read')}
          >
            <Ionicons name="eye" size={16} color={mode === 'read' ? '#06291e' : '#fae7a5'} />
            <Text style={[styles.modeTabText, mode === 'read' && styles.modeTabTextActive]}>
              قراءة
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'hide' && styles.modeTabActive]}
            onPress={() => handleModeChange('hide')}
          >
            <Ionicons name="eye-off" size={16} color={mode === 'hide' ? '#06291e' : '#fae7a5'} />
            <Text style={[styles.modeTabText, mode === 'hide' && styles.modeTabTextActive]}>
              إخفاء
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'type' && styles.modeTabActive]}
            onPress={() => handleModeChange('type')}
          >
            <Ionicons name="create" size={16} color={mode === 'type' ? '#06291e' : '#fae7a5'} />
            <Text style={[styles.modeTabText, mode === 'type' && styles.modeTabTextActive]}>
              تسميع
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* Hide Ratio Switcher if in 'hide' mode */}
        {mode === 'hide' && (
          <View style={styles.hideRatiosRow}>
            <Text style={styles.hideRatioLabel}>نسبة الإخفاء:</Text>
            {[0.25, 0.5, 0.75, 1.0].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.ratioPill, hideRatio === r && styles.ratioPillActive]}
                onPress={() => {
                  setHideRatio(r);
                  setRevealedIndices(new Set());
                }}
              >
                <Text style={[styles.ratioText, hideRatio === r && styles.ratioTextActive]}>
                  {r * 100}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Text Area Card */}
        <View style={styles.textCard}>
          {mode === 'read' && (
            <Text style={styles.readText}>{currentPassage.text}</Text>
          )}

          {mode === 'hide' && (
            <View style={styles.wordsWrap}>
              {words.map((word, idx) => {
                const shouldHide = (idx % Math.round(1 / hideRatio)) === 0;
                const isRevealed = revealedIndices.has(idx);

                if (!shouldHide || isRevealed) {
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => toggleRevealWord(idx)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.wordPiece, isRevealed && styles.wordRevealed]}>
                        {word}{' '}
                      </Text>
                    </TouchableOpacity>
                  );
                } else {
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.hiddenChip}
                      onPress={() => toggleRevealWord(idx)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.hiddenChipText}>[ ... ]</Text>
                    </TouchableOpacity>
                  );
                }
              })}
            </View>
          )}

          {mode === 'type' && (
            <View style={styles.typeContainer}>
              <Text style={styles.typeHint}>
                اكتب النص كما تحفظه في صدرك، ثم اضغط على تحقق من التسميع:
              </Text>
              <TextInput
                style={styles.typeInput}
                multiline
                numberOfLines={4}
                placeholder="اكتب الآية أو الحديث هنا من حفظك..."
                placeholderTextColor="#64748b"
                value={typedRecall}
                onChangeText={setTypedRecall}
              />
              <TouchableOpacity
                style={styles.checkRecallBtn}
                onPress={checkTypedRecall}
              >
                <Ionicons name="checkmark-done" size={18} color="#06291e" />
                <Text style={styles.checkRecallText}>تحقق من التسميع</Text>
              </TouchableOpacity>

              {recallScore !== null && (
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreText}>
                    نسبة المطابقة: <Text style={styles.scoreBold}>{recallScore}%</Text>
                  </Text>
                  {recallScore >= 80 ? (
                    <Text style={styles.scoreCompliment}>ممتاز! حفظك متقن ومثبت بإذن الله.</Text>
                  ) : (
                    <Text style={styles.scoreAdvice}>راجع النص في وضع القراءة وركز على مواضع الخطأ.</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Listen to the teacher and record yourself */}
        <RecitePanel key={currentPassage.id} passage={currentPassage} />

        {/* Self Assessment SM-2 Section */}
        <View style={styles.assessmentSection}>
          <Text style={styles.assessmentTitle}>
            كيف كان استحضارك للنص؟ (التقييم الذاتي)
          </Text>
          <Text style={styles.assessmentSub}>
            يحدد نظام SM-2 موعد مراجعتك القادمة بناءً على تقييمك:
          </Text>

          <View style={styles.ratingsGrid}>
            {/* 1. Forgot */}
            <TouchableOpacity
              style={[styles.ratingBtn, { borderColor: '#ef4444' }]}
              onPress={() => handleRate(Ratings.FORGOT)}
            >
              <Text style={[styles.ratingEmoji]}>🔴</Text>
              <Text style={styles.ratingName}>نسيت</Text>
              <Text style={styles.ratingInterval}>
                {formatIntervalPreview(Ratings.FORGOT, currentPassage.interval, currentPassage.easeFactor, currentPassage.repetition)}
              </Text>
            </TouchableOpacity>

            {/* 2. Hard */}
            <TouchableOpacity
              style={[styles.ratingBtn, { borderColor: '#f59e0b' }]}
              onPress={() => handleRate(Ratings.HARD)}
            >
              <Text style={[styles.ratingEmoji]}>🟠</Text>
              <Text style={styles.ratingName}>صعب</Text>
              <Text style={styles.ratingInterval}>
                {formatIntervalPreview(Ratings.HARD, currentPassage.interval, currentPassage.easeFactor, currentPassage.repetition)}
              </Text>
            </TouchableOpacity>

            {/* 3. Good */}
            <TouchableOpacity
              style={[styles.ratingBtn, { borderColor: '#10b981' }]}
              onPress={() => handleRate(Ratings.GOOD)}
            >
              <Text style={[styles.ratingEmoji]}>🟢</Text>
              <Text style={styles.ratingName}>جيد</Text>
              <Text style={styles.ratingInterval}>
                {formatIntervalPreview(Ratings.GOOD, currentPassage.interval, currentPassage.easeFactor, currentPassage.repetition)}
              </Text>
            </TouchableOpacity>

            {/* 4. Easy */}
            <TouchableOpacity
              style={[styles.ratingBtn, { borderColor: '#fae7a5' }]}
              onPress={() => handleRate(Ratings.EASY)}
            >
              <Text style={[styles.ratingEmoji]}>⭐️</Text>
              <Text style={[styles.ratingName, { color: '#fae7a5' }]}>سهل</Text>
              <Text style={[styles.ratingInterval, { color: '#fae7a5' }]}>
                {formatIntervalPreview(Ratings.EASY, currentPassage.interval, currentPassage.easeFactor, currentPassage.repetition)}
              </Text>
            </TouchableOpacity>
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
    paddingBottom: 16,
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
  modeTabs: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 14,
  },
  modeTab: {
    flex: 1,
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(250, 231, 165, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
  },
  modeTabActive: {
    backgroundColor: '#fae7a5',
  },
  modeTabText: {
    fontSize: 13,
    color: '#fae7a5',
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#06291e',
  },
  contentScroll: {
    padding: 18,
    paddingBottom: 90,
  },
  hideRatiosRow: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  hideRatioLabel: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  ratioPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#0d3527',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ratioPillActive: {
    backgroundColor: '#10b981',
    borderColor: '#34d399',
  },
  ratioText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  ratioTextActive: {
    color: '#f8fafc',
  },
  textCard: {
    backgroundColor: '#0d3527',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.35)',
    marginBottom: 20,
    minHeight: 180,
    justifyContent: 'center',
  },
  readText: {
    fontSize: 22,
    lineHeight: 42,
    color: '#f8fafc',
    textAlign: 'right',
  },
  wordsWrap: {
    flexDirection: rtlRow,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 6,
  },
  wordPiece: {
    fontSize: 21,
    lineHeight: 38,
    color: '#f8fafc',
  },
  wordRevealed: {
    color: '#fae7a5',
    textDecorationLine: 'underline',
  },
  hiddenChip: {
    backgroundColor: 'rgba(245, 212, 122, 0.15)',
    borderWidth: 1,
    borderColor: '#e2ba59',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginVertical: 4,
  },
  hiddenChipText: {
    color: '#fae7a5',
    fontWeight: '700',
    fontSize: 14,
  },
  typeContainer: {
    width: '100%',
  },
  typeHint: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  typeInput: {
    backgroundColor: 'rgba(5, 27, 20, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
    borderRadius: 12,
    padding: 12,
    color: '#f8fafc',
    fontSize: 16,
    textAlign: 'right',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  checkRecallBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fae7a5',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  checkRecallText: {
    color: '#06291e',
    fontWeight: '700',
    fontSize: 14,
  },
  scoreBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 15,
    color: '#f8fafc',
  },
  scoreBold: {
    fontWeight: '800',
    color: '#fae7a5',
  },
  scoreCompliment: {
    fontSize: 12,
    color: '#34d399',
    marginTop: 4,
  },
  scoreAdvice: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 4,
  },
  assessmentSection: {
    backgroundColor: '#07251c',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fae7a5',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  assessmentSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ratingsGrid: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  ratingBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0a3225',
    borderWidth: 1.5,
  },
  ratingEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  ratingName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  ratingInterval: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  finishCard: {
    margin: 24,
    marginTop: 100,
    padding: 30,
    backgroundColor: '#0d3527',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.4)',
    alignItems: 'center',
  },
  trophyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(250, 231, 165, 0.15)',
    borderWidth: 2,
    borderColor: '#fae7a5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  finishTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fae7a5',
    textAlign: 'center',
  },
  finishSub: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24,
  },
  finishBtn: {
    backgroundColor: '#fae7a5',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  finishBtnText: {
    color: '#06291e',
    fontWeight: '800',
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fae7a5',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  browseBtn: {
    backgroundColor: '#fae7a5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#06291e',
    fontWeight: '700',
    fontSize: 14,
  },
});
