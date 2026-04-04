package nvo;

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

    private ProjectConfig() {
    }
}
