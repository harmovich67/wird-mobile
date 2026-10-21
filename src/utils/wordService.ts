import { WordLookupResult, WordMeaningEntry } from '../types';
import { getSurahMeanings } from '../data/meanings/index';

export const AUDIO_BASE = 'https://audio.qurancdn.com/wbw/';

export const BOOKS: Record<string, { title: string; author: string }> = {
  siraj: { title: 'السراج في بيان غريب القرآن', author: 'محمد الخضيري' },
  kalimat: { title: 'كلمات القرآن تفسير وبيان', author: 'حسنين محمد مخلوف' },
  tadhkira: { title: 'تذكرة الأريب في تفسير الغريب', author: 'ابن الجوزي' },
  tibyan: { title: 'التبيان في تفسير غريب القرآن', author: 'ابن الهائم' },
};

export function getWordAudioUrl(surah: number, ayah: number, wordIndex: number): string {
  const s = surah.toString().padStart(3, '0');
  const a = ayah.toString().padStart(3, '0');
  const w = wordIndex.toString().padStart(3, '0');
  return `${AUDIO_BASE}${s}_${a}_${w}.mp3`;
}

/** Letters only: diacritics, Quranic marks and tatweel removed, alef / ya / ta-marbuta forms unified. */
export function normalize(word: string): string {
  let s = word.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');
  s = s.replace(/[^\u0621-\u064A\u0671]/g, '');
  const map: Record<string, string> = {
    'ٱ': 'ا',
    'أ': 'ا',
    'إ': 'ا',
    'آ': 'ا',
    'ى': 'ي',
    'ة': 'ه',
  };
  return s.replace(/[ٱأإآىة]/g, (c) => map[c] || c);
}

/**
 * Comparable keys of a word, with and without the common attached prefixes
 */
export function forms(word: string): string[] {
  const s = normalize(word);
  const skeleton = (w: string) => w.replace(/[اويءؤئ]/g, '');
  const prefixes = ['وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'و', 'ف'];
  const variants = [s];

  for (const prefix of prefixes) {
    if (s.startsWith(prefix) && s.length - prefix.length >= 2) {
      variants.push(s.slice(prefix.length));
    }
  }

  for (const v of [...variants]) {
    if (/^[بلك]/.test(v) && v.length > 3) {
      variants.push(v.slice(1));
    }
  }

  const result = new Set<string>();
  for (const v of variants) {
    const k = skeleton(v);
    if (k.length >= 2) {
      result.add(k);
    } else {
      const spelled = v.replace(/ء/g, '').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
      if (spelled.length >= 2) {
        result.add('=' + spelled);
      }
    }
  }
  return Array.from(result);
}

/**
 * Entries of the classical gharib books that explain this word.
 */
export function matches(word: string, entries: Array<[string, string, string]>): WordMeaningEntry[] {
  const target = forms(word);
  if (!target.length) return [];
  const out: WordMeaningEntry[] = [];
  const seen = new Set<string>();

  for (const [book, text, meaning] of entries) {
    if (seen.has(book) || !BOOKS[book]) continue;
    const tokens = text.trim().split(/\s+/);
    for (const token of tokens) {
      if (tokens.length > 1 && normalize(token).length < 3) continue;
      const tokenForms = forms(token);
      if (target.some((f) => tokenForms.includes(f))) {
        seen.add(book);
        out.push({
          book: BOOKS[book].title,
          author: BOOKS[book].author,
          text,
          meaning,
        });
        break;
      }
    }
  }
  return out;
}

/**
 * Lookup word meaning and verse tafsir for a given word index (1-based)
 */
export function lookupWord(
  surah: number,
  ayah: number,
  wordIndex: number,
  wordText: string
): WordLookupResult {
  const surahData = getSurahMeanings(surah);
  const ayahData = surahData ? surahData[ayah.toString()] : null;

  const audioUrl = getWordAudioUrl(surah, ayah, wordIndex);
  const meanings = ayahData?.g ? matches(wordText, ayahData.g) : [];
  const tafsir = ayahData?.t || 'التفسير الميسر غير متوفر حالياً لهذه الآية.';

  return {
    word: wordText,
    index: wordIndex,
    count: 0,
    audioUrl,
    meanings,
    tafsir,
    surahNumber: surah,
    ayahNumber: ayah,
  };
}

export function splitAyahWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}
