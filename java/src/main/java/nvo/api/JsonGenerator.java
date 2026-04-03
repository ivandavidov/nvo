package nvo.api;

import java.util.Set;

public class JsonGenerator {

    static final int FIRST_YEAR = 2018;
    static final int LAST_YEAR = 2025;
    static final int NUM_YEARS = LAST_YEAR - FIRST_YEAR + 1;

    private static final String BASE_PATH = "/Users/mac/projects/nvo/";
    static final String NORMALIZED_PATH = BASE_PATH + "data/normalized/";
    static final String OUTPUT_BASE = BASE_PATH + "docs/api/v1/";
    static final String DOCS_BASE = BASE_PATH + "docs/";
    static final String SITE_BASE_URL = "https://ivandavidov.github.io/nvo/";

    static final String[][] GRADES = {
            {"4", "НВО 4 клас", "0", "100"},
            {"7", "НВО 7 клас", "0", "100"},
            {"10", "НВО 10 клас", "0", "100"},
            {"12", "ДЗИ 12 клас", "2", "6"},
    };

    public static void main(String... args) throws Exception {
        if (args.length == 0) {
            System.err.println("Expected argument: index, schools, cities, 4, 7, 10, or 12");
            System.exit(1);
        }

        String mode = args[0];

        if ("index".equals(mode)) {
            new IndexGenerator().generate();
        } else if ("schools".equals(mode)) {
            new SchoolsGenerator().generate();
        } else if ("cities".equals(mode)) {
            new CitiesGenerator().generate();
        } else if ("sitemap".equals(mode)) {
            new SitemapGenerator().generate();
        } else if (Set.of("4", "7", "10", "12").contains(mode)) {
            new GradeDataGenerator().generate(mode);
        } else {
            System.err.println("Invalid argument: " + mode + ". Expected: index, schools, cities, sitemap, 4, 7, 10, or 12");
            System.exit(1);
        }
    }
}
