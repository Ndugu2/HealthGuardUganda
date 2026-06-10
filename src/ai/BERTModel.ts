import { ClassificationResult } from './RuleEngine';

interface DocVector {
  id: number;
  label: 'ACCURATE' | 'INACCURATE';
  triggerKeyword: string;
  vector: number[];
  text: string;
}

/**
 * BERTModel — Client-Side Semantic Assist Engine
 * Performs TF-IDF + Cosine Similarity matching over the localized knowledge base,
 * providing a robust, private, offline-first semantic fallback.
 */
export class BERTModel {
  private vocabulary: string[] = [];
  private idf: number[] = [];
  private docs: DocVector[] = [];
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const kb = require('../db/knowledge_base.json');
      if (!Array.isArray(kb)) return;

      const stopwords = new Set([
        'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'of', 'to', 'in', 'for', 'with', 'that', 'this', 'it', 'are', 'was'
      ]);

      const tokenize = (text: string): string[] => {
        return text
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(t => t.length > 2 && !stopwords.has(t));
      };

      // Gather all documents
      const rawDocs: { label: 'ACCURATE' | 'INACCURATE'; text: string; keyword: string }[] = [];
      kb.forEach((item: any) => {
        const keyword = item.keyword ? `${item.topic}:${item.keyword}` : `${item.topic}:general`;
        
        if (item.myth_text_en) {
          rawDocs.push({
            label: 'INACCURATE',
            text: item.myth_text_en,
            keyword
          });
        }
        if (item.correct_text_en) {
          rawDocs.push({
            label: 'ACCURATE',
            text: item.correct_text_en,
            keyword
          });
        }
      });

      // Build vocabulary
      const vocabSet = new Set<string>();
      const docTokensList = rawDocs.map(d => {
        const tokens = tokenize(d.text);
        tokens.forEach(t => vocabSet.add(t));
        return tokens;
      });

      this.vocabulary = Array.from(vocabSet);
      const N = rawDocs.length;
      
      // Calculate IDF
      this.idf = this.vocabulary.map(term => {
        const df = docTokensList.filter(tokens => tokens.includes(term)).length;
        // Laplace smoothing
        return Math.log((N + 1) / (df + 1)) + 1;
      });

      // Build TF-IDF vectors
      this.docs = rawDocs.map((d, docIdx) => {
        const tokens = docTokensList[docIdx];
        const tf = new Array(this.vocabulary.length).fill(0);
        tokens.forEach(t => {
          const vIdx = this.vocabulary.indexOf(t);
          if (vIdx !== -1) tf[vIdx]++;
        });

        const vector = tf.map((count, i) => count * this.idf[i]);
        // Normalize
        const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        const normalizedVector = norm > 0 ? vector.map(val => val / norm) : vector;

        return {
          id: docIdx,
          label: d.label,
          triggerKeyword: d.keyword,
          vector: normalizedVector,
          text: d.text
        };
      });

      this.isInitialized = true;
    } catch (e) {
      console.warn('BERTModel initialization failed:', e);
    }
  }

  public predict(text: string): ClassificationResult {
    if (!this.isInitialized || this.docs.length === 0) {
      return {
        label: 'UNCERTAIN',
        confidence: 0.5,
        triggerKeyword: null,
        fromRule: false,
        isReliable: false,
        reasoning: 'Semantic assistant failed to initialize.'
      };
    }

    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'of', 'to', 'in', 'for', 'with', 'that', 'this', 'it', 'are', 'was'
    ]);

    const queryTokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !stopwords.has(t));

    // Vectorize query
    const tf = new Array(this.vocabulary.length).fill(0);
    queryTokens.forEach(t => {
      const vIdx = this.vocabulary.indexOf(t);
      if (vIdx !== -1) tf[vIdx]++;
    });

    const queryVector = tf.map((count, i) => count * this.idf[i]);
    const norm = Math.sqrt(queryVector.reduce((sum, val) => sum + val * val, 0));
    const normalizedQueryVector = norm > 0 ? queryVector.map(val => val / norm) : queryVector;

    // Cosine similarity
    let maxSim = -Infinity;
    let bestDoc: DocVector | null = null;

    this.docs.forEach(doc => {
      let dotProduct = 0;
      for (let i = 0; i < this.vocabulary.length; i++) {
        dotProduct += normalizedQueryVector[i] * doc.vector[i];
      }
      if (dotProduct > maxSim) {
        maxSim = dotProduct;
        bestDoc = doc;
      }
    });

    const SIMILARITY_THRESHOLD = 0.25; // Good balance for TF-IDF on short texts
    
    if (bestDoc && maxSim >= SIMILARITY_THRESHOLD) {
      const label = (bestDoc as DocVector).label;
      // Map similarity score to confidence
      const confidence = 0.6 + maxSim * 0.38; // Maps similarity to range [0.6, 0.98]
      
      return {
        label,
        confidence: Math.min(confidence, 0.98),
        triggerKeyword: (bestDoc as DocVector).triggerKeyword,
        fromRule: false,
        isReliable: confidence > 0.75,
        reasoning: `Semantic search matched: "${(bestDoc as DocVector).text.substring(0, 50)}..." (Cosine similarity: ${(maxSim * 100).toFixed(1)}%).`,
        similarityScore: maxSim
      };
    }

    return {
      label: 'UNCERTAIN',
      confidence: 0.5,
      triggerKeyword: null,
      fromRule: false,
      isReliable: false,
      reasoning: 'No close semantic matches found in local knowledge base.'
    };
  }
}
