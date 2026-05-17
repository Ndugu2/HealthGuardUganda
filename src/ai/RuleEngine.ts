export type Label = 'ACCURATE' | 'INACCURATE' | 'UNCERTAIN';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ClassificationResult {
  label: Label;
  confidence: number;
  triggerKeyword: string | null;
  fromRule: boolean;
  reasoning?: string;
  triggerPhrases?: string[];
  riskLevel?: RiskLevel;
  isReliable: boolean;
  reliabilityNote?: string;
  escalationRequired?: boolean;
  clinicalFlags?: string[];
  detectedFeatures?: { term: string, weight: number }[];
  similarityScore?: number;
  culturalContext?: boolean;
  respectfulPrefix?: string;
  modelComparisons?: { model: string, label: string, confidence: number }[];
  consensusStatus?: 'UNANIMOUS' | 'MAJORITY' | 'CONFLICT';
}

// ─── INACCURATE CLAIMS (Myths & Misinformation) ──────────────────────────────
const INACCURATE_RULES: Record<string, string> = {
  // Vaccination myths
  "vaccines cause infertility": "vaccination:infertility",
  "vaccine causes infertility": "vaccination:infertility",
  "vaccines make women barren": "vaccination:infertility",
  "vaccines contain microchips": "vaccination:microchips",
  "vaccine has a chip": "vaccination:microchips",
  "vaccines have tracking devices": "vaccination:microchips",
  "vaccines are poison": "vaccination:poison",
  "vaccines are toxic": "vaccination:poison",
  "vaccines kill children": "vaccination:poison",
  "vaccine alters dna": "vaccination:dna",
  "mrna changes your dna": "vaccination:dna",
  "vaccine modifies genes": "vaccination:dna",
  "polio vaccine sterilize": "vaccination:infertility",
  "vaccines cause autism": "vaccination:autism",
  "vaccine gave my child autism": "vaccination:autism",

  // HIV/AIDS myths
  "hiv is caused by witchcraft": "hiv:witchcraft",
  "aids is witchcraft": "hiv:witchcraft",
  "hiv is a curse": "hiv:witchcraft",
  "aids is punishment from god": "hiv:witchcraft",
  "arvs are poison": "hiv:arv_poison",
  "arv drugs are dangerous": "hiv:arv_poison",
  "arvs kill people": "hiv:arv_poison",
  "sex with a virgin cures hiv": "hiv:virgin_cure",
  "virgin cures hiv": "hiv:virgin_cure",
  "virgin cure": "hiv:virgin_cure",
  "mosquitoes spread hiv": "hiv:mosquitos_hiv",
  "mosquito bites hiv": "hiv:mosquitos_hiv",
  "prayer cures hiv": "hiv:prayer_cure",
  "sex with a virgin cures aids": "hiv:virgin_cure",
  "hiv doesn't exist": "hiv:denial",
  "aids is not real": "hiv:denial",
  "breastfeeding always spreads hiv": "hiv:breastfeeding_myth",

  // Malaria myths
  "herbs alone cure malaria": "malaria:herbs_only",
  "herbal medicine cures malaria": "malaria:herbs_only",
  "traditional herbs treat malaria": "malaria:herbs_only",
  "mosquito nets cause breathing problems": "malaria:nets_harm",
  "bed nets are dangerous": "malaria:nets_harm",
  "malaria is caused by mangoes": "malaria:mango_myth",
  "eating mangoes causes malaria": "malaria:mango_myth",
  "malaria is caused by sugarcane": "malaria:sugarcane_malaria",
  "malaria is caused by dirty water": "malaria:water_myth",
  "you can't get malaria twice": "malaria:reinfection_myth",

  // Maternal health myths
  "hospital delivery is dangerous": "maternal:hospital_danger",
  "hospitals are dangerous for birth": "maternal:hospital_danger",
  "home birth is safer than hospital": "maternal:hospital_danger",
  "traditional birth attendants are safer": "maternal:tba_safer",
  "eating clay during pregnancy is healthy": "maternal:geophagy",
  "pregnant women should not eat eggs": "maternal:food_taboo",
  "ultrasound harms the baby": "maternal:ultrasound_myth",

  // COVID-19 myths
  "covid was man made": "covid:man_made",
  "covid is a bioweapon": "covid:man_made",
  "corona is a hoax": "covid:hoax",
  "covid is not real": "covid:hoax",
  "5g towers spread covid": "covid:5g",
  "5g causes coronavirus": "covid:5g",
  "drinking alcohol kills coronavirus": "covid:alcohol_cure",
  "garlic cures covid": "covid:garlic_cure",
  "hot water kills covid": "covid:hot_water",
  "bleach cures covid": "covid:bleach_cure",

  // STD myths
  "stds are caused by dirty latrines": "stds:stis_cause_sex",
  "sitting on a toilet causes syphilis": "stds:stis_cause_sex",
  "kabotongo ava ku buyonjo": "stds:stis_cause_sex",
  "enziku eva ku musana": "stds:gonorrhea_enziku",
  "nanziri eva ku nkuba": "stds:gonorrhea_enziku",
  "ensekere ziva ku kwegatta": "stds:hpv_warts",
  "syphilis is a minor rash": "stds:syphilis_kabotongo",
  "condoms contain holes": "stds:stis_prevention_condoms",
  "hepb is only shared by food": "stds:hepatitis_b_prevention",

  // ─── NUTRITION MYTHS ──────────────────────────────────────────────────────
  // Infant & breastfeeding myths
  "babies need water from birth": "nutrition:infant_breastfeeding",
  "breast milk is not enough": "nutrition:breastfeeding_exclusive",
  "amabeere tegamala": "nutrition:breastfeeding_exclusive",
  "babies can eat adult food at 3 months": "nutrition:infant_complementary",
  "breastfeeding mothers don't need extra food": "nutrition:breastfeeding_diet",

  // Child nutrition myths
  "eggs are bad for children": "nutrition:child_eggs",
  "eggs cause worms in children": "nutrition:child_eggs",
  "amagi gareetera abaana enjoka": "nutrition:child_eggs",
  "short children take after parents": "nutrition:child_stunting",
  "mukene is inferior food": "nutrition:child_silverfish",
  "children don't need breakfast": "nutrition:school_breakfast",
  "deworming makes children lose appetite": "nutrition:school_deworming",
  "vitamin a supplements are unnecessary": "nutrition:child_vitamin_a",

  // Adolescent nutrition myths
  "posho and beans is enough for teenagers": "nutrition:adolescent_diet",
  "only pregnant women need iron": "nutrition:adolescent_iron",
  "rolex and soda is a balanced meal": "nutrition:adolescent_junk",

  // Pregnancy nutrition myths
  "pregnant women should eat less": "nutrition:pregnant_eat_less",
  "eat less for easy delivery": "nutrition:pregnant_eat_less",
  "iron tablets during pregnancy are harmful": "nutrition:pregnant_iron_folate",
  "folic acid is dangerous during pregnancy": "nutrition:pregnant_iron_folate",
  "pregnant women must avoid eggs and fish": "nutrition:pregnant_food_taboo",
  "pregnant women should avoid fish": "nutrition:pregnant_food_taboo",
  "matooke alone is enough during pregnancy": "nutrition:pregnant_diverse",

  // Elderly nutrition myths
  "old people don't need much food": "nutrition:elderly_protein",
  "elderly should drink less water": "nutrition:elderly_fluids",
  "old people should only eat porridge": "nutrition:elderly_soft_food",

  // HIV nutrition myths
  "hiv patients don't need special nutrition": "nutrition:hiv_nutrition",
  "arvs are enough without good food": "nutrition:hiv_nutrition",
  "you cannot take arvs on empty stomach": "nutrition:hiv_arv_food",

  // Diabetes myths
  "diabetics should stop eating carbohydrates": "nutrition:diabetes_sugar",
  "diabetics cannot eat fruits": "nutrition:diabetes_fruit",
  "herbal medicine cures diabetes": "nutrition:diabetes_herbal",
  "ebimera biwonyeza ssukaali": "nutrition:diabetes_herbal",

  // Hypertension myths
  "high blood pressure only treated with medicine": "nutrition:hypertension_diet",
  "food without salty taste has no salt": "nutrition:hypertension_salt_myth",
  "adding extra salt is healthy": "nutrition:adult_salt",

  // General nutrition myths
  "imported food is more nutritious": "nutrition:general_local_food",
  "leftover food is safe without reheating": "nutrition:general_food_safety",
  "reusing cooking oil is not harmful": "nutrition:general_cooking_oil",
  "tea and soda are the same as water": "nutrition:adult_water",
  "eating a lot of one food is better": "nutrition:adult_balanced"
};

