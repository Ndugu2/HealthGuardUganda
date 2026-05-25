import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { radii, spacing, shadows } from '../../theme';
import { useAppTheme } from '../../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../AnimatedCard';

interface HealthTip {
  id: number;
  category: 'maternal' | 'malaria' | 'hygiene' | 'nutrition' | 'immunization' | 'sanitation';
  tip: string;
  tip_lg: string;
  source: string;
  icon: string;
}

const HEALTH_TIPS: HealthTip[] = [
  {
    id: 1,
    category: 'maternal',
    tip: 'Start Antenatal Care (ANC) visits in your first trimester (before 12 weeks) to protect your baby.',
    tip_lg: 'Tandika okukeberebwa olubuto mu myezi esatu egyasooka (munda wa wiki 12) okukuuma omwana wo.',
    source: 'MOH Uganda / WHO',
    icon: 'baby-carriage',
  },
  {
    id: 2,
    category: 'malaria',
    tip: 'Always sleep under a long-lasting insecticide-treated mosquito net (LLIN) every night to prevent Malaria.',
    tip_lg: 'Sula mu katimba k\'ensiri akalimu eddagala buli kiro okuziyiza Omusujja gw\'ensiri.',
    source: 'WHO Malaria Program',
    icon: 'shield-bug-outline',
  },
  {
    id: 3,
    category: 'hygiene',
    tip: 'Wash hands with clean running water and soap before preparing food and after using the toilet.',
    tip_lg: 'Naaba mu ngalo n\'amazzi agatemba n\'ekkooli nga tonnategeka byakulya n\'oluvannyuma lw\'okukozesa kaabuyonjo.',
    source: 'CDC Uganda',
    icon: 'hand-water',
  },
  {
    id: 4,
    category: 'sanitation',
    tip: 'Boil all drinking water or use water purification tablets to prevent Cholera, Typhoid, and Diarrhea.',
    tip_lg: 'Kolerera ddala amazzi g\'onywa oba kozesa eddagala eritta obuwuka okuziyiza Cholera, Typhoid, n\'Okuddukana.',
    source: 'Uganda MoH Sanitation Dept',
    icon: 'water-boiler',
  },
  {
    id: 5,
    category: 'nutrition',
    tip: 'Exclusively breastfeed your baby for the first 6 months. Do not add water, porridge, or tea.',
    tip_lg: 'Yonsea omwana wo amabeere gokka mu myezi 6 egyasooka. Tokozesa mazzi, lugere, oba caayi.',
    source: 'UNICEF Nutrition Guidelines',
    icon: 'baby-bottle-outline',
  },
  {
    id: 6,
    category: 'immunization',
    tip: 'Ensure your child completes all UNEPI vaccines before their first birthday. Vaccines are free at MoH clinics.',
    tip_lg: 'Kakasa nti omwana wo amaliriza enkingo zonna eza UNEPI nga tannezaza mwaka gumu. Enkingo za bwereere mu malwaliro ga gavumenti.',
    source: 'UNEPI Program',
    icon: 'needle',
  },
];

export const DailyHealthTips: React.FC = () => {
  const { i18n } = useTranslation();
  const { colors } = useAppTheme();
  
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // Auto-cycle tips every 12 seconds
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % HEALTH_TIPS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    setTipIndex(prev => (prev + 1) % HEALTH_TIPS.length);
  };

  const handlePrev = () => {
    setTipIndex(prev => (prev - 1 + HEALTH_TIPS.length) % HEALTH_TIPS.length);
  };

  const activeTip = HEALTH_TIPS[tipIndex];
  const isLuganda = i18n.language === 'lg';

  return (
    <AnimatedCard delay={150} style={styles.card}>
      <LinearGradient colors={['#319795', '#2C7A7B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <View style={styles.headerRow}>
          <View style={styles.categoryBadge}>
            <Icon source={activeTip.icon} size={16} color="#319795" />
            <Text style={styles.categoryText}>{activeTip.category.toUpperCase()}</Text>
          </View>
          <Text style={styles.sourceText}>Source: {activeTip.source}</Text>
        </View>

        <View style={styles.bodyRow}>
          <Text style={styles.tipText}>
            {isLuganda ? activeTip.tip_lg : activeTip.tip}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.titleLabel}>Daily Health Guide</Text>
          <View style={styles.controls}>
            <TouchableOpacity onPress={handlePrev} style={styles.controlBtn}>
              <Icon source="chevron-left" size={20} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.counterText}>{tipIndex + 1}/{HEALTH_TIPS.length}</Text>
            <TouchableOpacity onPress={handleNext} style={styles.controlBtn}>
              <Icon source="chevron-right" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    ...shadows.md,
  },
  gradient: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2C7A7B',
    letterSpacing: 0.5,
  },
  sourceText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  bodyRow: {
    minHeight: 60,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tipText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: spacing.md,
  },
  titleLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
