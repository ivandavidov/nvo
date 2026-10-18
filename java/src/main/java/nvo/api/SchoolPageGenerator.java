package nvo.api;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import nvo.ProjectConfig;
import nvo.site.SiteLayout;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.stream.Stream;

import static nvo.api.GeneratorUtils.cleanDirectory;
import static nvo.api.JsonGenerator.DOCS_BASE;
import static nvo.api.JsonGenerator.OUTPUT_BASE;
import static nvo.api.JsonGenerator.SITE_BASE_URL;

/**
 * Renders the standalone, grade-agnostic per-school pages at {@code docs/school/{code}/index.html}.
 * <p>
 * The pages are built from the {@code schools/{code}.json} documents produced by
 * {@link SchoolsGenerator}; the same JSON is inlined into each page so the client
 * ({@code js/pages/school.js}) can hydrate the charts without an extra request. Must run after
 * the {@code schools} step and before the sitemap step.
 */
public class SchoolPageGenerator {

    private static final String[] GRADE_KEYS = {"4", "7", "10", "12"};
    private static final int NEIGHBORS = 6;

    /**
     * Стари адреси на профили, които вече не съществуват: фантомните профили отпреди поправката на
     * кодовете от НВО 7 клас 2018 г. и старите кодове на обединени училища (NvoDziNormalizer.canonicalCode).
     * Пазим адресите като пренасочвания към верния профил.
     */
    private static final Map<String, String> LEGACY_REDIRECTS = Map.of(
            "10002", "100020",   // II ОУ „Димитър Благоев“, Благоевград
            "80006", "800060",   // ОУ „Антим“, Балчик
            "80008", "800080",   // ОУ „Йордан Йовков“, Каварна
            "10331", "103310",   // СУ „Никола Вапцаров“, Петрич
            "10709", "107090",   // СУ „Кирил и Методий“, Якоруда
            "1000340", "1000005"); // ОУ „Иван Вазов“, Кюстендил — обединен под актуалния код (NvoDziNormalizer.CODE_ALIASES)

    private final Gson gson = new Gson();
    private final Map<String, JsonArray> rankingCache = new HashMap<>();
    /** Училища със същото име в същия град (напр. смяна на кода от МОН): код → другите от групата. */
    private final Map<String, List<JsonObject>> sameNameByCode = new HashMap<>();
    /** Годините с резултати по код (за различимите заглавия). */
    private final Map<String, String> yearSpanByCode = new HashMap<>();

    private record GradeMeta(String examPrefix, String heading, String belLabel, String matLabel) {}

    private static GradeMeta gradeMeta(String grade) {
        return switch (grade) {
            case "12" -> new GradeMeta("ДЗИ", "ДЗИ 12 клас", "БЕЛ", "ДЗИ-2");
            default -> new GradeMeta("НВО", "НВО " + grade + " клас", "БЕЛ", "МАТ");
        };
    }

    public void generate() throws Exception {
        Path schoolsDir = Path.of(OUTPUT_BASE, "schools");
        if (!Files.isDirectory(schoolsDir)) {
            throw new IllegalStateException("Missing " + schoolsDir
                    + " — run 'JsonGenerator schools' before 'school-pages'.");
        }

        Path outBase = Path.of(DOCS_BASE, "school");
        cleanDirectory(outBase);

        List<Path> files = new ArrayList<>();
        try (Stream<Path> stream = Files.list(schoolsDir)) {
            stream.filter(p -> p.getFileName().toString().endsWith(".json"))
                    .sorted()
                    .forEach(files::add);
        }

        List<JsonObject> docs = new ArrayList<>();
        for (Path file : files) {
            docs.add(gson.fromJson(Files.readString(file), JsonObject.class));
        }
        indexSameNames(docs);

        int count = 0;
        for (JsonObject doc : docs) {
            String code = doc.get("code").getAsString();
            Path dir = outBase.resolve(code);
            Files.createDirectories(dir);
            Files.writeString(dir.resolve("index.html"), buildHtml(doc));
            count++;
        }
        int redirects = writeLegacyRedirects(outBase);
        System.out.println("Generated " + count + " school pages and " + redirects + " redirects under " + outBase);
    }

