// src/screens/DrugInfoScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../components/AnimatedCard';
import { saveDrugInfo, getAllDrugs, DrugInfo } from '../db/drugCache';

// ── Uganda Essential Medicines List (MOH-aligned) ─────────────────────────────

interface DrugEntry extends DrugInfo {
  category: string;
  dosage: string;
  sideEffects: string;
  contraindications: string;
  availability: 'Free at MoH' | 'NMS Supplied' | 'Available at Pharmacies';
  icon: string;
}

const SEED_DRUGS: DrugEntry[] = [
  {
    id: 1,
    name: 'Coartem (Artemether/Lumefantrine)',
    category: 'antimalarial',
    description: 'First-line treatment for uncomplicated Plasmodium falciparum malaria. A highly effective artemisinin-based combination therapy (ACT) provided free through Uganda MoH.',
    safetyInfo: 'Complete the full 3-day course (6 doses) even if you feel better. Take with food or fatty milk to improve absorption. Do NOT crush tablets for children without guidance.',
    dosage: 'Adults: 4 tablets at 0, 8, 24, 36, 48, 60 hours. Children: dosed by weight.',
    sideEffects: 'Headache, dizziness, nausea, vomiting, loss of appetite, sleep disturbance.',
    contraindications: 'First trimester pregnancy, severe malaria (use IV artesunate instead), hypersensitivity to artemisinin.',
    availability: 'Free at MoH',
    icon: 'shield-bug',
  },
  {
    id: 2,
    name: 'Paracetamol (Acetaminophen) 500mg',
    category: 'analgesic',
    description: 'Most commonly used analgesic and antipyretic in Uganda. Reduces fever and relieves mild-to-moderate pain including headache, toothache, and body aches.',
    safetyInfo: 'Do NOT exceed 4g (8 tablets) in 24 hours. Avoid alcohol. DANGEROUS in overdose — causes liver failure. Never give adult doses to children.',
    dosage: 'Adults: 500–1000mg every 4–6 hours. Children: 15mg/kg every 6 hours.',
    sideEffects: 'Rarely causes side effects at recommended doses. Rash in sensitive individuals.',
    contraindications: 'Severe liver disease, chronic alcohol use. Caution in renal impairment.',
    availability: 'Free at MoH',
    icon: 'pill',
  },
  {
    id: 3,
    name: 'Amoxicillin 250mg / 500mg',
    category: 'antibiotic',
    description: 'A broad-spectrum penicillin-type antibiotic. First-line for respiratory tract infections, urinary tract infections, otitis media, and skin infections in Uganda.',
    safetyInfo: 'Always complete the full course (5–7 days) to prevent antibiotic resistance. Do NOT share with others. Store below 25°C.',
    dosage: 'Adults: 500mg 3x daily. Children: 25mg/kg/day in 3 divided doses. Severe infections: 500–875mg 3x daily.',
    sideEffects: 'Diarrhoea, nausea, skin rash. Severe: anaphylaxis (seek help immediately if rash/breathing difficulty).',
    contraindications: 'Penicillin allergy (use erythromycin or azithromycin instead), infectious mononucleosis (can cause rash).',
    availability: 'Free at MoH',
    icon: 'bacteria-outline',
  },
  {
    id: 4,
    name: 'ORS (Oral Rehydration Salts)',
    category: 'rehydration',
    description: 'Life-saving WHO-formulated solution for preventing and treating dehydration from diarrhoea and vomiting, especially in children under 5. ORS reduces child diarrhoea mortality by up to 93%.',
    safetyInfo: 'Mix one sachet in exactly 1 litre of clean or boiled water. Do NOT add more sachets to less water — this is dangerous. Prepare fresh every 24 hours.',
    dosage: 'Children <2 years: 50–100ml after each loose stool. Children 2–10 years: 100–200ml. Adults: as much as needed.',
    sideEffects: 'Nausea if given too fast. Give in small sips.',
    contraindications: 'Severely dehydrated patients unable to drink (use IV fluids). Intestinal obstruction.',
    availability: 'Free at MoH',
    icon: 'water',
  },
  {
    id: 5,
    name: 'Cotrimoxazole (Trimethoprim/Sulfamethoxazole)',
    category: 'antibiotic',
    description: 'Essential medicine for HIV/AIDS prophylaxis and treatment of opportunistic infections including PCP pneumonia, toxoplasmosis, and bacterial infections in Uganda.',
    safetyInfo: 'HIV+ patients should take daily prophylaxis as prescribed by clinician. Drink plenty of water to prevent kidney stones. Report any rash immediately.',
    dosage: 'Adults prophylaxis: 960mg (2 tabs) daily. Treatment: varies by infection — follow clinician guidance.',
    sideEffects: 'Rash, nausea, vomiting, photosensitivity. Rare: Stevens-Johnson syndrome (seek emergency care for widespread rash).',
    contraindications: 'Sulfonamide allergy, megaloblastic anaemia, severe renal/hepatic impairment, third trimester pregnancy.',
    availability: 'Free at MoH',
    icon: 'shield-half-full',
  },
  {
    id: 6,
    name: 'Metformin 500mg / 850mg',
    category: 'diabetes',
    description: 'First-line oral medication for Type 2 Diabetes Mellitus. Lowers blood glucose without causing hypoglycaemia. Improves insulin sensitivity and is safe for long-term use.',
    safetyInfo: 'Take with or after meals to reduce stomach upset. Do NOT stop without clinician advice. Avoid alcohol. Temporarily stop before CT scans with contrast dye.',
    dosage: 'Initial: 500mg twice daily with meals. Increase gradually to max 2000–2550mg/day.',
    sideEffects: 'Nausea, diarrhoea, stomach upset (usually improves after 2–3 weeks). Very rare: lactic acidosis.',
    contraindications: 'eGFR <30, heart failure, liver disease, alcohol misuse, iodine contrast procedures.',
    availability: 'Available at Pharmacies',
    icon: 'diabetes',
  },
  {
    id: 7,
    name: 'Amlodipine 5mg / 10mg',
    category: 'cardiovascular',
    description: 'Calcium channel blocker used to manage hypertension (high blood pressure) and stable angina. Prevents heart attacks and strokes when taken consistently.',
    safetyInfo: 'Take at the same time daily. Do NOT stop suddenly. Blood pressure may drop when standing (rise slowly). Grapefruit juice can increase drug levels.',
    dosage: 'Initial: 5mg once daily. May increase to 10mg once daily after 7–14 days.',
    sideEffects: 'Ankle swelling (oedema), headache, flushing, dizziness, fatigue.',
    contraindications: 'Severe hypotension, cardiogenic shock, unstable angina (without nitrates), allergy to dihydropyridines.',
    availability: 'NMS Supplied',
    icon: 'heart-pulse',
  },
  {
    id: 8,
    name: 'Ferrous Sulphate + Folic Acid',
    category: 'maternal',
    description: 'Iron and folate supplementation for pregnant women and women of reproductive age. Prevents iron-deficiency anaemia and neural tube defects in newborns.',
    safetyInfo: 'Take on an empty stomach or with vitamin C (orange juice) for best absorption. Avoid taking with tea, coffee, or dairy (reduces absorption). Stools will turn black — this is normal.',
    dosage: 'Pregnant women: 1 tablet daily throughout pregnancy and 3 months postpartum.',
    sideEffects: 'Constipation, nausea, black stools, stomach cramps. Take with food if GI upset is severe.',
    contraindications: 'Iron overload conditions (haemochromatosis), haemolytic anaemia.',
    availability: 'Free at MoH',
    icon: 'baby-carriage',
  },
  {
    id: 9,
    name: 'Tenofovir/Lamivudine/Dolutegravir (TLD)',
    category: 'hiv',
    description: 'Preferred first-line antiretroviral therapy (ART) regimen for adults and adolescents living with HIV in Uganda, as per MoH 2023 guidelines. A once-daily fixed-dose combination.',
    safetyInfo: 'Take at the same time every day without missing doses. Missing doses causes resistance. Do NOT share with others. Report suicidal thoughts or depression to clinician.',
    dosage: 'Adults and adolescents (≥25kg): 1 tablet once daily, any time with or without food.',
    sideEffects: 'Insomnia, headache, dizziness, fatigue (usually improve after 2–4 weeks). Weight gain in some patients.',
    contraindications: 'Do NOT combine with rifampicin (use Efavirenz-based regimen for TB/HIV co-treatment). Use with caution in severe hepatic impairment.',
    availability: 'Free at MoH',
    icon: 'dna',
  },
  {
    id: 10,
    name: 'Albendazole 400mg',
    category: 'antiparasitic',
    description: 'Broad-spectrum anthelmintic used to treat intestinal worm infections (roundworm, hookworm, whipworm, pinworm). Also used for mass deworming programs in children.',
    safetyInfo: 'Chew or crush and swallow. May be taken with or without food. Treat all household members simultaneously to prevent re-infection.',
    dosage: 'Adults and children >2 years: single 400mg dose. Repeat after 2 weeks for pinworm.',
    sideEffects: 'Nausea, stomach pain, headache, dizziness (usually mild and transient).',
    contraindications: 'Pregnancy (especially first trimester), hypersensitivity to benzimidazoles, liver disease.',
    availability: 'Free at MoH',
    icon: 'bug-outline',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'pill' },
  { key: 'antimalarial', label: 'Malaria', icon: 'shield-bug' },
  { key: 'antibiotic', label: 'Antibiotic', icon: 'bacteria-outline' },
  { key: 'hiv', label: 'HIV/ARV', icon: 'dna' },
  { key: 'maternal', label: 'Maternal', icon: 'baby-carriage' },
  { key: 'analgesic', label: 'Pain Relief', icon: 'emoticon-happy-outline' },
  { key: 'rehydration', label: 'ORS', icon: 'water' },
  { key: 'diabetes', label: 'Diabetes', icon: 'diabetes' },
  { key: 'cardiovascular', label: 'Heart', icon: 'heart-pulse' },
  { key: 'antiparasitic', label: 'Deworm', icon: 'bug-outline' },
];

