import {
  QuizCategory,
  QuizQuestion,
  QuizStats,
  Surah,
  Prophet,
  TajweedCategory,
} from '../types';
import surahsData from '../data/surahs.json';
import prophetsData from '../data/prophets.json';
import tajweedData from '../data/tajweed.json';
import { QUIZ_BANK } from '../data/quizBank';

export type QuizMode = 'smart' | 'review' | QuizCategory;

export const QUIZ_CATEGORIES: { id: QuizCategory; label: string; icon: string; color: string }[] = [
  { id: 'quran', label: 'القرآن الكريم', icon: 'book', color: '#fae7a5' },
  { id: 'prophets', label: 'الأنبياء والقصص', icon: 'people', color: '#38bdf8' },
  { id: 'faith', label: 'العقيدة والإيمان', icon: 'heart', color: '#f87171' },
  { id: 'seerah', label: 'السيرة والصحابة', icon: 'compass', color: '#34d399' },
  { id: 'fiqh', label: 'الفقه والعبادات', icon: 'ribbon', color: '#c084fc' },
  { id: 'tajweed', label: 'التجويد', icon: 'color-palette', color: '#fb923c' },
];

export const SESSION_SIZE = 10;

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const toArabicDigits = (n: number) =>
  String(n)
    .split('')
    .map((d) => ARABIC_DIGITS[Number(d)])
    .join('');

const surahs = surahsData as Surah[];
const prophets = prophetsData as Prophet[];
const tajweed = tajweedData as TajweedCategory[];

// ---------- small helpers ----------

