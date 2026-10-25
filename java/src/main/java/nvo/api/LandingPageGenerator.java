package nvo.api;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import nvo.Cities;
import nvo.ProjectConfig;
import nvo.School;
import nvo.SchoolType;
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
                seenSchools.put(e.getKey(), new RankedSchool(e.getKey(), List.of(city.hrefName()), shortName, fullName, SchoolType.of(e.getKey()), sd));
            }
        }
        List<RankedSchool> allSchools = new ArrayList<>(seenSchools.values());

        // Страници има от DISPLAY_FROM нататък (без таван - архивът по години остава);
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
            ranked.add(new RankedSchool(e.getKey(), List.of(city.hrefName()), shortName, fullName, SchoolType.of(e.getKey()), sd));
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

    /** "НВО 7 клас - 2026" / "Матури (ДЗИ) - 2026" - изпитът така, както го търсят, годината - между тирета. */
    private String examLabel(String grade, int year) {
        return (grade.equals("12") ? "Матури (ДЗИ)" : "НВО " + grade + " клас") + " - " + year;
    }

    /** JSON-LD: пътят (като breadcrumbs на страницата) + първите 10 училища от класацията. */
    private String rankingLd(String grade, String crumb, String canonical, String heading,
                             List<Map<String, Object>> rows) {
        JsonArray crumbs = new JsonArray();
        crumbs.add(listItem(1, "Начало", "item", SITE_BASE_URL));
        crumbs.add(listItem(2, gradeExamPrefix(grade) + " след " + grade + " клас", "item", SITE_BASE_URL + grade + "/"));
        crumbs.add(listItem(3, crumb, "item", canonical));
        JsonObject breadcrumbs = new JsonObject();
        breadcrumbs.addProperty("@type", "BreadcrumbList");
        breadcrumbs.add("itemListElement", crumbs);

        JsonArray items = new JsonArray();
        for (Map<String, Object> row : rows.subList(0, Math.min(10, rows.size()))) {
            items.add(listItem((int) row.get("rank"), (String) row.get("name"), "url",
                    SITE_BASE_URL + "school/" + row.get("code") + "/"));
        }
        JsonObject list = new JsonObject();
        list.addProperty("@type", "ItemList");
        list.addProperty("name", heading);
        list.addProperty("url", canonical);
        list.addProperty("numberOfItems", rows.size());
        list.addProperty("itemListOrder", "https://schema.org/ItemListOrderDescending");
        list.add("itemListElement", items);

        JsonArray graph = new JsonArray();
        graph.add(breadcrumbs);
        graph.add(list);
        JsonObject root = new JsonObject();
        root.addProperty("@context", "https://schema.org");
        root.add("@graph", graph);
        return new Gson().toJson(root);
    }

    /** ListItem; в BreadcrumbList адресът е "item", в ItemList - "url". */
    private static JsonObject listItem(int position, String name, String urlKey, String url) {
        JsonObject item = new JsonObject();
        item.addProperty("@type", "ListItem");
        item.addProperty("position", position);
        item.addProperty("name", name);
        item.addProperty(urlKey, url);
        return item;
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
        String heading = examLabel(grade, year) + " - класация на училищата " + Cities.inCity(cityName);
        String canonical = SITE_BASE_URL + grade + "/" + citySlug + "/";
        ctx.put("title", heading + " | Иван Давидов");
        ctx.put("description", "Класация на училищата " + Cities.inCity(cityName) + " по " + belLabel + " и " + matLabel
                + " за " + examPrefix + " след " + grade + " клас, " + year + " г.");
        ctx.put("canonical", canonical);
        ctx.put("inCity", Cities.inCity(cityName));
        ctx.put("isCity", true);
        ctx.put("cityName", cityName);
        ctx.put("citySlug", citySlug);
        ctx.put("year", year);
        ctx.put("hasBalove", Files.isDirectory(Path.of(DOCS_BASE, grade, nvo.ProjectConfig.RUO_DIR_NAME, citySlug)));
        ctx.put("crumb", cityName);
        ctx.put("eyebrow", examPrefix + " след " + grade + " клас · " + cityName);
        ctx.put("h1", cityName + " - " + examPrefix + " " + grade + " клас");
        ctx.put("h2", "Класация " + year + " г.");
        ctx.put("methodology", methodologyText(belLabel, matLabel));
        ctx.put("belLabel", belLabel);
        ctx.put("matLabel", matLabel);
        ctx.put("showCity", false);
        List<Map<String, Object>> rows = rankingRows(ranked, yearIndex, false, null);
        ctx.put("rows", rows);
        ctx.put("count", ranked.size());
        putTypes(ctx, rows);
        ctx.put("jsonLd", rankingLd(grade, cityName, canonical, heading, rows));
        return SiteLayout.render("landing", ctx);
    }

    private String buildYearPageHtml(String grade, String gradeLabel, String belLabel, String matLabel,
                                     int year, int yearIndex, List<RankedSchool> ranked,
                                     Map<String, String> slugToCity) {
        String examPrefix = gradeExamPrefix(grade);
        Map<String, Object> ctx = pageContext(grade);
        String heading = examLabel(grade, year) + " - национална класация на училищата";
        String canonical = SITE_BASE_URL + grade + "/" + year + "/";
        ctx.put("title", heading + " | Иван Давидов");
        ctx.put("description", "Национална класация на училищата по " + belLabel + " и " + matLabel
                + " за " + examPrefix + " след " + grade + " клас, " + year + " г.");
        ctx.put("canonical", canonical);
        ctx.put("isYear", true);
        ctx.put("year", year);
        ctx.put("crumb", "Класация " + year);
        ctx.put("eyebrow", examPrefix + " след " + grade + " клас · " + year);
        ctx.put("h1", examPrefix + " " + grade + " клас - " + year + " г.");
        ctx.put("h2", "Национална класация");
        ctx.put("methodology", methodologyText(belLabel, matLabel));
        ctx.put("belLabel", belLabel);
        ctx.put("matLabel", matLabel);
        ctx.put("showCity", true);
        List<Map<String, Object>> rows = rankingRows(ranked, yearIndex, true, slugToCity);
        ctx.put("rows", rows);
        ctx.put("count", ranked.size());
        putTypes(ctx, rows);
        ctx.put("jsonLd", rankingLd(grade, "Класация " + year, canonical, heading, rows));
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

    /** Чиповете "Покажи само": видовете в класацията с броя училища (само при поне два вида). */
    private void putTypes(Map<String, Object> ctx, List<Map<String, Object>> rows) {
        List<Map<String, Object>> types = new ArrayList<>();
        for (SchoolType t : SchoolType.values()) {
            long count = rows.stream().filter(r -> t.key().equals(r.get("typeKey"))).count();
            if (count > 0) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("key", t.key());
                item.put("letter", t.letter());
                item.put("plural", t.plural());
                item.put("count", count);
                types.add(item);
            }
        }
        ctx.put("hasTypes", types.size() > 1);
        ctx.put("types", types);
        ctx.put("typeCount", types.size());
    }

    private List<Map<String, Object>> rankingRows(List<RankedSchool> ranked, int yearIndex, boolean showCity,
                                                  Map<String, String> slugToCity) {
        List<Map<String, Object>> rows = new ArrayList<>();
        int rank = 0;
        // Мястото сред училищата от същия вид в тази класация ("Ч 3").
        Map<SchoolType, Integer> typeNo = new java.util.EnumMap<>(SchoolType.class);
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
            SchoolType type = rs.type();
            int no = typeNo.merge(type, 1, Integer::sum);
            row.put("typeKey", type.key());
            row.put("typeLetter", type.letter());
            row.put("typeLabel", type.label());
            row.put("typeLower", type.label().toLowerCase(Locale.ROOT));
            row.put("typeNo", no);
            // Подредба по вид (Д, О, Ч, ДУ), после по мястото сред вида.
            row.put("typeSort", type.ordinal() * 10000 + no);
            row.put("bel", String.format(Locale.ROOT, "%.2f", bel));
            row.put("mat", String.format(Locale.ROOT, "%.2f", mat));
            row.put("total", String.format(Locale.ROOT, "%.2f", (bel + mat) / 2.0));
            rows.add(row);
        }
        return rows;
    }
}
