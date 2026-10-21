import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemoryPassage, UserStats, UserSettings, QuizStats } from '../types';

const PASSAGES_KEY = '@wirdy_passages';
const STATS_KEY = '@wirdy_user_stats';
const SETTINGS_KEY = '@wirdy_settings';
const BOOKMARKS_KEY = '@wirdy_bookmarks';
const QUIZ_KEY = '@wirdy_quiz_stats';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'emerald',
  fontSize: 22,
  showTajweedColors: true,
  audioAutoPlay: false,
  hapticFeedback: true,
  dailyGoalMinutes: 15,
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  aiEnabled: true,
  reciter: 'alafasy',
};

const DEFAULT_STATS: UserStats = {
  streak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  dailyGoal: 5,
  completedToday: 0,
  totalMastered: 0,
};

// Seed default starter passages for new learners if empty
const DEFAULT_SEED_PASSAGES: MemoryPassage[] = [
  {
    id: 'seed-fatiha',
    title: 'سورة الفاتحة (السبع المثاني)',
    sourceType: 'quran',
    reference: 'سورة 1 (1 - 7)',
    surahNumber: 1,
    fromAyah: 1,
    toAyah: 7,
    text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾ الرَّحْمَٰنِ الرَّحِيمِ ﴿٣﴾ مَالِكِ يَوْمِ الدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٦﴾ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٧﴾',
    createdAt: new Date().toISOString(),
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString().split('T')[0],
    status: 'learning',
    mistakeCount: 0,
  },
  {
    id: 'seed-kursi',
    title: 'آية الكرسي',
    sourceType: 'quran',
    reference: 'سورة البقرة (255)',
    surahNumber: 2,
    fromAyah: 255,
    toAyah: 255,
    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ ﴿٢٥٥﴾',
    createdAt: new Date().toISOString(),
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString().split('T')[0],
    status: 'new',
    mistakeCount: 0,
  },
  {
    id: 'seed-hadith-niyyah',
    title: 'حديث: إنما الأعمال بالنيات',
    sourceType: 'hadith',
    reference: 'صحيح البخاري ومسلم - الأربعون النووية',
    text: 'عَنْ أَمِيرِ الْمُؤْمِنِينَ أَبِي حَفْصٍ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ، قَالَ: سَمِعْتُ رَسُولَ اللَّهِ ﷺ يَقُولُ: «إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ».',
    createdAt: new Date().toISOString(),
    interval: 2,
    repetition: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString().split('T')[0],
    status: 'learning',
    mistakeCount: 0,
  },
  {
    id: 'seed-ikhlas',
    title: 'سورة الإخلاص',
    sourceType: 'quran',
    reference: 'سورة 112 (1 - 4)',
    surahNumber: 112,
    fromAyah: 1,
    toAyah: 4,
    text: 'قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾',
    createdAt: new Date().toISOString(),
    interval: 30,
    repetition: 4,
    easeFactor: 2.6,
    nextReviewDate: new Date(Date.now() + 86400000 * 25).toISOString().split('T')[0],
    status: 'mastered',
    mistakeCount: 0,
  }
];

export async function getPassages(): Promise<MemoryPassage[]> {
  try {
    const raw = await AsyncStorage.getItem(PASSAGES_KEY);
    if (!raw) {
      await AsyncStorage.setItem(PASSAGES_KEY, JSON.stringify(DEFAULT_SEED_PASSAGES));
      return DEFAULT_SEED_PASSAGES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SEED_PASSAGES;
  }
}

export async function savePassages(passages: MemoryPassage[]): Promise<void> {
  await AsyncStorage.setItem(PASSAGES_KEY, JSON.stringify(passages));
}

export async function addPassage(passage: Omit<MemoryPassage, 'id' | 'createdAt' | 'interval' | 'repetition' | 'easeFactor' | 'nextReviewDate' | 'status' | 'mistakeCount'>): Promise<MemoryPassage> {
  const passages = await getPassages();
  const today = new Date().toISOString().split('T')[0];
  const newPassage: MemoryPassage = {
    ...passage,
    id: 'wird-' + Date.now(),
    createdAt: new Date().toISOString(),
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    nextReviewDate: today,
    status: 'new',
    mistakeCount: 0,
  };
  passages.unshift(newPassage);
  await savePassages(passages);
  return newPassage;
}

export async function updatePassageReview(
  id: string,
  interval: number,
  easeFactor: number,
  repetition: number,
  nextReviewDate: string,
  status: 'new' | 'learning' | 'mastered',
  mistakeIncrement: number = 0
): Promise<void> {
  const passages = await getPassages();
  const idx = passages.findIndex((p) => p.id === id);
  if (idx !== -1) {
    passages[idx] = {
      ...passages[idx],
      interval,
      easeFactor,
      repetition,
      nextReviewDate,
      status,
      mistakeCount: passages[idx].mistakeCount + mistakeIncrement,
      lastReviewedDate: new Date().toISOString().split('T')[0],
    };
    await savePassages(passages);

    // Update daily completion stats
    await incrementDailyCompletion();
  }
}

export async function getUserStats(): Promise<UserStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    const today = new Date().toISOString().split('T')[0];
    if (!raw) {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(DEFAULT_STATS));
      return DEFAULT_STATS;
    }
    const stats: UserStats = JSON.parse(raw);
    
    // Check streak continuation
    if (stats.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (stats.lastActiveDate !== yesterdayStr) {
        // Streak broken
        stats.streak = 1;
      }
      // Reset completed today on a new day
      stats.completedToday = 0;
    }
    return stats;
  } catch {
    return DEFAULT_STATS;
  }
}

export async function incrementDailyCompletion(): Promise<UserStats> {
  const stats = await getUserStats();
  const today = new Date().toISOString().split('T')[0];

  if (stats.lastActiveDate !== today) {
    stats.streak += 1;
    stats.lastActiveDate = today;
  }
  stats.completedToday += 1;

  // Recount mastered
  const passages = await getPassages();
  stats.totalMastered = passages.filter((p) => p.status === 'mastered').length;

  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}

export async function getUserSettings(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getUserSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

const EMPTY_QUIZ_STATS: QuizStats = {
  categories: {},
  missedIds: [],
  recentIds: [],
  bestScore: 0,
  sessions: 0,
};

export async function getQuizStats(): Promise<QuizStats> {
  try {
    const raw = await AsyncStorage.getItem(QUIZ_KEY);
    return raw ? { ...EMPTY_QUIZ_STATS, ...JSON.parse(raw) } : EMPTY_QUIZ_STATS;
  } catch {
    return EMPTY_QUIZ_STATS;
  }
}

export async function saveQuizStats(stats: QuizStats): Promise<void> {
  await AsyncStorage.setItem(QUIZ_KEY, JSON.stringify(stats));
}
