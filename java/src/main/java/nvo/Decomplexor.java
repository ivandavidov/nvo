package nvo;

import java.io.File;
import java.nio.file.Files;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

public class Decomplexor {
    public static void main(String... args) throws Exception {
        if(args.length == 0) {
            System.err.println("Expected argument 4/7/12 is not provided.");
        } else {
            Decomplexor d = new Decomplexor();
            d.decomplex(args[0]);
        }
    }

    private void decomplex(String mode) throws Exception {
        String[] file18;
        String[] file19;
        String[] file20;
        String[] file21;

        if(mode.equals("12")) {
            file18 = new String[] {"C:\\projects\\nvo\\data\\normalized\\dzi-2018-normalized.csv", "n"};
            file19 = new String[] {"C:\\projects\\nvo\\data\\normalized\\dzi-2019-normalized.csv", "n"};
            file20 = new String[] {"C:\\projects\\nvo\\data\\normalized\\dzi-2020-normalized.csv", "n"};
            file21 = new String[] {"C:\\projects\\nvo\\data\\normalized\\dzi-2021-normalized.csv", "n"};
        } else if(mode.equals("7")) {
            file18 = new String[] {"C:\\projects\\nvo\\data\\normalized\\nvo-7-2018-normalized.csv", "n"};
            file19 = new String[] {"C:\\projects\\nvo\\data\\normalized\\nvo-7-2019-normalized.csv", "n"};
            file20 = new String[] {"C:\\projects\\nvo\\data\\normalized\\nvo-7-2020-normalized.csv", "n"};
            file21 = new String[] {"C:\\projects\\nvo\\data\\normalized\\nvo-7-2021-normalized.csv", "r"};
        } else {
            file18 = new String[] {"C:\\projects\\nvo\\data\\normalized\\nvo-4-2018-normalized.csv", "n"};
            file19 = new String[] {"C:\\projects\\nvo\\data\\normalized\\nvo-4-2019-normalized.csv", "n"};
            file20 = new String[] {"C:\\projects\\nvo\\data\\normalized\\nvo-4-2020-normalized.csv", "n"};
            file21 = new String[] {"C:\\projects\\nvo\\data\\normalized\\nvo-4-2021-normalized.csv", "r"};
        }

        String[][] files = {file18, file19, file20, file21};

        Map<String, Map<String, School>> cities = new HashMap<>();
        for(int f = 0; f < files.length; f++) {
            List<String> lines = Files.readAllLines(new File((files[f])[0]).toPath());
            for(int i = 2; i < lines.size(); i++) {
                Record record = lineToRecord4(lines.get(i));
                if(record.getSchool().startsWith("РУО")) {
                    continue;
                }
                if(record.getSchool().startsWith("Регионално управление на образованието")) {
                    continue;
                }
                Map<String, School> schools = cities.computeIfAbsent(record.getCity(), k -> new HashMap<>());
                String schoolCode = School.fixedCodes.get(record.getCode());
                if(schoolCode == null) {
                    schoolCode = record.getCode();
                }
                School school = schools.get(schoolCode);
                if(school == null) {
                    school = new School();
                    schools.put(schoolCode, school);
                    for(int k = 0; k < f; k++) {
                        school.getFirst().add(0.000d);
                        school.getSecond().add(0.000d);
                    }
                }
                school.setName(record.getSchool());
                school.setLabel(record.getSchool());
                school.setCode(schoolCode);
                while(school.getFirst().size() <= f - 1) {
                    school.getFirst().add(0.000d);
                    school.getSecond().add(0.000d);
                }
                school.getFirst().add(record.getFirst());
                school.getSecond().add(record.getSecond());
            }
            final int ff = f;
            cities.forEach((city, schools) -> {
                List<String> codes = new LinkedList<>();
                schools.forEach((code, school) -> {
                    if(school.getFirst().size() < ff + 1) {
                        school.getFirst().add(0.000d);
                        school.getSecond().add(0.000d);
                        codes.add(code);
                    }
                });
                for(String code : codes) {
                    schools.put(code, schools.remove(code));
                }
            });
        }
        Map<String, Set<School>> schools = new TreeMap<>();
        cities.forEach((city, schoolsMap) -> {
            Set<School> schoolSet = new TreeSet<>();
            schoolsMap.forEach((code, school) -> schoolSet.add(school));
            schools.put(city, schoolSet);
        });

        System.out.println();

        printSchoolsByType(schools, "София",1, 300);
        printSchoolsByType(schools, "Пловдив", 301, 400);
        printSchoolsByType(schools, "Варна", 401, 500);
        printSchoolsByType(schools, "Бургас", 501, 600);
        printSchoolsByType(schools, "Благоевград", 601, 700);
        printSchoolsByType(schools, "Велико Търново", 701, 800);
        printSchoolsByType(schools, "Видин", 801, 900);
        printSchoolsByType(schools, "Враца", 901, 1000);
        printSchoolsByType(schools, "Габрово", 1001, 1100);
        printSchoolsByType(schools, "Добрич", 1101, 1200);
        printSchoolsByType(schools, "Кърджали", 1201, 1300);
        printSchoolsByType(schools, "Кюстендил", 1301, 1400);
        printSchoolsByType(schools, "Ловеч", 1401, 1500);
        printSchoolsByType(schools, "Монтана", 1501, 1600);
        printSchoolsByType(schools, "Пазарджик", 1601, 1700);
        printSchoolsByType(schools, "Перник", 1701, 1800);
        printSchoolsByType(schools, "Плевен", 1801, 1900);
        printSchoolsByType(schools, "Разград", 1901, 2000);
        printSchoolsByType(schools, "Русе", 2001, 2100);
        printSchoolsByType(schools, "Силистра", 2101, 2200);
        printSchoolsByType(schools, "Сливен", 2201, 2300);
        printSchoolsByType(schools, "Смолян", 2301, 2400);
        printSchoolsByType(schools, "Стара Загора", 2401, 2500);
        printSchoolsByType(schools, "Търговище", 2501, 2600);
        printSchoolsByType(schools, "Хасково", 2601, 2700);
        printSchoolsByType(schools, "Шумен", 2701, 2800);
        printSchoolsByType(schools, "Ямбол", 2801, 2900);

//        printSchoolsByNVOResult(schools);

        System.out.println();
    }

