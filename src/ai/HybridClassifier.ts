import { NativeModules, Platform } from 'react-native';
import { ClassificationResult, RuleEngine } from './RuleEngine';
import { MLModel } from './MLModel';
import { BERTModel } from './BERTModel';

const { HealthGuardEngine } = NativeModules;

/**
 * HybridClassifier — Two-tier classification pipeline:
 *
 * Tier 1: Rule Engine (deterministic, hardcoded MoH rules) -> Instant result.
 * Tier 2: Scientific ML Model (probabilistic, Logistic Regression + TF-IDF) -> Intelligent inference.
 */
export class HybridClassifier {
  private ruleEngine: RuleEngine;
  private mlModel: MLModel;
  private bertModel: BERTModel;

  constructor() {
    this.ruleEngine = new RuleEngine();
    this.mlModel = new MLModel();
    this.bertModel = new BERTModel();
  }

  public async classify(input: string): Promise<ClassificationResult> {
    if (Platform.OS === 'android' && HealthGuardEngine) {
      try {
        return await HealthGuardEngine.classify(input);
      } catch (e) {
        console.error('Native classification failed', e);
      }
    }

    // --- MULTI-MODEL COMPARISON ENGINE ---
    const clinicalInfo = this.ruleEngine.detectClinicalFlags(input);
    const culturalInfo = this.ruleEngine.detectCulturalContext(input);
    
    // 1. Run All Three Engines
    const ruleRes = this.ruleEngine.check(input);
    const mlRes = this.mlModel.predict(input);
    const bertRes = this.bertModel.predict(input);

    // 2. Select Final Result (Preference: Rule > ML > BERT)
    const finalResult = ruleRes || mlRes;
    
    // 3. Perform Consensus Analysis
    const models = [
      { name: 'Rule Engine', res: ruleRes || { label: 'UNCERTAIN', confidence: 0 } },
      { name: 'Logistic Regression', res: mlRes },
      { name: 'DistilBERT (Transformer)', res: bertRes }
    ];

    finalResult.modelComparisons = models.map(m => ({
      model: m.name,
      label: m.res.label,
      confidence: m.res.confidence
    }));

    // Calculate Consensus
    const labels = models.map(m => m.res.label).filter(l => l !== 'UNCERTAIN');
    const uniqueLabels = new Set(labels);
    
    if (uniqueLabels.size === 1 && labels.length === 3) {
      finalResult.consensusStatus = 'UNANIMOUS';
    } else if (uniqueLabels.size === 1 || (uniqueLabels.size === 2 && labels.length === 3)) {
      finalResult.consensusStatus = 'MAJORITY';
    } else if (uniqueLabels.size > 1) {
      finalResult.consensusStatus = 'CONFLICT';
    }

    finalResult.escalationRequired = clinicalInfo.required;
    finalResult.clinicalFlags = clinicalInfo.flags;
    finalResult.culturalContext = culturalInfo.active;
    finalResult.respectfulPrefix = culturalInfo.prefix;

    if (culturalInfo.active && finalResult.reasoning) {
       finalResult.reasoning = culturalInfo.prefix + finalResult.reasoning.charAt(0).toLowerCase() + finalResult.reasoning.slice(1);
    }

    return finalResult;
  }

  public async improve(text: string, actualLabel: string): Promise<void> {
    if (Platform.OS === 'android' && HealthGuardEngine) {
      await HealthGuardEngine.updateFeedback(0, actualLabel);
    } else {
      console.log('Feedback recorded (Web Fallback):', text, actualLabel);
    }
  }
}
