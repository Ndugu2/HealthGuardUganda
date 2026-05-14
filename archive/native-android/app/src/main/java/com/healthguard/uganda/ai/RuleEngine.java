package com.healthguard.uganda.ai;

import com.healthguard.uganda.ai.ClassificationResult.Label;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Fast keyword-trigger rule engine.
 *
 * Each entry maps a phrase (English or Luganda) to a structured token
 * "topic:keyword" so that downstream components can look up the correct
 * knowledge-base response.
 *
 * Rules fire before the TFLite model — they are 100 % confident and
 * fully explainable (satisfying the XAI requirement).
 */
public class RuleEngine {

    // -----------------------------------------------------------------------
    // Rule table  (order matters — first match wins)
    // -----------------------------------------------------------------------
    private static final Map<String, String> INACCURATE_RULES = new LinkedHashMap<>();
    private static final Map<String, String> ACCURATE_RULES   = new LinkedHashMap<>();

    static {
        // --- INACCURATE rules (misinformation triggers) ---

        // Vaccination
        INACCURATE_RULES.put("vaccines cause infertility",       "vaccination:infertility");
        INACCURATE_RULES.put("vaccine causes infertility",        "vaccination:infertility");
        INACCURATE_RULES.put("enkingo ezimba kubeera n'abaana",   "vaccination:infertility");
        INACCURATE_RULES.put("vaccines contain microchips",       "vaccination:microchips");
        INACCURATE_RULES.put("vaccine has a chip",                "vaccination:microchips");
        INACCURATE_RULES.put("enkingo zirina chip",               "vaccination:microchips");
        INACCURATE_RULES.put("vaccines are poison",               "vaccination:poison");
        INACCURATE_RULES.put("enkingo zija obulamu",              "vaccination:poison");
        INACCURATE_RULES.put("vaccine alters dna",                "vaccination:dna");
        INACCURATE_RULES.put("mrna changes your dna",             "vaccination:dna");
        INACCURATE_RULES.put("covid vaccine changes dna",         "vaccination:dna");

        // HIV/AIDS
        INACCURATE_RULES.put("hiv is caused by witchcraft",       "hiv:witchcraft");
        INACCURATE_RULES.put("aids is witchcraft",                "hiv:witchcraft");
        INACCURATE_RULES.put("hiv ereetera obulogo",              "hiv:witchcraft");
        INACCURATE_RULES.put("hiv from witchcraft",               "hiv:witchcraft");
        INACCURATE_RULES.put("arvs are poison",                   "hiv:arv_poison");
        INACCURATE_RULES.put("antiretrovirals are poison",        "hiv:arv_poison");
        INACCURATE_RULES.put("arv zija",                          "hiv:arv_poison");
        INACCURATE_RULES.put("hiv can be cured by prayer",        "hiv:prayer_cure");
        INACCURATE_RULES.put("hiv ewonya essambwa",               "hiv:prayer_cure");

        // Malaria
        INACCURATE_RULES.put("herbs alone cure malaria",          "malaria:herbs_only");
        INACCURATE_RULES.put("herbs cure malaria",                "malaria:herbs_only");
        INACCURATE_RULES.put("omusujja gwa malaria ewonya n'ebimera",  "malaria:herbs_only");
        INACCURATE_RULES.put("mosquito nets are harmful",         "malaria:net_harm");
        INACCURATE_RULES.put("bed nets cause disease",            "malaria:net_harm");
        INACCURATE_RULES.put("malaria from cold",                 "malaria:cold_myth");
        INACCURATE_RULES.put("omusujja gwa malaria gava empewo",  "malaria:cold_myth");

        // Maternal Health
        INACCURATE_RULES.put("hospital delivery is dangerous",    "maternal:hospital_danger");
        INACCURATE_RULES.put("hospital birth is dangerous",       "maternal:hospital_danger");
        INACCURATE_RULES.put("amawooto g'omwana g'eddwaliro ga matayo", "maternal:hospital_danger");
        INACCURATE_RULES.put("traditional birth is safer",        "maternal:tba_safer");
        INACCURATE_RULES.put("midwife is better than hospital",   "maternal:tba_safer");
        INACCURATE_RULES.put("omubbumbi w'omwana asinga ddwaliro", "maternal:tba_safer");
        INACCURATE_RULES.put("breastfeeding spreads hiv",         "maternal:hiv_breastfeed");

        // COVID-19
        INACCURATE_RULES.put("covid was man made",                "covid:man_made");
        INACCURATE_RULES.put("covid-19 is man-made",              "covid:man_made");
        INACCURATE_RULES.put("corona is a hoax",                  "covid:hoax");
        INACCURATE_RULES.put("covid is fake",                     "covid:hoax");
        INACCURATE_RULES.put("covid doesn't exist",               "covid:hoax");
        INACCURATE_RULES.put("5g causes covid",                   "covid:5g");
        INACCURATE_RULES.put("garlic cures covid",                "covid:garlic_cure");
        INACCURATE_RULES.put("alcohol cures coronavirus",         "covid:alcohol_cure");

        // --- ACCURATE rules (facts presented correctly) ---
        ACCURATE_RULES.put("wash hands to prevent disease",       "general:handwashing");
        ACCURATE_RULES.put("handwashing prevents diarrhea",       "general:handwashing");
        ACCURATE_RULES.put("vaccines protect children",           "vaccination:protection");
        ACCURATE_RULES.put("mosquito nets prevent malaria",       "malaria:nets_work");
        ACCURATE_RULES.put("use treated nets to prevent malaria", "malaria:nets_work");
        ACCURATE_RULES.put("hiv transmitted through blood",       "hiv:transmission");
        ACCURATE_RULES.put("hiv spread through unprotected sex",  "hiv:transmission");
        ACCURATE_RULES.put("arv treatment works",                 "hiv:arv_works");
        ACCURATE_RULES.put("antenatal care reduces risks",        "maternal:anc");
        ACCURATE_RULES.put("deliver at health facility",          "maternal:facility_delivery");
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Returns a ClassificationResult if a rule fires, or {@code null} if no
     * rule matches (caller should fall through to the TFLite model).
     */
    public ClassificationResult check(String rawInput) {
        if (rawInput == null || rawInput.isEmpty()) return null;
        String input = normalize(rawInput);

        for (Map.Entry<String, String> entry : INACCURATE_RULES.entrySet()) {
            if (input.contains(entry.getKey())) {
                return new ClassificationResult(
                        Label.INACCURATE, 1.0f, entry.getValue(), true);
            }
        }
        for (Map.Entry<String, String> entry : ACCURATE_RULES.entrySet()) {
            if (input.contains(entry.getKey())) {
                return new ClassificationResult(
                        Label.ACCURATE, 1.0f, entry.getValue(), true);
            }
        }
        return null;
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private String normalize(String input) {
        return input.toLowerCase()
                .replaceAll("[^a-z0-9\\s'\\-/]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
