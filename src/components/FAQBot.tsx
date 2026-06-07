// src/components/FAQBot.tsx
// Full-featured Interactive FAQ Bot with Uganda health knowledge, search & category filters
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows } from '../theme';

// ── Comprehensive Uganda-specific FAQ data ────────────────────────────────────

interface FAQItem {
  id: string;
  question: string;
  question_lg: string;
  answer: string;
  answer_lg: string;
  category: string;
  tags: string[];
}

const FAQ_DATA: FAQItem[] = [
  // ── MALARIA ──────────────────────────────────────────────────────────────────
  {
    id: 'm1',
    category: 'malaria',
    question: 'What are the signs of malaria?',
    question_lg: 'Ebibonero by\'omusujja gwa malaria bye byeki?',
    answer: 'Malaria symptoms include high fever, headache, chills, sweating, and body aches appearing 7–14 days after a mosquito bite. In children, vomiting, rapid breathing, and lethargy are common. If you suspect malaria, get an RDT test at your nearest health facility — do NOT take Coartem without a confirmed test.',
    answer_lg: 'Ebibonero by\'omusujja gwa malaria bigattako omusujja omukutte, omutwe, okukankana, okubira obukutakulire, n\'obulumi bw\'omubiri bigabika ennaku 7–14 oluvannyuma lw\'okusitibwa ensiri. Eri abaana, okusesema, okussa amangu, n\'obunafu bitera okubaawo. Bw\'olowooza malaria, nonya ekikeberero kya RDT mu ddwaliro eryookumpi — TOKWATA Coartem wabulawo okukeberebwa.',
    tags: ['fever', 'malaria', 'symptoms', 'mosquito'],
  },
  {
    id: 'm2',
    category: 'malaria',
    question: 'How do I prevent malaria in Uganda?',
    question_lg: 'Nziyiza otya omusujja gwa malaria mu Uganda?',
    answer: 'The best prevention methods are: (1) Sleep under a Long-Lasting Insecticide-Treated Net (LLIN) every night — free at MoH clinics; (2) Drain stagnant water around your home; (3) Spray indoor insecticide; (4) Seek treatment within 24 hours of fever onset. Pregnant women should take malaria prophylaxis (SP/Fansidar) at ANC visits.',
    answer_lg: 'Enkola ez\'okusingawo okuziyiza: (1) Sula mu katimba k\'ensiri akalimu eddagala buli kiro — bwereere mu malwaliro ga MoH; (2) Komerera amazzi agatagenda ngeri zonna wansi wa nju yo; (3) Saasaanya eddagala mu nnyumba; (4) Noonya obujjanjabi mu ssaawa 24 omusujja gutandikiddwa. Abazaana abalina olubuto basaanidde kukola okuziyiza malaria (SP/Fansidar) ku okukyalira kwa ANC.',
    tags: ['malaria', 'prevention', 'LLIN', 'net', 'mosquito'],
  },
  {
    id: 'm3',
    category: 'malaria',
    question: 'What is Coartem and how should I take it?',
    question_lg: 'Coartem kiki era nkikozesa otya?',
    answer: 'Coartem (Artemether/Lumefantrine) is Uganda\'s first-line treatment for uncomplicated malaria. It is free at all MoH facilities. Adults take 4 tablets at hours 0, 8, 24, 36, 48, and 60 (6 doses total over 3 days). ALWAYS take it with food or fatty milk. NEVER stop early even if you feel better — incomplete courses cause drug resistance.',
    answer_lg: 'Coartem (Artemether/Lumefantrine) ye eddagala ery\'osooka eri malaria etenkanika mu Uganda. Lya bwereere mu malwaliro gonna ga MoH. Abakuligwa bakwata empeke 4 ku ssaawa 0, 8, 24, 36, 48, n\'60 (enkingo 6 kyamala mu nnaku 3). Ikira buli lwe n\'ebyakulya oba amata ag\'amafuta. TOLEKA KUJJANJABA AMANGU wadde olowooza ojjula — okujjanjaba okutakamilidde kukyusa endwadde okulemwa eddagala.',
    tags: ['coartem', 'malaria', 'treatment', 'medicine', 'artemether'],
  },

  // ── HIV / AIDS ────────────────────────────────────────────────────────────────
  {
    id: 'h1',
    category: 'hiv',
    question: 'How is HIV transmitted?',
    question_lg: 'HIV esindikibwa otya?',
    answer: 'HIV is transmitted through: (1) Unprotected sexual intercourse with an infected person; (2) Sharing needles or syringes; (3) Mother-to-child during pregnancy, birth, or breastfeeding; (4) Transfusion of infected blood. HIV is NOT spread through hugging, sharing food, mosquito bites, or casual contact.',
    answer_lg: 'HIV esindikibwa bwa: (1) Okufumbirwana wabulawo kukuumibwa n\'omulwadde; (2) Okugabana empiso oba essiringi; (3) Omuzaana okutuuka ku mwana mu lubuto, okuzaala, oba kuyonsa; (4) Okuyimbwa omusaayi ow\'omulwadde. HIV ESETAASINDIKIBWA bw\'okumanyumizibwamu, okugabana emmere, okusitibwa ensiri, oba okukwatanamu.',
    tags: ['hiv', 'transmission', 'aids', 'prevention'],
  },
  {
    id: 'h2',
    category: 'hiv',
    question: 'What is the treatment for HIV in Uganda?',
    question_lg: 'Okujjanjaba kwa HIV mu Uganda kuli otya?',
    answer: 'Uganda uses a TLD regimen (Tenofovir + Lamivudine + Dolutegravir) — one tablet once daily — as the standard first-line treatment. ARVs are FREE at all government health facilities. Starting treatment early keeps the viral load undetectable, meaning you cannot transmit the virus (Undetectable = Untransmittable, U=U). Never miss a dose.',
    answer_lg: 'Uganda ikozesa TLD (Tenofovir + Lamivudine + Dolutegravir) — empeke emu emu buli lunaku — ng\'enkola ey\'omugenzi ery\'osooka. ARVs za bwereere mu malwaliro gonna ga gavumenti. Okutandika okujjanjaba amangu kukuuma viral load nga etakirabikira, kitegeeza tosobola kusindika endwadde (Etakirabikira = Etasindikika, U=U). Togoba doosi.',
    tags: ['hiv', 'arv', 'treatment', 'TLD', 'antiretroviral'],
  },
  {
    id: 'h3',
    category: 'hiv',
    question: 'Where can I get an HIV test in Uganda?',
    question_lg: 'Nzikeberebwa otya HIV mu Uganda?',
    answer: 'HIV testing is FREE and confidential at all government health centres (HC II, HC III, HC IV), hospitals, and many community outreach sites. You can also test at home using self-test kits available at pharmacies. It is recommended that everyone aged 15–64 years knows their HIV status. Couples are encouraged to test together.',
    answer_lg: 'Okukeberebwa HIV kya bwereere era n\'ekyama mu malwaliro gonna ga gavumenti (HC II, HC III, HC IV), n\'ebisangiro by\'ebitundu eby\'abantu abagimu. Osobola era okuzikeberebwa mu nnyumba okozesa ebikeberero by\'ekowulira mu ssukali. Buli muntu w\'emyaka 15–64 asaanidde okumanya endwadde ye ya HIV. Ababana bakirizibwa okukeberebwa wamu.',
    tags: ['hiv', 'testing', 'test', 'VCT', 'confidential'],
  },

  // ── MATERNAL HEALTH ──────────────────────────────────────────────────────────
  {
    id: 'ma1',
    category: 'maternal',
    question: 'How many ANC visits should a pregnant woman make?',
    question_lg: 'Omuzaana alina olubuto akyalire ANC emirundi emeka?',
    answer: 'Uganda follows the WHO ANC model of at least 8 contacts: before 12 weeks, at 20 weeks, 26 weeks, 30 weeks, 34 weeks, 36 weeks, 38 weeks, and 40 weeks. ANC services include blood tests, malaria prophylaxis (IPTp), iron/folate supplements, tetanus vaccination, birth planning, and danger sign education. ANC is FREE at all government facilities.',
    answer_lg: 'Uganda ikwata enkola ya WHO ya ANC ey\'okukyalira 8 okunoonya: nga tonnatuuka ku wiiki 12, ku wiiki 20, 26, 30, 34, 36, 38, n\'40. Ebirowoozo bya ANC bigattako okukebera omusaayi, okuziyiza malaria (IPTp), iron/folate, enkingo ya tetanus, entegeka y\'okuzaala, n\'okuyigiriza obubonero bw\'akabenje. ANC ya bwereere mu malwaliro gonna ga gavumenti.',
    tags: ['anc', 'pregnancy', 'prenatal', 'maternal', 'antenatal'],
  },
  {
    id: 'ma2',
    category: 'maternal',
    question: 'What are danger signs during pregnancy?',
    question_lg: 'Ebibonero by\'akabenje mu lubuto bye byeki?',
    answer: 'Go to the hospital IMMEDIATELY if you experience: severe headache with blurred vision (pre-eclampsia), heavy vaginal bleeding, severe abdominal pain, high fever, swelling of the face/hands/feet, reduced or absent baby movements, or labour starting before 37 weeks. These are emergencies.',
    answer_lg: 'Genda mu ddwaliro AMANGU bw\'olaba: omutwe omubi n\'okulaba ekifu (pre-eclampsia), omusaayi omunngi mu bukyala, obulumi obw\'amaanyi bw\'olubuto, omusujja omukutte, okuwimba kw\'amaaso/emikono/ebigere, omwana okusala okugendera oba okulekera, oba ebikankano nga tonnatuuka ku wiiki 37. Bino byonna bya bya katali.',
    tags: ['pregnancy', 'danger signs', 'maternal', 'emergency', 'preeclampsia'],
  },
  {
    id: 'ma3',
    category: 'maternal',
    question: 'Should I breastfeed if I am HIV positive?',
    question_lg: 'Nyonse amabeere ndi HIV positive?',
    answer: 'YES — in Uganda\'s context, MoH recommends HIV-positive mothers exclusively breastfeed for 6 months while taking ARVs. ARVs reduce HIV transmission in breast milk to near zero. Do NOT mix-feed (give both breast milk and other foods/fluids). After 6 months, introduce complementary foods while continuing to breastfeed up to 12–24 months.',
    answer_lg: 'EE — mu nsibuko ya Uganda, MoH ekubiriza abazaana abalina HIV+ kuyonsa amabeere gokka emyezi 6 nga bakwata ARVs. ARVs ezikendeeza okusindika HIV mu mabeere okusukka ku ziro. TOYONSA n\'ebyakulya ebirala. Oluvannyuma lwa emyezi 6, yingiza emmere ezongereza nga weyunge kuyonsa okutuuka emyezi 12–24.',
    tags: ['hiv', 'breastfeeding', 'maternal', 'positive'],
  },

  // ── IMMUNIZATION ─────────────────────────────────────────────────────────────
  {
    id: 'i1',
    category: 'immunization',
    question: 'What vaccines does my baby need in the first year?',
    question_lg: 'Omwana wange wetaagisa enkingo ki mu mwaka ogw\'osooka?',
    answer: 'In Uganda\'s UNEPI schedule: At birth — BCG + OPV0. At 6 weeks — Pentavalent 1 + PCV1 + Rotavirus 1 + OPV1. At 10 weeks — Pentavalent 2 + PCV2 + OPV2. At 14 weeks — Pentavalent 3 + PCV3 + OPV3 + IPV1. At 9 months — Measles-Rubella 1 + Yellow Fever. All vaccines are FREE at government health facilities. Bring your child\'s health card.',
    answer_lg: 'Mu pulogalamu ya UNEPI ya Uganda: Bw\'okuzaalibwa — BCG + OPV0. Wiiki 6 — Pentavalent 1 + PCV1 + Rotavirus 1 + OPV1. Wiiki 10 — Pentavalent 2 + PCV2 + OPV2. Wiiki 14 — Pentavalent 3 + PCV3 + OPV3 + IPV1. Emyezi 9 — Mumpumpu-Rubella 1 + Omusujja gwa Kyenvu. Enkingo zonna za bwereere mu malwaliro ga gavumenti. Leeta kaadi y\'obulamu kw\'omwana.',
    tags: ['vaccines', 'immunization', 'baby', 'UNEPI', 'child', 'vaccinations'],
  },
  {
    id: 'i2',
    category: 'immunization',
    question: 'Do vaccines cause autism?',
    question_lg: 'Enkingo zeeyongereza autism?',
    answer: 'NO — this is a dangerous myth. Multiple large scientific studies involving millions of children worldwide have found absolutely no link between vaccines and autism. The original paper claiming this link was fraudulent and has been fully retracted. Vaccines save millions of lives every year and are among the safest medical interventions ever developed.',
    answer_lg: 'NEDDA — kino kya bukyamu obuzibu. Okunoonyereza okugyezewemu okw\'amaanyi okugattako abaana ab\'obukadde bw\'amazima bya bya entono mu nsi yone tekuzuula nkumanyi yonna wakati w\'enkingo ne autism. Omwandiike ogw\'osooka ogwogera bino gwali gwa bwampe era gulaabiddwa mu nsozi. Enkingo zitereka obulamu obugezageza buli mwaka era ziri mu nkola z\'obujjanjabi ez\'okusingawo okubuuka.',
    tags: ['vaccine', 'autism', 'myth', 'safety', 'immunization'],
  },
  {
    id: 'i3',
    category: 'immunization',
    question: 'Is the HPV vaccine safe for girls in Uganda?',
    question_lg: 'Enkingo ya HPV bulungi eri abakazi mu Uganda?',
    answer: 'YES — the HPV vaccine (given to girls aged 10 in Uganda\'s school vaccination programme) is extremely safe and prevents over 90% of cervical cancers. Uganda has one of the highest cervical cancer death rates in the world. Two doses given 6 months apart provide long-term protection. Side effects are mild — slight arm soreness and brief dizziness.',
    answer_lg: 'EE — enkingo ya HPV (eriwebwa abakazi ab\'emyaka 10 mu pulogalamu y\'enkingo mu masomero ga Uganda) ya bulamu ennyo era iziyiza okusukka 90% by\'endwadde y\'olukoba lw\'omunda. Uganda erimu ku maggwanga ag\'okusingawo abafu ab\'endwadde y\'olukoba lw\'omunda. Doosi 2 eziwebwa emyezi 6 wakati zeeta okukuumibwa kw\'akaseera kakaravu. Ebizibu bitera okuba ebinini — obulumi obutono bw\'omukono era okulengera akaseera katono.',
    tags: ['hpv', 'vaccine', 'cervical cancer', 'girls', 'adolescent'],
  },

  // ── SANITATION & HYGIENE ─────────────────────────────────────────────────────
  {
    id: 's1',
    category: 'sanitation',
    question: 'How do I prevent cholera and typhoid?',
    question_lg: 'Nziyiza otya cholera ne typhoid?',
    answer: 'Prevent cholera and typhoid by: (1) Boiling or treating ALL drinking water (use aqua tabs or boil for 1 full minute); (2) Washing hands with soap and water before cooking, eating, and after toileting; (3) Eating only properly cooked food; (4) Using clean latrines or toilets; (5) Keeping food covered from flies. During an outbreak, seek ORS immediately if you get diarrhoea.',
    answer_lg: 'Ziyiza cholera ne typhoid bwa: (1) Kolerera oba teekerawo eddagala amazzi gonna g\'okunywa (kozesa aqua tabs oba kolerera ddakiika emu eyimye); (2) Naaba emikono n\'ekooli n\'amazzi nga tonnategeka emmere, n\'oluvannyuma lw\'okukozesa kaabuyonjo; (3) Lya ebyakulya by\'etemererwa bulungi gokka; (4) Kozesa ebyoto eby\'amazima; (5) Kuuma ebyakulya beegulidde eri ennyonyi. Mu bbanga ly\'endwadde, nonya ORS amangu bw\'okuddukana.',
    tags: ['cholera', 'typhoid', 'water', 'sanitation', 'hygiene', 'prevention'],
  },
  {
    id: 's2',
    category: 'sanitation',
    question: 'My child has diarrhoea — what should I do?',
    question_lg: 'Omwana wange adduka — nkole ki?',
    answer: 'Give Oral Rehydration Salts (ORS) immediately. Mix 1 sachet in exactly 1 litre of clean water. Give small sips frequently. Also give Zinc (20mg daily for 10 days) — this shortens and prevents future episodes. Continue breastfeeding. Take the child to a health facility immediately if: there is blood in the stool, the child cannot drink, vomiting is persistent, or symptoms last more than 3 days.',
    answer_lg: 'Wa Oral Rehydration Salts (ORS) amangu. Gatta busake emu mu liita 1 ey\'amazzi amatuufu. Wa bitonotono bulijjo. Wa era Zinc (20mg buli lunaku ennaku 10) — kino kuzimba era kuziyiza oluvannyuma. Weyunge kuyonsa. Genda mu ddwaliro amangu bw\'olaba: omusaayi mu binyiga, omwana atasobola kunywa, okusesema kukwata bulijjo, oba ebibonero bisigadde okusukka ennaku 3.',
    tags: ['diarrhoea', 'diarrhea', 'ORS', 'child', 'zinc', 'dehydration'],
  },

  // ── NUTRITION ────────────────────────────────────────────────────────────────
  {
    id: 'n1',
    category: 'nutrition',
    question: 'My child looks thin and stunted. What should I do?',
    question_lg: 'Omwana wange alabika mwene era tayonka. Nkole ki?',
    answer: 'Malnutrition (stunting, wasting) requires immediate attention. Visit your nearest health centre for a MUAC measurement. If the child has severe acute malnutrition (SAM), they will receive Ready-to-Use Therapeutic Food (RUTF) — peanut-based "plumpynut" — for free at the OPD. Continue breastfeeding, give diverse foods (eggs, beans, groundnuts, green vegetables), and deworm every 6 months.',
    answer_lg: 'Okubula emmere (okutazaala, okuteera) kwetaagisa amangu. Genda mu ddwaliro eryookumpi okusaba okugezibwa MUAC. Bw\'omwana alina okubula emmere okw\'amaanyi (SAM), anaabwezerwa emmere y\'ekolerwa ey\'obujjanjabi (RUTF) — "plumpynut" — bwereere ku OPD. Weyunge kuyonsa, wa emmere ey\'emika egyawukana (amagi, ebijanjaalo, ebinyeebwa, birime ebibisi), era nyonyola ensowera buli myezi 6.',
    tags: ['malnutrition', 'stunting', 'child', 'nutrition', 'MUAC', 'wasting'],
  },
  {
    id: 'n2',
    category: 'nutrition',
    question: 'What should I eat during pregnancy?',
    question_lg: 'Ndya ki mu bweyalina olubuto?',
    answer: 'During pregnancy eat: (1) Iron-rich foods — beans, lentils, groundnuts, liver, leafy greens; (2) Vitamin A — orange/yellow fruits, sweet potato, carrots; (3) Iodized salt for brain development; (4) Diverse protein — eggs, fish, meat, milk; (5) Take iron + folic acid tablets daily (provided free at ANC). Avoid alcohol, tobacco, and unprescribed medications completely.',
    answer_lg: 'Mu bweyalina olubuto lya: (1) Emmere ey\'obungi bwa iron — ebijanjaalo, lentils, ebinyeebwa, liwaafu, birime ebibisi; (2) Vitamin A — ebibala by\'enjuzi/enjagalabbubi, lumonde, karot; (3) Omunnyo gw\'iodine eri okuzaala obwongo; (4) Protein ey\'emika egyawukana — amagi, ebyennyanja, ennyama, amata; (5) Kwata eddagala lya iron + folic acid buli lunaku (liriwebwa bwereere ku ANC). Weetawe omwenge, sigala, n\'eddagala erinakiikirwa mu nsozi.',
    tags: ['pregnancy', 'nutrition', 'food', 'diet', 'anc', 'maternal'],
  },

  // ── COVID-19 ─────────────────────────────────────────────────────────────────
  {
    id: 'c1',
    category: 'covid',
    question: 'Is COVID-19 still a threat in Uganda?',
    question_lg: 'COVID-19 kikyali kasiitiizi mu Uganda?',
    answer: 'COVID-19 remains circulating in Uganda but at low severity levels. New sub-variants (XEC, JN.1) continue to emerge. High-risk groups — elderly, immunocompromised, pregnant women — are advised to stay up to date with COVID vaccines. Wear a mask in crowded indoor spaces, ventilate rooms, and wash hands regularly. Treatment for severe COVID is available at referral hospitals.',
    answer_lg: 'COVID-19 ekisigadde etabuka mu Uganda naye mu buzibu obutono. Endwadde empya (XEC, JN.1) zigenda zijja. Ebigere eby\'akabi — abakulugavu, abaamalwadde, abazaana abalina olubuto — balagirwa okukuuma enkingo za COVID zikutte. Yambala mask mu bifo ebigattiddwa, nzola ennyumba, era naaba emikono bulijjo. Okujjanjaba COVID omubi kuliwo mu malwaliro g\'okusiindikibwa.',
    tags: ['covid', 'covid-19', 'coronavirus', 'vaccine', 'prevention'],
  },

  // ── TB ───────────────────────────────────────────────────────────────────────
  {
    id: 't1',
    category: 'tb',
    question: 'What are the signs of tuberculosis (TB)?',
    question_lg: 'Ebibonero bya kafuba (TB) bye byeki?',
    answer: 'Signs of TB include: persistent cough lasting 2+ weeks, coughing blood, night sweats, unexplained weight loss, fever, and fatigue. TB is spread through the air when an infected person coughs or sneezes — prolonged close contact is needed for transmission. TB is curable with a free 6-month course of medicines at all government facilities. Drug-resistant TB (MDR-TB) requires longer treatment.',
    answer_lg: 'Ebibonero bya Kafuba bigattako: akakololo akakwata wiiki 2+, okukola n\'omusaayi, obukutakulire bw\'ekiro, okukendeera bugeme wabulawo nsonga, omusujja, n\'obunafu. Kafuba esindikibwa mu bbanga omulwadde bw\'akola oba akossebwa — okukwatanamu akaseera kakaravu kweetaagibwa. Kafuba ejjaangibwa n\'eddagala lya bwereere erya myezi 6 mu malwaliro gonna ga gavumenti. Kafuba eziimirira eddagala (MDR-TB) zetaagisa okujjanjaba kw\'akaseera kakaravu.',
    tags: ['tuberculosis', 'tb', 'cough', 'symptoms', 'treatment'],
  },
];

