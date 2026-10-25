package nvo.site;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import nvo.ProjectConfig;
import nvo.SchoolType;
import nvo.api.GeneratorUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Индекс за глобалното търсене на сайта: docs/data/search-index.json.
 * Вътрешен за сайта (не е част от публичния API) и компактен - масиви вместо обекти:
 * <pre>
 * { "schools": [[code, shortName, fullName, citySlug, isPrivate(0|1), [grades], officialName, type]...],
 *   "cities":  [[slug, name, orderPosition, [grades with a landing page], hasBalove(0|1)]...] }
 * </pre>
 * type е видът (SchoolType.key: "s" държавно, "m" общинско, "p" частно, "r" духовно).
 * Чете вече генерираните api/v1/schools-index.json и api/v1/cities.json, затова се пуска след тях.
 *
 * Usage: java -cp nvo-v2.jar nvo.site.SearchIndexGenerator
 */
public final class SearchIndexGenerator {

    private static final String[] GRADES = {"4", "7", "10", "12"};

    private SearchIndexGenerator() {
    }

    public static void main(String[] args) throws IOException {
        Path docs = Path.of(ProjectConfig.DOCS_DIR);
        JsonObject cities = JsonParser.parseString(
                Files.readString(docs.resolve("api/v1/cities.json"), StandardCharsets.UTF_8))
                .getAsJsonObject().getAsJsonObject("cities");
        JsonArray schools = JsonParser.parseString(
                Files.readString(docs.resolve("api/v1/schools-index.json"), StandardCharsets.UTF_8))
                .getAsJsonObject().getAsJsonArray("schools");

        Map<String, String> slugByName = new HashMap<>();
        List<Object> cityRows = new ArrayList<>();
        for (Map.Entry<String, JsonElement> e : cities.entrySet()) {
            String slug = e.getKey();
            JsonObject city = e.getValue().getAsJsonObject();
            String name = city.get("fullName").getAsString();
            slugByName.put(name, slug);
            List<Integer> grades = new ArrayList<>();
            for (String g : GRADES) {
                if (Files.exists(docs.resolve(g).resolve(slug).resolve("index.html"))) {
                    grades.add(Integer.parseInt(g));
                }
            }
            boolean balove = Files.exists(docs.resolve("7").resolve(ProjectConfig.RUO_DIR_NAME).resolve(slug).resolve("index.html"));
            if (grades.isEmpty() && !balove) {
                continue;
            }
            cityRows.add(List.of(slug, name, city.get("orderPosition").getAsInt(), grades, balove ? 1 : 0));
        }

        List<Object> schoolRows = new ArrayList<>();
        for (JsonElement el : schools) {
            JsonObject s = el.getAsJsonObject();
            String cityName = s.get("city").getAsString();
            String slug = slugByName.get(cityName);
            if (slug == null) {
                throw new IllegalStateException("Unknown city in schools-index.json: " + cityName);
            }
            // Само класовете с резултат в показваните години (като секциите в профила);
            // училище само със стари резултати не излиза в търсенето.
            String code = s.get("code").getAsString();
            JsonObject doc = JsonParser.parseString(Files.readString(
                    docs.resolve("api/v1/schools/" + code + ".json"), StandardCharsets.UTF_8)).getAsJsonObject();
            List<Integer> grades = new ArrayList<>();
            for (String g : GeneratorUtils.displayedGrades(doc)) {
                grades.add(Integer.parseInt(g));
            }
            if (grades.isEmpty()) {
                continue;
            }
            schoolRows.add(List.of(
                    s.get("code").getAsString(),
                    s.get("shortName").getAsString(),
                    s.get("fullName").getAsString(),
                    slug,
                    s.get("isPrivate").getAsBoolean() ? 1 : 0,
                    grades,
                    // официалното име (data/school-names.json) - търси се и по него ("учебен" -> НУКК)
                    doc.has("officialName") && !doc.get("officialName").isJsonNull() ? doc.get("officialName").getAsString() : "",
                    SchoolType.of(s.get("code").getAsString()).key()));
        }

        Map<String, Object> out = new HashMap<>();
        out.put("cities", cityRows);
        out.put("schools", schoolRows);
        Path target = docs.resolve("data/search-index.json");
        Files.createDirectories(target.getParent());
        Files.writeString(target, new GsonBuilder().disableHtmlEscaping().create().toJson(out), StandardCharsets.UTF_8);
        System.out.println("SearchIndexGenerator: " + schoolRows.size() + " schools, " + cityRows.size() + " cities -> " + target);
    }
}
