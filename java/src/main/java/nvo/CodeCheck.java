package nvo;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;

import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Проверка на кодовете на училищата в data/normalized/ (пуска се от all.sh веднага след нормализирането).
 *
 * <ul>
 *   <li>ГРЕШКА (спира all.sh): код, който не е 6–7 цифри. Така се хващат изгубени цифри като
 *       „80008“ вместо „800080“ (вж. {@link NvoDziNormalizer#canonicalCode}) или нов формат в
 *       данните на МОН, преди да станат фантомни профили.</li>
 *   <li>ИНФОРМАЦИЯ: едно и също училище (име + град) с различни кодове в непресичащи се години —
 *       МОН е сменил кода. Профилите им се различават по години и са свързани помежду си
 *       (SchoolPageGenerator).</li>
 * </ul>
 *
 * Usage: java -cp nvo-v2.jar nvo.CodeCheck
 */
public final class CodeCheck {

    private static final Pattern FILE = Pattern.compile("(nvo-\\d+|dzi)-(\\d{4})(?:-[a-z]+)?-normalized\\.csv");
    private static final Pattern CODE = Pattern.compile("\\d{6,7}");
    /** Години, които са копия на съседна година (вж. NvoDziNormalizer) — не се броят за диапазона. */
    private static final Set<String> PLACEHOLDER = Set.of("nvo-4-2020", "nvo-10-2018", "nvo-10-2019", "nvo-10-2020");

    private CodeCheck() {
    }

    public static void main(String[] args) throws IOException, CsvException {
        List<String> errors = new ArrayList<>();
        // изпит → (име|град) → код → години
        Map<String, Map<String, Map<String, Set<Integer>>>> byExam = new TreeMap<>();
        List<Path> files;
        try (Stream<Path> stream = Files.list(Path.of(ProjectConfig.DATA_NORMALIZED_DIR))) {
            files = stream.sorted().toList();
        }
        for (Path file : files) {
            Matcher m = FILE.matcher(file.getFileName().toString());
            if (!m.matches()) {
                continue;
            }
            String exam = m.group(1);
            int year = Integer.parseInt(m.group(2));
            boolean placeholder = PLACEHOLDER.contains(exam + "-" + year);
            try (CSVReader reader = new CSVReader(new FileReader(file.toFile()))) {
                for (String[] row : reader.readAll()) {
                    if (row.length < 3 || row[1].equals("Код")) {
                        continue;
                    }
                    // Редовете на РУО са обобщения за областта, не училища (генераторите ги пропускат по същия начин).
                    if (row[2].startsWith("РУО") || row[2].startsWith("Регионално управление на образованието")) {
                        continue;
                    }
                    String city = row[0];
                    String code = row[1];
                    if (!CODE.matcher(code).matches()) {
                        errors.add(file.getFileName() + ": код „" + code + "“ (" + city + ", " + row[2] + ") не е 6–7 цифри");
                        continue;
                    }
                    if (placeholder) {
                        continue;
                    }
                    String[] curated = School.schoolCodes.get(code);
                    String name = curated != null ? curated[2] : row[2];
                    byExam.computeIfAbsent(exam, k -> new TreeMap<>())
                            .computeIfAbsent(name + "|" + city, k -> new TreeMap<>())
                            .computeIfAbsent(code, k -> new TreeSet<>())
                            .add(year);
                }
            }
        }

        int info = 0;
        for (Map.Entry<String, Map<String, Map<String, Set<Integer>>>> exam : byExam.entrySet()) {
            for (Map.Entry<String, Map<String, Set<Integer>>> school : exam.getValue().entrySet()) {
                Map<String, Set<Integer>> codes = school.getValue();
                if (codes.size() < 2) {
                    continue;
                }
                List<Map.Entry<String, Set<Integer>>> sorted = new ArrayList<>(codes.entrySet());
                sorted.sort((a, b) -> Integer.compare(((TreeSet<Integer>) a.getValue()).first(), ((TreeSet<Integer>) b.getValue()).first()));
                boolean disjoint = true;
                for (int i = 1; i < sorted.size(); i++) {
                    if (((TreeSet<Integer>) sorted.get(i - 1).getValue()).last() >= ((TreeSet<Integer>) sorted.get(i).getValue()).first()) {
                        disjoint = false;
                    }
                }
                if (disjoint) {
                    StringBuilder sb = new StringBuilder("CodeCheck INFO " + exam.getKey() + ": „" + school.getKey().replace("|", "“, ") + " —");
                    for (Map.Entry<String, Set<Integer>> c : sorted) {
                        TreeSet<Integer> y = (TreeSet<Integer>) c.getValue();
                        sb.append(' ').append(c.getKey()).append(" (").append(y.first()).append('–').append(y.last()).append(')');
                    }
                    System.out.println(sb);
                    info++;
                }
            }
        }

        errors.forEach(e -> System.err.println("CodeCheck ГРЕШКА " + e));
        System.out.println("CodeCheck: " + errors.size() + " грешки, " + info + " смени на код (информация)");
        if (!errors.isEmpty()) {
            System.exit(1);
        }
    }
}
