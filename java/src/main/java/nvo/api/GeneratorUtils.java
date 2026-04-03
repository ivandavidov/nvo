package nvo.api;

import com.google.gson.JsonArray;
import com.google.gson.JsonNull;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

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

    public static JsonArray buildYearsRange() {
        JsonArray arr = new JsonArray();
        for (int y = JsonGenerator.FIRST_YEAR; y <= JsonGenerator.LAST_YEAR; y++) arr.add(y);
        return arr;
    }

    public static String escHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    public static double roundTo2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
