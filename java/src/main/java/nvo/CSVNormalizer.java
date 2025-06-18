package nvo;

import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.CSVWriter;
import com.opencsv.exceptions.CsvException;

import java.io.BufferedReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class CSVNormalizer {
    private static final String BASE_DIR = "/Users/mac/projects/nvo/data/";
    private static final String BASE_DIR_MON = BASE_DIR + "mon/";
    private static final String BASE_DIR_NORMALIZED = BASE_DIR + "normalized/";

    public static void main(String... args) throws Exception {
        CSVNormalizer worker = new CSVNormalizer();
        worker.reformat("nvo-4-2018", ',', "", 2, 3, 4, 10, 9, 6, 5, 0, 0, 0, 0);
        worker.reformat("nvo-4-2019", ',', "", 2, 3, 4, 10, 9, 6, 5, 0, 0, 0, 0);
        worker.reformat("nvo-4-2021", ',', "ГР.", 2, 3, 4, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-4-2022", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-4-2023", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-4-2024", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-4-2025", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-7-2018", ';', "ГР.", 2, 3, 4, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-7-2019", ';', "ГР. ", 2, 3, 4, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-7-2020", ';', "ГР.", 2, 3, 4, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-7-2021", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-7-2022", ';', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-7-2023", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-7-2024", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-10-2021", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-10-2022", ';', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-10-2023", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("nvo-10-2024", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7, 0, 0, 0, 0);
        worker.reformat("dzi-2018", ',', "ГР.", 2, 3, 4, 6, 34, 5, 33, 0, 0, 0, 0);
        worker.reformat("dzi-2019", ',', "ГР.", 2, 3, 4, 6, -1, 5, -1, 8, 7, 32, 31);
        worker.reformat("dzi-2020", ',', "ГР.", 2, 3, 4, 6, 34, 5, 33, 0, 0, 0, 0);
        worker.reformat("dzi-2021", ',', "ГР.", 2, 3, 4, 6, 34, 5, 33, 0, 0, 0, 0);
        worker.reformat("dzi-2022", ',', "ГР.", 2, 4, 3, 6, -1, 5, -1, 8, 7, 70, 69);
        worker.reformat("dzi-2023", ',', "ГР.", 2, 4, 3, 6, -1, 5, -1, 8, 7, 74, 73);
        worker.reformat("dzi-2024", ',', "ГР.", 2, 4, 3, 6, -1, 5, -1, 8, 7, 74, 73);
        worker.reformat("dzi-2025", ',', "ГР.", 2, 4, 3, 6, -1, 5, -1, 8, 7, 74, 73);

        Files.copy(Path.of(BASE_DIR_NORMALIZED + "nvo-4-2019-normalized.csv"),
                Path.of(BASE_DIR_NORMALIZED + "nvo-4-2020-normalized.csv"),
                StandardCopyOption.REPLACE_EXISTING);
        Files.copy(Path.of(BASE_DIR_NORMALIZED + "nvo-10-2021-normalized.csv"),
                Path.of(BASE_DIR_NORMALIZED + "nvo-10-2020-normalized.csv"),
                StandardCopyOption.REPLACE_EXISTING);
    }

    private void reformat(String inputFileName,
                          char separator,
                          String cityPrefix,
                          int cityPos,
                          int codePos,
                          int namePos,
                          int belPos,
                          int matPos,
                          int belNumPos,
                          int matNumPos,
                          int firstSubjectPos,
                          int firstSubjectNumPos,
                          int lastSubjectPos,
                          int lastSubjectNumPos) throws Exception {
        List<String[]> lines = readCSV(inputFileName, separator);

        String[] cities = {"София", "Пловдив", "Варна", "Бургас",
                "Благоевград",
                "Велико Търново",
                "Видин",
                "Враца",
                "Габрово",
                "Добрич",
                "Кърджали",
                "Кюстендил",
                "Ловеч",
                "Монтана",
                "Пазарджик",
                "Перник",
                "Плевен",
                "Разград",
                "Русе",
                "Силистра",
                "Сливен",
                "Смолян",
                "Стара Загора",
                "Търговище",
                "Хасково",
                "Шумен",
                "Ямбол",

                "Айтос",
                "Асеновград",
                "Балчик",
                "Банкя",
                "Банско",
                "Берковица",
                "Ботевград",
                "Велинград",
                "Горна Оряховица",
                "Гоце Делчев",
                "Димитровград",
                "Дупница",
                "Ихтиман",
                "Каварна",
                "Казанлък",
                "Карлово",
                "Карнобат",
                "Козлодуй",
                "Костинброд",
                "Лом",
                "Луковит",
                "Несебър",
                "Нова Загора",
                "Нови Искър",
                "Нови пазар",
                "Обзор",
                "Панагюрище",
                "Петрич",
                "Пещера",
                "Поморие",
                "Попово",
                "Правец",
                "Провадия",
                "Първомай",
                "Раднево",
                "Радомир",
                "Разлог",
                "Раковски",
                "Самоков",
                "Сандански",
                "Свиленград",
                "Свищов",
                "Своге",
                "Севлиево",
                "Стамболийски",
                "Троян",
                "Харманли",
                "Червен бряг",
                "Чирпан"
        };

        List<String[]> resultLines = new ArrayList<>();
        for(String city : cities) {
            //System.out.println("*** " + inputFileName + " ||| " + city + " ***");
            resultLines.addAll(parseCity(lines, city, cityPrefix, cityPos,
                codePos, namePos,
                belPos, matPos, belNumPos, matNumPos,
                firstSubjectPos, firstSubjectNumPos,
                lastSubjectPos, lastSubjectNumPos));
        }

        writeCSV(inputFileName, resultLines);
        System.out.println("Normalized data: " + inputFileName);
    }

    private void writeCSV(String outputFileName, List<String[]> resultLines) throws IOException {
        StringWriter writer = new StringWriter();
        CSVWriter csvWriter = new CSVWriter(writer);
        csvWriter.writeNext(new String[] {"Град", "Код", "Име", "БЕЛ", "МАТ", "Уч. БЕЛ", "Уч. МАТ"});
        csvWriter.writeAll(resultLines);
        String result = writer.toString();
        csvWriter.close();

        FileWriter fileWriter = new FileWriter(BASE_DIR_NORMALIZED + outputFileName + "-normalized.csv", false);
        fileWriter.write(result);
        fileWriter.close();
    }

    private List<String[]> readCSV(String inputFileName, char separator) throws IOException, CsvException {
        BufferedReader reader = Files.newBufferedReader(Path.of(BASE_DIR_MON + inputFileName + ".csv"));
        CSVReader csvReader = new CSVReaderBuilder(reader)
                .withCSVParser(new CSVParserBuilder()
                        .withSeparator(separator)
                        .build())
                .build();

        List<String[]> lines = csvReader.readAll();
        csvReader.close();

        return lines;
    }

    private List<String[]> parseCity(List<String[]> lines, String city, String cityPrefix, int cityPos,
                                     int codePos, int namePos,
                                     int belPos, int matPos, int belNumPos, int matNumPos,
                                     int firstSubjectPos, int firstSubjectNumPos,
                                     int lastSubjectPos, int lastSubjectNumPos) {
        final String cityPrefixFinal = city.equals("София") ? "" : cityPrefix;
        final String cityFinal = city.equals("София") ? "София-град" : city;
        final int cityPosFinal = city.equals("София") ? 0 : cityPos;

        List<String[]> schools = new LinkedList<>();
        for(String[] line : lines) {
            if(!line[cityPosFinal].equalsIgnoreCase(cityPrefixFinal + cityFinal)) {
                // Check if this is the wrong county or if this is not a private school
                if(!line[0].toUpperCase().contains(city.toUpperCase()) || (
                                                        !line[namePos].toUpperCase().contains("ЧАСТН")
                                                     && !line[namePos].toUpperCase().contains("ЧНУ")
                                                     && !line[namePos].toUpperCase().contains("ЧОУ")
                                                     && !line[namePos].toUpperCase().contains("ЧСУ")
                                                     )
                ) {
                    continue;
                }
            }

            double calculatedMat = 0.0d;
            int calculatedAttendees = 0;

            if(matPos < 0) {
                double subjectsSum = 0.0d;
                int counter = 0;

                while(firstSubjectPos + counter <= lastSubjectPos) {
                    String firstSubject = line[firstSubjectPos + counter];
                    String attendeesStr = line[firstSubjectNumPos + counter];

                    if(firstSubject.trim().equals("")) {
                        firstSubject = "0.000";
                    }

                    if(attendeesStr.trim().equals("")) {
                        attendeesStr = "0";
                    }

                    double subject = Double.parseDouble(firstSubject.replace(',', '.'));
                    int attendees = Integer.parseInt(attendeesStr);

                    subjectsSum += subject * attendees;
                    calculatedAttendees += attendees;

                    counter += 2;
                }

                calculatedMat = subjectsSum / calculatedAttendees;
            }

            String[] school = new String[7];

            school[0] = city;
            school[1] = line[codePos].replaceAll(" ", "").replaceAll("-", "");
            school[2] = line[namePos].replaceAll("\"", "").replaceAll("\\s+", " ");
            school[3] = line[belPos].replace(',', '.');

            school[4] = matPos < 0 ? "" + (Math.floor(calculatedMat * 1000) / 1000) : line[matPos].replace(',', '.');
            school[5] = line[belNumPos].replaceAll("\"", "");
            school[6] = matNumPos < 0 ? "" + calculatedAttendees : line[matNumPos].replaceAll("\"", "");

            for(int i = 3; i <= 6; i++) {
                if(school[i].equals("")) {
                    school[i] = "0";
                }
            }

            if(!school[3].equals("") || !school[4].equals("")) {
                schools.add(school);
            }
        }

        return schools;

//        return lines.stream()
//                .filter(line -> (line[cityPosFinal]).equalsIgnoreCase(cityPrefixFinal + cityFinal))
//                .map(line -> new String[] {
//                        city,
//                        line[codePos].replaceAll(" ", "").replaceAll("-", ""),
//                        line[namePos].replaceAll("\"", "")
//                            .replaceAll("\\s+", " "),
//                        line[belPos].replace(',', '.'),
//                        matPos < 0 ? "0.000" : line[matPos].replace(',', '.'),
//                        line[belNumPos].replaceAll("\"", ""),
//                        matNumPos < 0 ? "0" :line[matNumPos].replaceAll("\"", "")
//
//                })
//                .collect(Collectors.toList());
    }
}
