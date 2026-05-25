import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../ThemeContext';
import { radii, shadows, spacing } from '../../theme';
import { AnalyticsService } from '../../services/AnalyticsService';
import { getAilmentGuides, saveAilmentGuides } from '../../db/sqlite';
import type { AilmentGuide } from '../../db/types';

const DEFAULT_AILMENTS: AilmentGuide[] = [
  { id: 1, title: 'Malaria', title_lg: 'Malaria', icon: 'bug', color: '#E53E3E', steps: ['Take temperature — fever above 37.5°C is a warning sign', 'Give plenty of fluids and ORS', 'Visit the nearest health center within 24 hours', 'Use prescribed ACTs — do NOT self-medicate'], steps_lg: ['Geza ebbugumu — okusukka 37.5°C kwa njawulo', 'Wa amazzi amangi ne ORS', 'Genda mu ddwaliro okumpi mu ssaawa 24', 'Kozesa eddagala ACT elyalagiddwa'] },
  { id: 2, title: 'Diarrhea', title_lg: 'Okuddukana', icon: 'water', color: '#3182CE', steps: ['Start ORS solution immediately', 'Continue breastfeeding for infants', 'Give zinc supplements for children under 5', 'Seek medical help if blood in stool or dehydration'], steps_lg: ['Tandika ORS amangwago', 'Weyongere okunyisa abaana abato', 'Wa zinc abaana abali wansi w\'emyaka 5', 'Noonya obuyambi bw\'abasawo singa waliwo omusaayi'] },
  { id: 3, title: 'Snake Bite', title_lg: 'Okulumwa Omusota', icon: 'snake', color: '#DD6B20', steps: ['Keep the victim calm and still', 'Remove jewelry near the bite area', 'Do NOT suck the venom or apply a tourniquet', 'Rush to the nearest hospital immediately'], steps_lg: ['Laba nti alumiddwa ateekedde era teyekyusa', 'Ggyayo obuyambi bw\'ebyobulungi okumpi n\'ekifo', 'TOGEZAAKO kunywa bussagu oba okusiba', 'Yanguwa okumuleeta mu ddwaliro'] },
  { id: 4, title: 'Burns', title_lg: 'Okwokya', icon: 'fire', color: '#E53E3E', steps: ['Cool the burn under clean running water for 20 min', 'Cover with a clean cloth — do NOT apply butter or toothpaste', 'Give paracetamol for pain', 'Seek medical help for severe burns'], steps_lg: ['Kozesa amazzi amayonjo agatambula okumala eddakiika 20', 'Bikka n\'olugoye olulongoofu — TEKISSA bata oba pepaminti', 'Wa paracetamol ku bulumi', 'Noonya obuyambi bw\'abasawo ku bwokye obubi'] },
];

export const AilmentGuides: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  
  const [guides, setGuides] = useState<AilmentGuide[]>([]);
  const [expandedAilment, setExpandedAilment] = useState<number | null>(null);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      let data = await getAilmentGuides();
      if (data.length === 0) {
        await saveAilmentGuides(DEFAULT_AILMENTS);
        data = await getAilmentGuides();
      }
      setGuides(data);
    } catch (e) {
      console.error('Failed to load ailment guides', e);
      setGuides(DEFAULT_AILMENTS);
    }
  };

  const toggleAilment = (id: number) => {
    if (expandedAilment !== id) {
      AnalyticsService.logEvent('ailment_guide_viewed', { guideId: id });
    }
    setExpandedAilment(expandedAilment === id ? null : id);
  };

  return (
    <View style={[styles.ailmentSection, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }]}>
      <View style={styles.activityHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon source="medical-bag" size={22} color={colors.primary[900]} />
          <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
            {i18n.language === 'lg' ? 'Endwadde Ezimanyiddwa' : 'Quick Ailment Guides'}
          </Text>
        </View>
      </View>
      <Text style={[styles.sectionSub, { color: colors.neutral[500] }]}>
        {i18n.language === 'lg' ? 'Kola kino mangu singa ofuna obuzibu' : 'Step-by-step first aid for common conditions'}
      </Text>

      {guides.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => toggleAilment(item.id)}
          style={[styles.ailmentCard, { backgroundColor: colors.neutral[50], borderColor: item.color }]}
        >
          <View style={styles.ailmentHeader}>
            <View style={[styles.ailmentIconBox, { backgroundColor: item.color + '20' }]}>
              <Icon source={item.icon} size={20} color={item.color} />
            </View>
            <Text style={[styles.ailmentTitle, { color: colors.neutral[900] }]}>
              {i18n.language === 'lg' && item.title_lg ? item.title_lg : item.title}
            </Text>
            <Icon source={expandedAilment === item.id ? 'chevron-up' : 'chevron-down'} size={24} color={colors.neutral[400]} />
          </View>

          {expandedAilment === item.id && (
            <View style={styles.ailmentSteps}>
              {((i18n.language === 'lg' && item.steps_lg) ? item.steps_lg : item.steps).map((step: string, idx: number) => (
                <View key={idx} style={styles.ailmentStepRow}>
                  <View style={[styles.stepNumber, { backgroundColor: item.color }]}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.neutral[700] }]}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  ailmentSection: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  ailmentCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  ailmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ailmentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ailmentTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  ailmentSteps: {
    marginTop: 16,
    gap: 12,
  },
  ailmentStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  stepText: {
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
    fontWeight: '600',
  },
});
