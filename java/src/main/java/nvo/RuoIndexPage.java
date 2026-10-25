package nvo;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Generates the balove hub page docs/7/balove/index.html - a directory of every
 * city that has a published min/max scores page. The hub decouples balove
 * discoverability from the NVO-7 ranking sections: cities that have RUO data but
 * no exam-taking schools (e.g. Куклен) are reachable here even though they get no
 * si[city] entry in data/grade-7.json.
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
        writeApi(cities);
    }

    // ── API: api/v1/balove/index.json и data.json ───────────────────────────

    /**
     * index.json - градовете (години, брой училища и паралелки, адрес на файла);
     * data.json - всички градове в един файл (документите от RuoDecomplexor поред).
     * Маха JSON-ите на градове без публикувана страница.
     */
    private void writeApi(List<Cities.City> cities) throws IOException {
        Path dir = Path.of(RuoDecomplexor.API_DIR);
        Set<String> keep = new java.util.HashSet<>(List.of("index.json", "data.json"));
        cities.forEach(c -> keep.add(c.hrefName() + ".json"));
        try (Stream<Path> stream = Files.list(dir)) {
            for (Path f : stream.toList()) {
                if (!keep.contains(f.getFileName().toString())) {
                    Files.delete(f);
                }
            }
        }

        java.util.TreeSet<Integer> allYears = new java.util.TreeSet<>();
        JsonArray index = new JsonArray();
        JsonArray docs = new JsonArray();
        for (Cities.City c : cities) {
            JsonObject doc = JsonParser.parseString(Files.readString(dir.resolve(c.hrefName() + ".json"))).getAsJsonObject();
            docs.add(doc);
            JsonArray years = doc.getAsJsonArray("years");
            years.forEach(y -> allYears.add(y.getAsInt()));
            int profiles = 0;
            for (var school : doc.getAsJsonArray("schools")) {
                profiles += school.getAsJsonObject().getAsJsonArray("profiles").size();
            }
            JsonObject item = new JsonObject();
            item.addProperty("slug", c.hrefName());
            item.addProperty("name", c.fullName());
            item.add("years", years);
            item.addProperty("schools", doc.getAsJsonArray("schools").size());
            item.addProperty("profiles", profiles);
            item.addProperty("url", c.hrefName() + ".json");
            index.add(item);
        }
        JsonArray yearsArr = new JsonArray();
        allYears.forEach(yearsArr::add);

        var gson = new GsonBuilder().serializeNulls().create();
        JsonObject indexRoot = new JsonObject();
        indexRoot.add("years", yearsArr);
        indexRoot.addProperty("dataUrl", "data.json");
        indexRoot.add("cities", index);
        Files.writeString(dir.resolve("index.json"), gson.toJson(indexRoot) + "\n");

        JsonObject dataRoot = new JsonObject();
        dataRoot.add("years", yearsArr);
        dataRoot.add("cities", docs);
        Files.writeString(dir.resolve("data.json"), gson.toJson(dataRoot) + "\n");
        System.out.println("Written: " + dir + "/index.json, data.json (" + cities.size() + " cities)");
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
     * Градовете са групирани като на страниците по клас: "Областни градове" (четирите
     * големи, после областните центрове) и "Други градове". Всяка карта показва броя
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
        int latestYear = 0;
        for (Cities.City c : cities) {
            JsonArray years = JsonParser.parseString(Files.readString(Path.of(RuoDecomplexor.API_DIR, c.hrefName() + ".json")))
                    .getAsJsonObject().getAsJsonArray("years");
            latestYear = Math.max(latestYear, years.get(years.size() - 1).getAsInt());
        }
        ctx.put("title", "Балове след 7 клас - " + latestYear + " - минимални и максимални по паралелки и градове | Иван Давидов");
        ctx.put("description", "Минимални и максимални балове по паралелки за прием след 7 клас, "
                + "по градове. Изберете град, за да видите таблици и графики по класирания.");
        ctx.put("canonical", ProjectConfig.SITE_BASE_URL + "7/" + ProjectConfig.RUO_DIR_NAME + "/");
        ctx.put("cityCount", cities.size());
        ctx.put("exportMenu", nvo.site.ExportMenu.html("Всички градове", List.of(
                nvo.site.ExportMenu.Item.action("csv", "Таблица за Excel · всички години", "balove-csv-all"),
                nvo.site.ExportMenu.Item.link("json", "Данните от API-то · всички години",
                        "../../api/v1/balove/data.json", "balove-7-all.json"),
                nvo.site.ExportMenu.Item.action("pdf", "Баловете на всички градове · за печат", "balove-pdf-all")),
                "PDF-ът за всички градове е голям (над 300 страници) - подготвя се няколко секунди.", "page-head__export"));

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
                years = parts.length == 1 ? parts[0].trim() : parts[0].trim() + "-" + parts[parts.length - 1].trim();
            }
            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("name", c.fullName());
            item.put("slug", c.hrefName());
            item.put("big", c.orderPosition() == 1);
            int schools = count(js, "ruoSchools[\"");
            int profiles = count(js, ", d: [");
            item.put("schools", schools);
            item.put("schoolsLabel", schools == 1 ? "училище" : "училища");
            item.put("profiles", profiles);
            item.put("profilesLabel", profiles == 1 ? "паралелка" : "паралелки");
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
