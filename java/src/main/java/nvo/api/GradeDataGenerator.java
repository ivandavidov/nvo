package nvo.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

import nvo.Cities;
import nvo.Record;
import nvo.School;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static nvo.api.GeneratorUtils.*;
import static nvo.api.JsonGenerator.*;

public class GradeDataGenerator {

    private final RankingsGenerator rankingsGenerator = new RankingsGenerator();
    private final LandingPageGenerator landingPageGenerator = new LandingPageGenerator();

    public void generate(String grade) throws Exception {
        Map<String, Map<String, SchoolData>> citySchools = parseGrade(grade);

        Gson gson = new GsonBuilder()
                .serializeNulls()
                .create();

        // Build JSON using Cities.ORDERED for consistent city ordering
        JsonObject root = new JsonObject();
        root.addProperty("grade", Integer.parseInt(grade));
        root.add("yearsRange", buildYearsRange(lastYearForGrade(grade)));

        JsonObject citiesJson = new JsonObject();
        Path gradeDir = Path.of(OUTPUT_BASE, grade);
        cleanDirectory(gradeDir);

        for (Cities.City city : Cities.ORDERED) {
            Map<String, SchoolData> schools = citySchools.get(city.fullName());
            if (schools == null || schools.isEmpty()) {
                continue;
            }

            JsonObject cityJson = new JsonObject();
            cityJson.addProperty("fullName", city.fullName());
            cityJson.addProperty("shortName", city.shortName());

            JsonObject schoolsJson = new JsonObject();
            Path cityDir = gradeDir.resolve(city.hrefName());
            Files.createDirectories(cityDir);

            int gradeNum = Integer.parseInt(grade);

            schools.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(entry -> {
                        String code = entry.getKey();
                        SchoolData sd = entry.getValue();
                        JsonObject sj = buildSchoolJson(code, sd);
                        schoolsJson.add(code, sj);

                        // Write per-school file: {grade}/{hrefName}/{code}.json
                        try {
                            JsonObject oneSchool = new JsonObject();
                            oneSchool.add(code, sj);
                            JsonObject oneCity = new JsonObject();
                            oneCity.addProperty("fullName", city.fullName());
                            oneCity.addProperty("shortName", city.shortName());
                            oneCity.add("schools", oneSchool);
                            JsonObject oneCities = new JsonObject();
                            oneCities.add(city.hrefName(), oneCity);
                            JsonObject schoolRoot = new JsonObject();
                            schoolRoot.addProperty("grade", gradeNum);
                            schoolRoot.add("yearsRange", buildYearsRange(lastYearForGrade(grade)));
                            schoolRoot.add("cities", oneCities);
                            Files.writeString(cityDir.resolve(code + ".json"),
                                    collapseArrays(gson.toJson(schoolRoot)) + "\n");
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    });

            cityJson.add("schools", schoolsJson);
            citiesJson.add(city.hrefName(), cityJson);

            // Write per-city file: {grade}/{hrefName}/data.json
            JsonObject oneCities = new JsonObject();
            oneCities.add(city.hrefName(), cityJson);
            JsonObject cityRoot = new JsonObject();
            cityRoot.addProperty("grade", gradeNum);
            cityRoot.add("yearsRange", buildYearsRange(lastYearForGrade(grade)));
            cityRoot.add("cities", oneCities);
            String cityJsonStr = collapseArrays(gson.toJson(cityRoot));
            Files.writeString(cityDir.resolve("data.json"), cityJsonStr + "\n");
        }

        root.add("cities", citiesJson);

        // Write main output: {grade}/data.json
        Path outputFile = gradeDir.resolve("data.json");
        String json = collapseArrays(gson.toJson(root));
        Files.writeString(outputFile, json + "\n");

        System.out.println("Generated: " + outputFile);

        // Generate rankings
        rankingsGenerator.generate(grade, citySchools, gson);

        // Generate city and year landing pages under docs/{grade}/
        landingPageGenerator.generateCityPages(grade, citySchools);
        landingPageGenerator.generateYearPages(grade, citySchools);
    }

    /**
     * Parses the normalized CSV files for a grade into a {city -> code -> SchoolData} map.
     * Shared by {@link #generate(String)} and {@link SchoolsGenerator} so the cross-grade
     * per-school documents are built from the exact same parsing rules as the grade data.
     */
    public Map<String, Map<String, SchoolData>> parseGrade(String grade) throws Exception {
        String prefix = grade.equals("12") ? "dzi" : "nvo-" + grade;

        // city -> code -> SchoolData
        Map<String, Map<String, SchoolData>> citySchools = new HashMap<>();

        int numYears = numYearsForGrade(grade);
        for (int yearIndex = 0; yearIndex < numYears; yearIndex++) {
            int year = FIRST_YEAR + yearIndex;
            String filePath = NORMALIZED_PATH + prefix + "-" + year + "-normalized.csv";
            File file = new File(filePath);
            if (!file.exists()) {
                System.out.println("Warning: file not found: " + filePath);
                continue;
            }

            List<String> lines = Files.readAllLines(file.toPath());
            for (int i = 1; i < lines.size(); i++) {
                Record record = lineToRecord(lines.get(i));
                if (record == null) {
                    continue;
                }
                if (record.getSchool().startsWith("РУО")
                        || record.getSchool().startsWith("Регионално управление на образованието")) {
                    continue;
                }

                String code = School.fixedCodes.getOrDefault(record.getCode(), record.getCode());

                Map<String, SchoolData> schools = citySchools.computeIfAbsent(
                        record.getCity(), k -> new HashMap<>());
                SchoolData sd = schools.computeIfAbsent(code, k -> new SchoolData(numYears));
                sd.csvName = record.getSchool();

                sd.belScore[yearIndex] = record.getBelScore() != null && record.getBelScore() > 0
                        ? record.getBelScore() : null;
                sd.matScore[yearIndex] = record.getMatScore() != null && record.getMatScore() > 0
                        ? record.getMatScore() : null;
                sd.belStudents[yearIndex] = record.getBelStudents() != null && record.getBelStudents() > 0
                        ? record.getBelStudents() : null;
                sd.matStudents[yearIndex] = record.getMatStudents() != null && record.getMatStudents() > 0
                        ? record.getMatStudents() : null;
            }
        }

        return citySchools;
    }

    static JsonObject buildSchoolJson(String code, SchoolData sd) {
        String[] overrides = School.schoolCodes.get(code);
        JsonObject sj = new JsonObject();
        sj.addProperty("fullName", overrides != null ? overrides[2] : sd.csvName);
        sj.addProperty("shortName", overrides != null ? overrides[1] : sd.csvName);
        sj.addProperty("isPrivate", overrides != null && "1".equals(overrides[0]));
        sj.add("belScore", toDoubleArray(sd.belScore));
        sj.add("matScore", toDoubleArray(sd.matScore));
        sj.add("belStudents", toIntArray(sd.belStudents));
        sj.add("matStudents", toIntArray(sd.matStudents));
        return sj;
    }

    Record lineToRecord(String line) {
        try {
            line = normalizeLine(line);
            String[] entries = line.split("\\|");
            String city = entries[0].replaceAll("\"", "");
            String code = entries[1].replaceAll("\"", "");
            String school = entries[2].replaceAll("\"", "");
            String belScore = entries[3].replaceAll("\"", "").trim();
            String matScore = entries[4].replaceAll("\"", "").trim();
            String belStudents = entries[5].replaceAll("\"", "").trim();
            String matStudents = entries[6].replaceAll("\"", "").trim();

            Record r = new Record();
            r.setCity(city);
            r.setCode(code);
            r.setSchool(school);
            r.setBelScore(belScore.isEmpty() ? 0.0 : Double.valueOf(belScore));
            r.setMatScore(matScore.isEmpty() ? 0.0 : Double.valueOf(matScore));
            r.setBelStudents(belStudents.isEmpty() ? 0 : Integer.valueOf(belStudents));
            r.setMatStudents(matStudents.isEmpty() ? 0 : Integer.valueOf(matStudents));
            return r;
        } catch (RuntimeException e) {
            System.err.println("Error parsing line: " + line);
            e.printStackTrace();
            return null;
        }
    }

    private String normalizeLine(String line) {
        line = line.replace(';', '|');
        StringBuilder sb = new StringBuilder(line.length());
        for (int i = 0; i < line.length(); i++) {
            if (line.charAt(i) == ',' && i > 0 && line.charAt(i - 1) == '"') {
                sb.append('|');
            } else {
                sb.append(line.charAt(i));
            }
        }
        return sb.toString();
    }
}
