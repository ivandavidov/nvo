package nvo;

import java.io.File;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.HashSet;
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
        String file18 = "C:\\Users\\Ivan\\Downloads\\nginx-1.21.1\\html\\nvo\\data\\dzi-2018.csv";
        String file19 = "C:\\Users\\Ivan\\Downloads\\nginx-1.21.1\\html\\nvo\\data\\dzi-2019.csv";
        String file20 = "C:\\Users\\Ivan\\Downloads\\nginx-1.21.1\\html\\nvo\\data\\dzi-2020.csv";
        String file21 = "C:\\Users\\Ivan\\Downloads\\nginx-1.21.1\\html\\nvo\\data\\dzi-2021.csv";
        String[] files = {file18, file19, file20, file21};
        Map<String, Map<String, School>> cities = new HashMap<>();
        for(int f = 0; f < files.length; f++) {
            List<String> lines = Files.readAllLines(new File(files[f]).toPath());
            for(int i = 2; i < lines.size(); i++) {
                Record record = lineToRecord(lines.get(i));
                if(!record.getCity().toUpperCase().startsWith("ГР.")) {
                    continue;
                }
                Map<String, School> schools = cities.get(record.getCity());
                if(schools == null) {
                    schools = new HashMap<>();
                    cities.put(record.getCity(), schools);
                }
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
            schoolsMap.forEach((code, school) -> {
                schoolSet.add(school);
            });
            schools.put(city, schoolSet);
        });
        System.out.println("end");

        final String template = "s[__index__] = {l: '__label__', n: '__name__', b: [null, __b18__, __b19__, __b20__, __b21__], m: [null, __m18__, __m19__, __m20__, __m21__]};\r\n";
        int start = 525;
        int end = 999;
        String city = "СМОЛЯН";
        StringBuilder sb = new StringBuilder();
        Set<School> schoolSet = schools.get("ГР." + city);
        int index = start;
        Iterator<School> iterator = schoolSet.iterator();
        while(iterator.hasNext() && index <= end) {
            School school = iterator.next();
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
        //System.out.println(r);
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
