import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { rtlRow } from '../theme/rtl';
import { Hadith } from '../types';
import nawawiData from '../data/nawawi_hadiths.json';
import bukhariData from '../data/bukhari_highlights.json';
import { addPassage } from '../utils/storage';

interface Props {
  onNavigate: (tab: string, params?: any) => void;
}

export const HadithScreen: React.FC<Props> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'nawawi' | 'bukhari'>('nawawi');
  const [search, setSearch] = useState('');

  const currentList = activeTab === 'nawawi' ? (nawawiData as Hadith[]) : (bukhariData as Hadith[]);

  const filtered = currentList.filter(
    (h) =>
      h.text.includes(search) ||
      (h.plain && h.plain.includes(search)) ||
      h.number.toString() === search
  );

  const handleAddToWird = async (hadith: Hadith) => {
    try {
      const title =
        activeTab === 'nawawi'
          ? `الحديث ${hadith.number} (الأربعون النووية)`
          : `حديث من صحيح البخاري (${hadith.number})`;

      await addPassage({
        title,
        sourceType: 'hadith',
        reference: activeTab === 'nawawi' ? 'الأربعون النووية' : 'صحيح البخاري',
        text: hadith.text,
      });

      Alert.alert(
        'تمت الإضافة بنجاح',
        `أضيف ${title} إلى ورد الحفظ والمراجعة!`,
        [
          { text: 'متابعة', style: 'cancel' },
          { text: 'بدء الحفظ الآن', onPress: () => onNavigate('study') },
        ]
      );
    } catch {
      Alert.alert('خطأ', 'تعذر إضافة الحديث.');
    }
  };

  const renderItem = ({ item }: { item: Hadith }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {activeTab === 'nawawi' ? `الحديث ${item.number}` : `رقم ${item.number}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => handleAddToWird(item)}
        >
          <Ionicons name="add" size={16} color="#06291e" />
          <Text style={styles.addBtnText}>أضف للحفظ</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hadithText}>{item.text}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.refText}>
          {activeTab === 'nawawi' ? 'الأربعون النووية للإمام النووي' : 'صحيح الإمام البخاري'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>السنة النبوية الشريفة</Text>
        <Text style={styles.headerSub}>أحاديث رسول الله ﷺ للحفظ والتدبر</Text>

        {/* Tab switch */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'nawawi' && styles.tabBtnActive]}
            onPress={() => setActiveTab('nawawi')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'nawawi' && styles.tabBtnTextActive]}>
              الأربعون النووية (٤٢ حديثاً)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'bukhari' && styles.tabBtnActive]}
            onPress={() => setActiveTab('bukhari')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'bukhari' && styles.tabBtnTextActive]}>
              روائع البخاري
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#fae7a5" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في نص الحديث أو رقمه..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Hadith List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  tabsRow: {
    flexDirection: rtlRow,
    gap: 8,
    marginTop: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(250, 231, 165, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.2)',
  },
  tabBtnActive: {
    backgroundColor: '#fae7a5',
  },
  tabBtnText: {
    fontSize: 12,
    color: '#fae7a5',
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#06291e',
  },
  searchBar: {
    flexDirection: rtlRow,
    alignItems: 'center',
    backgroundColor: 'rgba(5, 27, 20, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    textAlign: 'right',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#0d3527',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.25)',
  },
  cardHeader: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(250, 231, 165, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    color: '#fae7a5',
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fae7a5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#06291e',
    fontSize: 11,
    fontWeight: '700',
  },
  hadithText: {
    fontSize: 17,
    lineHeight: 30,
    color: '#f8fafc',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  refText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
