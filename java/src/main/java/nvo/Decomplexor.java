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
        Decomplexor d = new Decomplexor();
        d.decomplex();
    }

    private void decomplex() throws Exception {
        String file18 = "C:\\projects\\nvo\\data\\dzi-2018.csv";
        String file19 = "C:\\projects\\nvo\\data\\dzi-2019.csv";
        String file20 = "C:\\projects\\nvo\\data\\dzi-2020.csv";
        String file21 = "C:\\projects\\nvo\\data\\dzi-2021.csv";

        String[] files = {file18, file19, file20, file21};

        Map<String, Map<String, School>> cities = new HashMap<>();
        for(int f = 0; f < files.length; f++) {
            List<String> lines = Files.readAllLines(new File(files[f]).toPath());
            for(int i = 2; i < lines.size(); i++) {
                Record record = lineToRecord(lines.get(i));
                if(!record.getCity().toUpperCase().startsWith("ГР.")) {
                    continue;
                }
                if(record.getSchool().startsWith("РУО")) {
                    continue;
                }
                if(record.getSchool().startsWith("Регионално управление на образованието")) {
                    continue;
                }
                Map<String, School> schools = cities.computeIfAbsent(record.getCity(), k -> new HashMap<>());
                School school = schools.get(record.getCode());
                if(school == null) {
                    school = new School();
                    schools.put(record.getCode(), school);
                    for(int k = 0; k < f; k++) {
                        school.getFirst().add(0.000d);
                        school.getSecond().add(0.000d);
                    }
                }
                school.setName(record.getSchool());
                school.setLabel(record.getSchool());
                school.setCode(record.getCode());
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

        printSchoolsByType(schools, "София", 1, 150);
        printSchoolsByType(schools, "Пловдив", 151, 210);
        printSchoolsByType(schools, "Варна", 211, 260);
        printSchoolsByType(schools, "Бургас", 261, 310);
        printSchoolsByType(schools, "Благоевград", 311, 330);
        printSchoolsByType(schools, "Велико Търново", 331, 350);
        printSchoolsByType(schools, "Видин", 351, 360);
        printSchoolsByType(schools, "Враца", 361, 380);
        printSchoolsByType(schools, "Габрово", 381, 400);
        printSchoolsByType(schools, "Добрич", 411, 430);
        printSchoolsByType(schools, "Кюстендил", 431, 450);
        printSchoolsByType(schools, "Кърджали", 451, 470);
        printSchoolsByType(schools, "Ловеч", 471, 490);
        printSchoolsByType(schools, "Монтана", 491, 510);
        printSchoolsByType(schools, "Пазарджик", 511, 530);
        printSchoolsByType(schools, "Перник", 531, 550);
        printSchoolsByType(schools, "Плевен", 551, 580);
        printSchoolsByType(schools, "Разград", 581, 600);
        printSchoolsByType(schools, "Русе", 601, 630);
        printSchoolsByType(schools, "Силистра", 631, 650);
        printSchoolsByType(schools, "Сливен", 651, 670);
        printSchoolsByType(schools, "Смолян", 671, 690);
        printSchoolsByType(schools, "Стара Загора", 691, 720);
        printSchoolsByType(schools, "Търговище", 721, 740);
        printSchoolsByType(schools, "Хасково", 741, 760);
        printSchoolsByType(schools, "Шумен", 761, 790);
        printSchoolsByType(schools, "Ямбол", 791, 810);

//        printSchoolsByNVOResult(schools);

        System.out.println();
    }

    private void printSchoolsByType(Map<String, Set<School>> schools, String city, int start, int end) {
        final String template = "s[__index__] = {l: '__label__', n: '__name__', b: [null, __b18__, __b19__, __b20__, __b21__], m: [null, __m18__, __m19__, __m20__, __m21__]};\r\n";

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
        Set<School> schoolSet = schools.get("ГР." + city.toUpperCase());
        int counter = start;
        for(School school : schoolSet) {
            if(counter > end) {
                break;
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

        int index = start;
        StringBuilder sb = new StringBuilder();
        sb.append("// ").append(city).append(" - държавни училища").append("\r\n");

        for (School school : nationalSchoolsSet) {
            String line = template.replace("__index__", "" + index)
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
            String line = template.replace("__index__", "" + index)
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
            //System.out.println(school.getName());
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

    private Record lineToRecord(String line) {
        line = normalizeLine(line);
        String[] entries = line.split("\\|");
        String city = normalizeEntry(entries[2]);
        String code = normalizeEntry(entries[3]).replace(" ", "");
        String school = normalizeEntry(entries[4]).replace('.', ' ');
        String first = normalizeEntry(entries[6]).replace(',', '.');
        String second = null;
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

    private String normalizeEntry(String entry) {
        return entry.replaceAll("\"", " ")
                .replaceAll(" +", " ")
                .trim();
    }

    private String normalizeLine(String line) {
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
