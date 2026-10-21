export interface Reciter {
  id: string;
  name: string;
  desc: string;
  folder: string; // everyayah.com sub-folder
}

export const RECITERS: Reciter[] = [
  { id: 'alafasy', name: 'مشاري العفاسي', desc: 'ترتيل مجوّد', folder: 'Alafasy_128kbps' },
  { id: 'husary', name: 'الحصري — ترتيل', desc: 'ترتيل الشيخ محمود خليل الحصري', folder: 'Husary_128kbps' },
  {
    id: 'husary_muallim',
    name: 'الحصري — المعلّم',
    desc: 'قراءة تعليمية بطيئة للتلقين والحفظ',
    folder: 'Husary_Muallim_128kbps',
  },
];

export const DEFAULT_RECITER_ID = 'alafasy';

export function getReciter(id?: string): Reciter {
  return RECITERS.find((r) => r.id === id) || RECITERS[0];
}

export function getAyahAudioUrl(reciterId: string | undefined, surah: number, ayah: number): string {
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/${getReciter(reciterId).folder}/${s}${a}.mp3`;
}

export function getAyahRangeUrls(reciterId: string | undefined, surah: number, from: number, to: number): string[] {
  const urls: string[] = [];
  for (let a = from; a <= to; a++) urls.push(getAyahAudioUrl(reciterId, surah, a));
  return urls;
}
