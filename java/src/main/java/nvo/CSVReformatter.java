package nvo;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.CSVWriter;

import java.io.BufferedReader;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class CSVReformatter {
    public static void main(String... args) throws Exception {
        CSVReformatter reformatter = new CSVReformatter();
        reformatter.reformat("C:\\projects\\nvo\\data\\nvo-4-2021.csv");
    }

    private void reformat(String fileName) throws Exception {
        BufferedReader reader = Files.newBufferedReader(Path.of(fileName));
        CSVReader csvReader = new CSVReaderBuilder(reader)
                .build();

        List<String[]> lines = csvReader.readAll();

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

        // NVO-4 : 2018 : "", 2, 3, 4, 10, 9
        // NVO-4 : 2019 : "", 2, 3, 4, 10, 9
        // NVO-4 : 2021 : "ГР.", 2, 3, 4, 6, 8
        String cityPrefix = "ГР.";
        int cityPos = 2;
        int codePos = 3;
        int namePos = 4;
        int belPos = 6;
        int matPos = 8;

        List<String[]> resultLines = new ArrayList<>();
        for(String city : cities) {
            resultLines.addAll(parseCity(lines, city, cityPrefix, cityPos, codePos, namePos, belPos, matPos));
        }

        StringWriter writer = new StringWriter();
        CSVWriter csvWriter = new CSVWriter(writer);
        csvWriter.writeNext(new String[] {"Град", "Код", "Име", "БЕЛ", "МАТ"});
        csvWriter.writeAll(resultLines);
        String result = writer.toString();

        System.out.println(result);
    }

    private List<String[]> parseCity(List<String[]> lines, String city, String cityPrefix, int cityPos, int codePos, int namePos, int belPos, int matPos) {
        return lines.stream()
                .filter(line -> (line[cityPos]).equalsIgnoreCase(cityPrefix + city))
                .map(line -> new String[] {
                        city
                        , line[codePos].replaceAll(" ", "")
                        , line[namePos].replaceAll("\"", "")
                            .replaceAll("\\s+", " ")
                        , line[belPos].replace(',', '.')
                        , line[matPos].replace(',', '.')
                })
                .collect(Collectors.toList());
    }
}
