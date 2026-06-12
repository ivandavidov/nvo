package nvo.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;

import nvo.Cities;
import nvo.School;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static nvo.api.GeneratorUtils.*;
import static nvo.api.JsonGenerator.*;

/**
 * Generates the per-school API surface, keyed by the canonical school code:
 * <ul>
 *   <li>{@code schools/{code}.json} — full cross-grade document (identity, city,
 *       per-grade score/student time series and ranks);</li>
 *   <li>{@code schools.json} — bulk identity lookup (now data-driven, with the grades a
 *       school participates in);</li>
 *   <li>{@code schools-index.json} — compact array for the client-side school search box.</li>
 * </ul>
 * The school universe is the union of codes that actually appear in the normalized data across
 * all grades (so every listed school has real data and a future {@code /school/{code}/} page).
 */
public class SchoolsGenerator {

    private static final String[] GRADE_KEYS = {"4", "7", "10", "12"};

    public void generate() throws Exception {
        Gson gson = new GsonBuilder().serializeNulls().create();
        GradeDataGenerator gradeData = new GradeDataGenerator();

        // slug -> City, for resolving a school's city name from its slug.
        Map<String, Cities.City> cityBySlug = new HashMap<>();
        for (Cities.City c : Cities.ORDERED) {
            cityBySlug.put(c.hrefName(), c);
        }

        // Parse every grade once and build the per-grade ranking universe.
        Map<String, Map<String, Map<String, SchoolData>>> citySchoolsByGrade = new LinkedHashMap<>();
        Map<String, List<RankedSchool>> allByGrade = new LinkedHashMap<>();
        Map<String, Map<String, RankedSchool>> byCodeByGrade = new LinkedHashMap<>();

        for (String grade : GRADE_KEYS) {
            Map<String, Map<String, SchoolData>> citySchools = gradeData.parseGrade(grade);
            citySchoolsByGrade.put(grade, citySchools);
            List<RankedSchool> all = RankingsGenerator.buildAllSchools(citySchools);
            allByGrade.put(grade, all);
            Map<String, RankedSchool> byCode = new LinkedHashMap<>();
            for (RankedSchool rs : all) {
                byCode.put(rs.code(), rs);
            }
            byCodeByGrade.put(grade, byCode);
        }

        // Union of every code that has data in any grade, sorted numerically for stable output.
        Set<String> codeSet = new LinkedHashSet<>();
        for (String grade : GRADE_KEYS) {
            codeSet.addAll(byCodeByGrade.get(grade).keySet());
        }
        List<String> codes = new ArrayList<>(codeSet);
        codes.sort(Comparator.comparingLong(SchoolsGenerator::codeSortKey).thenComparing(Comparator.naturalOrder()));

        Path schoolsDir = Path.of(OUTPUT_BASE, "schools");
        cleanDirectory(schoolsDir);

        JsonObject bulkSchools = new JsonObject();
        JsonArray indexArr = new JsonArray();

        for (String code : codes) {
            // Identity comes from the first grade the school appears in (same across grades).
            RankedSchool identity = null;
            for (String grade : GRADE_KEYS) {
                RankedSchool rs = byCodeByGrade.get(grade).get(code);
                if (rs != null) {
                    identity = rs;
                    break;
                }
            }
            if (identity == null) {
                continue;
            }

            String[] override = School.schoolCodes.get(code);
            String website = override != null && override.length > 3 ? override[3] : null;

            String citySlug = identity.citySlugs().isEmpty() ? null : identity.citySlugs().get(0);
            Cities.City cityObj = citySlug != null ? cityBySlug.get(citySlug) : null;

            JsonArray gradeListArr = new JsonArray();
            JsonObject gradesJson = new JsonObject();
            int maxGradeYears = 0;
            for (String grade : GRADE_KEYS) {
                RankedSchool rs = byCodeByGrade.get(grade).get(code);
                if (rs == null) {
                    continue;
                }
                gradeListArr.add(Integer.parseInt(grade));
                gradesJson.add(grade, buildGradeObject(rs, allByGrade.get(grade),
                        citySchoolsByGrade.get(grade), cityBySlug));
                maxGradeYears = Math.max(maxGradeYears, rs.sd().belScore.length);
            }

            // ---- schools/{code}.json (full cross-grade document) ----
            JsonObject individual = new JsonObject();
            individual.addProperty("code", code);
            individual.addProperty("fullName", identity.fullName());
            individual.addProperty("shortName", identity.shortName());
            individual.addProperty("isPrivate", identity.isPrivate());
            if (website != null) {
                individual.addProperty("website", website);
            } else {
                individual.add("website", JsonNull.INSTANCE);
            }
            individual.add("city", cityJson(cityObj));
            // Span the widest grade this school has (DZI reaches 2026, NVO 2025); per-grade blocks
            // each carry their own yearsRange, so consumers align each grade to its own years.
            individual.add("yearsRange", buildYearsRange(FIRST_YEAR + maxGradeYears - 1));
            individual.add("grades", gradesJson);
            Files.writeString(schoolsDir.resolve(code + ".json"), collapseArrays(gson.toJson(individual)) + "\n");

            // ---- schools.json bulk entry (identity + grades participated + city slug) ----
            JsonObject bulk = new JsonObject();
            bulk.addProperty("shortName", identity.shortName());
            bulk.addProperty("fullName", identity.fullName());
            if (website != null) {
                bulk.addProperty("website", website);
            } else {
                bulk.add("website", JsonNull.INSTANCE);
            }
            bulk.addProperty("isPrivate", identity.isPrivate());
            if (cityObj != null) {
                bulk.addProperty("city", cityObj.hrefName());
            } else {
                bulk.add("city", JsonNull.INSTANCE);
            }
            bulk.add("grades", gradeListArr.deepCopy());
            bulkSchools.add(code, bulk);

            // ---- schools-index.json entry (compact, for the search box) ----
            JsonObject idx = new JsonObject();
            idx.addProperty("code", code);
            idx.addProperty("shortName", identity.shortName());
            idx.addProperty("fullName", identity.fullName());
            idx.addProperty("isPrivate", identity.isPrivate());
            idx.addProperty("city", cityObj != null ? cityObj.fullName() : "");
            // Position of the city in Cities.ORDERED, so the search box can sort results
            // in the same order the cities are listed across the site.
            idx.addProperty("cityOrder", cityObj != null ? cityObj.i() : Integer.MAX_VALUE);
            idx.add("grades", gradeListArr.deepCopy());
            indexArr.add(idx);
        }

        JsonObject schoolsRoot = new JsonObject();
        schoolsRoot.add("schools", bulkSchools);
        Files.writeString(Path.of(OUTPUT_BASE, "schools.json"), collapseArrays(gson.toJson(schoolsRoot)) + "\n");

        JsonObject indexRoot = new JsonObject();
        indexRoot.add("schools", indexArr);
        Files.writeString(Path.of(OUTPUT_BASE, "schools-index.json"), collapseArrays(gson.toJson(indexRoot)) + "\n");

        System.out.println("Generated: schools.json, schools-index.json, schools/{code}.json ("
                + codes.size() + " schools)");
    }

