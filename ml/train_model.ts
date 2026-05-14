import * as fs from 'fs';
import * as path from 'path';

/**
 * HealthGuard AI - Node.js Training Engine
 * Implements Multinomial Logistic Regression with TF-IDF Vectorization in pure TypeScript.
 */

interface DatasetRow {
    claim: string;
    label: string;
}

class Trainer {
    private vocabulary: Map<string, number> = new Map();
    private idf: number[] = [];
    private classes: string[] = [];
    private weights: number[][] = []; // [class][feature]
    private intercepts: number[] = [];

    public async train(csvPath: string) {
        console.log("--- HealthGuard AI: Starting Training ---");
        
        // 1. Load Data
        const rows = this.loadCSV(csvPath);
        console.log(`Loaded ${rows.length} records.`);

        // 2. Build Vocabulary
        this.buildVocabulary(rows);
        console.log(`Vocabulary Size: ${this.vocabulary.size}`);

        // 3. Vectorize (TF-IDF)
        const X = this.fitTransform(rows);
        this.classes = Array.from(new Set(rows.map(r => r.label.toUpperCase()))).sort();
        const y = rows.map(r => this.classes.indexOf(r.label.toUpperCase()));
        console.log(`Classes: ${this.classes.join(', ')}`);

        // 4. Gradient Descent (Multinomial Logistic Regression)
        this.optimize(X, y);

        // 5. Save Model
        this.saveModel();
    }

    private loadCSV(filePath: string): DatasetRow[] {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim() !== '');
        const rows: DatasetRow[] = [];
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
            // Basic CSV parser (handles quotes)
            const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (matches && matches.length >= 2) {
                rows.push({
                    claim: matches[0].replace(/"/g, ''),
                    label: matches[1].replace(/"/g, '')
                });
            }
        }
        return rows;
    }

    private buildVocabulary(rows: DatasetRow[]) {
        let docCount = 0;
        const wordDocs = new Map<string, number>();

        for (const row of rows) {
            const tokens = this.tokenize(row.claim);
            const uniqueTokens = new Set(tokens);
            uniqueTokens.forEach(t => {
                wordDocs.set(t, (wordDocs.get(t) || 0) + 1);
            });
            docCount++;
        }

        let idx = 0;
        wordDocs.forEach((count, word) => {
            this.vocabulary.set(word, idx);
            this.idf[idx] = Math.log(docCount / (1 + count)) + 1;
            idx++;
        });
    }

    private tokenize(text: string): string[] {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2);
    }

    private fitTransform(rows: DatasetRow[]): number[][] {
        const X: number[][] = [];
        for (const row of rows) {
            const tokens = this.tokenize(row.claim);
            const tf = new Array(this.vocabulary.size).fill(0);
            tokens.forEach(t => {
                const idx = this.vocabulary.get(t);
                if (idx !== undefined) tf[idx]++;
            });

            const tfidf = tf.map((count, i) => count * this.idf[i]);
            
            // L2 Norm
            const norm = Math.sqrt(tfidf.reduce((sum, v) => sum + v * v, 0));
            X.push(norm > 0 ? tfidf.map(v => v / norm) : tfidf);
        }
        return X;
    }

    private optimize(X: number[][], y: number[], iterations: number = 200, lr: number = 0.5) {
        const numClasses = this.classes.length;
        const numFeatures = this.vocabulary.size;

        // Initialize weights
        this.weights = Array.from({ length: numClasses }, () => new Array(numFeatures).fill(0));
        this.intercepts = new Array(numClasses).fill(0);

        console.log("Training via Gradient Descent...");

        for (let iter = 0; iter < iterations; iter++) {
            let totalLoss = 0;

            for (let i = 0; i < X.length; i++) {
                const xi = X[i];
                const target = y[i];

                // 1. Calculate Logits
                const logits = this.weights.map((w, c) => {
                    return w.reduce((sum, val, f) => sum + val * xi[f], 0) + this.intercepts[c];
                });

                // 2. Softmax
                const exps = logits.map(l => Math.exp(l));
                const sumExp = exps.reduce((a, b) => a + b, 0);
                const probs = exps.map(e => e / sumExp);

                // 3. Update Weights
                for (let c = 0; c < numClasses; c++) {
                    const error = probs[c] - (c === target ? 1 : 0);
                    this.intercepts[c] -= lr * error;
                    for (let f = 0; f < numFeatures; f++) {
                        if (xi[f] !== 0) {
                            this.weights[c][f] -= lr * error * xi[f];
                        }
                    }
                }
                
                totalLoss += -Math.log(probs[target]);
            }

            if (iter % 50 === 0) {
                console.log(`Iteration ${iter}: Loss = ${(totalLoss / X.length).toFixed(4)}`);
            }
        }
    }

    private saveModel() {
        const class_weights = this.classes.map((label, i) => ({
            label: label,
            intercept: this.intercepts[i],
            coefficients: this.weights[i]
        }));

        const export_data = {
            vocabulary: Object.fromEntries(this.vocabulary),
            idf: this.idf,
            class_weights
        };

        fs.writeFileSync(path.join(__dirname, 'model_weights.json'), JSON.stringify(export_data, null, 2));
        console.log("--- Training Complete: model_weights.json saved ---");
    }
}

const trainer = new Trainer();
trainer.train(path.join(__dirname, 'health_claims_dataset.csv'));