    private void printSchoolsByType(Map<String, Set<School>> schools, String city, int start, int end) {
        final String templateSchool = "s[__index__] = {l: '__label__', n: '__name__', b: [__b18__, __b19__, __b20__, __b21__], m: [__m18__, __m19__, __m20__, __m21__]};\r\n";
        final String templateIndexIncl = "si['__city__'] = {n: [__n_begin__, __n_end__], p: [__p_begin__, __p_end__]};\r\n";
        final String templateIndexExcl = "si['__city__'] = {n: [__n_begin__, __n_end__], p: null};\r\n";

        Comparator<School> schoolsAlphaComparator = (o1, o2) -> {
            if(o1.getCode().equals(o2.getCode())) {
                return 0;
            }
            String s1 = o1.getLabel().toUpperCase();
            String s2 = o2.getLabel().toUpperCase();
            String s1n = s1.split(" ")[0];
            String s2n = s2.split(" ")[0];
            Integer i1 = null;
            Integer i2 = null;
            try {
                i1 = Integer.parseInt(s1n);
            } catch (NumberFormatException e) {}
            try {
                i2 = Integer.parseInt(s2n);
            } catch (NumberFormatException e) {}

            if(i1 == null && i2 == null) {
                return s1.compareTo(s2);
            }

            if(i1 == null && i2 != null) {
                return 1;
            }

            if(i1 != null && i2 == null) {
                return -1;
            }

            if(i1.intValue() == i2.intValue()) {
                return s1.compareTo(s2);
            } else {
                return i1.compareTo(i2);
            }
        };

        Set<School> nationalSchoolsSet = new TreeSet<>(schoolsAlphaComparator);
        Set<School> privateSchoolsSet = new TreeSet<>(schoolsAlphaComparator);
        Set<School> schoolSet = schools.get(city);
        int counter = start;
        for(School school : schoolSet) {
            if(counter > end) {
                break;
            }
            if(eligibleForRemoval(school)) {
                continue;
            }
            if(school.isPrivate()) {
                if(privateSchoolsSet.contains(school)) {
                    System.out.println("*** private contains: " + school);
                } else {
                    privateSchoolsSet.add(school);
                }
            } else{
                if(nationalSchoolsSet.contains(school)) {
                    System.out.println("*** national contains: " + school);
                    for(School dup: nationalSchoolsSet) {
                        if(dup.hashCode() == school.hashCode()) {
                            System.out.println("*** duplicate: " + dup);
                        }
                    }
                } else {
                    nationalSchoolsSet.add(school);
                    //System.out.println("Added school: " + school);
                }
            }
            ++counter;
        }

        String siLine;
        if(privateSchoolsSet.size() > 0) {
            siLine = templateIndexIncl.replace("__city__", city)
                    .replace("__n_begin__", "" + start)
                    .replace("__n_end__", "" + (start + nationalSchoolsSet.size() - 1))
                    .replace("__p_begin__", "" + (start + nationalSchoolsSet.size()))
                    .replace("__p_end__", "" + (start + nationalSchoolsSet.size() + privateSchoolsSet.size() - 1));
        } else {
            siLine = templateIndexExcl.replace("__city__", city)
                    .replace("__n_begin__", "" + start)
                    .replace("__n_end__", "" + (start + nationalSchoolsSet.size() - 1));
        }

        StringBuilder sb = new StringBuilder();
        sb.append("// ").append(city).append(" - индексация").append("\r\n");
        sb.append(siLine);
        sb.append("// ").append(city).append(" - държавни училища").append("\r\n");

        int index = start;
        for (School school : nationalSchoolsSet) {
            String line = templateSchool.replace("__index__", "" + index)
                    .replace("__label__", school.getLabel())
                    .replace("__name__", school.getName())
                    .replace("__b18__", school.getFirst().get(0) > 0 ? "" + school.getFirst().get(0) : "null")
                    .replace("__b19__", school.getFirst().get(1) > 0 ? "" + school.getFirst().get(1) : "null")
                    .replace("__b20__", school.getFirst().get(2) > 0 ? "" + school.getFirst().get(2) : "null")
                    .replace("__b21__", school.getFirst().get(3) > 0 ? "" + school.getFirst().get(3) : "null")
                    .replace("__m18__", school.getSecond().get(0) > 0 ? "" + school.getSecond().get(0) : "null")
                    .replace("__m19__", school.getSecond().get(1) > 0 ? "" + school.getSecond().get(1) : "null")
                    .replace("__m20__", school.getSecond().get(2) > 0 ? "" + school.getSecond().get(2) : "null")
                    .replace("__m21__", school.getSecond().get(3) > 0 ? "" + school.getSecond().get(3) : "null");
            sb.append(line);
            ++index;
        }

        if(privateSchoolsSet.size() > 0) {
            sb.append("// ").append(city).append(" - частни училища").append("\r\n");
        }

        for (School school : privateSchoolsSet) {
            String line = templateSchool.replace("__index__", "" + index)
                    .replace("__label__", school.getLabel())
                    .replace("__name__", school.getName())
                    .replace("__b18__", school.getFirst().get(0) > 0 ? "" + school.getFirst().get(0) : "null")
                    .replace("__b19__", school.getFirst().get(1) > 0 ? "" + school.getFirst().get(1) : "null")
                    .replace("__b20__", school.getFirst().get(2) > 0 ? "" + school.getFirst().get(2) : "null")
                    .replace("__b21__", school.getFirst().get(3) > 0 ? "" + school.getFirst().get(3) : "null")
                    .replace("__m18__", school.getSecond().get(0) > 0 ? "" + school.getSecond().get(0) : "null")
                    .replace("__m19__", school.getSecond().get(1) > 0 ? "" + school.getSecond().get(1) : "null")
                    .replace("__m20__", school.getSecond().get(2) > 0 ? "" + school.getSecond().get(2) : "null")
                    .replace("__m21__", school.getSecond().get(3) > 0 ? "" + school.getSecond().get(3) : "null");
            sb.append(line);
            ++index;
        }

        System.out.println(sb.toString());
    }

