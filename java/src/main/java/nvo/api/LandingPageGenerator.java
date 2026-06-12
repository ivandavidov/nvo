package nvo.api;

import nvo.Cities;
import nvo.School;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static nvo.api.GeneratorUtils.escHtml;
import static nvo.api.JsonGenerator.*;

public class LandingPageGenerator {

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

        for (int yearIndex = 0; yearIndex < numYearsForGrade(grade); yearIndex++) {
            int year = FIRST_YEAR + yearIndex;
            final int yi = yearIndex;

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
        System.out.println("Generated " + yearPageCount + " year pages for grade " + grade);
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

    private String methodologyText(String grade, String belLabel, String matLabel) {
        return "Подредбата е по средна стойност на " + escHtml(belLabel) + " и " + escHtml(matLabel)
                + ", изчислена като (" + escHtml(belLabel) + " + " + escHtml(matLabel) + ") / 2."
                + " Включени са само училища с налични резултати и по двата предмета.";
    }

    private String buildCityPageHtml(String grade, String gradeLabel, String cityName, String citySlug,
                                     String belLabel, String matLabel, List<RankedSchool> ranked,
                                     int year, int yearIndex) {
        String examPrefix = gradeExamPrefix(grade);
        String title = cityName + " – " + examPrefix + " " + grade + " клас " + year + " | Иван Давидов";
        String description = "Класация на училищата в " + cityName + " по " + belLabel + " и " + matLabel
                + " за " + examPrefix + " след " + grade + " клас, " + year + " г.";
        String canonical = SITE_BASE_URL + grade + "/" + citySlug + "/";

        StringBuilder sb = new StringBuilder();
        sb.append(landingPageHead(title, description, canonical, grade));
        sb.append("<main>\n<div class=\"container\">\n");
        sb.append("<h1>").append(escHtml(cityName)).append(" – ").append(examPrefix).append(" ").append(grade).append(" клас</h1>\n");
        sb.append("<h2>Класация ").append(year).append(" г.</h2>\n");
        sb.append("<p>").append(methodologyText(grade, belLabel, matLabel)).append("</p>\n");
        sb.append("<p><a href=\"../../").append(grade).append("/\">&#8592; Към основната страница за ").append(grade).append(" клас</a></p>\n");
        sb.append(buildRankingTable(ranked, belLabel, matLabel, yearIndex, false, null));
        sb.append("</div>\n</main>\n");
        sb.append(landingPageFooter());
        return sb.toString();
    }

    private String buildYearPageHtml(String grade, String gradeLabel, String belLabel, String matLabel,
                                     int year, int yearIndex, List<RankedSchool> ranked,
                                     Map<String, String> slugToCity) {
        String examPrefix = gradeExamPrefix(grade);
        String title = examPrefix + " " + grade + " клас " + year + " – национална класация | Иван Давидов";
        String description = "Национална класация на училищата по " + belLabel + " и " + matLabel
                + " за " + examPrefix + " след " + grade + " клас, " + year + " г.";
        String canonical = SITE_BASE_URL + grade + "/" + year + "/";

        StringBuilder sb = new StringBuilder();
        sb.append(landingPageHead(title, description, canonical, grade));
        sb.append("<main>\n<div class=\"container\">\n");
        sb.append("<h1>").append(examPrefix).append(" ").append(grade).append(" клас – ").append(year).append(" г.</h1>\n");
        sb.append("<h2>Национална класация</h2>\n");
        sb.append("<p>").append(methodologyText(grade, belLabel, matLabel)).append("</p>\n");
        sb.append("<p><a href=\"../../").append(grade).append("/\">&#8592; Към основната страница за ").append(grade).append(" клас</a></p>\n");
        sb.append(buildRankingTable(ranked, belLabel, matLabel, yearIndex, true, slugToCity));
        sb.append("</div>\n</main>\n");
        sb.append(landingPageFooter());
        return sb.toString();
    }

    private String buildRankingTable(List<RankedSchool> ranked, String belLabel, String matLabel,
                                     int yearIndex, boolean showCity, Map<String, String> slugToCity) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table>\n<thead><tr>");
        sb.append("<th>#</th>");
        sb.append("<th>Училище</th>");
        if (showCity) sb.append("<th>Град</th>");
        sb.append("<th>").append(escHtml(belLabel)).append("</th>");
        sb.append("<th>").append(escHtml(matLabel)).append("</th>");
        sb.append("<th>Общо</th>");
        sb.append("</tr></thead>\n<tbody>\n");
        int rank = 0;
        for (RankedSchool rs : ranked) {
            rank++;
            double bel = rs.sd().belScore[yearIndex];
            double mat = rs.sd().matScore[yearIndex];
            double score = (bel + mat) / 2.0;
            sb.append("<tr>");
            sb.append("<td>").append(rank).append("</td>");
            sb.append("<td><a href=\"../../school/").append(rs.code()).append("/\">")
                    .append(escHtml(rs.fullName())).append("</a></td>");
            if (showCity && slugToCity != null) {
                String cityName = rs.citySlugs().isEmpty() ? "" : slugToCity.getOrDefault(rs.citySlugs().get(0), "");
                sb.append("<td>").append(escHtml(cityName)).append("</td>");
            }
            sb.append("<td>").append(String.format("%.2f", bel)).append("</td>");
            sb.append("<td>").append(String.format("%.2f", mat)).append("</td>");
            sb.append("<td>").append(String.format("%.2f", score)).append("</td>");
            sb.append("</tr>\n");
        }
        sb.append("</tbody>\n</table>\n");
        return sb.toString();
    }

    private String landingPageHead(String title, String description, String canonical, String grade) {
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
                  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; font-src 'self'">
                  <meta name="referrer" content="strict-origin-when-cross-origin">
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
                        <a href="../../4/" class="grade-tab%s">4 клас</a>
                        <a href="../../7/" class="grade-tab%s">7 клас</a>
                        <a href="../../10/" class="grade-tab%s">10 клас</a>
                        <a href="../../12/" class="grade-tab%s">12 клас</a>
                      </nav>
                      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Смяна на тема">
                        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                      </button>
                    </div>
                  </header>
                """.formatted(
                escHtml(title), escHtml(description), grade, canonical,
                canonical, escHtml(title), escHtml(description), SITE_BASE_URL,
                escHtml(title), escHtml(description), SITE_BASE_URL,
                "4".equals(grade) ? " active" : "",
                "7".equals(grade) ? " active" : "",
                "10".equals(grade) ? " active" : "",
                "12".equals(grade) ? " active" : ""
        );
    }

    static String landingPageFooter() {
        return """
                  <footer class="site-footer">
                    <div class="container">
                      <p class="footer-minimal">&copy; Иван Давидов – НВО и ДЗИ</p>
                    </div>
                  </footer>
                </body>
                </html>
                """;
    }
}
