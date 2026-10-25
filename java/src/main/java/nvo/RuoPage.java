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
    private String buildHtml(Cities.City city) throws IOException {
        String cityName = city.fullName();
        String hrefName = city.hrefName();
        // Годините с данни - от API документа, който RuoDecomplexor пише преди тази стъпка.
        com.google.gson.JsonArray years = com.google.gson.JsonParser.parseString(Files.readString(
                Path.of(ProjectConfig.DOCS_API_V1_DIR, "balove", hrefName + ".json")))
                .getAsJsonObject().getAsJsonArray("years");
        int firstYear = years.get(0).getAsInt();
        int latestYear = years.get(years.size() - 1).getAsInt();
        String yearsLabel = firstYear == latestYear ? "" + latestYear : firstYear + "-" + latestYear;
        String canonical = ProjectConfig.SITE_BASE_URL + "7/" + ProjectConfig.RUO_DIR_NAME + "/" + hrefName + "/";
        nvo.site.SiteLayout.Page page = new nvo.site.SiteLayout.Page("../../../")
                .active(nvo.site.SiteLayout.BALOVE).favicon("favicon-7.png");
        java.util.Map<String, Object> ctx = page.context();
        ctx.put("head", nvo.site.SiteLayout.head(page));
        ctx.put("header", nvo.site.SiteLayout.header(page));
        ctx.put("footer", nvo.site.SiteLayout.footer(page));
        ctx.put("siteUrl", ProjectConfig.SITE_BASE_URL);
        ctx.put("title", "Балове след 7 клас - " + latestYear + " - минимални и максимални по паралелки "
                + Cities.inCity(cityName) + " | Иван Давидов");
        ctx.put("description", "Минимални и максимални балове по паралелки за прием след 7 клас "
                + Cities.inCity(cityName) + " за " + yearsLabel + " г. Таблици и графики за всички класирания.");
        ctx.put("canonical", canonical);
        ctx.put("jsonLd", jsonLd(cityName, hrefName, canonical, yearsLabel, firstYear, latestYear));
        ctx.put("cityName", cityName);
        ctx.put("citySlug", hrefName);
        // Експортът - меню "Изтегли ▾" вдясно (CSV и PDF се правят от api/v1/balove/{град}.json).
        ctx.put("exportMenu", nvo.site.ExportMenu.html("Данни за " + cityName, java.util.List.of(
                nvo.site.ExportMenu.Item.action("csv", "Таблица за Excel · всички години", "balove-csv"),
                nvo.site.ExportMenu.Item.link("json", "Данните от API-то · всички години",
                        "../../../api/v1/balove/" + hrefName + ".json", "balove-7-" + hrefName + ".json"),
                nvo.site.ExportMenu.Item.action("pdf", "Баловете за печат", "balove-pdf")),
                null, "page-head__export"));
        ctx.put("hasNvo", Files.exists(Path.of(ProjectConfig.DOCS_DIR, "7", hrefName, "index.html")));
        return nvo.site.SiteLayout.render("balove-city", ctx);
    }

    /** JSON-LD: пътят (като breadcrumbs на страницата) + Dataset с баловете на града. */
    private static String jsonLd(String cityName, String hrefName, String canonical, String yearsLabel,
                                 int firstYear, int latestYear) {
        String site = ProjectConfig.SITE_BASE_URL;
        com.google.gson.JsonArray crumbs = new com.google.gson.JsonArray();
        String[][] path = {
                {"Начало", site},
                {"НВО след 7 клас", site + "7/"},
                {"Балове", site + "7/" + ProjectConfig.RUO_DIR_NAME + "/"},
                {cityName, canonical}};
        for (int i = 0; i < path.length; i++) {
            com.google.gson.JsonObject item = new com.google.gson.JsonObject();
            item.addProperty("@type", "ListItem");
            item.addProperty("position", i + 1);
            item.addProperty("name", path[i][0]);
            item.addProperty("item", path[i][1]);
            crumbs.add(item);
        }
        com.google.gson.JsonObject breadcrumbs = new com.google.gson.JsonObject();
        breadcrumbs.addProperty("@type", "BreadcrumbList");
        breadcrumbs.add("itemListElement", crumbs);

        com.google.gson.JsonObject author = new com.google.gson.JsonObject();
        author.addProperty("@type", "Person");
        author.addProperty("name", "Иван Давидов");
        author.addProperty("url", "https://www.linkedin.com/in/ivandavidov");
        com.google.gson.JsonObject download = new com.google.gson.JsonObject();
        download.addProperty("@type", "DataDownload");
        download.addProperty("encodingFormat", "application/json");
        download.addProperty("contentUrl", site + "api/v1/balove/" + hrefName + ".json");
        com.google.gson.JsonObject dataset = new com.google.gson.JsonObject();
        dataset.addProperty("@type", "Dataset");
        dataset.addProperty("name", "Балове за прием след 7 клас " + Cities.inCity(cityName) + ", " + yearsLabel);
        dataset.addProperty("description", "Минимални и максимални балове на приетите ученици по училища, паралелки и класирания "
                + "за прием след 7 клас " + Cities.inCity(cityName) + " по данни на РУО.");
        dataset.addProperty("url", canonical);
        dataset.add("creator", author);
        dataset.addProperty("license", "https://opensource.org/licenses/MIT");
        dataset.addProperty("inLanguage", "bg");
        dataset.addProperty("spatialCoverage", cityName);
        dataset.addProperty("temporalCoverage", firstYear + "/" + latestYear);
        dataset.add("distribution", download);

        com.google.gson.JsonArray graph = new com.google.gson.JsonArray();
        graph.add(breadcrumbs);
        graph.add(dataset);
        com.google.gson.JsonObject root = new com.google.gson.JsonObject();
        root.addProperty("@context", "https://schema.org");
        root.add("@graph", graph);
        return new com.google.gson.Gson().toJson(root);
    }
}
