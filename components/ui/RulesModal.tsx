import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LIQUID_GLASS_COLORS, TEXT_OUTLINE_STYLE } from '@/constants/colors';
import { useTranslation } from 'react-i18next';

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={[styles.title, TEXT_OUTLINE_STYLE]}>{t('rules.title')}</Text>
          <Text style={[styles.subtitle, TEXT_OUTLINE_STYLE]}>{t('rules.subtitle')}</Text>

          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 12 }}>
            <Section title={t('rules.win_condition.title')}>
              <Bullet>{t('rules.win_condition.1')}</Bullet>
              <Bullet>{t('rules.win_condition.2')}</Bullet>
            </Section>

            <Section title={t('rules.pieces.title')}>
              <Bullet>{t('rules.pieces.1')}</Bullet>
              <Bullet>{t('rules.pieces.2')}</Bullet>
            </Section>

            <Section title={t('rules.placement.title')}>
              <Bullet>{t('rules.placement.1')}</Bullet>
              <Bullet>{t('rules.placement.2')}</Bullet>
              <Bullet>{t('rules.placement.3')}</Bullet>
              <Bullet>{t('rules.placement.4')}</Bullet>
            </Section>

          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, TEXT_OUTLINE_STYLE]}>{title}</Text>
    <View style={{ gap: 6 }}>{children}</View>
  </View>
);

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.bulletRow}>
    <View style={styles.dot} />
    <Text style={[styles.bulletText, TEXT_OUTLINE_STYLE]}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F2930',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 20,
    paddingHorizontal: 18
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: LIQUID_GLASS_COLORS.text.primary,
    textAlign: 'center'
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: LIQUID_GLASS_COLORS.text.secondary,
    textAlign: 'center'
  },
  scroll: {
    marginTop: 14,
    maxHeight: 420
  },
  section: {
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: LIQUID_GLASS_COLORS.text.primary,
    marginBottom: 8
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LIQUID_GLASS_COLORS.primary.coral,
    marginTop: 8
  },
  bulletText: {
    flex: 1,
    color: LIQUID_GLASS_COLORS.text.secondary,
    lineHeight: 20
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: LIQUID_GLASS_COLORS.primary.coral,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12
  },
  closeText: {
    color: '#fff',
    fontWeight: '700'
  }
});