    private boolean eligibleForRemoval(School school) {
        return school.getFirst().get(school.getFirst().size() - 1) == 0.0d &&
                school.getFirst().get(school.getFirst().size() - 2) == 0.0d &&
                school.getFirst().get(school.getFirst().size() - 3) == 0.0d &&
                school.getSecond().get(school.getSecond().size() - 1) == 0.0d &&
                school.getSecond().get(school.getSecond().size() - 2) == 0.0d &&
                school.getSecond().get(school.getSecond().size() - 3) == 0.0d;
    }

    private void printSchoolsByNVOResult(Map<String, Set<School>> schools) {
        final String template = "s[__index__] = {p: __private__, c: __code__, '__label__', n: '__name__', b: [null, __b18__, __b19__, __b20__, __b21__], m: [null, __m18__, __m19__, __m20__, __m21__]};\r\n";

        int start = 1;
        int end = 100;
        String city = "СТАРА ЗАГОРА";

        StringBuilder sb = new StringBuilder();
        Set<School> schoolSet = schools.get("ГР." + city);
        int index = start;
        Iterator<School> iterator = schoolSet.iterator();
        while(iterator.hasNext() && index <= end) {
            School school = iterator.next();
            String line = template.replace("__index__", "" + index)
                    .replace("__private__", Boolean.toString(school.isPrivate()))
                    .replace("__code__", school.getCode())
                    .replace("__label__", school.getLabel())
                    .replace("__name__", school.getName())
                    .replace("__b18__", school.getFirst().get(0) > 0 ? "" + school.getFirst().get(0) : "null")
                    .replace("__b19__", school.getFirst().get(1) > 0 ? "" + school.getFirst().get(1) : "null")
                    .replace("__b20__", school.getFirst().get(2) > 0 ? "" + school.getFirst().get(2) : "null")
                    .replace("__b21__", school.getFirst().get(3) > 0 ? "" + school.getFirst().get(3) : "null")
                    .replace("__m18__", school.getSecond().get(0) > 0 ? "" + school.getSecond().get(0) : "null")
                    .replace("__m19__", school.getSecond().get(1) > 0 ? "" + school.getSecond().get(1) : "null")
                    .replace("__m20__", school.getSecond().get(2) > 0 ? "" + school.getSecond().get(2) : "null")
                    .replace("__m21__", school.getSecond().get(3) > 0 ? "" + school.getSecond().get(3) : "null");
            sb.append(line);
            ++index;
        }
        System.out.println(sb.toString());
    }