    /** Групира училищата с еднакво име в един град и пресмята годините им с резултати. */
    private void indexSameNames(List<JsonObject> docs) {
        Map<String, List<JsonObject>> groups = new LinkedHashMap<>();
        for (JsonObject doc : docs) {
            String code = doc.get("code").getAsString();
            yearSpanByCode.put(code, yearSpan(doc));
            String city = cityName(doc);
            if (city != null) {
                groups.computeIfAbsent(doc.get("fullName").getAsString() + "|" + city, k -> new ArrayList<>()).add(doc);
            }
        }
        for (List<JsonObject> group : groups.values()) {
            if (group.size() < 2) {
                continue;
            }
            for (JsonObject doc : group) {
                List<JsonObject> others = new ArrayList<>(group);
                others.remove(doc);
                sameNameByCode.put(doc.get("code").getAsString(), others);
            }
        }
    }

    /** „2019–2021“ — първата и последната показвана година (displayFrom) с резултат по който и да е клас. */
    private static String yearSpan(JsonObject doc) {
        TreeSet<Integer> years = new TreeSet<>();
        JsonObject grades = doc.getAsJsonObject("grades");
        for (String grade : GRADE_KEYS) {
            if (!grades.has(grade)) {
                continue;
            }
            JsonObject g = grades.getAsJsonObject(grade);
            JsonArray range = g.getAsJsonArray("yearsRange");
            JsonArray bel = g.getAsJsonArray("belScore");
            JsonArray mat = g.getAsJsonArray("matScore");
            int from = range == null || range.isEmpty() ? 0 : ProjectConfig.displayFrom(grade, range.get(range.size() - 1).getAsInt());
            for (int i = 0; range != null && i < range.size(); i++) {
                if (range.get(i).getAsInt() < from) {
                    continue;
                }
                boolean has = (bel != null && i < bel.size() && !bel.get(i).isJsonNull())
                        || (mat != null && i < mat.size() && !mat.get(i).isJsonNull());
                if (has) {
                    years.add(range.get(i).getAsInt());
                }
            }
        }
        if (years.isEmpty()) {
            return "";
        }
        return years.first().equals(years.last()) ? String.valueOf(years.first()) : years.first() + "–" + years.last();
    }

    private static String cityName(JsonObject doc) {
        return doc.has("city") && doc.get("city").isJsonObject() ? str(doc.getAsJsonObject("city"), "name") : null;
    }

    /** Пренасочващи страници за старите адреси (LEGACY_REDIRECTS) — само ако верният профил съществува. */
    private int writeLegacyRedirects(Path outBase) throws Exception {
        int n = 0;
        for (Map.Entry<String, String> e : LEGACY_REDIRECTS.entrySet()) {
            if (!Files.exists(outBase.resolve(e.getValue()).resolve("index.html")) || Files.exists(outBase.resolve(e.getKey()))) {
                continue;
            }
            GeneratorUtils.writeRedirectPage(outBase.resolve(e.getKey()), "../" + e.getValue() + "/",
                    SITE_BASE_URL + "school/" + e.getValue() + "/", "../../",
                    "Пренасочване към профила на училището", "Профилът е преместен", "към профила на училището");
            n++;
        }
        return n;
    }

