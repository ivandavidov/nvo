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
    private static final boolean COMPRESSED = false;

    private String header = null;

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

        String basePath = "/Users/ivan/projects/nvo/data/normalized/";

        if(mode.equals("normalize")) {
          CSVNormalizer.main(null);
          System.exit(0);
        } else if(mode.equals("12")) {
            String file18 = basePath + "dzi-2018-normalized.csv";
            String file19 = basePath + "dzi-2019-normalized.csv";
            String file20 = basePath + "dzi-2020-normalized.csv";
            String file21 = basePath + "dzi-2021-normalized.csv";
            String file22 = basePath + "dzi-2022-normalized.csv";
            String file23 = basePath + "dzi-2023-normalized.csv";
            header = "";
            files = new String[] {file18, file19, file20, file21, file22, file23};
        } else if(mode.equals("10")) {
            String file18 = basePath + "nvo-10-2018-normalized.csv";
            String file19 = basePath + "nvo-10-2019-normalized.csv";
            String file20 = basePath + "nvo-10-2020-normalized.csv";
            String file21 = basePath + "nvo-10-2021-normalized.csv";
            String file22 = basePath + "nvo-10-2022-normalized.csv";
            String file23 = basePath + "nvo-10-2023-normalized.csv";
            files = new String[] {file18, file19, file20, file21, file22, file23};
        } else if(mode.equals("7")) {
            String file18 = basePath + "nvo-7-2018-normalized.csv";
            String file19 = basePath + "nvo-7-2019-normalized.csv";
            String file20 = basePath + "nvo-7-2020-normalized.csv";
            String file21 = basePath + "nvo-7-2021-normalized.csv";
            String file22 = basePath + "nvo-7-2022-normalized.csv";
            String file23 = basePath + "nvo-7-2023-normalized.csv";
            files = new String[] {file18, file19, file20, file21, file22, file23};
        } else if(mode.equals("4")) {
            String file18 = basePath + "nvo-4-2018-normalized.csv";
            String file19 = basePath + "nvo-4-2019-normalized.csv";
            String file20 = basePath + "nvo-4-2020-normalized.csv";
            String file21 = basePath + "nvo-4-2021-normalized.csv";
            String file22 = basePath + "nvo-4-2022-normalized.csv";
            String file23 = basePath + "nvo-4-2023-normalized.csv";
            files = new String[] {file18, file19, file20, file21, file22, file23};
        } else {
            System.out.println("Mode '" + mode + "' is not recognized.");
            System.exit(0);
        }

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

        printSchoolsByType(schools, "Асеновград", 2901, 3000);
        printSchoolsByType(schools, "Велинград", 3001, 3100);
        printSchoolsByType(schools, "Горна Оряховица", 3101, 3200);
        printSchoolsByType(schools, "Димитровград", 3201, 3300);
        printSchoolsByType(schools, "Дупница", 3301, 3400);
        printSchoolsByType(schools, "Казанлък", 3401, 3500);
        printSchoolsByType(schools, "Карлово", 3501, 3600);
        printSchoolsByType(schools, "Петрич", 3601, 3700);
        printSchoolsByType(schools, "Самоков", 3701, 3800);
        printSchoolsByType(schools, "Сандански", 3801, 3900);
        printSchoolsByType(schools, "Свищов", 3901, 4000);

