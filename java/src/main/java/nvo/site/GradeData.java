package nvo.site;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

/** Общи сведения за данните на един клас, нужни на генераторите на страници. */
final class GradeData {

    /** От коя година са реалните данни в набора (CSV/API) - за JSON-LD. Показваните години: ProjectConfig.displayFrom. */
    private static final Map<String, Integer> COVERAGE_FROM = Map.of("4", 2018, "7", 2018, "10", 2021, "12", 2018);

    private GradeData() {
    }

    static int coverageFrom(String grade) {
        return COVERAGE_FROM.get(grade);
    }

    /** Последната година с данни = дължината на масивите в data/grade-{g}.json (от 2018 г.). */
    static int latestYear(Path docs, String grade) throws IOException {
        JsonArray s = JsonParser.parseString(Files.readString(docs.resolve("data/grade-" + grade + ".json"), StandardCharsets.UTF_8))
                .getAsJsonObject().getAsJsonArray("s");
        int years = 0;
        for (JsonElement el : s) {
            if (!el.isJsonNull()) {
                years = Math.max(years, el.getAsJsonObject().getAsJsonArray("b").size());
            }
        }
        return 2018 + years - 1;
    }
}
