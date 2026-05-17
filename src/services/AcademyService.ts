export interface QuizQuestion {
  id: string;
  text: string;
  text_lg?: string;
  options: string[];
  options_lg?: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonModule {
  id: string;
  title: string;
  title_lg?: string;
  category: string;
  category_lg?: string;
  description: string;
  description_lg?: string;
  content: string[];
  content_lg?: string[];
  quiz: QuizQuestion[];
  icon: string;
  estimatedMinutes: number;
}

export const ACADEMY_CONTENT: LessonModule[] = [
  {
    id: 'm1',
    title: 'The Anatomy of a Health Myth',
    title_lg: 'Engeri Olufumo gye Lukolebwamu',
    category: 'Foundations',
    category_lg: 'Ensibi',
    description: 'Learn why health misinformation spreads and how to identify emotional triggers.',
    description_lg: 'Yiga lwaki ebitali bituufu bisaasaanira n\'engeri y\'okubizuula.',
    icon: 'brain',
    estimatedMinutes: 5,
    content: [
      'Misinformation often uses emotional triggers like fear or hope.',
      'Common red flags: "Hidden cures," "The government is hiding this," and "Share immediately."',
      'Fact-checking involves cross-referencing with Ministry of Health guidelines.'
    ],
    content_lg: [
      'Olufumo luseera nnyo nnyo ku kitiisa oba essuubi ly\'abantu.',
      'Obubonero obukyamu: "Eddagala lyekyidde," "Gavumenti ekikwese," oba "Gaba mangu."',
      'Okukakasa ebigambo kyeetaagisa okwebuuza ku Minisitule y\'Obulamu.'
    ],
    quiz: [
      {
        id: 'q1_1',
        text: 'What is a common red flag of health misinformation?',
        text_lg: 'Kiki akabonero akakyifu kowe bulijjo mu lufumo?',
        options: ['Mentions a specific hospital', 'Uses urgent or emotional language', 'Includes a date of publication', 'Cites the WHO'],
        options_lg: ['Kyogera ku ddwaliro ekimu', 'Kikozesa ebigambo by\'amangu oba ebitiisa', 'Kiraga olunaku lwe kyafulumira', 'Kyogera ku WHO'],
        correctIndex: 1,
        explanation: 'Misinformation often uses urgency to bypass critical thinking.'
      }
    ]
  },
  {
    id: 'm2',
    title: 'Vaccine Safety & Communication',
    title_lg: 'Obukuumi bw\'Enkingo n\'Okwogera',
    category: 'Vaccination',
    category_lg: 'Enkingo',
    description: 'Master the facts about routine immunization and how to answer parent concerns.',
    description_lg: 'Manya amazima ku nkingo n\'engeri y\'okuddamu abazadde.',
    icon: 'needle',
    estimatedMinutes: 8,
    content: [
      'Vaccines undergo rigorous clinical trials before approval.',
      'Polio and Measles vaccines are essential for child survival in Uganda.',
      'Side effects are usually mild (e.g., low-grade fever) and temporary.'
    ],
    content_lg: [
      'Enkingo zikeberwa nnyo nnyo nga tinnaba kukakasibwa.',
      'Enkingo za Polio ne Measles nneetaagisa nnyo eri abaana mu Uganda.',
      'Obubonero obulala (nko ffeva) butono era buwulirwa okumala akaseera.'
    ],
    quiz: [
      {
        id: 'q2_1',
        text: 'Are routine vaccines safe for children in rural areas?',
        text_lg: 'Enkingo zino nneekuumi eri abaana mu byalo?',
        options: ['No, they are different from city vaccines', 'Yes, they are the same high-quality vaccines', 'Only if the child is over 5 years old', 'Not if the child has a cold'],
        options_lg: ['Nedda, zaawukana n\'ezo mu kibuga', 'Yee, zonna ze nkingo ze zimu ezikakasiddwa', 'Kuggyako nga mwana asukka emyaka etaano', 'Nedda, ssinga omwana aba alina ssenyiga'],
        correctIndex: 1,
        explanation: 'All vaccines provided by the Ministry of Health meet global safety standards.'
      }
    ]
  },
  {
    id: 'm3',
    title: 'Outbreak Response: Ebola Myths',
    title_lg: 'Okuddamu mu Kabenje: Enkingo z\'Ebola',
    category: 'Emergencies',
    category_lg: 'Ebitalubiriddwa',
    description: 'Critical knowledge for identifying and countering Ebola rumors during an outbreak.',
    description_lg: 'Okumanya okwetaagisa okuziyiza olufumo lwa Ebola mu kiseera ky\'akabenje.',
    icon: 'biohazard',
    estimatedMinutes: 10,
    content: [
      'Ebola is transmitted through direct contact with bodily fluids.',
      'Survivors are not contagious once cleared by health officials.',
      'Seeking care early significantly increases the chance of survival.'
    ],
    content_lg: [
      'Ebola asasaanyizibwa mu kukwata amazzi agava mu muntu (omusaayi, amalusu).',
      'Abawonye Ebola tebasasaanya bulwadde nga bakakasiddwa abasawo.',
      'Okugenda mu ddwaliro amangu kyongera emikisa gy\'okuwona.'
    ],
    quiz: [
      {
        id: 'q3_1',
        text: 'How is Ebola primarily transmitted?',
        text_lg: 'Ebola asasaanyizibwa atya okusinga?',
        options: ['Through the air over long distances', 'Through direct contact with bodily fluids', 'By eating mangoes', 'Through mosquito bites'],
        options_lg: ['Mu mpewo ewala', 'Mu kukwata amazzi agava mu muntu', 'Mu kulya emiyembe', 'Mu kulumwa ensiri'],
        correctIndex: 1,
        explanation: 'Ebola spreads through contact with blood, sweat, or vomit of an infected person.'
      }
    ]
  },
  {
    id: 'm4',
    title: 'Community Nutrition for All Ages',
    title_lg: 'Endiisa Ennungi eri Buli Muntu',
    category: 'Nutrition',
    category_lg: 'Endiisa',
    description: 'Master healthy eating guidance for infants, children, adolescents, pregnant women, elderly, and people with chronic conditions.',
    description_lg: 'Manya endiisa ennungi eri abaana abato, abaana, abavubuka, abakazi ab\'olubuto, abakadde, n\'abalwadde b\'endwadde ez\'ekiseera.',
    icon: 'food-apple',
    estimatedMinutes: 12,
    content: [
      'Exclusive breastfeeding: Breast milk alone is enough for the first 6 months — no water, no porridge, no other foods.',
      'Complementary feeding begins at exactly 6 months with soft mashed foods like matooke, lumonde (sweet potato), or obushera (porridge).',
      'Eggs are a SUPERFOOD for children — they do NOT cause worms. They provide protein, iron, and Vitamin A for brain growth.',
      'Mukene (silver fish) is rich in calcium, protein, and omega-3 — superior to many imported foods for bone and brain development.',
      'Adolescent girls need iron-rich foods (dodo, liver, mukene, beans) to prevent anemia from monthly menstruation.',
      'Pregnant women need MORE food, not less — at least one extra meal per day. Eating less endangers both mother and baby.',
      'Iron and Folic Acid (IFA) tablets are ESSENTIAL during pregnancy — they prevent anemia and birth defects.',
      'Elderly people need protein-rich foods (eggs, beans, milk) and regular water intake to maintain strength and prevent falls.',
      'People living with HIV need 10-30% MORE calories. Good nutrition strengthens immunity and helps ARVs work better.',
      'Diabetics should eat controlled portions of complex carbs (lumonde, brown posho) — NOT eliminate carbs entirely.',
      'Reduce salt intake to prevent hypertension. Maggi cubes and processed foods contain hidden sodium.',
      'Local Ugandan foods (matooke, groundnuts, dodo, nakati, mukene) provide complete, balanced nutrition — imported food is NOT superior.'
    ],
    content_lg: [
      'Okuyonsa bwokka: Amabeere ga nnyina gakka ge getaagibwa omwana emyezi 6 — tewali mazzi, tewali bushera, tewali kyokulya.',
      'Emmere ey\'okwongerako etandikibwa ku myezi 6 n\'emmere empola ng\'ematooke, lumonde, oba obushera.',
      'Amagi GALUNGI ENNYO eri abaana — TEGAREETERA njoka. Gawa pulootiini, eyaani, ne Vitamin A ey\'obwongo.',
      'Mukene erimu calcium, pulootiini, ne omega-3 — esinga emmere egituuka okuva ebweru okuyamba amagumba n\'obwongo.',
      'Abawala abavubuka beetaaga emmere erimu eyaani (dodo, ekibumba, mukene, ebijanjaalo) okuziyiza anemia.',
      'Abakazi ab\'olubuto beetaaga emmere ENNYO, si ntono — okulya oky\'okwongera buli lunaku. Okulya ekitono kirabe.',
      'Amabaale ga Iron ne Folic Acid GEETAAGIBWA mu lubuto — gaziyiza anemia n\'obuzibu mu kuzaala.',
      'Abakadde beetaaga emmere erimu pulootiini (amagi, ebijanjaalo, amata) n\'amazzi amalungi okunywa bulijjo.',
      'Abalina HIV beetaaga emmere ENNYO okusinga abalala 10-30%. Endiisa ennungi enyweza omubiri era eyamba ARVs.',
      'Abalina ssukaali balya ebitundu ebikwatiddwa eby\'amaanyi empola (lumonde, posho ow\'obuwunga) — si kuleka bikyafu byonna.',
      'Kendeeza ku munnyo okuziyiza pulesha. Maggi n\'emmere egulwa mu kadduuka erimu sodium nnyingi.',
      'Emmere ey\'Uganda (matooke, ebinyeebwa, dodo, enakati, mukene) ewa omubiri byonna bye gwetaaga — emmere ey\'ebweru TEYASINGA.'
    ],
    quiz: [
      {
        id: 'q4_1',
        text: 'For how long should a baby receive ONLY breast milk?',
        text_lg: 'Omwana ayonsa amabeere ga nnyina GAKKA okumala bbanga ki?',
        options: ['2 months', '4 months', '6 months', '12 months'],
        options_lg: ['Emyezi 2', 'Emyezi 4', 'Emyezi 6', 'Emyezi 12'],
        correctIndex: 2,
        explanation: 'WHO recommends exclusive breastfeeding for the first 6 months — no water, no porridge, no other foods.'
      },
      {
        id: 'q4_2',
        text: 'Are eggs harmful to young children?',
        text_lg: 'Amagi mabi eri abaana abato?',
        options: ['Yes, they cause worms', 'Yes, they cause allergies', 'No, they are one of the most nutritious foods for children', 'Only boiled eggs are safe'],
        options_lg: ['Yee, gareetera enjoka', 'Yee, gareetera alerugiya', 'Nedda, ge bimu ku birungo ebisinga obulungi eri abaana', 'Amagi agafumbiirddwa bwokka ge matuufu'],
        correctIndex: 2,
        explanation: 'Eggs provide protein, iron, and Vitamin A essential for brain development and growth in children.'
      },
      {
        id: 'q4_3',
        text: 'Should pregnant women eat LESS for an easier delivery?',
        text_lg: 'Abakazi ab\'olubuto balina okulya EKITONO okuzaala mangu?',
        options: ['Yes, a smaller baby is healthier', 'Yes, to avoid complications', 'No, they need at least one extra meal per day', 'Only in the last month'],
        options_lg: ['Yee, omwana omutono ye mulamu', 'Yee, okuziyiza obuzibu', 'Nedda, beetaaga okulya oky\'okwongera buli lunaku', 'Mu mwezi ogusembayo bwokka'],
        correctIndex: 2,
        explanation: 'Pregnant women need MORE food. Eating less causes low birth weight and increases risk for both mother and baby.'
      },
      {
        id: 'q4_4',
        text: 'Which local food is a SUPERFOOD for calcium and protein?',
        text_lg: 'Kyokulya ki eky\'eggwanga ekirimu calcium ne pulootiini ennyo?',
        options: ['Posho alone', 'Mukene (silver fish)', 'Cassava alone', 'White rice'],
        options_lg: ['Posho yekka', 'Mukene', 'Muwogo gwekka', 'Omuceere omweru'],
        correctIndex: 1,
        explanation: 'Mukene is rich in calcium, protein, and omega-3 fatty acids — excellent for bone and brain development.'
      }
    ]
  }
];

export class AcademyService {
  public static async getProgress(): Promise<Record<string, boolean>> {
    const data = localStorage.getItem('healthguard_academy_progress');
    return data ? JSON.parse(data) : {};
  }

  public static async markCompleted(moduleId: string): Promise<void> {
    const progress = await this.getProgress();
    progress[moduleId] = true;
    localStorage.setItem('healthguard_academy_progress', JSON.stringify(progress));
  }
}
