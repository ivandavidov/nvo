package nvo;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.RFC4180ParserBuilder;

import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Снимката на регистъра на институциите на МОН ({@code data/mon/ri-register.csv}: code, name, type,
 * financing, status; всички полета в кавички, както data/normalized/*.csv) - всички институции,
 * действащи и закрити. Чете се веднъж; липсващ файл дава празен регистър.
 */
public final class MonRegister {

    /** name - както в регистъра; financing: "Държавно", "Общинско", "Частно", "Духовно"…; status: "действаща", "закрита"… */
    public record Entry(String name, String financing, String status) {}

    private static final Path FILE = Path.of(ProjectConfig.DATA_MON_DIR, "ri-register.csv");

    private static Map<String, Entry> entries;

    private MonRegister() {
    }

    /** Код → запис от регистъра. */
    public static synchronized Map<String, Entry> entries() {
        if (entries == null) {
            Map<String, Entry> map = new HashMap<>();
            try {
                if (Files.exists(FILE)) {
                    // Имената съдържат запетаи, кавички и дори "\" - стриктен RFC 4180 парсер (без escape с "\").
                    try (Reader in = Files.newBufferedReader(FILE, StandardCharsets.UTF_8);
                         CSVReader csv = new CSVReaderBuilder(in).withCSVParser(new RFC4180ParserBuilder().build()).build()) {
                        for (String[] cols : csv) {
                            if (cols.length >= 5 && !cols[0].equals("code")) {
                                map.put(cols[0].trim(), new Entry(cols[1].trim(), cols[3].trim(), cols[4].trim()));
                            }
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