function shuffle<T>(items: T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(items: T[], n: number): T[] {
  return shuffle(items).slice(0, n);
}

// Stable id for hand-written questions, so progress survives reordering the bank.
function hashId(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return 'b' + (h >>> 0).toString(36);
}

interface Draft {
  id: string;
  category: QuizCategory;
  difficulty: 1 | 2 | 3;
  kind: string;
  question: string;
  answer: string;
  distractors: string[];
  explanation?: string;
  ordered?: string[]; // fixed option order (numbers, مكية/مدنية); otherwise shuffled
}

function finalize(d: Draft): QuizQuestion {
  const unique = Array.from(new Set(d.distractors.filter((x) => x !== d.answer)));
  const options = d.ordered ?? shuffle([d.answer, ...unique]);
  return {
    id: d.id,
    category: d.category,
    difficulty: d.difficulty,
    kind: d.kind,
    question: d.question,
    options,
    answer: options.indexOf(d.answer),
    explanation: d.explanation,
  };
}

// ---------- question pool ----------

interface PoolItem {
  id: string;
  category: QuizCategory;
  kind: string;
  make: () => QuizQuestion;
}

// Caps how many questions of one generated kind appear in a session (hand-written ones are uncapped).
const KIND_CAP: Record<string, number> = {
  ayahCount: 2,
  revelation: 2,
  surahOrder: 1,
  surahAt: 1,
  prophetTitle: 2,
  tajweedLetters: 2,
};

function buildPool(): PoolItem[] {
  const pool: PoolItem[] = [];

  // Hand-written bank
  for (const item of QUIZ_BANK) {
    const id = hashId(item.question);
    pool.push({
      id,
      category: item.category,
      kind: 'bank',
      make: () =>
        finalize({
          id,
          category: item.category,
          difficulty: item.difficulty,
          kind: 'bank',
          question: item.question,
          answer: item.answer,
          distractors: item.distractors,
          explanation: item.explanation,
        }),
    });
  }

  // Generated from surahs.json
  for (const s of surahs) {
    pool.push({
      id: `g:ayahCount:${s.number}`,
      category: 'quran',
      kind: 'ayahCount',
      make: () => {
        const nearest = surahs
          .filter((o) => o.ayah_count !== s.ayah_count)
          .sort((a, b) => Math.abs(a.ayah_count - s.ayah_count) - Math.abs(b.ayah_count - s.ayah_count));
        const closeCounts = Array.from(new Set(nearest.map((o) => o.ayah_count))).slice(0, 8);
        const wrong = pickRandom(closeCounts, 3);
        const options = [s.ayah_count, ...wrong].sort((a, b) => a - b).map(toArabicDigits);
        return finalize({
          id: `g:ayahCount:${s.number}`,
          category: 'quran',
          difficulty: 2,
          kind: 'ayahCount',
          question: `كم عدد آيات سورة ${s.name_ar}؟`,
          answer: toArabicDigits(s.ayah_count),
          distractors: [],
          explanation: `سورة ${s.name_ar} عدد آياتها ${toArabicDigits(s.ayah_count)}، وترتيبها ${toArabicDigits(s.number)} في المصحف.`,
          ordered: options,
        });
      },
    });

    pool.push({
      id: `g:revelation:${s.number}`,
      category: 'quran',
      kind: 'revelation',
      make: () => {
        const meccan = s.revelation === 'Meccan';
        return finalize({
          id: `g:revelation:${s.number}`,
          category: 'quran',
          difficulty: 2,
          kind: 'revelation',
          question: `هل سورة ${s.name_ar} مكية أم مدنية؟`,
          answer: meccan ? 'مكية' : 'مدنية',
          distractors: [],
          explanation: `سورة ${s.name_ar} ${meccan ? 'مكية' : 'مدنية'} (حسب بيانات tanzil.net).`,
          ordered: ['مكية', 'مدنية'],
        });
      },
    });

    pool.push({
      id: `g:surahOrder:${s.number}`,
      category: 'quran',
      kind: 'surahOrder',
      make: () => {
        const nearby = Array.from({ length: 21 }, (_, i) => s.number - 10 + i).filter(
          (n) => n >= 1 && n <= 114 && n !== s.number
        );
        const options = [s.number, ...pickRandom(nearby, 3)].sort((a, b) => a - b).map(toArabicDigits);
        return finalize({
          id: `g:surahOrder:${s.number}`,
          category: 'quran',
          difficulty: 3,
          kind: 'surahOrder',
          question: `ما رقم سورة ${s.name_ar} في ترتيب المصحف؟`,
          answer: toArabicDigits(s.number),
          distractors: [],
          explanation: `سورة ${s.name_ar} هي السورة رقم ${toArabicDigits(s.number)}.`,
          ordered: options,
        });
      },
    });

    pool.push({
      id: `g:surahAt:${s.number}`,
      category: 'quran',
      kind: 'surahAt',
      make: () => {
        const near = surahs.filter((o) => o.number !== s.number && Math.abs(o.number - s.number) <= 6);
        return finalize({
          id: `g:surahAt:${s.number}`,
          category: 'quran',
          difficulty: 3,
          kind: 'surahAt',
          question: `ما اسم السورة رقم ${toArabicDigits(s.number)} في المصحف؟`,
          answer: s.name_ar,
          distractors: pickRandom(near, 3).map((o) => o.name_ar),
          explanation: `السورة رقم ${toArabicDigits(s.number)} هي سورة ${s.name_ar}.`,
        });
      },
    });
  }

  // Generated from prophets.json — single-prophet entries only
  const singles = prophets.filter((p) => !/عليهما/.test(p.name_ar));
  for (const p of singles) {
    pool.push({
      id: `g:prophetTitle:${p.slug}`,
      category: 'prophets',
      kind: 'prophetTitle',
      make: () =>
        finalize({
          id: `g:prophetTitle:${p.slug}`,
          category: 'prophets',
          difficulty: 2,
          kind: 'prophetTitle',
          question: `من النبي الذي يوصف بأنه: «${p.title_ar}»؟`,
          answer: p.name_ar,
          distractors: pickRandom(
            singles.filter((o) => o.slug !== p.slug).map((o) => o.name_ar),
            3
          ),
          explanation: p.summary_ar.split('.')[0] + '.',
        }),
    });
  }

  // Generated from tajweed.json — rules whose letter list is short and unique
  const allRules = tajweed.flatMap((c) => c.rules);
  const letterCount = new Map<string, number>();
  allRules.forEach((r) => letterCount.set(r.letters, (letterCount.get(r.letters) || 0) + 1));
  const letterRules = allRules.filter(
    (r) => letterCount.get(r.letters) === 1 && r.letters.length <= 30 && !/حرف|باقي/.test(r.letters)
  );
  for (const r of letterRules) {
    pool.push({
      id: `g:tajweedLetters:${r.id}`,
      category: 'tajweed',
      kind: 'tajweedLetters',
      make: () =>
        finalize({
          id: `g:tajweedLetters:${r.id}`,
          category: 'tajweed',
          difficulty: 2,
          kind: 'tajweedLetters',
          question: `ما حروف حكم «${r.name_ar}»؟`,
          answer: r.letters,
          distractors: pickRandom(
            letterRules.filter((o) => o.id !== r.id).map((o) => o.letters),
            3
          ),
          explanation: r.rule,
        }),
    });
  }

  return pool;
}

let poolCache: PoolItem[] | null = null;
const getPool = () => (poolCache ??= buildPool());

// ---------- adaptive session builder ----------

const RECENT_WINDOW = 80;

function weightFor(item: PoolItem, stats: QuizStats): number {
  let w = 1;
  if (stats.missedIds.includes(item.id)) w *= 4;

  const cat = stats.categories[item.category];
  if (!cat || cat.total < 3) {
    w *= 1.2; // unexplored area: nudge it in
  } else {
    const acc = cat.correct / cat.total;
    if (acc < 0.5) w *= 2.5;
    else if (acc < 0.75) w *= 1.6;
  }

  if (stats.recentIds.includes(item.id)) w *= 0.25;
  return w;
}

export function countMissable(stats: QuizStats): number {
  const ids = new Set(getPool().map((p) => p.id));
  return stats.missedIds.filter((id) => ids.has(id)).length;
}

export function buildSession(mode: QuizMode, stats: QuizStats, count: number = SESSION_SIZE): QuizQuestion[] {
  let candidates = getPool();
  if (mode === 'review') {
    const missed = new Set(stats.missedIds);
    candidates = candidates.filter((p) => missed.has(p.id));
  } else if (mode !== 'smart') {
    candidates = candidates.filter((p) => p.category === mode);
  }

  // Weighted random order (Efraimidis–Spirakis): higher weight tends to come first.
  const ranked = candidates
    .map((item) => ({ item, key: Math.pow(Math.random(), 1 / weightFor(item, stats)) }))
    .sort((a, b) => b.key - a.key)
    .map((r) => r.item);

  const categoryCap = mode === 'smart' ? Math.ceil(count / QUIZ_CATEGORIES.length) + 1 : Infinity;
  const kindCount: Record<string, number> = {};
  const catCount: Record<string, number> = {};
  const chosen: PoolItem[] = [];
  const skipped: PoolItem[] = [];

  for (const item of ranked) {
    if (chosen.length >= count) break;
    const kindCap = KIND_CAP[item.kind] ?? Infinity;
    if ((kindCount[item.kind] || 0) >= kindCap || (catCount[item.category] || 0) >= categoryCap) {
      skipped.push(item);
      continue;
    }
    kindCount[item.kind] = (kindCount[item.kind] || 0) + 1;
    catCount[item.category] = (catCount[item.category] || 0) + 1;
    chosen.push(item);
  }
  // Not enough variety to honour the caps — fill the rest without them.
  for (const item of skipped) {
    if (chosen.length >= count) break;
    chosen.push(item);
  }

  // Gentle ramp: easy → hard, random within the same difficulty.
  return shuffle(chosen.map((c) => c.make())).sort((a, b) => a.difficulty - b.difficulty);
}

// ---------- stats ----------

export interface QuizAnswer {
  question: QuizQuestion;
  correct: boolean;
}

export function applyResults(stats: QuizStats, answers: QuizAnswer[]): QuizStats {
  const categories = { ...stats.categories };
  let missed = new Set(stats.missedIds);

  for (const { question, correct } of answers) {
    const prev = categories[question.category] || { correct: 0, total: 0 };
    categories[question.category] = {
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    };
    if (correct) missed.delete(question.id);
    else missed.add(question.id);
  }

  const asked = answers.map((a) => a.question.id);
  const recentIds = [...asked, ...stats.recentIds.filter((id) => !asked.includes(id))].slice(0, RECENT_WINDOW);
  const percent = answers.length ? Math.round((answers.filter((a) => a.correct).length / answers.length) * 100) : 0;

  return {
    categories,
    missedIds: Array.from(missed).slice(-100),
    recentIds,
    bestScore: answers.length >= 5 ? Math.max(stats.bestScore, percent) : stats.bestScore,
    sessions: stats.sessions + 1,
  };
}

export function weakestCategory(stats: QuizStats): QuizCategory | null {
  let worst: { id: QuizCategory; acc: number } | null = null;
  for (const c of QUIZ_CATEGORIES) {
    const s = stats.categories[c.id];
    if (!s || s.total < 3) continue;
    const acc = s.correct / s.total;
    if (acc < 0.75 && (!worst || acc < worst.acc)) worst = { id: c.id, acc };
  }
  return worst ? worst.id : null;
}