const CATEGORIES = [
  { key: 'all',         label_en: 'All Topics',  label_lg: 'Ebintu Byonna',  icon: 'help-circle' },
  { key: 'malaria',     label_en: 'Malaria',      label_lg: 'Malaria',        icon: 'shield-bug' },
  { key: 'hiv',         label_en: 'HIV/AIDS',     label_lg: 'HIV/AIDS',       icon: 'dna' },
  { key: 'maternal',    label_en: 'Maternal',     label_lg: 'Olubuto',        icon: 'baby-carriage' },
  { key: 'immunization',label_en: 'Vaccines',     label_lg: 'Enkingo',        icon: 'needle' },
  { key: 'sanitation',  label_en: 'Sanitation',   label_lg: 'Obulongoofu',    icon: 'water' },
  { key: 'nutrition',   label_en: 'Nutrition',    label_lg: 'Emmere',         icon: 'food-apple' },
  { key: 'covid',       label_en: 'COVID-19',     label_lg: 'COVID-19',       icon: 'virus-outline' },
  { key: 'tb',          label_en: 'TB',           label_lg: 'Kafuba',         icon: 'lungs' },
];

const CATEGORY_COLORS: Record<string, string> = {
  malaria: '#059669', hiv: '#7C3AED', maternal: '#EC4899',
  immunization: '#0284C7', sanitation: '#0891B2', nutrition: '#D97706',
  covid: '#B45309', tb: '#DC2626', all: '#374151',
};