    private String buildHtml(JsonObject doc) {
        String code = doc.get("code").getAsString();
        String fullName = doc.get("fullName").getAsString();
        boolean isPrivate = doc.has("isPrivate") && doc.get("isPrivate").getAsBoolean();
        String website = str(doc, "website");
        String cityName = null;
        String citySlug = null;
        if (doc.has("city") && doc.get("city").isJsonObject()) {
            JsonObject cityObj = doc.getAsJsonObject("city");
            cityName = str(cityObj, "name");
            citySlug = str(cityObj, "slug");
        }
        JsonArray years = doc.getAsJsonArray("yearsRange");
        JsonObject grades = doc.getAsJsonObject("grades");
        String canonical = SITE_BASE_URL + "school/" + code + "/";
        String primaryGrade = firstGrade(grades);

        SiteLayout.Page page = new SiteLayout.Page("../../").favicon("favicon-" + primaryGrade + ".png");
        Map<String, Object> ctx = page.context();
        ctx.put("head", SiteLayout.head(page));
        ctx.put("header", SiteLayout.header(page));
        ctx.put("footer", SiteLayout.footer(page));
        ctx.put("siteUrl", SITE_BASE_URL);
        // Градът в заглавието: много училища имат еднакви имена в различни градове (напр. „ОУ Кирил и Методий“).
        // Еднакво име в същия град (МОН е сменил кода) — заглавието се различава и по годините с резултати.
        List<JsonObject> sameName = sameNameByCode.getOrDefault(code, List.of());
        String span = yearSpanByCode.getOrDefault(code, "");
        boolean spanUnique = sameName.stream().noneMatch(o -> span.equals(yearSpanByCode.get(o.get("code").getAsString())));
        String titleCity;
        if (!sameName.isEmpty() && cityName != null) {
            titleCity = " (" + cityName + (span.isEmpty() ? "" : ", " + span) + (spanUnique ? "" : ", код " + code) + ")";
        } else {
            titleCity = cityName != null && !fullName.contains(cityName) ? " (" + cityName + ")" : "";
        }
        ctx.put("title", fullName + titleCity + " – резултати от НВО и ДЗИ | Иван Давидов");
        ctx.put("description", "Резултати, класации и графики за " + fullName
                + (!sameName.isEmpty() ? titleCity : cityName != null ? " (" + cityName + ")" : "")
                + " по БЕЛ и математика за НВО и ДЗИ за последните години.");
        ctx.put("canonical", canonical);
        ctx.put("jsonLd", jsonLd(fullName, canonical, website, cityName));
        ctx.put("crumbsLd", crumbsLd(fullName, canonical, cityName, citySlug, primaryGrade));
        ctx.put("code", code);
        ctx.put("fullName", fullName);
        ctx.put("isPrivate", isPrivate);
        ctx.put("typeLabel", isPrivate ? "Частно" : "Държавно");
        ctx.put("cityName", cityName);
        ctx.put("citySlug", citySlug);
        ctx.put("primaryGrade", primaryGrade);
        ctx.put("website", website);
        List<Map<String, Object>> sameNameLinks = new ArrayList<>();
        for (JsonObject other : sameName) {
            String otherCode = other.get("code").getAsString();
            Map<String, Object> link = new HashMap<>();
            link.put("href", "../" + otherCode + "/");
            link.put("name", other.get("fullName").getAsString());
            link.put("code", otherCode);
            link.put("years", yearSpanByCode.getOrDefault(otherCode, ""));
            sameNameLinks.add(link);
        }
        ctx.put("sameName", sameNameLinks);
        ctx.put("ownYears", span);

        List<Map<String, Object>> gradeNav = new ArrayList<>();
        List<Map<String, Object>> sections = new ArrayList<>();
        List<String> displayed = GeneratorUtils.displayedGrades(doc);
        for (String grade : GRADE_KEYS) {
            if (!displayed.contains(grade)) {
                continue; // няма резултат в показваните години
            }
            Map<String, Object> section = gradeSection(grade, grades.getAsJsonObject(grade), years, doc);
            Map<String, Object> nav = new HashMap<>();
            nav.put("grade", grade);
            nav.put("label", grade + " клас");
            gradeNav.add(nav);
            sections.add(section);
        }
        ctx.put("gradeNav", gradeNav);
        ctx.put("multiGrade", gradeNav.size() > 1);
        ctx.put("sections", sections);
        // Само стари резултати (преди показваните години): кратка страница с бележка, noindex,
        // извън sitemap-а и търсенето; данните остават в API-то.
        if (sections.isEmpty()) {
            ctx.put("noData", true);
            ctx.put("noDataFrom", java.util.Arrays.stream(GRADE_KEYS).filter(grades::has)
                    .mapToInt(g -> ProjectConfig.DISPLAY_FROM.get(g)).min().orElse(0));
        }
        // Същият документ като в API-то — за графиките и PDF (js/pages/school.js).
        ctx.put("inlined", gson.toJson(doc).replace("</", "<\\/"));
        return SiteLayout.render("school", ctx);
    }

