// src/screens/VaccinationScreen.tsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows } from '../theme';
import { useResponsive, typography , rf } from '../responsive';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../components/AnimatedCard';

// ── Uganda UNEPI Vaccination Schedule Data ────────────────────────────────────

interface VaccineInfo {
  id: string;
  name: string;
  fullName: string;
  fullName_lg: string;
  age: string;
  age_lg: string;
  diseases: string[];
  diseases_lg: string[];
  route: string;
  route_lg: string;
  site: string;
  site_lg: string;
  doses: number;
  notes: string;
  notes_lg: string;
  category: 'birth' | 'infant' | 'child' | 'adolescent' | 'adult' | 'maternal';
  color: string;
  icon: string;
}

const UNEPI_SCHEDULE: VaccineInfo[] = [
  {
    id: 'bcg',
    name: 'BCG',
    fullName: 'Bacillus Calmette-Guérin',
    fullName_lg: 'Bacillus Calmette-Guérin',
    age: 'At Birth',
    age_lg: 'Bw\'okuzaalibwa',
    diseases: ['Tuberculosis (TB) – lungs, brain, spine'],
    diseases_lg: ['Kafuba (TB) – mu mawuggwe, obwongo, omugongo'],
    route: 'Intradermal',
    route_lg: 'Mu Lukoba lw\'Omubiri',
    site: 'Right upper arm',
    site_lg: 'Mukono gwa ddyo waggulu',
    doses: 1,
    notes: 'A small blister forms and heals into a scar — this is normal and expected.',
    notes_lg: 'Ekitono kitera okwetomera era kiwonya n\'ekisaasa — kino kituufu era kitegeererwa.',
    category: 'birth',
    color: '#7C3AED',
    icon: 'needle',
  },
  {
    id: 'opv0',
    name: 'OPV 0',
    fullName: 'Oral Polio Vaccine (Birth dose)',
    fullName_lg: 'Enkingo ya Polio ey\'Okunywa (Dosi y\'Okuzaalibwa)',
    age: 'At Birth',
    age_lg: 'Bw\'okuzaalibwa',
    diseases: ['Polio (Poliomyelitis) – paralysis'],
    diseases_lg: ['Polio – okusanyalala kw\'ebinyeebwa'],
    route: 'Oral (2 drops)',
    route_lg: 'Okunywa (bitono 2)',
    site: 'Mouth',
    site_lg: 'Akanwa',
    doses: 1,
    notes: 'Given at birth to protect against polio before any potential wild virus exposure.',
    notes_lg: 'Erigebwa omwana azaaliddwa okukuuma ku Polio nga tonnakkwatibwa.',
    category: 'birth',
    color: '#0284C7',
    icon: 'water-outline',
  },
  {
    id: 'penta1',
    name: 'Pentavalent 1',
    fullName: 'DTP-HepB-Hib (Pentavalent)',
    fullName_lg: 'DTP-HepB-Hib (Pentavalent)',
    age: '6 Weeks',
    age_lg: 'Wiiki 6',
    diseases: ['Diphtheria', 'Whooping Cough (Pertussis)', 'Tetanus', 'Hepatitis B', 'Meningitis (Hib)'],
    diseases_lg: ['Diphtheria', 'Akakololo (Pertussis)', 'Tetanus', 'Hepatitis B', 'Olubiri lw\'Obwongo (Hib)'],
    route: 'Intramuscular',
    route_lg: 'Mu Kiziba ky\'Omubiri',
    site: 'Left outer thigh',
    site_lg: 'Okugulu kwa kkono ebbali lya nja',
    doses: 3,
    notes: 'One of the most important childhood vaccines — protects against 5 diseases with a single injection.',
    notes_lg: 'Enkingo ey\'okusingawo ensonga eri abaana — ziyiza endwadde 5 n\'enkubo emu.',
    category: 'infant',
    color: '#DC2626',
    icon: 'shield-star',
  },
  {
    id: 'pcv1',
    name: 'PCV 1',
    fullName: 'Pneumococcal Conjugate Vaccine',
    fullName_lg: 'Enkingo ya Pneumococcal',
    age: '6 Weeks',
    age_lg: 'Wiiki 6',
    diseases: ['Pneumonia (severe)', 'Meningitis', 'Bacteraemia'],
    diseases_lg: ['Ekifuba (ekibi ennyo)', 'Olubiri lw\'Obwongo', 'Bacteraemia'],
    route: 'Intramuscular',
    route_lg: 'Mu Kiziba ky\'Omubiri',
    site: 'Right outer thigh',
    site_lg: 'Okugulu kwa ddyo ebbali lya nja',
    doses: 3,
    notes: 'Uganda has seen a dramatic reduction in child pneumonia deaths since PCV introduction.',
    notes_lg: 'Uganda eyalaba okukendeera okusingawo oku emifu gy\'abaana olw\'ekifuba okuva PCV etandiikiddwa.',
    category: 'infant',
    color: '#D97706',
    icon: 'lungs',
  },
  {
    id: 'rv1',
    name: 'Rotavirus 1',
    fullName: 'Rotavirus Vaccine (RV1)',
    fullName_lg: 'Enkingo ya Rotavirus (RV1)',
    age: '6 Weeks',
    age_lg: 'Wiiki 6',
    diseases: ['Severe Diarrhoea & Dehydration (Rotavirus)'],
    diseases_lg: ['Okuddukana okw\'amaanyi n\'okubula amazzi (Rotavirus)'],
    route: 'Oral',
    route_lg: 'Okunywa',
    site: 'Mouth',
    site_lg: 'Akanwa',
    doses: 2,
    notes: 'Rotavirus is the leading cause of fatal childhood diarrhoea in Uganda. This vaccine is life-saving.',
    notes_lg: 'Rotavirus ye nsonga enkulaakulana gy\'okufa kw\'okuddukana eri abaana mu Uganda. Enkingo eno etereka obulamu.',
    category: 'infant',
    color: '#059669',
    icon: 'stomach',
  },
  {
    id: 'opv1',
    name: 'OPV 1',
    fullName: 'Oral Polio Vaccine (1st dose)',
    fullName_lg: 'Enkingo ya Polio ey\'Okunywa (Dosi 1)',
    age: '6 Weeks',
    age_lg: 'Wiiki 6',
    diseases: ['Polio – paralysis'],
    diseases_lg: ['Polio – okusanyalala kw\'ebinyeebwa'],
    route: 'Oral (2 drops)',
    route_lg: 'Okunywa (bitono 2)',
    site: 'Mouth',
    site_lg: 'Akanwa',
    doses: 3,
    notes: 'Part of the 3-dose series to ensure full polio protection.',
    notes_lg: 'Ekitundu ky\'ensabiibwa ey\'enkingo 3 okukakasa okukuumibwa mu Polio.',
    category: 'infant',
    color: '#0284C7',
    icon: 'water-outline',
  },
  {
    id: 'penta2-pcv2-opv2',
    name: 'Pentavalent 2 + PCV 2 + OPV 2',
    fullName: 'Second dose of Pentavalent, PCV & OPV',
    fullName_lg: 'Dosi ey\'Okubiri ya Pentavalent, PCV n\'OPV',
    age: '10 Weeks',
    age_lg: 'Wiiki 10',
    diseases: ['All diseases from 6-week vaccines (booster doses)'],
    diseases_lg: ['Endwadde zonna ez\'enkingo za wiiki 6 (booster)'],
    route: 'IM + IM + Oral',
    route_lg: 'IM + IM + Okunywa',
    site: 'Both thighs + Mouth',
    site_lg: 'Amagulu gonna + Akanwa',
    doses: 1,
    notes: 'Critical booster doses — immunity is not complete until the full series is given.',
    notes_lg: 'Booster za mpera — okukuumibwa tekumalira okutuuka enkingo zonna ziriwe.',
    category: 'infant',
    color: '#7C3AED',
    icon: 'numeric-2-circle',
  },
  {
    id: 'penta3-pcv3-opv3-ipv',
    name: 'Penta 3 + PCV 3 + OPV 3 + IPV',
    fullName: 'Third doses + Inactivated Polio Vaccine',
    fullName_lg: 'Dosi ey\'Okusatu + Enkingo ya Polio ey\'Okubabirirwa',
    age: '14 Weeks',
    age_lg: 'Wiiki 14',
    diseases: ['All diseases from prior doses', 'Extra polio protection (IPV injection for stronger immunity)'],
    diseases_lg: ['Endwadde zonna ez\'enkingo eziyise', 'Okukuumibwa okweyongerako eri Polio (IPV okusobola obukuumi obukakafu)'],
    route: 'IM (×3) + Oral + IM (IPV)',
    route_lg: 'IM (×3) + Okunywa + IM (IPV)',
    site: 'Multiple sites',
    site_lg: 'Ebifo bitono',
    doses: 1,
    notes: 'IPV is added at 14 weeks to boost polio immunity alongside oral drops. This completes the primary series.',
    notes_lg: 'IPV yagattibwa ku wiiki 14 okwongereza okukuumibwa kwa Polio wamu n\'okunywa. Kino kukamala ensabiibwa y\'okusooka.',
    category: 'infant',
    color: '#B45309',
    icon: 'numeric-3-circle',
  },
  {
    id: 'mr1-yf',
    name: 'MR 1 + Yellow Fever',
    fullName: 'Measles-Rubella (1st) + Yellow Fever',
    fullName_lg: 'Mumpumpu-Rubella (1) + Omusujja gwa Kyenvu',
    age: '9 Months (~39 weeks)',
    age_lg: 'Emyezi 9 (~wiiki 39)',
    diseases: ['Measles', 'Rubella (German Measles)', 'Yellow Fever'],
    diseases_lg: ['Mumpumpu', 'Rubella', 'Omusujja gwa Kyenvu'],
    route: 'Subcutaneous',
    route_lg: 'Wansi w\'Olukoba',
    site: 'Right upper arm',
    site_lg: 'Mukono gwa ddyo waggulu',
    doses: 1,
    notes: 'Yellow fever vaccine provides lifetime protection with just one dose. MR requires a booster at 18 months.',
    notes_lg: 'Enkingo ya Omusujja gwa Kyenvu etera okukuuma obulamu bwonna n\'enkingo emu. MR wetaagisa booster ku emyezi 18.',
    category: 'child',
    color: '#F59E0B',
    icon: 'shield-sun',
  },
  {
    id: 'mr2',
    name: 'MR 2',
    fullName: 'Measles-Rubella (2nd dose)',
    fullName_lg: 'Mumpumpu-Rubella (Dosi 2)',
    age: '18 Months (~78 weeks)',
    age_lg: 'Emyezi 18 (~wiiki 78)',
    diseases: ['Measles', 'Rubella'],
    diseases_lg: ['Mumpumpu', 'Rubella'],
    route: 'Subcutaneous',
    route_lg: 'Wansi w\'Olukoba',
    site: 'Right upper arm',
    site_lg: 'Mukono gwa ddyo waggulu',
    doses: 1,
    notes: 'The 2nd MR dose ensures full immunity for children who did not respond to the first dose (5–10% of children).',
    notes_lg: 'Dosi ey\'okubiri ya MR ekakasa okukuumibwa okujjudde eri abaana abaataaddangirira ku dosi ey\'osooka.',
    category: 'child',
    color: '#DC2626',
    icon: 'shield-check',
  },
  {
    id: 'hpv',
    name: 'HPV Vaccine',
    fullName: 'Human Papillomavirus Vaccine (2-dose)',
    fullName_lg: 'Enkingo ya HPV (Dosi 2)',
    age: 'Girls 10 years (2-dose, 6 months apart)',
    age_lg: 'Abakazi b\'emyaka 10 (dosi 2, emyezi 6 wakati)',
    diseases: ['Cervical Cancer', 'Genital Warts', 'Anal Cancer'],
    diseases_lg: ['Endwadde y\'Olukoba lw\'Omunda', 'Ebitabagiro by\'Ebyama', 'Endwadde y\'Amafuta'],
    route: 'Intramuscular',
    route_lg: 'Mu Kiziba ky\'Omubiri',
    site: 'Upper arm',
    site_lg: 'Mukono waggulu',
    doses: 2,
    notes: 'Uganda has one of the highest rates of cervical cancer in the world. HPV vaccination can prevent over 90% of cases. Free for all girls aged 10 via the school vaccination programme.',
    notes_lg: 'Uganda erimu ku maggwanga ag\'okusingawo abalwadde b\'endwadde y\'olukoba lw\'omunda. Enkingo ya HPV esobola okuziyiza okusinga 90% by\'endwadde. Bwereere eri abakazi bonna ab\'emyaka 10.',
    category: 'adolescent',
    color: '#EC4899',
    icon: 'gender-female',
  },
  {
    id: 'tt-maternal',
    name: 'Tetanus Toxoid (TT)',
    fullName: 'Tetanus Toxoid for Pregnant Women',
    fullName_lg: 'Enkingo ya Tetanus eri Abazaana Abalina Olubuto',
    age: 'Pregnant women – at 1st ANC visit',
    age_lg: 'Abazaana abalina olubuto – ku okukyalira kwa ANC okw\'osooka',
    diseases: ['Maternal Tetanus', 'Neonatal Tetanus'],
    diseases_lg: ['Tetanus ery\'Omuzaana', 'Tetanus ery\'Omwana Omuzaalibwa'],
    route: 'Intramuscular',
    route_lg: 'Mu Kiziba ky\'Omubiri',
    site: 'Upper arm',
    site_lg: 'Mukono waggulu',
    doses: 5,
    notes: 'TT2+ vaccination is essential to protect both mother and newborn. 5-dose series provides lifetime protection. Every pregnant woman must receive TT during ANC.',
    notes_lg: 'Okugembwa TT2+ kubeera mpera okukuuma omuzaana n\'omwana omuzaalibwa. Enkingo 5 etera okukuuma obulamu bwonna. Omuzaana buli omu alina olubuto agembwe TT mu ANC.',
    category: 'maternal',
    color: '#10B981',
    icon: 'baby-carriage',
  },
];

