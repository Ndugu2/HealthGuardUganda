package com.healthguard.uganda.db;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * SQLite helper — creates + manages two tables:
 *  • claims    — CHW encounter log
 *  • responses — pre-seeded MOH-verified health Q&A knowledge base
 */
public class DatabaseHelper extends SQLiteOpenHelper {

    private static final String DB_NAME    = "healthguard.db";
    private static final int    DB_VERSION = 1;

    // ── Table names ──────────────────────────────────────────────────────────
    public static final String TABLE_CLAIMS    = "claims";
    public static final String TABLE_RESPONSES = "responses";

    // ── Claims columns ───────────────────────────────────────────────────────
    public static final String COL_ID             = "id";
    public static final String COL_CLAIM_TEXT     = "claim_text";
    public static final String COL_LABEL          = "label";
    public static final String COL_CONFIDENCE_PCT = "confidence_pct";
    public static final String COL_LOCATION_NOTE  = "location_note";
    public static final String COL_SUBMITTED_AT   = "submitted_at";
    public static final String COL_FLAGGED        = "flagged";

    // ── Responses columns ────────────────────────────────────────────────────
    public static final String COL_TOPIC          = "topic";
    public static final String COL_KEYWORD        = "keyword";
    public static final String COL_MYTH_EN        = "myth_text_en";
    public static final String COL_CORRECT_EN     = "correct_text_en";
    public static final String COL_CORRECT_LG     = "correct_text_lg";
    public static final String COL_SOURCE         = "source";

    private static final String CREATE_CLAIMS =
            "CREATE TABLE " + TABLE_CLAIMS + " (" +
            COL_ID             + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
            COL_CLAIM_TEXT     + " TEXT NOT NULL, " +
            COL_LABEL          + " TEXT, " +
            COL_CONFIDENCE_PCT + " INTEGER, " +
            COL_LOCATION_NOTE  + " TEXT, " +
            COL_SUBMITTED_AT   + " TEXT, " +
            COL_FLAGGED        + " INTEGER DEFAULT 0)";

    private static final String CREATE_RESPONSES =
            "CREATE TABLE " + TABLE_RESPONSES + " (" +
            COL_ID         + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
            COL_TOPIC      + " TEXT NOT NULL, " +
            COL_KEYWORD    + " TEXT, " +
            COL_MYTH_EN    + " TEXT, " +
            COL_CORRECT_EN + " TEXT NOT NULL, " +
            COL_CORRECT_LG + " TEXT, " +
            COL_SOURCE     + " TEXT)";

