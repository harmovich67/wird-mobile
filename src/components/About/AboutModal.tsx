import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { rtlRow } from '../../theme/rtl';
import { ABOUT } from '../../data/about';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <LinearGradient colors={['#144e3b', '#0b392a', '#06291e']} style={styles.hero}>
            <TouchableOpacity style={styles.closeIcon} onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>{ABOUT.title}</Text>
            <Text style={styles.heroSub}>{ABOUT.subtitle}</Text>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {ABOUT.sections.map((section) => (
              <View key={section.title} style={styles.sectionCard}>
                <View style={styles.sectionHead}>
                  <Ionicons name={section.icon as any} size={16} color="#e2ba59" />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                {section.body ? <Text style={styles.sectionBody}>{section.body}</Text> : null}
                {section.bullets?.map((b) => (
                  <View key={b} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}

            <View style={styles.credit}>
              <Text style={styles.creditLabel}>{ABOUT.reviewedByLabel}</Text>
              <Text style={styles.creditValue}>{ABOUT.reviewers}</Text>
            </View>
            <View style={styles.credit}>
              <Text style={styles.creditLabel}>{ABOUT.developedByLabel}</Text>
              <Text style={styles.creditValue}>{ABOUT.developer}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sheikhName}>{ABOUT.sheikhName}</Text>
            <Text style={styles.sheikhPrayer}>{ABOUT.sheikhPrayerShort}</Text>
            <Text style={styles.living}>{ABOUT.livingKnowledge}</Text>

            <View style={styles.duaCard}>
              <View style={styles.duaHead}>
                <Ionicons name="star-outline" size={14} color="#e2ba59" />
                <Text style={styles.duaTitle}>{ABOUT.duaTitle}</Text>
              </View>
              <Text style={styles.duaText}>{ABOUT.dua}</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.closeBtnText}>{ABOUT.closeLabel}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 12, 9, 0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: '#07251c',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
  },
  hero: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  closeIcon: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  body: {
    padding: 20,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#0d3527',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHead: {
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fae7a5',
    textAlign: 'right',
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 22,
    color: '#cbd5e1',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bulletRow: {
    flexDirection: rtlRow,
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2ba59',
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 22,
    color: '#cbd5e1',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  credit: {
    alignItems: 'center',
    gap: 4,
  },
  creditLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  creditValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(226, 186, 89, 0.25)',
    marginVertical: 4,
  },
  sheikhName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fae7a5',
    lineHeight: 50,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  sheikhPrayer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2ba59',
    lineHeight: 32,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  living: {
    fontSize: 12,
    lineHeight: 21,
    color: '#94a3b8',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  duaCard: {
    backgroundColor: 'rgba(226, 186, 89, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 186, 89, 0.3)',
  },
  duaHead: {
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  duaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2ba59',
  },
  duaText: {
    fontSize: 19,
    lineHeight: 38,
    color: '#f8fafc',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  closeBtn: {
    backgroundColor: '#fae7a5',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#06291e',
  },
});
