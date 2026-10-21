export interface Surah {
  number: number;
  name_ar: string;
  name_en: string;
  meaning_en: string;
  ayah_count: number;
  revelation: string;
}

export interface Ayah {
  ayah: number;
  text: string;
  bismillah?: string | null;
}

export interface Hadith {
  id: number;
  collection: string;
  number: number;
  ref_number: string;
  text: string;
  plain: string;
}

export interface TajweedSubRule {
  id: string;
  name_ar: string;
  letters: string;
  color: string;
  rule: string;
  example: string;
}

export interface TajweedCategory {
  id: string;
  name_ar: string;
  name_en: string;
  color: string;
  description: string;
  rules: TajweedSubRule[];
}

export interface DhikrItem {
  id: string;
  text: string;
  count: number;
  fadl: string;
}

export interface DhikrCategory {
  category: 'morning' | 'evening' | 'sleep' | 'prayer';
  category_ar: string;
  icon: string;
  items: DhikrItem[];
}

export interface MemoryPassage {
  id: string;
  title: string;
  sourceType: 'quran' | 'hadith' | 'custom';
  reference: string;
  text: string;
  surahNumber?: number;
  fromAyah?: number;
  toAyah?: number;
  createdAt: string;
  // SM-2 Spaced Repetition Fields
  interval: number; // in days
  repetition: number;
  easeFactor: number; // default 2.5
  nextReviewDate: string; // ISO string YYYY-MM-DD
  lastReviewedDate?: string;
  status: 'new' | 'learning' | 'mastered';
  mistakeCount: number;
}

export interface UserStats {
  streak: number;
  lastActiveDate: string;
  dailyGoal: number; // target items per day
  completedToday: number;
  totalMastered: number;
}

export interface WordMeaningEntry {
  book: string;
  author: string;
  text: string;
  meaning: string;
}

export interface WordLookupResult {
  word: string;
  index: number;
  count: number;
  audioUrl: string;
  meanings: WordMeaningEntry[];
  tafsir: string;
  surahNumber: number;
  ayahNumber: number;
}

export interface UserSettings {
  theme: 'dark' | 'emerald' | 'light';
  fontSize: number; // 18 to 36
  showTajweedColors: boolean;
  audioAutoPlay: boolean;
  hapticFeedback: boolean;
  dailyGoalMinutes: number;
  // Gemini AI settings
  geminiApiKey?: string;
  geminiModel?: string; // 'gemini-2.5-flash' | 'gemini-2.0-flash' | 'gemini-1.5-flash'
  aiEnabled?: boolean;
  reciter?: string; // id from utils/reciters.ts
}

export interface ProphetPassage {
  id: string;
  title: string;
  surah: number;
  surah_name: string;
  from: number;
  to: number;
  theme: string;
}

export interface Prophet {
  slug: string;
  name_ar: string;
  name_en: string;
  title_ar: string;
  mentions: number;
  summary_ar: string;
  lessons: string[];
  passages: ProphetPassage[];
}

export type QuizCategory =
  | 'quran'
  | 'prophets'
  | 'faith'
  | 'seerah'
  | 'fiqh'
  | 'tajweed';

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  question: string;
  options: string[];
  answer: number; // index into options
  explanation?: string;
  difficulty: 1 | 2 | 3;
  kind: string; // 'bank' or the generator that produced it (caps repeats within a session)
}

export interface QuizCategoryStat {
  correct: number;
  total: number;
}

export interface QuizStats {
  categories: Partial<Record<QuizCategory, QuizCategoryStat>>;
  missedIds: string[]; // questions answered wrong last time, revisited first
  recentIds: string[]; // recently asked, deprioritised so sessions stay fresh
  bestScore: number; // best percentage of a full session
  sessions: number;
}
