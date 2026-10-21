import { getUserSettings } from './storage';

export const DEFAULT_AI_MODEL = 'gemini-2.5-flash';

export const AVAILABLE_MODELS = [
  { id: 'flash-3.6-lite', name: 'Flash 3.6 Lite', desc: 'النموذج الخفيف والسريع' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'الأحدث والأسرع (موصى به)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'عالي الدقة والموثوقية' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'مستقر وسريع' },
];

const SYSTEM_INSTRUCTION = `
أنت "رفيق الحفظ والتدبر الذكي" داخل تطبيق "وِرد" (Wird) لحفظ القرآن الكريم والمراجعة بالتكرار المتباعد.
القواعد الصارمة:
1. القرآن الكريم كلام الله المعجز، لا تحرفه ولا تعيد صياغته ولا تستبدل ألفاظه.
2. قدم شروحاً لغوية وتدبرية موجزة وموثقة تعين الحافظ على تثبيت حفظه.
3. عند سؤالك عن آية، اذكر المتشابهات القرآنية مع سور أخرى لتنبيه الحافظ من الخلط والنسيان.
4. أسلوبك وقور، لطيف، موجز وعملي باللغة العربية الفصحى السلسة.
5. لا تتكلف الفتوى أو الأحكام الفقهية الشائكة وأرشد لأهل العلم.
`.trim();

export interface AiAyahAnalysis {
  tafsir: string;
  mutashabihat: string;
  memorizationTip: string;
}

export async function testGeminiApiKey(
  apiKey: string,
  model: string = DEFAULT_AI_MODEL
): Promise<{ success: boolean; message: string }> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { success: false, message: 'يرجى إدخال مفتاح API صحيح.' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'قل كلمة واحدة فقط: مرحباً' }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || 'فشل الاتصال بخدمة الذكاء الاصطناعي.';
      return { success: false, message: errMsg };
    }

    return { success: true, message: 'تم الاتصال بنجاح بـ ' + model };
  } catch (err: any) {
    return {
      success: false,
      message: 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.',
    };
  }
}

async function callGemini(prompt: string): Promise<string> {
  const settings = await getUserSettings();
  const apiKey = settings.geminiApiKey?.trim();
  const model = settings.geminiModel || DEFAULT_AI_MODEL;

  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'فشل استدعاء الذكاء الاصطناعي');
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('لم يتم استلام رد من النموذج');
  }

  return text.trim();
}

/**
 * Explain a single word in depth using Gemini AI
 */
export async function explainWordWithAi(
  word: string,
  ayahText: string,
  surahName: string,
  ayahNum: number
): Promise<string> {
  const prompt = `
الآية من سورة ${surahName} (الآية ${ayahNum}):
«${ayahText}»

المطلوب: اشرح كلمة «${word}» بإيجاز من حيث:
1. المعنى اللغوي الدقيق في هذا الموضع.
2. جذر الكلمة وسر التعبير بها دون غيرها.
3. رابط ذهني لطيف يعين الحافظ على استذكارها وعدم نسيانها في هذه الآية.
  `.trim();

  return await callGemini(prompt);
}

/**
 * Explain verse, its mutashabihat and memorization anchors
 */
export async function explainAyahWithAi(
  ayahText: string,
  surahName: string,
  ayahNum: number
): Promise<AiAyahAnalysis> {
  const prompt = `
الآية: «${ayahText}»
من سورة: ${surahName} (الآية ${ayahNum})

قدم إرشاداً لحفظ هذه الآية مقسماً بدقة كالتالي:
[تفسير وتدبر]: شرح إجمالي ميسر لمعنى الآية وهدايتها (في سطرين أو ثلاثة).
[المتشابهات القرآنية]: اذكر إن كانت هناك آيات تشبهها أو يقع فيها التباس في سور أخرى (مع بيان الفارق اللفظي لتثبيت الحفظ).
[مفتاح الحفظ]: ربط ذهني أو علامة تعين على استذكار بداية الآية وخاتمتها.
  `.trim();

  const responseText = await callGemini(prompt);

  // Parse structured sections
  let tafsir = '';
  let mutashabihat = '';
  let memorizationTip = '';

  const tafsirMatch = responseText.match(/\[تفسير وتدبر\]:?([\s\S]*?)(?=\[(?:المتشابهات القرآنية|مفتاح الحفظ)\]|$)/);
  const mutaMatch = responseText.match(/\[المتشابهات القرآنية\]:?([\s\S]*?)(?=\[مفتاح الحفظ\]|$)/);
  const tipMatch = responseText.match(/\[مفتاح الحفظ\]:?([\s\S]*?)$/);

  if (tafsirMatch) tafsir = tafsirMatch[1].trim();
  if (mutaMatch) mutashabihat = mutaMatch[1].trim();
  if (tipMatch) memorizationTip = tipMatch[1].trim();

  if (!tafsir && !mutashabihat && !memorizationTip) {
    tafsir = responseText;
  }

  return { tafsir, mutashabihat, memorizationTip };
}
