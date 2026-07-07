package nvo.api;

import nvo.ProjectConfig;

import java.util.Set;

public class JsonGenerator {

    static final int FIRST_YEAR = 2018;
    // Global maximum span across all grades (the widest grade defines it). LAST_YEAR/NUM_YEARS
    // size the widest arrays; the per-grade helpers below clamp every loop and range so a grade
    // never reads past its own data. NVO and DZI currently both end at LAST_YEAR, but the axis is
    // kept per-grade (via lastYearForGrade) since DZI is published ~2 weeks ahead of NVO and can
    // lead by a year when a new season's data lands.
    static final int LAST_YEAR = 2026;
    static final int NUM_YEARS = LAST_YEAR - FIRST_YEAR + 1;

    /** Most recent year with data for a grade. */
    static int lastYearForGrade(String grade) {
        return 2026;
    }

    /** Number of year slots for a grade ([FIRST_YEAR .. lastYearForGrade]). */
    static int numYearsForGrade(String grade) {
        return lastYearForGrade(grade) - FIRST_YEAR + 1;
    }

    static final String NORMALIZED_PATH = ProjectConfig.DATA_NORMALIZED_DIR;
    static final String OUTPUT_BASE = ProjectConfig.DOCS_API_V1_DIR;
    static final String DOCS_BASE = ProjectConfig.DOCS_DIR;
    static final String SITE_BASE_URL = ProjectConfig.SITE_BASE_URL;
    static final String[][] GRADES = ProjectConfig.GRADES;

    public static void main(String... args) throws Exception {
        if (args.length == 0) {
            System.err.println("Expected argument: index, schools, school-pages, cities, 4, 7, 10, or 12");
            System.exit(1);
        }

        String mode = args[0];

        if ("index".equals(mode)) {
            new IndexGenerator().generate();
        } else if ("schools".equals(mode)) {
            new SchoolsGenerator().generate();
        } else if ("school-pages".equals(mode)) {
            new SchoolPageGenerator().generate();
        } else if ("cities".equals(mode)) {
            new CitiesGenerator().generate();
        } else if (Set.of("4", "7", "10", "12").contains(mode)) {
            new GradeDataGenerator().generate(mode);
        } else {
            System.err.println("Invalid argument: " + mode + ". Expected: index, schools, school-pages, cities, 4, 7, 10, or 12");
            System.exit(1);
        }
    }
}
