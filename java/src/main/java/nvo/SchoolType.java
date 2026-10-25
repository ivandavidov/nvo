package nvo;

import java.util.HashSet;
import java.util.Set;

/**
 * Видът на училището според финансирането в регистъра на МОН ({@code data/mon/ri-register.tsv},
 * колона financing): държавно, общинско, частно или духовно. Регистърът е единственият източник;
 * флагът "частно" в School.java е само резерва за код, който го няма в регистъра.
 * <p>
 * Същите кодове има и във фронтенда ({@code docs/js/core/school-types.js}): {@code key} е полето
 * {@code t} в {@code data/grade-{g}.json}, {@code apiValue} е {@code financing} в API-то.
 */
public enum SchoolType {
    STATE("s", "Д", "state", "Държавно", "Държавни", "държавните"),
    MUNICIPAL("m", "О", "municipal", "Общинско", "Общински", "общинските"),
    PRIVATE("p", "Ч", "private", "Частно", "Частни", "частните"),
    RELIGIOUS("r", "ДУ", "religious", "Духовно", "Духовни", "духовните");

    private final String key;
    private final String letter;
    private final String apiValue;
    private final String label;
    private final String plural;
    private final String pluralDefinite;

    private static final Set<String> warned = new HashSet<>();

    SchoolType(String key, String letter, String apiValue, String label, String plural, String pluralDefinite) {
        this.key = key;
        this.letter = letter;
        this.apiValue = apiValue;
        this.label = label;
        this.plural = plural;
        this.pluralDefinite = pluralDefinite;
    }

    /** "s" | "m" | "p" | "r" - полето {@code t} в data/grade-{g}.json. */
    public String key() {
        return key;
    }

    /** Буквата в таблиците: Д, О, Ч, ДУ. */
    public String letter() {
        return letter;
    }

    /** "state" | "municipal" | "private" | "religious" - полето {@code financing} в API-то. */
    public String apiValue() {
        return apiValue;
    }

    /** "Държавно" - значката на страницата на училището. */
    public String label() {
        return label;
    }

    /** "Държавни" - чиповете за филтъра. */
    public String plural() {
        return plural;
    }

    /** "държавните" - "Сред държавните в града". */
    public String pluralDefinite() {
        return pluralDefinite;
    }

    public boolean isPrivate() {
        return this == PRIVATE;
    }

    /** Видът на училище по код (регистърът на МОН; без запис - флагът от School.java и предупреждение). */
    public static SchoolType of(String code) {
        MonRegister.Entry entry = MonRegister.entries().get(code);
        boolean flaggedPrivate = School.isPrivateFlag(code);
        SchoolType type = entry == null ? null : fromFinancing(entry.financing());
        if (type == null) {
            type = flaggedPrivate ? PRIVATE : MUNICIPAL;
            warnOnce(code, "SchoolType: " + code + " has no financing in data/mon/ri-register.tsv - using "
                    + type.apiValue() + " (School.java); refresh the register snapshot");
        } else if (flaggedPrivate != type.isPrivate()) {
            warnOnce(code, "SchoolType: " + code + " is " + type.apiValue() + " in the MON register but "
                    + (flaggedPrivate ? "private" : "not private") + " in School.java - the register wins");
        }
        return type;
    }

    private static SchoolType fromFinancing(String financing) {
        if (financing == null) {
            return null;
        }
        return switch (financing.trim()) {
            case "Държавно" -> STATE;
            case "Общинско" -> MUNICIPAL;
            case "Частно" -> PRIVATE;
            case "Духовно" -> RELIGIOUS;
            default -> null;
        };
    }

    private static synchronized void warnOnce(String code, String message) {
        if (warned.add(code)) {
            System.err.println(message);
        }
    }
}