//        printSchoolsByNVOResult(schools);

        System.out.println();
    }

    private void printSchoolsByType(Map<String, Set<School>> schools, String city, int start, int end) {
        final String templateSchool;
        final String templateIndexIncl;
        final String templateIndexExcl;
        if(COMPRESSED) {
            templateSchool = "s[__index__]={l:'__label__',n:'__name__',b:[__b18__,__b19__,__b20__,__b21__,__b22__,__b23__],m:[__m18__,__m19__,__m20__,__m21__,__m22__,__m23__],bu:[__bu18__,__bu19__,__bu20__,__bu21__,__bu22__,__bu23__],mu:[__mu18__,__mu19__,__mu20__,__mu21__,__mu22__,__mu23__]};";
            templateIndexIncl = "si['__city__']={n:[__n_begin__,__n_end__],p:[__p_begin__,__p_end__]};";
            templateIndexExcl = "si['__city__']={n:[__n_begin__,__n_end__],p:null};";
        } else {
            templateSchool = "s[__index__] = {l: '__label__', n: '__name__', b: [__b18__, __b19__, __b20__, __b21__, __b22__, __b23__], m: [__m18__, __m19__, __m20__, __m21__, __m22__, __m23__], bu: [__bu18__, __bu19__, __bu20__, __bu21__, __bu22__, __bu23__], mu: [__mu18__, __mu19__, __mu20__, __mu21__, __mu22__, __mu23__]};\r\n";
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
        if(!COMPRESSED) {
            sb.append("// ").append(city).append(" - индексация").append("\r\n");
        }
        sb.append(siLine);
        if(!COMPRESSED) {
            sb.append("// ").append(city).append(" - държавни училища").append("\r\n");
        }

        int index = start;
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
        } else {
            System.out.print(sb.toString());
        }
    }

    private String getLine(String templateSchool, int index, School school) {
        return templateSchool.replace("__index__", "" + index)
                        .replace("__label__", school.getLabel())
                        .replace("__name__", school.getName())
                        .replace("__b18__", school.getBelScore().get(0) > 0 ? "" + school.getBelScore().get(0) : "null")
                        .replace("__b19__", school.getBelScore().get(1) > 0 ? "" + school.getBelScore().get(1) : "null")
                        .replace("__b20__", school.getBelScore().get(2) > 0 ? "" + school.getBelScore().get(2) : "null")
                        .replace("__b21__", school.getBelScore().get(3) > 0 ? "" + school.getBelScore().get(3) : "null")
                        .replace("__b22__", school.getBelScore().get(4) > 0 ? "" + school.getBelScore().get(4) : "null")
                        .replace("__b23__", school.getBelScore().get(5) > 0 ? "" + school.getBelScore().get(5) : "null")
                        .replace("__m18__", school.getMatScore().get(0) > 0 ? "" + school.getMatScore().get(0) : "null")
                        .replace("__m19__", school.getMatScore().get(1) > 0 ? "" + school.getMatScore().get(1) : "null")
                        .replace("__m20__", school.getMatScore().get(2) > 0 ? "" + school.getMatScore().get(2) : "null")
                        .replace("__m21__", school.getMatScore().get(3) > 0 ? "" + school.getMatScore().get(3) : "null")
                        .replace("__m22__", school.getMatScore().get(4) > 0 ? "" + school.getMatScore().get(4) : "null")
                        .replace("__m23__", school.getMatScore().get(5) > 0 ? "" + school.getMatScore().get(5) : "null")
                        .replace("__bu18__", school.getBelStudents().get(0) > 0 ? "" + school.getBelStudents().get(0) : "null")
                        .replace("__bu19__", school.getBelStudents().get(1) > 0 ? "" + school.getBelStudents().get(1) : "null")
                        .replace("__bu20__", school.getBelStudents().get(2) > 0 ? "" + school.getBelStudents().get(2) : "null")
                        .replace("__bu21__", school.getBelStudents().get(3) > 0 ? "" + school.getBelStudents().get(3) : "null")
                        .replace("__bu22__", school.getBelStudents().get(4) > 0 ? "" + school.getBelStudents().get(4) : "null")
                        .replace("__bu23__", school.getBelStudents().get(5) > 0 ? "" + school.getBelStudents().get(5) : "null")
                        .replace("__mu18__", school.getMatStudents().get(0) > 0 ? "" + school.getMatStudents().get(0) : "null")
                        .replace("__mu19__", school.getMatStudents().get(1) > 0 ? "" + school.getMatStudents().get(1) : "null")
                        .replace("__mu20__", school.getMatStudents().get(2) > 0 ? "" + school.getMatStudents().get(2) : "null")
                        .replace("__mu21__", school.getMatStudents().get(3) > 0 ? "" + school.getMatStudents().get(3) : "null")
                        .replace("__mu22__", school.getMatStudents().get(4) > 0 ? "" + school.getMatStudents().get(4) : "null")
                        .replace("__mu23__", school.getMatStudents().get(5) > 0 ? "" + school.getMatStudents().get(5) : "null");
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