// ─── ACCURATE CLAIMS (Verified Health Facts) ─────────────────────────────────
const ACCURATE_RULES: Record<string, string> = {
  // General hygiene
  "wash hands to prevent disease": "general:handwashing",
  "handwashing prevents diarrhea": "general:handwashing",
  "wash hands with soap": "general:handwashing",
  "hand hygiene saves lives": "general:handwashing",
  "clean water prevents disease": "sanitation:clean_water",
  "boil water before drinking": "sanitation:clean_water",

  // Vaccination facts
  "vaccines protect children": "vaccination:protection",
  "vaccines save lives": "vaccination:protection",
  "childhood vaccines prevent polio": "vaccination:protection",
  "routine immunization is important": "vaccination:protection",
  "vaccines are safe and effective": "vaccination:safety",

  // Malaria facts
  "mosquito nets prevent malaria": "malaria:nets_work",
  "use treated nets to prevent malaria": "malaria:nets_work",
  "insecticide treated nets reduce malaria": "malaria:nets_work",
  "seek treatment for malaria within 24 hours": "malaria:treatment",
  "malaria is caused by mosquito bites": "malaria:transmission",
  "omusujja gw'ensiri guvva ku nsiri": "malaria:transmission",
  "ekireetera malaria": "malaria:transmission",
  "ekileetera malaria": "malaria:transmission",
  "eliiletera malaria": "malaria:transmission",
  "ekireetera omusujja gw'ensiri": "malaria:transmission",
  "antimalarial drugs treat malaria": "malaria:treatment",

  // HIV facts
  "hiv transmitted through blood": "hiv:transmission",
  "hiv spreads through unprotected sex": "hiv:transmission",
  "condoms prevent hiv transmission": "hiv:prevention",
  "arv treatment works": "hiv:arv_works",
  "arvs help people live longer": "hiv:arv_works",
  "get tested for hiv regularly": "hiv:testing",

  // Maternal health facts
  "deliver at a health facility": "maternal:facility_delivery",
  "antenatal care is important": "maternal:anc",
  "antenatal visits detect complications": "maternal:anc",
  "exclusive breastfeeding for six months": "maternal:breastfeeding",
  "skilled birth attendants save lives": "maternal:skilled_birth",

  // COVID facts
  "covid is a real disease": "covid:real",
  "covid vaccines are safe": "covid:vaccine_safe",
  "wear masks to prevent covid spread": "covid:prevention",

  // STD facts
  "syphilis requires medical treatment": "stds:syphilis_kabotongo",
  "kabotongo lwetaaga eddagala": "stds:syphilis_kabotongo",
  "gonorrhea spreads through sexual contact": "stds:gonorrhea_enziku",
  "enziku esaasaanyizibwa mu kwegatta": "stds:gonorrhea_enziku",
  "chlamydia can cause infertility": "stds:chlamydia_cause",
  "hepatitis b spreads through blood": "stds:hepatitis_b_prevention",
  "hpv can cause cervical cancer": "stds:hpv_warts",
  "ensekere ziva ku kawuka ka hpv": "stds:hpv_warts",
  "trichomoniasis is curable": "stds:trichomoniasis_parasite",

  // ─── NUTRITION FACTS ──────────────────────────────────────────────────────
  // Infant & child nutrition
  "breast milk is enough for 6 months": "nutrition:infant_breastfeeding",
  "amabeere gamala emyezi mukaaga": "nutrition:infant_breastfeeding",
  "start complementary feeding at 6 months": "nutrition:infant_complementary",
  "eggs are nutritious for children": "nutrition:child_eggs",
  "amagi galungi eri abaana": "nutrition:child_eggs",
  "mukene is a superfood": "nutrition:child_silverfish",
  "vitamin a prevents blindness": "nutrition:child_vitamin_a",
  "breakfast improves school performance": "nutrition:school_breakfast",
  "deworming improves appetite": "nutrition:school_deworming",
  "diverse diet prevents stunting": "nutrition:child_stunting",

  // Adolescent nutrition
  "teenagers need diverse diet": "nutrition:adolescent_diet",
  "adolescent girls need iron": "nutrition:adolescent_iron",
  "limit sugary drinks for teenagers": "nutrition:adolescent_junk",

  // Pregnancy & breastfeeding nutrition
  "pregnant women need extra meals": "nutrition:pregnant_eat_less",
  "iron and folic acid are essential in pregnancy": "nutrition:pregnant_iron_folate",
  "pregnant women need protein rich foods": "nutrition:pregnant_food_taboo",
  "eat from all food groups during pregnancy": "nutrition:pregnant_diverse",
  "breastfeeding mothers need extra calories": "nutrition:breastfeeding_diet",
  "exclusive breastfeeding for first 6 months": "nutrition:breastfeeding_exclusive",
  "okuyonsa bwokka emyezi mukaaga": "nutrition:breastfeeding_exclusive",

  // Elderly nutrition
  "elderly need protein for muscle strength": "nutrition:elderly_protein",
  "elderly people should drink water regularly": "nutrition:elderly_fluids",
  "elderly need diverse nutrition": "nutrition:elderly_soft_food",

  // HIV nutrition
  "hiv patients need more calories": "nutrition:hiv_nutrition",
  "good nutrition helps arvs work": "nutrition:hiv_nutrition",
  "most arvs can be taken with or without food": "nutrition:hiv_arv_food",

  // Diabetes & hypertension nutrition
  "diabetics need controlled carbohydrates": "nutrition:diabetes_sugar",
  "most fruits are safe for diabetics": "nutrition:diabetes_fruit",
  "no herbal cure for diabetes": "nutrition:diabetes_herbal",
  "diet reduces high blood pressure": "nutrition:hypertension_diet",
  "reduce salt intake": "nutrition:adult_salt",
  "processed foods contain hidden salt": "nutrition:hypertension_salt_myth",

  // General nutrition
  "balanced diet means diverse foods": "nutrition:adult_balanced",
  "endiisa ennungi": "nutrition:adult_balanced",
  "drink 8 glasses of water daily": "nutrition:adult_water",
  "local ugandan foods are nutritious": "nutrition:general_local_food",
  "reheat leftover food before eating": "nutrition:general_food_safety",
  "avoid reusing cooking oil": "nutrition:general_cooking_oil",

  // ─── COMMON QUESTIONS ─────────────────────────────────────────────────────
  "what causes malaria": "malaria:sugarcane_malaria",
  "kiki ekileetera omusujja gw'ensiri": "malaria:sugarcane_malaria",
  "how to prevent malaria": "malaria:general",
  "how to prevent hiv": "hiv:general",
  "how to prevent covid": "covid:general",
  "what is a balanced diet": "nutrition:general",
  "how to feed a baby": "nutrition:infant_breastfeeding"
};

