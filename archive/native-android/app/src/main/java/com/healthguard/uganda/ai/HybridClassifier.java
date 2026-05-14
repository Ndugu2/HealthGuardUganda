package com.healthguard.uganda.ai;

import android.content.Context;
import android.util.Log;

import com.healthguard.uganda.ai.ClassificationResult.Label;

import org.tensorflow.lite.Interpreter;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * On-device TFLite classifier using TF-IDF vectorisation + Logistic Regression.
 *
 * Falls back gracefully when the model asset is not yet deployed —
 * returns Label.UNCERTAIN so the rule engine is always the primary path
 * during development.
 */
public class HybridClassifier {

    private static final String TAG        = "HybridClassifier";
    private static final String MODEL_FILE = "model.tflite";
    private static final String VOCAB_FILE = "vocab.txt";
    private static final int    VOCAB_SIZE  = 500;   // matches training export

    private final RuleEngine  ruleEngine;
    private Interpreter       tflite;
    private List<String>      vocab;
    private boolean           modelReady = false;

    public HybridClassifier(Context context) {
        ruleEngine = new RuleEngine();
        try {
            vocab  = loadVocab(context);
            tflite = new Interpreter(loadModelFile(context));
            modelReady = true;
            Log.i(TAG, "TFLite model loaded successfully.");
        } catch (Exception e) {
            Log.w(TAG, "TFLite model not yet deployed — using rule-based only. " + e.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Classifies the input claim.
     *  1. Try rule engine first (instant, explainable).
     *  2. Fall through to TFLite if no rule fires.
     *  3. Return UNCERTAIN if the model is unavailable or confidence < 0.60.
     */
    public ClassificationResult classify(String input) {
        if (input == null || input.trim().isEmpty()) {
            return new ClassificationResult(Label.UNCERTAIN, 0f, null, false);
        }

        // Step 1 — Rule engine
        ClassificationResult ruleResult = ruleEngine.check(input);
        if (ruleResult != null) return ruleResult;

        // Step 2 — TFLite model
        if (modelReady && vocab != null) {
            try {
                return runTFLite(input);
            } catch (Exception e) {
                Log.e(TAG, "TFLite inference error: " + e.getMessage());
            }
        }

        // Step 3 — Fallback
        return new ClassificationResult(Label.UNCERTAIN, 0.5f, null, false);
    }

    // -----------------------------------------------------------------------
    // TFLite inference
    // -----------------------------------------------------------------------

    private ClassificationResult runTFLite(String text) {
        float[] vector  = tfidfVectorize(text);
        float[][] input = {vector};
        // Model output: [ACCURATE_score, INACCURATE_score, UNCERTAIN_score]
        float[][] output = new float[1][3];

        tflite.run(input, output);

        float[] scores = output[0];
        int    maxIdx  = argmax(scores);
        float  maxConf = scores[maxIdx];

        Label label = maxConf < 0.60f ? Label.UNCERTAIN
                    : maxIdx == 0     ? Label.ACCURATE
                    : maxIdx == 1     ? Label.INACCURATE
                                      : Label.UNCERTAIN;

        return new ClassificationResult(label, maxConf, null, false);
    }

    /** Bag-of-words TF-IDF encoding using the loaded vocabulary. */
    private float[] tfidfVectorize(String text) {
        String[] tokens = text.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .trim()
                .split("\\s+");

        Map<String, Integer> termCounts = new HashMap<>();
        for (String t : tokens) termCounts.merge(t, 1, Integer::sum);

        float[] vec = new float[VOCAB_SIZE];
        for (int i = 0; i < vocab.size() && i < VOCAB_SIZE; i++) {
            Integer count = termCounts.get(vocab.get(i));
            vec[i] = count != null ? count : 0f;
        }
        // L2-normalise
        float norm = 0f;
        for (float v : vec) norm += v * v;
        norm = (float) Math.sqrt(norm);
        if (norm > 0) for (int i = 0; i < vec.length; i++) vec[i] /= norm;
        return vec;
    }

    // -----------------------------------------------------------------------
    // Asset loading helpers
    // -----------------------------------------------------------------------

    private MappedByteBuffer loadModelFile(Context context) throws IOException {
        android.content.res.AssetFileDescriptor afd =
                context.getAssets().openFd(MODEL_FILE);
        FileInputStream fis    = new FileInputStream(afd.getFileDescriptor());
        FileChannel     channel = fis.getChannel();
        return channel.map(FileChannel.MapMode.READ_ONLY,
                afd.getStartOffset(), afd.getDeclaredLength());
    }

    private List<String> loadVocab(Context context) throws IOException {
        List<String> words = new ArrayList<>();
        InputStream  is    = context.getAssets().open(VOCAB_FILE);
        BufferedReader br  = new BufferedReader(new InputStreamReader(is));
        String line;
        while ((line = br.readLine()) != null) {
            String w = line.trim();
            if (!w.isEmpty()) words.add(w);
        }
        br.close();
        return words;
    }

    // -----------------------------------------------------------------------
    // Utils
    // -----------------------------------------------------------------------

    private int argmax(float[] arr) {
        int idx = 0;
        for (int i = 1; i < arr.length; i++) if (arr[i] > arr[idx]) idx = i;
        return idx;
    }

    public void close() {
        if (tflite != null) tflite.close();
    }
}
