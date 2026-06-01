// src/components/FAQBot.tsx
// Full-featured Interactive FAQ Bot with Uganda health knowledge, search & category filters
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import * as Speech from 'expo-speech';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows } from '../theme';

// ── Comprehensive Uganda-specific FAQ data ────────────────────────────────────

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const FAQ_DATA: FAQItem[] = [
  // ── MALARIA ──────────────────────────────────────────────────────────────────
  {
    id: 'm1',
    category: 'malaria',
    question: 'What are the signs of malaria?',
    answer: 'Malaria symptoms include high fever, headache, chills, sweating, and body aches appearing 7–14 days after a mosquito bite. In children, vomiting, rapid breathing, and lethargy are common. If you suspect malaria, get an RDT test at your nearest health facility — do NOT take Coartem without a confirmed test.',
    tags: ['fever', 'malaria', 'symptoms', 'mosquito'],
  },
  {
    id: 'm2',
    category: 'malaria',
    question: 'How do I prevent malaria in Uganda?',
    answer: 'The best prevention methods are: (1) Sleep under a Long-Lasting Insecticide-Treated Net (LLIN) every night — free at MoH clinics; (2) Drain stagnant water around your home; (3) Spray indoor insecticide; (4) Seek treatment within 24 hours of fever onset. Pregnant women should take malaria prophylaxis (SP/Fansidar) at ANC visits.',
    tags: ['malaria', 'prevention', 'LLIN', 'net', 'mosquito'],
  },
  {
    id: 'm3',
    category: 'malaria',
    question: 'What is Coartem and how should I take it?',
    answer: 'Coartem (Artemether/Lumefantrine) is Uganda\'s first-line treatment for uncomplicated malaria. It is free at all MoH facilities. Adults take 4 tablets at hours 0, 8, 24, 36, 48, and 60 (6 doses total over 3 days). ALWAYS take it with food or fatty milk. NEVER stop early even if you feel better — incomplete courses cause drug resistance.',
    tags: ['coartem', 'malaria', 'treatment', 'medicine', 'artemether'],
  },

  // ── HIV / AIDS ────────────────────────────────────────────────────────────────
  {
    id: 'h1',
    category: 'hiv',
    question: 'How is HIV transmitted?',
    answer: 'HIV is transmitted through: (1) Unprotected sexual intercourse with an infected person; (2) Sharing needles or syringes; (3) Mother-to-child during pregnancy, birth, or breastfeeding; (4) Transfusion of infected blood. HIV is NOT spread through hugging, sharing food, mosquito bites, or casual contact.',
    tags: ['hiv', 'transmission', 'aids', 'prevention'],
  },
  {
    id: 'h2',
    category: 'hiv',
    question: 'What is the treatment for HIV in Uganda?',
    answer: 'Uganda uses a TLD regimen (Tenofovir + Lamivudine + Dolutegravir) — one tablet once daily — as the standard first-line treatment. ARVs are FREE at all government health facilities. Starting treatment early keeps the viral load undetectable, meaning you cannot transmit the virus (Undetectable = Untransmittable, U=U). Never miss a dose.',
    tags: ['hiv', 'arv', 'treatment', 'TLD', 'antiretroviral'],
  },
  {
    id: 'h3',
    category: 'hiv',
    question: 'Where can I get an HIV test in Uganda?',
    answer: 'HIV testing is FREE and confidential at all government health centres (HC II, HC III, HC IV), hospitals, and many community outreach sites. You can also test at home using self-test kits available at pharmacies. It is recommended that everyone aged 15–64 years knows their HIV status. Couples are encouraged to test together.',
    tags: ['hiv', 'testing', 'test', 'VCT', 'confidential'],
  },

  // ── MATERNAL HEALTH ──────────────────────────────────────────────────────────
  {
    id: 'ma1',
    category: 'maternal',
    question: 'How many ANC visits should a pregnant woman make?',
    answer: 'Uganda follows the WHO ANC model of at least 8 contacts: before 12 weeks, at 20 weeks, 26 weeks, 30 weeks, 34 weeks, 36 weeks, 38 weeks, and 40 weeks. ANC services include blood tests, malaria prophylaxis (IPTp), iron/folate supplements, tetanus vaccination, birth planning, and danger sign education. ANC is FREE at all government facilities.',
    tags: ['anc', 'pregnancy', 'prenatal', 'maternal', 'antenatal'],
  },
  {
    id: 'ma2',
    category: 'maternal',
    question: 'What are danger signs during pregnancy?',
    answer: 'Go to the hospital IMMEDIATELY if you experience: severe headache with blurred vision (pre-eclampsia), heavy vaginal bleeding, severe abdominal pain, high fever, swelling of the face/hands/feet, reduced or absent baby movements, or labour starting before 37 weeks. These are emergencies.',
    tags: ['pregnancy', 'danger signs', 'maternal', 'emergency', 'preeclampsia'],
  },
  {
    id: 'ma3',
    category: 'maternal',
    question: 'Should I breastfeed if I am HIV positive?',
    answer: 'YES — in Uganda\'s context, MoH recommends HIV-positive mothers exclusively breastfeed for 6 months while taking ARVs. ARVs reduce HIV transmission in breast milk to near zero. Do NOT mix-feed (give both breast milk and other foods/fluids). After 6 months, introduce complementary foods while continuing to breastfeed up to 12–24 months.',
    tags: ['hiv', 'breastfeeding', 'maternal', 'positive'],
  },

  // ── IMMUNIZATION ─────────────────────────────────────────────────────────────
  {
    id: 'i1',
    category: 'immunization',
    question: 'What vaccines does my baby need in the first year?',
    answer: 'In Uganda\'s UNEPI schedule: At birth — BCG + OPV0. At 6 weeks — Pentavalent 1 + PCV1 + Rotavirus 1 + OPV1. At 10 weeks — Pentavalent 2 + PCV2 + OPV2. At 14 weeks — Pentavalent 3 + PCV3 + OPV3 + IPV1. At 9 months — Measles-Rubella 1 + Yellow Fever. All vaccines are FREE at government health facilities. Bring your child\'s health card.',
    tags: ['vaccines', 'immunization', 'baby', 'UNEPI', 'child', 'vaccinations'],
  },
  {
    id: 'i2',
    category: 'immunization',
    question: 'Do vaccines cause autism?',
    answer: 'NO — this is a dangerous myth. Multiple large scientific studies involving millions of children worldwide have found absolutely no link between vaccines and autism. The original paper claiming this link was fraudulent and has been fully retracted. Vaccines save millions of lives every year and are among the safest medical interventions ever developed.',
    tags: ['vaccine', 'autism', 'myth', 'safety', 'immunization'],
  },
  {
    id: 'i3',
    category: 'immunization',
    question: 'Is the HPV vaccine safe for girls in Uganda?',
    answer: 'YES — the HPV vaccine (given to girls aged 10 in Uganda\'s school vaccination programme) is extremely safe and prevents over 90% of cervical cancers. Uganda has one of the highest cervical cancer death rates in the world. Two doses given 6 months apart provide long-term protection. Side effects are mild — slight arm soreness and brief dizziness.',
    tags: ['hpv', 'vaccine', 'cervical cancer', 'girls', 'adolescent'],
  },

  // ── SANITATION & HYGIENE ─────────────────────────────────────────────────────
  {
    id: 's1',
    category: 'sanitation',
    question: 'How do I prevent cholera and typhoid?',
    answer: 'Prevent cholera and typhoid by: (1) Boiling or treating ALL drinking water (use aqua tabs or boil for 1 full minute); (2) Washing hands with soap and water before cooking, eating, and after toileting; (3) Eating only properly cooked food; (4) Using clean latrines or toilets; (5) Keeping food covered from flies. During an outbreak, seek ORS immediately if you get diarrhoea.',
    tags: ['cholera', 'typhoid', 'water', 'sanitation', 'hygiene', 'prevention'],
  },
  {
    id: 's2',
    category: 'sanitation',
    question: 'My child has diarrhoea — what should I do?',
    answer: 'Give Oral Rehydration Salts (ORS) immediately. Mix 1 sachet in exactly 1 litre of clean water. Give small sips frequently. Also give Zinc (20mg daily for 10 days) — this shortens and prevents future episodes. Continue breastfeeding. Take the child to a health facility immediately if: there is blood in the stool, the child cannot drink, vomiting is persistent, or symptoms last more than 3 days.',
    tags: ['diarrhoea', 'diarrhea', 'ORS', 'child', 'zinc', 'dehydration'],
  },

  // ── NUTRITION ────────────────────────────────────────────────────────────────
  {
    id: 'n1',
    category: 'nutrition',
    question: 'My child looks thin and stunted. What should I do?',
    answer: 'Malnutrition (stunting, wasting) requires immediate attention. Visit your nearest health centre for a MUAC measurement. If the child has severe acute malnutrition (SAM), they will receive Ready-to-Use Therapeutic Food (RUTF) — peanut-based "plumpynut" — for free at the OPD. Continue breastfeeding, give diverse foods (eggs, beans, groundnuts, green vegetables), and deworm every 6 months.',
    tags: ['malnutrition', 'stunting', 'child', 'nutrition', 'MUAC', 'wasting'],
  },
  {
    id: 'n2',
    category: 'nutrition',
    question: 'What should I eat during pregnancy?',
    answer: 'During pregnancy eat: (1) Iron-rich foods — beans, lentils, groundnuts, liver, leafy greens; (2) Vitamin A — orange/yellow fruits, sweet potato, carrots; (3) Iodized salt for brain development; (4) Diverse protein — eggs, fish, meat, milk; (5) Take iron + folic acid tablets daily (provided free at ANC). Avoid alcohol, tobacco, and unprescribed medications completely.',
    tags: ['pregnancy', 'nutrition', 'food', 'diet', 'anc', 'maternal'],
  },

  // ── COVID-19 ─────────────────────────────────────────────────────────────────
  {
    id: 'c1',
    category: 'covid',
    question: 'Is COVID-19 still a threat in Uganda?',
    answer: 'COVID-19 remains circulating in Uganda but at low severity levels. New sub-variants (XEC, JN.1) continue to emerge. High-risk groups — elderly, immunocompromised, pregnant women — are advised to stay up to date with COVID vaccines. Wear a mask in crowded indoor spaces, ventilate rooms, and wash hands regularly. Treatment for severe COVID is available at referral hospitals.',
    tags: ['covid', 'covid-19', 'coronavirus', 'vaccine', 'prevention'],
  },

  // ── TB ───────────────────────────────────────────────────────────────────────
  {
    id: 't1',
    category: 'tb',
    question: 'What are the signs of tuberculosis (TB)?',
    answer: 'Signs of TB include: persistent cough lasting 2+ weeks, coughing blood, night sweats, unexplained weight loss, fever, and fatigue. TB is spread through the air when an infected person coughs or sneezes — prolonged close contact is needed for transmission. TB is curable with a free 6-month course of medicines at all government facilities. Drug-resistant TB (MDR-TB) requires longer treatment.',
    tags: ['tuberculosis', 'tb', 'cough', 'symptoms', 'treatment'],
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Topics', icon: 'help-circle' },
  { key: 'malaria', label: 'Malaria', icon: 'shield-bug' },
  { key: 'hiv', label: 'HIV/AIDS', icon: 'dna' },
  { key: 'maternal', label: 'Maternal', icon: 'baby-carriage' },
  { key: 'immunization', label: 'Vaccines', icon: 'needle' },
  { key: 'sanitation', label: 'Sanitation', icon: 'water' },
  { key: 'nutrition', label: 'Nutrition', icon: 'food-apple' },
  { key: 'covid', label: 'COVID-19', icon: 'virus-outline' },
  { key: 'tb', label: 'TB', icon: 'lungs' },
];

const CATEGORY_COLORS: Record<string, string> = {
  malaria: '#059669', hiv: '#7C3AED', maternal: '#EC4899',
  immunization: '#0284C7', sanitation: '#0891B2', nutrition: '#D97706',
  covid: '#B45309', tb: '#DC2626', all: '#374151',
};

// ── Component ─────────────────────────────────────────────────────────────────

const FAQBot: React.FC = () => {
  const { colors, mode } = useAppTheme();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const filtered = FAQ_DATA.filter(item => {
    const matchCat = category === 'all' || item.category === category;
    const q = query.toLowerCase().trim();
    if (!q) return matchCat;
    const matchQ =
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.tags.some(t => t.includes(q));
    return matchCat && matchQ;
  });

  const handleSpeak = (item: FAQItem) => {
    if (speakingId === item.id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    Speech.stop();
    setSpeakingId(item.id);
    Speech.speak(`${item.question}. ${item.answer}`, {
      language: 'en',
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  const catColor = CATEGORY_COLORS[category] || '#374151';

  return (
    <KeyboardAvoidingView
      style={[styles.wrapper, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Search Bar ── */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Icon source="magnify" size={20} color={colors.neutral[400]} />
        <TextInput
          style={[styles.searchInput, { color: colors.neutral[900] }]}
          placeholder="Search health questions..."
          placeholderTextColor={colors.neutral[400]}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Icon source="close-circle" size={18} color={colors.neutral[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category Filter ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catRow}
      >
        {CATEGORIES.map(cat => {
          const isActive = category === cat.key;
          const cc = CATEGORY_COLORS[cat.key];
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.catChip,
                { backgroundColor: isActive ? cc : colors.surface },
                !isActive && { borderWidth: 1, borderColor: colors.neutral[200] },
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <Icon source={cat.icon} size={13} color={isActive ? '#FFF' : colors.neutral[600]} />
              <Text style={[styles.catChipText, { color: isActive ? '#FFF' : colors.neutral[700] }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Results count ── */}
      <Text style={[styles.resultsLabel, { color: colors.neutral[500] }]}>
        {filtered.length} question{filtered.length !== 1 ? 's' : ''} found
      </Text>

      {/* ── FAQ List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon source="help-circle-outline" size={56} color={colors.neutral[300]} />
            <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>
              No questions match your search.{'\n'}Try different keywords.
            </Text>
          </View>
        ) : (
          filtered.map((item, idx) => {
            const isExpanded = expanded === item.id;
            const cc = CATEGORY_COLORS[item.category] || '#374151';
            const isSpeaking = speakingId === item.id;
            return (
              <View
                key={item.id}
                style={[
                  styles.faqCard,
                  { backgroundColor: colors.surface },
                  isExpanded && { borderColor: cc, borderWidth: 1.5 },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setExpanded(isExpanded ? null : item.id)}
                >
                  <View style={styles.faqHeader}>
                    {/* Category dot */}
                    <View style={[styles.catDot, { backgroundColor: cc }]} />
                    <Text style={[styles.faqQuestion, { color: colors.neutral[900] }]} numberOfLines={isExpanded ? undefined : 2}>
                      {item.question}
                    </Text>
                    <Icon
                      source={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.neutral[400]}
                    />
                  </View>

                  {isExpanded && (
                    <View style={[styles.faqAnswerBox, { borderTopColor: colors.neutral[100] }]}>
                      <Text style={[styles.faqAnswer, { color: colors.neutral[700] }]}>
                        {item.answer}
                      </Text>

                      {/* Tags + speak row */}
                      <View style={styles.faqFooter}>
                        <View style={styles.tagsRow}>
                          {item.tags.slice(0, 3).map(tag => (
                            <View key={tag} style={[styles.tag, { backgroundColor: cc + '18' }]}>
                              <Text style={[styles.tagText, { color: cc }]}>#{tag}</Text>
                            </View>
                          ))}
                        </View>
                        <TouchableOpacity
                          style={[styles.speakBtn, { backgroundColor: isSpeaking ? cc : cc + '18' }]}
                          onPress={() => handleSpeak(item)}
                        >
                          <Icon
                            source={isSpeaking ? 'volume-high' : 'volume-medium'}
                            size={16}
                            color={isSpeaking ? '#FFF' : cc}
                          />
                          <Text style={[styles.speakBtnText, { color: isSpeaking ? '#FFF' : cc }]}>
                            {isSpeaking ? 'Stop' : 'Listen'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FAQBot;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { flex: 1 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    padding: spacing.md, borderRadius: radii.xl, ...shadows.sm,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },

  catScroll: { marginTop: spacing.sm },
  catRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingRight: spacing.lg },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.full,
  },
  catChipText: { fontSize: 12, fontWeight: '700' },

  resultsLabel: { fontSize: 12, fontWeight: '600', marginHorizontal: spacing.md, marginTop: spacing.sm, marginBottom: 4 },

  listContent: { paddingHorizontal: spacing.md, paddingTop: 4 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 24 },

  faqCard: {
    borderRadius: radii.xl, marginBottom: spacing.sm,
    overflow: 'hidden', ...shadows.sm,
    borderWidth: 0,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: 10 },
  catDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  faqAnswerBox: { padding: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1 },
  faqAnswer: { fontSize: 14, lineHeight: 22, marginBottom: spacing.sm },

  faqFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full },
  tagText: { fontSize: 10, fontWeight: '700' },
  speakBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.full },
  speakBtnText: { fontSize: 11, fontWeight: '700' },
});
