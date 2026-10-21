import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { rtlRow, rtlAlignRight } from '../theme/rtl';
import { QuizQuestion, QuizStats } from '../types';
import { getQuizStats, saveQuizStats, getUserSettings } from '../utils/storage';
import {
  QuizMode,
  QuizAnswer,
  QUIZ_CATEGORIES,
  SESSION_SIZE,
  buildSession,
  applyResults,
  countMissable,
  weakestCategory,
  toArabicDigits,
} from '../utils/quizEngine';

type Phase = 'home' | 'playing' | 'result';

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];

const EMPTY_STATS: QuizStats = { categories: {}, missedIds: [], recentIds: [], bestScore: 0, sessions: 0 };

const verdict = (percent: number) => {
  if (percent === 100) return { text: 'ما شاء الله! علامة كاملة', icon: 'trophy' };
  if (percent >= 80) return { text: 'أحسنت، مستوى ممتاز', icon: 'ribbon' };
  if (percent >= 60) return { text: 'جيد، وبالمراجعة ستتقدم أكثر', icon: 'thumbs-up' };
  return { text: 'لا بأس، العلم بالتكرار والمراجعة', icon: 'refresh-circle' };
};

export const QuizScreen: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('home');
  const [stats, setStats] = useState<QuizStats>(EMPTY_STATS);
  const [mode, setMode] = useState<QuizMode>('smart');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const hapticsOn = useRef(true);

  useEffect(() => {
    getQuizStats().then(setStats);
    getUserSettings().then((s) => {
      hapticsOn.current = s.hapticFeedback;
    });
  }, []);

  const start = (m: QuizMode) => {
    const session = buildSession(m, stats);
    if (!session.length) {
      setPhase('home'); // e.g. review mode with nothing left to review
      return;
    }
    setMode(m);
    setQuestions(session);
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setPhase('playing');
  };

  const choose = (optionIndex: number) => {
    if (selected !== null) return;
    const question = questions[index];
    const correct = optionIndex === question.answer;
    setSelected(optionIndex);
    setAnswers((prev) => [...prev, { question, correct }]);
    if (hapticsOn.current) {
      Haptics.notificationAsync(
        correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
      ).catch(() => {});
    }
  };

  const next = async () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
      return;
    }
    const updated = applyResults(stats, answers);
    setStats(updated);
    await saveQuizStats(updated).catch(() => {});
    setPhase('result');
  };

  const quit = () => setPhase('home');

  // ---------- Playing ----------
  if (phase === 'playing') {
    const question = questions[index];
    const answered = selected !== null;
    const score = answers.filter((a) => a.correct).length;
    const cat = QUIZ_CATEGORIES.find((c) => c.id === question.category);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.playTop}>
            <TouchableOpacity onPress={quit} hitSlop={10} style={styles.quitBtn}>
              <Ionicons name="close" size={20} color="#cbd5e1" />
            </TouchableOpacity>
            <Text style={styles.progressText}>
              {toArabicDigits(index + 1)} / {toArabicDigits(questions.length)}
            </Text>
            <View style={styles.scorePill}>
              <Ionicons name="star" size={12} color="#e2ba59" />
              <Text style={styles.scoreText}>{toArabicDigits(score)}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.questionCard}>
            {cat && (
              <View style={[styles.catChip, { borderColor: cat.color }]}>
                <Ionicons name={cat.icon as any} size={12} color={cat.color} />
                <Text style={[styles.catChipText, { color: cat.color }]}>{cat.label}</Text>
              </View>
            )}
            <Text style={styles.questionText}>{question.question}</Text>
          </View>

          {question.options.map((option, i) => {
            const isCorrect = i === question.answer;
            const isChosen = i === selected;
            const showCorrect = answered && isCorrect;
            const showWrong = answered && isChosen && !isCorrect;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                disabled={answered}
                onPress={() => choose(i)}
                style={[
                  styles.option,
                  showCorrect && styles.optionCorrect,
                  showWrong && styles.optionWrong,
                  answered && !showCorrect && !showWrong && styles.optionDim,
                ]}
              >
                <View style={[styles.optionBadge, showCorrect && styles.badgeCorrect, showWrong && styles.badgeWrong]}>
                  {showCorrect ? (
                    <Ionicons name="checkmark" size={16} color="#06291e" />
                  ) : showWrong ? (
                    <Ionicons name="close" size={16} color="#fff" />
                  ) : (
                    <Text style={styles.optionBadgeText}>{OPTION_LETTERS[i]}</Text>
                  )}
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}

          {answered && (
            <View style={styles.feedback}>
              <Text style={[styles.feedbackTitle, { color: selected === question.answer ? '#34d399' : '#f87171' }]}>
                {selected === question.answer ? 'إجابة صحيحة، أحسنت!' : 'إجابة غير صحيحة'}
              </Text>
              {question.explanation ? <Text style={styles.feedbackText}>{question.explanation}</Text> : null}
              <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={next}>
                <Text style={styles.primaryBtnText}>
                  {index + 1 < questions.length ? 'السؤال التالي' : 'عرض النتيجة'}
                </Text>
                <Ionicons name="arrow-back" size={16} color="#06291e" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ---------- Result ----------
  if (phase === 'result') {
    const score = answers.filter((a) => a.correct).length;
    const percent = Math.round((score / Math.max(1, answers.length)) * 100);
    const v = verdict(percent);
    const wrong = answers.filter((a) => !a.correct);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>نتيجة الاختبار</Text>
        </View>
        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#144e3b', '#0b392a', '#06291e']} style={styles.resultCard}>
            <Ionicons name={v.icon as any} size={44} color="#fae7a5" />
            <Text style={styles.resultPercent}>{toArabicDigits(percent)}٪</Text>
            <Text style={styles.resultScore}>
              {toArabicDigits(score)} من {toArabicDigits(answers.length)} إجابات صحيحة
            </Text>
            <Text style={styles.resultVerdict}>{v.text}</Text>
          </LinearGradient>

          {wrong.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>راجع ما أخطأت فيه</Text>
              {wrong.map(({ question }) => (
                <View key={question.id} style={styles.reviewCard}>
                  <Text style={styles.reviewQuestion}>{question.question}</Text>
                  <Text style={styles.reviewAnswer}>الصواب: {question.options[question.answer]}</Text>
                  {question.explanation ? <Text style={styles.reviewExplain}>{question.explanation}</Text> : null}
                </View>
              ))}
              <Text style={styles.reviewNote}>سيعود الذكاء إلى هذه الأسئلة في جلساتك القادمة حتى تثبت.</Text>
            </>
          )}

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={() => start(mode)}>
            <Ionicons name="refresh" size={16} color="#06291e" />
            <Text style={styles.primaryBtnText}>جلسة جديدة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85} onPress={quit}>
            <Text style={styles.secondaryBtnText}>العودة للاختبارات</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ---------- Home ----------
  const totalAnswered = Object.values(stats.categories).reduce((sum, c) => sum + (c?.total || 0), 0);
  const totalCorrect = Object.values(stats.categories).reduce((sum, c) => sum + (c?.correct || 0), 0);
  const overall = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const missable = countMissable(stats);
  const weakId = weakestCategory(stats);
  const weak = QUIZ_CATEGORIES.find((c) => c.id === weakId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الاختبارات الإسلامية</Text>
        <Text style={styles.headerSub}>أسئلة تتكيّف مع مستواك وتعود لما أخطأت فيه</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{toArabicDigits(stats.sessions)}</Text>
            <Text style={styles.statLabel}>جلسات</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalAnswered ? `${toArabicDigits(overall)}٪` : '—'}</Text>
            <Text style={styles.statLabel}>الدقة العامة</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#fae7a5' }]}>
              {stats.bestScore ? `${toArabicDigits(stats.bestScore)}٪` : '—'}
            </Text>
            <Text style={styles.statLabel}>أفضل نتيجة</Text>
          </View>
        </View>

        {weak && (
          <TouchableOpacity style={styles.hintCard} activeOpacity={0.85} onPress={() => start(weak.id)}>
            <Ionicons name="bulb" size={18} color="#fae7a5" />
            <Text style={styles.hintText}>
              مجال «{weak.label}» هو الأحوج للمراجعة عندك الآن. اضغط لجلسة مركّزة عليه.
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity activeOpacity={0.85} onPress={() => start('smart')}>
          <LinearGradient
            colors={['#f5d47a', '#e2ba59', '#ba8e30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.smartBtn}
          >
            <Ionicons name="sparkles" size={20} color="#06291e" />
            <View style={styles.smartBtnText}>
              <Text style={styles.smartTitle}>جلسة ذكية ({toArabicDigits(SESSION_SIZE)} أسئلة)</Text>
              <Text style={styles.smartSub}>تمزج المجالات وتركّز على نقاط ضعفك</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {missable > 0 && (
          <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.85} onPress={() => start('review')}>
            <Ionicons name="alert-circle" size={18} color="#f87171" />
            <Text style={styles.reviewBtnText}>راجع أخطاءك السابقة ({toArabicDigits(missable)})</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>اختر مجالًا</Text>
        <View style={styles.grid}>
          {QUIZ_CATEGORIES.map((c) => {
            const s = stats.categories[c.id];
            const acc = s && s.total ? Math.round((s.correct / s.total) * 100) : null;
            return (
              <TouchableOpacity key={c.id} style={styles.gridItem} activeOpacity={0.85} onPress={() => start(c.id)}>
                <View style={[styles.gridIcon, { backgroundColor: c.color + '26' }]}>
                  <Ionicons name={c.icon as any} size={22} color={c.color} />
                </View>
                <Text style={styles.gridLabel}>{c.label}</Text>
                <Text style={styles.gridAcc}>{acc === null ? 'لم تبدأ بعد' : `الدقة ${toArabicDigits(acc)}٪`}</Text>
              </TouchableOpacity>
            );
          })}
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
    paddingBottom: 14,
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
  contentScroll: {
    padding: 16,
    paddingBottom: 90,
  },

  // Home
  statsRow: {
    flexDirection: rtlRow,
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0d3527',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  hintCard: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(226, 186, 89, 0.1)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    color: '#fae7a5',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  smartBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  smartBtnText: {
    flex: 1,
    alignItems: rtlAlignRight,
  },
  smartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#06291e',
    textAlign: 'right',
  },
  smartSub: {
    fontSize: 12,
    color: '#3b2f0b',
    marginTop: 2,
    textAlign: 'right',
  },
  reviewBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f87171',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 4,
    marginBottom: 10,
    textAlign: 'right',
  },
  grid: {
    flexDirection: rtlRow,
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#0d3527',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.2)',
    alignItems: rtlAlignRight,
  },
  gridIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'right',
  },
  gridAcc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    textAlign: 'right',
  },

  // Playing
  playTop: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quitBtn: {
    padding: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fae7a5',
  },
  scorePill: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(226, 186, 89, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fae7a5',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    // fill grows from the right edge, matching the Arabic reading direction
    flexDirection: rtlRow,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#e2ba59',
  },
  questionCard: {
    backgroundColor: '#0d3527',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
    alignItems: rtlAlignRight,
  },
  catChip: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 18,
    lineHeight: 32,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  option: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#092d21',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10b981',
  },
  optionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#ef4444',
  },
  optionDim: {
    opacity: 0.5,
  },
  optionBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(250, 231, 165, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCorrect: {
    backgroundColor: '#34d399',
  },
  badgeWrong: {
    backgroundColor: '#ef4444',
  },
  optionBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fae7a5',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: '#f8fafc',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  feedback: {
    marginTop: 6,
    gap: 10,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 23,
    color: '#cbd5e1',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  primaryBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fae7a5',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#06291e',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#cbd5e1',
  },

  // Result
  resultCard: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.35)',
  },
  resultPercent: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fae7a5',
    marginTop: 8,
  },
  resultScore: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 2,
  },
  resultVerdict: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 10,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#092d21',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  reviewQuestion: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 24,
    color: '#f8fafc',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  reviewAnswer: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34d399',
    marginTop: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  reviewExplain: {
    fontSize: 12,
    lineHeight: 21,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  reviewNote: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
