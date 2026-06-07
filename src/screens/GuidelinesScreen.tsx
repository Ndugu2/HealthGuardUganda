// src/screens/GuidelinesScreen.tsx
// Uganda MoH Clinical Practice Guidelines — full interactive browser
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
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../components/AnimatedCard';

// ── Uganda MoH Guidelines data ─────────────────────────────────────────────────

interface GuidelineSection {
  title: string;
  title_lg: string;
  points: string[];
  points_lg: string[];
}

interface Guideline {
  id: string;
  title: string;
  title_lg: string;
  subtitle: string;
  subtitle_lg: string;
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
    title_lg: 'Okujjanjaba Malaria',
    subtitle: 'Diagnosis, Treatment & Prevention Protocol',
    subtitle_lg: 'Enkola y\'Okuzuula, Okujjanjaba n\'Okuziyiza',
    icon: 'shield-bug',
    color: '#065F46',
    bg: '#D1FAE5',
    edition: 'MoH Uganda 2023',
    source: 'Uganda National Malaria Control Division',
    sections: [
      {
        title: '📋 Diagnosis',
        title_lg: '📋 Okuzuula',
        points: [
          'Always confirm malaria with Rapid Diagnostic Test (RDT) or microscopy before treatment.',
          'Do NOT treat empirically based on fever alone — this drives drug resistance.',
          'RDTs are free at all HC II and above facilities.',
          'A negative RDT in a severely ill patient should prompt malaria microscopy as a backup.',
        ],
        points_lg: [
          'Kakasa malaria buli lwe na Rapid Diagnostic Test (RDT) oba microscopy nga tonnatandika kujjanjaba.',
          'TOKUJJANJABA nga olowooza malaria olw\'omusujja gokka — kino kikyuusa endwadde okulemwa eddagala.',
          'RDT za bwereere mu malwaliro gonna ag\'HC II n\'awo waggulu.',
          'RDT esalamu wansi eri omulwadde omubi nnyo yetaagisa microscopy ey\'okukakasiriza.',
        ],
      },
      {
        title: '💊 Treatment — Uncomplicated Malaria',
        title_lg: '💊 Okujjanjaba — Malaria Etenkanika',
        points: [
          'First-line: Artemether-Lumefantrine (Coartem) — given twice daily for 3 days.',
          'Adult dose: 4 tablets at 0h, 8h, 24h, 36h, 48h, 60h (6 doses total).',
          'Always take with food or fatty milk to improve absorption by 2–3×.',
          'Alternative in 1st trimester pregnancy: Quinine + Clindamycin for 7 days.',
          'For children: dose by body weight (see weight band charts at health facility).',
        ],
        points_lg: [
          'Ery\'osooka: Artemether-Lumefantrine (Coartem) — eriwebwa emirundi 2 buli lunaku ennaku 3.',
          'Doosi y\'omukuligwa: Empeke 4 ku ssaawa 0, 8, 24, 36, 48, 60 (enkingo 6 kyamala).',
          'Ikira buli lwe n\'ebyakulya oba amata ag\'amafuta okusobola okudwanya obulungi.',
          'Endala mu emyezi 3 egy\'osooka gy\'olubuto: Quinine + Clindamycin ennaku 7.',
          'Eri abaana: wekalibwa na bugeme bw\'omubiri (laba emitaala mu ddwaliro).',
        ],
      },
      {
        title: '🏥 Treatment — Severe Malaria',
        title_lg: '🏥 Okujjanjaba — Malaria Omubi',
        points: [
          'Admit patient and start IV or rectal Artesunate immediately.',
          'IV Artesunate: 2.4 mg/kg at 0, 12, and 24 hours, then daily.',
          'If no IV access: give rectal artesunate 10 mg/kg as a pre-referral dose.',
          'Treat hypoglycaemia, convulsions, and severe anaemia as concurrent emergencies.',
          'Refer to HC IV or hospital with blood transfusion capacity.',
        ],
        points_lg: [
          'Yingiza omulwadde era otandike IV oba rectal Artesunate amangu ddala.',
          'IV Artesunate: 2.4 mg/kg ku ssaawa 0, 12, n\'24, oluvannyuma buli lunaku.',
          'Bw\'atalina IV: mU rectal artesunate 10 mg/kg ng\'eddagala ery\'okutandika.',
          'Jjanjaba hypoglycaemia, okugwa kigwo, n\'anaemia ey\'amaanyi nga by\'obuyambi obutongereza.',
          'Siindika ku HC IV oba ddwaliro erina obuyinza bw\'okulimbako omusaayi.',
        ],
      },
      {
        title: '🤰 Malaria in Pregnancy (IPTp)',
        title_lg: '🤰 Malaria mu Lubuto (IPTp)',
        points: [
          'Give Sulfadoxine-Pyrimethamine (SP/Fansidar) at each ANC visit from 13 weeks.',
          'Give at least 3 doses — ideally at 13–16, 20–24, 28–32, and 36 weeks.',
          'Never give SP in first trimester or within 4 weeks of delivery.',
          'Ensure all pregnant women sleep under LLIN every night.',
        ],
        points_lg: [
          'Wa Sulfadoxine-Pyrimethamine (SP/Fansidar) buli lwe bakyala ku ANC okuva ku wiiki 13.',
          'Wa doosi 3 okunoonya — ng\'eby\'okutendereza ku wiiki 13–16, 20–24, 28–32, n\'36.',
          'TOWAAYO SP mu myezi 3 egy\'osooka oba mu wiiki 4 ezisigadde okutuuka olunaku lw\'okuzaala.',
          'Kakasa nti abazaana bonna abalina olubuto basula mu butimba buli kiro.',
        ],
      },
      {
        title: '🛡️ Prevention',
        title_lg: '🛡️ Okuziyiza',
        points: [
          'Distribute Long-Lasting Insecticide-Treated Nets (LLINs) free at all ANC/immunization visits.',
          'Indoor Residual Spraying (IRS) conducted in high-transmission districts.',
          'Community education on recognising early malaria symptoms.',
          'Encourage immediate treatment-seeking within 24 hours of fever onset.',
        ],
        points_lg: [
          'Gabanya ebitimba by\'ensiri eby\'eddagala (LLINs) bwereere ku okukyalira kona kwa ANC/enkingo.',
          'Okusaasaana mu nnyumba (IRS) kukolwa mu disitulikiti ezimu ensiri munnyo.',
          'Okuyigiriza ebitundu okuzuula obubonero bwa malaria mu kiseera ekisooka.',
          'Kubiriza abantu banoonyeze obujjanjabi mu ssaawa 24 okuva omusujja gutandika.',
        ],
      },
    ],
  },
  {
    id: 'hiv',
    category: 'infectious',
    title: 'HIV/AIDS Clinical Guidelines',
    title_lg: 'Ebiragiro bya HIV/AIDS',
    subtitle: 'ARV Initiation, Monitoring & OI Prophylaxis',
    subtitle_lg: 'Okutandika ARV, Okukuuma n\'Okuziyiza Endwadde',
    icon: 'dna',
    color: '#6B21A8',
    bg: '#F3E8FF',
    edition: 'MoH Uganda 2023',
    source: 'Uganda AIDS Commission / MoH ART Division',
    sections: [
      {
        title: '🩺 Initiation of ART',
        title_lg: '🩺 Okutandika ART',
        points: [
          'All HIV-positive individuals should start ART on the same day as diagnosis (same-day initiation — SDI).',
          'Preferred first-line regimen: Tenofovir (TDF) + Lamivudine (3TC) + Dolutegravir (DTG) — one tablet once daily.',
          'Alternative for women of reproductive age who may become pregnant: TDF + 3TC + Efavirenz (EFV).',
          'Infants and children: weight-based dosing per national weight-band charts.',
          'ART is free at all government health facilities.',
        ],
        points_lg: [
          'Abantu bonna abalina HIV basaanidde kutandika ART ku lunaku lwe lwazuuliddwa (okutandika lunaku lwe).',
          'Enkola erisinga okwagalwa ery\'osooka: Tenofovir (TDF) + Lamivudine (3TC) + Dolutegravir (DTG) — empeke emu emu buli lunaku.',
          'Endala eri abakazi ab\'emyaka gy\'okuzaala abayinza okuba n\'olubuto: TDF + 3TC + Efavirenz (EFV).',
          'Abaana: doosi wekalibwa na bugeme ng\'emitaala gy\'eggwanga bw\'egyagirwa.',
          'ART ya bwereere mu malwaliro gonna ga gavumenti.',
        ],
      },
      {
        title: '📊 Monitoring on ART',
        title_lg: '📊 Okukuuma Omulwadde ku ART',
        points: [
          'Viral load testing at 6 months, 12 months, then annually if suppressed (<1,000 copies/mL).',
          'CD4 count at baseline; repeat if viral load is unsuppressed or clinically indicated.',
          'Routine follow-up at 1 month after initiation, then every 3–6 months.',
          'Screen for TB at every clinic visit using the 4-symptom screen (cough, fever, weight loss, night sweats).',
          'Monitor for drug side effects (dolutegravir: insomnia, weight gain; tenofovir: renal function).',
        ],
        points_lg: [
          'Okukebera viral load ku myezi 6, 12, oluvannyuma buli mwaka bw\'eziyiziddwa (<1,000 copies/mL).',
          'Obungi bwa CD4 ku ntandikiro; ddamu bw\'omusaayi teguziyiziddwa oba bw\'omulwadde bw\'alagidwa.',
          'Okukuuma obutereevu buli mwezi 1 oluvannyuma lw\'okutandika, oluvannyuma buli myezi 3–6.',
          'Kebera TB buli lwe omulwadde akyalira nga okozesa ebibonero 4 (akakololo, omusujja, okukendeera bugeme, obukutakulire bw\'ekiro).',
          'Kuuma ebibonero by\'eddagala (dolutegravir: obutatuula, okweyongeza bugeme; tenofovir: enkola y\'ekkuufu).',
        ],
      },
      {
        title: '🛡️ OI Prophylaxis',
        title_lg: '🛡️ Okuziyiza Endwadde Ezijjanjabye',
        points: [
          'Cotrimoxazole prophylaxis: start at HIV diagnosis, continue until CD4 ≥ 350 cells/µL for 6+ months.',
          'INH preventive therapy (IPT): give Isoniazid 300mg + Vitamin B6 for 6 months to prevent TB.',
          'Fluconazole prophylaxis for cryptococcal meningitis if CD4 < 100 and CrAg positive.',
        ],
        points_lg: [
          'Okuziyiza na Cotrimoxazole: tandika ku kuzuulibwa HIV, weyunge okutuuka CD4 ≥ 350 cells/µL emyezi 6+.',
          'Okujjanjaba na INH (IPT): wa Isoniazid 300mg + Vitamin B6 emyezi 6 okuziyiza Kafuba.',
          'Okuziyiza na Fluconazole eri olubiri lw\'obwongo olw\'cryptococcal bw\'CD4 wansi wa 100 era CrAg kirabikira.',
        ],
      },
      {
        title: '🤰 PMTCT (Prevention of Mother-to-Child Transmission)',
        title_lg: '🤰 PMTCT (Okuziyiza Okusindika ku Mwana)',
        points: [
          'Test all pregnant women for HIV at 1st ANC visit and again in 3rd trimester.',
          'HIV+ mothers: start TDF+3TC+DTG immediately — same-day initiation.',
          'Breastfeed exclusively for 6 months while on ART (ARVs reduce breast milk transmission to near 0).',
          'Test infant at birth, 6 weeks, and 9 months. If positive, start infant ART immediately.',
        ],
        points_lg: [
          'Kebera abazaana bonna abalina olubuto HIV ku okukyalira kwa ANC okw\'osooka n\'okubiri mu myezi 7–9.',
          'Abazaana abalina HIV+: tandika TDF+3TC+DTG amangu — okutandika lunaku lwe.',
          'Yonsa amabeere gokka emyezi 6 nga ku ART (ARVs ezikendeeza okusindika mu mabeere okusukka ku ziro).',
          'Kebera omwana okuzaalibwa, wiiki 6, n\'emyezi 9. Bw\'alabika alina HIV, tandika ART ey\'omwana amangu.',
        ],
      },
    ],
  },
  {
    id: 'maternal',
    category: 'maternal',
    title: 'Antenatal & Maternal Care',
    title_lg: 'Okukeberebwa Olubuto n\'Obulamu bw\'Omuzaana',
    subtitle: 'ANC Contacts, Danger Signs & Delivery Planning',
    subtitle_lg: 'Okukyalira ANC, Obubonero bw\'Akabenje n\'Entegeka y\'Okuzaala',
    icon: 'baby-carriage',
    color: '#9D174D',
    bg: '#FCE7F3',
    edition: 'MoH Uganda 2022',
    source: 'Uganda Reproductive Health Division',
    sections: [
      {
        title: '📅 ANC Schedule (WHO 8-Contact Model)',
        title_lg: '📅 Pulogalamu ya ANC (Enkola 8 ya WHO)',
        points: [
          '1st contact: < 12 weeks — confirm pregnancy, blood tests (HIV, Hb, blood group, syphilis, urinalysis).',
          '2nd contact: 20 weeks — fetal growth assessment, malaria prophylaxis (SP 1).',
          '3rd contact: 26 weeks — review results, SP 2, birth planning, danger signs education.',
          '4th contact: 30 weeks — blood pressure check, SP 3, LLIN provision.',
          '5th–8th contacts: 34, 36, 38, 40 weeks — growth check, delivery planning, TT booster.',
          'Tetanus Toxoid (TT): 5-dose series — start at first ANC, complete series for lifetime protection.',
        ],
        points_lg: [
          'Okukyalira 1: wansi wa wiiki 12 — kakasa olubuto, okukebera omusaayi (HIV, Hb, ekika ky\'omusaayi, syphilis, enkiiko).',
          'Okukyalira 2: wiiki 20 — okukebera omukutu gw\'omwana, okuziyiza malaria (SP 1).',
          'Okukyalira 3: wiiki 26 — kebera ebizuuliddwa, SP 2, entegeka y\'okuzaala, okuyigiriza obubonero bw\'akabenje.',
          'Okukyalira 4: wiiki 30 — okukebera puleesa, SP 3, okutumya ebitimba by\'ensiri.',
          'Okukyalira 5–8: wiiki 34, 36, 38, 40 — okukebera omukutu, entegeka y\'okuzaala, TT booster.',
          'Tetanus Toxoid (TT): Enkingo 5 — tandika ku okukyalira kwa ANC okw\'osooka, maliriza okutuuka okukuumibwa obulamu bwonna.',
        ],
      },
      {
        title: '⚠️ Danger Signs — Refer Immediately',
        title_lg: '⚠️ Obubonero bw\'Akabenje — Siindika Amangu',
        points: [
          'Severe headache + blurred vision or fits → pre-eclampsia/eclampsia (give MgSO4, refer urgently).',
          'Heavy vaginal bleeding at any stage of pregnancy.',
          'Severe abdominal pain not relieved by rest.',
          'Fever > 38°C (especially after 20 weeks — think malaria, UTI, chorioamnionitis).',
          'Reduced or absent fetal movements (> 28 weeks).',
          'Labour pains before 37 weeks (preterm labour).',
          'Severe swelling of face, hands, or feet with high blood pressure.',
        ],
        points_lg: [
          'Omutwe omubi ennyo + okulaba ekifu oba okugwa kigwo → pre-eclampsia (wa MgSO4, siindika amangu).',
          'Omusaayi omunngi mu bukyala mu kiseera kyonna ky\'olubuto.',
          'Obulumi obw\'amaanyi bw\'olubuto obutaawonya obutereevu.',
          'Omusujja ogusukka 38°C (naddala oluvannyuma lwa wiiki 20 — lowooza malaria, UTI, chorioamnionitis).',
          'Omwana okusala okugendera oba okulekera (waggulu wa wiiki 28).',
          'Ebikankano eby\'okuzaala nga tonnatuuka ku wiiki 37 (okuzaala amangu).',
          'Okuwimba okw\'amaanyi kw\'amaaso, emikono, oba ebigere wamu n\'puleesa omigufu.',
        ],
      },
      {
        title: '💊 Routine Supplementation',
        title_lg: '💊 Eddagala ery\'Okuwa Bulijjo',
        points: [
          'Iron + Folic Acid: 1 tablet daily throughout pregnancy and 3 months postpartum. Free at ANC.',
          'Calcium supplementation in areas of high pre-eclampsia risk: 1.5g/day from 20 weeks.',
          'Vitamin A (200,000 IU): single dose postpartum (within 6 weeks of delivery).',
          'IPTp (SP/Fansidar): at each ANC visit from 13 weeks — at least 3 doses required.',
        ],
        points_lg: [
          'Iron + Folic Acid: Empeke emu buli lunaku mu lubuto lwoona n\'emyezi 3 oluvannyuma lw\'okuzaala. Bwereere ku ANC.',
          'Calcium mu bitundu eby\'akabenje k\'pre-eclampsia: 1.5g buli lunaku okuva ku wiiki 20.',
          'Vitamin A (200,000 IU): Dosi emu oluvannyuma lw\'okuzaala (mu wiiki 6).',
          'IPTp (SP/Fansidar): Buli lwe bakyala ku ANC okuva ku wiiki 13 — doosi 3 ezeetaagibwa.',
        ],
      },
      {
        title: '🏥 Delivery & Postnatal Care',
        title_lg: '🏥 Okuzaala n\'Okukeberebwa Oluvannyuma',
        points: [
          'All deliveries should be attended by a skilled birth attendant at a health facility.',
          'Active Management of the 3rd Stage of Labour (AMTSL): Oxytocin 10 IU IM within 1 min of delivery.',
          'Postnatal check at 24 hours, 3 days, and 6 weeks postpartum.',
          'Counsel on exclusive breastfeeding for 6 months, family planning, and newborn danger signs.',
        ],
        points_lg: [
          'Okuzaala kwonna kusaanidde okubeerako omujjanjabi mu ddwaliro.',
          'Okujjanjaba Omulembo gw\'Okusatu gw\'Okuzaala (AMTSL): Oxytocin 10 IU IM mu ddakiika 1 oluvannyuma lw\'okuzaala.',
          'Okukeberebwa oluvannyuma ku ssaawa 24, ennaku 3, n\'awiiki 6 oluvannyuma lw\'okuzaala.',
          'Lagiriza ku kuyonsa amabeere gokka emyezi 6, entegeka y\'amaka, n\'obubonero bw\'omwana omuzaalibwa.',
        ],
      },
    ],
  },
  {
    id: 'imci',
    category: 'child',
    title: 'Child Health — IMCI',
    title_lg: 'Obulamu bw\'Abaana — IMCI',
    subtitle: 'Integrated Management of Childhood Illness',
    subtitle_lg: 'Enkola ey\'Okujjanjaba Endwadde z\'Abaana',
    icon: 'human-child',
    color: '#1D4ED8',
    bg: '#DBEAFE',
    edition: 'MoH Uganda 2021',
    source: 'Child Health Division / WHO IMCI Uganda Adaptation',
    sections: [
      {
        title: '🚨 General Danger Signs (Refer Urgently)',
        title_lg: '🚨 Obubonero bw\'Akabenje (Siindika Amangu)',
        points: [
          'Unable to drink or breastfeed.',
          'Vomiting everything.',
          'Convulsions (now or in this illness).',
          'Lethargic or unconscious.',
          'Stridor at rest (noisy breathing with in-drawing of chest).',
          'Any of these signs = IMMEDIATE REFERRAL to hospital.',
        ],
        points_lg: [
          'Atasobola kunywa oba kuyonka.',
          'Okusesema byonna.',
          'Okugwa kigwo (kati oba mu bulwadde buno).',
          'Obunafu oba okutalaba.',
          'Okukankana bw\'abeera (okulissagana kw\'omuheyo nga esifuba lisimba).',
          'Buli kimu kya bino = OKUSIINDIKIBWA AMANGU ku ddwaliro.',
        ],
      },
      {
        title: '🌡️ Fever / Malaria Assessment',
        title_lg: '🌡️ Okukebera Omusujja / Malaria',
        points: [
          'Fever ≥ 37.5°C → do RDT for malaria. Treat with Coartem if positive.',
          'Look for stiff neck → bacterial meningitis (urgent referral + pre-referral antibiotics).',
          'Rash + fever → consider measles (isolate, Vitamin A, refer if complicated).',
          'Fever > 5 days → investigate systematically (blood culture, typhoid test, urine).',
        ],
        points_lg: [
          'Omusujja ≥ 37.5°C → kola RDT eri malaria. Jjanjaba na Coartem bw\'elabalikira.',
          'Noonya omukono gw\'ensingo omukutte — bacterial meningitis (siindika amangu + antibiotics).',
          'Ekisaasa + omusujja → lowooza mumpumpu (wawula, Vitamin A, siindika bw\'kibaagana).',
          'Omusujja okusingawo ennaku 5 → kebera mu ngeri zonna (culture y\'omusaayi, okukebera typhoid, enkiiko).',
        ],
      },
      {
        title: '💨 Pneumonia Classification',
        title_lg: '💨 Okwawula Endwadde y\'Ekifuba',
        points: [
          'Fast breathing (< 2m: ≥60/min; 2–12m: ≥50/min; 1–5yr: ≥40/min) = pneumonia → Amoxicillin 40mg/kg/day for 5 days.',
          'Chest in-drawing or SpO2 < 90% = severe pneumonia → refer + pre-referral Amoxicillin + Oxygen.',
          'Cyanosis, inability to drink, stridor = very severe → urgent referral.',
        ],
        points_lg: [
          'Okussa amangu (wansi wa myezi 2: ≥60/min; myezi 2–12: ≥50/min; emyaka 1–5: ≥40/min) = ekifuba → Amoxicillin 40mg/kg/ennaku ennaku 5.',
          'Esifuba okusimba oba SpO2 wansi wa 90% = ekifuba omubi → siindika + Amoxicillin + Omusanyusa.',
          'Okunzirira, okusobola okunywa, okukankana = omubi ennyo → siindika amangu.',
        ],
      },
      {
        title: '💧 Diarrhoea & Dehydration',
        title_lg: '💧 Okuddukana n\'Okubula Amazzi',
        points: [
          'Assess for dehydration: sunken eyes, skin pinch, poor drinking.',
          'Plan A (no dehydration): ORS at home, Zinc 20mg/day for 10 days, continue feeding.',
          'Plan B (some dehydration): give 75 mL/kg ORS in 4 hours at facility.',
          'Plan C (severe dehydration): IV fluids (Ringer\'s Lactate) — 100 mL/kg over 3 hours (infants) or 30 min (older children).',
          'Persistent diarrhoea (≥14 days): nutritional rehabilitation, investigate for HIV/parasites.',
        ],
        points_lg: [
          'Kebera okubula amazzi: amaaso agasimba, olukoba okunyitibwa, okunywa bunafu.',
          'Entegeka A (tewali okubula amazzi): ORS ewaka, Zinc 20mg/lunaku ennaku 10, weyunge okulya.',
          'Entegeka B (ekitundu ky\'okubula amazzi): wa 75 mL/kg ORS mu ssaawa 4 mu ddwaliro.',
          'Entegeka C (okubula amazzi okw\'amaanyi): IV fluids (Ringer\'s Lactate) — 100 mL/kg mu ssaawa 3 (abaana abatooya) oba ddakiika 30 (abaana abakulu).',
          'Okuddukana okweyongera (≥ennaku 14): okujjuza emmere, kebera HIV/ensowera.',
        ],
      },
      {
        title: '🥗 Malnutrition',
        title_lg: '🥗 Okubula Emmere',
        points: [
          'Severe Acute Malnutrition (SAM): MUAC < 11.5cm or oedema → admit for RUTF + antibiotics.',
          'Moderate Acute Malnutrition (MAM): MUAC 11.5–12.5cm → supplementary feeding programme.',
          'Micronutrient supplementation: Vitamin A every 6 months (free at UNEPI outreach).',
          'Deworm with Albendazole 400mg every 6 months from age 12 months.',
        ],
        points_lg: [
          'Okubula Emmere okw\'Amaanyi (SAM): MUAC wansi wa 11.5cm oba okuwimba → yingiza RUTF + antibiotics.',
          'Okubula Emmere Wakati (MAM): MUAC 11.5–12.5cm → pulogalamu y\'emmere ey\'okwongereza.',
          'Eddagala ery\'ebitundu by\'emmere: Vitamin A buli myezi 6 (bwereere ku outreach ya UNEPI).',
          'Nyonyola ensowera na Albendazole 400mg buli myezi 6 okuva ku mwezi gwa 12 gw\'omwana.',
        ],
      },
    ],
  },
  {
    id: 'tb',
    category: 'infectious',
    title: 'Tuberculosis Management',
    title_lg: 'Okujjanjaba Kafuba (TB)',
    subtitle: 'Case-finding, Treatment & Contact Tracing',
    subtitle_lg: 'Okuzuula Abalwadde, Okujjanjaba n\'Okukuuma Ennyini',
    icon: 'lungs',
    color: '#B91C1C',
    bg: '#FEE2E2',
    edition: 'MoH Uganda 2022',
    source: 'National TB & Leprosy Programme (NTLP)',
    sections: [
      {
        title: '🔍 Case Finding & Diagnosis',
        title_lg: '🔍 Okuzuula Abalwadde n\'Okukakasa',
        points: [
          'Screen all patients with cough ≥ 2 weeks, weight loss, night sweats, or fever.',
          'Sputum Xpert MTB/RIF for all presumptive TB cases — tests TB AND rifampicin resistance simultaneously.',
          'Chest X-ray if Xpert is negative but clinical suspicion remains high.',
          'TB culture for diagnosis when Xpert is not conclusive.',
          'DSTB (drug-sensitive TB): standard treatment. MDR-TB: refer to MDR treatment centre.',
        ],
        points_lg: [
          'Kebera abalwadde bonna ab\'akakololo ≥ wiiki 2, okukendeera bugeme, obukutakulire bw\'ekiro, oba omusujja.',
          'Sputum Xpert MTB/RIF eri abalwadde bonna abaloopologopya TB — okukebera TB n\'okulemwa rifampicin amakye.',
          'X-ray y\'esifuba bw\'Xpert esalamu wansi naye nga loopologopya kiri amaanyi.',
          'TB culture okutuukirira okukakasa bw\'Xpert tekakasibwa.',
          'TB eziimirira eddagala (DSTB): okujjanjaba okw\'omugenzi. MDR-TB: siindika ku kitundu ky\'okujjanjaba MDR.',
        ],
      },
      {
        title: '💊 Treatment — Drug Sensitive TB (DSTB)',
        title_lg: '💊 Okujjanjaba — TB Eziimirira Eddagala',
        points: [
          'Standard regimen: 2RHZE / 4RH (6 months total).',
          '2 months intensive phase: Rifampicin + Isoniazid + Pyrazinamide + Ethambutol daily.',
          '4 months continuation phase: Rifampicin + Isoniazid daily.',
          'All TB medicines are FREE at government facilities via NTLP.',
          'Directly Observed Therapy (DOT): ideally a treatment supporter watches each dose taken.',
          'NEVER stop treatment early — incomplete courses cause drug resistance.',
        ],
        points_lg: [
          'Enkola eyomugenzi: 2RHZE / 4RH (emyezi 6 kyamala).',
          'Emyezi 2 egy\'okujjanjaba okukutte: Rifampicin + Isoniazid + Pyrazinamide + Ethambutol buli lunaku.',
          'Emyezi 4 egikomya: Rifampicin + Isoniazid buli lunaku.',
          'Eddagala lyonna lya TB ya bwereere mu malwaliro ga gavumenti by\'NTLP.',
          'Okukuuma okujjanjaba mu maaso (DOT): ow\'okukuuma akuuma buli doosi bw\'eriwebwa.',
          'TOLEKA kujjanjaba amangu — okujjanjaba okutateekateeka kukyusa endwadde okulemwa eddagala.',
        ],
      },
      {
        title: '👨‍👩‍👧 Contact Tracing',
        title_lg: '👨‍👩‍👧 Okukuuma Ennyini',
        points: [
          'Trace all household contacts of confirmed TB cases.',
          'Children < 5 years who are household contacts: give Isoniazid Preventive Therapy (IPT) 6 months.',
          'Screen all contacts for TB symptoms — refer for Xpert if symptomatic.',
          'HIV-positive contacts: give IPT regardless of age.',
        ],
        points_lg: [
          'Noonya ennyini zonna z\'amaka eri abalwadde ab\'akakololo bakakasiddwa.',
          'Abaana abali wansi w\'emyaka 5 ab\'ennyini z\'amaka: wa Isoniazid Preventive Therapy (IPT) emyezi 6.',
          'Kebera ennyini zonna eri obubonero bwa TB — siindika Xpert bw\'bilabikira.',
          'Ennyini abalina HIV+: wa IPT hatabula kikula.',
        ],
      },
      {
        title: '🤝 TB/HIV Co-infection',
        title_lg: '🤝 TB/HIV Wamu',
        points: [
          'Test all TB patients for HIV; test all HIV patients for TB.',
          'Start TB treatment first, then initiate ART within 2–8 weeks (earlier for CD4 < 50).',
          'For TB/HIV co-infection: use Efavirenz-based ART (not Dolutegravir — rifampicin interaction).',
          'Cotrimoxazole prophylaxis for all TB/HIV co-infected patients.',
        ],
        points_lg: [
          'Kebera abalwadde bonna ab\'akakololo eri HIV; kebera abalwadde bonna ab\'HIV eri TB.',
          'Tandika okujjanjaba TB osooka, oluvannyuma otandike ART mu wiiki 2–8 (amangu eri CD4 wansi wa 50).',
          'Eri TB/HIV wamu: kozesa ART ey\'Efavirenz (si Dolutegravir — rifampicin ekigaana).',
          'Okuziyiza na Cotrimoxazole eri abalwadde bonna ab\'akakololo n\'HIV wamu.',
        ],
      },
    ],
  },
  {
    id: 'ncds',
    category: 'noncommunicable',
    title: 'Hypertension & Diabetes',
    title_lg: 'Puleesa Omigufu n\'Sukali',
    subtitle: 'NCD Screening, Diagnosis & Chronic Management',
    subtitle_lg: 'Okukebera, Okuzuula n\'Okujjanjaba Endwadde ez\'Akatyabaga',
    icon: 'heart-pulse',
    color: '#0284C7',
    bg: '#E0F2FE',
    edition: 'MoH Uganda 2020',
    source: 'Uganda NCD Programme / WHO PEN Package',
    sections: [
      {
        title: '🩺 Hypertension',
        title_lg: '🩺 Puleesa Omigufu',
        points: [
          'Diagnose hypertension if BP ≥ 140/90 mmHg on 2 separate occasions.',
          'Measure BP at every clinical encounter for all patients ≥ 18 years.',
          'Lifestyle changes first: reduce salt, increase physical activity, stop smoking, limit alcohol.',
          'Pharmacological therapy: first-line — Amlodipine 5mg OD or Hydrochlorothiazide 25mg OD.',
          'Target BP: < 130/80 mmHg in most adults; < 140/90 in elderly or high CVD risk.',
          'Review medications and adherence at every visit. BP medicines available free at HC IIIs.',
        ],
        points_lg: [
          'Kakasa puleesa omigufu bw\'BP ≥ 140/90 mmHg ku mikutu 2 egyawukana.',
          'Kebera BP buli lwe omulwadde akyalira eri abalwadde bonna ab\'emyaka ≥ 18.',
          'Kyusa engeri y\'obulamu osooka: kendeeza obunji, yongereza okulima, leka sigala, kendeeza omwenge.',
          'Eddagala: ery\'osooka — Amlodipine 5mg buli lunaku oba Hydrochlorothiazide 25mg buli lunaku.',
          'BP ey\'okuteesa: wansi wa 130/80 mmHg eri abakuligwa abimu; wansi wa 140/90 eri abakulugavu.',
          'Kebera eddagala n\'okukikozesa buli lwe bakyalira. Eddagala lya BP lya bwereere mu HC IIIs.',
        ],
      },
      {
        title: '🍯 Diabetes Mellitus Type 2',
        title_lg: '🍯 Sukali Endwadde ya Bika 2',
        points: [
          'Diagnose DM2 if fasting glucose ≥ 7.0 mmol/L or random glucose ≥ 11.1 mmol/L (2 readings).',
          'Screen all patients ≥ 45 years or overweight/obese adults for diabetes annually.',
          'First-line treatment: Metformin 500mg twice daily with meals. Titrate to 1000–2000mg/day.',
          'Add Glibenclamide or Insulin if HbA1c > 8% on Metformin alone.',
          'Monitor HbA1c every 3–6 months. Target HbA1c < 7% for most patients.',
          'Screen annually for complications: feet (neuropathy), eyes (retinopathy), kidneys (creatinine/proteinuria).',
        ],
        points_lg: [
          'Kakasa sukali bw\'glucose ku nnaku ez\'okwabulako emmere ≥ 7.0 mmol/L oba mu bbanga lyonna ≥ 11.1 mmol/L (okukebera 2).',
          'Kebera abalwadde bonna ab\'emyaka ≥ 45 oba abanene eri sukali buli mwaka.',
          'Eddagala ery\'osooka: Metformin 500mg emirundi 2 buli lunaku n\'ebyakulya. Yongereza okutuuka 1000–2000mg buli lunaku.',
          'Gattako Glibenclamide oba Insulin bw\'HbA1c > 8% ku Metformin yookka.',
          'Kuuma HbA1c buli myezi 3–6. HbA1c ey\'okuteesa wansi wa 7% eri abalwadde abimu.',
          'Kebera buli mwaka endwadde ez\'okwekoleza: ebigere (neuropathy), amaaso (retinopathy), ekkuufu (creatinine/proteinuria).',
        ],
      },
      {
        title: '📋 Integrated NCD Care',
        title_lg: '📋 Okujjanjaba Endwadde z\'Akatyabaga Wamu',
        points: [
          'Use the WHO PEN (Package of Essential NCD Interventions) at HC III level.',
          'Risk stratification: calculate 10-year CVD risk for all hypertensive/diabetic patients.',
          'Aspirin 75mg/day for patients with established CVD or high 10-year CVD risk.',
          'Annual foot check for all diabetic patients — check pulses, sensation, skin integrity.',
          'Offer smoking cessation counselling at every visit.',
        ],
        points_lg: [
          'Kozesa WHO PEN (Package of Essential NCD Interventions) ku nsi ya HC III.',
          'Okwawula akabi: wekalibwa akabi ka CVD kw\'emyaka 10 eri abalwadde bonna ab\'puleesa/sukali.',
          'Aspirin 75mg buli lunaku eri abalwadde ab\'CVD ekakasiddwa oba akabi ka CVD amaanyi.',
          'Okukebera ebigere buli mwaka eri abalwadde bonna ab\'sukali — kebera peleesi, okuwulira, olukoba.',
          'Wa obulagirizi bw\'okuleka sigala buli lwe bakyalira.',
        ],
      },
    ],
  },
];

