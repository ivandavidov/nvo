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
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Началната страница docs/index.html: търсене, карти за четирите изпита (последна
 * година, брой училища, национална средна и мини тренд), балове, последните статии
 * и данните. Цифрите се смятат тук от data/grade-{g}.json, така че страницата е
 * статична (SEO, без JS). Старите линкове с параметри (/?i7=…, /#sofia) се
 * пренасочват към /7/ — както досега.
 *
 * Usage: java -cp nvo-v2.jar nvo.site.HomePageGenerator
 */
public final class HomePageGenerator {

    private static final String[] GRADES = {"4", "7", "10", "12"};
    private static final int FIRST_YEAR = 2018;

    private HomePageGenerator() {
    }

    public static void main(String[] args) throws IOException {
        Path docs = Path.of(ProjectConfig.DOCS_DIR);
        SiteLayout.Page page = new SiteLayout.Page("./").active(SiteLayout.HOME).css("blog.css");
        Map<String, Object> ctx = page.context();
        ctx.put("head", SiteLayout.head(page));
        ctx.put("header", SiteLayout.header(page));
        ctx.put("footer", SiteLayout.footer(page));
        ctx.put("siteUrl", ProjectConfig.SITE_BASE_URL);

        List<Map<String, Object>> exams = new ArrayList<>();
        for (String grade : GRADES) {
            exams.add(exam(docs, grade));
        }
        ctx.put("exams", exams);
        // „2019–2026“ над заглавието — от най-ранната показвана до най-късната година.
        int from = exams.stream().mapToInt(x -> (int) x.get("displayFrom")).min().orElse(FIRST_YEAR);
        int to = exams.stream().mapToInt(x -> (int) x.get("latestYear")).max().orElse(FIRST_YEAR);
        ctx.put("yearsLabel", from + "–" + to);

        List<Map<String, Object>> posts = BlogIndexGenerator.readPosts(docs);
        ctx.put("posts", posts.subList(0, Math.min(3, posts.size())));
        ctx.put("balove", balove(docs));

        Path target = docs.resolve("index.html");
        Files.writeString(target, SiteLayout.render("home", ctx), StandardCharsets.UTF_8);
        System.out.println("HomePageGenerator: " + target);
    }

    private static Map<String, Object> exam(Path docs, String grade) throws IOException {
        JsonObject root = JsonParser.parseString(Files.readString(docs.resolve("data/grade-" + grade + ".json"), StandardCharsets.UTF_8))
                .getAsJsonObject();
        JsonArray s = root.getAsJsonArray("s");
        boolean dzi = "12".equals(grade);
        int years = 0;
        for (JsonElement el : s) {
            if (!el.isJsonNull()) {
                years = Math.max(years, el.getAsJsonObject().getAsJsonArray("b").size());
            }
        }
        // Средно по училища за всяка година — като nationalAverages() в js/core/model.js.
        double[] avgB = new double[years];
        double[] avgM = new double[years];
        java.util.Set<String> latestCodes = new java.util.HashSet<>();
        for (int y = 0; y < years; y++) {
            double sumB = 0;
            double sumM = 0;
            int nB = 0;
            int nM = 0;
            for (JsonElement el : s) {
                if (el.isJsonNull()) {
                    continue;
                }
                JsonObject o = el.getAsJsonObject();
                Double b = value(o.getAsJsonArray("b"), y);
                Double m = value(o.getAsJsonArray("m"), y);
                if (b != null && b > 0) {
                    sumB += b;
                    nB++;
                }
                if (m != null && m > 0) {
                    sumM += m;
                    nM++;
                }
                if (y == years - 1 && b != null && b > 0 && m != null && m > 0) {
                    latestCodes.add(o.get("c").getAsString());
                }
            }
            avgB[y] = nB > 0 ? sumB / nB : 0;
            avgM[y] = nM > 0 ? sumM / nM : 0;
        }
        int latestYear = FIRST_YEAR + years - 1;
        // Годините, които сайтът показва (ProjectConfig.displayFrom) — 2018 г. е само в експорта.
        int displayFrom = ProjectConfig.displayFrom(grade, latestYear);
        int from = displayFrom - FIRST_YEAR;

        Map<String, Object> e = new HashMap<>();
        e.put("grade", grade);
        e.put("exam", dzi ? "ДЗИ" : "НВО");
        e.put("title", (dzi ? "ДЗИ след " : "НВО след ") + grade + " клас");
        e.put("latestYear", latestYear);
        // Уникални кодове — като в националната класация (училище в два града се брои веднъж).
        e.put("schools", latestCodes.size());
        e.put("subjectM", dzi ? "ДЗИ-2" : "МАТ");
        e.put("avgB", String.format(Locale.ROOT, "%.2f", avgB[years - 1]));
        e.put("avgM", String.format(Locale.ROOT, "%.2f", avgM[years - 1]));
        e.put("scale", dzi ? "средна оценка" : "средно от 100 т.");
        e.put("spark", sparkline(avgB, avgM, from, years - 1));
        e.put("range", displayFrom + "–" + latestYear);
        e.put("displayFrom", displayFrom);
        return e;
    }

    private static Double value(JsonArray arr, int i) {
        if (i >= arr.size() || arr.get(i).isJsonNull()) {
            return null;
        }
        return arr.get(i).getAsDouble();
    }

    /** Две линии (БЕЛ и МАТ) като SVG пътища в кутия 120×40. */
    private static Map<String, Object> sparkline(double[] b, double[] m, int from, int to) {
        double min = Double.MAX_VALUE;
        double max = -Double.MAX_VALUE;
        for (int i = from; i <= to; i++) {
            for (double v : new double[]{b[i], m[i]}) {
                if (v > 0) {
                    min = Math.min(min, v);
                    max = Math.max(max, v);
                }
            }
        }
        double span = Math.max(max - min, 1e-9);
        Map<String, Object> sp = new HashMap<>();
        sp.put("b", path(b, from, to, min, span));
        sp.put("m", path(m, from, to, min, span));
        return sp;
    }

    private static String path(double[] v, int from, int to, double min, double span) {
        StringBuilder sb = new StringBuilder();
        int n = to - from;
        for (int i = from; i <= to; i++) {
            if (v[i] <= 0) {
                continue;
            }
            double x = n == 0 ? 60 : 4 + (i - from) * 112.0 / n;
            double y = 36 - (v[i] - min) / span * 32;
            sb.append(sb.length() == 0 ? "M" : " L").append(String.format(Locale.ROOT, "%.1f %.1f", x, y));
        }
        return sb.toString();
    }

    private static Map<String, Object> balove(Path docs) throws IOException {
        int cities = 0;
        int profiles = 0;
        Path dir = docs.resolve("7").resolve(ProjectConfig.RUO_DIR_NAME);
        try (Stream<Path> stream = Files.list(dir)) {
            for (Path p : stream.filter(Files::isDirectory).toList()) {
                Path js = docs.resolve("js/ruo-" + p.getFileName() + ".js");
                if (!Files.exists(p.resolve("index.html")) || !Files.exists(js)) {
                    continue;
                }
                cities++;
                String text = Files.readString(js, StandardCharsets.UTF_8);
                for (int i = text.indexOf(", d: ["); i >= 0; i = text.indexOf(", d: [", i + 1)) {
                    profiles++;
                }
            }
        }
        Map<String, Object> b = new HashMap<>();
        b.put("cities", cities);
        b.put("profiles", profiles);
        return b;
    }
}