    /**
     * Builds the per-grade block: score/student time series plus latest-year national and city
     * ranks, and the 3-year median national rank (ending at the latest year).
     */
    private JsonObject buildGradeObject(RankedSchool rs, List<RankedSchool> all,
                                        Map<String, Map<String, SchoolData>> citySchools,
                                        Map<String, Cities.City> cityBySlug) {
        SchoolData sd = rs.sd();
        // Per-grade arrays carry only that grade's own years (DZI reaches one year further than
        // NVO), so every index below is bounded by this grade's length, never the global maximum.
        int lastIdx = sd.belScore.length - 1;
        JsonObject gj = new JsonObject();
        gj.add("belScore", toDoubleArray(sd.belScore));
        gj.add("matScore", toDoubleArray(sd.matScore));
        gj.add("belStudents", toIntArray(sd.belStudents));
        gj.add("matStudents", toIntArray(sd.matStudents));
        gj.add("yearsRange", buildYearsRange(FIRST_YEAR + lastIdx));

        int latestIdx = -1;
        for (int i = lastIdx; i >= 0; i--) {
            if (sd.belScore[i] != null && sd.matScore[i] != null) {
                latestIdx = i;
                break;
            }
        }

        if (latestIdx >= 0) {
            gj.addProperty("latestYear", FIRST_YEAR + latestIdx);
            int[] nat = RankingsGenerator.nationalYearRank(all, latestIdx).get(rs.code());
            if (nat != null) {
                gj.addProperty("nationalRank", nat[0]);
                gj.addProperty("nationalTotal", nat[1]);
            }
            int[] city = cityRank(rs, citySchools, cityBySlug, latestIdx);
            if (city != null) {
                gj.addProperty("cityRank", city[0]);
                gj.addProperty("cityTotal", city[1]);
            }
        } else {
            gj.add("latestYear", JsonNull.INSTANCE);
        }

        int[] median = RankingsGenerator.nationalMedianRank(all, lastIdx).get(rs.code());
        if (median != null) {
            gj.addProperty("medianRank", median[0]);
            if (median[1] >= 0) {
                gj.addProperty("medianAdjustedRank", median[1]);
            } else {
                gj.add("medianAdjustedRank", JsonNull.INSTANCE);
            }
            gj.addProperty("medianTotal", median[2]);
            gj.addProperty("medianEndYear", FIRST_YEAR + lastIdx);
        }
        return gj;
    }