const CATEGORY_LABELS: Record<string, { en: string; lg: string; icon: string }> = {
  all:              { en: 'All',        lg: 'Byonna',       icon: 'book-open-variant' },
  infectious:       { en: 'Infectious', lg: 'Endwadde ez\'Okusaasaana', icon: 'virus-outline' },
  maternal:         { en: 'Maternal',   lg: 'Olubuto',      icon: 'baby-carriage' },
  child:            { en: 'Child Health',lg: 'Abaana',      icon: 'human-child' },
  noncommunicable:  { en: 'NCDs',       lg: 'NCD',          icon: 'heart-pulse' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function GuidelinesScreen() {
  const { colors, mode } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;
  const isLg = i18n.language === 'lg';

  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<Guideline | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const categoryKeys = Object.keys(CATEGORY_LABELS);
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
            <Text style={[styles.backBtnText, { color: selected.color }]}>{t('guidelines_library.back_btn')}</Text>
          </TouchableOpacity>

          {/* Detail header */}
          <AnimatedCard delay={0} style={styles.detailHeader}>
            <LinearGradient colors={[selected.color, selected.color + 'CC']} style={styles.detailHeaderGradient}>
              <View style={styles.detailHeaderTop}>
                <View style={[styles.detailIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Icon source={selected.icon} size={32} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{isLg ? selected.title_lg : selected.title}</Text>
                  <Text style={styles.detailSubtitle}>{isLg ? selected.subtitle_lg : selected.subtitle}</Text>
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
            const sectionPoints = isLg ? section.points_lg : section.points;
            const sectionTitle = isLg ? section.title_lg : section.title;
            return (
              <AnimatedCard key={sIdx} delay={sIdx * 60} style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setExpandedSection(isOpen ? null : `${selected.id}-${sIdx}`)}
                >
                  <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>{sectionTitle}</Text>
                  <Icon source={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
                {isOpen && (
                  <View style={[styles.sectionBody, { borderTopColor: colors.neutral[100] }]}>
                    {sectionPoints.map((point, pIdx) => (
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
              {t('guidelines_library.source_note', { source: selected.source })}
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
                  <Text style={styles.heroBadgeText}>{isLg ? 'LAAIBULAALI Y\'EBIRAGIRO' : 'CLINICAL REFERENCE LIBRARY'}</Text>
                </View>
                <Text style={styles.heroTitle}>{t('guidelines_library.title')}</Text>
                <Text style={styles.heroSub}>{t('guidelines_library.subtitle')}</Text>
              </View>
              <Icon source="hospital-box-outline" size={56} color="rgba(255,255,255,0.15)" />
            </View>
            <View style={styles.heroStats}>
              {[
                { val: `${GUIDELINES.length}`, label: t('guidelines_library.protocols') },
                { val: `${GUIDELINES.reduce((a, g) => a + g.sections.length, 0)}`, label: t('guidelines_library.sections') },
                { val: isLg ? 'OFFLINE' : 'OFFLINE', label: t('guidelines_library.accessible') },
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
          {categoryKeys.map(key => {
            const cfg = CATEGORY_LABELS[key];
            const isActive = category === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.catChip,
                  { backgroundColor: isActive ? '#1D4ED8' : colors.surface },
                  !isActive && { borderWidth: 1, borderColor: colors.neutral[200] },
                ]}
                onPress={() => setCategory(key)}
              >
                <Icon source={cfg.icon} size={13} color={isActive ? '#FFF' : colors.neutral[600]} />
                <Text style={[styles.catChipText, { color: isActive ? '#FFF' : colors.neutral[700] }]}>
                  {isLg ? cfg.lg : cfg.en}
                </Text>
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
                    <Text style={[styles.glTitle, { color: colors.neutral[900] }]}>
                      {isLg ? gl.title_lg : gl.title}
                    </Text>
                    <Text style={[styles.glSubtitle, { color: colors.neutral[500] }]} numberOfLines={2}>
                      {isLg ? gl.subtitle_lg : gl.subtitle}
                    </Text>
                  </View>
                  <Icon source="chevron-right" size={22} color={colors.neutral[400]} />
                </View>

                <View style={styles.glMeta}>
                  <View style={[styles.glMetaChip, { backgroundColor: gl.bg }]}>
                    <Text style={[styles.glMetaText, { color: gl.color }]}>
                      {gl.sections.length} {isLg ? 'ebitundu' : 'sections'}
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
            {t('guidelines_library.disclaimer')}
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
