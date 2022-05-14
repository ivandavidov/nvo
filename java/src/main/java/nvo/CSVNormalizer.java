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
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class CSVNormalizer {
    private static final String BASE_DIR = "C:\\projects\\nvo\\data\\";
    private static final String BASE_DIR_MON = BASE_DIR + "mon\\";
    private static final String BASE_DIR_NORMALIZED = BASE_DIR + "normalized\\";

    public static void main(String... args) throws Exception {
        CSVNormalizer worker = new CSVNormalizer();
        worker.reformat("nvo-4-2018", ',', "", 2, 3, 4, 10, 9, 6, 5);
        worker.reformat("nvo-4-2019", ',', "", 2, 3, 4, 10, 9, 6, 5);
        worker.reformat("nvo-4-2021", ',', "ГР.", 2, 3, 4, 6, 8, 5, 7);
        worker.reformat("nvo-7-2018", ';', "ГР.", 2, 3, 4, 6, 8, 5, 7);
        worker.reformat("nvo-7-2019", ';', "ГР. ", 2, 3, 4, 6, 8, 5, 7);
        worker.reformat("nvo-7-2020", ';', "ГР.", 2, 3, 4, 6, 8, 5, 7);
        worker.reformat("nvo-7-2021", ',', "ГР.", 2, 4, 3, 6, 8, 5, 7);
        worker.reformat("dzi-2018", ',', "ГР.", 2, 3, 4, 6, 34, 5, 33);
        worker.reformat("dzi-2019", ',', "ГР.", 2, 3, 4, 6, -1, 5, -1);
        worker.reformat("dzi-2020", ',', "ГР.", 2, 3, 4, 6, 34, 5, 33);
        worker.reformat("dzi-2021", ',', "ГР.", 2, 3, 4, 6, 34, 5, 33);

        Files.copy(Path.of(BASE_DIR_NORMALIZED + "nvo-4-2019-normalized.csv"),
                Path.of(BASE_DIR_NORMALIZED + "nvo-4-2020-normalized.csv"),
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
                          int matNumPos) throws Exception {
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
                "Ямбол"
        };

       List<String[]> resultLines = new ArrayList<>();
        for(String city : cities) {
            resultLines.addAll(parseCity(lines, city, cityPrefix, cityPos, codePos, namePos, belPos, matPos, belNumPos, matNumPos));
        }

        writeCSV(inputFileName, resultLines);
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

    private List<String[]> parseCity(List<String[]> lines, String city, String cityPrefix, int cityPos, int codePos, int namePos, int belPos, int matPos, int belNumPos, int matNumPos) {
        final String cityPrefixFinal = city.equals("София") ? "" : cityPrefix;
        final String cityFinal = city.equals("София") ? "София-град" : city;
        final int cityPosFinal = city.equals("София") ? 0 : cityPos;
        return lines.stream()
                .filter(line -> (line[cityPosFinal]).equalsIgnoreCase(cityPrefixFinal + cityFinal))
                .map(line -> new String[] {
                        city,
                        line[codePos].replaceAll(" ", "").replaceAll("-", ""),
                        line[namePos].replaceAll("\"", "")
                            .replaceAll("\\s+", " "),
                        line[belPos].replace(',', '.'),
                        matPos < 0 ? "0.000" : line[matPos].replace(',', '.'),
                        line[belNumPos].replaceAll("\"", ""),
                        matNumPos < 0 ? "0" :line[matNumPos].replaceAll("\"", "")

                })
                .collect(Collectors.toList());
    }
}
