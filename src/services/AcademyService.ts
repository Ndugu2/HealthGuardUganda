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