const CAMPAIGN_ALERTS = [
  {
    id: '1',
    title: 'National HPV Vaccination Drive',
    title_lg: 'Enkola y\'Enkingo ya HPV ey\'Eggwanga',
    detail: 'School-based HPV vaccination for girls in Primary 5 (age ~10). Contact your nearest HC III for out-of-school girls.',
    detail_lg: 'Enkingo ya HPV mu masomero eri abakazi ba P.5 (emyaka ~10). Tuukirira HC III eyookumpi eri abakazi abatali mu masomero.',
    date: 'Ongoing — June 2026',
    date_lg: 'Eyakaeyaka — Juuni 2026',
    color: '#EC4899',
    icon: 'alert-circle-outline',
  },
  {
    id: '2',
    title: 'Measles Catch-up Campaign — Karamoja',
    title_lg: 'Enkola y\'Okuddamu Okugema Mumpumpu — Karamoja',
    detail: 'Reactive vaccination campaign for children 6 months–10 years in Moroto, Nakapiripirit & Amudat districts.',
    detail_lg: 'Enkola ey\'enkingo ey\'okukuuma eri abaana ab\'emyezi 6 okutuuka emyaka 10 mu disitulikiti z\'e Moroto, Nakapiripirit ne Amudat.',
    date: 'May–July 2026',
    date_lg: 'Gwengule–Mukwano 2026',
    color: '#DC2626',
    icon: 'broadcast',
  },
  {
    id: '3',
    title: 'Annual Polio NIDs (National Immunization Days)',
    title_lg: 'Ennaku z\'Enkingo ey\'Eggwanga (NIDs) za Polio',
    detail: 'Nationwide supplemental OPV campaigns targeting all children under 5 years, regardless of vaccination status.',
    detail_lg: 'Enkola z\'enkingo eza OPV z\'eggwanga zikwata abaana bonna abali wansi w\'emyaka 5, nga bakwatiddwa enkingo oba neddda.',
    date: 'August 2026 (planned)',
    date_lg: 'Agusito 2026 (entegeka)',
    color: '#0284C7',
    icon: 'calendar-star',
  },
];

