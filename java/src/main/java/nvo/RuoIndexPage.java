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

    // ── HTML ──────────────────────────────────────────────────────────────

    /**
     * Градовете са групирани като на страниците по клас: „Областни градове“ (четирите
     * големи, после областните центрове) и „Други градове“. Всяка карта показва броя
     * училища и паралелки и годините с данни (прочетени от docs/js/ruo-{град}.js).
     */
    private String buildHtml(List<Cities.City> cities) throws IOException {
        nvo.site.SiteLayout.Page page = new nvo.site.SiteLayout.Page("../../")
                .active(nvo.site.SiteLayout.BALOVE).favicon("favicon-7.png");
        java.util.Map<String, Object> ctx = page.context();
        ctx.put("head", nvo.site.SiteLayout.head(page));
        ctx.put("header", nvo.site.SiteLayout.header(page));
        ctx.put("footer", nvo.site.SiteLayout.footer(page));
        ctx.put("siteUrl", ProjectConfig.SITE_BASE_URL);
        ctx.put("title", "Минимални и максимални балове по паралелки след 7 клас – по градове | Иван Давидов");
        ctx.put("description", "Минимални и максимални балове по паралелки за прием след 7 клас, "
                + "по градове. Изберете град, за да видите таблици и графики по класирания.");
        ctx.put("canonical", ProjectConfig.SITE_BASE_URL + "7/" + ProjectConfig.RUO_DIR_NAME + "/");
        ctx.put("cityCount", cities.size());

        List<java.util.Map<String, Object>> tiers = new java.util.ArrayList<>();
        List<Cities.City> regional = cities.stream().filter(c -> c.orderPosition() <= 2).toList();
        List<Cities.City> other = cities.stream().filter(c -> c.orderPosition() >= 3).toList();
        if (!regional.isEmpty()) {
            tiers.add(tier("Областни градове", regional));
        }
        if (!other.isEmpty()) {
            tiers.add(tier("Други градове", other));
        }
        ctx.put("tiers", tiers);
        return nvo.site.SiteLayout.render("balove-hub", ctx);
    }

    private java.util.Map<String, Object> tier(String label, List<Cities.City> cities) throws IOException {
        List<java.util.Map<String, Object>> items = new java.util.ArrayList<>();
        for (Cities.City c : cities) {
            String js = Files.readString(Path.of(ProjectConfig.DOCS_JS_DIR, "ruo-" + c.hrefName() + ".js"));
            java.util.regex.Matcher ym = java.util.regex.Pattern.compile("ruoYears = \\[([^\\]]*)\\]").matcher(js);
            String years = "";
            if (ym.find()) {
                String[] parts = ym.group(1).split(",");
                years = parts.length == 1 ? parts[0].trim() : parts[0].trim() + "–" + parts[parts.length - 1].trim();
            }
            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("name", c.fullName());
            item.put("slug", c.hrefName());
            item.put("big", c.orderPosition() == 1);
            item.put("schools", count(js, "ruoSchools[\""));
            item.put("profiles", count(js, ", d: ["));
            item.put("years", years);
            items.add(item);
        }
        java.util.Map<String, Object> t = new java.util.HashMap<>();
        t.put("label", label);
        t.put("cities", items);
        return t;
    }

    private static int count(String text, String needle) {
        int n = 0;
        for (int i = text.indexOf(needle); i >= 0; i = text.indexOf(needle, i + needle.length())) {
            n++;
        }
        return n;
    }
}