// ── Component ─────────────────────────────────────────────────────────────────

const FAQBot: React.FC = () => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const isLg = i18n.language === 'lg';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const filtered = FAQ_DATA.filter(item => {
    const matchCat = category === 'all' || item.category === category;
    const q = query.toLowerCase().trim();
    if (!q) return matchCat;
    const question = isLg ? item.question_lg : item.question;
    const answer = isLg ? item.answer_lg : item.answer;
    const matchQ =
      question.toLowerCase().includes(q) ||
      answer.toLowerCase().includes(q) ||
      item.tags.some(tag => tag.includes(q));
    return matchCat && matchQ;
  });

  const handleSpeak = (item: FAQItem) => {
    const question = isLg ? item.question_lg : item.question;
    const answer = isLg ? item.answer_lg : item.answer;
    if (speakingId === item.id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    Speech.stop();
    setSpeakingId(item.id);
    Speech.speak(`${question}. ${answer}`, {
      language: isLg ? 'lg' : 'en',
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

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
          placeholder={t('faq_bot.search_placeholder')}
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
          const label = isLg ? cat.label_lg : cat.label_en;
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
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Results count ── */}
      <Text style={[styles.resultsLabel, { color: colors.neutral[500] }]}>
        {t(filtered.length === 1 ? 'faq_bot.found_count_one' : 'faq_bot.found_count_other', { count: filtered.length })}
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
              {t('faq_bot.empty_state')}
            </Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isExpanded = expanded === item.id;
            const cc = CATEGORY_COLORS[item.category] || '#374151';
            const isSpeaking = speakingId === item.id;
            const question = isLg ? item.question_lg : item.question;
            const answer = isLg ? item.answer_lg : item.answer;
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
                      {question}
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
                        {answer}
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
                            {isSpeaking ? t('faq_bot.stop') : t('faq_bot.listen')}
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
