package nvo;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
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
    private static final boolean COMPRESSED = false;

    private String header = null;

    private static Path of = null;

    private static int index = 1;

    private static int numYears = 0;

    public static void main(String... args) throws Exception {
        if(args.length == 0) {
            System.err.println("Expected argument normalize/4/7/10/12 is not provided.");
        } else {
            Decomplexor d = new Decomplexor();
            d.decomplex(args[0]);
        }
    }

    private void decomplex(String mode) throws Exception {
        String[] files = null;

        String normalizedPath = "/Users/ivan/projects/nvo/data/normalized/";
        String schoolsPath = "/Users/ivan/projects/nvo/docs/js/";

        if(mode.equals("normalize")) {
          CSVNormalizer.main(null);
          System.exit(0);
        } else if(mode.equals("12")) {
            header = "// https://data.egov.bg/data/view/066b4b04-d81d-444e-a61c-8ca0516079e4";
            String file18 = normalizedPath + "dzi-2018-normalized.csv";
            String file19 = normalizedPath + "dzi-2019-normalized.csv";
            String file20 = normalizedPath + "dzi-2020-normalized.csv";
            String file21 = normalizedPath + "dzi-2021-normalized.csv";
            String file22 = normalizedPath + "dzi-2022-normalized.csv";
            String file23 = normalizedPath + "dzi-2023-normalized.csv";
            files = new String[] {file18, file19, file20, file21, file22, file23};
        } else if(mode.equals("10")) {
            header = "// https://data.egov.bg/data/view/2f801b2f-d4cb-4ddb-a23d-3e372339c80f";
            String file18 = normalizedPath + "nvo-10-2018-normalized.csv";
            String file19 = normalizedPath + "nvo-10-2019-normalized.csv";
            String file20 = normalizedPath + "nvo-10-2020-normalized.csv";
            String file21 = normalizedPath + "nvo-10-2021-normalized.csv";
            String file22 = normalizedPath + "nvo-10-2022-normalized.csv";
            String file23 = normalizedPath + "nvo-10-2023-normalized.csv";
            files = new String[] {file18, file19, file20, file21, file22, file23};
        } else if(mode.equals("7")) {
            header = "// https://data.egov.bg/data/view/b56288b6-25aa-4049-9aa6-de2cd4cdabf8";
            String file18 = normalizedPath + "nvo-7-2018-normalized.csv";
            String file19 = normalizedPath + "nvo-7-2019-normalized.csv";
            String file20 = normalizedPath + "nvo-7-2020-normalized.csv";
            String file21 = normalizedPath + "nvo-7-2021-normalized.csv";
            String file22 = normalizedPath + "nvo-7-2022-normalized.csv";
            String file23 = normalizedPath + "nvo-7-2023-normalized.csv";
            files = new String[] {file18, file19, file20, file21, file22, file23};
        } else if(mode.equals("4")) {
            header = "// https://data.egov.bg/data/view/5613e75f-2b1b-4244-9f54-b27580a91dfb";
            String file18 = normalizedPath + "nvo-4-2018-normalized.csv";
            String file19 = normalizedPath + "nvo-4-2019-normalized.csv";
            String file20 = normalizedPath + "nvo-4-2020-normalized.csv";
            String file21 = normalizedPath + "nvo-4-2021-normalized.csv";
            String file22 = normalizedPath + "nvo-4-2022-normalized.csv";
            String file23 = normalizedPath + "nvo-4-2023-normalized.csv";
            files = new String[] {file18, file19, file20, file21, file22, file23};
        } else {
            System.out.println("Mode '" + mode + "' is not recognized.");
            System.exit(0);
        }

        numYears = files.length;

        Map<String, Map<String, School>> cities = new HashMap<>();
        for(int f = 0; f < files.length; f++) {
            List<String> lines = Files.readAllLines(new File((files[f])).toPath());
            for(int i = 1; i < lines.size(); i++) {
                Record record = lineToRecord(lines.get(i));
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
                        school.getBelScore().add(0.000d);
                        school.getMatScore().add(0.000d);
                        school.getBelStudents().add(0);
                        school.getMatStudents().add(0);
                    }
                }
                school.setName(record.getSchool());
                school.setLabel(record.getSchool());
                school.setCode(schoolCode);
                while(school.getBelScore().size() <= f - 1) {
                    school.getBelScore().add(0.000d);
                    school.getMatScore().add(0.000d);
                    school.getBelStudents().add(0);
                    school.getMatStudents().add(0);
                }
                school.getBelScore().add(record.getBelScore());
                school.getMatScore().add(record.getMatScore());
                school.getBelStudents().add(record.getBelStudents());
                school.getMatStudents().add(record.getMatStudents());
            }
            final int ff = f;
            cities.forEach((city, schools) -> {
                List<String> codes = new LinkedList<>();
                schools.forEach((code, school) -> {
                    if(school.getBelScore().size() < ff + 1) {
                        school.getBelScore().add(0.000d);
                        school.getMatScore().add(0.000d);
                        school.getBelStudents().add(0);
                        school.getMatStudents().add(0);
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

        of = Path.of(schoolsPath, "schools-" + mode + ".js");

        Files.writeString(of, header + "\r\n\r\n", StandardOpenOption.TRUNCATE_EXISTING);
        Files.writeString(of, "let si = [];\r\nlet s = [];\r\n\r\n", StandardOpenOption.APPEND);

        printSchoolsByType(schools, "София");
        printSchoolsByType(schools, "Пловдив");
        printSchoolsByType(schools, "Варна");
        printSchoolsByType(schools, "Бургас");
        printSchoolsByType(schools, "Благоевград");
        printSchoolsByType(schools, "Велико Търново");
        printSchoolsByType(schools, "Видин");
        printSchoolsByType(schools, "Враца");
        printSchoolsByType(schools, "Габрово");
        printSchoolsByType(schools, "Добрич");
        printSchoolsByType(schools, "Кърджали");
        printSchoolsByType(schools, "Кюстендил");
        printSchoolsByType(schools, "Ловеч");
        printSchoolsByType(schools, "Монтана");
        printSchoolsByType(schools, "Пазарджик");
        printSchoolsByType(schools, "Перник");
        printSchoolsByType(schools, "Плевен");
        printSchoolsByType(schools, "Разград");
        printSchoolsByType(schools, "Русе");
        printSchoolsByType(schools, "Силистра");
        printSchoolsByType(schools, "Сливен");
        printSchoolsByType(schools, "Смолян");
        printSchoolsByType(schools, "Стара Загора");
        printSchoolsByType(schools, "Търговище");
        printSchoolsByType(schools, "Хасково");
        printSchoolsByType(schools, "Шумен");
        printSchoolsByType(schools, "Ямбол");

        printSchoolsByType(schools, "Айтос");
        printSchoolsByType(schools, "Асеновград");
        printSchoolsByType(schools, "Банкя");
        printSchoolsByType(schools, "Ботевград");
        printSchoolsByType(schools, "Велинград");
        printSchoolsByType(schools, "Горна Оряховица");
        printSchoolsByType(schools, "Гоце Делчев");
        printSchoolsByType(schools, "Димитровград");
        printSchoolsByType(schools, "Дупница");
        printSchoolsByType(schools, "Ихтиман");
        printSchoolsByType(schools, "Казанлък");
        printSchoolsByType(schools, "Карлово");
        printSchoolsByType(schools, "Карнобат");
        printSchoolsByType(schools, "Костинброд");
        printSchoolsByType(schools, "Лом");
        printSchoolsByType(schools, "Луковит");
        printSchoolsByType(schools, "Несебър");
        printSchoolsByType(schools, "Нова Загора");
        printSchoolsByType(schools, "Нови Искър");
        printSchoolsByType(schools, "Обзор");
        printSchoolsByType(schools, "Панагюрище");
        printSchoolsByType(schools, "Петрич");
        printSchoolsByType(schools, "Пещера");
        printSchoolsByType(schools, "Поморие");
        printSchoolsByType(schools, "Попово");
        printSchoolsByType(schools, "Правец");
        printSchoolsByType(schools, "Радомир");
        printSchoolsByType(schools, "Раковски");
        printSchoolsByType(schools, "Самоков");
        printSchoolsByType(schools, "Сандански");
        printSchoolsByType(schools, "Свиленград");
        printSchoolsByType(schools, "Свищов");
        printSchoolsByType(schools, "Своге");
        printSchoolsByType(schools, "Севлиево");
        printSchoolsByType(schools, "Троян");
        printSchoolsByType(schools, "Харманли");
        printSchoolsByType(schools, "Чирпан");

//        printSchoolsByNVOResult(schools);

        System.out.println();
    }

    private String generateSection(String base) {
        StringBuffer sb = new StringBuffer();

        sb.append(base).append(": [");

        int current = 18;
        boolean next = false;
        for(int i = 0; i < numYears; i++) {
            if(next) {
                sb.append(", ");
            } else {
                next = true;
            }
            sb.append("__").append(base).append(current + i).append("__");
        }

        sb.append("]");

        return sb.toString();
    }
    private void printSchoolsByType(Map<String, Set<School>> schools, String city) throws Exception {
        final String templateSchool;
        final String templateIndexIncl;
        final String templateIndexExcl;
        if(COMPRESSED) {
            templateSchool = "s[__index__]={l:'__label__',n:'__name__',b:[__b18__,__b19__,__b20__,__b21__,__b22__,__b23__],m:[__m18__,__m19__,__m20__,__m21__,__m22__,__m23__],bu:[__bu18__,__bu19__,__bu20__,__bu21__,__bu22__,__bu23__],mu:[__mu18__,__mu19__,__mu20__,__mu21__,__mu22__,__mu23__]};";
            templateIndexIncl = "si['__city__']={n:[__n_begin__,__n_end__],p:[__p_begin__,__p_end__]};";
            templateIndexExcl = "si['__city__']={n:[__n_begin__,__n_end__],p:null};";
        } else {
            templateSchool = "s[__index__] = {l: '__label__', n: '__name__', " + generateSection("b") + ", " + generateSection("m") + ", " + generateSection("bu") + ", " + generateSection("mu") + "};\r\n";
            templateIndexIncl = "si['__city__'] = {n: [__n_begin__, __n_end__], p: [__p_begin__, __p_end__]};\r\n";
            templateIndexExcl = "si['__city__'] = {n: [__n_begin__, __n_end__], p: null};\r\n";
        }

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
        if(schoolSet == null) {
            // No schools found
            return;
        }
        for(School school : schoolSet) {
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
                }
            }
        }

        String siLine;
        if(privateSchoolsSet.size() > 0) {
            siLine = templateIndexIncl.replace("__city__", city)
                    .replace("__n_begin__", "" + index)
                    .replace("__n_end__", "" + (index + nationalSchoolsSet.size() - 1))
                    .replace("__p_begin__", "" + (index + nationalSchoolsSet.size()))
                    .replace("__p_end__", "" + (index + nationalSchoolsSet.size() + privateSchoolsSet.size() - 1));
        } else {
            siLine = templateIndexExcl.replace("__city__", city)
                    .replace("__n_begin__", "" + index)
                    .replace("__n_end__", "" + (index + nationalSchoolsSet.size() - 1));
        }

        StringBuilder sb = new StringBuilder();
        if(!COMPRESSED) {
            sb.append("// ").append(city).append(" - индексация").append("\r\n");
        }
        sb.append(siLine);
        if(!COMPRESSED) {
            sb.append("// ").append(city).append(" - държавни училища").append("\r\n");
        }

        //int index = start;
        for (School school : nationalSchoolsSet) {
            String line = getLine(templateSchool, index, school);
            sb.append(line);
            ++index;
        }

        if(privateSchoolsSet.size() > 0 && !COMPRESSED) {
            sb.append("// ").append(city).append(" - частни училища").append("\r\n");
        }

        for (School school : privateSchoolsSet) {
            String line = getLine(templateSchool, index, school);
            sb.append(line);
            ++index;
        }

        if(!COMPRESSED) {
            System.out.println(sb.toString());
            Files.writeString(of, sb.toString() + "\r\n", StandardOpenOption.APPEND);
        } else {
            System.out.print(sb.toString());
            Files.writeString(of, sb.toString(), StandardOpenOption.APPEND);
        }
    }

    private String getLine(String templateSchool, int index, School school) {
        templateSchool = templateSchool.replace("__index__", "" + index)
                .replace("__label__", school.getLabel())
                .replace("__name__", school.getName());

        for(int i = 0; i < numYears; i++) {
            templateSchool = templateSchool
                    .replace("__b" + (18 + i) + "__", school.getBelScore().get(i) > 0 ? "" + school.getBelScore().get(i) : "null")
                    .replace("__m" + (18 + i) + "__", school.getMatScore().get(i) > 0 ? "" + school.getMatScore().get(i) : "null")
                    .replace("__bu" + (18 + i) + "__", school.getBelStudents().get(i) > 0 ? "" + school.getBelStudents().get(i) : "null")
                    .replace("__mu" + (18 + i) + "__", school.getMatStudents().get(i) > 0 ? "" + school.getMatStudents().get(i) : "null");
        }

        return templateSchool;
    }

    private boolean eligibleForRemoval(School school) {
        return school.getBelScore().get(school.getBelScore().size() - 1) == 0.0d &&
                school.getBelScore().get(school.getBelScore().size() - 2) == 0.0d &&
                school.getBelScore().get(school.getBelScore().size() - 3) == 0.0d &&
                school.getMatScore().get(school.getMatScore().size() - 1) == 0.0d &&
                school.getMatScore().get(school.getMatScore().size() - 2) == 0.0d &&
                school.getMatScore().get(school.getMatScore().size() - 3) == 0.0d;
    }

    private void printSchoolsByNVOResult(Map<String, Set<School>> schools) {
        final String template = "s[__index__] = {p: __private__, c: __code__, '__label__', n: '__name__', b: [null, __b18__, __b19__, __b20__, __b21__], m: [null, __m18__, __m19__, __m20__, __m21__]};\r\n";

        int start = 1;
        int end = 100;
        String city = "Стара Загора";

        StringBuilder sb = new StringBuilder();
        Set<School> schoolSet = schools.get(city);
        int index = start;
        Iterator<School> iterator = schoolSet.iterator();
        while(iterator.hasNext() && index <= end) {
            School school = iterator.next();
            String line = template.replace("__index__", "" + index)
                    .replace("__private__", Boolean.toString(school.isPrivate()))
                    .replace("__code__", school.getCode())
                    .replace("__label__", school.getLabel())
                    .replace("__name__", school.getName())
                    .replace("__b18__", school.getBelScore().get(0) > 0 ? "" + school.getBelScore().get(0) : "null")
                    .replace("__b19__", school.getBelScore().get(1) > 0 ? "" + school.getBelScore().get(1) : "null")
                    .replace("__b20__", school.getBelScore().get(2) > 0 ? "" + school.getBelScore().get(2) : "null")
                    .replace("__b21__", school.getBelScore().get(3) > 0 ? "" + school.getBelScore().get(3) : "null")
                    .replace("__m18__", school.getMatScore().get(0) > 0 ? "" + school.getMatScore().get(0) : "null")
                    .replace("__m19__", school.getMatScore().get(1) > 0 ? "" + school.getMatScore().get(1) : "null")
                    .replace("__m20__", school.getMatScore().get(2) > 0 ? "" + school.getMatScore().get(2) : "null")
                    .replace("__m21__", school.getMatScore().get(3) > 0 ? "" + school.getMatScore().get(3) : "null");
            sb.append(line);
            ++index;
        }
        System.out.println(sb.toString());
    }

    private Record lineToRecord(String line) {
        Record r = new Record();
        try {
            line = normalizeLine(line);
            String[] entries = line.split("\\|");
            String city = entries[0].replaceAll("\"", "");
            String code = entries[1].replaceAll("\"", "");
            String school = entries[2].replaceAll("\"", "");
            String belScore = entries[3].replaceAll("\"", "");
            String matScore = entries[4].replaceAll("\"", "");
            String belStudents = entries[5].replaceAll("\"", "");
            String matStudents = entries[6].replaceAll("\"", "");
            if(matScore.trim().length() == 0) {
                matScore = "0.00";
            }
            r.setCity(city);
            r.setCode(code);
            r.setSchool(school);
            r.setBelScore(Double.valueOf(belScore));
            r.setMatScore(Double.valueOf(matScore));
            r.setBelStudents(Integer.valueOf(belStudents));
            r.setMatStudents(Integer.valueOf(matStudents));
            return r;
        } catch (RuntimeException e) {
            System.out.println(r);
            e.printStackTrace();
            throw e;
        }
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
