import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { useAppTheme } from '../../ThemeContext';
import { radii, shadows, spacing } from '../../theme';
import { AnalyticsService } from '../../services/AnalyticsService';
import { getCommunityMyths, saveCommunityMyths } from '../../db/sqlite';
import type { MythBusterItem } from '../../db/types';

// The default data to load if DB is empty
const DEFAULT_MYTHS: MythBusterItem[] = [
  { 
    id: 1, claim: 'Vaccines cause infertility in women.', claim_lg: 'Emizinga ekosa obuto bw\'abakazi.', 
    verdict: 'MYTH', explanation: 'Extensive studies by WHO and CDC show no link between vaccines (including COVID-19 and HPV) and female infertility.', 
    explanation_lg: 'Okunoonyereza kwolese tewalukwata wakati w\'emizinga n\'obuto.', source: 'WHO', time: '2h ago', icon: 'close-circle' 
  },
  { 
    id: 2, claim: 'mRNA vaccines alter your DNA permanently.', claim_lg: 'Emizinga ya mRNA ekyusa DNA yo.', 
    verdict: 'MYTH', explanation: 'mRNA never enters the nucleus of the cell where your DNA is kept. It breaks down quickly and does not alter your genetic code.', 
    explanation_lg: 'mRNA teryingira mu nucleus ya selo. Teykyusa DNA.', source: 'CDC', time: '5h ago', icon: 'close-circle' 
  },
  { 
    id: 3, claim: 'HIV is caused by witchcraft or a curse.', claim_lg: 'HIV eva mu bulogo oba ekikolimo.', 
    verdict: 'MYTH', explanation: 'HIV is caused by a virus transmitted through specific bodily fluids. It is a medical condition, not a supernatural curse.', 
    explanation_lg: 'HIV eva mu virusi ekwata ku musaayi. Si bulogo.', source: 'Uganda MoH', time: '1d ago', icon: 'close-circle' 
  },
  { 
    id: 5, claim: 'Routine childhood vaccines protect from polio and measles.', claim_lg: 'Emizinga y\'abaana erinda polio ne measles.', 
    verdict: 'FACT', explanation: 'Vaccines like OPV (Polio) and MR (Measles-Rubella) are highly effective at preventing these crippling and deadly diseases.', 
    explanation_lg: 'Emizinga erina obusobozi bw\'okuziyiza endwadde zino.', source: 'WHO', time: '6h ago', icon: 'check-circle' 
  },
  { 
    id: 6, claim: 'Handwashing with soap prevents diarrhea.', claim_lg: 'Okunaaba engalo n\'ekkooli kuziyiza okuddukana.', 
    verdict: 'FACT', explanation: 'Handwashing with soap reduces the risk of diarrheal diseases by up to 40-50% by removing pathogens.', 
    explanation_lg: 'Kikendeeza ku kuddukana okumala 40-50%.', source: 'CDC', time: '1d ago', icon: 'check-circle' 
  },
  { 
    id: 7, claim: 'ARVs are life-saving medicines for HIV patients.', claim_lg: 'ARVs ddagala eriwonya HIV.', 
    verdict: 'FACT', explanation: 'Antiretroviral therapy (ART) suppresses the viral load, allowing people living with HIV to live long, healthy lives.', 
    explanation_lg: 'ARVs zikendeeza obuzibu bw\'akawuka era ziwa obulamu obulungi.', source: 'Uganda MoH', time: '2d ago', icon: 'check-circle' 
  },
  { 
    id: 8, claim: 'I\'m not sure if this new herbal tea cures HIV.', claim_lg: 'Ssi mwekka nti ekijanjaba ekipya kiwonya HIV.', 
    verdict: 'UNCERTAIN', explanation: 'No herbal tea has been scientifically proven to cure HIV. Always consult a doctor before stopping ARVs.', 
    explanation_lg: 'Tewali kijanjaba kiwonya HIV. Kwegendereza.', source: 'Pharmacy Board', time: '4h ago', icon: 'help-circle' 
  }
];

