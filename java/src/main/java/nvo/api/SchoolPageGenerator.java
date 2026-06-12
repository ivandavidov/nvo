package nvo.api;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static nvo.api.GeneratorUtils.cleanDirectory;
import static nvo.api.GeneratorUtils.escHtml;
import static nvo.api.JsonGenerator.DOCS_BASE;
import static nvo.api.JsonGenerator.OUTPUT_BASE;
import static nvo.api.JsonGenerator.SITE_BASE_URL;

/**
 * Renders the standalone, grade-agnostic per-school pages at {@code docs/school/{code}/index.html}.
 * <p>
 * The pages are built from the {@code schools/{code}.json} documents produced by
 * {@link SchoolsGenerator}; the same JSON is inlined into each page so the client
 * ({@code logic-school.js}) can hydrate the charts without an extra request. Must run after
 * the {@code schools} step and before the sitemap step.
 */
public class SchoolPageGenerator {

    private static final String[] GRADE_KEYS = {"4", "7", "10", "12"};
    private static final int NEIGHBORS = 6;

    private final Gson gson = new Gson();
    private final Map<String, JsonArray> rankingCache = new HashMap<>();

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

        int count = 0;
        for (Path file : files) {
            JsonObject doc = gson.fromJson(Files.readString(file), JsonObject.class);
            String code = doc.get("code").getAsString();
            Path dir = outBase.resolve(code);
            Files.createDirectories(dir);
            Files.writeString(dir.resolve("index.html"), buildHtml(doc));
            count++;
        }
        System.out.println("Generated " + count + " school pages under " + outBase);
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

        String typeLabel = isPrivate ? "Частно" : "Държавно";
        String canonical = SITE_BASE_URL + "school/" + code + "/";
        String title = fullName + " – резултати от НВО и ДЗИ | Иван Давидов";
        String description = "Резултати, класации и графики за " + fullName
                + (cityName != null ? " (" + cityName + ")" : "")
                + " по БЕЛ и математика за НВО и ДЗИ за последните години.";
        String primaryGrade = firstGrade(grades);

        StringBuilder sb = new StringBuilder();
        sb.append(head(title, description, canonical, primaryGrade, fullName, website, cityName, citySlug));

        sb.append("<main>\n<div class=\"container\">\n");
        sb.append("<section class=\"hero-section\">\n");

        // Breadcrumb — upward navigation + city context (replaces the old "back to home" link).
        sb.append("<nav class=\"breadcrumb\" aria-label=\"breadcrumb\">");
        sb.append("<a href=\"../../\">Начало</a>");
        if (cityName != null && citySlug != null) {
            sb.append("<span class=\"breadcrumb-sep\">›</span>")
                    .append("<a href=\"../../").append(primaryGrade).append("/").append(citySlug)
                    .append("/\">").append(escHtml(cityName)).append("</a>");
        }
        sb.append("<span class=\"breadcrumb-sep\">›</span>")
                .append("<span class=\"breadcrumb-current\">").append(escHtml(fullName)).append("</span>");
        sb.append("</nav>\n");

        // Title + actions on one row (actions wrap below the title on narrow screens).
        sb.append("<div class=\"school-hero-head\">\n");
        sb.append("<h1 class=\"page-title\">").append(escHtml(fullName)).append("</h1>\n");
        sb.append("<div class=\"school-actions\">");
        if (website != null) {
            sb.append("<a class=\"button\" href=\"").append(escHtml(website))
                    .append("\" target=\"_blank\" rel=\"noopener noreferrer\">Уебсайт ↗</a>");
        }
        sb.append("<button type=\"button\" id=\"schoolPdfBtn\" class=\"button button-primary\">Изтегли PDF</button>");
        sb.append("</div>\n");
        sb.append("</div>\n");

        // Subtitle — identity facts only.
        sb.append("<p class=\"page-subtitle\">").append(escHtml(typeLabel));
        if (cityName != null) {
            sb.append(" · ").append(escHtml(cityName));
        }
        sb.append("</p>\n");
        sb.append("</section>\n");

