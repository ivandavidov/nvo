package nvo;

import java.util.Map;

public final class ProjectConfig {

    public static final String BASE_DIR = "/Users/mac/projects/nvo/";

    public static final String DATA_DIR = BASE_DIR + "data/";
    public static final String DATA_MON_DIR = DATA_DIR + "mon/";
    public static final String DATA_NORMALIZED_DIR = DATA_DIR + "normalized/";
    public static final String DATA_RUO_SOFIA_DIR = DATA_DIR + "ruo-sofia/";

    public static final String DOCS_DIR = BASE_DIR + "docs/";
    public static final String DOCS_JS_DIR = DOCS_DIR + "js/";
    public static final String DOCS_API_V1_DIR = DOCS_DIR + "api/v1/";

    public static final String SITE_BASE_URL = "https://ivandavidov.github.io/nvo/";

    public static final String RUO_DIR_NAME = "balove";

    public static final String[][] GRADES = {
            {"4", "НВО 4 клас", "0", "100"},
            {"7", "НВО 7 клас", "0", "100"},
            {"10", "НВО 10 клас", "0", "100"},
            {"12", "ДЗИ 12 клас", "2", "6"},
    };

    /**
     * От коя година сайтът показва данни (графики, таблици, страници по години). По-ранните
     * години са само в експорта (CSV, API, Kaggle): НВО 7 клас за 2018 г. е по 65-точкова скала,
     * а НВО 10 клас за 2018–2020 г. са копия. Същото като DISPLAY_FROM в docs/js/core/config.js.
     */
    public static final Map<String, Integer> DISPLAY_FROM = Map.of("4", 2019, "7", 2019, "10", 2021, "12", 2019);

    /** Най-много толкова последни години в графиките и таблиците (MAX_YEARS в config.js). */
    public static final int MAX_YEARS = 8;

    /** Години в исторически изглед (HISTORY_YEARS в config.js). */
    public static final int HISTORY_YEARS = 3;

    /** Първата година за показване до latestYear (displayRange в config.js). */
    public static int displayFrom(String grade, int latestYear) {
        return Math.max(DISPLAY_FROM.get(grade), latestYear - MAX_YEARS + 1);
    }

    /** Най-ранната година за исторически изглед — с пълни HISTORY_YEARS години (navFirstYear в config.js). */
    public static int navFirstYear(String grade) {
        return DISPLAY_FROM.get(grade) + HISTORY_YEARS - 1;
    }

    private ProjectConfig() {
    }
}
