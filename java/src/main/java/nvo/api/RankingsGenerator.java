package nvo.api;

import com.google.gson.Gson;
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
import java.util.List;
import java.util.Map;

import static nvo.api.GeneratorUtils.*;
import static nvo.api.JsonGenerator.*;

public class RankingsGenerator {

    public void generate(String grade, Map<String, Map<String, SchoolData>> citySchools, Gson gson) throws Exception {
        List<RankedSchool> allSchools = buildAllSchools(citySchools);

        Path rankingsDir = Path.of(OUTPUT_BASE, "rankings", grade);
        cleanDirectory(rankingsDir);

        // Per-year rankings
        for (int yearIndex = 0; yearIndex < NUM_YEARS; yearIndex++) {
            int year = FIRST_YEAR + yearIndex;
            final int yi = yearIndex;

            List<RankedSchool> yearSchools = allSchools.stream()
                    .filter(rs -> rs.sd().belScore[yi] != null && rs.sd().matScore[yi] != null)
                    .sorted(Comparator.comparingDouble((RankedSchool rs) ->
                            (rs.sd().belScore[yi] + rs.sd().matScore[yi]) / 2.0).reversed())
                    .toList();

            if (yearSchools.isEmpty()) continue;

            JsonObject yearRoot = new JsonObject();
            yearRoot.addProperty("grade", Integer.parseInt(grade));
            yearRoot.addProperty("type", "year");
            yearRoot.addProperty("year", year);
            JsonArray arr = new JsonArray();
            int rank = 0;
            for (RankedSchool rs : yearSchools) {
                rank++;
                double bel = rs.sd().belScore[yi];
                double mat = rs.sd().matScore[yi];
                JsonObject entry = new JsonObject();
                entry.addProperty("rank", rank);
                entry.addProperty("code", rs.code());
                JsonArray citiesArr = new JsonArray();
                rs.citySlugs().forEach(citiesArr::add);
                entry.add("cities", citiesArr);
                entry.addProperty("shortName", rs.shortName());
                entry.addProperty("fullName", rs.fullName());
                entry.addProperty("isPrivate", rs.isPrivate());
                entry.addProperty("belScore", roundTo2(bel));
                entry.addProperty("matScore", roundTo2(mat));
                entry.addProperty("score", roundTo2((bel + mat) / 2.0));
                arr.add(entry);
            }
            yearRoot.add("schools", arr);
            Files.writeString(rankingsDir.resolve(year + ".json"), collapseArrays(gson.toJson(yearRoot)) + "\n");
        }

        // Median-based rankings: rankings/median/{grade}/{endYear}.json
        int medianYears = 3;
        int medianStartYear = 2020;
        Path medianDir = Path.of(OUTPUT_BASE, "rankings", "median", grade);
        cleanDirectory(medianDir);
        int medianFileCount = 0;

        for (int endYear = medianStartYear; endYear <= LAST_YEAR; endYear++) {
            int endYearIndex = endYear - FIRST_YEAR;

            List<double[]> medianList = new ArrayList<>();
            List<RankedSchool> medianSchools = new ArrayList<>();

            for (RankedSchool rs : allSchools) {
                double belSum = 0, matSum = 0;
                int belCount = 0, matCount = 0;
                for (int i = 0; i < medianYears; i++) {
                    int idx = endYearIndex - i;
                    if (idx >= 0 && rs.sd().belScore[idx] != null) {
                        belSum += rs.sd().belScore[idx];
                        belCount++;
                    }
                    if (idx >= 0 && rs.sd().matScore[idx] != null) {
                        matSum += rs.sd().matScore[idx];
                        matCount++;
                    }
                }
                if (belCount == 0 || matCount == 0) continue;
                double belMedian = belSum / belCount;
                double matMedian = matSum / matCount;
                medianList.add(new double[]{belMedian, matMedian});
                medianSchools.add(rs);
            }

            // Sort by combined score descending
            Integer[] indices = new Integer[medianSchools.size()];
            for (int i = 0; i < indices.length; i++) indices[i] = i;
            java.util.Arrays.sort(indices, Comparator.comparingDouble((Integer i) ->
                    (medianList.get(i)[0] + medianList.get(i)[1]) / 2.0).reversed());

            JsonObject medianRoot = new JsonObject();
            medianRoot.addProperty("grade", Integer.parseInt(grade));
            medianRoot.addProperty("type", "median");
            medianRoot.addProperty("medianYears", medianYears);
            medianRoot.addProperty("endYear", endYear);
            JsonArray medArr = new JsonArray();
            int rank = 0;
            int adjustedRank = 0;
            for (int idx : indices) {
                rank++;
                RankedSchool rs = medianSchools.get(idx);
                double bel = medianList.get(idx)[0];
                double mat = medianList.get(idx)[1];

                boolean hasEndYearData = rs.sd().belScore[endYearIndex] != null
                        && rs.sd().matScore[endYearIndex] != null;

                JsonObject entry = new JsonObject();
                entry.addProperty("rank", rank);
                if (hasEndYearData) {
                    adjustedRank++;
                    entry.addProperty("adjustedRank", adjustedRank);
                } else {
                    entry.add("adjustedRank", JsonNull.INSTANCE);
                }
                entry.addProperty("code", rs.code());
                JsonArray citiesArr = new JsonArray();
                rs.citySlugs().forEach(citiesArr::add);
                entry.add("cities", citiesArr);
                entry.addProperty("shortName", rs.shortName());
                entry.addProperty("fullName", rs.fullName());
                entry.addProperty("isPrivate", rs.isPrivate());
                entry.addProperty("belMedian", roundTo2(bel));
                entry.addProperty("matMedian", roundTo2(mat));
                entry.addProperty("score", roundTo2((bel + mat) / 2.0));
                medArr.add(entry);
            }
            medianRoot.add("schools", medArr);
            Files.writeString(medianDir.resolve(endYear + ".json"), collapseArrays(gson.toJson(medianRoot)) + "\n");
            medianFileCount++;
        }

        System.out.println("Generated rankings for grade " + grade + ": "
                + medianFileCount + " median files, " + NUM_YEARS + " year files");
    }