    private Map<String, Object> gradeSection(String grade, JsonObject g, JsonArray fallbackYears, JsonObject doc) {
        GradeMeta meta = gradeMeta(grade);
        // Each grade carries its own yearsRange (DZI may span one more year than NVO); the score
        // arrays are sized to it, so the table must iterate this grade's range, not the document-wide one.
        JsonArray years = g.has("yearsRange") && g.get("yearsRange").isJsonArray()
                ? g.getAsJsonArray("yearsRange") : fallbackYears;
        String code = doc.get("code").getAsString();
        String citySlug = null;
        if (doc.has("city") && doc.get("city").isJsonObject()) {
            citySlug = str(doc.getAsJsonObject("city"), "slug");
        }

        Map<String, Object> section = new HashMap<>();
        section.put("grade", grade);
        section.put("heading", meta.heading());
        section.put("belLabel", meta.belLabel());
        section.put("matLabel", meta.matLabel());
        section.put("schoolCode", code);

        List<Map<String, Object>> kpis = new ArrayList<>();
        Integer latestYear = intOrNull(g, "latestYear");
        if (latestYear != null) {
            kpis.add(kpi("Последна година", String.valueOf(latestYear), null));
        }
        Integer natRank = intOrNull(g, "nationalRank");
        Integer natTotal = intOrNull(g, "nationalTotal");
        if (natRank != null && natTotal != null) {
            kpis.add(kpi("Национален ранг", String.valueOf(natRank), String.valueOf(natTotal)));
        }
        Integer cityRank = intOrNull(g, "cityRank");
        Integer cityTotal = intOrNull(g, "cityTotal");
        if (cityRank != null && cityTotal != null) {
            kpis.add(kpi("В града", String.valueOf(cityRank), String.valueOf(cityTotal)));
        }
        Integer medianRank = intOrNull(g, "medianRank");
        Integer medianTotal = intOrNull(g, "medianTotal");
        if (medianRank != null && medianTotal != null) {
            kpis.add(kpi("Медианен ранг (3 г.)", String.valueOf(medianRank), String.valueOf(medianTotal)));
        }
        section.put("kpis", kpis);

        // Table (latest year first), only rows with any data, only the displayed years (displayFrom)
        List<Map<String, Object>> rows = new ArrayList<>();
        JsonArray bel = g.getAsJsonArray("belScore");
        JsonArray mat = g.getAsJsonArray("matScore");
        JsonArray belU = g.getAsJsonArray("belStudents");
        JsonArray matU = g.getAsJsonArray("matStudents");
        int from = years.isEmpty() ? 0 : ProjectConfig.displayFrom(grade, years.get(years.size() - 1).getAsInt());
        for (int i = years.size() - 1; i >= 0 && years.get(i).getAsInt() >= from; i--) {
            boolean hasBel = !bel.get(i).isJsonNull();
            boolean hasMat = !mat.get(i).isJsonNull();
            if (!hasBel && !hasMat) {
                continue;
            }
            Map<String, Object> row = new HashMap<>();
            row.put("year", years.get(i).getAsInt());
            row.put("bel", hasBel ? fmt(bel.get(i).getAsDouble()) : "");
            row.put("bu", cell(belU, i));
            row.put("mat", hasMat ? fmt(mat.get(i).getAsDouble()) : "");
            row.put("mu", cell(matU, i));
            rows.add(row);
        }
        section.put("rows", rows);

        // Contextual links: open the school in the interactive chart, plus the city/year rankings.
        List<Map<String, Object>> links = new ArrayList<>();
        links.add(link("../../" + grade + "/?school=" + code, "Виж в графиката"));
        // Само ако за града има страница с класация за този клас (напр. без данни за последната година няма).
        if (citySlug != null && Files.exists(Path.of(DOCS_BASE, grade, citySlug, "index.html"))) {
            links.add(link("../../" + grade + "/" + citySlug + "/", "Класация в града"));
        }
        if (latestYear != null) {
            links.add(link("../../" + grade + "/" + latestYear + "/", "Национална класация " + latestYear));
        }
        links.add(link("../../" + grade + "/", "Към " + meta.heading()));
        section.put("links", links);

        // Schools ranked next to this one in the same city for this grade (latest year).
        List<Map<String, Object>> neighbors = new ArrayList<>();
        if (citySlug != null && latestYear != null) {
            for (String[] n : cityNeighbors(grade, latestYear, citySlug, code)) {
                Map<String, Object> item = new HashMap<>();
                item.put("neighborCode", n[0]);
                item.put("neighborName", n[1]);
                neighbors.add(item);
            }
        }
        section.put("neighbors", neighbors);
        section.put("hasNeighbors", !neighbors.isEmpty());
        return section;
    }

    private static Map<String, Object> kpi(String label, String value, String total) {
        Map<String, Object> m = new HashMap<>();
        m.put("label", label);
        m.put("value", value);
        m.put("total", total);
        return m;
    }

    private static Map<String, Object> link(String href, String label) {
        Map<String, Object> m = new HashMap<>();
        m.put("href", href);
        m.put("label", label);
        return m;
    }

    private static String jsonLd(String fullName, String canonical, String website, String cityName) {
        StringBuilder jsonLd = new StringBuilder();
        jsonLd.append("{\"@context\":\"https://schema.org\",\"@type\":\"EducationalOrganization\",")
                .append("\"name\":").append(jsonString(fullName)).append(",")
                .append("\"url\":").append(jsonString(canonical));
        if (website != null) {
            jsonLd.append(",\"sameAs\":").append(jsonString(website));
        }
        if (cityName != null) {
            jsonLd.append(",\"address\":{\"@type\":\"PostalAddress\",\"addressLocality\":")
                    .append(jsonString(cityName)).append(",\"addressCountry\":\"BG\"}");
        }
        jsonLd.append("}");
        return jsonLd.toString();
    }

