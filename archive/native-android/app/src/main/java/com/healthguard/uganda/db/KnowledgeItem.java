package com.healthguard.uganda.db;

/**
 * Represents a single entry in the embedded health knowledge base.
 */
public class KnowledgeItem {
    public int    id;
    public String topic;          // e.g. "vaccination"
    public String mythTextEn;
    public String correctTextEn;
    public String correctTextLg;
    public String source;

    public KnowledgeItem() {}

    public KnowledgeItem(String topic, String mythTextEn,
                         String correctTextEn, String correctTextLg, String source) {
        this.topic          = topic;
        this.mythTextEn     = mythTextEn;
        this.correctTextEn  = correctTextEn;
        this.correctTextLg  = correctTextLg;
        this.source         = source;
    }
}