    public DatabaseHelper(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(CREATE_CLAIMS);
        db.execSQL(CREATE_RESPONSES);
        seedKnowledgeBase(db);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_CLAIMS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_RESPONSES);
        onCreate(db);
    }

    // ── Claims CRUD ──────────────────────────────────────────────────────────

    public long insertClaim(ClaimRecord record) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues  cv = new ContentValues();
        cv.put(COL_CLAIM_TEXT,     record.claimText);
        cv.put(COL_LABEL,          record.label);
        cv.put(COL_CONFIDENCE_PCT, record.confidencePct);
        cv.put(COL_LOCATION_NOTE,  record.locationNote);
        cv.put(COL_SUBMITTED_AT,   new SimpleDateFormat("yyyy-MM-dd HH:mm",
                                       Locale.getDefault()).format(new Date()));
        cv.put(COL_FLAGGED, 0);
        return db.insert(TABLE_CLAIMS, null, cv);
    }

    public List<ClaimRecord> getAllClaims() {
        List<ClaimRecord> list = new ArrayList<>();
        SQLiteDatabase    db   = getReadableDatabase();
        Cursor cursor = db.query(TABLE_CLAIMS, null, null, null, null, null,
                COL_SUBMITTED_AT + " DESC");
        if (cursor.moveToFirst()) {
            do {
                ClaimRecord r = new ClaimRecord();
                r.id            = cursor.getInt   (cursor.getColumnIndexOrThrow(COL_ID));
                r.claimText     = cursor.getString(cursor.getColumnIndexOrThrow(COL_CLAIM_TEXT));
                r.label         = cursor.getString(cursor.getColumnIndexOrThrow(COL_LABEL));
                r.confidencePct = cursor.getInt   (cursor.getColumnIndexOrThrow(COL_CONFIDENCE_PCT));
                r.locationNote  = cursor.getString(cursor.getColumnIndexOrThrow(COL_LOCATION_NOTE));
                r.submittedAt   = cursor.getString(cursor.getColumnIndexOrThrow(COL_SUBMITTED_AT));
                r.flagged       = cursor.getInt   (cursor.getColumnIndexOrThrow(COL_FLAGGED)) == 1;
                list.add(r);
            } while (cursor.moveToNext());
        }
        cursor.close();
        return list;
    }

    /** Stats for the Reports summary card. */
    public int countByLabel(String label) {
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = db.rawQuery(
                "SELECT COUNT(*) FROM " + TABLE_CLAIMS + " WHERE " + COL_LABEL + "=?",
                new String[]{label});
        int count = 0;
        if (c.moveToFirst()) count = c.getInt(0);
        c.close();
        return count;
    }

    // ── Knowledge base queries ────────────────────────────────────────────────

    /** Return all entries matching a topic slug (e.g. "vaccination"). */
    public List<KnowledgeItem> getByTopic(String topic) {
        return queryResponses(COL_TOPIC + "=?", new String[]{topic});
    }

    /** Full-text search across myth + correct text. */
    public List<KnowledgeItem> search(String query) {
        String q = "%" + query + "%";
        return queryResponses(
                COL_MYTH_EN + " LIKE ? OR " + COL_CORRECT_EN + " LIKE ?",
                new String[]{q, q});
    }

    /** Return all entries (optionally filtered by topic; null = all). */
    public List<KnowledgeItem> getAll(String topicFilter) {
        if (topicFilter == null || topicFilter.equalsIgnoreCase("all")) {
            return queryResponses(null, null);
        }
        return getByTopic(topicFilter);
    }

    /** Fetch best-match corrective response for a topic:keyword token. */
    public KnowledgeItem getResponseForKeyword(String topicKeyword) {
        if (topicKeyword == null) return null;
        String[] parts = topicKeyword.split(":", 2);
        String topic   = parts[0];
        String keyword = parts.length > 1 ? parts[1] : "";
        // Try exact keyword match first, fall back to topic match
        List<KnowledgeItem> exact = queryResponses(
                COL_TOPIC + "=? AND " + COL_KEYWORD + "=?",
                new String[]{topic, keyword});
        if (!exact.isEmpty()) return exact.get(0);
        List<KnowledgeItem> byTopic = getByTopic(topic);
        return byTopic.isEmpty() ? null : byTopic.get(0);
    }

    private List<KnowledgeItem> queryResponses(String selection, String[] selArgs) {
        List<KnowledgeItem> list = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        Cursor cursor = db.query(TABLE_RESPONSES, null, selection, selArgs,
                null, null, COL_TOPIC + " ASC");
        if (cursor.moveToFirst()) {
            do {
                KnowledgeItem item = new KnowledgeItem();
                item.id            = cursor.getInt   (cursor.getColumnIndexOrThrow(COL_ID));
                item.topic         = cursor.getString(cursor.getColumnIndexOrThrow(COL_TOPIC));
                item.mythTextEn    = cursor.getString(cursor.getColumnIndexOrThrow(COL_MYTH_EN));
                item.correctTextEn = cursor.getString(cursor.getColumnIndexOrThrow(COL_CORRECT_EN));
                item.correctTextLg = cursor.getString(cursor.getColumnIndexOrThrow(COL_CORRECT_LG));
                item.source        = cursor.getString(cursor.getColumnIndexOrThrow(COL_SOURCE));
                list.add(item);
            } while (cursor.moveToNext());
        }
        cursor.close();
        return list;
    }

    // ── Seed data ─────────────────────────────────────────────────────────────

    private void seedKnowledgeBase(SQLiteDatabase db) {
        Object[][] rows = {
            // {topic, keyword, myth_en, correct_en, correct_lg, source}

            // VACCINATION ────────────────────────────────────────────────────
            {"vaccination", "infertility",
             "Vaccines cause infertility in women.",
             "Vaccines are rigorously tested by WHO and do not affect fertility. Millions of women worldwide have been vaccinated and gone on to have children safely.",
             "Enkingo tezikosa kubeera n'abaana. Abakazi emingi mu nsi yonna baafumirizibwa era ne baabeerawo n'abaana obulungi.",
             "WHO, 2023; Ministry of Health Uganda"},

            {"vaccination", "microchips",
             "COVID-19 vaccines contain microchips for government tracking.",
             "Vaccines contain no microchips. They contain biological components (mRNA or weakened virus) that stimulate your immune system.",
             "Enkingo tezirimu chip za computer. Zirina ebintu by'obulamu ebiyita eddembe lyako okukuuma.",
             "WHO, 2021"},

            {"vaccination", "dna",
             "mRNA vaccines alter your DNA permanently.",
             "mRNA vaccines never enter the cell nucleus and cannot alter DNA. The mRNA breaks down within days. Only your immune response remains.",
             "Enkingo za mRNA tezikyusa DNA. Enzikula mu nda y'eseli nk'ennaku nnya, yekka eddembe ly'omubiri lyeggwaamu.",
             "CDC, 2022; WHO"},

            {"vaccination", "poison",
             "Vaccines are poison made to harm African children.",
             "Vaccines protect children from deadly diseases. Uganda's national immunisation programme has dramatically reduced child deaths from measles, polio, and tetanus.",
             "Enkingo zikuuma abaana ku ndwadde ennyangu. Polio, kasuku, ne tetanasi bisinzibwa enkingo.",
             "MOH Uganda, 2022; UNICEF"},

            {"vaccination", "protection",
             null,
             "Routine childhood vaccines protect children from polio, measles, hepatitis B, and other serious diseases. They are free at all health centres in Uganda.",
             "Enkingo z'abaana zikuuma ku polio, kasuku, hepatitis B, n'endwadde enzinji. Zitaliikirirwa mu mawulo gonna ag'obulamu mu Uganda.",
             "MOH Uganda; WHO"},

            // HIV/AIDS ───────────────────────────────────────────────────────
            {"hiv", "witchcraft",
             "HIV/AIDS is caused by witchcraft or a curse.",
             "HIV (Human Immunodeficiency Virus) is caused by a specific virus transmitted through blood, breast milk, and sexual fluids — not by witchcraft or curses.",
             "HIV ereetera omukutu gwa HIV, si obulogo. Gusambazibwa mu musaayi, amazzi ga kwanywa, n'eby'okwegatta.",
             "UNAIDS, 2023; MOH Uganda"},

            {"hiv", "arv_poison",
             "Antiretroviral drugs (ARVs) are poison designed to kill Africans.",
             "ARVs are life-saving medicines that reduce HIV to undetectable levels. People on ARVs live long, healthy lives and can have HIV-negative children.",
             "ARV yewonya abalwadde ba HIV. Abatumiira ARV babeera obulungi era basobola okubeera n'abaana abatalina HIV.",
             "WHO; MOH Uganda ART Guidelines, 2022"},

            {"hiv", "prayer_cure",
             "HIV can be cured by prayer or traditional herbs.",
             "There is currently no cure for HIV, but ARV treatment controls the virus effectively. Prayer and support are important for wellbeing, but cannot replace medicine.",
             "Tewali dawu ya HIV kaakano, naye ARV ewanika omukutu. Okusaba kuyamba omutima, naye tekusisiriza dawu.",
             "WHO; UNAIDS"},

            {"hiv", "transmission",
             null,
             "HIV is transmitted through: unprotected sex, sharing needles, blood transfusions, and from mother to child during pregnancy or breastfeeding. It is NOT transmitted by hugging, sharing food, or mosquito bites.",
             "HIV esambazibwa bw'okwegatta awatali kiyunga, okutumiira empiso emu, n'omu mazzi g'okuzaalwa. Tessambazibwa bw'okunyumirirwa, okuliiramu, wadde ensowera.",
             "UNAIDS; CDC"},

            {"hiv", "arv_works",
             null,
             "Antiretroviral therapy (ART) reduces HIV to undetectable levels. People on treatment cannot transmit HIV to their partners (U=U: Undetectable = Untransmittable).",
             "ARV ewanika omukutu gwa HIV okutuuka nga togusanga. Omuntu atatumiira ARV tasobola kusambaza HIV eri munne (U=U).",
             "UNAIDS; WHO"},

            // MALARIA ────────────────────────────────────────────────────────
            {"malaria", "herbs_only",
             "Malaria can be fully cured using herbs alone without hospital medicine.",
             "Malaria requires approved antimalarial medicines (e.g. Artemisinin-based combinations). Herbs may relieve symptoms but cannot eliminate the parasite. Untreated malaria can be fatal.",
             "Omusujja gwa malaria gusabaganya dawu ez'obubyaayi ezikiririzibwa (nga ACT). Ebimera bisobola okuyamba, naye tebikomya akawuka. Malaria etayinzibwa ekutta.",
             "MOH Uganda; WHO Malaria Treatment Guidelines, 2023"},

            {"malaria", "net_harm",
             "Mosquito bed nets are harmful and cause breathing problems.",
             "Insecticide-treated nets (ITNs) are one of the most effective and safe malaria prevention tools. They are approved by WHO and have saved millions of lives across Africa.",
             "Obutimba obufumitiddwa obw'endege (ITN) si bwa kugoba. Bwesigirwa nnyo WHO era bwokoye obulamu bw'abantu emingi mu Africa.",
             "WHO; PMI Uganda"},

            {"malaria", "cold_myth",
             "Malaria is caused by cold weather or eating mangoes.",
             "Malaria is caused by Plasmodium parasites transmitted through infected female Anopheles mosquito bites. Cold weather and food do not cause malaria.",
             "Malaria ereetera akawuka Plasmodium mu nsowera y'Anopheles. Empewo n'emmere teziretera malaria.",
             "WHO; CDC"},

            {"malaria", "nets_work",
             null,
             "Sleeping under an insecticide-treated net (ITN) every night reduces malaria risk by up to 50%. Nets should be re-treated or replaced every 2–3 years.",
             "Okulala mu butimba obufumitiddwa buli kiro kukendeeza omusujja gwa malaria okutuuka 50%. Obutimba busabaganya okufumitirizibwa oba okugibwako buli myaka 2-3.",
             "WHO; MOH Uganda"},

            // MATERNAL HEALTH ────────────────────────────────────────────────
            {"maternal", "hospital_danger",
             "Delivering at a hospital is more dangerous than delivering at home.",
             "Skilled health facility deliveries are safer. Uganda's maternal mortality ratio is 336 per 100,000 live births — most deaths occur in home deliveries without skilled attendants.",
             "Okuzaala mu ddwaliro kusinga okukuuma omukazi n'omwana. Abasumba abasinga bafiira awaka awatali mulamwa.",
             "MOH Uganda; UBOS 2022"},

            {"maternal", "tba_safer",
             "Traditional birth attendants are safer and more trustworthy than hospital midwives.",
             "Traditional birth attendants cannot manage obstetric emergencies (haemorrhage, eclampsia, obstructed labour). Skilled midwives and doctors at health facilities can. Please deliver at a health centre.",
             "Abasuubuzi b'omu kitundu basobola okuyamba, naye tebasobola kufaayo enkizo z'emirembe. Mulamwa ow'eddwaliro oyo ayinza okufaayo.",
             "MOH Uganda; WHO Safe Motherhood"},

            {"maternal", "hiv_breastfeed",
             "Breastfeeding always spreads HIV from mother to child.",
             "Mothers on ARV treatment who are virally suppressed can safely breastfeed. The risk of transmission is very low when the mother takes her medication correctly.",
             "Okunyonnyola tokwata HIV singa nnyina awa ARV n'omukutu gusizibwako. Singa ddawa etunuulirwa bulungi, ekikolwa kyali kireetera HIV kiteeka wansi.",
             "WHO; MOH Uganda PMTCT Guidelines"},

            {"maternal", "anc",
             null,
             "Antenatal care (ANC) visits — at least 4 during pregnancy — help detect complications early, ensure proper nutrition, and give preventive treatments like iron supplements and malaria prophylaxis.",
             "Okulabirirwa endyalo (ANC) innya n'okusingako mu bujja bwomuka bikuuma nnyina n'omwana. Wanaawo balagirira ensawo z'obulamu nga ayuma n'ennyo.",
             "MOH Uganda; WHO ANC Guidelines"},

            {"maternal", "facility_delivery",
             null,
             "All women should deliver at a health facility with a skilled birth attendant. Free maternity services are available at government health centres across Uganda.",
             "Bakazi bonna basabirwa okuzaala mu mawulo ag'obulamu awali mulamwa. Obulamu bw'okuzaala bwaterefu mu mawulo agavumenti mu Uganda yonna.",
             "MOH Uganda"},

            // COVID-19 ───────────────────────────────────────────────────────
            {"covid", "man_made",
             "COVID-19 was engineered in a laboratory to depopulate Africa.",
             "COVID-19 (SARS-CoV-2) is a naturally occurring coronavirus that originated in animals and spread to humans. There is no scientific evidence it was engineered.",
             "COVID-19 si ya kukolebwa mu laboratori. Omukutu gwavudde mu bisolo era gwasambazibwa eri abantu. Tewali bukakafu bw'obusayansi.",
             "WHO; Nature Medicine, 2020"},

            {"covid", "hoax",
             "COVID-19 is a hoax / does not exist.",
             "COVID-19 is a real infectious disease that has caused millions of deaths worldwide, including thousands in Uganda. It is caused by the SARS-CoV-2 virus.",
             "COVID-19 kiri kimu. Omukutu SARS-CoV-2 gwakwatibwa abantu emingi ku nsi yonna, era n'Uganda gyatawanyizibwawo abantu.",
             "WHO; MOH Uganda"},

            {"covid", "5g",
             "5G towers spread COVID-19.",
             "5G is a radio-wave communications technology and cannot transmit any virus. COVID-19 spreads through respiratory droplets from infected people.",
             "Entebbe za 5G tezisambaza mikutu. COVID-19 esambazibwa mu bizikiza eby'okussa byavudde mu bantu abalwadde.",
             "WHO; ITU"},

            {"covid", "garlic_cure",
             "Eating garlic or drinking hot lemon cures COVID-19.",
             "No food or herb has been proven to cure COVID-19. Eating well supports your immune system but cannot eliminate the virus once infected.",
             "Tafiira wadde enjuki teziwonya COVID-19. Okulya obulungi kuyamba eddembe ly'omubiri, naye tekukomya omukutu.",
             "WHO; MOH Uganda"},

            {"covid", "alcohol_cure",
             "Drinking alcohol kills the coronavirus inside the body.",
             "Drinking alcohol does not kill viruses inside your body and can be harmful. Hand sanitisers with at least 60% alcohol are effective for surface disinfection.",
             "Kumwa wayagi tekukomya omukutu mu mubiri. Ekisobola okuyamba kwe kusiga obugoye bw'engalo (hand sanitizer) ku ngalo.",
             "WHO"},

            // GENERAL ────────────────────────────────────────────────────────
            {"general", "handwashing",
             null,
             "Washing hands with soap and clean water for at least 20 seconds removes germs that cause diarrhoea, respiratory infections, and COVID-19.",
             "Okwoza engalo n'ssabbuuni n'amazzi amalongoofu okumala obutikku 20 bukuuma ku bakayibwa ab'amasegejje, endwadde z'omubiri, ne COVID-19.",
             "WHO; UNICEF WASH"},
        };

        for (Object[] row : rows) {
            ContentValues cv = new ContentValues();
            cv.put(COL_TOPIC,      (String) row[0]);
            cv.put(COL_KEYWORD,    (String) row[1]);
            cv.put(COL_MYTH_EN,    (String) row[2]);
            cv.put(COL_CORRECT_EN, (String) row[3]);
            cv.put(COL_CORRECT_LG, (String) row[4]);
            cv.put(COL_SOURCE,     (String) row[5]);
            db.insert(TABLE_RESPONSES, null, cv);
        }
    }
}
