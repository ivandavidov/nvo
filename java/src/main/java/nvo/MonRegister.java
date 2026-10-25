package nvo;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Снимката на регистъра на институциите на МОН ({@code data/mon/ri-register.tsv}: code, name, type,
 * financing, status). Чете се веднъж; липсващ файл дава празен регистър.
 */
public final class MonRegister {

    /** financing: "Държавно", "Общинско", "Частно", "Духовно"; status: "действаща", "закрита"... */
    public record Entry(String financing, String status) {}

    private static final Path FILE = Path.of(ProjectConfig.DATA_MON_DIR, "ri-register.tsv");

    private static Map<String, Entry> entries;

    private MonRegister() {
    }

    /** Код → запис от регистъра. */
    public static synchronized Map<String, Entry> entries() {
        if (entries == null) {
            Map<String, Entry> map = new HashMap<>();
            try {
                if (Files.exists(FILE)) {
                    for (String line : Files.readAllLines(FILE)) {
                        String[] cols = line.split("\t");
                        if (cols.length >= 5 && !cols[0].equals("code")) {
                            map.put(cols[0].trim(), new Entry(cols[3].trim(), cols[4].trim()));
                        }
                    }
                } else {
                    System.err.println("MonRegister: missing " + FILE);
                }
            } catch (Exception e) {
                throw new IllegalStateException("Cannot read " + FILE, e);
            }
            entries = Collections.unmodifiableMap(map);
        }
        return entries;
    }
}
