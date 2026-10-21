import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { rtlRow } from '../../theme/rtl';
import { MemoryPassage } from '../../types';
import { getUserSettings, saveUserSettings } from '../../utils/storage';
import { RECITERS, DEFAULT_RECITER_ID, getAyahRangeUrls } from '../../utils/reciters';
import { usePlaylist } from '../../utils/audioPlaylist';

interface Props {
  passage: MemoryPassage;
}

const formatTime = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
};

/**
 * Listen to the teacher (the reciter chosen here) and record your own voice, so you can
 * recite along and then compare. Hadith / custom passages have no teacher audio, only recording.
 */
export const RecitePanel: React.FC<Props> = ({ passage }) => {
  const [reciter, setReciter] = useState<string>(DEFAULT_RECITER_ID);
  const [loop, setLoop] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 250);
  const { playingKey, play, stop, toggle } = usePlaylist(() =>
    Alert.alert('تنبيه صوتي', 'تعذر تشغيل الصوت، يرجى التأكد من اتصال الإنترنت.')
  );

  const hasTeacher = !!(passage.surahNumber && passage.fromAyah && passage.toAyah);
  const teacherUrls = hasTeacher
    ? getAyahRangeUrls(reciter, passage.surahNumber!, passage.fromAyah!, passage.toAyah!)
    : [];
  const isRecording = recState.isRecording;

  useEffect(() => {
    getUserSettings().then((s) => setReciter(s.reciter || DEFAULT_RECITER_ID));
    return () => {
      setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    };
  }, []);

  const chooseReciter = (id: string) => {
    stop();
    setReciter(id);
    saveUserSettings({ reciter: id }).catch(() => {});
  };

  const startRecording = async (withTeacher: boolean) => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('الميكروفون غير مسموح', 'اسمح للتطبيق باستخدام الميكروفون من إعدادات الجهاز لتسجيل صوتك.');
        return;
      }
      stop();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      if (withTeacher && hasTeacher) play('teacher', teacherUrls, loop);
    } catch {
      Alert.alert('تعذر التسجيل', 'لم نتمكن من بدء التسجيل، حاول مرة أخرى.');
    }
  };

  const stopRecording = async () => {
    try {
      stop();
      await recorder.stop();
      setRecordingUri(recorder.uri);
    } catch {
      Alert.alert('تعذر التسجيل', 'حدث خطأ أثناء إيقاف التسجيل.');
    } finally {
      // Back to normal playback routing (the loudspeaker rather than the earpiece on iOS).
      setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    }
  };

  const deleteRecording = () => {
    stop();
    setRecordingUri(null);
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="mic" size={18} color="#fae7a5" />
        <Text style={styles.title}>{hasTeacher ? 'اقرأ مع المعلم' : 'سجّل تلاوتك'}</Text>
      </View>

      {hasTeacher && (
        <>
          <View style={styles.reciterRow}>
            {RECITERS.map((r) => {
              const active = reciter === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.reciterChip, active && styles.chipActive]}
                  onPress={() => chooseReciter(r.id)}
                >
                  <Text style={[styles.reciterText, active && styles.chipTextActive]}>{r.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, playingKey === 'teacher' && styles.btnActive]}
              activeOpacity={0.85}
              disabled={isRecording}
              onPress={() => toggle('teacher', teacherUrls, loop)}
            >
              <Ionicons
                name={playingKey === 'teacher' ? 'stop' : 'play'}
                size={15}
                color={playingKey === 'teacher' ? '#06291e' : '#fae7a5'}
              />
              <Text style={[styles.btnText, playingKey === 'teacher' && styles.chipTextActive]}>
                {playingKey === 'teacher' ? 'إيقاف' : 'استمع للمعلم'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, loop && styles.btnActive]}
              activeOpacity={0.85}
              onPress={() => setLoop((v) => !v)}
            >
              <Ionicons name="repeat" size={15} color={loop ? '#06291e' : '#fae7a5'} />
              <Text style={[styles.btnText, loop && styles.chipTextActive]}>تكرار</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {isRecording ? (
        <TouchableOpacity style={styles.stopRecBtn} activeOpacity={0.85} onPress={stopRecording}>
          <Ionicons name="stop-circle" size={20} color="#fff" />
          <Text style={styles.stopRecText}>إيقاف التسجيل · {formatTime(recState.durationMillis)}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.row}>
          <TouchableOpacity style={styles.recBtn} activeOpacity={0.85} onPress={() => startRecording(false)}>
            <Ionicons name="mic" size={16} color="#06291e" />
            <Text style={styles.recText}>سجّل صوتك</Text>
          </TouchableOpacity>
          {hasTeacher && (
            <TouchableOpacity style={styles.recBtn} activeOpacity={0.85} onPress={() => startRecording(true)}>
              <Ionicons name="people" size={16} color="#06291e" />
              <Text style={styles.recText}>اقرأ مع المعلم</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {recordingUri && !isRecording && (
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, playingKey === 'mine' && styles.btnActive]}
            activeOpacity={0.85}
            onPress={() => toggle('mine', [recordingUri])}
          >
            <Ionicons
              name={playingKey === 'mine' ? 'stop' : 'play'}
              size={15}
              color={playingKey === 'mine' ? '#06291e' : '#fae7a5'}
            />
            <Text style={[styles.btnText, playingKey === 'mine' && styles.chipTextActive]}>تسجيلي</Text>
          </TouchableOpacity>
          {hasTeacher && (
            <TouchableOpacity
              style={[styles.btn, playingKey === 'compare' && styles.btnActive]}
              activeOpacity={0.85}
              onPress={() => toggle('compare', [...teacherUrls, recordingUri])}
            >
              <Ionicons
                name={playingKey === 'compare' ? 'stop' : 'swap-horizontal'}
                size={15}
                color={playingKey === 'compare' ? '#06291e' : '#fae7a5'}
              />
              <Text style={[styles.btnText, playingKey === 'compare' && styles.chipTextActive]}>
                قارن بالمعلم
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.85} onPress={deleteRecording}>
            <Ionicons name="trash-outline" size={16} color="#f87171" />
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.tip}>
        {hasTeacher
          ? 'عند القراءة مع المعلم استخدم سماعات الأذن حتى لا يلتقط الميكروفون صوت المعلم. التسجيل مؤقت ويُحذف عند مغادرة الشاشة.'
          : 'التسجيل مؤقت ويُحذف عند مغادرة الشاشة.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d3527',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
  },
  titleRow: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fae7a5',
    textAlign: 'right',
  },
  reciterRow: {
    flexDirection: rtlRow,
    flexWrap: 'wrap',
    gap: 8,
  },
  reciterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(250, 231, 165, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
  },
  chipActive: {
    backgroundColor: '#fae7a5',
    borderColor: '#fae7a5',
  },
  reciterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fae7a5',
  },
  chipTextActive: {
    color: '#06291e',
  },
  row: {
    flexDirection: rtlRow,
    gap: 8,
    alignItems: 'center',
  },
  btn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(250, 231, 165, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
  },
  btnActive: {
    backgroundColor: '#fae7a5',
    borderColor: '#fae7a5',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fae7a5',
  },
  recBtn: {
    flex: 1,
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#fae7a5',
  },
  recText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#06291e',
  },
  stopRecBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#dc2626',
  },
  stopRecText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  deleteBtn: {
    padding: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  tip: {
    fontSize: 11,
    lineHeight: 18,
    color: '#94a3b8',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
