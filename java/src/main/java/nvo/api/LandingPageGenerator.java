package nvo.api;

import nvo.Cities;
import nvo.ProjectConfig;
import nvo.School;
import nvo.site.SiteLayout;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static nvo.api.JsonGenerator.*;

public class LandingPageGenerator {

    private List<Integer> availableYears = new ArrayList<>();

    public void generateCityPages(String grade, Map<String, Map<String, SchoolData>> citySchools) throws Exception {
        String gradeLabel = gradeLabel(grade);
        String belLabel = grade.equals("12") ? "БЕЛ" : "БЕЛ";
        String matLabel = grade.equals("12") ? "ДЗИ-2" : "МАТ";
        int latestYearIndex = numYearsForGrade(grade) - 1;
        int latestYear = lastYearForGrade(grade);
        int cityPageCount = 0;

        for (Cities.City city : Cities.ORDERED) {
            Map<String, SchoolData> schools = citySchools.get(city.fullName());
            if (schools == null || schools.isEmpty()) continue;

            List<RankedSchool> ranked = buildRankedSchoolsForYear(schools, city, latestYearIndex);
            if (ranked.isEmpty()) continue;

            String html = buildCityPageHtml(grade, gradeLabel, city.fullName(), city.hrefName(),
                    belLabel, matLabel, ranked, latestYear, latestYearIndex);

            Path cityDir = Path.of(DOCS_BASE, grade, city.hrefName());
            Files.createDirectories(cityDir);
            Files.writeString(cityDir.resolve("index.html"), html);
            cityPageCount++;
        }
        System.out.println("Generated " + cityPageCount + " city pages for grade " + grade);
    }

    public void generateYearPages(String grade, Map<String, Map<String, SchoolData>> citySchools) throws Exception {
        String gradeLabel = gradeLabel(grade);
        String belLabel = grade.equals("12") ? "БЕЛ" : "БЕЛ";
        String matLabel = grade.equals("12") ? "ДЗИ-2" : "МАТ";
        int yearPageCount = 0;

        Map<String, String> slugToCity = new LinkedHashMap<>();
        for (Cities.City city : Cities.ORDERED) {
            slugToCity.put(city.hrefName(), city.fullName());
        }

        Map<String, RankedSchool> seenSchools = new LinkedHashMap<>();
        for (Cities.City city : Cities.ORDERED) {
            Map<String, SchoolData> schools = citySchools.get(city.fullName());
            if (schools == null) continue;
            for (Map.Entry<String, SchoolData> e : schools.entrySet()) {
                if (seenSchools.containsKey(e.getKey())) continue;
                SchoolData sd = e.getValue();
                String[] overrides = School.schoolCodes.get(e.getKey());
                String fullName = overrides != null ? overrides[2] : sd.csvName;
                String shortName = overrides != null ? overrides[1] : sd.csvName;
                boolean isPrivate = overrides != null && "1".equals(overrides[0]);
                seenSchools.put(e.getKey(), new RankedSchool(e.getKey(), List.of(city.hrefName()), shortName, fullName, isPrivate, sd));
            }
        }
        List<RankedSchool> allSchools = new ArrayList<>(seenSchools.values());

        // Страници има от DISPLAY_FROM нататък (без таван — архивът по години остава);
        // по-ранните години са само в експорта, а старите им адреси пренасочват към класа.
        int displayFrom = ProjectConfig.DISPLAY_FROM.get(grade);

        // Годините, за които ще има страница (за навигацията между тях).
        availableYears = new ArrayList<>();
        for (int yearIndex = numYearsForGrade(grade) - 1; yearIndex >= displayFrom - FIRST_YEAR; yearIndex--) {
            final int yi = yearIndex;
            if (allSchools.stream().anyMatch(rs -> rs.sd().belScore[yi] != null && rs.sd().matScore[yi] != null)) {
                availableYears.add(FIRST_YEAR + yearIndex);
            }
        }

        int redirects = 0;
        for (int yearIndex = 0; yearIndex < numYearsForGrade(grade); yearIndex++) {
            int year = FIRST_YEAR + yearIndex;
            final int yi = yearIndex;

            if (year < displayFrom) {
                GeneratorUtils.writeRedirectPage(Path.of(DOCS_BASE, grade, String.valueOf(year)), "../",
                        SITE_BASE_URL + grade + "/", "../../", "Пренасочване към " + gradeLabel,
                        "Сайтът показва класациите от " + displayFrom + " г. нататък", "към " + gradeLabel);
                redirects++;
                continue;
            }

            List<RankedSchool> yearSchools = allSchools.stream()
                    .filter(rs -> rs.sd().belScore[yi] != null && rs.sd().matScore[yi] != null)
                    .sorted(Comparator.comparingDouble((RankedSchool rs) ->
                            (rs.sd().belScore[yi] + rs.sd().matScore[yi]) / 2.0).reversed())
                    .toList();

            if (yearSchools.isEmpty()) continue;

            Path yearDir = Path.of(DOCS_BASE, grade, String.valueOf(year));
            Files.createDirectories(yearDir);

            String html = buildYearPageHtml(grade, gradeLabel, belLabel, matLabel, year, yearIndex, yearSchools, slugToCity);
            Files.writeString(yearDir.resolve("index.html"), html);
            yearPageCount++;
        }
        System.out.println("Generated " + yearPageCount + " year pages and " + redirects + " redirects for grade " + grade);
    }