    /**
     * Rank of the school within its primary city for the given year, by (BEL+MAT)/2 descending.
     * Matches the ordering used by the per-city landing pages.
     *
     * @return [rank (1-based), total ranked schools in the city] or {@code null}
     */
    private int[] cityRank(RankedSchool rs, Map<String, Map<String, SchoolData>> citySchools,
                           Map<String, Cities.City> cityBySlug, int yearIndex) {
        if (rs.citySlugs().isEmpty()) {
            return null;
        }
        Cities.City city = cityBySlug.get(rs.citySlugs().get(0));
        if (city == null) {
            return null;
        }
        Map<String, SchoolData> schools = citySchools.get(city.fullName());
        if (schools == null) {
            return null;
        }
        List<Map.Entry<String, SchoolData>> ranked = new ArrayList<>();
        for (Map.Entry<String, SchoolData> e : schools.entrySet()) {
            SchoolData d = e.getValue();
            if (d.belScore[yearIndex] != null && d.matScore[yearIndex] != null) {
                ranked.add(e);
            }
        }
        ranked.sort(Comparator.comparingDouble((Map.Entry<String, SchoolData> e) ->
                (e.getValue().belScore[yearIndex] + e.getValue().matScore[yearIndex]) / 2.0).reversed());
        for (int i = 0; i < ranked.size(); i++) {
            if (ranked.get(i).getKey().equals(rs.code())) {
                return new int[]{i + 1, ranked.size()};
            }
        }
        return null;
    }

    private static com.google.gson.JsonElement cityJson(Cities.City cityObj) {
        if (cityObj == null) {
            return JsonNull.INSTANCE;
        }
        JsonObject cityJ = new JsonObject();
        cityJ.addProperty("slug", cityObj.hrefName());
        cityJ.addProperty("name", cityObj.fullName());
        return cityJ;
    }

    private static long codeSortKey(String code) {
        try {
            return Long.parseLong(code);
        } catch (NumberFormatException e) {
            return Long.MAX_VALUE;
        }
    }
}
