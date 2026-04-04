package nvo.api;

import nvo.ProjectConfig;

import java.util.Set;

public class JsonGenerator {

    static final int FIRST_YEAR = 2018;
    static final int LAST_YEAR = 2025;
    static final int NUM_YEARS = LAST_YEAR - FIRST_YEAR + 1;

    static final String NORMALIZED_PATH = ProjectConfig.DATA_NORMALIZED_DIR;
    static final String OUTPUT_BASE = ProjectConfig.DOCS_API_V1_DIR;
    static final String DOCS_BASE = ProjectConfig.DOCS_DIR;
    static final String SITE_BASE_URL = ProjectConfig.SITE_BASE_URL;
    static final String[][] GRADES = ProjectConfig.GRADES;

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
        } else if (Set.of("4", "7", "10", "12").contains(mode)) {
            new GradeDataGenerator().generate(mode);
        } else {
            System.err.println("Invalid argument: " + mode + ". Expected: index, schools, cities, 4, 7, 10, or 12");
            System.exit(1);
        }
    }
}