    // ---- Helpers ----

    List<RankedSchool> buildRankedSchoolsForYear(Map<String, SchoolData> schools, Cities.City city, int yearIndex) {
        List<RankedSchool> ranked = new ArrayList<>();
        for (Map.Entry<String, SchoolData> e : schools.entrySet()) {
            SchoolData sd = e.getValue();
            if (sd.belScore[yearIndex] == null || sd.matScore[yearIndex] == null) continue;
            String[] overrides = School.schoolCodes.get(e.getKey());
            String fullName = overrides != null ? overrides[2] : sd.csvName;
            String shortName = overrides != null ? overrides[1] : sd.csvName;
            boolean isPrivate = overrides != null && "1".equals(overrides[0]);
            ranked.add(new RankedSchool(e.getKey(), List.of(city.hrefName()), shortName, fullName, isPrivate, sd));
        }
        ranked.sort(Comparator.comparingDouble((RankedSchool rs) ->
                (rs.sd().belScore[yearIndex] + rs.sd().matScore[yearIndex]) / 2.0).reversed());
        return ranked;
    }

    private String gradeLabel(String grade) {
        for (String[] g : GRADES) {
            if (g[0].equals(grade)) return g[1];
        }
        return grade;
    }

    private String gradeExamPrefix(String grade) {
        return grade.equals("12") ? "ДЗИ" : "НВО";
    }

    private String methodologyText(String belLabel, String matLabel) {
        return "Подредбата е по средна стойност на " + belLabel + " и " + matLabel
                + ", изчислена като (" + belLabel + " + " + matLabel + ") / 2."
                + " Включени са само училища с налични резултати и по двата предмета.";
    }

    private String buildCityPageHtml(String grade, String gradeLabel, String cityName, String citySlug,
                                     String belLabel, String matLabel, List<RankedSchool> ranked,
                                     int year, int yearIndex) {
        String examPrefix = gradeExamPrefix(grade);
        Map<String, Object> ctx = pageContext(grade);
        ctx.put("title", cityName + " – " + examPrefix + " " + grade + " клас " + year + " | Иван Давидов");
        ctx.put("description", "Класация на училищата в " + cityName + " по " + belLabel + " и " + matLabel
                + " за " + examPrefix + " след " + grade + " клас, " + year + " г.");
        ctx.put("canonical", SITE_BASE_URL + grade + "/" + citySlug + "/");
        ctx.put("isCity", true);
        ctx.put("cityName", cityName);
        ctx.put("citySlug", citySlug);
        ctx.put("year", year);
        ctx.put("hasBalove", Files.isDirectory(Path.of(DOCS_BASE, grade, nvo.ProjectConfig.RUO_DIR_NAME, citySlug)));
        ctx.put("crumb", cityName);
        ctx.put("eyebrow", examPrefix + " след " + grade + " клас · " + cityName);
        ctx.put("h1", cityName + " – " + examPrefix + " " + grade + " клас");
        ctx.put("h2", "Класация " + year + " г.");
        ctx.put("methodology", methodologyText(belLabel, matLabel));
        ctx.put("belLabel", belLabel);
        ctx.put("matLabel", matLabel);
        ctx.put("showCity", false);
        ctx.put("rows", rankingRows(ranked, yearIndex, false, null));
        ctx.put("count", ranked.size());
        return SiteLayout.render("landing", ctx);
    }

