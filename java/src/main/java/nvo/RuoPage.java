package nvo;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

public class RuoPage {

    private static final String OUTPUT_BASE = ProjectConfig.DOCS_DIR + "7/" + ProjectConfig.RUO_DIR_NAME + "/";

    public static void main(String... args) throws Exception {
        if (args.length == 0) {
            System.err.println("Expected argument: city hrefName (e.g. sofia)");
            System.exit(1);
        }
        new RuoPage().generate(args[0]);
    }

    private void generate(String hrefName) throws Exception {
        Cities.City city = Cities.ORDERED.stream()
                .filter(c -> c.hrefName().equals(hrefName))
                .findFirst()
                .orElse(null);

        if (city == null) {
            System.err.println("City not found in Cities.ORDERED: " + hrefName);
            System.exit(1);
        }

        Path dir = Path.of(OUTPUT_BASE, hrefName);
        if (Files.exists(dir)) {
            Files.walk(dir)
                    .sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try { Files.delete(p); } catch (IOException e) { throw new RuntimeException(e); }
                    });
        }
        Files.createDirectories(dir);

        Files.writeString(dir.resolve("index.html"), buildHtml(city));
        System.out.println("Written: " + dir.resolve("index.html"));
    }

    // ── HTML ──────────────────────────────────────────────────────────────

    /** Страницата е шаблон (templates/balove-city.mustache); логиката е в js/pages/balove.js. */
    private String buildHtml(Cities.City city) {
        String cityName = city.fullName();
        String hrefName = city.hrefName();
        nvo.site.SiteLayout.Page page = new nvo.site.SiteLayout.Page("../../../")
                .active(nvo.site.SiteLayout.BALOVE).favicon("favicon-7.png");
        java.util.Map<String, Object> ctx = page.context();
        ctx.put("head", nvo.site.SiteLayout.head(page));
        ctx.put("header", nvo.site.SiteLayout.header(page));
        ctx.put("footer", nvo.site.SiteLayout.footer(page));
        ctx.put("siteUrl", ProjectConfig.SITE_BASE_URL);
        ctx.put("title", "Минимални и максимални балове по паралелки след 7 клас – " + cityName + " | Иван Давидов");
        ctx.put("description", "Минимални и максимални балове по паралелки след 7 клас в "
                + cityName + ". Таблици и графики за всички класирания.");
        ctx.put("canonical", ProjectConfig.SITE_BASE_URL + "7/" + ProjectConfig.RUO_DIR_NAME + "/" + hrefName + "/");
        ctx.put("cityName", cityName);
        ctx.put("citySlug", hrefName);
        ctx.put("hasNvo", Files.exists(Path.of(ProjectConfig.DOCS_DIR, "7", hrefName, "index.html")));
        return nvo.site.SiteLayout.render("balove-city", ctx);
    }
}