    private Record lineToRecord12(String line) {
        line = normalizeLine(line);
        String[] entries = line.split("\\|");
        String city = normalizeEntry(entries[2]).replace(" ", "");
        String code = normalizeEntry(entries[3]).replace(" ", "");
        String school = normalizeEntry(entries[4]).replace('.', ' ');
        String first = normalizeEntry(entries[6]).replace(',', '.');
        String second;
        if(entries.length > 34) {
            second = normalizeEntry(entries[34]).replace(',', '.');
        } else {
            second = "0.000";
        }
        Record r = new Record();
        r.setCity(city);
        r.setCode(code);
        r.setSchool(school);
        r.setFirst(Double.valueOf(first));
        r.setSecond(Double.valueOf(second));
        return r;
    }

    private Record lineToRecord7(String line, String mode) {
        line = normalizeLine(line);
        String[] entries = line.split("\\|");
        String city = normalizeEntry(entries[2]).replace(" ", "");
        String school;
        String code;
        if(mode.equals("n")) {
            code = normalizeEntry(entries[3]).replace(" ", "").replace("-", "");
            school = normalizeEntry(entries[4]).replace('.', ' ');
        } else {
            school = normalizeEntry(entries[3]).replace('.', ' ');
            code = normalizeEntry(entries[4]).replace(" ", "");
        }
        String first = normalizeEntry(entries[6]).replace(',', '.');
        String second = normalizeEntry(entries[8]).replace(',', '.');
        if(second.trim().length() == 0) {
            second = "0.00";
        }
        Record r = new Record();
        r.setCity(city);
        r.setCode(code);
        r.setSchool(school);
        r.setFirst(Double.valueOf(first));
        r.setSecond(Double.valueOf(second));
        return r;
    }

    private Record lineToRecord4(String line) {
        line = normalizeLine(line);
        String[] entries = line.split("\\|");
        String city = entries[0].replaceAll("\"", "");
        String code = entries[1].replaceAll("\"", "");
        String school = entries[2].replaceAll("\"", "");
        String first = entries[3].replaceAll("\"", "");
        String second = entries[4].replaceAll("\"", "");
        if(second.trim().length() == 0) {
            second = "0.00";
        }
        Record r = new Record();
        r.setCity(city);
        r.setCode(code);
        r.setSchool(school);
        r.setFirst(Double.valueOf(first));
        r.setSecond(Double.valueOf(second));
        return r;
    }

    private String normalizeEntry(String entry) {
        return entry.replaceAll("\"", " ")
                .replaceAll(" +", " ")
                .trim();
    }

    private String normalizeLine(String line) {
        line = line.replace(';', '|');
        StringBuilder sb = new StringBuilder(line.length());
        for(int i = 0; i < line.length(); i++) {
            if(line.charAt(i) == ',' && i > 0 && line.charAt(i - 1) == '"') {
                sb.append('|');
            } else {
                sb.append(line.charAt(i));
            }
        }
        return sb.toString();
    }
}