// ─── TOPIC KEYWORDS (for suggestive matching) ─────────────────────────────────
const TOPIC_KEYWORDS: Record<string, string> = {
  "malaria": "malaria",
  "omusujja": "malaria",
  "nsiri": "malaria",
  "vaccine": "vaccination",
  "nkungo": "vaccination",
  "hiv": "hiv",
  "aids": "hiv",
  "pregnancy": "maternal",
  "lubuto": "maternal",
  "pregnant": "maternal",
  "breastfeeding": "maternal",
  "okuyonsa": "maternal",
  "syphilis": "stds",
  "cure": "general",
  "prevent": "general",
  "treatment": "general",
  "symptoms": "general",
  "covid": "covid",
  "corona": "covid",
  "food": "nutrition",
  "endiisa": "nutrition",
  "nutrition": "nutrition",
  "diet": "nutrition",
  "eating": "nutrition",
  "okulya": "nutrition",
  "emmere": "nutrition",
  "protein": "nutrition",
  "vitamin": "nutrition",
  "iron": "nutrition",
  "calcium": "nutrition",
  "matooke": "nutrition",
  "posho": "nutrition",
  "beans": "nutrition",
  "ebijanjaalo": "nutrition",
  "mukene": "nutrition",
  "dodo": "nutrition",
  "eggs": "nutrition",
  "amagi": "nutrition",
  "obushera": "nutrition",
  "porridge": "nutrition",
  "fruit": "nutrition",
  "ebibala": "nutrition",
  "sugar": "nutrition",
  "ssukaali": "nutrition",
  "diabetes": "nutrition",
  "salt": "nutrition",
  "omunnyo": "nutrition",
  "hypertension": "nutrition",
  "blood pressure": "nutrition",
  "pulesha": "nutrition",
  "stunting": "nutrition",
  "malnutrition": "nutrition",
  "anemia": "nutrition",
  "deworming": "nutrition",
  "breakfast": "nutrition",
  "water": "sanitation",
  "mazzi": "sanitation",
  "std": "stds",
  "sti": "stds",
  "kikaba": "stds",
  "kabotongo": "stds",
  "enziku": "stds",
  "nanziri": "stds",
  "gonorrhea": "stds",
  "chlamydia": "stds",
  "hepatitis": "stds",
  "ensekere": "stds",
  "warts": "stds",
  "hpv": "stds"
};

