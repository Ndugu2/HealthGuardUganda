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
  // Vaccination myths — English
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

  // Vaccination myths — Luganda
  "enkingo ezimba kubeera n'abaana": "vaccination:infertility",
  "enkingo zirina chip": "vaccination:microchips",
  "enkingo zija obulamu": "vaccination:poison",
  "enkingo zita abaana": "vaccination:poison",

  // HIV/AIDS myths — English
  "hiv is caused by witchcraft": "hiv:witchcraft",
  "aids is witchcraft": "hiv:witchcraft",
  "hiv is a curse": "hiv:witchcraft",
  "aids is punishment from god": "hiv:witchcraft",
  "arvs are poison": "hiv:arv_poison",
  "arv drugs are dangerous": "hiv:arv_poison",
  "arvs kill people": "hiv:arv_poison",
  "prayer cures hiv": "hiv:prayer_cure",
  "sex with a virgin cures aids": "hiv:virgin_myth",
  "hiv doesn't exist": "hiv:denial",
  "aids is not real": "hiv:denial",
  "breastfeeding always spreads hiv": "hiv:breastfeeding_myth",

  // HIV myths — Luganda
  "hiv ereetera obulogo": "hiv:witchcraft",
  "aids obulogo": "hiv:witchcraft",
  "dawu za arv zita abantu": "hiv:arv_poison",

  // Malaria myths — English
  "herbs alone cure malaria": "malaria:herbs_only",
  "herbal medicine cures malaria": "malaria:herbs_only",
  "traditional herbs treat malaria": "malaria:herbs_only",
  "mosquito nets cause breathing problems": "malaria:nets_harm",
  "bed nets are dangerous": "malaria:nets_harm",
  "malaria is caused by mangoes": "malaria:mango_myth",
  "eating mangoes causes malaria": "malaria:mango_myth",
  "malaria is caused by dirty water": "malaria:water_myth",
  "you can't get malaria twice": "malaria:reinfection_myth",

  // Malaria myths — Luganda
  "omusujja gwa malaria ewonya n'ebimera": "malaria:herbs_only",
  "katimba kaleetera okutazuula": "malaria:nets_harm",

  // Maternal health myths — English
  "hospital delivery is dangerous": "maternal:hospital_danger",
  "hospitals are dangerous for birth": "maternal:hospital_danger",
  "home birth is safer than hospital": "maternal:hospital_danger",
  "traditional birth attendants are safer": "maternal:tba_safer",
  "eating clay during pregnancy is healthy": "maternal:geophagy",
  "pregnant women should not eat eggs": "maternal:food_taboo",
  "ultrasound harms the baby": "maternal:ultrasound_myth",

  // Maternal myths — Luganda
  "amawooto g'omwana g'eddwaliro ga matayo": "maternal:hospital_danger",
  "okuzaala awaka kusinga eddwaliro": "maternal:hospital_danger",

  // COVID-19 myths — English
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

  // Nutrition myths — English
  "breast milk is not enough for babies": "nutrition:breastmilk",
  "formula is better than breast milk": "nutrition:breastmilk",
  "children don't need vitamins": "nutrition:vitamins",

  // Sanitation myths — English
  "dirty water is fine to drink": "sanitation:water_safety",
  "boiling water is unnecessary": "sanitation:water_safety",
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

  // Nutrition facts
  "breast milk is best for babies": "nutrition:breastmilk",
  "balanced diet prevents malnutrition": "nutrition:diet",
  "vitamin a supplements protect children": "nutrition:vitamins",
};

// ─── KEYWORD SCORING (for fuzzy fallback) ─────────────────────────────────────
// Topic signal words used by the keyword scorer when no exact rule matches
const MYTH_SIGNAL_WORDS = [
  "cure", "cures", "hoax", "fake", "poison", "kill", "kills",
  "dangerous", "witchcraft", "curse", "conspiracy", "microchip",
  "5g", "bioweapon", "sterilize", "barren", "don't need", "not real",
  "doesn't exist", "useless", "harmful", "toxic", "dirty water",
  "mangoes", "herbs", "seeds", "witch", "spirit",
];

const FACT_SIGNAL_WORDS = [
  "prevent", "prevents", "protect", "protects", "safe", "effective",
  "treat", "treatment", "recommended", "proven", "evidence",
  "tested", "approved", "WHO", "health facility", "doctor",
  "hospital", "clinic", "important", "necessary", "essential",
];

export class RuleEngine {
  /**
   * Primary classification: exact phrase matching against known rules.
   * Returns null if no rule matches — caller should fall back to keyword scoring.
   */
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

  /**
   * Secondary classification: keyword signal scoring.
   * Used when no exact rule matches. Counts myth vs fact signal words
   * and returns a probabilistic classification.
   */
  public keywordScore(rawInput: string): ClassificationResult {
    const input = this.normalize(rawInput);
    const words = input.split(' ');

    let mythScore = 0;
    let factScore = 0;
    let matchedMyth: string | null = null;
    let matchedFact: string | null = null;

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

    const total = mythScore + factScore;

    if (total === 0) {
      return {
        label: 'UNCERTAIN',
        confidence: 0.3,
        triggerKeyword: null,
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
        triggerKeyword: null,
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
        triggerKeyword: null,
        fromRule: false,
        reasoning: `Keyword analysis detected evidence-based language: "${matchedFact}" (${factScore} fact indicators vs ${mythScore} myth indicators)`,
        isReliable: confidence > 0.7,
        reliabilityNote: confidence > 0.7 ? "High probability match." : "Low confidence: check official guidelines."
      };
    }

    return {
      label: 'UNCERTAIN',
      confidence: 0.5,
      triggerKeyword: null,
      fromRule: false,
      reasoning: "Mixed signals detected — equal myth and fact indicators. Seek expert verification.",
      riskLevel: 'LOW',
      isReliable: false,
      reliabilityNote: "Mixed signals: AI cannot determine status safely."
    };
  }

  private getRiskLevel(token: string, label: Label): RiskLevel {
    if (label !== 'INACCURATE') return 'LOW';
    
    // High risk categories (Life threatening beliefs)
    if (token.startsWith('hiv:witchcraft') || 
        token.startsWith('hiv:arv_poison') || 
        token.startsWith('ebola') || 
        token.startsWith('maternal:hospital_danger') ||
        token.includes('poison')) {
      return 'HIGH';
    }

    // Medium risk (Misleading information that impacts health outcomes)
    if (token.startsWith('vaccination') || 
        token.startsWith('malaria') ||
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
      if (terms.some(term => t.includes(term))) {
        flags.push(key);
      }
    }

    return {
      required: flags.length > 0,
      flags
    };
  }

  public detectCulturalContext(text: string): { active: boolean, prefix: string } {
    const t = text.toLowerCase();
    const CULTURAL_KEYWORDS = [
      'witchcraft', 'curse', 'god', 'prayer', 'spirits', 'ancestors', 
      'traditional', 'herbs', 'obulogo', 'ebimera', 'lubaale', 'katonda'
    ];

    const isActive = CULTURAL_KEYWORDS.some(kw => t.includes(kw));
    
    return {
      active: isActive,
      prefix: isActive 
        ? "While traditional and spiritual beliefs are deeply respected in our communities, medical evidence from the Ministry of Health shows that "
        : ""
    };
  }

  private normalize(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s' \-/]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}