        // Sticky in-page navigation across the grade sections (data grades only; skip when just one).
        int gradeCount = 0;
        for (String grade : GRADE_KEYS) {
            if (grades.has(grade)) {
                gradeCount++;
            }
        }
        if (gradeCount > 1) {
            sb.append("<nav class=\"school-section-nav\" aria-label=\"Класове\">");
            for (String grade : GRADE_KEYS) {
                if (grades.has(grade)) {
                    sb.append("<a href=\"#grade-").append(grade).append("\">")
                            .append(grade).append(" клас</a>");
                }
            }
            sb.append("</nav>\n");
        }

        for (String grade : GRADE_KEYS) {
            if (!grades.has(grade)) {
                continue;
            }
            sb.append(gradeSection(grade, grades.getAsJsonObject(grade), years, doc));
        }

        sb.append("</div>\n</main>\n");
        sb.append(LandingPageGenerator.landingPageFooter().replace("</body>\n</html>\n", ""));

        // Inlined data + chart hydration. The JSON is the same document the API serves.
        String inlined = gson.toJson(doc).replace("</", "<\\/");
        sb.append("  <script type=\"application/json\" id=\"school-data\">").append(inlined).append("</script>\n");
        sb.append("  <script src=\"../../js/highcharts.js\" defer></script>\n");
        sb.append("  <script src=\"../../js/config-global.js\" defer></script>\n");
        sb.append("  <script src=\"../../js/logic-school.js\" defer></script>\n");
        sb.append("</body>\n</html>\n");
        return sb.toString();
    }

    private String gradeSection(String grade, JsonObject g, JsonArray fallbackYears, JsonObject doc) {
        GradeMeta meta = gradeMeta(grade);
        // Each grade carries its own yearsRange (DZI spans one more year than NVO); the score arrays
        // are sized to it, so the table must iterate this grade's range, not the document-wide one.
        JsonArray years = g.has("yearsRange") && g.get("yearsRange").isJsonArray()
                ? g.getAsJsonArray("yearsRange") : fallbackYears;
        StringBuilder sb = new StringBuilder();
        sb.append("<section class=\"card school-grade\" id=\"grade-").append(grade).append("\">\n");
        sb.append("<h3 class=\"card-title\">").append(meta.heading()).append("</h3>\n");

        // Stats — compact 2x2 grid of labelled stat cells (4-up on wider screens via CSS).
        sb.append("<div class=\"school-stats\">");
        Integer latestYear = intOrNull(g, "latestYear");
        if (latestYear != null) {
            sb.append(statCell("Последна година", String.valueOf(latestYear), null));
        }
        Integer natRank = intOrNull(g, "nationalRank");
        Integer natTotal = intOrNull(g, "nationalTotal");
        if (natRank != null && natTotal != null) {
            sb.append(statCell("Национален ранг", String.valueOf(natRank), "/ " + natTotal));
        }
        Integer cityRank = intOrNull(g, "cityRank");
        Integer cityTotal = intOrNull(g, "cityTotal");
        if (cityRank != null && cityTotal != null) {
            sb.append(statCell("В града", String.valueOf(cityRank), "/ " + cityTotal));
        }
        Integer medianRank = intOrNull(g, "medianRank");
        Integer medianTotal = intOrNull(g, "medianTotal");
        if (medianRank != null && medianTotal != null) {
            sb.append(statCell("Медианен ранг (3 г.)", String.valueOf(medianRank), "/ " + medianTotal));
        }
        sb.append("</div>\n");

        // Chart container (hydrated by logic-school.js)
        sb.append("<div class=\"school-chart\" id=\"chart-").append(grade).append("\"></div>\n");

        // Table (latest year first), only rows with any data
        sb.append("<table>\n<thead><tr><th>Година</th><th>")
                .append(escHtml(meta.belLabel())).append("</th><th>уч.</th><th>")
                .append(escHtml(meta.matLabel())).append("</th><th>уч.</th></tr></thead>\n<tbody>\n");
        JsonArray bel = g.getAsJsonArray("belScore");
        JsonArray mat = g.getAsJsonArray("matScore");
        JsonArray belU = g.getAsJsonArray("belStudents");
        JsonArray matU = g.getAsJsonArray("matStudents");
        for (int i = years.size() - 1; i >= 0; i--) {
            boolean hasBel = !bel.get(i).isJsonNull();
            boolean hasMat = !mat.get(i).isJsonNull();
            if (!hasBel && !hasMat) {
                continue;
            }
            sb.append("<tr><td>").append(years.get(i).getAsInt()).append("</td>");
            sb.append("<td>").append(hasBel ? fmt(bel.get(i).getAsDouble()) : "").append("</td>");
            sb.append("<td>").append(cell(belU, i)).append("</td>");
            sb.append("<td>").append(hasMat ? fmt(mat.get(i).getAsDouble()) : "").append("</td>");
            sb.append("<td>").append(cell(matU, i)).append("</td>");
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n");

        // Contextual links: open the school in the interactive chart, plus the city/year rankings.
        String citySlug = null;
        if (doc.has("city") && doc.get("city").isJsonObject()) {
            citySlug = str(doc.getAsJsonObject("city"), "slug");
        }
        String code = doc.get("code").getAsString();
        List<String> links = new ArrayList<>();
        links.add("<a href=\"../../" + grade + "/?school=" + code + "\">Виж в графиката</a>");
        if (citySlug != null) {
            links.add("<a href=\"../../" + grade + "/" + citySlug + "/\">Класация в града</a>");
        }
        if (latestYear != null) {
            links.add("<a href=\"../../" + grade + "/" + latestYear + "/\">Национална класация " + latestYear + "</a>");
        }
        links.add("<a href=\"../../" + grade + "/\">Към " + meta.heading() + "</a>");
        sb.append("<p class=\"school-links\">").append(String.join(" · ", links)).append("</p>\n");

        // Schools ranked next to this one in the same city for this grade (latest year).
        if (citySlug != null && latestYear != null) {
            List<String[]> neighbors = cityNeighbors(grade, latestYear, citySlug, code);
            if (!neighbors.isEmpty()) {
                String cityNm = doc.has("city") && doc.get("city").isJsonObject()
                        ? str(doc.getAsJsonObject("city"), "name") : null;
                sb.append("<div class=\"school-related\"><span class=\"school-related-label\">Близки по успех")
                        .append(cityNm != null ? " в " + escHtml(cityNm) : "").append(":</span> ");
                List<String> parts = new ArrayList<>();
                for (String[] n : neighbors) {
                    parts.add("<a href=\"../" + n[0] + "/\">" + escHtml(n[1]) + "</a>");
                }
                sb.append(String.join(" · ", parts)).append("</div>\n");
            }
        }

        sb.append("</section>\n");
        return sb.toString();
    }

    private String head(String title, String description, String canonical, String primaryGrade,
                        String fullName, String website, String cityName, String citySlug) {
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

        // BreadcrumbList mirrors the on-page breadcrumb (Начало › City › School) for SEO.
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

        return """
                <!DOCTYPE html>
                <html lang="bg">
                <head>
                  <meta charset="utf-8">
                  <title>%s</title>
                  <meta name="description" content="%s">
                  <meta name="author" content="Иван Давидов">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <link rel="stylesheet" href="../../css/normalize.css">
                  <link rel="stylesheet" href="../../css/custom.css">
                  <link rel="icon" type="image/png" href="../../images/favicon-%s.png">
                  <link rel="canonical" href="%s">
                  <meta property="og:type" content="website">
                  <meta property="og:url" content="%s">
                  <meta property="og:title" content="%s">
                  <meta property="og:description" content="%s">
                  <meta property="og:image" content="%simages/social-preview.png">
                  <meta property="og:locale" content="bg_BG">
                  <meta property="og:site_name" content="НВО и ДЗИ – Иван Давидов">
                  <meta name="twitter:card" content="summary_large_image">
                  <meta name="twitter:title" content="%s">
                  <meta name="twitter:description" content="%s">
                  <meta name="twitter:image" content="%simages/social-preview.png">
                  <script type="application/ld+json">%s</script>
                  <script type="application/ld+json">%s</script>
                  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; font-src 'self'">
                  <meta name="referrer" content="strict-origin-when-cross-origin">
                  <style>
                    .school-grade { margin-bottom: 1.5rem; scroll-margin-top: var(--sticky-offset, calc(var(--header-height) + 3.75rem)); }
                    .hero-section { padding: 0.6rem 0 0; }
                    .breadcrumb { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.6rem; }
                    .breadcrumb a { color: var(--color-text-muted); text-decoration: none; }
                    .breadcrumb a:hover { color: var(--color-primary); text-decoration: underline; }
                    .breadcrumb-sep { color: var(--color-text-light); }
                    .breadcrumb-current { color: var(--color-text); font-weight: 600; }
                    .school-hero-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.6rem 1rem; margin-bottom: 0.6rem; }
                    .school-hero-head .page-title { margin: 0; }
                    .school-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                    .school-actions .button { margin: 0; }
                    .hero-section .page-subtitle { margin-bottom: 0.6rem; }
                    .school-section-nav { position: sticky; top: var(--sticky-top, var(--header-height)); z-index: 90; display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.55rem 0; margin-bottom: 1.5rem; background: var(--color-surface-glass); backdrop-filter: blur(8px); border-bottom: 1px solid var(--color-border); }
                    .school-section-nav a { font-size: 0.85rem; font-weight: 600; padding: 0.3rem 0.85rem; border-radius: var(--radius-full); background: var(--color-primary-lighter); color: var(--color-primary-dark); text-decoration: none; transition: background 0.15s ease, color 0.15s ease; }
                    .school-section-nav a:hover { background: var(--color-primary); color: #fff; }
                    .school-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin: 0 0 1.1rem; }
                    .school-stats .stat { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.5rem 0.7rem; background: var(--color-bg); border-radius: var(--radius-md); }
                    .school-stats .stat-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; color: var(--color-text-muted); }
                    .school-stats .stat-value { font-size: 1.05rem; font-weight: 700; color: var(--color-text); }
                    .school-stats .stat-total { font-size: 0.82rem; font-weight: 500; color: var(--color-text-muted); }
                    .school-chart { width: 100%%; min-height: 360px; }
                    .school-grade table { margin: 1rem 0 0.75rem; }
                    .school-links { font-size: 0.9rem; }
                    .school-related { margin: 0.5rem 0 0; font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.7; }
                    .school-related-label { font-weight: 600; color: var(--color-text); }
                    @media (min-width: 640px) { .school-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
                  </style>
                  <script>
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('consent', 'default', {
                      'analytics_storage': 'denied',
                      'ad_storage': 'denied',
                      'wait_for_update': 500
                    });
                  </script>
                  <script async src="https://www.googletagmanager.com/gtag/js?id=G-V0P6LBF76F"></script>
                  <script>
                    gtag('js', new Date());
                    gtag('config', 'G-V0P6LBF76F', {'anonymize_ip': true});
                  </script>
                  <script src="../../js/theme.js"></script>
                </head>
                <body>
                  <header class="site-header">
                    <div class="header-inner">
                      <a class="site-brand" href="../../" aria-label="Начало">
                        <svg class="site-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        <span class="site-name">НВО и ДЗИ</span>
                      </a>
                      <nav class="grade-tabs">
                        <a href="../../4/" class="grade-tab">4 клас</a>
                        <a href="../../7/" class="grade-tab">7 клас</a>
                        <a href="../../10/" class="grade-tab">10 клас</a>
                        <a href="../../12/" class="grade-tab">12 клас</a>
                      </nav>
                      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Смяна на тема">
                        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                      </button>
                    </div>
                  </header>
                """.formatted(
                escHtml(title), escHtml(description), primaryGrade, canonical,
                canonical, escHtml(title), escHtml(description), SITE_BASE_URL,
                escHtml(title), escHtml(description), SITE_BASE_URL,
                jsonLd, crumbs
        );
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

    /** One stat cell: small label above a bold value, with an optional muted "/ total" suffix. */
    private static String statCell(String label, String value, String total) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div class=\"stat\"><span class=\"stat-label\">").append(escHtml(label))
                .append("</span><span class=\"stat-value\">").append(escHtml(value));
        if (total != null) {
            sb.append(" <span class=\"stat-total\">").append(escHtml(total)).append("</span>");
        }
        sb.append("</span></div>");
        return sb.toString();
    }

    private static String fmt(double v) {
        return String.format("%.2f", v);
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
