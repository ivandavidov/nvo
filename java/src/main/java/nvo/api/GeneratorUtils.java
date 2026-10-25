package nvo.api;

import com.google.gson.JsonArray;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;
import nvo.ProjectConfig;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class GeneratorUtils {

    public static String collapseArrays(String json) {
        StringBuilder sb = new StringBuilder(json.length());
        int i = 0;
        while (i < json.length()) {
            if (json.charAt(i) == '[') {
                int start = i;
                int depth = 1;
                int j = i + 1;
                boolean simple = true;
                while (j < json.length() && depth > 0) {
                    char c = json.charAt(j);
                    if (c == '[' || c == '{') {
                        simple = false;
                        depth++;
                    } else if (c == ']' || c == '}') {
                        depth--;
                    }
                    j++;
                }
                if (simple) {
                    String arr = json.substring(start, j);
                    arr = arr.replaceAll("\\s*\n\\s*", " ");
                    sb.append(arr);
                    i = j;
                } else {
                    sb.append('[');
                    i++;
                }
            } else {
                sb.append(json.charAt(i));
                i++;
            }
        }
        return sb.toString();
    }

    /**
     * Recursively deletes all contents of a directory, then recreates it empty.
     * If the directory does not exist, it is created.
     */
    public static void cleanDirectory(Path dir) throws Exception {
        if (Files.exists(dir)) {
            try (var walk = Files.walk(dir)) {
                walk.sorted(Comparator.reverseOrder())
                        .forEach(p -> {
                            try {
                                Files.delete(p);
                            } catch (Exception e) {
                                throw new RuntimeException(e);
                            }
                        });
            }
        }
        Files.createDirectories(dir);
    }

    public static JsonArray toDoubleArray(Double[] values) {
        JsonArray arr = new JsonArray();
        for (Double v : values) {
            if (v == null) {
                arr.add(JsonNull.INSTANCE);
            } else {
                arr.add(v);
            }
        }
        return arr;
    }

    public static JsonArray toIntArray(Integer[] values) {
        JsonArray arr = new JsonArray();
        for (Integer v : values) {
            if (v == null) {
                arr.add(JsonNull.INSTANCE);
            } else {
                arr.add(v);
            }
        }
        return arr;
    }

    /** Full span [FIRST_YEAR .. LAST_YEAR] - the widest grade. Prefer {@link #buildYearsRange(int)}. */
    public static JsonArray buildYearsRange() {
        return buildYearsRange(JsonGenerator.LAST_YEAR);
    }

    /** Year span [FIRST_YEAR .. lastYear], inclusive - used per grade so NVO and DZI differ. */
    public static JsonArray buildYearsRange(int lastYear) {
        JsonArray arr = new JsonArray();
        for (int y = JsonGenerator.FIRST_YEAR; y <= lastYear; y++) arr.add(y);
        return arr;
    }

    public static String escHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    public static double roundTo2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    /**
     * Класовете от документа schools/{code}.json с резултат в показваните години
     * (ProjectConfig.displayFrom) - само те имат секция в профила и бутон в търсенето.
     */
    public static List<String> displayedGrades(JsonObject doc) {
        List<String> out = new ArrayList<>();
        JsonObject grades = doc.getAsJsonObject("grades");
        if (grades == null) {
            return out;
        }
        for (String grade : new String[]{"4", "7", "10", "12"}) {
            if (!grades.has(grade)) {
                continue;
            }
            JsonObject g = grades.getAsJsonObject(grade);
            JsonArray years = g.has("yearsRange") && g.get("yearsRange").isJsonArray()
                    ? g.getAsJsonArray("yearsRange") : doc.getAsJsonArray("yearsRange");
            JsonArray bel = g.getAsJsonArray("belScore");
            JsonArray mat = g.getAsJsonArray("matScore");
            if (years == null || years.isEmpty()) {
                continue;
            }
            int from = ProjectConfig.displayFrom(grade, years.get(years.size() - 1).getAsInt());
            for (int i = 0; i < years.size(); i++) {
                if (years.get(i).getAsInt() >= from
                        && ((bel != null && i < bel.size() && !bel.get(i).isJsonNull())
                        || (mat != null && i < mat.size() && !mat.get(i).isJsonNull()))) {
                    out.add(grade);
                    break;
                }
            }
        }
        return out;
    }

    /**
     * Пренасочваща страница (meta refresh, noindex, canonical) в dir/index.html. Sitemap-ът я
     * прескача. assets е относителният път от dir до docs/ (напр. "../../").
     */
    public static void writeRedirectPage(Path dir, String target, String canonical, String assets,
                                         String title, String message, String linkText) throws Exception {
        String html = """
                <!DOCTYPE html>
                <html lang="bg">
                <head>
                  <meta charset="utf-8">
                  <meta http-equiv="refresh" content="0; url=%1$s">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <meta name="robots" content="noindex">
                  <title>%3$s</title>
                  <link rel="canonical" href="%2$s">
                  <link rel="stylesheet" href="%4$scss/site.css">
                  <script src="%4$sjs/theme.js"></script>
                </head>
                <body>
                  <main class="container page">
                    <p class="empty">%5$s - <a href="%1$s">%6$s</a>…</p>
                  </main>
                </body>
                </html>
                """.formatted(target, canonical, title, assets, message, linkText);
        Files.createDirectories(dir);
        Files.writeString(dir.resolve("index.html"), html);
    }
}