    /** BreadcrumbList mirrors the on-page breadcrumb (Начало › City › School) for SEO. */
    private static String crumbsLd(String fullName, String canonical, String cityName, String citySlug, String primaryGrade) {
        StringBuilder crumbs = new StringBuilder();
        crumbs.append("{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[");
        int pos = 1;
        crumbs.append("{\"@type\":\"ListItem\",\"position\":").append(pos++)
                .append(",\"name\":\"Начало\",\"item\":").append(jsonString(SITE_BASE_URL)).append("}");
        if (cityName != null && citySlug != null) {
            crumbs.append(",{\"@type\":\"ListItem\",\"position\":").append(pos++)
                    .append(",\"name\":").append(jsonString(cityName))
                    .append(",\"item\":").append(jsonString(SITE_BASE_URL + primaryGrade + "/" + citySlug + "/")).append("}");
        }
        crumbs.append(",{\"@type\":\"ListItem\",\"position\":").append(pos)
                .append(",\"name\":").append(jsonString(fullName))
                .append(",\"item\":").append(jsonString(canonical)).append("}");
        crumbs.append("]}");
        return crumbs.toString();
    }

    // ---- small helpers ----

    /** Loads (and caches) the per-year national ranking array for a grade, or null if missing. */
    private JsonArray loadRanking(String grade, int year) {
        String key = grade + "/" + year;
        if (rankingCache.containsKey(key)) {
            return rankingCache.get(key);
        }
        JsonArray arr = null;
        Path file = Path.of(OUTPUT_BASE, "rankings", grade, year + ".json");
        try {
            if (Files.exists(file)) {
                JsonObject doc = gson.fromJson(Files.readString(file), JsonObject.class);
                if (doc != null && doc.has("schools")) {
                    arr = doc.getAsJsonArray("schools");
                }
            }
        } catch (Exception e) {
            // No related block if the ranking cannot be read.
        }
        rankingCache.put(key, arr);
        return arr;
    }

    /**
     * Schools ranked next to {@code selfCode} within {@code citySlug} for the given grade/year,
     * derived from the national ranking (filtering by city preserves the score order). Returns up
     * to {@link #NEIGHBORS} entries as {code, displayName}, centred on the school.
     */
    private List<String[]> cityNeighbors(String grade, int year, String citySlug, String selfCode) {
        List<String[]> result = new ArrayList<>();
        JsonArray ranking = loadRanking(grade, year);
        if (ranking == null) {
            return result;
        }
        List<JsonObject> inCity = new ArrayList<>();
        int selfIdx = -1;
        for (JsonElement el : ranking) {
            JsonObject e = el.getAsJsonObject();
            JsonArray cities = e.has("cities") ? e.getAsJsonArray("cities") : null;
            boolean match = false;
            if (cities != null) {
                for (JsonElement c : cities) {
                    if (citySlug.equals(c.getAsString())) {
                        match = true;
                        break;
                    }
                }
            }
            if (!match) {
                continue;
            }
            if (selfCode.equals(e.get("code").getAsString())) {
                selfIdx = inCity.size();
            }
            inCity.add(e);
        }
        if (selfIdx < 0 || inCity.size() <= 1) {
            return result;
        }
        int total = inCity.size();
        int start = Math.max(0, selfIdx - NEIGHBORS / 2);
        int end = Math.min(total, start + NEIGHBORS + 1);
        start = Math.max(0, end - (NEIGHBORS + 1));
        for (int i = start; i < end; i++) {
            if (i == selfIdx) {
                continue;
            }
            JsonObject e = inCity.get(i);
            String code = e.get("code").getAsString();
            String name = e.has("shortName") && !e.get("shortName").isJsonNull()
                    ? e.get("shortName").getAsString()
                    : e.get("fullName").getAsString();
            result.add(new String[]{code, name});
        }
        return result;
    }

    private static String firstGrade(JsonObject grades) {
        for (String grade : GRADE_KEYS) {
            if (grades.has(grade)) {
                return grade;
            }
        }
        return "7";
    }

    private static String cell(JsonArray arr, int i) {
        JsonElement e = arr.get(i);
        return e.isJsonNull() ? "" : String.valueOf(e.getAsInt());
    }

    private static String fmt(double v) {
        return String.format(java.util.Locale.ROOT, "%.2f", v);
    }

    private static String str(JsonObject obj, String key) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsString() : null;
    }

    private static Integer intOrNull(JsonObject obj, String key) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsInt() : null;
    }

    private static String jsonString(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