const AVAILABILITY_CONFIG = {
  'Free at MoH': { color: '#065F46', bg: '#D1FAE5', icon: 'hospital-building' },
  'NMS Supplied': { color: '#1D4ED8', bg: '#DBEAFE', icon: 'package-variant' },
  'Available at Pharmacies': { color: '#B45309', bg: '#FEF3C7', icon: 'store' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DrugInfoScreen() {
  const { colors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;

  const [drugs, setDrugs] = useState<DrugEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const loadDrugs = useCallback(async () => {
    try {
      const cached = await getAllDrugs();
      if (cached.length === 0) {
        await saveDrugInfo(SEED_DRUGS);
        setDrugs(SEED_DRUGS);
      } else {
        // Merge cached base data with our extended seed data (for extra fields)
        const merged = SEED_DRUGS.map(sd => {
          const c = cached.find(x => x.id === sd.id);
          return c ? { ...sd, name: c.name, description: c.description, safetyInfo: c.safetyInfo } : sd;
        });
        setDrugs(merged);
      }
    } catch (_) {
      setDrugs(SEED_DRUGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDrugs(); }, [loadDrugs]);

  const q = search.toLowerCase().trim();
  const filtered = drugs.filter(d => {
    const matchCat = category === 'all' || d.category === category;
    const matchQ = !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={[styles.loadingText, { color: colors.neutral[500] }]}>Loading medicines...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={isDesktop ? styles.desktopPad : undefined}>

        {/* ── Header ── */}
        <AnimatedCard delay={0} style={styles.headerCard}>
          <LinearGradient colors={['#1D4ED8', '#2563EB']} style={styles.headerGradient}>
            <View style={styles.headerRow}>
              <View>
                <View style={styles.headerBadge}>
                  <Icon source="pill" size={12} color="#BFDBFE" />
                  <Text style={styles.headerBadgeText}>UGANDA ESSENTIAL MEDICINES</Text>
                </View>
                <Text style={styles.headerTitle}>Medication Safety Lookup</Text>
                <Text style={styles.headerSub}>MOH Essential Medicines List · {drugs.length} medicines</Text>
              </View>
              <Icon source="medical-bag" size={48} color="rgba(255,255,255,0.2)" />
            </View>
          </LinearGradient>
        </AnimatedCard>

        {/* ── Search ── */}
        <AnimatedCard delay={80} style={[styles.searchCard, { backgroundColor: colors.surface }]}>
          <Icon source="magnify" size={20} color={colors.neutral[400]} />
          <TextInput
            style={[styles.searchInput, { color: colors.neutral[900] }]}
            placeholder="Search medicines, conditions..."
            placeholderTextColor={colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon source="close-circle" size={18} color={colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </AnimatedCard>

        {/* ── Category Filters ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => {
            const isActive = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.catChip,
                  { backgroundColor: isActive ? colors.primary[900] : colors.surface },
                  !isActive && { borderWidth: 1, borderColor: colors.neutral[200] },
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <Icon source={cat.icon} size={14} color={isActive ? '#FFF' : colors.neutral[600]} />
                <Text style={[styles.catChipText, { color: isActive ? '#FFF' : colors.neutral[700] }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Results Count ── */}
        <Text style={[styles.resultsCount, { color: colors.neutral[500] }]}>
          {filtered.length} {filtered.length === 1 ? 'medicine' : 'medicines'} found
        </Text>

        {/* ── Drug Cards ── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon source="pill-off" size={60} color={colors.neutral[300]} />
            <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>No medicines match your search</Text>
          </View>
        ) : (
          filtered.map((drug, idx) => {
            const avCfg = AVAILABILITY_CONFIG[drug.availability as keyof typeof AVAILABILITY_CONFIG];
            const isExpanded = expanded === drug.id;
            return (
              <AnimatedCard key={drug.id} delay={idx * 50} style={[styles.card, { backgroundColor: colors.surface }]}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded(isExpanded ? null : drug.id)}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.drugIcon, { backgroundColor: mode === 'light' ? '#EFF6FF' : colors.neutral[100] }]}>
                      <Icon source={drug.icon} size={24} color="#2563EB" />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={[styles.drugName, { color: colors.neutral[900] }]} numberOfLines={2}>{drug.name}</Text>
                      <View style={styles.badgeRow}>
                        <View style={[styles.catBadge, { backgroundColor: mode === 'light' ? '#F3F4F6' : colors.neutral[100] }]}>
                          <Text style={[styles.catBadgeText, { color: colors.neutral[600] }]}>{drug.category.toUpperCase()}</Text>
                        </View>
                        <View style={[styles.avBadge, { backgroundColor: avCfg.bg }]}>
                          <Icon source={avCfg.icon} size={10} color={avCfg.color} />
                          <Text style={[styles.avBadgeText, { color: avCfg.color }]}>{drug.availability}</Text>
                        </View>
                      </View>
                    </View>
                    <Icon source={isExpanded ? 'chevron-up' : 'chevron-down'} size={22} color={colors.neutral[400]} />
                  </View>

                  {/* Description */}
                  <Text style={[styles.drugDesc, { color: colors.neutral[600] }]} numberOfLines={isExpanded ? undefined : 2}>
                    {drug.description}
                  </Text>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* Dosage */}
                      <DetailSection icon="calculator" title="Dosage" content={drug.dosage} color="#1D4ED8" bg="#EFF6FF" textColor={colors.neutral[800]} />
                      {/* Safety */}
                      <DetailSection icon="alert-circle-outline" title="Safety Information" content={drug.safetyInfo} color="#B45309" bg="#FFFBEB" textColor={colors.neutral[800]} />
                      {/* Side Effects */}
                      <DetailSection icon="emoticon-sad-outline" title="Common Side Effects" content={drug.sideEffects} color="#DC2626" bg="#FEF2F2" textColor={colors.neutral[800]} />
                      {/* Contraindications */}
                      <DetailSection icon="cancel" title="Contraindications" content={drug.contraindications} color="#7F1D1D" bg="#FEE2E2" textColor={colors.neutral[800]} />

                      {/* Disclaimer */}
                      <View style={[styles.disclaimer, { backgroundColor: mode === 'light' ? '#F3F4F6' : colors.neutral[100] }]}>
                        <Icon source="information-outline" size={14} color={colors.neutral[500]} />
                        <Text style={[styles.disclaimerText, { color: colors.neutral[500] }]}>
                          Always consult a qualified health worker before starting or stopping any medication.
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedCard>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </View>
    </ScrollView>
  );
}

// ── Sub-component: Detail Section ─────────────────────────────────────────────
function DetailSection({
  icon, title, content, color, bg, textColor,
}: {
  icon: string; title: string; content: string; color: string; bg: string; textColor: string;
}) {
  return (
    <View style={[detailStyles.section, { backgroundColor: bg }]}>
      <View style={detailStyles.sectionHeader}>
        <Icon source={icon} size={14} color={color} />
        <Text style={[detailStyles.sectionTitle, { color }]}>{title}</Text>
      </View>
      <Text style={[detailStyles.sectionContent, { color: textColor }]}>{content}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  section: { borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  sectionContent: { fontSize: 13, lineHeight: 20 },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  desktopPad: { maxWidth: 860, alignSelf: 'center', width: '100%' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },

  headerCard: { borderRadius: radii.xl, overflow: 'hidden', marginBottom: spacing.md, ...shadows.md },
  headerGradient: { padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  headerBadgeText: { color: '#BFDBFE', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 2 },

  searchCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md,
    borderRadius: radii.xl, marginBottom: spacing.md, ...shadows.sm,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },

  catScroll: { marginBottom: spacing.sm },
  catRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.full,
  },
  catChipText: { fontSize: 12, fontWeight: '700' },

  resultsCount: { fontSize: 12, fontWeight: '600', marginBottom: spacing.sm },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },

  card: { borderRadius: radii.xl, marginBottom: spacing.md, padding: spacing.md, ...shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 10 },
  drugIcon: { width: 48, height: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  cardHeaderText: { flex: 1 },
  drugName: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.sm },
  catBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  avBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.sm },
  avBadgeText: { fontSize: 9, fontWeight: '800' },
  drugDesc: { fontSize: 13, lineHeight: 20, marginBottom: 4 },
  expandedContent: { marginTop: spacing.sm, gap: 0 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: spacing.sm, borderRadius: radii.md, marginTop: 4 },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
