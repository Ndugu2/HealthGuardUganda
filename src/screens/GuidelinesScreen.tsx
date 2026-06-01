// src/screens/GuidelinesScreen.tsx
// Uganda MoH Clinical Practice Guidelines — full interactive browser
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../components/AnimatedCard';

// ── Uganda MoH Guidelines data ─────────────────────────────────────────────────

interface GuidelineSection {
  title: string;
  points: string[];
}

interface Guideline {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bg: string;
  edition: string;
  category: string;
  sections: GuidelineSection[];
  source: string;
}

const GUIDELINES: Guideline[] = [
  {
    id: 'malaria',
    category: 'infectious',
    title: 'Malaria Management',
    subtitle: 'Diagnosis, Treatment & Prevention Protocol',
    icon: 'shield-bug',
    color: '#065F46',
    bg: '#D1FAE5',
    edition: 'MoH Uganda 2023',
    source: 'Uganda National Malaria Control Division',
    sections: [
      {
        title: '📋 Diagnosis',
        points: [
          'Always confirm malaria with Rapid Diagnostic Test (RDT) or microscopy before treatment.',
          'Do NOT treat empirically based on fever alone — this drives drug resistance.',
          'RDTs are free at all HC II and above facilities.',
          'A negative RDT in a severely ill patient should prompt malaria microscopy as a backup.',
        ],
      },
      {
        title: '💊 Treatment — Uncomplicated Malaria',
        points: [
          'First-line: Artemether-Lumefantrine (Coartem) — given twice daily for 3 days.',
          'Adult dose: 4 tablets at 0h, 8h, 24h, 36h, 48h, 60h (6 doses total).',
          'Always take with food or fatty milk to improve absorption by 2–3×.',
          'Alternative in 1st trimester pregnancy: Quinine + Clindamycin for 7 days.',
          'For children: dose by body weight (see weight band charts at health facility).',
        ],
      },
      {
        title: '🏥 Treatment — Severe Malaria',
        points: [
          'Admit patient and start IV or rectal Artesunate immediately.',
          'IV Artesunate: 2.4 mg/kg at 0, 12, and 24 hours, then daily.',
          'If no IV access: give rectal artesunate 10 mg/kg as a pre-referral dose.',
          'Treat hypoglycaemia, convulsions, and severe anaemia as concurrent emergencies.',
          'Refer to HC IV or hospital with blood transfusion capacity.',
        ],
      },
      {
        title: '🤰 Malaria in Pregnancy (IPTp)',
        points: [
          'Give Sulfadoxine-Pyrimethamine (SP/Fansidar) at each ANC visit from 13 weeks.',
          'Give at least 3 doses — ideally at 13–16, 20–24, 28–32, and 36 weeks.',
          'Never give SP in first trimester or within 4 weeks of delivery.',
          'Ensure all pregnant women sleep under LLIN every night.',
        ],
      },
      {
        title: '🛡️ Prevention',
        points: [
          'Distribute Long-Lasting Insecticide-Treated Nets (LLINs) free at all ANC/immunization visits.',
          'Indoor Residual Spraying (IRS) conducted in high-transmission districts.',
          'Community education on recognising early malaria symptoms.',
          'Encourage immediate treatment-seeking within 24 hours of fever onset.',
        ],
      },
    ],
  },
  {
    id: 'hiv',
    category: 'infectious',
    title: 'HIV/AIDS Clinical Guidelines',
    subtitle: 'ARV Initiation, Monitoring & OI Prophylaxis',
    icon: 'dna',
    color: '#6B21A8',
    bg: '#F3E8FF',
    edition: 'MoH Uganda 2023',
    source: 'Uganda AIDS Commission / MoH ART Division',
    sections: [
      {
        title: '🩺 Initiation of ART',
        points: [
          'All HIV-positive individuals should start ART on the same day as diagnosis (same-day initiation — SDI).',
          'Preferred first-line regimen: Tenofovir (TDF) + Lamivudine (3TC) + Dolutegravir (DTG) — one tablet once daily.',
          'Alternative for women of reproductive age who may become pregnant: TDF + 3TC + Efavirenz (EFV).',
          'Infants and children: weight-based dosing per national weight-band charts.',
          'ART is free at all government health facilities.',
        ],
      },
      {
        title: '📊 Monitoring on ART',
        points: [
          'Viral load testing at 6 months, 12 months, then annually if suppressed (<1,000 copies/mL).',
          'CD4 count at baseline; repeat if viral load is unsuppressed or clinically indicated.',
          'Routine follow-up at 1 month after initiation, then every 3–6 months.',
          'Screen for TB at every clinic visit using the 4-symptom screen (cough, fever, weight loss, night sweats).',
          'Monitor for drug side effects (dolutegravir: insomnia, weight gain; tenofovir: renal function).',
        ],
      },
      {
        title: '🛡️ OI Prophylaxis',
        points: [
          'Cotrimoxazole prophylaxis: start at HIV diagnosis, continue until CD4 ≥ 350 cells/µL for 6+ months.',
          'INH preventive therapy (IPT): give Isoniazid 300mg + Vitamin B6 for 6 months to prevent TB.',
          'Fluconazole prophylaxis for cryptococcal meningitis if CD4 < 100 and CrAg positive.',
        ],
      },
      {
        title: '🤰 PMTCT (Prevention of Mother-to-Child Transmission)',
        points: [
          'Test all pregnant women for HIV at 1st ANC visit and again in 3rd trimester.',
          'HIV+ mothers: start TDF+3TC+DTG immediately — same-day initiation.',
          'Breastfeed exclusively for 6 months while on ART (ARVs reduce breast milk transmission to near 0).',
          'Test infant at birth, 6 weeks, and 9 months. If positive, start infant ART immediately.',
        ],
      },
    ],
  },
  {
    id: 'maternal',
    category: 'maternal',
    title: 'Antenatal & Maternal Care',
    subtitle: 'ANC Contacts, Danger Signs & Delivery Planning',
    icon: 'baby-carriage',
    color: '#9D174D',
    bg: '#FCE7F3',
    edition: 'MoH Uganda 2022',
    source: 'Uganda Reproductive Health Division',
    sections: [
      {
        title: '📅 ANC Schedule (WHO 8-Contact Model)',
        points: [
          '1st contact: < 12 weeks — confirm pregnancy, blood tests (HIV, Hb, blood group, syphilis, urinalysis).',
          '2nd contact: 20 weeks — fetal growth assessment, malaria prophylaxis (SP 1).',
          '3rd contact: 26 weeks — review results, SP 2, birth planning, danger signs education.',
          '4th contact: 30 weeks — blood pressure check, SP 3, LLIN provision.',
          '5th–8th contacts: 34, 36, 38, 40 weeks — growth check, delivery planning, TT booster.',
          'Tetanus Toxoid (TT): 5-dose series — start at first ANC, complete series for lifetime protection.',
        ],
      },
      {
        title: '⚠️ Danger Signs — Refer Immediately',
        points: [
          'Severe headache + blurred vision or fits → pre-eclampsia/eclampsia (give MgSO4, refer urgently).',
          'Heavy vaginal bleeding at any stage of pregnancy.',
          'Severe abdominal pain not relieved by rest.',
          'Fever > 38°C (especially after 20 weeks — think malaria, UTI, chorioamnionitis).',
          'Reduced or absent fetal movements (> 28 weeks).',
          'Labour pains before 37 weeks (preterm labour).',
          'Severe swelling of face, hands, or feet with high blood pressure.',
        ],
      },
      {
        title: '💊 Routine Supplementation',
        points: [
          'Iron + Folic Acid: 1 tablet daily throughout pregnancy and 3 months postpartum. Free at ANC.',
          'Calcium supplementation in areas of high pre-eclampsia risk: 1.5g/day from 20 weeks.',
          'Vitamin A (200,000 IU): single dose postpartum (within 6 weeks of delivery).',
          'IPTp (SP/Fansidar): at each ANC visit from 13 weeks — at least 3 doses required.',
        ],
      },
      {
        title: '🏥 Delivery & Postnatal Care',
        points: [
          'All deliveries should be attended by a skilled birth attendant at a health facility.',
          'Active Management of the 3rd Stage of Labour (AMTSL): Oxytocin 10 IU IM within 1 min of delivery.',
          'Postnatal check at 24 hours, 3 days, and 6 weeks postpartum.',
          'Counsel on exclusive breastfeeding for 6 months, family planning, and newborn danger signs.',
        ],
      },
    ],
  },
  {
    id: 'imci',
    category: 'child',
    title: 'Child Health — IMCI',
    subtitle: 'Integrated Management of Childhood Illness',
    icon: 'human-child',
    color: '#1D4ED8',
    bg: '#DBEAFE',
    edition: 'MoH Uganda 2021',
    source: 'Child Health Division / WHO IMCI Uganda Adaptation',
    sections: [
      {
        title: '🚨 General Danger Signs (Refer Urgently)',
        points: [
          'Unable to drink or breastfeed.',
          'Vomiting everything.',
          'Convulsions (now or in this illness).',
          'Lethargic or unconscious.',
          'Stridor at rest (noisy breathing with in-drawing of chest).',
          'Any of these signs = IMMEDIATE REFERRAL to hospital.',
        ],
      },
      {
        title: '🌡️ Fever / Malaria Assessment',
        points: [
          'Fever ≥ 37.5°C → do RDT for malaria. Treat with Coartem if positive.',
          'Look for stiff neck → bacterial meningitis (urgent referral + pre-referral antibiotics).',
          'Rash + fever → consider measles (isolate, Vitamin A, refer if complicated).',
          'Fever > 5 days → investigate systematically (blood culture, typhoid test, urine).',
        ],
      },
      {
        title: '💨 Pneumonia Classification',
        points: [
          'Fast breathing (< 2m: ≥60/min; 2–12m: ≥50/min; 1–5yr: ≥40/min) = pneumonia → Amoxicillin 40mg/kg/day for 5 days.',
          'Chest in-drawing or SpO2 < 90% = severe pneumonia → refer + pre-referral Amoxicillin + Oxygen.',
          'Cyanosis, inability to drink, stridor = very severe → urgent referral.',
        ],
      },
      {
        title: '💧 Diarrhoea & Dehydration',
        points: [
          'Assess for dehydration: sunken eyes, skin pinch, poor drinking.',
          'Plan A (no dehydration): ORS at home, Zinc 20mg/day for 10 days, continue feeding.',
          'Plan B (some dehydration): give 75 mL/kg ORS in 4 hours at facility.',
          'Plan C (severe dehydration): IV fluids (Ringer\'s Lactate) — 100 mL/kg over 3 hours (infants) or 30 min (older children).',
          'Persistent diarrhoea (≥14 days): nutritional rehabilitation, investigate for HIV/parasites.',
        ],
      },
      {
        title: '🥗 Malnutrition',
        points: [
          'Severe Acute Malnutrition (SAM): MUAC < 11.5cm or oedema → admit for RUTF + antibiotics.',
          'Moderate Acute Malnutrition (MAM): MUAC 11.5–12.5cm → supplementary feeding programme.',
          'Micronutrient supplementation: Vitamin A every 6 months (free at UNEPI outreach).',
          'Deworm with Albendazole 400mg every 6 months from age 12 months.',
        ],
      },
    ],
  },
  {
    id: 'tb',
    category: 'infectious',
    title: 'Tuberculosis Management',
    subtitle: 'Case-finding, Treatment & Contact Tracing',
    icon: 'lungs',
    color: '#B91C1C',
    bg: '#FEE2E2',
    edition: 'MoH Uganda 2022',
    source: 'National TB & Leprosy Programme (NTLP)',
    sections: [
      {
        title: '🔍 Case Finding & Diagnosis',
        points: [
          'Screen all patients with cough ≥ 2 weeks, weight loss, night sweats, or fever.',
          'Sputum Xpert MTB/RIF for all presumptive TB cases — tests TB AND rifampicin resistance simultaneously.',
          'Chest X-ray if Xpert is negative but clinical suspicion remains high.',
          'TB culture for diagnosis when Xpert is not conclusive.',
          'DSTB (drug-sensitive TB): standard treatment. MDR-TB: refer to MDR treatment centre.',
        ],
      },
      {
        title: '💊 Treatment — Drug Sensitive TB (DSTB)',
        points: [
          'Standard regimen: 2RHZE / 4RH (6 months total).',
          '2 months intensive phase: Rifampicin + Isoniazid + Pyrazinamide + Ethambutol daily.',
          '4 months continuation phase: Rifampicin + Isoniazid daily.',
          'All TB medicines are FREE at government facilities via NTLP.',
          'Directly Observed Therapy (DOT): ideally a treatment supporter watches each dose taken.',
          'NEVER stop treatment early — incomplete courses cause drug resistance.',
        ],
      },
      {
        title: '👨‍👩‍👧 Contact Tracing',
        points: [
          'Trace all household contacts of confirmed TB cases.',
          'Children < 5 years who are household contacts: give Isoniazid Preventive Therapy (IPT) 6 months.',
          'Screen all contacts for TB symptoms — refer for Xpert if symptomatic.',
          'HIV-positive contacts: give IPT regardless of age.',
        ],
      },
      {
        title: '🤝 TB/HIV Co-infection',
        points: [
          'Test all TB patients for HIV; test all HIV patients for TB.',
          'Start TB treatment first, then initiate ART within 2–8 weeks (earlier for CD4 < 50).',
          'For TB/HIV co-infection: use Efavirenz-based ART (not Dolutegravir — rifampicin interaction).',
          'Cotrimoxazole prophylaxis for all TB/HIV co-infected patients.',
        ],
      },
    ],
  },
  {
    id: 'ncds',
    category: 'noncommunicable',
    title: 'Hypertension & Diabetes',
    subtitle: 'NCD Screening, Diagnosis & Chronic Management',
    icon: 'heart-pulse',
    color: '#0284C7',
    bg: '#E0F2FE',
    edition: 'MoH Uganda 2020',
    source: 'Uganda NCD Programme / WHO PEN Package',
    sections: [
      {
        title: '🩺 Hypertension',
        points: [
          'Diagnose hypertension if BP ≥ 140/90 mmHg on 2 separate occasions.',
          'Measure BP at every clinical encounter for all patients ≥ 18 years.',
          'Lifestyle changes first: reduce salt, increase physical activity, stop smoking, limit alcohol.',
          'Pharmacological therapy: first-line — Amlodipine 5mg OD or Hydrochlorothiazide 25mg OD.',
          'Target BP: < 130/80 mmHg in most adults; < 140/90 in elderly or high CVD risk.',
          'Review medications and adherence at every visit. BP medicines available free at HC IIIs.',
        ],
      },
      {
        title: '🍯 Diabetes Mellitus Type 2',
        points: [
          'Diagnose DM2 if fasting glucose ≥ 7.0 mmol/L or random glucose ≥ 11.1 mmol/L (2 readings).',
          'Screen all patients ≥ 45 years or overweight/obese adults for diabetes annually.',
          'First-line treatment: Metformin 500mg twice daily with meals. Titrate to 1000–2000mg/day.',
          'Add Glibenclamide or Insulin if HbA1c > 8% on Metformin alone.',
          'Monitor HbA1c every 3–6 months. Target HbA1c < 7% for most patients.',
          'Screen annually for complications: feet (neuropathy), eyes (retinopathy), kidneys (creatinine/proteinuria).',
        ],
      },
      {
        title: '📋 Integrated NCD Care',
        points: [
          'Use the WHO PEN (Package of Essential NCD Interventions) at HC III level.',
          'Risk stratification: calculate 10-year CVD risk for all hypertensive/diabetic patients.',
          'Aspirin 75mg/day for patients with established CVD or high 10-year CVD risk.',
          'Annual foot check for all diabetic patients — check pulses, sensation, skin integrity.',
          'Offer smoking cessation counselling at every visit.',
        ],
      },
    ],
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'book-open-variant' },
  { key: 'infectious', label: 'Infectious', icon: 'virus-outline' },
  { key: 'maternal', label: 'Maternal', icon: 'baby-carriage' },
  { key: 'child', label: 'Child Health', icon: 'human-child' },
  { key: 'noncommunicable', label: 'NCDs', icon: 'heart-pulse' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function GuidelinesScreen() {
  const { colors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;

  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<Guideline | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const filtered = category === 'all' ? GUIDELINES : GUIDELINES.filter(g => g.category === category);

  // ── Detail View ───────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={isDesktop ? styles.desktopPad : undefined}>
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => { setSelected(null); setExpandedSection(null); }}>
            <Icon source="arrow-left" size={20} color={selected.color} />
            <Text style={[styles.backBtnText, { color: selected.color }]}>All Guidelines</Text>
          </TouchableOpacity>

          {/* Detail header */}
          <AnimatedCard delay={0} style={styles.detailHeader}>
            <LinearGradient colors={[selected.color, selected.color + 'CC']} style={styles.detailHeaderGradient}>
              <View style={styles.detailHeaderTop}>
                <View style={[styles.detailIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Icon source={selected.icon} size={32} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{selected.title}</Text>
                  <Text style={styles.detailSubtitle}>{selected.subtitle}</Text>
                </View>
              </View>
              <View style={styles.detailMeta}>
                <View style={styles.metaChip}>
                  <Icon source="calendar-outline" size={11} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaChipText}>{selected.edition}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Icon source="office-building-outline" size={11} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaChipText}>{selected.source}</Text>
                </View>
              </View>
            </LinearGradient>
          </AnimatedCard>

          {/* Sections */}
          {selected.sections.map((section, sIdx) => {
            const isOpen = expandedSection === `${selected.id}-${sIdx}`;
            return (
              <AnimatedCard key={sIdx} delay={sIdx * 60} style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setExpandedSection(isOpen ? null : `${selected.id}-${sIdx}`)}
                >
                  <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>{section.title}</Text>
                  <Icon source={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
                {isOpen && (
                  <View style={[styles.sectionBody, { borderTopColor: colors.neutral[100] }]}>
                    {section.points.map((point, pIdx) => (
                      <View key={pIdx} style={styles.bulletRow}>
                        <View style={[styles.bullet, { backgroundColor: selected.color }]} />
                        <Text style={[styles.bulletText, { color: colors.neutral[700] }]}>{point}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </AnimatedCard>
            );
          })}

          {/* Source note */}
          <View style={[styles.sourceNote, { backgroundColor: mode === 'light' ? '#F9FAFB' : colors.surface }]}>
            <Icon source="information-outline" size={14} color={colors.neutral[400]} />
            <Text style={[styles.sourceNoteText, { color: colors.neutral[500] }]}>
              Source: {selected.source}. These are reference guidelines for trained health workers. Always apply clinical judgement. Refer where indicated.
            </Text>
          </View>

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={isDesktop ? styles.desktopPad : undefined}>

        {/* Hero */}
        <AnimatedCard delay={0} style={styles.heroCard}>
          <LinearGradient colors={['#1E3A5F', '#1D4ED8']} style={styles.heroGradient}>
            <View style={styles.heroTop}>
              <View>
                <View style={styles.heroBadge}>
                  <Icon source="book-open-variant" size={12} color="#BFDBFE" />
                  <Text style={styles.heroBadgeText}>CLINICAL REFERENCE LIBRARY</Text>
                </View>
                <Text style={styles.heroTitle}>MoH Uganda Guidelines</Text>
                <Text style={styles.heroSub}>
                  Adapted WHO clinical practice protocols for Ugandan health workers. Evidence-based. Offline-available.
                </Text>
              </View>
              <Icon source="hospital-box-outline" size={56} color="rgba(255,255,255,0.15)" />
            </View>
            <View style={styles.heroStats}>
              {[
                { val: `${GUIDELINES.length}`, label: 'Protocols' },
                { val: `${GUIDELINES.reduce((a, g) => a + g.sections.length, 0)}`, label: 'Sections' },
                { val: 'OFFLINE', label: 'Accessible' },
              ].map(s => (
                <View key={s.label} style={styles.heroStatCell}>
                  <Text style={styles.heroStatVal}>{s.val}</Text>
                  <Text style={styles.heroStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </AnimatedCard>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => {
            const isActive = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.catChip,
                  { backgroundColor: isActive ? '#1D4ED8' : colors.surface },
                  !isActive && { borderWidth: 1, borderColor: colors.neutral[200] },
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <Icon source={cat.icon} size={13} color={isActive ? '#FFF' : colors.neutral[600]} />
                <Text style={[styles.catChipText, { color: isActive ? '#FFF' : colors.neutral[700] }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Guideline Cards */}
        {filtered.map((gl, idx) => (
          <AnimatedCard key={gl.id} delay={idx * 60} style={[styles.glCard, { backgroundColor: colors.surface }]}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => { setSelected(gl); setExpandedSection(`${gl.id}-0`); }}>
              <View style={[styles.glAccent, { backgroundColor: gl.color }]} />
              <View style={styles.glBody}>
                <View style={styles.glTop}>
                  <View style={[styles.glIconBox, { backgroundColor: gl.bg }]}>
                    <Icon source={gl.icon} size={26} color={gl.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.glTitle, { color: colors.neutral[900] }]}>{gl.title}</Text>
                    <Text style={[styles.glSubtitle, { color: colors.neutral[500] }]} numberOfLines={2}>
                      {gl.subtitle}
                    </Text>
                  </View>
                  <Icon source="chevron-right" size={22} color={colors.neutral[400]} />
                </View>

                <View style={styles.glMeta}>
                  <View style={[styles.glMetaChip, { backgroundColor: gl.bg }]}>
                    <Text style={[styles.glMetaText, { color: gl.color }]}>
                      {gl.sections.length} sections
                    </Text>
                  </View>
                  <View style={[styles.glMetaChip, { backgroundColor: mode === 'light' ? '#F3F4F6' : colors.neutral[100] }]}>
                    <Icon source="calendar-outline" size={10} color={colors.neutral[500]} />
                    <Text style={[styles.glMetaText, { color: colors.neutral[500] }]}>{gl.edition}</Text>
                  </View>
                  <View style={[styles.glMetaChip, { backgroundColor: '#D1FAE5' }]}>
                    <Icon source="wifi-off" size={10} color="#065F46" />
                    <Text style={[styles.glMetaText, { color: '#065F46' }]}>Offline</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </AnimatedCard>
        ))}

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: mode === 'light' ? '#F9FAFB' : colors.surface }]}>
          <Icon source="shield-account-outline" size={16} color={colors.neutral[400]} />
          <Text style={[styles.disclaimerText, { color: colors.neutral[500] }]}>
            These guidelines are adapted for Ugandan health workers. All information is sourced from Uganda MoH and WHO clinical protocols. Clinical judgement must always be applied alongside these references.
          </Text>
        </View>

        <View style={{ height: 80 }} />
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  desktopPad: { maxWidth: 860, alignSelf: 'center', width: '100%' },

  heroCard: { borderRadius: radii.xl, overflow: 'hidden', marginBottom: spacing.md, ...shadows.md },
  heroGradient: { padding: spacing.lg },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  heroBadgeText: { color: '#BFDBFE', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 4, maxWidth: 260 },
  heroStats: { flexDirection: 'row', gap: spacing.sm },
  heroStatCell: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radii.md, paddingVertical: 10 },
  heroStatVal: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', marginTop: 2 },

  catScroll: { marginBottom: spacing.md },
  catRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.full },
  catChipText: { fontSize: 12, fontWeight: '700' },

  glCard: { borderRadius: radii.xl, marginBottom: spacing.md, overflow: 'hidden', ...shadows.sm },
  glAccent: { height: 4 },
  glBody: { padding: spacing.md },
  glTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  glIconBox: { width: 52, height: 52, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  glTitle: { fontSize: 16, fontWeight: '900' },
  glSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 2, lineHeight: 17 },
  glMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  glMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full },
  glMetaText: { fontSize: 10, fontWeight: '700' },

  disclaimer: { borderRadius: radii.xl, padding: spacing.md, flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: spacing.sm },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 17 },

  // Detail view
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backBtnText: { fontSize: 14, fontWeight: '700' },
  detailHeader: { borderRadius: radii.xl, overflow: 'hidden', marginBottom: spacing.md, ...shadows.md },
  detailHeaderGradient: { padding: spacing.lg },
  detailHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.md },
  detailIconBox: { width: 56, height: 56, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  detailSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginTop: 3, lineHeight: 17 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.full },
  metaChipText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700' },

  sectionCard: { borderRadius: radii.xl, marginBottom: spacing.sm, overflow: 'hidden', ...shadows.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '800', flex: 1 },
  sectionBody: { padding: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, gap: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { fontSize: 13, lineHeight: 21, flex: 1 },
  sourceNote: { borderRadius: radii.md, padding: spacing.md, flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: spacing.sm },
  sourceNoteText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