export const MythBusterFeed: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  
  const [myths, setMyths] = useState<MythBusterItem[]>([]);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'MYTH' | 'FACT'>('ALL');
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  useEffect(() => {
    loadMyths();
  }, []);

  const loadMyths = async () => {
    try {
      let data = await getCommunityMyths();
      if (data.length === 0) {
        await saveCommunityMyths(DEFAULT_MYTHS);
        data = await getCommunityMyths();
      }
      setMyths(data);
    } catch (e) {
      console.error('Failed to load myths', e);
      setMyths(DEFAULT_MYTHS);
    }
  };

  const handleSpeak = async (item: MythBusterItem) => {
    const isLuganda = i18n.language === 'lg';
    
    if (speakingId === item.id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }

    Speech.stop();
    setSpeakingId(item.id);
    
    await AnalyticsService.logAudioPlayed('myth_buster', item.id, i18n.language);

    const claimText = isLuganda && item.claim_lg ? item.claim_lg : item.claim;
    const explanationText = isLuganda && item.explanation_lg ? item.explanation_lg : item.explanation;
    
    // expo-speech language parameter: 'en' for English, we fallback to 'en' for Luganda approximation or if device supports it.
    Speech.speak(`${claimText}. ${explanationText}`, {
      language: isLuganda ? 'sw' : 'en', // Many devices approximate Luganda better with Swahili voice engine if Luganda isn't available
      onDone: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
    });
  };

  const handleMythPress = (id: number) => {
    AnalyticsService.logMythViewed(id);
  };

  const filteredFeed = myths.filter(item => {
    if (feedFilter === 'ALL') return true;
    if (feedFilter === 'MYTH') return item.verdict === 'MYTH';
    if (feedFilter === 'FACT') return item.verdict === 'FACT';
    return true;
  });

  return (
    <View style={[styles.mythSection, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }]}>
      <View style={styles.activityHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon source="shield-search" size={22} color="#805AD5" />
          <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
            {i18n.language === 'lg' ? 'Olufumo oba Amazima?' : 'Myth or Fact?'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: '#F3E8FF' }]}>
          <Text style={[styles.statusText, { color: '#805AD5' }]}>TRENDING</Text>
        </View>
      </View>
      <Text style={[styles.sectionSub, { color: colors.neutral[500] }]}>
        {i18n.language === 'lg' ? 'Ebintu ebikyamukyamu by\'oteekeddwa okumanya' : 'Latest health claims verified by experts'}
      </Text>

      <View style={styles.feedFilterContainer}>
        <TouchableOpacity onPress={() => setFeedFilter('ALL')} style={[styles.feedFilterBtn, feedFilter === 'ALL' && styles.feedFilterBtnActive]}>
          <Text style={[styles.feedFilterText, feedFilter === 'ALL' && styles.feedFilterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFeedFilter('FACT')} style={[styles.feedFilterBtn, feedFilter === 'FACT' && styles.feedFilterBtnActive]}>
          <Text style={[styles.feedFilterText, feedFilter === 'FACT' && styles.feedFilterTextActive]}>Facts</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFeedFilter('MYTH')} style={[styles.feedFilterBtn, feedFilter === 'MYTH' && styles.feedFilterBtnActive]}>
          <Text style={[styles.feedFilterText, feedFilter === 'MYTH' && styles.feedFilterTextActive]}>Myths</Text>
        </TouchableOpacity>
      </View>

      {filteredFeed.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => handleMythPress(item.id)}
          style={[styles.mythCard, {
            backgroundColor: item.verdict === 'MYTH' ? '#FFF5F5' : item.verdict === 'FACT' ? '#F0FFF4' : '#FFFFF0',
            borderColor: item.verdict === 'MYTH' ? colors.danger[500] : item.verdict === 'FACT' ? '#38A169' : colors.warning[500],
          }]}
        >
          <View style={styles.mythCardHeader}>
            <View style={[styles.mythVerdictBadge, { backgroundColor: item.verdict === 'MYTH' ? colors.danger[100] : item.verdict === 'FACT' ? '#C6F6D5' : colors.warning[100] }]}>
              <Icon source={item.icon} size={14} color={item.verdict === 'MYTH' ? colors.danger[900] : item.verdict === 'FACT' ? '#276749' : colors.warning[900]} />
              <Text style={[styles.mythVerdictText, { color: item.verdict === 'MYTH' ? colors.danger[900] : item.verdict === 'FACT' ? '#276749' : colors.warning[900] }]}>
                {item.verdict}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => handleSpeak(item)}>
                <Icon source={speakingId === item.id ? "volume-high" : "volume-medium"} size={22} color={speakingId === item.id ? colors.primary[600] : colors.neutral[500]} />
              </TouchableOpacity>
              <Text style={[styles.mythTime, { color: colors.neutral[400] }]}>{item.time}</Text>
            </View>
          </View>
          <Text style={[styles.mythClaim, { color: colors.neutral[900] }]}>
            {i18n.language === 'lg' ? item.claim_lg || item.claim : item.claim}
          </Text>
          <Text style={{ fontSize: 14, color: colors.neutral[700], lineHeight: 22, marginBottom: 12 }}>
            {i18n.language === 'lg' ? item.explanation_lg || item.explanation : item.explanation}
          </Text>
          <View style={styles.mythFooter}>
            <Text style={[styles.mythSource, { color: colors.neutral[500] }]}>Source: {item.source}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  mythSection: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  feedFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  feedFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  feedFilterBtnActive: {
    backgroundColor: '#805AD5',
  },
  feedFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  feedFilterTextActive: {
    color: '#FFF',
  },
  mythCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  mythCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mythVerdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mythVerdictText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mythTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  mythClaim: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  mythFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mythSource: {
    fontSize: 12,
    fontWeight: '700',
  },
});
