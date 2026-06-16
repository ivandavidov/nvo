package nvo;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Generates the balove hub page docs/7/balove/index.html — a directory of every
 * city that has a published min/max scores page. The hub decouples balove
 * discoverability from the NVO-7 ranking sections: cities that have RUO data but
 * no exam-taking schools (e.g. Куклен) are reachable here even though they get no
 * si[city] entry in schools-7.js.
 *
 * Source of truth = the per-city directories produced by RuoPage. Run this AFTER
 * all RuoPage invocations so every city directory is present.
 */
public class RuoIndexPage {

    private static final String OUTPUT_BASE = ProjectConfig.DOCS_DIR + "7/" + ProjectConfig.RUO_DIR_NAME + "/";

    public static void main(String... args) throws Exception {
        new RuoIndexPage().generate();
    }

    private void generate() throws Exception {
        List<Cities.City> cities = discoverCities();
        if (cities.isEmpty()) {
            System.err.println("No balove city directories found under " + OUTPUT_BASE);
            System.exit(1);
        }

        Path out = Path.of(OUTPUT_BASE, "index.html");
        Files.writeString(out, buildHtml(cities));
        System.out.println("Written: " + out + " (" + cities.size() + " cities)");
    }

    /**
     * Scans the balove directory for per-city subdirectories that contain an index.html
     * and returns the matching cities in Cities.ORDERED declaration order (which already
     * groups by tier: large cities, then regional centres, then smaller towns).
     */
    private List<Cities.City> discoverCities() throws IOException {
        Set<String> slugs;
        try (Stream<Path> stream = Files.list(Path.of(OUTPUT_BASE))) {
            slugs = stream
                    .filter(Files::isDirectory)
                    .filter(p -> Files.exists(p.resolve("index.html")))
                    .map(p -> p.getFileName().toString())
                    .collect(java.util.stream.Collectors.toSet());
        }
        return Cities.ORDERED.stream()
                .filter(c -> slugs.contains(c.hrefName()))
                .toList();
    }

    // ── HTML assembly ─────────────────────────────────────────────────────

    private String buildHtml(List<Cities.City> cities) {
        String title = "Минимални и максимални балове по паралелки след 7 клас – по градове | Иван Давидов";
        String description = "Минимални и максимални балове по паралелки за прием след 7 клас, "
                + "по градове. Изберете град, за да видите таблици и графики по класирания.";
        String canonical = ProjectConfig.SITE_BASE_URL + "7/" + ProjectConfig.RUO_DIR_NAME + "/";

        return buildHead(title, description, canonical)
                + buildBody(cities)
                + buildFooter();
    }

    private String buildHead(String title, String description, String canonical) {
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
                  <link rel="icon" type="image/png" href="../../images/favicon-7.png">
                  <link rel="canonical" href="%s">
                  <meta property="og:type" content="website">
                  <meta property="og:url" content="%s">
                  <meta property="og:title" content="%s">
                  <meta property="og:description" content="%s">
                  <meta property="og:image" content="%simages/social-preview.png">
                  <meta property="og:locale" content="bg_BG">
                  <meta property="og:site_name" content="НВО и ДЗИ – Иван Давидов">
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
                  <style>
                    .balove-intro { margin: 1rem 0 1.75rem; color: var(--color-text-muted); line-height: 1.7; max-width: 46rem; }
                    .balove-tier-title { margin: 2rem 0 0.9rem; padding-bottom: 0.4rem; border-bottom: 2px solid var(--color-border); font-size: 1.15rem; color: var(--color-text-muted); }
                    .balove-tier-title:first-of-type { margin-top: 1rem; }
                    .balove-subdivider { height: 2rem; }
                    .balove-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin: 0 0 1rem; padding: 0; list-style: none; }
                    .balove-grid li { margin: 0; }
                    .balove-grid a { display: block; padding: 0.85rem 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); color: var(--color-text); text-decoration: none; font-weight: 600; transition: border-color 0.15s, transform 0.15s; }
                    .balove-grid a:hover { border-color: var(--color-primary); transform: translateY(-2px); }
                  </style>
                </head>
                <body>
                """.formatted(
                escHtml(title), escHtml(description), canonical, canonical,
                escHtml(title), escHtml(description), ProjectConfig.SITE_BASE_URL);
    }

    private void appendGrid(StringBuilder sb, List<Cities.City> cities) {
        sb.append("                      <ul class=\"balove-grid\">\n");
        for (Cities.City c : cities) {
            sb.append("                        <li><a href=\"./")
              .append(c.hrefName())
              .append("/\">")
              .append(escHtml(c.fullName()))
              .append("</a></li>\n");
        }
        sb.append("                      </ul>\n");
    }

    /**
     * Renders the city directory using the same grouping convention as the main grade page:
     * one "Областни градове" section (the four largest cities, a thin divider, then the
     * remaining regional centres) and a "Други градове" section for the smaller towns.
     */
    private String buildBody(List<Cities.City> cities) {
        List<Cities.City> big = cities.stream().filter(c -> c.orderPosition() == 1).toList();
        List<Cities.City> regional = cities.stream().filter(c -> c.orderPosition() == 2).toList();
        List<Cities.City> other = cities.stream().filter(c -> c.orderPosition() >= 3).toList();

        StringBuilder sections = new StringBuilder();
        if (!big.isEmpty() || !regional.isEmpty()) {
            sections.append("                      <h2 class=\"balove-tier-title\">Областни градове</h2>\n");
            if (!big.isEmpty()) {
                appendGrid(sections, big);
            }
            if (!big.isEmpty() && !regional.isEmpty()) {
                sections.append("                      <div class=\"balove-subdivider\"></div>\n");
            }
            if (!regional.isEmpty()) {
                appendGrid(sections, regional);
            }
        }
        if (!other.isEmpty()) {
            sections.append("                      <h2 class=\"balove-tier-title\">Други градове</h2>\n");
            appendGrid(sections, other);
        }

        return """
                  <header class="site-header">
                    <div class="header-inner">
                      <a class="site-brand" href="../../" aria-label="Начало">
                        <svg class="site-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        <span class="site-name">НВО и ДЗИ</span>
                      </a>
                      <nav class="grade-tabs">
                        <a href="../../4/" class="grade-tab">4 клас</a>
                        <a href="../" class="grade-tab active">7 клас</a>
                        <a href="../../10/" class="grade-tab">10 клас</a>
                        <a href="../../12/" class="grade-tab">12 клас</a>
                        <a href="../../blog/" class="grade-tab">Блог</a>
                      </nav>
                      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Смяна на тема">
                        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                      </button>
                    </div>
                  </header>
                  <main>
                    <div class="container">
                      <h1>Минимални и максимални балове по паралелки след 7 клас</h1>
                      <p><a href="../">&larr; Към 7 клас</a></p>
                      <p class="balove-intro">Изберете град, за да видите минималните и максималните балове по паралелки за прием след 7 клас &mdash; с таблици и графики по отделните класирания.</p>
                %s            </div>
                  </main>
                """.formatted(sections.toString());
    }

    private String buildFooter() {
        return """
                  <footer class="site-footer">
                    <div class="container">
                      <div class="footer-content">
                        <p class="footer-minimal">&copy; Иван Давидов – НВО и ДЗИ</p>
                        <nav class="footer-links">
                          <a href="../../">Начало</a>
                          <a href="../../blog/">Блог</a>
                          <a href="../../stats/">Статистика</a>
                        </nav>
                      </div>
                    </div>
                  </footer>
                </body>
                </html>
                """;
    }

    private static String escHtml(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
