package com.healthguard.uganda.db;

/**
 * Represents a single CHW encounter record stored in the local SQLite database.
 */
public class ClaimRecord {
    public int    id;
    public String claimText;
    public String label;          // "ACCURATE" | "INACCURATE" | "UNCERTAIN"
    public int    confidencePct;
    public String locationNote;
    public String submittedAt;    // ISO-8601 datetime string
    public boolean flagged;

    public ClaimRecord() {}

    public ClaimRecord(String claimText, String label,
                       int confidencePct, String locationNote) {
        this.claimText      = claimText;
        this.label          = label;
        this.confidencePct  = confidencePct;
        this.locationNote   = locationNote;
    }
}
