import { Platform } from 'react-native';
import { ClassificationResult } from './RuleEngine';

/**
 * MLModel — Statistical Inference Engine (Web Fallback)
 * Performs Logistic Regression inference using model_weights.json.
 * This ensures "Inference Parity" between Web and Android.
 */
export class MLModel {
    private vocabulary: Record<string, number> = {};
    private idf: number[] = [];
    private classWeights: any[] = [];

    constructor() {
        this.loadWeights();
    }

    private loadWeights() {
        try {
            // On Web, we can require the JSON directly if configured, 
            // or we use the baseline from the ml directory.
            const weights = require('../../ml/model_weights.json');
            this.vocabulary = weights.vocabulary;
            this.idf = weights.idf;
            this.classWeights = weights.class_weights;
        } catch (e) {
            console.warn('MLModel: Could not load weights, using empty baseline.');
        }
    }

    public predict(text: string): ClassificationResult {
        if (!this.classWeights.length) {
            return { label: 'UNCERTAIN', confidence: 0.5, triggerKeyword: null, fromRule: false, reasoning: 'Model weights not loaded.', isReliable: false };
        }

        const features = this.vectorize(text);
        
        let maxScore = -Infinity;
        let bestLabel = 'UNCERTAIN';
        const scores: Record<string, number> = {};

        for (const cw of this.classWeights) {
            let score = cw.intercept;
            for (let i = 0; i < features.length; i++) {
                if (features[i] !== 0 && cw.coefficients[i] !== undefined) {
                    score += features[i] * cw.coefficients[i];
                }
            }
            scores[cw.label] = score;
            if (score > maxScore) {
                maxScore = score;
                bestLabel = cw.label;
            }
        }

        // Softmax for confidence
        const exps = Object.values(scores).map(s => Math.exp(s));
        const sumExp = exps.reduce((a, b) => a + b, 0);
        const confidence = Math.exp(maxScore) / sumExp;

        return {
            label: bestLabel as any,
            confidence: Math.min(confidence, 0.99),
            triggerKeyword: null,
            fromRule: false,
            reasoning: `Statistical inference via Logistic Regression (${(confidence * 100).toFixed(1)}% confidence).`,
            isReliable: confidence > 0.65,
            reliabilityNote: confidence > 0.65 ? "Statistical consensus high." : "AI Uncertainty: Prediction boundary low.",
            similarityScore: confidence,
            detectedFeatures: this.getTopFeatures(features)
        };
    }

    private getTopFeatures(features: number[]): { term: string, weight: number }[] {
      const featureList: { term: string, weight: number }[] = [];
      const vocabEntries = Object.entries(this.vocabulary);
      
      for (let i = 0; i < features.length; i++) {
        if (features[i] > 0) {
          const term = vocabEntries.find(([_, idx]) => idx === i)?.[0] || 'unknown';
          featureList.push({ term, weight: features[i] });
        }
      }

      return featureList.sort((a, b) => b.weight - a.weight).slice(0, 4);
    }

    private vectorize(text: string): number[] {
        const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
        const tf = new Array(Object.keys(this.vocabulary).length).fill(0);
        
        tokens.forEach(t => {
            const idx = this.vocabulary[t];
            if (idx !== undefined) tf[idx]++;
        });

        const vector = tf.map((count, i) => count * this.idf[i]);
        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        return norm > 0 ? vector.map(v => v / norm) : vector;
    }

    /**
     * FEDERATED LEARNING: Local Stochastic Gradient Descent
     * Updates model weights locally without sharing raw data.
     */
    public improve(text: string, label: string, learningRate: number = 0.01) {
      const features = this.vectorize(text);
      const targetIndex = this.classWeights.findIndex(cw => cw.label === label);
      if (targetIndex === -1) return;

      // Simple Gradient Step for Logistic Regression
      const cw = this.classWeights[targetIndex];
      for (let i = 0; i < features.length; i++) {
        if (features[i] !== 0) {
          // Adjust coefficient based on local observation
          cw.coefficients[i] += learningRate * (1 - this.predict(text).confidence) * features[i];
        }
      }
    }

    public exportWeights(): any {
      return {
        vocabulary: this.vocabulary,
        idf: this.idf,
        class_weights: this.classWeights,
        last_trained: new Date().toISOString()
      };
    }

    public importWeights(newWeights: any) {
      this.vocabulary = newWeights.vocabulary;
      this.idf = newWeights.idf;
      this.classWeights = newWeights.class_weights;
      localStorage.setItem('healthguard_model_v3', JSON.stringify(newWeights));
    }
}
