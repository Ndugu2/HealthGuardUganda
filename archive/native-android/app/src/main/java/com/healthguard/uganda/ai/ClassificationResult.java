package com.healthguard.uganda.ai;

/**
 * Immutable value object representing the output of the HybridClassifier.
 */
public final class ClassificationResult {

    public enum Label { ACCURATE, INACCURATE, UNCERTAIN }

    private final Label   label;
    private final float   confidence;       // 0.0 – 1.0
    private final String  triggerKeyword;   // non-null if rule-based; null if AI-based
    private final boolean fromRule;

    public ClassificationResult(Label label, float confidence, String triggerKeyword, boolean fromRule) {
        this.label          = label;
        this.confidence     = confidence;
        this.triggerKeyword = triggerKeyword;
        this.fromRule       = fromRule;
    }

    public Label   getLabel()          { return label; }
    public float   getConfidence()     { return confidence; }
    public int     getConfidencePct()  { return Math.round(confidence * 100f); }
    public String  getTriggerKeyword() { return triggerKeyword; }
    public boolean isFromRule()        { return fromRule; }

    /** Returns topic slug for SQLite knowledge-base lookup (e.g. "vaccination"). */
    public String getTopic() {
        if (triggerKeyword == null) return null;
        // The RuleEngine embeds the topic as the first word of triggerKeyword when structured
        // as "topic:keyword". Fall back to a generic keyword search.
        if (triggerKeyword.contains(":")) {
            return triggerKeyword.split(":")[0];
        }
        return null;
    }
}
