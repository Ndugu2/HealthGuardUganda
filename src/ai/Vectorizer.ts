import weights from '../../ml/model_weights.json';

/**
 * Vectorizer — Implements TF-IDF vectorization in TypeScript.
 * This converts raw text into a numerical array (tensor) that our 
 * Logistic Regression model can process.
 */
export class Vectorizer {
  private vocab: Record<string, number>;
  private idf: number[];

  constructor() {
    this.vocab = weights.vocabulary;
    this.idf = weights.idf;
  }

  /**
   * Transforms input text into a TF-IDF vector.
   */
  public transform(text: string): number[] {
    const tokens = this.tokenize(text);
    const vector = new Array(Object.keys(this.vocab).length).fill(0);
    
    // Count frequencies (TF)
    const counts: Record<string, number> = {};
    tokens.forEach(token => {
      if (this.vocab[token] !== undefined) {
        counts[token] = (counts[token] || 0) + 1;
      }
    });

    // Calculate TF-IDF: tf * idf
    // We also apply L2 normalization (standard in scikit-learn)
    let sumSquares = 0;
    for (const [token, count] of Object.entries(counts)) {
      const idx = this.vocab[token];
      const tf = count;
      const idf = this.idf[idx];
      const val = tf * idf;
      vector[idx] = val;
      sumSquares += val * val;
    }

    // L2 Normalization
    if (sumSquares > 0) {
      const norm = Math.sqrt(sumSquares);
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }
}
