const fs = require('fs');
const path = require('path');

/**
 * HealthGuard AI - Node.js Training Engine (JS Version)
 * Implements Multinomial Logistic Regression with TF-IDF Vectorization.
 */

class Trainer {
    constructor() {
        this.vocabulary = new Map();
        this.idf = [];
        this.classes = [];
        this.weights = [];
        this.intercepts = [];
    }

    async train(csvPath) {
        console.log("--- HealthGuard AI: Starting Training (JS Engine) ---");
        
        const rows = this.loadCSV(csvPath);
        console.log(`Loaded ${rows.length} records.`);

        this.buildVocabulary(rows);
        console.log(`Vocabulary Size: ${this.vocabulary.size}`);

        const X = this.fitTransform(rows);
        this.classes = Array.from(new Set(rows.map(r => r.label.toUpperCase()))).sort();
        const y = rows.map(r => this.classes.indexOf(r.label.toUpperCase()));
        console.log(`Classes: ${this.classes.join(', ')}`);

        this.optimize(X, y);
        this.saveModel();
    }

    loadCSV(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim() !== '');
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
            const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (matches && matches.length >= 2) {
                rows.push({
                    claim: matches[0].replace(/"/g, ''),
                    label: matches[1].replace(/"/g, '').trim()
                });
            }
        }
        return rows;
    }

    buildVocabulary(rows) {
        let docCount = 0;
        const wordDocs = new Map();

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

    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2);
    }

    fitTransform(rows) {
        const X = [];
        for (const row of rows) {
            const tokens = this.tokenize(row.claim);
            const tf = new Array(this.vocabulary.size).fill(0);
            tokens.forEach(t => {
                const idx = this.vocabulary.get(t);
                if (idx !== undefined) tf[idx]++;
            });

            const tfidf = tf.map((count, i) => count * this.idf[i]);
            const norm = Math.sqrt(tfidf.reduce((sum, v) => sum + v * v, 0));
            X.push(norm > 0 ? tfidf.map(v => v / norm) : tfidf);
        }
        return X;
    }

    optimize(X, y, iterations = 300, lr = 0.8) {
        const numClasses = this.classes.length;
        const numFeatures = this.vocabulary.size;

        this.weights = Array.from({ length: numClasses }, () => new Array(numFeatures).fill(0));
        this.intercepts = new Array(numClasses).fill(0);

        console.log("Training via Gradient Descent...");

        for (let iter = 0; iter < iterations; iter++) {
            let totalLoss = 0;

            for (let i = 0; i < X.length; i++) {
                const xi = X[i];
                const target = y[i];

                const logits = this.weights.map((w, c) => {
                    return w.reduce((sum, val, f) => sum + val * xi[f], 0) + this.intercepts[c];
                });

                const exps = logits.map(l => Math.exp(l));
                const sumExp = exps.reduce((a, b) => a + b, 0);
                const probs = exps.map(e => e / sumExp);

                for (let c = 0; c < numClasses; c++) {
                    const error = probs[c] - (c === target ? 1 : 0);
                    this.intercepts[c] -= lr * (error / X.length);
                    for (let f = 0; f < numFeatures; f++) {
                        if (xi[f] !== 0) {
                            this.weights[c][f] -= lr * (error * xi[f] / X.length);
                        }
                    }
                }
                
                totalLoss += -Math.log(probs[target] || 1e-10);
            }

            if (iter % 100 === 0) {
                console.log(`Iteration ${iter}: Loss = ${(totalLoss / X.length).toFixed(4)}`);
            }
        }
    }

    saveModel() {
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
