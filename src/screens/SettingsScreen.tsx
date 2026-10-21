import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { rtlRow } from '../theme/rtl';
import { UserSettings } from '../types';
import { getUserSettings, saveUserSettings } from '../utils/storage';
import { AVAILABLE_MODELS, DEFAULT_AI_MODEL, testGeminiApiKey } from '../utils/aiService';
import { WirdLogo } from '../components/Emblem/WirdLogo';
import { RECITERS, DEFAULT_RECITER_ID } from '../utils/reciters';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'emerald',
    fontSize: 22,
    showTajweedColors: true,
    audioAutoPlay: false,
    hapticFeedback: true,
    dailyGoalMinutes: 15,
    geminiApiKey: '',
    geminiModel: DEFAULT_AI_MODEL,
    aiEnabled: true,
  });

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getUserSettings();
      setSettings(s);
      if (s.geminiApiKey) {
        setApiKeyInput(s.geminiApiKey);
      }
    })();
  }, []);

  const updateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = await saveUserSettings({ [key]: value });
    setSettings(updated);
  };

  const handleSaveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    await updateSetting('geminiApiKey', trimmed);
    Alert.alert('تم الحفظ', trimmed ? 'تم حفظ مفتاح الذكاء الاصطناعي بنجاح!' : 'تم مسح المفتاح.');
  };

  const handleTestConnection = async () => {
    const keyToTest = apiKeyInput.trim() || settings.geminiApiKey;
    if (!keyToTest) {
      Alert.alert('تنبيه', 'يرجى إدخال مفتاح API أولاً لتجربته.');
      return;
    }

    setIsTestingKey(true);
    const res = await testGeminiApiKey(keyToTest, settings.geminiModel || DEFAULT_AI_MODEL);
    setIsTestingKey(false);

    if (res.success) {
      Alert.alert('اتصال ناجح! ✨', `${res.message}\nيمكنك الآن استخدام ميزات الشرح والتدبر الذكي.`);
    } else {
      Alert.alert('خطأ في الاتصال', res.message);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'إعادة تعيين البيانات',
      'هل تريد حقاً إعادة ضبط جميع سجلات الحفظ والمراجعة؟ سيتم استرجاع الإعدادات والنصوص الافتراضية.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، إعادة التعيين',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('تم التصفير', 'تمت استعادة البيانات الافتراضية بنجاح.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الإعدادات والملف الشخصي</Text>
        <Text style={styles.headerSub}>تخصيص تجربة الحفظ والمراجعة</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* App Profile Card */}
        <View style={styles.profileCard}>
          <WirdLogo size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileTitle}>تطبيق وِرد (Wird)</Text>
            <Text style={styles.profileSub}>الإصدار 1.0.0 · رفيق الحفظ والتكرار المتباعد</Text>
          </View>
        </View>

        {/* Section 1: Study Goals */}
        <Text style={styles.sectionTitle}>أهداف الحفظ اليومي</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>وقت المدارسة اليومي</Text>
              <Text style={styles.settingSub}>الهدف المقترح للمراجعة اليومية</Text>
            </View>
            <View style={styles.pillsRow}>
              {[10, 15, 30].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pill, settings.dailyGoalMinutes === m && styles.pillActive]}
                  onPress={() => updateSetting('dailyGoalMinutes', m)}
                >
                  <Text style={[styles.pillText, settings.dailyGoalMinutes === m && styles.pillTextActive]}>
                    {m} د
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Section 2: Display & Text */}
        <Text style={styles.sectionTitle}>العرض والخطوط</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>حجم خط المصحف</Text>
              <Text style={styles.settingSub}>تكبير أو تصغير الرسم العثماني</Text>
            </View>
            <View style={styles.pillsRow}>
              {[18, 22, 26, 30].map((sz) => (
                <TouchableOpacity
                  key={sz}
                  style={[styles.pill, settings.fontSize === sz && styles.pillActive]}
                  onPress={() => updateSetting('fontSize', sz)}
                >
                  <Text style={[styles.pillText, settings.fontSize === sz && styles.pillTextActive]}>
                    {sz}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>ألوان التجويد في الآيات</Text>
              <Text style={styles.settingSub}>تلوين أحكام النون والمدود والقلقلة</Text>
            </View>
            <Switch
              value={settings.showTajweedColors}
              onValueChange={(v) => updateSetting('showTajweedColors', v)}
              trackColor={{ false: '#334155', true: '#10b981' }}
              thumbColor={settings.showTajweedColors ? '#fae7a5' : '#cbd5e1'}
            />
          </View>
        </View>

        {/* Section 3: Interaction & Audio */}
        <Text style={styles.sectionTitle}>التفاعل والتنبيهات</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>الاهتزاز اللمسي (Haptics)</Text>
              <Text style={styles.settingSub}>اهتزاز خفيف عند التسبيح والتقييم</Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(v) => updateSetting('hapticFeedback', v)}
              trackColor={{ false: '#334155', true: '#10b981' }}
              thumbColor={settings.hapticFeedback ? '#fae7a5' : '#cbd5e1'}
            />
          </View>
        </View>

        {/* Reciter used by the Mushaf, stories, memorization and tajweed audio */}
        <Text style={styles.sectionTitle}>القارئ والصوت</Text>
        <View style={styles.settingsGroup}>
          <Text style={styles.inputSubLabel}>القارئ المعتمد للاستماع</Text>
          <View style={styles.modelPillsRow}>
            {RECITERS.map((r) => {
              const active = (settings.reciter || DEFAULT_RECITER_ID) === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.modelPill, active && styles.modelPillActive]}
                  onPress={() => updateSetting('reciter', r.id)}
                >
                  <Text style={[styles.modelPillTitle, active && styles.modelPillTitleActive]}>{r.name}</Text>
                  <Text style={[styles.modelPillDesc, active && styles.modelPillDescActive]}>{r.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 4: Gemini AI Settings */}
        <Text style={styles.sectionTitle}>الذكاء الاصطناعي (Gemini AI)</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>تفعيل رفيق الحفظ الذكي</Text>
              <Text style={styles.settingSub}>شرح وتدبر الآيات والمتشابهات وتوجيه الحفظ</Text>
            </View>
            <Switch
              value={settings.aiEnabled !== false}
              onValueChange={(v) => updateSetting('aiEnabled', v)}
              trackColor={{ false: '#334155', true: '#10b981' }}
              thumbColor={settings.aiEnabled !== false ? '#fae7a5' : '#cbd5e1'}
            />
          </View>

          <View style={styles.divider} />

          {/* Model selection */}
          <Text style={styles.inputSubLabel}>نموذج الذكاء الاصطناعي</Text>
          <View style={styles.modelPillsRow}>
            {AVAILABLE_MODELS.map((m) => {
              const active = (settings.geminiModel || DEFAULT_AI_MODEL) === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modelPill, active && styles.modelPillActive]}
                  onPress={() => updateSetting('geminiModel', m.id)}
                >
                  <Text style={[styles.modelPillTitle, active && styles.modelPillTitleActive]}>
                    {m.name}
                  </Text>
                  <Text style={[styles.modelPillDesc, active && styles.modelPillDescActive]}>
                    {m.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* API Key Input */}
          <View style={styles.apiKeyHeader}>
            <Text style={styles.inputSubLabel}>مفتاح Google Gemini API Key</Text>
            {settings.geminiApiKey ? (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={styles.statusBadgeText}>مُهيأ</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="alert-circle" size={14} color="#f87171" />
                <Text style={[styles.statusBadgeText, { color: '#f87171' }]}>غير مسجل</Text>
              </View>
            )}
          </View>

          <View style={styles.apiKeyInputWrap}>
            <TextInput
              style={styles.apiKeyInput}
              placeholder="الصق مفتاح API الخاص بك (AIzaSy...)"
              placeholderTextColor="#64748b"
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              <Ionicons
                name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.aiActionButtons}>
            <TouchableOpacity
              style={[styles.aiSaveBtn, isTestingKey && { opacity: 0.7 }]}
              onPress={handleSaveApiKey}
            >
              <Ionicons name="save-outline" size={16} color="#06291e" />
              <Text style={styles.aiSaveBtnText}>حفظ المفتاح</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.aiTestBtn, isTestingKey && { opacity: 0.7 }]}
              onPress={handleTestConnection}
              disabled={isTestingKey}
            >
              {isTestingKey ? (
                <ActivityIndicator size="small" color="#fae7a5" />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={16} color="#fae7a5" />
                  <Text style={styles.aiTestBtnText}>اختبار الاتصال</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* How to get API key hint */}
          <TouchableOpacity
            style={styles.hintBox}
            onPress={() => {
              Alert.alert(
                'كيفية الحصول على مفتاح Gemini مجاناً',
                '1. افتح الموقع: aistudio.google.com\n2. سجل الدخول بحساب Google الخاص بك\n3. اضغط على "Get API key" ثم "Create API key"\n4. انسخ المفتاح والصقه هنا في التطبيق.\n\nالخدمة مجانية تماماً للاستخدام الشخصي!'
              );
            }}
          >
            <Ionicons name="information-circle-outline" size={18} color="#e2ba59" />
            <Text style={styles.hintText}>
              كيف أحصل على مفتاح Gemini مجاناً من Google؟ اضغط للمساعدة
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 5: Data Management */}
        <Text style={styles.sectionTitle}>إدارة البيانات</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleResetData}>
            <Ionicons name="trash-outline" size={20} color="#f87171" />
            <Text style={styles.dangerText}>إعادة ضبط ومسح بيانات الحفظ</Text>
          </TouchableOpacity>
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
  contentScroll: {
    padding: 16,
    paddingBottom: 90,
  },
  profileCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#0d3527',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.35)',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  profileTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fae7a5',
    textAlign: 'right',
  },
  profileSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 10,
    marginTop: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingsGroup: {
    backgroundColor: '#092d21',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'right',
  },
  settingSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  pillsRow: {
    flexDirection: rtlRow,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillActive: {
    backgroundColor: '#fae7a5',
    borderColor: '#fae7a5',
  },
  pillText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#06291e',
  },
  dangerRow: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  dangerText: {
    fontSize: 14,
    color: '#f87171',
    fontWeight: '600',
  },
  inputSubLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2ba59',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  modelPillsRow: {
    gap: 8,
  },
  modelPill: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'flex-end',
  },
  modelPillActive: {
    backgroundColor: 'rgba(226, 186, 89, 0.15)',
    borderColor: '#fae7a5',
  },
  modelPillTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    textAlign: 'right',
  },
  modelPillTitleActive: {
    color: '#fae7a5',
  },
  modelPillDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  modelPillDescActive: {
    color: '#cbd5e1',
  },
  apiKeyHeader: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  apiKeyInputWrap: {
    flexDirection: rtlRow,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
  },
  apiKeyInput: {
    flex: 1,
    height: 44,
    color: '#fae7a5',
    fontSize: 13,
    textAlign: 'right',
  },
  eyeBtn: {
    padding: 8,
  },
  aiActionButtons: {
    flexDirection: rtlRow,
    gap: 10,
    marginTop: 10,
  },
  aiSaveBtn: {
    flex: 1,
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fae7a5',
    paddingVertical: 10,
    borderRadius: 10,
  },
  aiSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#06291e',
  },
  aiTestBtn: {
    flex: 1,
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  aiTestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fae7a5',
  },
  hintBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: 'rgba(226, 186, 89, 0.08)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.15)',
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    color: '#fae7a5',
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
