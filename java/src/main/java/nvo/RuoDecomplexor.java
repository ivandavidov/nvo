package nvo;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;

import java.io.FileReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class RuoDecomplexor {

    private static final String NORMALIZED_DIR = ProjectConfig.DATA_NORMALIZED_DIR;
    private static final String OUTPUT_DIR = ProjectConfig.DOCS_JS_DIR;

    public static void main(String... args) throws Exception {
        if (args.length == 0) {
            System.err.println("Expected argument: city name (e.g. sofia)");
            System.exit(1);
        }
        new RuoDecomplexor().generate(args[0]);
    }

    private void generate(String city) throws Exception {
        List<Integer> years = findYears(city);
        if (years.isEmpty()) {
            System.err.println("No normalized CSV files found for ruo-" + city);
            System.exit(1);
        }

        // school_code -> school_name
        Map<String, String> schoolNames = new LinkedHashMap<>();
        // school_code -> profile_code -> profile_name
        Map<String, Map<String, String>> profileNames = new LinkedHashMap<>();
        // school_code -> profile_code -> [yearIndex][klasiraneIndex] -> double[6] or null
        Map<String, Map<String, List<List<double[]>>>> scores = new LinkedHashMap<>();

        for (int yi = 0; yi < years.size(); yi++) {
            loadYear(city, years.get(yi), yi, years.size(), schoolNames, profileNames, scores);
        }

        // Sort schools alphabetically by name
        List<String> sortedCodes = new ArrayList<>(schoolNames.keySet());
        sortedCodes.sort((a, b) -> schoolNames.get(a).compareToIgnoreCase(schoolNames.get(b)));

        writeJs(city, years, sortedCodes, schoolNames, profileNames, scores);
    }

    // ── Data loading ─────────────────────────────────────────────────────────

    private List<Integer> findYears(String city) throws IOException {
        List<Integer> years = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(
                Path.of(NORMALIZED_DIR), "ruo-" + city + "-*-normalized.csv")) {
            for (Path p : stream) {
                String[] parts = p.getFileName().toString().split("-");
                years.add(Integer.parseInt(parts[2]));
            }
        }
        Collections.sort(years);
        return years;
    }

    private void loadYear(String city, int year, int yearIndex, int totalYears,
                          Map<String, String> schoolNames,
                          Map<String, Map<String, String>> profileNames,
                          Map<String, Map<String, List<List<double[]>>>> scores) throws Exception {
        String csvPath = NORMALIZED_DIR + "ruo-" + city + "-" + year + "-normalized.csv";

        try (CSVReader reader = new CSVReaderBuilder(new FileReader(csvPath)).withSkipLines(1).build()) {
            String[] row;
            while ((row = reader.readNext()) != null) {
                String schoolCode  = row[2];
                String schoolName  = row[3];
                String profileCode = row[4];
                String profileName = row[5];
                int klasirane      = Integer.parseInt(row[1]) - 1; // 0-based index

                double[] entry = {
                    parseScore(row[6]),  parseScore(row[7]),  parseScore(row[8]),
                    parseScore(row[9]),  parseScore(row[10]), parseScore(row[11])
                };

                schoolNames.put(schoolCode, schoolName);
                profileNames.computeIfAbsent(schoolCode, k -> new LinkedHashMap<>())
                            .put(profileCode, profileName);
                scores.computeIfAbsent(schoolCode, k -> new LinkedHashMap<>())
                      .computeIfAbsent(profileCode, k -> initSlots(totalYears))
                      .get(yearIndex).set(klasirane, entry);
            }
        }
    }

    /** Initializes an empty [totalYears][4] structure with null entries. */
    private List<List<double[]>> initSlots(int totalYears) {
        List<List<double[]>> result = new ArrayList<>();
        for (int i = 0; i < totalYears; i++) {
            List<double[]> klasirania = new ArrayList<>();
            for (int j = 0; j < 4; j++) klasirania.add(null);
            result.add(klasirania);
        }
        return result;
    }

    // ── JS generation ────────────────────────────────────────────────────────

    private void writeJs(String city, List<Integer> years,
                         List<String> sortedCodes,
                         Map<String, String> schoolNames,
                         Map<String, Map<String, String>> profileNames,
                         Map<String, Map<String, List<List<double[]>>>> scores) throws IOException {
        StringBuilder sb = new StringBuilder();

        appendHeader(sb, city);
        appendYears(sb, years);
        appendSchools(sb, sortedCodes, years, schoolNames, profileNames, scores);

        String outputPath = OUTPUT_DIR + "ruo-" + city + ".js";
        Files.writeString(Path.of(outputPath), sb.toString());
        System.out.println("Written: " + outputPath + " (" + sortedCodes.size() + " schools)");
    }

    private void appendHeader(StringBuilder sb, String city) {
        String cityLabel = Character.toUpperCase(city.charAt(0)) + city.substring(1);
        sb.append("// Данни за минимален и максимален бал по паралелки след 7 клас — РУО ").append(cityLabel).append("\n");
        sb.append("// Генериран от RuoDecomplexor. НЕ редактирай ръчно.\n");
        sb.append("//\n");
        sb.append("// ruoYears — масив от години с данни\n");
        sb.append("//\n");
        sb.append("// ruoSchools — обект с ключ = код на училище\n");
        sb.append("//   n        — кратко наименование (от School.schoolCodes; при липса — от CSV)\n");
        sb.append("//   c        — true ако е частно училище\n");
        sb.append("//   p        — паралелки, обект с ключ = код на паралелка\n");
        sb.append("//     n  — наименование на паралелката\n");
        sb.append("//     d  — данни: масив по позиция на година (съвпада с ruoYears)\n");
        sb.append("//            всяка година: масив от 4 класирания (по позиция, 0 = 1-во)\n");
        sb.append("//            всяко класиране: [мин_общо, мин_м, мин_ж, макс_общо, макс_м, макс_ж]\n");
        sb.append("//                             или null (паралелката е попълнена в предходно класиране)\n");
        sb.append("\n");
    }

    private void appendYears(StringBuilder sb, List<Integer> years) {
        sb.append("let ruoYears = [");
        for (int i = 0; i < years.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(years.get(i));
        }
        sb.append("];\n\n");
    }

    private void appendSchools(StringBuilder sb, List<String> sortedCodes, List<Integer> years,
                                Map<String, String> schoolNames,
                                Map<String, Map<String, String>> profileNames,
                                Map<String, Map<String, List<List<double[]>>>> scores) {
        sb.append("let ruoSchools = {};\n");

        for (String schoolCode : sortedCodes) {
            sb.append("ruoSchools[\"").append(schoolCode).append("\"] = {n: \"")
              .append(escapeJs(resolveLabel(schoolCode, schoolNames.get(schoolCode))))
              .append("\", c: ").append(isPrivate(schoolCode))
              .append(", p: {\n");

            Map<String, String> profiles = profileNames.get(schoolCode);
            Map<String, List<List<double[]>>> schoolScores = scores.get(schoolCode);

            for (Map.Entry<String, String> profile : profiles.entrySet()) {
                String profileCode = profile.getKey();
                List<List<double[]>> profileData = schoolScores.get(profileCode);

                sb.append("  \"").append(profileCode).append("\": {n: \"")
                  .append(escapeJs(profile.getValue())).append("\", d: [\n");

                for (int yi = 0; yi < years.size(); yi++) {
                    sb.append("    [");
                    List<double[]> yearData = profileData.get(yi);
                    for (int ki = 0; ki < 4; ki++) {
                        if (ki > 0) sb.append(", ");
                        double[] k = yearData.get(ki);
                        if (k == null || isAllZero(k)) {
                            sb.append("null");
                        } else {
                            sb.append("[");
                            for (int si = 0; si < 6; si++) {
                                if (si > 0) sb.append(",");
                                sb.append(formatScore(k[si]));
                            }
                            sb.append("]");
                        }
                    }
                    sb.append("]");
                    if (yi < years.size() - 1) sb.append(",");
                    sb.append("\n");
                }

                sb.append("  ]},\n");
            }

            sb.append("}};\n");
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private double parseScore(String s) {
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private boolean isAllZero(double[] entry) {
        for (double v : entry) if (v != 0.0) return false;
        return true;
    }

    private String formatScore(double val) {
        return BigDecimal.valueOf(val).stripTrailingZeros().toPlainString();
    }

    private boolean isPrivate(String schoolCode) {
        String[] entry = School.schoolCodes.get(schoolCode);
        return entry != null && entry[0].equals("1");
    }

    /** Returns the short name from School.schoolCodes if available, otherwise falls back to the CSV name. */
    private String resolveLabel(String schoolCode, String csvName) {
        String[] entry = School.schoolCodes.get(schoolCode);
        return (entry != null && entry.length > 1) ? entry[1] : csvName;
    }

    private String escapeJs(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