// ─── KEYWORD SCORING (for fuzzy fallback) ─────────────────────────────────────
const MYTH_SIGNAL_WORDS = [
  "cure", "cures", "hoax", "fake", "poison", "kill", "kills",
  "dangerous", "witchcraft", "curse", "conspiracy", "microchip",
  "5g", "bioweapon", "sterilize", "barren", "don't need", "not real",
  "doesn't exist", "useless", "harmful", "toxic", "dirty water",
  "mangoes", "herbs", "seeds", "witch", "spirit", "latrine", "toilet",
  "buyonjo", "rain", "nkuba", "sun", "musana",
  // Nutrition myth signals
  "inferior", "not enough", "don't need food", "don't eat",
  "should not eat", "stop eating", "cannot eat", "only eat porridge",
  "eat less", "not necessary", "reuse oil", "soda", "junk food"
];

const FACT_SIGNAL_WORDS = [
  "prevent", "prevents", "protect", "protects", "safe", "effective",
  "treat", "treatment", "recommended", "proven", "evidence",
  "tested", "approved", "WHO", "health facility", "doctor",
  "hospital", "clinic", "important", "necessary", "essential",
  "cause", "causes", "ekireetera", "ekileetera", "kiki", "how to",
  "condom", "testing", "vaccination", "eddagala", "musaayi", "blood",
  // Nutrition fact signals
  "balanced diet", "nutritious", "protein", "vitamin", "calcium",
  "iron", "diverse diet", "food groups", "breastfeeding", "okuyonsa",
  "endiisa ennungi", "deworming", "breakfast", "reduce salt", "exercise"
];

