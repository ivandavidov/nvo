package nvo.api;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import nvo.MonRegister;
import nvo.ProjectConfig;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Официалните имена на училищата от ръчно поддържания мапинг {@code data/school-names.json}
 * (код → {@code monName} - името точно както е в данните на МОН, {@code officialName} - същото име,
 * изчистено: без кавички, с правилни главни букви, интервали и препинателни знаци).
 * <p>
 * Кратките и пълните имена на сайта (School.java) не се пипат - официалното име е допълнително,
 * за търсенията по пълното име (SEO): показва се на страницата на училището, в описанието и в JSON-LD
 * и влиза в API-то.
 */
public final class OfficialNames {

    public record Names(String monName, String officialName) {}

    private static final Path FILE = Path.of(ProjectConfig.DATA_DIR, "school-names.json");

    private OfficialNames() {
    }

    /** Код → имена (празен, ако файлът липсва). */
    public static Map<String, Names> load() throws Exception {
        Map<String, Names> names = new HashMap<>();
        if (!Files.exists(FILE)) {
            System.err.println("OfficialNames: missing " + FILE);
            return names;
        }
        JsonObject schools = JsonParser.parseString(Files.readString(FILE)).getAsJsonObject().getAsJsonObject("schools");
        for (Map.Entry<String, JsonElement> e : schools.entrySet()) {
            JsonObject o = e.getValue().getAsJsonObject();
            names.put(e.getKey(), new Names(str(o, "monName"), str(o, "officialName")));
        }
        return names;
    }

    /** Код -> статус в регистъра на МОН (data/mon/ri-register.tsv): "действаща", "закрита", "отписана"... */
    public static Map<String, String> loadRegisterStatus() {
        Map<String, String> status = new HashMap<>();
        MonRegister.entries().forEach((code, entry) -> status.put(code, entry.status()));
        return status;
    }

    /** Едно и също име, без значение от главните букви и препинанието. */
    public static boolean sameName(String a, String b) {
        return a != null && b != null && key(a).equals(key(b));
    }

    private static String key(String name) {
        return name.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", "");
    }

    private static String str(JsonObject o, String field) {
        return o.has(field) && !o.get(field).isJsonNull() ? o.get(field).getAsString() : null;
    }
}
