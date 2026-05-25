import { ClassificationResult, RuleEngine } from './RuleEngine';
import { MLModel } from './MLModel';
import { BERTModel } from './BERTModel';

/**
 * HybridClassifier — Rule engine + logistic regression + semantic assist (all on-device JS).
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
    const clinicalInfo = this.ruleEngine.detectClinicalFlags(input);
    const culturalInfo = this.ruleEngine.detectCulturalContext(input);

    const ruleRes = this.ruleEngine.check(input);
    const mlRes = this.mlModel.predict(input);
    const bertRes = this.bertModel.predict(input);

    const finalResult = ruleRes ? { ...ruleRes } : { ...mlRes };

    if (!ruleRes && finalResult.label !== 'UNCERTAIN' && !finalResult.triggerKeyword) {
      const keywords = this.ruleEngine.keywordScore(input);
      if (keywords.triggerKeyword) {
        finalResult.triggerKeyword = keywords.triggerKeyword;
        finalResult.reasoning = `${finalResult.reasoning} Topic recognized as ${keywords.triggerKeyword.split(':')[0]}.`;
      }
    }

    const isHealthSeeking = /(how|can i|where|what|why|is there|how to)/i.test(input);
    if (isHealthSeeking && finalResult.label === 'INACCURATE' && finalResult.confidence < 0.95) {
      finalResult.label = 'UNCERTAIN';
      finalResult.reliabilityNote =
        'Informational query identified. Providing relevant health guidance.';
    }

    finalResult.isReliable =
      finalResult.confidence > 0.85 || finalResult.triggerKeyword !== null;

    const models = [
      { name: 'Rule Engine', res: ruleRes || { label: 'UNCERTAIN' as const, confidence: 0 } },
      { name: 'Logistic Regression', res: mlRes },
      { name: 'Semantic assist', res: bertRes },
    ];

    finalResult.modelComparisons = models.map((m) => ({
      model: m.name,
      label: m.res.label,
      confidence: m.res.confidence,
    }));

    const labels = models.map((m) => m.res.label).filter((l) => l !== 'UNCERTAIN');
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
      finalResult.reasoning =
        culturalInfo.prefix +
        finalResult.reasoning.charAt(0).toLowerCase() +
        finalResult.reasoning.slice(1);
    }

    return finalResult;
  }

  public async improve(text: string, actualLabel: string): Promise<void> {
    console.log('[HybridClassifier] Feedback recorded:', text.substring(0, 40), actualLabel);
  }
}