    /**
     * Builds the deduplicated (by code) list of schools for a grade, with city slugs ordered
     * by {@link Cities#ORDERED}. This is the single source of truth for the ranking universe;
     * reused by {@link SchoolsGenerator} so per-school ranks match the published rankings exactly.
     */
    public static List<RankedSchool> buildAllSchools(Map<String, Map<String, SchoolData>> citySchools) {
        // Build reverse map: code -> list of city slugs (ordered by Cities.ORDERED)
        Map<String, List<String>> codeToCitySlugs = new LinkedHashMap<>();
        for (Cities.City city : Cities.ORDERED) {
            Map<String, SchoolData> schools = citySchools.get(city.fullName());
            if (schools == null) continue;
            for (String code : schools.keySet()) {
                codeToCitySlugs.computeIfAbsent(code, k -> new ArrayList<>()).add(city.hrefName());
            }
        }

        // Collect all schools with their data, deduplicated by code
        Map<String, RankedSchool> seenSchools = new LinkedHashMap<>();
        for (Cities.City city : Cities.ORDERED) {
            Map<String, SchoolData> schools = citySchools.get(city.fullName());
            if (schools == null) continue;
            for (Map.Entry<String, SchoolData> schoolEntry : schools.entrySet()) {
                String code = schoolEntry.getKey();
                if (seenSchools.containsKey(code)) continue;
                SchoolData sd = schoolEntry.getValue();
                String[] overrides = School.schoolCodes.get(code);
                String fullName = overrides != null ? overrides[2] : sd.csvName;
                String shortName = overrides != null ? overrides[1] : sd.csvName;
                boolean isPrivate = overrides != null && "1".equals(overrides[0]);
                List<String> citySlugs = codeToCitySlugs.getOrDefault(code, List.of());

                seenSchools.put(code, new RankedSchool(code, citySlugs, shortName, fullName, isPrivate, sd));
            }
        }
        return new ArrayList<>(seenSchools.values());
    }

    /**
     * National rank for a single year. Mirrors the per-year ranking above (sort by (BEL+MAT)/2
     * descending, only schools with both scores present).
     *
     * @return code -> [rank (1-based), total ranked schools that year]
     */
    public static Map<String, int[]> nationalYearRank(List<RankedSchool> allSchools, int yearIndex) {
        List<RankedSchool> yearSchools = allSchools.stream()
                .filter(rs -> rs.sd().belScore[yearIndex] != null && rs.sd().matScore[yearIndex] != null)
                .sorted(Comparator.comparingDouble((RankedSchool rs) ->
                        (rs.sd().belScore[yearIndex] + rs.sd().matScore[yearIndex]) / 2.0).reversed())
                .toList();
        Map<String, int[]> result = new HashMap<>();
        int total = yearSchools.size();
        for (int i = 0; i < total; i++) {
            result.put(yearSchools.get(i).code(), new int[]{i + 1, total});
        }
        return result;
    }

    /**
     * National 3-year median rank ending at the given year. Mirrors the median ranking above.
     *
     * @return code -> [rank (1-based), adjustedRank (1-based, or -1 when the school has no
     *         end-year data), total schools in the median window]
     */
    public static Map<String, int[]> nationalMedianRank(List<RankedSchool> allSchools, int endYearIndex) {
        int medianYears = 3;
        List<RankedSchool> medianSchools = new ArrayList<>();
        List<double[]> medianList = new ArrayList<>();
        for (RankedSchool rs : allSchools) {
            double belSum = 0, matSum = 0;
            int belCount = 0, matCount = 0;
            for (int i = 0; i < medianYears; i++) {
                int idx = endYearIndex - i;
                if (idx >= 0 && rs.sd().belScore[idx] != null) {
                    belSum += rs.sd().belScore[idx];
                    belCount++;
                }
                if (idx >= 0 && rs.sd().matScore[idx] != null) {
                    matSum += rs.sd().matScore[idx];
                    matCount++;
                }
            }
            if (belCount == 0 || matCount == 0) continue;
            medianSchools.add(rs);
            medianList.add(new double[]{belSum / belCount, matSum / matCount});
        }

        Integer[] indices = new Integer[medianSchools.size()];
        for (int i = 0; i < indices.length; i++) indices[i] = i;
        java.util.Arrays.sort(indices, Comparator.comparingDouble((Integer i) ->
                (medianList.get(i)[0] + medianList.get(i)[1]) / 2.0).reversed());

        Map<String, int[]> result = new HashMap<>();
        int total = medianSchools.size();
        int rank = 0;
        int adjustedRank = 0;
        for (int idx : indices) {
            rank++;
            RankedSchool rs = medianSchools.get(idx);
            boolean hasEndYearData = rs.sd().belScore[endYearIndex] != null
                    && rs.sd().matScore[endYearIndex] != null;
            int adj = -1;
            if (hasEndYearData) {
                adjustedRank++;
                adj = adjustedRank;
            }
            result.put(rs.code(), new int[]{rank, adj, total});
        }
        return result;
    }
}
