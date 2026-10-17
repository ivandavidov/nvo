package nvo.site;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import nvo.ProjectConfig;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Генерира страниците по клас docs/{4,7,10,12}/index.html от templates/grade.mustache.
 * Статичната част (заглавия, SEO, списъкът с градове като линкове) е тук; графиките и
 * класациите ги рисува js/pages/grade.js от docs/data/grade-{g}.json.
 *
 * Пуска се след NvoDziDecomplexor (data/grade-*.json) и след JsonGenerator {g}
 * (страниците по град/година, към които води).
 *
 * Usage: java -cp nvo-v2.jar nvo.site.GradePageGenerator [4|7|10|12 ...]
 */
public final class GradePageGenerator {

    private static final int NAV_FIRST_YEAR = 2020;

    private GradePageGenerator() {
    }

    public static void main(String[] args) throws IOException {
        String[] grades = args.length > 0 ? args : new String[]{"4", "7", "10", "12"};
        for (String grade : grades) {
            generate(grade);
        }
    }

    static void generate(String grade) throws IOException {
        Path docs = Path.of(ProjectConfig.DOCS_DIR);
        boolean dzi = "12".equals(grade);
        int latest = GradeData.latestYear(docs, grade);

        SiteLayout.Page page = new SiteLayout.Page("../").active(grade).favicon("favicon-" + grade + ".png");
        Map<String, Object> ctx = page.context();
        ctx.put("head", SiteLayout.head(page));
        ctx.put("header", SiteLayout.header(page));
        ctx.put("footer", SiteLayout.footer(page));
        ctx.put("siteUrl", ProjectConfig.SITE_BASE_URL);
        ctx.put("grade", grade);
        ctx.put("title", (dzi ? "ДЗИ" : "НВО") + " след " + grade + " клас");
        ctx.put("examLong", dzi ? "Държавни зрелостни изпити" : "Национално външно оценяване");
        ctx.put("subjectsLong", dzi ? "БЕЛ и втори зрелостен изпит" : "БЕЛ и математика");
        ctx.put("subjectB", "БЕЛ");
        ctx.put("subjectM", dzi ? "ДЗИ-2" : "МАТ");
        ctx.put("subjectBLong", "Български език и литература");
        ctx.put("subjectMLong", dzi ? "Втори зрелостен изпит" : "Математика");
        ctx.put("scale", dzi ? "оценки от 2 до 6" : "точки от 0 до 100");
        ctx.put("latestYear", latest);
        ctx.put("coverageFrom", GradeData.coverageFrom(grade));
        ctx.put("hasBalove", Files.isDirectory(docs.resolve(grade).resolve(ProjectConfig.RUO_DIR_NAME)));

        List<Integer> history = new ArrayList<>();
        for (int y = latest - 1; y >= NAV_FIRST_YEAR; y--) {
            history.add(y);
        }
        ctx.put("historyYears", history);
        List<Integer> rankingYears = new ArrayList<>();
        for (int y = latest; y >= 2018; y--) {
            if (Files.exists(docs.resolve(grade).resolve(String.valueOf(y)).resolve("index.html"))) {
                rankingYears.add(y);
            }
        }
        ctx.put("rankingYears", rankingYears);

        List<Map<String, Object>> cities = renderableCities(docs, grade);
        ctx.put("tier1", cities.stream().filter(c -> (int) c.get("tier") == 1).toList());
        ctx.put("tier2", cities.stream().filter(c -> (int) c.get("tier") == 2).toList());
        List<Map<String, Object>> tier3 = cities.stream().filter(c -> (int) c.get("tier") == 3).toList();
        ctx.put("tier3", tier3);
        ctx.put("tier3Count", tier3.size());

        Path target = docs.resolve(grade).resolve("index.html");
        Files.writeString(target, SiteLayout.render("grade", ctx), StandardCharsets.UTF_8);

        // Вградимите графики за iframe (без хедър/футър и без анализи).
        Map<String, Object> embed = new LinkedHashMap<>();
        embed.put("grade", grade);
        embed.put("title", ctx.get("title"));
        embed.put("siteUrl", ProjectConfig.SITE_BASE_URL);
        embed.put("chartBTitle", grade + " клас – " + (dzi ? "ДЗИ" : "НВО") + " – Български език");
        embed.put("chartMTitle", grade + " клас – " + (dzi ? "ДЗИ – Втора матура" : "НВО – Математика"));
        Files.writeString(docs.resolve(grade).resolve("embed.html"), SiteLayout.render("embed", embed), StandardCharsets.UTF_8);
        System.out.println("GradePageGenerator: " + target + " (" + cities.size() + " cities)");
    }

    /**
     * Градовете с поне едно училище с резултат и по двата предмета за последната година —
     * същото правило като renderableCities() в js/core/model.js.
     */
    private static List<Map<String, Object>> renderableCities(Path docs, String grade) throws IOException {
        JsonObject root = JsonParser.parseString(Files.readString(docs.resolve("data/grade-" + grade + ".json"), StandardCharsets.UTF_8)).getAsJsonObject();
        JsonArray s = root.getAsJsonArray("s");
        JsonObject si = root.getAsJsonObject("si");
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map.Entry<String, JsonElement> e : si.entrySet()) {
            JsonObject c = e.getValue().getAsJsonObject();
            if (!hasLatest(s, c.get("n")) && !hasLatest(s, c.get("p"))) {
                continue;
            }
            int tier = c.get("o").getAsInt();
            Map<String, Object> city = new LinkedHashMap<>();
            city.put("name", e.getKey());
            city.put("label", c.get("l").getAsString());
            city.put("slug", c.get("h").getAsString());
            city.put("tier", tier >= 1 && tier <= 3 ? tier : 3);
            city.put("order", c.get("i").getAsInt());
            out.add(city);
        }
        out.sort(Comparator.comparingInt(c -> (int) c.get("order")));
        return out;
    }

    private static boolean hasLatest(JsonArray s, JsonElement range) {
        if (range == null || range.isJsonNull()) {
            return false;
        }
        JsonArray r = range.getAsJsonArray();
        int start = r.get(0).getAsInt();
        int end = r.get(1).getAsInt();
        for (int i = start; i <= end; i++) {
            JsonElement el = s.get(i);
            if (el == null || el.isJsonNull()) {
                continue;
            }
            JsonArray b = el.getAsJsonObject().getAsJsonArray("b");
            JsonArray m = el.getAsJsonObject().getAsJsonArray("m");
            JsonElement lb = b.get(b.size() - 1);
            JsonElement lm = m.get(m.size() - 1);
            if (!lb.isJsonNull() && lb.getAsDouble() != 0 && !lm.isJsonNull() && lm.getAsDouble() != 0) {
                return true;
            }
        }
        return false;
    }
}