    private String buildYearPageHtml(String grade, String gradeLabel, String belLabel, String matLabel,
                                     int year, int yearIndex, List<RankedSchool> ranked,
                                     Map<String, String> slugToCity) {
        String examPrefix = gradeExamPrefix(grade);
        Map<String, Object> ctx = pageContext(grade);
        ctx.put("title", examPrefix + " " + grade + " клас " + year + " – национална класация | Иван Давидов");
        ctx.put("description", "Национална класация на училищата по " + belLabel + " и " + matLabel
                + " за " + examPrefix + " след " + grade + " клас, " + year + " г.");
        ctx.put("canonical", SITE_BASE_URL + grade + "/" + year + "/");
        ctx.put("isYear", true);
        ctx.put("year", year);
        ctx.put("crumb", "Класация " + year);
        ctx.put("eyebrow", examPrefix + " след " + grade + " клас · " + year);
        ctx.put("h1", examPrefix + " " + grade + " клас – " + year + " г.");
        ctx.put("h2", "Национална класация");
        ctx.put("methodology", methodologyText(belLabel, matLabel));
        ctx.put("belLabel", belLabel);
        ctx.put("matLabel", matLabel);
        ctx.put("showCity", true);
        ctx.put("rows", rankingRows(ranked, yearIndex, true, slugToCity));
        ctx.put("count", ranked.size());
        List<Map<String, Object>> years = new ArrayList<>();
        for (int y : availableYears) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("value", y);
            item.put("current", y == year);
            years.add(item);
        }
        ctx.put("years", years);
        return SiteLayout.render("landing", ctx);
    }

    /** Общият контекст (head/header/footer + клас) за страниците по град и година. */
    private Map<String, Object> pageContext(String grade) {
        SiteLayout.Page page = new SiteLayout.Page("../../").active(grade).favicon("favicon-" + grade + ".png");
        Map<String, Object> ctx = page.context();
        ctx.put("head", SiteLayout.head(page));
        ctx.put("header", SiteLayout.header(page));
        ctx.put("footer", SiteLayout.footer(page));
        ctx.put("siteUrl", SITE_BASE_URL);
        ctx.put("grade", grade);
        ctx.put("gradeTitle", gradeExamPrefix(grade) + " след " + grade + " клас");
        return ctx;
    }

    private List<Map<String, Object>> rankingRows(List<RankedSchool> ranked, int yearIndex, boolean showCity,
                                                  Map<String, String> slugToCity) {
        List<Map<String, Object>> rows = new ArrayList<>();
        int rank = 0;
        for (RankedSchool rs : ranked) {
            double bel = rs.sd().belScore[yearIndex];
            double mat = rs.sd().matScore[yearIndex];
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("rank", ++rank);
            row.put("code", rs.code());
            row.put("name", rs.fullName());
            row.put("showCity", showCity);
            if (showCity && slugToCity != null) {
                row.put("city", rs.citySlugs().isEmpty() ? "" : slugToCity.getOrDefault(rs.citySlugs().get(0), ""));
            }
            row.put("bel", String.format(Locale.ROOT, "%.2f", bel));
            row.put("mat", String.format(Locale.ROOT, "%.2f", mat));
            row.put("total", String.format(Locale.ROOT, "%.2f", (bel + mat) / 2.0));
            rows.add(row);
        }
        return rows;
    }
}