export class RuleEngine {
  public check(rawInput: string): ClassificationResult | null {
    if (!rawInput) return null;
    const input = this.normalize(rawInput);

    for (const [phrase, token] of Object.entries(INACCURATE_RULES)) {
      if (input.includes(phrase)) {
        return {
          label: 'INACCURATE',
          confidence: 1.0,
          triggerKeyword: token,
          fromRule: true,
          reasoning: `This claim directly matches a known health myth recorded in our database.`,
          triggerPhrases: [phrase],
          riskLevel: this.getRiskLevel(token, 'INACCURATE'),
          isReliable: true,
          reliabilityNote: "Verified against MoH Fact Database.",
          similarityScore: 1.0,
          detectedFeatures: [{ term: phrase, weight: 1.0 }]
        };
      }
    }

    for (const [phrase, token] of Object.entries(ACCURATE_RULES)) {
      if (input.includes(phrase)) {
        return {
          label: 'ACCURATE',
          confidence: 1.0,
          triggerKeyword: token,
          fromRule: true,
          reasoning: `This claim aligns with verified medical consensus and official health guidelines.`,
          triggerPhrases: [phrase],
          riskLevel: 'LOW',
          isReliable: true,
          reliabilityNote: "Aligns with official health policy.",
          similarityScore: 1.0,
          detectedFeatures: [{ term: phrase, weight: 1.0 }]
        };
      }
    }

    return null;
  }

