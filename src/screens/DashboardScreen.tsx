import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { rtlRow } from '../theme/rtl';
import { getUserStats, getPassages } from '../utils/storage';
import { UserStats, MemoryPassage } from '../types';
import { WirdLogo } from '../components/Emblem/WirdLogo';
import { AboutModal } from '../components/About/AboutModal';

interface Props {
  onNavigate: (tab: string, params?: any) => void;
}

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [passages, setPassages] = useState<MemoryPassage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  const loadData = async () => {
    const s = await getUserStats();
    const p = await getPassages();
    setStats(s);
    setPassages(p);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const duePassages = passages.filter((p) => p.nextReviewDate <= todayStr);
  const masteredCount = passages.filter((p) => p.status === 'mastered').length;
  const learningCount = passages.filter((p) => p.status === 'learning').length;

  const progressPercent = stats
    ? Math.min(100, Math.round((stats.completedToday / Math.max(1, stats.dailyGoal)) * 100))
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e2ba59" />}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerRight}>
            <WirdLogo size={48} />
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerGreeting}>السلام عليكم ورحمة الله</Text>
              <Text style={styles.headerAppName}>منصة وِرد الذكية</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.streakBadge}
            activeOpacity={0.8}
            onPress={() => onNavigate('settings')}
          >
            <Ionicons name="flame" size={20} color="#f59e0b" />
            <Text style={styles.streakText}>{stats?.streak ?? 1} يوم</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Goal & Progress Card */}
        <LinearGradient
          colors={['#104938', '#0b392a', '#06291e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.goalCard}
        >
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleWrap}>
              <Text style={styles.goalTitle}>إنجاز الورد اليومي</Text>
              <Text style={styles.goalSubtitle}>
                {stats?.completedToday ?? 0} من {stats?.dailyGoal ?? 5} مراجعات مكتملة
              </Text>
            </View>
            <View style={styles.percentPill}>
              <Text style={styles.percentText}>{progressPercent}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarThumb, { width: `${progressPercent}%` }]} />
          </View>

          {/* Stats Counters */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{duePassages.length}</Text>
              <Text style={styles.statLabel}>مراجعات اليوم</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{learningCount}</Text>
              <Text style={styles.statLabel}>قيد التثبيت</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#fae7a5' }]}>{masteredCount}</Text>
              <Text style={styles.statLabel}>تم التمكين ⭐️</Text>
            </View>
          </View>

          {/* Start Study Action Button */}
          {duePassages.length > 0 ? (
            <TouchableOpacity
              style={styles.studyNowButton}
              activeOpacity={0.85}
              onPress={() => onNavigate('study', { passage: duePassages[0] })}
            >
              <LinearGradient
                colors={['#f5d47a', '#e2ba59', '#ba8e30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.studyNowGradient}
              >
                <Ionicons name="play" size={18} color="#06291e" />
                <Text style={styles.studyNowText}>ابدأ مراجعة اليوم ({duePassages.length})</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.allDoneNotice}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.allDoneText}>أتممت مراجعات اليوم! يمكنك تصفح المصحف أو إضافة نصوص جديدة.</Text>
            </View>
          )}
        </LinearGradient>

        {/* Quick Nav Grid */}
        <Text style={styles.sectionTitle}>الأقسام والخدمات الرئيسية</Text>
        <View style={styles.gridContainer}>
          {/* Quran */}
          <TouchableOpacity
            style={styles.gridItem}
            activeOpacity={0.8}
            onPress={() => onNavigate('quran')}
          >
            <LinearGradient colors={['#144e3b', '#0d3527']} style={styles.gridGradient}>
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(245, 212, 122, 0.15)' }]}>
                <MaterialCommunityIcons name="book-open-page-variant" size={26} color="#fae7a5" />
              </View>
              <Text style={styles.gridItemTitle}>المصحف الشريف</Text>
              <Text style={styles.gridItemSub}>١١٤ سورة بالرسم العثماني</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Study & Spaced Repetition */}
          <TouchableOpacity
            style={styles.gridItem}
            activeOpacity={0.8}
            onPress={() => onNavigate('study')}
          >
            <LinearGradient colors={['#144e3b', '#0d3527']} style={styles.gridGradient}>
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="repeat" size={26} color="#34d399" />
              </View>
              <Text style={styles.gridItemTitle}>الحفظ والمراجعة</Text>
              <Text style={styles.gridItemSub}>التكرار المتباعد الذكي</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Hadith */}
          <TouchableOpacity
            style={styles.gridItem}
            activeOpacity={0.8}
            onPress={() => onNavigate('hadith')}
          >
            <LinearGradient colors={['#144e3b', '#0d3527']} style={styles.gridGradient}>
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Ionicons name="library" size={26} color="#38bdf8" />
              </View>
              <Text style={styles.gridItemTitle}>السنة النبوية</Text>
              <Text style={styles.gridItemSub}>الأربعون النووية والبخاري</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tajweed */}
          <TouchableOpacity
            style={styles.gridItem}
            activeOpacity={0.8}
            onPress={() => onNavigate('tajweed')}
          >
            <LinearGradient colors={['#144e3b', '#0d3527']} style={styles.gridGradient}>
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="color-palette" size={26} color="#f87171" />
              </View>
              <Text style={styles.gridItemTitle}>أحكام التجويد</Text>
              <Text style={styles.gridItemSub}>دليل تفاعلي ملون بالأمثلة</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Prophets' stories */}
          <TouchableOpacity
            style={styles.gridItem}
            activeOpacity={0.8}
            onPress={() => onNavigate('prophets')}
          >
            <LinearGradient colors={['#144e3b', '#0d3527']} style={styles.gridGradient}>
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
                <Ionicons name="people" size={26} color="#fb923c" />
              </View>
              <Text style={styles.gridItemTitle}>قصص الأنبياء</Text>
              <Text style={styles.gridItemSub}>من القرآن مع الاستماع والحفظ</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Quiz */}
          <TouchableOpacity
            style={styles.gridItem}
            activeOpacity={0.8}
            onPress={() => onNavigate('quiz')}
          >
            <LinearGradient colors={['#144e3b', '#0d3527']} style={styles.gridGradient}>
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(250, 204, 21, 0.15)' }]}>
                <Ionicons name="help-circle" size={26} color="#facc15" />
              </View>
              <Text style={styles.gridItemTitle}>الاختبارات</Text>
              <Text style={styles.gridItemSub}>أسئلة ذكية تتكيّف مع مستواك</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Adhkar */}
          <TouchableOpacity
            style={[styles.gridItem, { width: '100%' }]}
            activeOpacity={0.8}
            onPress={() => onNavigate('adhkar')}
          >
            <LinearGradient
              colors={['#124334', '#0d3226']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.gridGradient, { flexDirection: rtlRow, alignItems: 'center', justifyContent: 'space-between' }]}
            >
              <View style={{ flexDirection: rtlRow, alignItems: 'center', gap: 14 }}>
                <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)', alignSelf: 'auto', marginBottom: 0 }]}>
                  <Ionicons name="moon" size={24} color="#c084fc" />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.gridItemTitle}>الأذكار والسبحة الإلكترونية</Text>
                  <Text style={styles.gridItemSub}>أذكار الصباح والمساء والنوم مع عداد لمس</Text>
                </View>
              </View>
              <Ionicons name="chevron-back" size={20} color="#cbd5e1" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Featured Daily Ayah Card */}
        <Text style={styles.sectionTitle}>آية وتدبر لليوم</Text>
        <View style={styles.ayahQuoteCard}>
          <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          <Text style={styles.ayahQuoteText}>
            ﴿ إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ وَيُبَشِّرُ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا كَبِيرًا ﴾
          </Text>
          <View style={styles.ayahQuoteFooter}>
            <Text style={styles.ayahQuoteRef}>سورة الإسراء · الآية ٩</Text>
            <TouchableOpacity
              style={styles.addQuoteBtn}
              onPress={() => onNavigate('quran')}
            >
              <Ionicons name="bookmarks-outline" size={15} color="#fae7a5" />
              <Text style={styles.addQuoteText}>فتح في المصحف</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <TouchableOpacity style={styles.aboutBtn} activeOpacity={0.85} onPress={() => setAboutVisible(true)}>
          <Ionicons name="information-circle-outline" size={18} color="#fae7a5" />
          <Text style={styles.aboutBtnText}>تعرّف علينا</Text>
        </TouchableOpacity>
      </ScrollView>

      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  aboutBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(250, 231, 165, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
  },
  aboutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fae7a5',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 90,
  },
  header: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 12,
  },
  headerTitleWrap: {
    alignItems: 'flex-end',
  },
  headerGreeting: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'right',
  },
  headerAppName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fae7a5',
    textAlign: 'right',
  },
  streakBadge: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  streakText: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 13,
  },
  goalCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  goalHeader: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalTitleWrap: {
    alignItems: 'flex-end',
  },
  goalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'right',
  },
  goalSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 2,
    textAlign: 'right',
  },
  percentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(250, 231, 165, 0.2)',
  },
  percentText: {
    color: '#fae7a5',
    fontWeight: '800',
    fontSize: 14,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarThumb: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#e2ba59',
  },
  statsRow: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  statCol: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  studyNowButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  studyNowGradient: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  studyNowText: {
    color: '#06291e',
    fontWeight: '800',
    fontSize: 15,
  },
  allDoneNotice: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  allDoneText: {
    color: '#a7f3d0',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fae7a5',
    marginBottom: 14,
    textAlign: 'right',
  },
  gridContainer: {
    flexDirection: rtlRow,
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.2)',
    borderRadius: 16,
    alignItems: 'flex-end',
  },
  gridIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'flex-end',
  },
  gridItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'right',
  },
  gridItemSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'right',
  },
  ayahQuoteCard: {
    backgroundColor: '#0d3527',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.35)',
    marginBottom: 20,
  },
  bismillah: {
    fontSize: 14,
    color: '#fae7a5',
    textAlign: 'center',
    marginBottom: 10,
  },
  ayahQuoteText: {
    fontSize: 18,
    lineHeight: 32,
    color: '#f8fafc',
    textAlign: 'center',
    fontWeight: '500',
  },
  ayahQuoteFooter: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  ayahQuoteRef: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
  addQuoteBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 4,
  },
  addQuoteText: {
    fontSize: 12,
    color: '#fae7a5',
    fontWeight: '600',
  },
});