type FilterKey = 'all' | 'birth' | 'infant' | 'child' | 'adolescent' | 'maternal';

// ── Component ─────────────────────────────────────────────────────────────────

export default function VaccinationScreen() {
  const { colors, mode } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp, width, height } = useResponsive();
  const isLg = i18n.language === 'lg';

  const [filter, setFilter] = useState<FilterKey>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCampaigns, setShowCampaigns] = useState(true);

  const filtered = filter === 'all' ? UNEPI_SCHEDULE : UNEPI_SCHEDULE.filter(v => v.category === filter);

  const CATEGORY_CONFIG = {
    birth:      { label: isLg ? 'Bw\'okuzaalibwa' : 'At Birth', color: '#7C3AED', bg: '#F3E8FF', icon: 'baby-face-outline' },
    infant:     { label: isLg ? 'Baana (wiiki 6–14)' : 'Infants (6–14 weeks)', color: '#0284C7', bg: '#E0F2FE', icon: 'baby' },
    child:      { label: isLg ? 'Abaana (emyezi 9–18)' : 'Children (9–18 months)', color: '#D97706', bg: '#FEF3C7', icon: 'human-child' },
    adolescent: { label: isLg ? 'Abavubuka (Abakazi emyaka 10)' : 'Adolescents (Girls 10yr)', color: '#EC4899', bg: '#FCE7F3', icon: 'human-female' },
    adult:      { label: isLg ? 'Abakuligwa' : 'Adults', color: '#059669', bg: '#D1FAE5', icon: 'human' },
    maternal:   { label: isLg ? 'Abazaana Abalina Olubuto' : 'Pregnant Women', color: '#10B981', bg: '#D1FAE5', icon: 'human-pregnant' },
  };

  const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
    { key: 'all',        label: isLg ? 'Pulogalamu Yonna' : 'Full Schedule',  icon: 'calendar-check' },
    { key: 'birth',      label: CATEGORY_CONFIG.birth.label,      icon: 'baby-face-outline' },
    { key: 'infant',     label: CATEGORY_CONFIG.infant.label,     icon: 'baby' },
    { key: 'child',      label: CATEGORY_CONFIG.child.label,      icon: 'human-child' },
    { key: 'adolescent', label: CATEGORY_CONFIG.adolescent.label, icon: 'human-female' },
    { key: 'maternal',   label: CATEGORY_CONFIG.maternal.label,   icon: 'human-pregnant' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={isDesktop ? styles.desktopPad : undefined}>

        {/* ── Hero Header ── */}
        <AnimatedCard delay={0} style={styles.heroCard}>
          <LinearGradient colors={['#065F46', '#059669', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
            <View style={styles.heroTop}>
              <View>
                <View style={styles.heroBadge}>
                  <Icon source="needle" size={12} color="#6EE7B7" />
                  <Text style={styles.heroBadgeText}>UNEPI — UGANDA IMMUNIZATION PROGRAMME</Text>
                </View>
                <Text style={styles.heroTitle}>{t('vaccination_schedule.title')}</Text>
                <Text style={styles.heroSub}>{t('vaccination_schedule.subtitle')}</Text>
              </View>
              <Icon source="shield-plus" size={56} color="rgba(255,255,255,0.15)" />
            </View>

            {/* Stats Row */}
            <View style={styles.heroStats}>
              {[
                { val: UNEPI_SCHEDULE.length.toString(), label: t('vaccination_schedule.events') },
                { val: '17', label: t('vaccination_schedule.antigens') },
                { val: isLg ? 'BWEREERE' : 'FREE', label: t('vaccination_schedule.free_clinics') },
              ].map(s => (
                <View key={s.label} style={styles.heroStatCell}>
                  <Text style={styles.heroStatVal}>{s.val}</Text>
                  <Text style={styles.heroStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </AnimatedCard>

        {/* ── Upcoming Campaigns ── */}
        <AnimatedCard delay={60} style={[styles.campaignCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.campaignHeader} onPress={() => setShowCampaigns(v => !v)}>
            <View style={styles.campaignHeaderLeft}>
              <Icon source="broadcast" size={18} color="#DC2626" />
              <Text style={[styles.campaignTitle, { color: colors.neutral[900] }]}>{t('vaccination_schedule.upcoming_campaigns')}</Text>
              <View style={styles.liveDot} />
            </View>
            <Icon source={showCampaigns ? 'chevron-up' : 'chevron-down'} size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
          {showCampaigns && (
            <View style={styles.campaignList}>
              {CAMPAIGN_ALERTS.map(c => (
                <View key={c.id} style={[styles.campaignItem, { borderLeftColor: c.color }]}>
                  <View style={styles.campaignItemHeader}>
                    <Icon source={c.icon} size={14} color={c.color} />
                    <Text style={[styles.campaignItemTitle, { color: colors.neutral[900] }]}>
                      {isLg ? c.title_lg : c.title}
                    </Text>
                  </View>
                  <Text style={[styles.campaignItemDetail, { color: colors.neutral[600] }]}>
                    {isLg ? c.detail_lg : c.detail}
                  </Text>
                  <Text style={[styles.campaignItemDate, { color: c.color }]}>
                    {isLg ? c.date_lg : c.date}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </AnimatedCard>

        {/* ── Filter Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => {
            const isActive = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  { backgroundColor: isActive ? colors.primary[900] : colors.surface },
                  !isActive && { borderWidth: 1, borderColor: colors.neutral[200] },
                ]}
                onPress={() => setFilter(f.key)}
              >
                <Icon source={f.icon} size={14} color={isActive ? '#FFF' : colors.neutral[600]} />
                <Text style={[styles.filterChipText, { color: isActive ? '#FFF' : colors.neutral[700] }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Vaccine Cards ── */}
        {filtered.map((vaccine, idx) => {
          const catCfg = CATEGORY_CONFIG[vaccine.category];
          const isExpanded = expanded === vaccine.id;
          return (
            <AnimatedCard key={vaccine.id} delay={idx * 50 + 100} style={[styles.vaccCard, { backgroundColor: colors.surface }]}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded(isExpanded ? null : vaccine.id)}>
                {/* Colour accent bar */}
                <View style={[styles.vaccAccentBar, { backgroundColor: vaccine.color }]} />
                <View style={styles.vaccBody}>
                  {/* Top row */}
                  <View style={styles.vaccTopRow}>
                    <View style={[styles.vaccIconBox, { backgroundColor: catCfg.bg }]}>
                      <Icon source={vaccine.icon} size={22} color={vaccine.color} />
                    </View>
                    <View style={styles.vaccHeaderText}>
                      <Text style={[styles.vaccName, { color: colors.neutral[900] }]}>{vaccine.name}</Text>
                      <Text style={[styles.vaccFullName, { color: colors.neutral[500] }]} numberOfLines={1}>
                        {isLg ? vaccine.fullName_lg : vaccine.fullName}
                      </Text>
                    </View>
                    <View style={[styles.ageBadge, { backgroundColor: catCfg.bg }]}>
                      <Text style={[styles.ageBadgeText, { color: catCfg.color }]}>
                        {isLg ? vaccine.age_lg : vaccine.age}
                      </Text>
                    </View>
                  </View>

                  {/* Diseases row */}
                  <View style={styles.diseaseRow}>
                    {(isLg ? vaccine.diseases_lg : vaccine.diseases).slice(0, isExpanded ? undefined : 2).map((d, i) => (
                      <View key={i} style={styles.diseaseChip}>
                        <Icon source="shield-check-outline" size={11} color={vaccine.color} />
                        <Text style={[styles.diseaseText, { color: colors.neutral[700] }]}>{d}</Text>
                      </View>
                    ))}
                    {!isExpanded && vaccine.diseases.length > 2 && (
                      <Text style={[styles.moreDiseasesText, { color: vaccine.color }]}>
                        {t('vaccination_schedule.more_diseases', { count: vaccine.diseases.length - 2 })}
                      </Text>
                    )}
                  </View>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <View style={[styles.expandedBox, { backgroundColor: mode === 'light' ? '#F9FAFB' : colors.neutral[100] }]}>
                      <VaccDetailRow
                        icon="needle"
                        label={t('vaccination_schedule.route')}
                        value={isLg ? vaccine.route_lg : vaccine.route}
                      />
                      <VaccDetailRow
                        icon="map-marker-outline"
                        label={t('vaccination_schedule.site')}
                        value={isLg ? vaccine.site_lg : vaccine.site}
                      />
                      <VaccDetailRow
                        icon="counter"
                        label={t('vaccination_schedule.doses')}
                        value={t(vaccine.doses === 1 ? 'vaccination_schedule.dose_count_one' : 'vaccination_schedule.dose_count_other', { count: vaccine.doses })}
                      />
                      <View style={[styles.vaccNote, { backgroundColor: vaccine.color + '15' }]}>
                        <Icon source="lightbulb-outline" size={14} color={vaccine.color} />
                        <Text style={[styles.vaccNoteText, { color: colors.neutral[700] }]}>
                          {isLg ? vaccine.notes_lg : vaccine.notes}
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity style={styles.toggleBtn} onPress={() => setExpanded(isExpanded ? null : vaccine.id)}>
                    <Text style={[styles.toggleBtnText, { color: vaccine.color }]}>
                      {isExpanded
                        ? (isLg ? 'Laga akatono ▲' : 'Show less ▲')
                        : (isLg ? 'Laba ebikwata ▼' : 'View details ▼')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </AnimatedCard>
          );
        })}

        {/* ── Footer tip ── */}
        <AnimatedCard delay={200} style={[styles.footerTip, { backgroundColor: colors.surface }]}>
          <LinearGradient colors={['#065F46', '#047857']} style={styles.footerTipGradient}>
            <Icon source="hospital-building" size={24} color="rgba(255,255,255,0.6)" />
            <Text style={styles.footerTipText}>{t('vaccination_schedule.free_charge_note')}</Text>
          </LinearGradient>
        </AnimatedCard>

        <View style={{ height: 80 }} />
      </View>
    </ScrollView>
  );
}

// ── Sub-component: Detail Row ─────────────────────────────────────────────────

function VaccDetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={rowStyles.row}>
      <Icon source={icon} size={14} color={colors.neutral[500]} />
      <Text style={[rowStyles.label, { color: colors.neutral[500] }]}>{label}:</Text>
      <Text style={[rowStyles.value, { color: colors.neutral[800] }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  value: { fontSize: 12, fontWeight: '600', flex: 1 },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  desktopPad: { maxWidth: 860, alignSelf: 'center', width: '100%' },

  // Hero
  heroCard: { borderRadius: radii.xl, overflow: 'hidden', marginBottom: spacing.md, ...shadows.md },
  heroGradient: { padding: spacing.lg },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  heroBadgeText: { color: '#6EE7B7', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFF', fontSize: rf(17), fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 4, maxWidth: 260 },
  heroStats: { flexDirection: 'row', gap: spacing.sm },
  heroStatCell: {
    flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.md, paddingVertical: 10,
  },
  heroStatVal: { color: '#FFF', fontSize: rf(17), fontWeight: '900' },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', marginTop: 2 },

  // Campaigns
  campaignCard: { borderRadius: radii.xl, marginBottom: spacing.md, ...shadows.sm, overflow: 'hidden' },
  campaignHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  campaignHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  campaignTitle: { fontSize: 16, fontWeight: '800' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DC2626' },
  campaignList: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  campaignItem: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 4 },
  campaignItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  campaignItemTitle: { fontSize: 14, fontWeight: '800', flex: 1 },
  campaignItemDetail: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  campaignItemDate: { fontSize: 11, fontWeight: '700' },

  // Filters
  filterScroll: { marginBottom: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.full,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },

  // Vaccine Cards
  vaccCard: { borderRadius: radii.xl, marginBottom: spacing.md, overflow: 'hidden', ...shadows.sm },
  vaccAccentBar: { height: 4 },
  vaccBody: { padding: spacing.md },
  vaccTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  vaccIconBox: { width: 46, height: 46, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  vaccHeaderText: { flex: 1 },
  vaccName: { fontSize: 15, fontWeight: '900' },
  vaccFullName: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  ageBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.full, alignItems: 'center' },
  ageBadgeText: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
  diseaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  diseaseChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full },
  diseaseText: { fontSize: 11, fontWeight: '600' },
  moreDiseasesText: { fontSize: 11, fontWeight: '700', alignSelf: 'center' },
  expandedBox: { borderRadius: radii.md, padding: spacing.sm, marginBottom: 8 },
  vaccNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: spacing.sm, borderRadius: radii.sm, marginTop: 6 },
  vaccNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  toggleBtn: { paddingTop: 4 },
  toggleBtnText: { fontSize: 12, fontWeight: '700' },

  // Footer
  footerTip: { borderRadius: radii.xl, overflow: 'hidden', ...shadows.sm, marginTop: spacing.sm },
  footerTipGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md },
  footerTipText: { flex: 1, color: '#FFF', fontSize: 13, lineHeight: 20, fontWeight: '600' },
});