  public keywordScore(rawInput: string): ClassificationResult {
    const input = this.normalize(rawInput);
    
    let mythScore = 0;
    let factScore = 0;
    let matchedMyth: string | null = null;
    let matchedFact: string | null = null;
    let detectedTopic: string | null = null;

    for (const signal of MYTH_SIGNAL_WORDS) {
      if (input.includes(signal)) {
        mythScore++;
        if (!matchedMyth) matchedMyth = signal;
      }
    }

    for (const signal of FACT_SIGNAL_WORDS) {
      if (input.includes(signal)) {
        factScore++;
        if (!matchedFact) matchedFact = signal;
      }
    }

    for (const [kw, topic] of Object.entries(TOPIC_KEYWORDS)) {
      if (input.includes(kw)) {
        detectedTopic = topic;
        break;
      }
    }

    const total = mythScore + factScore;

    if (total === 0) {
      return {
        label: 'UNCERTAIN',
        confidence: 0.3,
        triggerKeyword: detectedTopic ? `${detectedTopic}:general` : null,
        fromRule: false,
        reasoning: "No recognizable health keywords found. This claim requires expert verification.",
        isReliable: false,
        reliabilityNote: "AI Uncertainty High: Consult medical officer."
      };
    }

    if (mythScore > factScore) {
      const confidence = Math.min(0.5 + (mythScore / total) * 0.4, 0.9);
      return {
        label: 'INACCURATE',
        confidence,
        triggerKeyword: detectedTopic ? `${detectedTopic}:general` : null,
        fromRule: false,
        reasoning: `Keyword analysis detected misinformation signals: "${matchedMyth}"`,
        isReliable: confidence > 0.7,
        reliabilityNote: confidence > 0.7 ? "High probability match." : "Ambiguous indicators detected.",
        similarityScore: confidence,
        detectedFeatures: [{ term: matchedMyth || 'unknown', weight: mythScore / total }]
      };
    }

    if (factScore > mythScore) {
      const confidence = Math.min(0.5 + (factScore / total) * 0.4, 0.9);
      return {
        label: 'ACCURATE',
        confidence,
        triggerKeyword: detectedTopic ? `${detectedTopic}:general` : null,
        fromRule: false,
        reasoning: `Keyword analysis detected evidence-based language: "${matchedFact}"`,
        isReliable: confidence > 0.7,
        reliabilityNote: confidence > 0.7 ? "High probability match." : "Low confidence: check official guidelines."
      };
    }

    return {
      label: 'UNCERTAIN',
      confidence: 0.5,
      triggerKeyword: detectedTopic ? `${detectedTopic}:general` : null,
      fromRule: false,
      reasoning: "Mixed signals detected — seek expert verification.",
      riskLevel: 'LOW',
      isReliable: false,
      reliabilityNote: "Mixed signals: AI cannot determine status safely."
    };
  }

  private getRiskLevel(token: string, label: Label): RiskLevel {
    if (label !== 'INACCURATE') return 'LOW';
    if (token.startsWith('hiv:witchcraft') || 
        token.startsWith('hiv:arv_poison') || 
        token.startsWith('ebola') || 
        token.startsWith('maternal:hospital_danger') ||
        token.includes('poison') ||
        // Nutrition: life-threatening myths
        token === 'nutrition:pregnant_eat_less' ||
        token === 'nutrition:pregnant_iron_folate' ||
        token === 'nutrition:breastfeeding_exclusive' ||
        token === 'nutrition:hiv_nutrition' ||
        token === 'nutrition:diabetes_herbal') {
      return 'HIGH';
    }
    if (token.startsWith('vaccination') || 
        token.startsWith('malaria') ||
        token.startsWith('stds') ||
        token.startsWith('nutrition') ||
        token.includes('cure')) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  public detectClinicalFlags(text: string): { required: boolean, flags: string[] } {
    const t = text.toLowerCase();
    const flags: string[] = [];
    const RED_FLAGS = {
      'EBOLA_SYMPTOMS': ['bleeding', 'vomiting blood', 'ebola', 'haemorrhagic'],
      'SEIZURES': ['seizure', 'convulsion', 'fitting', 'epilepsy'],
      'MATERNAL_DANGER': ['heavy bleeding', 'pregnancy complication', 'labour pain', 'water break'],
      'CRITICAL': ['unconscious', 'cannot breathe', 'difficulty breathing', 'severe pain']
    };
    for (const [key, terms] of Object.entries(RED_FLAGS)) {
      if (terms.some(term => t.includes(term))) flags.push(key);
    }
    return { required: flags.length > 0, flags };
  }

  public detectCulturalContext(text: string): { active: boolean, prefix: string } {
    const t = text.toLowerCase();
    const CULTURAL_KEYWORDS = ['witchcraft', 'curse', 'god', 'prayer', 'spirits', 'ancestors', 'traditional', 'herbs', 'obulogo', 'ebimera', 'lubaale', 'katonda'];
    const isActive = CULTURAL_KEYWORDS.some(kw => t.includes(kw));
    return {
      active: isActive,
      prefix: isActive ? "While traditional and spiritual beliefs are deeply respected, medical evidence shows that " : ""
    };
  }

  private normalize(input: string): string {
    return input.toLowerCase().replace(/[^a-z0-9\s' \-/]/g, " ").replace(/\s+/g, " ").trim();
  }
}
