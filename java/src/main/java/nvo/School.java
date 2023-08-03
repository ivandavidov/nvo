package nvo;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@EqualsAndHashCode
@ToString
public class School implements Comparable<School> {
    public static final Map<String, String[]> schoolCodes = prepareSchoolCodes();
    public static final Map<String, String> fixedCodes = prepareFixedCodes();

    public static final String NU_VASIL_LEVSKI = "НУ Васил Левски";
    public static final String NU_IVAN_VAZOV = "НУ Иван Вазов";
    public static final String NU_KIRIL_I_METODII_SHORT = "НУ Кирил и Методий";
    public static final String NU_KIRIL_I_METODII_LONG = "НУ Св. Св. Кирил и Методий";
    public static final String NU_KLIMENT_OHRIDSKI_SHORT = "НУ Кл. Охридски";
    public static final String NU_KLIMENT_OHRIDSKI_LONG = "НУ Св. Климент Охридски";
    public static final String NU_LIUBEN_KARAVELOV_SHORT = "НУ Л. Каравелов";
    public static final String NU_LIUBEN_KARAVELOV_LONG = "НУ Любен Каравелов";
    public static final String NU_HRISTO_BOTEV = "НУ Христо Ботев";

    public static final String OU_ALEKO_KONSTANTINOV_SHORT = "ОУ А. Константинов";
    public static final String OU_ALEKO_KONSTANTINOV_LONG = "ОУ Алеко Константинов";
    public static final String OU_VASIL_LEVSKI = "ОУ Васил Левски";
    public static final String OU_IVAN_VAZOV = "ОУ Иван Вазов";
    public static final String OU_KIRIL_I_METODII_SHORT = "ОУ Кирил и Методий";
    public static final String OU_KIRIL_I_METODII_LONG = "ОУ Св. Св. Кирил и Методий";
    public static final String OU_KLIMENT_OHRIDSKI_SHORT = "ОУ Кл. Охридски";
    public static final String OU_KLIMENT_OHRIDSKI_LONG = "ОУ Св. Климент Охридски";
    public static final String OU_LIUBEN_KARAVELOV_SHORT = "ОУ Л. Каравелов";
    public static final String OU_LIUBEN_KARAVELOV_LONG = "ОУ Любен Каравелов";
    public static final String OU_HRISTO_BOTEV = "ОУ Христо Ботев";

    public static final String PG_SELSKO_STOPANSTVO_SHORT = "ПГ по селско стоп.";
    public static final String PG_SELSKO_STOPANSTVO_LONG = "ПГ по селско стопанство";
    public static final String PG_HRISTO_BOTEV = "ПГ Христо Ботев";

    public static final String SU_VASIL_LEVSKI = "СУ Васил Левски";
    public static final String SU_IVAN_VAZOV = "СУ Иван Вазов";
    public static final String SU_KIRIL_I_METODII_SHORT = "СУ Кирил и Методий";
    public static final String SU_KIRIL_I_METODII_LONG = "СУ Св. Св. Кирил и Методий";
    public static final String SU_KLIMENT_OHRIDSKI_SHORT = "СУ Кл. Охридски";
    public static final String SU_KLIMENT_OHRIDSKI_LONG = "СУ Св. Климент Охридски";
    public static final String SU_LIUBEN_KARAVELOV_SHORT = "СУ Л. Каравелов";
    public static final String SU_LIUBEN_KARAVELOV_LONG = "СУ Любен Каравелов";
    public static final String SU_PEIO_YAVOROV_SHORT = "СУ Пейо Яворов";
    public static final String SU_PEIO_YAVOROV_LONG = "СУ Пейо Крачолов Яворов";
    public static final String SU_HRISTO_BOTEV = "СУ Христо Ботев";

    String label;
    String name;
    String code;
    List<Double> belScore = new ArrayList<>();
    List<Double> matScore = new ArrayList<>();
    List<Integer> belStudents = new ArrayList<>();
    List<Integer> matStudents = new ArrayList<>();

    boolean isPrivate() {
        return schoolCodes.containsKey(code) && schoolCodes.get(code)[0].equals("1");
    }

    String getLabel() {
        return schoolCodes.containsKey(code) ? schoolCodes.get(code)[1] : code + ": " + label;
    }

    String getName() {
        return schoolCodes.containsKey(code) ? schoolCodes.get(code)[2] : name;
    }

    private double calculateMedian() {
        double medianFirst = 0.0d;
        double medianSecond = 0.0d;
        int numYears = 3;
        int dividerFirst = numYears;
        int dividerSecond = numYears;

        for(int i = 1; i <=numYears; i++ ) {
            int index = belScore.size() - i;
            if(belScore.get(index) == 0.0d) {
                --dividerFirst;
            } else {
                medianFirst += belScore.get(index);
            }
            if(matScore.get(index) == 0.0d) {
                --dividerSecond;
            } else {
                medianSecond += matScore.get(index);
            }
        }

        medianFirst = dividerFirst > 0 ? medianFirst / dividerFirst : 0.0d;
        medianSecond = dividerSecond > 0 ? medianSecond / dividerSecond : 0.0d;

        return (medianFirst + medianSecond) / 2d;
    }

    @Override
    public int compareTo(School o) {
        return calculateMedian() < o.calculateMedian() ? 1 : -1;
    }

    private static Map<String, String> prepareFixedCodes() {
        Map<String, String> fixedCodes = new HashMap<>();

        fixedCodes.put("40001", "400010");
        fixedCodes.put("40002", "400020");
        fixedCodes.put("40003", "400030");
        fixedCodes.put("40004", "400040");
        fixedCodes.put("20021", "200210");
        fixedCodes.put("20023", "200230");
        fixedCodes.put("20024", "200240");
        fixedCodes.put("10004", "100040");
        fixedCodes.put("10007", "100070");
        fixedCodes.put("10011", "100110");
        fixedCodes.put("1002", "100200");
        fixedCodes.put("10125", "101250");
        fixedCodes.put("10129", "101290");
        fixedCodes.put("10158", "101580");
        fixedCodes.put("1017", "101700");
        fixedCodes.put("60307", "603070");
        fixedCodes.put("60806", "608060");
        fixedCodes.put("80001", "800010");
        fixedCodes.put("10188", "101880");
        fixedCodes.put("10206", "102060");

        return fixedCodes;
    }

    private static Map<String, String[]> prepareSchoolCodes() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.putAll(prepareSchoolCodesSofia());
        schoolCodes.putAll(prepareSchoolCodesPlovdiv());
        schoolCodes.putAll(prepareSchoolCodesVarna());
        schoolCodes.putAll(prepareSchoolCodesBurgas());

        schoolCodes.putAll(prepareSchoolCodesBlagoevgrad());
        schoolCodes.putAll(prepareSchoolCodesVelikoTurnovo());
        schoolCodes.putAll(prepareSchoolCodesVidin());
        schoolCodes.putAll(prepareSchoolCodesVraca());
        schoolCodes.putAll(prepareSchoolCodesGabrovo());
        schoolCodes.putAll(prepareSchoolCodesDobrich());
        schoolCodes.putAll(prepareSchoolCodesKiustendil());
        schoolCodes.putAll(prepareSchoolCodesKurdzhali());
        schoolCodes.putAll(prepareSchoolCodesLovetch());
        schoolCodes.putAll(prepareSchoolCodesMontana());
        schoolCodes.putAll(prepareSchoolCodesPazardzhik());
        schoolCodes.putAll(prepareSchoolCodesPernik());
        schoolCodes.putAll(prepareSchoolCodesPleven());
        schoolCodes.putAll(prepareSchoolCodesRazgrad());
        schoolCodes.putAll(prepareSchoolCodesRuse());
        schoolCodes.putAll(prepareSchoolCodesSilistra());
        schoolCodes.putAll(prepareSchoolCodesSliven());
        schoolCodes.putAll(prepareSchoolCodesSmolyan());
        schoolCodes.putAll(prepareSchoolCodesStaraZagora());
        schoolCodes.putAll(prepareSchoolCodesTurgovishte());
        schoolCodes.putAll(prepareSchoolCodesHaskovo());
        schoolCodes.putAll(prepareSchoolCodesShumen());
        schoolCodes.putAll(prepareSchoolCodesIambol());

        schoolCodes.putAll(prepareSchoolCodesAitos());
        schoolCodes.putAll(prepareSchoolCodesAsenovgrad());
        // Bankia - part of Sofia
        schoolCodes.putAll(prepareSchoolCodesBotevgrad());
        schoolCodes.putAll(prepareSchoolCodesVelingrad());
        schoolCodes.putAll(prepareSchoolCodesGornaOryahovitsa());
        schoolCodes.putAll(prepareSchoolCodesGotseDelchev());
        schoolCodes.putAll(prepareSchoolCodesDimitrovgrad());
        schoolCodes.putAll(prepareSchoolCodesDupnitsa());
        schoolCodes.putAll(prepareSchoolCodesIhtiman());
        schoolCodes.putAll(prepareSchoolCodesKazanluk());
        schoolCodes.putAll(prepareSchoolCodesKarlovo());
        schoolCodes.putAll(prepareSchoolCodesKarnobat());
        schoolCodes.putAll(prepareSchoolCodesKostinbrod());
        schoolCodes.putAll(prepareSchoolCodesLom());
        schoolCodes.putAll(prepareSchoolCodesLukovit());
        schoolCodes.putAll(prepareSchoolCodesNesebar());
        schoolCodes.putAll(prepareSchoolCodesNovaZagora());
        // Novi Iskar - part of Sofia
        schoolCodes.putAll(prepareSchoolCodesObzor());
        schoolCodes.putAll(prepareSchoolCodesPanagiurishte());
        schoolCodes.putAll(prepareSchoolCodesPetrich());
        schoolCodes.putAll(prepareSchoolCodesPeshtera());
        schoolCodes.putAll(prepareSchoolCodesPomorie());
        schoolCodes.putAll(prepareSchoolCodesPopovo());
        schoolCodes.putAll(prepareSchoolCodesPravets());
        schoolCodes.putAll(prepareSchoolCodesRadomir());
        schoolCodes.putAll(prepareSchoolCodesRakovski());
        schoolCodes.putAll(prepareSchoolCodesSamokov());
        schoolCodes.putAll(prepareSchoolCodesSandanski());
        schoolCodes.putAll(prepareSchoolCodesSvilengrad());
        schoolCodes.putAll(prepareSchoolCodesSvishtov());
        schoolCodes.putAll(prepareSchoolCodesSvoge());
        schoolCodes.putAll(prepareSchoolCodesSevlievo());
        schoolCodes.putAll(prepareSchoolCodesTroyan());
        schoolCodes.putAll(prepareSchoolCodesHarmanli());
        schoolCodes.putAll(prepareSchoolCodesChirpan());

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSofia() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2204091", new String[] {"0", "91 НЕГ", "91 немска ЕГ"});
        schoolCodes.put("2213507", new String[] {"1", "Американски колеж", "Американски колеж"});
        schoolCodes.put("2221563", new String[] {"1", "ПЧМГ", "Първа Частна Математическа Гимназия"});
        schoolCodes.put("2216164", new String[] {"0", "164 СУ", "164 СУ Мигел де Сервантес"});
        schoolCodes.put("2216306", new String[] {"0", "СМГ", "СМГ Паисий Хилендарски"});
        schoolCodes.put("2224073", new String[] {"0", "73 СУ", "73 СУ Владислав Граматик"});
        schoolCodes.put("2216301", new String[] {"0", "1 АЕГ", "Първа английска ЕГ"});
        schoolCodes.put("2206302", new String[] {"0", "2 АЕГ", "Втора английска ЕГ"});
        schoolCodes.put("2209529", new String[] {"1", "Дорис Тенеди", "ЧЕСУ Дорис Тенеди"});
        schoolCodes.put("2213503", new String[] {"1", "Меридиан 22", "ЧПГ Меридиан 22"});
        schoolCodes.put("2222009", new String[] {"0", "9 ФЕГ", "9 Френска ЕГ Алфонс дьо Ламартин"});
        schoolCodes.put("2211304", new String[] {"0", "НПМГ", "НПМГ Акад. Любомир Чакалов"});
        schoolCodes.put("2212540", new String[] {"1", "Ерих Кестнер", "ЧНГ Ерих Кестнер"});
        schoolCodes.put("2205520", new String[] {"1", "Иван Апостолов", "ЧЕГ Проф. Иван Апостолов"});
        schoolCodes.put("2223547", new String[] {"1", "В. Златарски", "ЧЕГ Проф. д-р В. Златарски"});
        schoolCodes.put("2902702", new String[] {"0", "НГДЕК", "Национална гимназия за древни езици и култури"});
        schoolCodes.put("2222133", new String[] {"0", "133 СУ", "133 СУ Александър Сергеевич Пушкин"});
        schoolCodes.put("2204032", new String[] {"0", "32 СУ", "32 СУ Св. Климент Охридски"});
        schoolCodes.put("2203603", new String[] {"0", "Луи Брайл", "Специално училище за ученици с нарушено зрение Луи Брайл"});
        schoolCodes.put("2211035", new String[] {"0", "35 СУ", "35 СЕУ Добри Войников"});
        schoolCodes.put("2216532", new String[] {"1", "Увекинд", "ЧСУ Увекинд"});
        schoolCodes.put("2224022", new String[] {"0", "22 СУ", "22 СЕУ Георги С. Раковски"});
        schoolCodes.put("2221031", new String[] {"0", "31 СУ", "31 СУ Иван Вазов"});
        schoolCodes.put("2902701", new String[] {"0", "НУКК", "НУКК (Италиански лицей)"});
        schoolCodes.put("2202574", new String[] {"1", "Св. Георги", "ЧСУ Свети Георги"});
        schoolCodes.put("2204018", new String[] {"0", "18 СУ", "18 СУ Уилям Гладстон"});
        schoolCodes.put("2213350", new String[] {"0", "ТУЕС", "ТУЕС към Технически Университет"});
        schoolCodes.put("2204549", new String[] {"1", "Веда", "ЧСУ с немски език Веда"});
        schoolCodes.put("2213600", new String[] {"1", "Абрахам Линкълн", "ЧСУ с чуждоезиков профил Абрахам Линкълн"});
        schoolCodes.put("2204134", new String[] {"0", "134 СУ", "134 СУ Димчо Дебелянов"});
        schoolCodes.put("2211420", new String[] {"0", "Финансово-стопанска", "Финансово-стопанска гимназия"});
        schoolCodes.put("2221157", new String[] {"0", "157 СУ", "157 СУ Сесар Вайехо"});
        schoolCodes.put("2224433", new String[] {"0", "Търговско-банкова", "Търговско-банкова гимназия"});
        schoolCodes.put("2222127", new String[] {"0", "127 СУ", "127 СУ Иван Николаевич Денкоглу"});
        schoolCodes.put("2204030", new String[] {"0", "30 СУ", "30 СУ Братя Миладинови"});
        schoolCodes.put("2202536", new String[] {"1", "Британика", "ЧСЕУ Британика"});
        schoolCodes.put("2222007", new String[] {"0", "7 СУ", "7 СУ Св. Седмочисленици"});
        schoolCodes.put("2211419", new String[] {"0", "Гимназия по строит., арх. и геод.", "Гимназия по строителство, архитектура и геодезия"});
        schoolCodes.put("2209051", new String[] {"0", "51 СУ", "51 СУ Елисавета Багряна"});
        schoolCodes.put("2201515", new String[] {"1", "Цар Симеон Велики", "ЧСУ Цар Симеон Велики"});
        schoolCodes.put("2216533", new String[] {"1", "ПЧАГ", "Първа частна английска гимназия"});
        schoolCodes.put("2902101", new String[] {"0", "НМУ", "Национално музикално училище"});
        schoolCodes.put("2203720", new String[] {"1", "Дружба", "ЧСУ Дружба"});
        schoolCodes.put("2204311", new String[] {"0", "Румънска гимназия", "Румънска гимназия Михай Еминеску"});
        schoolCodes.put("2205119", new String[] {"0", "119 СУ", "119 СУ Акад. Михаил Арнаудов"});
        schoolCodes.put("2211517", new String[] {"1", "Банкер", "ЧПГ Банкер"});
        schoolCodes.put("2902501", new String[] {"0", "Гимназия за приложни изкуства", "Гимназия за приложни изкуства Св. Лука"});
        schoolCodes.put("2212303", new String[] {"0", "33 ЕГ", "33 ЕГ Света София"});
        schoolCodes.put("2209019", new String[] {"0", "19 СУ", "19 СУ Елин Пелин"});
        schoolCodes.put("2205407", new String[] {"0", "ПГ по електроника", "ПГ по електроника Джон Атанасов"});
        schoolCodes.put("2202002", new String[] {"0", "2 СУ", "2 СУ Акад. Емилиян Станев"});
        schoolCodes.put("2222012", new String[] {"0", "12 СУ", "12 СУ Цар Иван Асен II"});
        schoolCodes.put("2211021", new String[] {"0", "21 СУ", "21 СУ Христо Ботев"});
        schoolCodes.put("2221590", new String[] {"1", "Обр. технологии", "ЧПГ Образователни технологии"});
        schoolCodes.put("2902401", new String[] {"0", "У-ще за изящни изкуства", "Училище за изящни изкуства"});
        schoolCodes.put("2216001", new String[] {"0", "1 СУ", "1 СУ Пенчо Славейков"});
        schoolCodes.put("2204402", new String[] {"0", "ПГ по прец. техн. и опт.", "ПГ по прецизна техника и оптика"});
        schoolCodes.put("2221138", new String[] {"0", "138 СУ", "138 СУ Проф. Васил Златарски"});
        schoolCodes.put("2214054", new String[] {"0", "54 СУ", "54 СУ Св. Иван Рилски"});
        schoolCodes.put("2212056", new String[] {"0", "56 СУ", "56 СУ Проф. Константин Иречек"});
        schoolCodes.put("2223431", new String[] {"0", "ПГ по телекомуникации", "ПГ по телекомуникации"});
        schoolCodes.put("2216423", new String[] {"0", "ПГ по туризъм", "Софийска ПГ по туризъм"});
        schoolCodes.put("2212096", new String[] {"0", "96 СУ", "96 СУ Лев Николаевич Толстой"});
        schoolCodes.put("2212137", new String[] {"0", "137 СУ", "137 СУ Ангел Кънчев"});
        schoolCodes.put("2204511", new String[] {"1", "Езиков свят", "ЧПГ с чуждоезиково обучение Езиков свят"});
        schoolCodes.put("2202535", new String[] {"1", "Рьорих", "ЧСУ Рьорих"});
        schoolCodes.put("2217088", new String[] {"0", "88 СУ", "88 СУ Димитър Попниколов"});
        schoolCodes.put("2219044", new String[] {"0", "44 СУ", "44 СУ Неофит Бозвели"});
        schoolCodes.put("2902301", new String[] {"0", "У-ще за танцово изкуство", "Училище за танцово изкуство"});
        schoolCodes.put("2221023", new String[] {"0", "23 СУ", "23 СУ Фредерик Жолио-Кюри"});
        schoolCodes.put("2205105", new String[] {"0", "105 СУ", "105 СУ Атанас Далчев"});
        schoolCodes.put("2217424", new String[] {"0", "ПГ по електрот. и авт.", "ПГ по електротехника и автоматика"});
        schoolCodes.put("2213081", new String[] {"0", "81 СУ", "81 СУ Виктор Юго"});
        schoolCodes.put("2202401", new String[] {"0", "ПГ по екол. и биот.", "ПГ по екология и биотехнологии"});
        schoolCodes.put("2208526", new String[] {"1", "Орфей", "ЧСУ Орфей"});
        schoolCodes.put("2224432", new String[] {"0", "ПГ по дизайн", "ПГ по дизайн Елисавета Вазова"});
        schoolCodes.put("2209305", new String[] {"0", "203 ЕГ", "203 Профилирана ЕГ Свети Методий"});
        schoolCodes.put("2209036", new String[] {"0", "36 СУ", "36 СУ Максим Горки"});
        schoolCodes.put("2224545", new String[] {"1", "Банково дело", "ЧПГ по банково дело търговия и финанси"});
        schoolCodes.put("2213118", new String[] {"0", "118 СУ", "118 СУ Акад. Людмил Стоянов"});
        schoolCodes.put("2213144", new String[] {"0", "144 СУ", "144 СУ Народни будители"});
        schoolCodes.put("2220308", new String[] {"0", "ПГ за изобр. изкуства", "ПГ за изобразителни изкуства"});
        schoolCodes.put("2902601", new String[] {"0", "ПГ по полигр. и фотогр.", "ПГ по полиграфия и фотография"});
        schoolCodes.put("2214101", new String[] {"0", "101 СУ", "101 СУ Бачо Киро"});
        schoolCodes.put("2208135", new String[] {"0", "135 СУ", "135 СУ Ян Амос Коменски"});
        schoolCodes.put("2202534", new String[] {"1", "Св. Наум", "ЧПСУ Свети Наум"});
        schoolCodes.put("2213128", new String[] {"0", "128 СУ", "128 СУ Алберт Айнщайн"});
        schoolCodes.put("2213039", new String[] {"0", "39 СУ", "39 СУ Петър Динеков"});
        schoolCodes.put("2202026", new String[] {"0", "26 СУ", "26 СУ Йордан Йовков"});
        schoolCodes.put("2217151", new String[] {"0", "Национално СУ", "Национално СУ София"});
        schoolCodes.put("2211557", new String[] {"0", "Духовна семинария", "Софийска духовна семинария"});
        schoolCodes.put("2211417", new String[] {"0", "ПГ по облекло", "ПГ по облекло"});
        schoolCodes.put("2219095", new String[] {"0", "95 СУ", "95 СУ Проф. Иван Шишманов"});
        schoolCodes.put("2212097", new String[] {"0", "97 СУ", "97 СУ Братя Миладинови"});
        schoolCodes.put("2209132", new String[] {"0", "132 СУ", "132 СУ Ваня Войнова"});
        schoolCodes.put("2212079", new String[] {"0", "79 СУ", "79 СУ Индира Ганди"});
        schoolCodes.put("2207108", new String[] {"0", "108 СУ", "108 СУ Никола Беловеждов"});
        schoolCodes.put("2213131", new String[] {"0", "131 СУ", "131 СУ Климент Аркад. Тимирязев"});
        schoolCodes.put("2206410", new String[] {"0", "ПГ по аудио, видео и телек.", "ПГ по аудио, видое и телекомуникация"});
        schoolCodes.put("2213307", new String[] {"0", "Сп. у-ще ген. В. Стойчев", "Спортно у-ще ген. Владимир Стойчев"});
        schoolCodes.put("2207069", new String[] {"0", "69 СУ", "69 СУ Димитър Маринов"});
        schoolCodes.put("2220014", new String[] {"0", "14 СУ", "14 СУ Проф. Д-р Асен Златаров"});
        schoolCodes.put("2204310", new String[] {"0", "5 СУ", "5 вечерно СУ Пеньо Пенев"});
        schoolCodes.put("2203074", new String[] {"0", "74 СУ", "74 СУ Гоце Делчев"});
        schoolCodes.put("2206409", new String[] {"0", "ПГ по трансп. и енерг.", "ПГ по транспорт и енергетика"});
        schoolCodes.put("2208028", new String[] {"0", "28 СУ", "28 СУ Алеко Константинов"});
        schoolCodes.put("2212040", new String[] {"0", "40 СУ", "40 СУ Луи Пастьор"});
        schoolCodes.put("2212090", new String[] {"0", "90 СУ", "90 СУ Ген. Хосе де Сан Мартин"});
        schoolCodes.put("2213010", new String[] {"0", "10 СУ", "10 СУ Теодор Траянов"});
        schoolCodes.put("2216309", new String[] {"0", "Сменно-вечерна гимназия", "IV сменно-вечерна гимназия"});
        schoolCodes.put("2219166", new String[] {"0", "Сп. у-ще В. Левски", "166 спортно у-ще Васил Левски"});
        schoolCodes.put("2224121", new String[] {"0", "121 СУ", "121 СУ Георги Измирлиев"});
        schoolCodes.put("2202612", new String[] {"0", "У-ще за ученици с увр. слух", "Специално училище за ученици с увреден слух"});
        schoolCodes.put("2203140", new String[] {"0", "140 СУ", "140 СУ Иван Богоров"});
        schoolCodes.put("2204403", new String[] {"0", "ПГ по текстил", "ПГ по текстилни и кожени изделия"});
        schoolCodes.put("2204405", new String[] {"0", "ПГ по под/стр/тр. техн.", "ПГ по подемна, строителна и транспортна техника"});
        schoolCodes.put("2205408", new String[] {"0", "ПГ Княгиня Евдокия", "Софийска ПГ Княгиня Евдокия"});
        schoolCodes.put("2206003", new String[] {"0", "3 СУ", "3 СУ Марин Дринов"});
        schoolCodes.put("2206113", new String[] {"0", "113 СУ", "113 СУ Сава Филаретов"});
        schoolCodes.put("2206411", new String[] {"0", "ПГ по хран.-вк. техн.", "ПГ по хранително-вкусови технологии"});
        schoolCodes.put("2207068", new String[] {"0", "68 СУ", "68 СУ Акад. Никола Обрешков"});
        schoolCodes.put("2207412", new String[] {"0", "ПГ по транспорт", "ПГ по транспорт"});
        schoolCodes.put("2208017", new String[] {"0", "17 СУ", "17 СУ Дамян Груев"});
        schoolCodes.put("2208057", new String[] {"0", "Сп. у-ще Св. Наум", "57 спортно училище Св. Наум Охридски"});
        schoolCodes.put("2208123", new String[] {"0", "123 СУ", "123 СУ Стефан Стамболов"});
        schoolCodes.put("2208413", new String[] {"0", "Гимн. по хлебни техн.", "Софийска гимназия по хлебни/сладкарски технологии"});
        schoolCodes.put("2208539", new String[] {"1", "Икономика, туризъм и информатика", "ЧПГ по икономика, туризъм и информатика"});
        schoolCodes.put("2210085", new String[] {"0", "85 СУ", "85 СУ Отец Паисий"});
        schoolCodes.put("2210117", new String[] {"0", "117 СУ", "117 СУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2211571", new String[] {"1", "Охрана и сигурност", "ЧПГ по охрана и сигурност"});
        schoolCodes.put("2212037", new String[] {"0", "37 СУ", "37 СУ Райна Княгиня"});
        schoolCodes.put("2213125", new String[] {"0", "125 СУИЧЕ", "125 СУИЧЕ Боян Пенев"});
        schoolCodes.put("2214015", new String[] {"0", "15 СУ", "15 СУ Адам Мицкевич"});
        schoolCodes.put("2214153", new String[] {"0", "Сп. у-ще Неофит Рилски", "153 спортно у-ще Неофит Рилски"});
        schoolCodes.put("2216422", new String[] {"0", "ПГ по механоел.", "ПГ по механоелектротехника"});
        schoolCodes.put("2217066", new String[] {"0", "66 СУ", "66 СУ Филип Станиславов"});
        schoolCodes.put("2217149", new String[] {"0", "149 СУ", "149 СУ Иван Хаджийски"});
        schoolCodes.put("2217426", new String[] {"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});
        schoolCodes.put("2218606", new String[] {"0", "СУ Св. Иван Рилски", "СУ Св. Иван Рилски"});
        schoolCodes.put("2219024", new String[] {"0", "24 СУ", "24 СУ Пейо К. Яворов"});
        schoolCodes.put("2219130", new String[] {"0", "130 СУ", "130 СУ Стефан Караджа"});
        schoolCodes.put("2220029", new String[] {"0", "29 СУ", "29 СУ Кузман Шапкарев"});
        schoolCodes.put("2220427", new String[] {"0", "ПГ по жел. трансп.", "ПГ по железопътен транспорт"});
        schoolCodes.put("2221093", new String[] {"0", "93 СУ", "93 СУ Ал. Теодоров - Балан"});
        schoolCodes.put("2221094", new String[] {"0", "94 СУ", "94 СУ Д. Страшимиров"});
        schoolCodes.put("2221430", new String[] {"0", "ПГ по трансп. Макгахан", "ПГ по транспорт Макгахан"});
        schoolCodes.put("2224047", new String[] {"0", "47 СУ", "47 СУ Христо Г. Данов"});
        schoolCodes.put("2900001", new String[] {"0", "БСУ Христо Ботев", "Българско СУ Христо Ботев"});
        schoolCodes.put("2900102", new String[] {"0", "БСУ Петър Берон", "Българско СУ Д-р Петър Берон"});
        schoolCodes.put("2200015", new String[] {"1", "Васил Златарски", "ЧОУ Проф. д-р Васил Златарски"});
        schoolCodes.put("2202005", new String[] {"0", "5 ОУ", "5 ОУ Иван Ваазов"});
        schoolCodes.put("2202050", new String[] {"0", "50 ОУ", "50 ОУ Васил Левски"});
        schoolCodes.put("2202052", new String[] {"0", "52 ОУ", "52 ОУ Цанко Церковски"});
        schoolCodes.put("2202064", new String[] {"0", "64 ОУ", "64 ОУ Цар Симеон Велики"});
        schoolCodes.put("2202537", new String[] {"1", "Св. София", "ЧОУ Света София"});
        schoolCodes.put("2202620", new String[] {"1", "Николай Райнов", "ЧСУ Проф. Николай Райнов"});
        schoolCodes.put("2202704", new String[] {"1", "Евл. и Хр. Георгиеви", "ЧСУ Евлоги и Христо Георгиеви"});
        schoolCodes.put("2203061", new String[] {"0", "61 ОУ", "61 ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2203062", new String[] {"0", "62 ОУ", "62 ОУ Христо Ботев"});
        schoolCodes.put("2203070", new String[] {"0", "70 ОУ", "70 ОУ Св. Климент Охридски"});
        schoolCodes.put("2204046", new String[] {"0", "46 ОУ", "46 ОУ К. Фотинов"});
        schoolCodes.put("2204067", new String[] {"0", "67 ОУ", "67 ОУ Васил Друмев"});
        schoolCodes.put("2204076", new String[] {"0", "76 ОУ", "76 ОУ Уилям Сароян"});
        schoolCodes.put("2204136", new String[] {"0", "136 ОУ", "136 ОУ Любен Каравелов"});
        schoolCodes.put("2204595", new String[] {"1", "Светлина", "ЧОУ Светлина"});
        schoolCodes.put("2204674", new String[] {"1", "Езиков свят", "ЧОУ Езиков свят"});
        schoolCodes.put("2205011", new String[] {"0", "11 ОУ", "11 ОУ Св. Пимен Зографски"});
        schoolCodes.put("2205521", new String[] {"1", "Св. Климент Охридски", "ЧОУ Св. Климент Охридски"});
        schoolCodes.put("2206043", new String[] {"0", "43 ОУ", "43 ОУ Христо Смирненски"});
        schoolCodes.put("2206045", new String[] {"0", "45 ОУ", "45 ОУ Константин Величков"});
        schoolCodes.put("2207004", new String[] {"0", "4 ОУ", "4 ОУ Проф. Джон Атанасов"});
        schoolCodes.put("2207089", new String[] {"0", "89 ОУ", "89 ОУ д-р Христо Стамболски"});
        schoolCodes.put("2207150", new String[] {"0", "150 ОУ", "150 ОУ Цар Симеон I"});
        schoolCodes.put("2207163", new String[] {"0", "163 ОУ", "163 ОУ Черноризец Храбър"});
        schoolCodes.put("2208075", new String[] {"0", "75 ОУ", "75 ОУ Тодор Каблешков"});
        schoolCodes.put("2208092", new String[] {"0", "92 ОУ", "92 ОУ Димитър Талев"});
        schoolCodes.put("2208147", new String[] {"0", "147 ОУ", "147 ОУ Йордан Радичков"});
        schoolCodes.put("2209025", new String[] {"0", "25 ОУ", "25 ОУ Петър Берон"});
        schoolCodes.put("2209034", new String[] {"0", "34 ОУ", "34 ОУ Стою Шишков"});
        schoolCodes.put("2209142", new String[] {"0", "142 ОУ", "142 ОУ Веселин Ханчев"});
        schoolCodes.put("2210156", new String[] {"0", "156 ОбУ", "156 ОбУ Васил Левски"});
        schoolCodes.put("2210159", new String[] {"0", "159 ОУ", "159 ОУ Васил Левски"});
        schoolCodes.put("2210162", new String[] {"0", "162 ОбУ", "162 ОбУ Отец Паисий"});
        schoolCodes.put("2211107", new String[] {"0", "107 ОУ", "107 ОУ Хан Крум"});
        schoolCodes.put("2211120", new String[] {"0", "120 ОУ", "120 ОУ Г. С. Раковски"});
        schoolCodes.put("2211122", new String[] {"0", "122 ОУ", "122 ОУ Н. Лилиев"});
        schoolCodes.put("2211139", new String[] {"0", "139 ОУ", "139 ОУ Захарий Круша"});
        schoolCodes.put("2211518", new String[] {"1", "Петър Берон", "ЧОУ Д-р Петър Берон"});
        schoolCodes.put("2211519", new String[] {"1", "Банкерче", "ЧОУ Банкерче"});
        schoolCodes.put("2211564", new String[] {"1", "Българско Школо", "ЧСОУ Българско Школо"});
        schoolCodes.put("2211598", new String[] {"1", "Г. С. Уланова", "ЧСЕУ Г. С. Уланова"});
        schoolCodes.put("2212027", new String[] {"0", "27 СУ", "27 СУ Акад. Георги Караславов "});
        schoolCodes.put("2212033", new String[] {"0", "33 ОУ", "33 ОУ Санкт Петербург"});
        schoolCodes.put("2212077", new String[] {"0", "77 ОУ", "77 ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2212103", new String[] {"0", "103 ОУ", "103 ОУ Васил Левски"});
        schoolCodes.put("2212553", new String[] {"1", "П. Р. Славейков", "ЧСУ П. Р. Славейков"});
        schoolCodes.put("2212554", new String[] {"1", "Ерих Кестнер", "ЧОУ Ерих Кестнер"});
        schoolCodes.put("2213082", new String[] {"0", "82 ОУ", "82 ОУ Васил Априлов"});
        schoolCodes.put("2213145", new String[] {"0", "145 ОУ", "145 ОУ Симеон Радев"});
        schoolCodes.put("2213502", new String[] {"1", "Меридиан 22", "ЧОУ Меридиан 22"});
        schoolCodes.put("2213506", new String[] {"1", "ЕСПА", "ЧСУ с РЧЕО ЕСПА"});
        schoolCodes.put("2213721", new String[] {"1", "Азбуки", "ЧОУ Азбуки"});
        schoolCodes.put("2214016", new String[] {"0", "16 ОУ", "16 ОУ Р. Жинзифов"});
        schoolCodes.put("2214063", new String[] {"0", "63 ОУ", "63 ОУ Христо Ботев"});
        schoolCodes.put("2214102", new String[] {"0", "102 ОУ", "102 ОУ Панайот Волов"});
        schoolCodes.put("2214141", new String[] {"0", "141 ОУ", "141 ОУ Народни будители"});
        schoolCodes.put("2216112", new String[] {"0", "112 ОУ", "112 ОУ Стоян Заимов"});
        schoolCodes.put("2216129", new String[] {"0", "129 ОУ", "129 ОУ Антим I"});
        schoolCodes.put("2217053", new String[] {"0", "53 ОУ", "53 ОУ Николай Хрелков"});
        schoolCodes.put("2217072", new String[] {"0", "72 ОУ", "72 ОУ Христо Ботев"});
        schoolCodes.put("2217525", new String[] {"1", "Мария Монтесори", "ЧОУ Д-р Мария Монтесори"});
        schoolCodes.put("2217575", new String[] {"1", "Евростар", "ЧСУ Евростар"});
        schoolCodes.put("2217722", new String[] {"1", "Томас Едисън", "ЧОУ Томас Едисън"});
        schoolCodes.put("2218083", new String[] {"0", "83 ОУ", "83 ОУ Елин Пелин"});
        schoolCodes.put("2218084", new String[] {"0", "84 ОУ", "84 ОУ Васил Левски"});
        schoolCodes.put("2218703", new String[] {"1", "Изгрев", "ЧОУ Изгрев"});
        schoolCodes.put("2219042", new String[] {"0", "42 ОУ", "42 ОУ Хаджи Димитър"});
        schoolCodes.put("2219049", new String[] {"0", "49 ОУ", "49 ОУ Бенито Хуарес"});
        schoolCodes.put("2219106", new String[] {"0", "106 ОУ", "106 ОУ Григорий Цамблак"});
        schoolCodes.put("2219124", new String[] {"0", "124 ОУ", "124 ОУ Васил Левски"});
        schoolCodes.put("2219143", new String[] {"0", "143 ОУ", "143 ОУ Г. Бенковски"});
        schoolCodes.put("2219199", new String[] {"0", "199 ОУ", "199 ОУ Св. Ап. Йоан Богослов"});
        schoolCodes.put("2220048", new String[] {"0", "48 ОУ", "48 ОУ Й. Ковачев"});
        schoolCodes.put("2220058", new String[] {"0", "58 ОУ", "58 ОУ Сергей Румянцев"});
        schoolCodes.put("2220059", new String[] {"0", "59 ОбУ", "59 ОбУ Васил Левски"});
        schoolCodes.put("2220060", new String[] {"0", "60 ОУ", "60 ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2220100", new String[] {"0", "100 ОУ", "100 ОУ Найден Геров"});
        schoolCodes.put("2221109", new String[] {"0", "109 ОУ", "109 ОУ Христо Смирненски"});
        schoolCodes.put("2221148", new String[] {"0", "148 ОУ", "148 ОУ Прф. Д-р Л. Милетич"});
        schoolCodes.put("2221501", new String[] {"1", "Образов. Технологии", "ЧОУ Образователни Технологии"});
        schoolCodes.put("2221614", new String[] {"1", "Джани Родари", "ЧОУ Джани Родари"});
        schoolCodes.put("2222006", new String[] {"0", "6 ОУ", "6 ОУ Граф Игнатиев"});
        schoolCodes.put("2222038", new String[] {"0", "38 ОУ", "38 ОУ Васил Априлов"});
        schoolCodes.put("2223008", new String[] {"0", "8 СУ", "8 СУ Васил Левски"});
        schoolCodes.put("2223055", new String[] {"0", "55 СУ", "55 СУ Петко Каравелов"});
        schoolCodes.put("2224020", new String[] {"0", "20 ОУ", "20 ОУ Тодор Минков"});
        schoolCodes.put("2224041", new String[] {"0", "41 ОУ", "41 ОУ Св. Патриарх Евтимий"});
        schoolCodes.put("2224104", new String[] {"0", "104 ОУ", "104 ОУ Захари Стоянов"});
        schoolCodes.put("2224126", new String[] {"0", "126 ОУ", "126 ОУ Петко Тодоров"});
        schoolCodes.put("2224544", new String[] {"1", "Артис", "ЧСУ Артис"});
        schoolCodes.put("2224672", new String[] {"1", "Куест", "ЧОУ Куест"});
        schoolCodes.put("2224677", new String[] {"1", "Прогресивно обр. 1", "ОПУ Прогресивно обр. 1"});
        schoolCodes.put("2200037", new String[] {"1", "Прогресивно обр. 3", "ОПУ Прогресивно обр. 3"});
        schoolCodes.put("2204676", new String[] {"1", "Кралица София Исп.", "ЧСУ Кралица София Испанска"});
        schoolCodes.put("2200021", new String[] {"1", "Роналд Лаудер", "ЧОУ Роналд Лаудер"});
        schoolCodes.put("2200023", new String[] {"1", "Константин-Кирил", "ЧСУ Константин-Кирил Философ"});
        schoolCodes.put("2200024", new String[] {"1", "Наука за деца", "ЧНУ Наука за деца"});
        schoolCodes.put("2202705", new String[] {"1", "Откривател", "ЧОУ Откривател"});
        schoolCodes.put("2214098", new String[] {"0", "98 НУ", "98 НУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2221621", new String[] {"1", "Питагор", "ЧНУ Питагор"});
        schoolCodes.put("2201078", new String[] {"0", "78 СУ", "78 СУ Христо Смирненски"});
        schoolCodes.put("2201505", new String[] {"1", "Фоти", "ЧНУ Фоти"});
        schoolCodes.put("2202086", new String[] {"0", "86 ОУ", "86 ОУ Св. Климент Охридски"});
        schoolCodes.put("2202152", new String[] {"0", "152 ОУ", "152 ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2203146", new String[] {"0", "146 ОУ", "146 ОУ Патриарх Евтимий"});
        schoolCodes.put("2203175", new String[] {"0", "175 ОУ", "175 ОУ Васил Левски"});
        schoolCodes.put("2207065", new String[] {"0", "65 ОУ", "65 ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2210115", new String[] {"0", "115 ОУ", "115 ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2210116", new String[] {"0", "116 ОУ", "116 ОУ Паисий Хилендарски"});
        schoolCodes.put("2215160", new String[] {"0", "160 ОУ", "160 ОУ Кирил и Методий"});
        schoolCodes.put("2215170", new String[] {"0", "170 СУ", "170 СУ Васил Левски"});
        schoolCodes.put("2215171", new String[] {"0", "171 ОУ", "171 ОУ Стоил Попов"});
        schoolCodes.put("2215172", new String[] {"0", "172 ОбУ", "172 ОбУ Христо Ботев"});
        schoolCodes.put("2215176", new String[] {"0", "176 ОбУ", "176 ОбУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2215177", new String[] {"0", "177 ОУ", "177 ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2215179", new String[] {"0", "179 ОУ", "179 ОУ Васил Левски"});
        schoolCodes.put("2218071", new String[] {"0", "71 СУ", "71 СУ Пейо Яворов"});
        schoolCodes.put("2218191", new String[] {"0", "191 ОУ", "191 ОУ Отец Паисий"});
        schoolCodes.put("2218192", new String[] {"0", "192 СУ", "192 СУ Христо Ботев"});
        schoolCodes.put("2218200", new String[] {"0", "200 ОУ", "200 ОУ Отец Паисий"});
        schoolCodes.put("2218201", new String[] {"0", "201 ОУ", "201 ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2218202", new String[] {"0", "202 ОУ", "202 ОУ Христо Ботев"});
        schoolCodes.put("2201400", new String[] {"0", "ПГТ - Банкя", "ПГ по туризъм А. Константинов"});
        schoolCodes.put("2200039", new String[] {"1", "Прир. науки и предпр.", "ЧГ по прир. науки и предпр. Асен Йорданов"});
        schoolCodes.put("2200013", new String[] {"1", "СофтУни Светлина", "ЧПГ по дигитални науки СофтУни Светлина"});
        schoolCodes.put("2200014", new String[] {"1", "Светилник", "ЧНУ Светилник"});
        schoolCodes.put("2200022", new String[] {"1", "Милеа", "ЧНУ Милеа"});
        schoolCodes.put("2200031", new String[] {"1", "Канадско Мече", "ЧНУ Канадско Мече"});
        schoolCodes.put("2200045", new String[] {"1", "Фюжън", "ЧОУ Фюжън"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPlovdiv() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1690150", new String[]{"0", SU_LIUBEN_KARAVELOV_SHORT, SU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("1690153", new String[]{"0", "Хуманитарна гимназия", "Хуманитарна гимназия Св. Св. Кирил и Методий"});
        schoolCodes.put("1690154", new String[]{"0", "СУ Св. П. Хилендарски", "СУ Св. П. Хилендарски"});
        schoolCodes.put("1690155", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("1690156", new String[]{"0", "СУ Св. Патриарх Евтимий", "СУ Св. Патриарх Евтимий"});
        schoolCodes.put("1690157", new String[]{"0", "СУ Цар Симеон Велики", "СУ Цар Симеон Велики"});
        schoolCodes.put("1690174", new String[]{"0", "ПГ по електрот. и електрон.", "ПГ по електротехника и електроника"});
        schoolCodes.put("1690175", new String[]{"0", "Търговска гимназия", "Търговска гимназия - Пловдив"});
        schoolCodes.put("1690176", new String[]{"0", "ПГ по облекло", "ПГ по облекло Ана Май"});
        schoolCodes.put("1690177", new String[]{"0", "ПГ по вътр. арх. и дърв.", "ПГ по вътрешна архитектура и дървообработване"});
        schoolCodes.put("1690178", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Проф д-р Асен Златаров"});
        schoolCodes.put("1690179", new String[]{"0", "ПГ по битова техника", "ПГ по битова техника"});
        schoolCodes.put("1690187", new String[]{"0", "Духовна семинария", "Пловдивска духовна семинария"});
        schoolCodes.put("1690247", new String[]{"0", "СУ Найден Геров", "СУ Найден Геров"});
        schoolCodes.put("1690271", new String[]{"0", "У-ще за ученици с увр. слух", "Специално училище за ученици с увреден слух"});
        schoolCodes.put("1690272", new String[]{"0", "ПГ по арх., строит. и геод.", "ПГ по архитектура строителство и геодезия"});
        schoolCodes.put("1690273", new String[]{"0", "ПГ по трансп. и стр. техн.", "ПГ по транспорт и строителни технологии"});
        schoolCodes.put("1690274", new String[]{"0", "ПГ по строит. техн.", "ПГ по строителни технологии Пеньо Пенев"});
        schoolCodes.put("1690345", new String[]{"0", SU_KIRIL_I_METODII_SHORT, SU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1690346", new String[]{"0", "МГ Акад. Кирил Попов", "МГ Акад. Кирил Попов"});
        schoolCodes.put("1690347", new String[]{"0", "Сп. у-ще Васил Левски", "Спортно училище Васил Левски"});
        schoolCodes.put("1690446", new String[]{"0", "СУ Никола Вапцаров", "СУ Никола Вапцаров"});
        schoolCodes.put("1690447", new String[]{"0", SU_PEIO_YAVOROV_SHORT, SU_PEIO_YAVOROV_LONG});
        schoolCodes.put("1690448", new String[]{"0", "СУ Христо Г. Данов", "СУ Христо Груев Данов"});
        schoolCodes.put("1690449", new String[]{"0", "ЕГ Пловдив", "ЕГ Пловдив"});
        schoolCodes.put("1690450", new String[]{"0", "ЕГ Иван Вазов", "ЕГ Иван Вазов"});
        schoolCodes.put("1690451", new String[]{"0", "Френска ЕГ", "Френска ЕГ Антоан дьо Сент - Екзюпери"});
        schoolCodes.put("1690472", new String[]{"0", "ПГ по хр. техн. и техника", "ПГ по хранителни технологии и техника"});
        schoolCodes.put("1690473", new String[]{"0", "ПГ по кожени изедлия", "ПГ по кожени изделия и текстил Д-р Иван Богоров"});
        schoolCodes.put("1690542", new String[]{"0", "СУ Братя Миладинови", "СУ Братя Миладинови"});
        schoolCodes.put("1690549", new String[]{"0", "СУ К. Величков", "СУ Константин Величков"});
        schoolCodes.put("1690550", new String[]{"0", "СУ Св. К. Кирил Философ", "СУ Св. К. Кирил Философ"});
        schoolCodes.put("1690572", new String[]{"0", "ПГ по механотехника", "ПГ по механотехника"});
        schoolCodes.put("1690573", new String[]{"0", "ПГ по машиностроене", "ПГ по машиностроене"});
        schoolCodes.put("1690642", new String[]{"0", "СУ Димитър Матевски", "СУ Димитър Матевски"});
        schoolCodes.put("1690643", new String[]{"0", "СУ Св. Седмочисленици", "СУ Св. Седмочисленици"});
        schoolCodes.put("1690644", new String[]{"0", "СУ Св. Софроний Врачански", "СУ Св. Софроний Врачански"});
        schoolCodes.put("1690645", new String[]{"0", "СУ Черноризец Храбър", "СУ Черноризец Храбър"});
        schoolCodes.put("1690901", new String[]{"1", "Дружба", "ЧСУ Дружба"});
        schoolCodes.put("1690904", new String[]{"1", "Класик", "ЧПГ Класик"});
        schoolCodes.put("1690906", new String[]{"1", "Едмънд Бърк", "ЧПГ Едмънд Бърк"});
        schoolCodes.put("1690909", new String[]{"1", "Стоян Сариев", "ЧЕГ Стоян Сариев"});
        schoolCodes.put("1690910", new String[]{"1", "Икономика и управление", "ЧПГ по икономика и управление"});
        schoolCodes.put("2902102", new String[]{"0", "НУМТИ", "НУМТИ Добрин Петков"});
        schoolCodes.put("2902302", new String[]{"0", "Сценични и екранни изкуства", "Гимназия за сценични и екранни изкуства"});
        schoolCodes.put("2902402", new String[]{"0", "Художествена гимназия", "Художествена гимназия Цанко Лавренов"});
        schoolCodes.put("1690142", new String[]{"0", OU_ALEKO_KONSTANTINOV_SHORT, OU_ALEKO_KONSTANTINOV_LONG});
        schoolCodes.put("1690143", new String[]{"0", "ОУ Тютюнджян", "ОУ Тютюнджян"});
        schoolCodes.put("1690144", new String[]{"0", "ОУ Гео Милев", "ОУ Гео Милев"});
        schoolCodes.put("1690146", new String[]{"0", "ОУ Петър Берон", "ОУ Д-р Петър Берон"});
        schoolCodes.put("1690147", new String[]{"0", "ОУ Д. Хаджидеков", "ОУ Душо Хаджидеков"});
        schoolCodes.put("1690148", new String[]{"0", "ОУ Екзарх Антим I", "ОУ Екзарх Антим I"});
        schoolCodes.put("1690149", new String[]{"0", "ОУ К. Честеменски", "ОУ Кочо Честеменски"});
        schoolCodes.put("1690152", new String[]{"0", "ОУ Кн. Александър I", "ОУ Княз Александър I"});
        schoolCodes.put("1690244", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("1690245", new String[]{"0", "ОУ Д. Дебелянов", "ОУ Димчо Дебелянов"});
        schoolCodes.put("1690246", new String[]{"0", "ОбУ П. Славейков", "ОбУ Пенчо Славейков"});
        schoolCodes.put("1690248", new String[]{"0", "СУ Симон Боливар", "СУ Симон Боливар"});
        schoolCodes.put("1690341", new String[]{"0", "ОУ В. Петлешков", "ОУ Васил Петлешков"});
        schoolCodes.put("1690342", new String[]{"0", "ОУ Драган Манчов", "ОУ Драган Манчов"});
        schoolCodes.put("1690343", new String[]{"0", "ОУ Елин Пелин", "ОУ Елин Пелин"});
        schoolCodes.put("1690344", new String[]{"0", "ОУ Т. Каблешков", "ОУ Т. Каблешков"});
        schoolCodes.put("1690442", new String[]{"0", "ОУ Димитър Димов", "ОУ Димитър Димов"});
        schoolCodes.put("1690443", new String[]{"0", "ОбУ Й. Йовков", "ОбУ Йордан Йовков"});
        schoolCodes.put("1690444", new String[]{"0", "ОУ П. Волов", "ОУ Панайот Волов"});
        schoolCodes.put("1690445", new String[]{"0", "ОУ Р. Княгиня", "ОУ Райна Княгиня"});
        schoolCodes.put("1690544", new String[]{"0", "ОУ Д. Талев", "ОУ Димитър Талев"});
        schoolCodes.put("1690545", new String[]{"0", "ОУ З. Стоянов", "ОУ Захари Стоянов"});
        schoolCodes.put("1690546", new String[]{"0", "ОУ С. Михайловски", "ОУ Стоян Михайловски"});
        schoolCodes.put("1690547", new String[]{"0", "ОУ Яне Сандански", "ОУ Яне Сандански"});
        schoolCodes.put("1690907", new String[]{"1", "Класик", "ЧОУ Класик"});
        schoolCodes.put("1690912", new String[]{"1", "Бъдеще", "ЧОУ Бъдеще"});
        schoolCodes.put("1690242", new String[] {"0", "НУ Кирил Нектариев", "39 НУ Кирил Нектариев"});
        schoolCodes.put("1690243", new String[] {"0", "НУ П. Славейков", "НУ Петко Р. Славейков"});
        schoolCodes.put("1690441", new String[] {"0", NU_HRISTO_BOTEV, NU_HRISTO_BOTEV});
        schoolCodes.put("1690543", new String[] {"0", NU_KLIMENT_OHRIDSKI_SHORT, NU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("1600026", new String[] {"1", "Информ. и комп. науки", "ЧПГ по информатика и комп. науки"});
        schoolCodes.put("1600017", new String[] {"1", "Талантите", "ЧСБУ Талантите"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVarna() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2902106", new String[]{"0", "НУИ Добри Христов", "НУИ Добри Христов"});
        schoolCodes.put("400030", new String[]{"0", "7 СУ", "7 СУ Найден Геров"});
        schoolCodes.put("400031", new String[]{"0", "СУ Ал. С. Пушкин", "СУ Ал. С. Пушкин"});
        schoolCodes.put("400033", new String[]{"0", "Сп. у-ще Г. Бенковски", "Спортно у-ще Г. Бенковски"});
        schoolCodes.put("400034", new String[]{"0", "СУ Гео Милев", "СУ Гео Милев"});
        schoolCodes.put("400036", new String[]{"0", "СУ Елин Пелин", "СУ Елин Пелин"});
        schoolCodes.put("400037", new String[]{"0", SU_LIUBEN_KARAVELOV_SHORT, SU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("400039", new String[]{"0", SU_PEIO_YAVOROV_SHORT, SU_PEIO_YAVOROV_LONG});
        schoolCodes.put("400040", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("400041", new String[]{"0", "3 ПМГ", "3 ПМГ Акад. Методий Попов"});
        schoolCodes.put("400042", new String[]{"0", "4 ЕГ", "4 ЕГ Фредерик Жолио - Кюри"});
        schoolCodes.put("400043", new String[]{"0", "ГПЧЕ Йоан Екзарх", "ГПЧЕ Йоан Екзарх"});
        schoolCodes.put("400044", new String[]{"0", "ПГ по икономика", "ПГ по икономика Д-р Иван Богоров"});
        schoolCodes.put("400045", new String[]{"0", "1 ЕГ", "1 ЕГ "});
        schoolCodes.put("400046", new String[]{"0", "МГ Д-р Петър Берон", "МГ Д-р Петър Берон"});
        schoolCodes.put("400047", new String[]{"0", "СУ за хуман. науки и изк.", "СУ за хуманитарни науки и изкуства"});
        schoolCodes.put("400054", new String[]{"0", "Спец. у-ще за уч. с нар. зр.", "Специално у-ще за ученици с нарушено зрение"});
        schoolCodes.put("400055", new String[]{"0", "Проф. техн. гимназия", "Професионална техническа гимназия"});
        schoolCodes.put("400058", new String[]{"0", "ПГ по хим. и хр.-вк. техн.", "ПГ по химични и хранително-вкусови технологии"});
        schoolCodes.put("400063", new String[]{"0", "ПГ по стр., арх. и геод.", "ПГ по строителство архитектура и геодезия"});
        schoolCodes.put("400070", new String[]{"1", "Търговска гимназия", "Частна Търговска Гимназия Конто Трейд"});
        schoolCodes.put("400074", new String[]{"1", "А. Екзюпери", "ЧПГ Антоан дьо Сент-Екзюпери"});
        schoolCodes.put("400076", new String[]{"1", "Джордж Байрон", "ЧЕГ Джордж Байрон"});
        schoolCodes.put("402030", new String[]{"0", "Варненска търг. гимназия", "Варненска търговска гимназия"});
        schoolCodes.put("402161", new String[]{"0", "ПГ по текстил и моден дизайн", "ПГ по текстил и моден дизайн"});
        schoolCodes.put("402172", new String[]{"0", "ПГ по горско стопанство", "ПГ по горско стопанство и дървообр."});
        schoolCodes.put("402183", new String[]{"0", "Варненска морска гимназия", "Варненска морска гимназия"});
        schoolCodes.put("403531", new String[]{"0", "ПГ по електротехника", "ПГ по електротехника"});
        schoolCodes.put("403534", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм"});
        schoolCodes.put("403537", new String[]{"0", "СУ Д. Дебелянов", "СУ Димчо Дебелянов"});
        schoolCodes.put("403538", new String[]{"0", "СУ Неофит Бозавели", "СУ Неофит Бозавели"});
        schoolCodes.put("403558", new String[]{"1", "Мечтатели", "ЧСУ Мечтатели"});
        schoolCodes.put("403564", new String[]{"1", "Мария Монтесори", "ЧСУ Мария Монтесори"});
        schoolCodes.put("400003", new String[]{"0", "ОУ А. Страшимиров", "ОУ Антон Страшимиров"});
        schoolCodes.put("400005", new String[]{"0", "ОУ Васил Априлов", "ОУ Васил Априлов"});
        schoolCodes.put("400006", new String[]{"0", "ОУ Г. С. Раковски", "ОУ Г. С. Раковски"});
        schoolCodes.put("400007", new String[]{"0", "ОУ Добри Чинтулов", "ОУ Добри Чинтулов"});
        schoolCodes.put("400008", new String[]{"0", "ОУ Захари Стоянов", "ОУ Захари Стоянов"});
        schoolCodes.put("400009", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});
        schoolCodes.put("400010", new String[]{"0", "ОУ Св. Иван Рилски", "ОУ Св. Иван Рилски"});
        schoolCodes.put("400011", new String[]{"0", "ОУ Йордан Йовков", "ОУ Йордан Йовков"});
        schoolCodes.put("400012", new String[]{"0", "ОУ К. Арабаджиев", "ОУ Константин Арабаджиев"});
        schoolCodes.put("400015", new String[]{"0", "ОУ Кап. Петко войвода", "ОУ Кап. Петко войвода"});
        schoolCodes.put("400017", new String[]{"0", "ОУ Отец Паисий", "ОУ Отец Паисий"});
        schoolCodes.put("400018", new String[]{"0", "ОУ Панайот Волов", "ОУ Панайот Волов"});
        schoolCodes.put("400019", new String[]{"0", "ОУ Патр. Евтимий", "ОУ Св. Патриарх Евтимий"});
        schoolCodes.put("400020", new String[]{"0", "ОУ П. Славейков", "ОУ Петко Славейков"});
        schoolCodes.put("400022", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("400023", new String[]{"0", "ОУ Стефан Караджа", "ОУ Стефан Караджа"});
        schoolCodes.put("400024", new String[]{"0", "ОУ С. Михайловски", "ОУ Стоян Михайловски"});
        schoolCodes.put("400026", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("400028", new String[]{"0", "ОУ Цар Симеон І", "ОУ Цар Симеон І"});
        schoolCodes.put("400029", new String[]{"0", "ОУ Черн. Храбър", "ОУ Черноризец Храбър"});
        schoolCodes.put("400032", new String[]{"0", "ОУ Васил Друмев", "ОУ Васил Друмев"});
        schoolCodes.put("400061", new String[]{"1", "Аз съм българче", "ЧСУ Аз съм българче"});
        schoolCodes.put("400075", new String[]{"1", "Малкият принц", "ЧОУ Малкият принц"});
        schoolCodes.put("403535", new String[]{"0", "ОУ Княз Борис I", "ОУ Св. Княз Борис I"});
        schoolCodes.put("403536", new String[]{"0", "3 ОУ", "3 ОУ Ангел Кънчев"});
        schoolCodes.put("403543", new String[]{"0", "2 ОУ", "2 ОУ Н. Вапцаров"});
        schoolCodes.put("400001", new String[] {"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI});
        schoolCodes.put("400120", new String[] {"1", "Монтесори Варна", "ЧОУ Монтесори Варна"});
        schoolCodes.put("400065", new String[] {"1", "Прогресивно обр. 2", "ОПУ Прогресивно обр. 2"});
        schoolCodes.put("400167", new String[] {"1", "Феникс", "ЧОУ Феникс 2020"});
        schoolCodes.put("400132", new String[] {"1", "Демокр. образов.", "ЧОУ Демократично образование"});
        schoolCodes.put("400104", new String[] {"0", "ПГ по комп. моделиране", "ПГ по комп. моделиране и комп. системи"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBurgas() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200221", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("200227", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV});
        schoolCodes.put("200228", new String[]{"0", "СУ Йордан Йовков", "СУ Йордан Йовков"});
        schoolCodes.put("200229", new String[]{"0", "СУ Еп. К. Преславски", "СУ Еп. К. Преславски"});
        schoolCodes.put("200230", new String[]{"0", "СУ Димчо Дебелянов", "СУ Димчо Дебелянов"});
        schoolCodes.put("200231", new String[]{"0", "СУ Добри Чинтулов", "СУ Добри Чинтулов"});
        schoolCodes.put("200232", new String[]{"0", "СУ Конст. Петканов", "СУ Константин Петканов"});
        schoolCodes.put("200233", new String[]{"0", "СУ Петко Росен", "СУ Петко Росен"});
        schoolCodes.put("200234", new String[]{"0", SU_KIRIL_I_METODII_SHORT, SU_KIRIL_I_METODII_LONG});
        schoolCodes.put("200235", new String[]{"0", "ПГ за романски езици", "ПГ за романски езици"});
        schoolCodes.put("200236", new String[]{"0", "Английска ЕГ", "Английска ЕГ Гео Милев"});
        schoolCodes.put("200237", new String[]{"0", "НЕГ Гьоте", "Немска езикова гимназия Гьоте"});
        schoolCodes.put("200238", new String[]{"0", "ПГ за чужди езици", "ПГ за чужди езици Васил Левски"});
        schoolCodes.put("200239", new String[]{"0", "ППМГ", "ППМГ Акад. Никола Обрешков"});
        schoolCodes.put("200240", new String[]{"0", "Спортно у-ще Ю. Гагарин", "Спортно у-ще Юрий Гагарин"});
        schoolCodes.put("200242", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм"});
        schoolCodes.put("200243", new String[]{"0", "ПГ по м. кораб. и риб.", "ПГ по морско корабоплаване и риболов"});
        schoolCodes.put("200244", new String[]{"0", "ПГ по мех. и електр.", "ПГ по механоелектротехника и електроника"});
        schoolCodes.put("200245", new String[]{"0", "ПГ по стр., арх. и геод.", "ПГ по строителство, архитектура и геодезия"});
        schoolCodes.put("200246", new String[]{"0", "Търговска гимназия", "Търговска гимназия"});
        schoolCodes.put("200247", new String[]{"0", "ПГ по хим. техн.", "ПГ по химични технологии"});
        schoolCodes.put("200248", new String[]{"0", "ПГ по ел. и ел.", "ПГ по електротехника и електроника"});
        schoolCodes.put("200249", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт"});
        schoolCodes.put("200250", new String[]{"0", "Проф. техн. гимназия", "Професионална техническа гимназия"});
        schoolCodes.put("200251", new String[]{"0", "ПГ по дървообр.", "ПГ по дървообработване"});
        schoolCodes.put("200252", new String[]{"0", "ПГ по сград. и инст.", "ПГ по сградостроителство и инсталации"});
        schoolCodes.put("200255", new String[]{"0", "Вечерно СУ", "Вечерно СУ Захари Стоянов"});
        schoolCodes.put("200258", new String[]{"1", "Британика", "ЧПГ Британика"});
        schoolCodes.put("2902103", new String[]{"0", "НУМСИ", "НУМСИ Проф. Панчо Владигеров"});
        schoolCodes.put("200205", new String[]{"0", "ОУ П. Славейков", "ОУ П. Славейков"});
        schoolCodes.put("200206", new String[]{"0", "ОУ Kняз Борис І", "ОУ Св. Kняз Борис І"});
        schoolCodes.put("200207", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("200208", new String[]{"0", "ОУ Найден Геров", "ОУ Найден Геров"});
        schoolCodes.put("200209", new String[]{"0", "ОУ А. Страшимиров", "ОУ Антон Страшимиров"});
        schoolCodes.put("200210", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("200211", new String[]{"0", "ОУ Г. Бенковски", "ОУ Георги Бенковски"});
        schoolCodes.put("200212", new String[]{"0", "ОУ П. Яворов", "ОУ П. К. Яворов"});
        schoolCodes.put("200213", new String[]{"0", "ОУ Васил Априлов", "ОУ Васил Априлов"});
        schoolCodes.put("200214", new String[]{"0", "ОУ Бр. Миладинови", "ОУ Братя Миладинови"});
        schoolCodes.put("200215", new String[]{"0", "ОУ Елин Пелин", "ОУ Елин Пелин"});
        schoolCodes.put("200216", new String[]{"0", "ОбУ Васил Левски", "ОбУ Васил Левски - Бургас"});
        schoolCodes.put("200217", new String[]{"0", "ОУ Ботев - Сарафово", "ОУ Христо Ботев - Сарафово"});
        schoolCodes.put("200218", new String[]{"0", "ОУ Ботев - Победа", "ОУ Христо Ботев - Победа"});
        schoolCodes.put("200219", new String[]{"0", "ОУ Ботев - Езерово", "ОУ Христо Ботев - Д. Езерово"});
        schoolCodes.put("200222", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});
        schoolCodes.put("200223", new String[]{"0", "ОУ Ботев - Ветрен", "ОУ Христо Ботев - Ветрен"});
        schoolCodes.put("200241", new String[]{"0", "Коджакафалията", "ОУ А. Георгиев - Коджакафалията"});
        schoolCodes.put("200259", new String[]{"1", "ПЧОУ", "Първо Частно Основно Училище"});
        schoolCodes.put("200201", new String[] {"0", "НУ М. Лъкатник", "НУ Михаил Лъкатник"});
        schoolCodes.put("200203", new String[] {"1", "Мария Монтесори", "ЧОУ Д-р Мария Монтесори"});
        schoolCodes.put("200226", new String[] {"0", "ОбУ Кл. Охридски", "Обединено училище Св. Климент Охридски"});
        schoolCodes.put("200120", new String[] {"0", "ПГ по компют. програм.", "ПГ по комп. програмиране и иновации"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBlagoevgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("100052", new String[]{"0", "ПГ Ичко Бойчев", "ПГ Ичко Бойчев"});
        schoolCodes.put("100070", new String[]{"0", "СУ К. Шапкарев", "7 СУ Кузман Шапкарев"});
        schoolCodes.put("100190", new String[]{"0", "ЕГ Акад. Л. Стоянов", "ЕГ Акад. Людмил Стоянов"});
        schoolCodes.put("100200", new String[]{"0", "ПМГ Акад. С. Корольов", "ПМГ Акад. Сергей Корольов"});
        schoolCodes.put("100280", new String[]{"0", "ПГ по икономика", "ПГ по икономика"});
        schoolCodes.put("100300", new String[]{"0", "ПГ по строителство", "ПГ по строителство, архитектура и геодезия"});
        schoolCodes.put("101250", new String[]{"0", "СУИЧЕ", "СУИЧЕ Св. Кл. Охридски"});
        schoolCodes.put("101730", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм и лека промишленост"});
        schoolCodes.put("101870", new String[]{"0", "Хуманитарна гимн.", "Национална хуманитарна гимназия"});
        schoolCodes.put("101880", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV});
        schoolCodes.put("102060", new String[]{"0", "СУ Г. Измирлиев", "5 СУ Георги Измирлиев"});
        schoolCodes.put("109174", new String[]{"1", "Димитър и Йоан", "ЧСУ Димитър и Йоан"});
        schoolCodes.put("100020", new String[]{"0", "ОУ Д. Благоев", "2 ОУ Димитър Благоев"});
        schoolCodes.put("100040", new String[]{"0", "ОУ Д. Дебелянов", "4 ОУ Димчо Дебелянов"});
        schoolCodes.put("100110", new String[]{"0", OU_HRISTO_BOTEV, "11 ОУ Христо Ботев"});
        schoolCodes.put("101290", new String[]{"0", "ОУ Д. Талев", "3 ОУ Димитър Талев"});
        schoolCodes.put("101580", new String[]{"0", "СУ А. Костенцев", "8 СУ Арсени Костенцев"});
        schoolCodes.put("101700", new String[]{"0", "ОУ Пейо Яворов", "9 ОУ Пейо Яворов"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVelikoTurnovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("300121", new String[]{"0", "Хуманитарна гимн.", "Профилирана Хуманитарна гимназия"});
        schoolCodes.put("300122", new String[]{"0", "ПМГ В. Друмев", "ПМГ Васил Друмев"});
        schoolCodes.put("300123", new String[]{"0", "ЕГ", "ЕГ. Проф. д-р Асен Златаров"});
        schoolCodes.put("300124", new String[]{"0", "СУ Е. Станев", "СУ Емилиян Станев"});
        schoolCodes.put("300125", new String[]{"0", "СУ В. Благоева", "СУ Вела Благоева"});
        schoolCodes.put("300126", new String[]{"0", "СУ В. Комаров", "СУ Владимир Комаров"});
        schoolCodes.put("300127", new String[]{"0", "СУ Г. Раковски", "СУ Георги Раковски"});
        schoolCodes.put("300128", new String[]{"0", "ПГ по строителство", "ПГ по строителство архитектура и геодезия"});
        schoolCodes.put("300129", new String[]{"0", "ПГ по икономика", "Старопрестолна ПГ по икономика"});
        schoolCodes.put("300130", new String[]{"0", "ПГ по електроника", "ПГ по електроника"});
        schoolCodes.put("300131", new String[]{"0", "ПГ по моден дизайн", "ПГ по моден дизайн"});
        schoolCodes.put("300132", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм"});
        schoolCodes.put("300141", new String[]{"1", "АК-Арукс", "ЧПГ АК-Аркус"});
        schoolCodes.put("300143", new String[]{"0", "Спортно у-ще", "Спортно училище Героги Живков"});
        schoolCodes.put("300101", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("300102", new String[]{"0", "ОУ Бачо Киро", "ОУ Бачо Киро"});
        schoolCodes.put("300103", new String[]{"0", "ОУ Св. П. Евтимий", "ОУ Св. Патриарх Евтимий"});
        schoolCodes.put("300104", new String[]{"0", "ОУ Д. Благоев", "ОУ Димитър Благоев"});
        schoolCodes.put("300105", new String[]{"0", "ОУ П. Славейков", "ОУ Петко. Р. Славейков"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVidin() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("500102", new String[]{"0", "ППМГ", "ППМГ Екзарх Антим I"});
        schoolCodes.put("500108", new String[]{"0", "ПТГ", "ПТГ Васил Левски"});
        schoolCodes.put("500110", new String[]{"0", "ПГТ", "ПГТ Михалаки Георгиев"});
        schoolCodes.put("502035", new String[]{"0", "ПГ А. Златаров", "ПГ Проф. д-р Асен Златаров"});
        schoolCodes.put("503132", new String[]{"0", "СУ Цар Симеон", "СУ Цар Симеон Велики"});
        schoolCodes.put("503241", new String[]{"0", SU_KIRIL_I_METODII_SHORT, SU_KIRIL_I_METODII_LONG});
        schoolCodes.put("503242", new String[]{"0", "СУ П. Славейков", "СУ Петко Рачов Славейков"});
        schoolCodes.put("503322", new String[]{"0", "ГПЧЕ", "ГПЧЕ Йордан Радичков"});
        schoolCodes.put("500104", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("500111", new String[]{"0", "ОУ С. Врачански", "ОУ Еп. Софроний Врачански"});
        schoolCodes.put("500112", new String[]{"0", "ОУ Отец Паисий", "ОУ Отец Паисий"});
        schoolCodes.put("500113", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("503312", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVraca() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("600061", new String[]{"0", "ЕГ", "Профилирана ЕГ Йоан Екзарх"});
        schoolCodes.put("600327", new String[]{"0", "СУ Козма Тричков", "СУ Козма Тричков"});
        schoolCodes.put("602062", new String[]{"0", "ППМГ", "ППМГ Акад. Иван Ценов"});
        schoolCodes.put("603057", new String[]{"0", "СУ Отец Паисий", "СУ Отец Паисий"});
        schoolCodes.put("603058", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("603059", new String[]{"0", "СУ Васил Кънчов", "СУ Васил Кънчов"});
        schoolCodes.put("603065", new String[]{"0", "Техническа гимназия", "Професионална техническа гимназия"});
        schoolCodes.put("603067", new String[]{"0", "ПГ по търговия", "ПГ по търговия и ресторантьорство"});
        schoolCodes.put("603070", new String[]{"0", "СУ Никола Войводов", "СУ Никола Войводов"});
        schoolCodes.put("603071", new String[]{"0", "ПГ Д. Хаджитошин", "ПГ Димитраки Хаджитошин"});
        schoolCodes.put("603140", new String[]{"0", "СУ Мито Орозов", "СУ Мито Орозов"});
        schoolCodes.put("608060", new String[]{"0", "Спортно у-ще", "Спортно у-ще Св. Климент Охридски"});
        schoolCodes.put("1203007", new String[]{"0", SU_KIRIL_I_METODII_SHORT, SU_KIRIL_I_METODII_LONG});
        schoolCodes.put("602041", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("602042", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("601031", new String[] {"0", "НУ Иванчо Младенов", "НУ Иванчо Младенов"});
        schoolCodes.put("601035", new String[] {"0", NU_IVAN_VAZOV, NU_IVAN_VAZOV});
        schoolCodes.put("601037", new String[] {"0", "НУ Софр. Врач.", "НУ Св. Софроний Врачански"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesGabrovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("700113", new String[]{"0", "СУ Отец Паисий", "СУ Отец Паисий"});
        schoolCodes.put("700114", new String[]{"0", "СУ Райчо Каролев", "СУ Райчо Каролев"});
        schoolCodes.put("700115", new String[]{"0", "Априловска гимн.", "Национална априловска гимназия"});
        schoolCodes.put("700116", new String[]{"0", "ПМГ", "ПМГ Акад. Иван Гюзелев"});
        schoolCodes.put("700118", new String[]{"0", "Техническа гимн.", "Професионална техническа гимназия"});
        schoolCodes.put("700120", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Пенчо Семов"});
        schoolCodes.put("700102", new String[]{"0", "ОУ Ран Босилек", "ОУ Ран Босилек"});
        schoolCodes.put("700103", new String[]{"0", "ОУ Неофит Рилски", "ОУ Неофит Рилски"});
        schoolCodes.put("700106", new String[]{"0", OU_IVAN_VAZOV, "6 ОУ Иван Вазов"});
        schoolCodes.put("700108", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("700112", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("700101", new String[] {"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDobrich() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("800013", new String[]{"0", "СУ Димитър Талев", "СУ Димитър Талев"});
        schoolCodes.put("800015", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("800016", new String[]{"0", SU_LIUBEN_KARAVELOV_SHORT, SU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("800017", new String[]{"0", "СУ Петко Славейков", "СУ Петко Славейков"});
        schoolCodes.put("800018", new String[]{"0", SU_KIRIL_I_METODII_SHORT, SU_KIRIL_I_METODII_LONG});
        schoolCodes.put("800019", new String[]{"0", "ПМГ Иван Вазов", "ПМГ Иван Вазов"});
        schoolCodes.put("800020", new String[]{"0", "ЕГ Гео Милев", "ЕГ Гео Милев"});
        schoolCodes.put("800023", new String[]{"0", "Финансово-стопанска", "Финансово-стопанска гимназия"});
        schoolCodes.put("800325", new String[]{"1", "Туризъм и предприемачество", "ЧПГ по туризъм и предприемачество"});
        schoolCodes.put("800326", new String[]{"1", "Леонардо да Винчи", "ЧСУ Леонардо да Винчи"});
        schoolCodes.put("800012", new String[]{"0", "Спортно у-ще", "Спортно у-ще Георги Раковски"});
        schoolCodes.put("800021", new String[]{"0", "ПГ по техника", "ПГ по техника и строителство"});
        schoolCodes.put("800022", new String[]{"0", "ПГ по вет. медицина", "ПГ по ветеринарна медицина"});
        schoolCodes.put("800026", new String[]{"0", "ПГ по агр. стоп.", "Професионална гимназия по аграрно стопанство"});
        schoolCodes.put("800028", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм П. К. Яворов"});
        schoolCodes.put("800328", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт, обслужване и лека промишленост"});
        schoolCodes.put("800003", new String[]{"0", "ОбУ Йордан Йовков", "ОбУ Йордан Йовков"});
        schoolCodes.put("800004", new String[]{"0", "ОУ Н. Вапцаров", "ОУ Никола Вапцаров"});
        schoolCodes.put("800007", new String[]{"0", "ОУ Панайот Волов", "ОУ Панайот Волов"});
        schoolCodes.put("800008", new String[]{"0", "ОУ Стефан Караджа", "ОУ Стефан Караджа"});
        schoolCodes.put("800009", new String[]{"0", "ОУ Хан Аспарух", "ОУ Хан Аспарух"});
        schoolCodes.put("800010", new String[]{"0", "ОУ Хр. Смирненски", "ОУ Христо Смирненски"});
        schoolCodes.put("800011", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("800112", new String[]{"1", "Мария Монтесори", "ЧОУ Мария Монтесори"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKurdzhali() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("909101", new String[]{"0", "СУ В. Димитров", "СУ Владимир Димитров - Майстора"});
        schoolCodes.put("909103", new String[]{"0", "СУ Йордан Йовков", "СУ Йордан Йовков"});
        schoolCodes.put("909105", new String[]{"0", "СУ Отец Паисий", "СУ Отец Паисий"});
        schoolCodes.put("909106", new String[]{"0", "СУ П. Славейков", "СУ Петко Славейков"});
        schoolCodes.put("909107", new String[]{"0", "ЕГ", "ЕГ Христо Ботев"});
        schoolCodes.put("909108", new String[]{"0", "ПГ по икономика", "ПГ по икономика"});
        schoolCodes.put("909109", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм"});
        schoolCodes.put("909110", new String[]{"0", "ПГ В. Левски", "ПГ Васил Левски"});
        schoolCodes.put("909111", new String[]{"0", "ПГ по облекло", "ПГ по облекло и дизайн"});
        schoolCodes.put("909112", new String[]{"0", "ПГ по електр.", "ПГ по електротехника и електроника"});
        schoolCodes.put("909113", new String[]{"0", "ПГ по с/г стоп.", "ПГ по селско и горско стопанство"});
        schoolCodes.put("909114", new String[]{"0", "ПГ по строит.", "ПГ по строителство"});
        schoolCodes.put("909104", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("909115", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("909116", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("909117", new String[]{"0", "ОУ Пейо Яворов", "ОУ Пейо К. Яворов"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKiustendil() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1000002", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});
        schoolCodes.put("1000540", new String[]{"0", "ЕГ", "ЕГ Д-р Петър Берон"});
        schoolCodes.put("1000550", new String[]{"0", "ПМГ", "ПМГ Проф. Емануил Иванов"});
        schoolCodes.put("1001360", new String[]{"0", "Техн. гимназия", "Професионална техническа гимназия"});
        schoolCodes.put("1001380", new String[]{"0", "ПГ по икономика", "ПГ по икономика и мениджмънт"});
        schoolCodes.put("1001390", new String[]{"0", "Спортно у-ще", "Спортно у-ще Васил Левски"});
        schoolCodes.put("1001420", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Н. Вапцаров"});
        schoolCodes.put("1001670", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост"});
        schoolCodes.put("1000053", new String[]{"0", OU_HRISTO_BOTEV, "5 ОУ Христо Ботев"});
        schoolCodes.put("1000330", new String[]{"0", "ОУ Марин Дринов", "ОУ Проф. Марин Дринов"});
        schoolCodes.put("1000340", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});
        schoolCodes.put("1001410", new String[]{"0", "ОУ П. Хилендарски", "6 ОУ Св. Паисий Хилендарски"});
        schoolCodes.put("1001590", new String[]{"0", "ОУ Ильо войвода", "7 ОУ Ильо войвода"});
        schoolCodes.put("1001680", new String[]{"0", "ОУ Даскал Димитри", "ОУ Даскал Димитри"});
        schoolCodes.put("1001830", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1000380", new String[] {"0", NU_KLIMENT_OHRIDSKI_SHORT, NU_KLIMENT_OHRIDSKI_LONG});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesLovetch() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1100316", new String[]{"0", "СУ Тодор Кирков", "СУ Тодор Кирков"});
        schoolCodes.put("1100318", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("1100320", new String[]{"0", "ППМГ", "ППМГ"});
        schoolCodes.put("1100322", new String[]{"0", "ПГ по механ.", "ПГ по механоелектротехника"});
        schoolCodes.put("1100324", new String[]{"0", "СУ Димитър Митев", "СУ Димитър Митев"});
        schoolCodes.put("1100328", new String[]{"0", "ЕГ", "Профилирана ЕГ Екзарх Йосиф I"});
        schoolCodes.put("1100329", new String[]{"0", "ПГ по вет. медицина", "Национална ПГ по ветеринарна медицина"});
        schoolCodes.put("1100331", new String[]{"0", "ПГ по икономика", "ПГ по икономика, търговия и услуги"});
        schoolCodes.put("1100301", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("1100304", new String[]{"0", "ОУ Хр. Никифоров", "ОУ Христо Никифоров"});
        schoolCodes.put("1100305", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1100317", new String[]{"0", "ОУ Панайот Пипков", "ОУ Панайот Пипков"});
        schoolCodes.put("1100336", new String[]{"0", "ОУ Димитър Димов", "ОУ Проф. Димитър Димов"});
        schoolCodes.put("1100102", new String[]{"1", "Св. Седмочисленици", "ЧНУ Св. Седмочисленици"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesMontana() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1201001", new String[]{"0", "ППМГ", "ППМГ Св. Климент Охридски"});
        schoolCodes.put("1201002", new String[]{"0", "ГПЧЕ", "ГПЧЕ Петър Богдан"});
        schoolCodes.put("1201004", new String[]{"0", "2 СУ", "2 СУ Никола Вапцаров"});
        schoolCodes.put("1201007", new String[]{"0", "5 СУ", "5 СУ Христо Ботев"});
        schoolCodes.put("1201011", new String[]{"0", "7 СУ", "7 СУ Йоран Радичков"});
        schoolCodes.put("1201021", new String[]{"0", "Финансово-стопанска", "Финансово-стопанска ПГ   "});
        schoolCodes.put("1201022", new String[]{"0", "ПГ по строителство", "ПГ по строителство, архитектура и компютърни науки"});
        schoolCodes.put("1201023", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост"});
        schoolCodes.put("1201033", new String[]{"0", "ПГ по техника", "ПГ по техника и електротехника"});
        schoolCodes.put("1201034", new String[]{"0", "6 СУ", "6 СУ Отец Паисий"});
        schoolCodes.put("1201003", new String[]{"0", "1 ОУ", "І ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("1201005", new String[]{"0", "3 ОУ", "3 ОУ Д-р Петър Берон"});
        schoolCodes.put("1201006", new String[]{"0", "4 ОУ", "4 ОУ Иван Вазов"});
        schoolCodes.put("1201000", new String[] {"0", "НУ Г. Бенковски", "НУ Г. Бенковски"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPazardzhik() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1301139", new String[]{"0", "ПГ по икономика", "ПГ по икономика и мениджмънт"});
        schoolCodes.put("1301234", new String[]{"0", "СУ Димитър Гачев", "СУ Димитър Гачев"});
        schoolCodes.put("1301911", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});
        schoolCodes.put("1302580", new String[]{"0", "ПГ Иван Аксаков", "Профилирана гимназия Иван С. Аксаков"});
        schoolCodes.put("1302769", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника"});
        schoolCodes.put("1302961", new String[]{"0", "ПГ по хим. и хр. техн.", "ПГ по химични и хранителни технологии"});
        schoolCodes.put("1303006", new String[]{"0", "ПГ по пром. техн.", "ПГ по промишлени технологии"});
        schoolCodes.put("1303344", new String[]{"0", "ПГ по фризьорство", "ПГ по фризьорство и ресторантьорство"});
        schoolCodes.put("1304290", new String[]{"0", "ЕГ", "ЕГ Бертолт Брехт"});
        schoolCodes.put("1304332", new String[]{"0", "ПГ по строителство", "ПГ по строителство и архитектура"});
        schoolCodes.put("1304948", new String[]{"0", "СУ Г. Бенковски", "СУ Георги Бенковски"});
        schoolCodes.put("1305338", new String[]{"0", "СУ Г. Брегов", "СУ Георги Брегов"});
        schoolCodes.put("1305831", new String[]{"0", "СУ Д-р П. Берон", "СУ Д-р Петър Берон"});
        schoolCodes.put("1309018", new String[]{"0", "ПМГ", "ПМГ Константин Величков"});
        schoolCodes.put("1300013", new String[]{"0", "СУ Пазарджик", "СУ Пазарджик"});
        schoolCodes.put("1301717", new String[]{"0", "ОУ Ив. Батаклиев", "ОУ Проф. Ив. Батаклиев"});
        schoolCodes.put("1301724", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1302502", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("1302517", new String[]{"0", "ОУ Стефан Захариев", "ОУ Стефан Захариев"});
        schoolCodes.put("1302534", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("1304930", new String[]{"0", "ОУ Хр. Смирненски", "ОУ Хр. Смирненски"});
        schoolCodes.put("1307267", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("1301215", new String[]{"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI});
        schoolCodes.put("1301222", new String[]{"0", "НУ Отец Паисий", "НУ Отец Паисий"});
        schoolCodes.put("1301247", new String[]{"0", "НУ Васил Друмев", "НУ Васил Друмев"});
        schoolCodes.put("1301254", new String[]{"0", "НУ Г. С. Раковски", "НУ Георги Сава Раковски"});
        schoolCodes.put("1305320", new String[]{"0", "НУ Н. Фурнаджиев", "НУ Никола Фурнаджиев"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPernik() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1403213", new String[]{"0", "5 СУ", "5 СУ Петко Славейков"});
        schoolCodes.put("1403214", new String[]{"0", "6 СУ", "6 СУ Св. Св. Кирил и Методий"});
        schoolCodes.put("1403216", new String[]{"0", "СУРИЧЕ", "СУРИЧЕ Д-р Петър Берон"});
        schoolCodes.put("1403217", new String[]{"0", "Спортно у-ще", "Спортно у-ще Олимпиец"});
        schoolCodes.put("1403219", new String[]{"0", "ПМГ", "ПМГ Христо Смирненски"});
        schoolCodes.put("1403220", new String[]{"0", "ГПЧЕ", "ГПЧЕ Симеон Радев"});
        schoolCodes.put("1403233", new String[]{"0", "ПГ по енергетика", "ПГ по енергетика и минна промишленост"});
        schoolCodes.put("1403234", new String[]{"0", "ПГ по техника", "ПГ по техника и строителство"});
        schoolCodes.put("1403235", new String[]{"0", "ПГ Мария Кюри", "Технологична ПГ Мария Кюри"});
        schoolCodes.put("1403236", new String[]{"0", "ПГ по икономика", "ПГ по икономика"});
        schoolCodes.put("1403237", new String[]{"0", "ПГ по облекло", "Професионална гимназия по облекло и туризъм"});
        schoolCodes.put("1403201", new String[]{"0", "ОУ Св. Ив. Рилски", "ОУ Св. Ив. Рилски"});
        schoolCodes.put("1403202", new String[]{"0", "7 ОУ", "7 ОУ Георги С. Раковски"});
        schoolCodes.put("1403203", new String[]{"0", "8 ОУ", "8 ОУ Кракра Пернишки"});
        schoolCodes.put("1403204", new String[]{"0", "ОбУ Темелко Ненков", "ОбУ Темелко Ненков"});
        schoolCodes.put("1403205", new String[]{"0", "10 ОУ", "10 ОУ Ал. Константинов"});
        schoolCodes.put("1403206", new String[]{"0", "11 ОУ", "11 ОУ Елин Пелин"});
        schoolCodes.put("1403207", new String[]{"0", "12 ОУ", "12 ОУ Васил Левски"});
        schoolCodes.put("1403208", new String[]{"0", "13 ОУ", "13 ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("1403211", new String[]{"0", "ОУ К. К. Философ", "ОУ Св. Конст. К. Философ"});
        schoolCodes.put("1403215", new String[]{"0", "16 ОУ", "16 ОУ Св. Св. Кирил и Методий"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPleven() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1500130", new String[]{"0", "МГ Гео Милев", "МГ Гео Милев"});
        schoolCodes.put("1500131", new String[]{"0", "ГПЧЕ", "ГПЧЕ"});
        schoolCodes.put("1500132", new String[]{"0", "СУ А. Димитрова", "СУ Анастасия Димитрова"});
        schoolCodes.put("1500133", new String[]{"0", "СУ Стоян Заимов", "СУ Стоян Заимов"});
        schoolCodes.put("1500134", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV});
        schoolCodes.put("1500135", new String[]{"0", SU_PEIO_YAVOROV_SHORT, SU_PEIO_YAVOROV_LONG});
        schoolCodes.put("1500136", new String[]{"0", "СУ Х. Смирненски", "Средно училище Христо Смирненски"});
        schoolCodes.put("1500138", new String[]{"0", "Спортно у-ще", "Спортно у-ще Георги Бенковски"});
        schoolCodes.put("1500140", new String[]{"0", "ДФСГ Интелект", "Държавна финансово-стопанска гимназия Интелект"});
        schoolCodes.put("1500141", new String[]{"0", "ПГ по механ.", "ПГ по механоелектротехника"});
        schoolCodes.put("1500142", new String[]{"0", "ПГ по хран.-вк. техн.", "ПГ по хранително-вкусови технологии"});
        schoolCodes.put("1500143", new String[]{"0", "ПГ по мениджмънт", "ПГ по мениджмънт и хранителни технологии"});
        schoolCodes.put("1500144", new String[]{"0", "ПГ по строителство", "ПГ по строителство архитектура и геодезия"});
        schoolCodes.put("1500145", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт"});
        schoolCodes.put("1500146", new String[]{"0", "ПГ по лоз. и вин.", "ПГ по лозарство и винарство"});
        schoolCodes.put("1500147", new String[]{"0", "ПГ по облекло", "Професионална гимназия по облекло и текстил"});
        schoolCodes.put("1500148", new String[]{"0", "ПГ по ел. и хим.", "ПГ по електроника и химични технологии"});
        schoolCodes.put("1500149", new String[]{"0", "ПГ по рест., търг. и обсл.", "ПГ по ресторантьорство, търговия и обслужване"});
        schoolCodes.put("1500151", new String[]{"0", "ПГ по под/стр/тр. техн.", "ПГ по подемна, строителна и транспортна техника"});
        schoolCodes.put("1500152", new String[]{"0", "ПГ Захарий Зограф", "ПГ Захарий Зограф"});
        schoolCodes.put("1500153", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Алеко Константинов"});
        schoolCodes.put("2902107", new String[]{"0", "НУИ", "НУИ Панайот Пипков"});
        schoolCodes.put("1500109", new String[]{"0", "ОУ Н. Вапцаров", "ОУ Никола Вапцаров"});
        schoolCodes.put("1500110", new String[]{"0", "ОУ Петър Берон", "ОУ Д-р Петър Берон"});
        schoolCodes.put("1500112", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("1500113", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("1500114", new String[]{"0", "ОУ Йордан Йовков", "ОУ Йордан Йовков"});
        schoolCodes.put("1500115", new String[]{"0", "ОУ Лазар Станев", "ОУ Лазар Станев"});
        schoolCodes.put("1500129", new String[]{"0", "ОУ Цветан Спасов", "ОУ Цветан Спасов"});
        schoolCodes.put("1500201", new String[]{"0", "ОУ Валери Петров", "ОУ Валери Петров"});
        schoolCodes.put("1500101", new String[]{"0", "НУ Единство", "НУ Единство"});
        schoolCodes.put("1500102", new String[]{"0", NU_HRISTO_BOTEV, NU_HRISTO_BOTEV});
        schoolCodes.put("1500103", new String[]{"0", "НУ П. Евтимий", "НУ Патриарх Евтимий"});
        schoolCodes.put("1500105", new String[]{"0", "НУ Отец Паисий", "НУ Отец Паисий"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRazgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1702601", new String[]{"0", "ПГ по икономика", "ПГ по икономика Робер Шуман"});
        schoolCodes.put("1702602", new String[]{"0", "Техническа гимназия", "Национална професионална техническа гимназия"});
        schoolCodes.put("1702603", new String[]{"0", "ПГ по хим. техн.", "ПГ по химични технологии и биотехнологии"});
        schoolCodes.put("1702604", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});
        schoolCodes.put("1702607", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт и строителство"});
        schoolCodes.put("1702608", new String[]{"0", "ГПЧЕ", "ГПЧЕ Екзарх Йосиф"});
        schoolCodes.put("1702609", new String[]{"0", "ППМГ", "ППМГ Акад. Никола Обрешков"});
        schoolCodes.put("1702612", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("1702629", new String[]{"0", "ПГ по облекло", "ПГ по облекло"});
        schoolCodes.put("1702640", new String[]{"0", "Спортно у-ще", "Спортно у-ще - Разград"});
        schoolCodes.put("1702611", new String[]{"0", "ОУ Н. Вапцаров", "ОУ Никола Вапцаров"});
        schoolCodes.put("1702613", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("1702614", new String[]{"0", "ОУ Н. Икономов", "ОУ Н. Икономов"});
        schoolCodes.put("1702615", new String[]{"0", "ОУ И. С. Тургенев", "ОУ И. С. Тургенев"});
        schoolCodes.put("1702616", new String[]{"0", "ОУ Отец Паисий", "ОУ Отец Паисий"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRuse() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1806201", new String[]{"0", "АЕГ Гео Милев", "Английска ЕГ Гео Милев"});
        schoolCodes.put("1806202", new String[]{"0", "МГ Баба Тонка", "МГ Баба Тонка"});
        schoolCodes.put("1806203", new String[]{"0", "СУ за европ. езици", "СУ за европейски езици"});
        schoolCodes.put("1806204", new String[]{"0", "СУ Фридрих Шилер", "СУ с немски език Фридрих Шилер"});
        schoolCodes.put("1806206", new String[]{"0", "СУ Йордан Йовков", "СУ Йордан Йовков"});
        schoolCodes.put("1806207", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("1806208", new String[]{"0", "СУ Възраждане", "СУ Възраждане"});
        schoolCodes.put("1806209", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI});
        schoolCodes.put("1806210", new String[]{"0", "Духовно училище", "Духовно училище"});
        schoolCodes.put("1806213", new String[]{"1", "Леонардо да Винчи", "Първо ЧСУ Леонардо да Винчи"});
        schoolCodes.put("1806215", new String[]{"1", "Джордж Байрон", "ЧПАГ Джордж Байрон"});
        schoolCodes.put("1806301", new String[]{"0", "ПГ по електрот.", "ПГ по електротехника и електроника"});
        schoolCodes.put("1806302", new String[]{"0", "ПГ по дървообр.", "ПГ по дървообработване и вътрешна архитектура"});
        schoolCodes.put("1806305", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});
        schoolCodes.put("1806306", new String[]{"0", "ПГ по механот.", "ПГ по механотехника"});
        schoolCodes.put("1806307", new String[]{"0", "ПГ по облекло", "ПГ по облекло"});
        schoolCodes.put("1806309", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм"});
        schoolCodes.put("1806310", new String[]{"0", "ПГ по икономика", "ПГ по икономика и управление"});
        schoolCodes.put("1806311", new String[]{"0", "ПГ по реч. кор.", "ПГ по речно корабостроене и корабоплаване"});
        schoolCodes.put("1806312", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт"});
        schoolCodes.put("1806313", new String[]{"0", "ПГ по строителство", "ПГ по строителство, архитектура и геодезия"});
        schoolCodes.put("1806315", new String[]{"0", "ПГ по пром. техн.", "ПГ по промишлени технологии"});
        schoolCodes.put("1806401", new String[]{"0", "Спортно у-ще", "Спортно у-ще"});
        schoolCodes.put("2902105", new String[]{"0", "НУИ", "НУИ Проф. Веселин Стоянов"});
        schoolCodes.put("1806101", new String[]{"0", "ОУ Отец Паисий", "ОУ Отец Паисий"});
        schoolCodes.put("1806102", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("1806103", new String[]{"0", "ОУ Ангел Кънчев", "ОУ Ангел Кънчев"});
        schoolCodes.put("1806104", new String[]{"0", "ОУ Братя Миладинови", "ОУ Братя Миладинови"});
        schoolCodes.put("1806106", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});
        schoolCodes.put("1806108", new String[]{"0", OU_ALEKO_KONSTANTINOV_SHORT, OU_ALEKO_KONSTANTINOV_LONG});
        schoolCodes.put("1806109", new String[]{"0", "ОУ Тома Кърджиев", "ОУ Тома Кърджиев"});
        schoolCodes.put("1806110", new String[]{"0", "ОУ Никола Обретенов", "ОУ Никола Обретенов"});
        schoolCodes.put("1806111", new String[]{"0", "ОУ Васил Априлов", "ОУ Васил Априлов"});
        schoolCodes.put("1806112", new String[]{"0", "ОУ Хр. Смирненски", "ОУ Христо Смирненски"});
        schoolCodes.put("1806205", new String[]{"0", "ОУ Олимпи Панов", "ОУ Олимпи Панов"});
        schoolCodes.put("1806216", new String[]{"1", "Вяра Надежда Любов", "ЧНУ Вяра Надежда Любов"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSilistra() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1900502", new String[]{"0", "СУ Н. Вапцаров", "СУ Никола Вапцаров"});
        schoolCodes.put("1900503", new String[]{"0", "ПМГ", "ПМГ Св. Климент Охридски"});
        schoolCodes.put("1900504", new String[]{"0", "ЕГ", "ЕГ Пейо Яворов"});
        schoolCodes.put("1900505", new String[]{"0", "ПГ по механотехника", "ПГ по механотехника"});
        schoolCodes.put("1900506", new String[]{"0", "ПГ по стоп. упр.", "ПГ по стопанско управление"});
        schoolCodes.put("1900507", new String[]{"0", "Земеделска гимназия", "Професионална земеделска гимназия"});
        schoolCodes.put("1900508", new String[]{"0", "ПГ по строителство", "ПГ по строителство Пеньо Пенев"});
        schoolCodes.put("1900509", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост Пенчо Славейков"});
        schoolCodes.put("1900510", new String[]{"0", "ПГ по произв. техн.", "ПГ по производствени технологии"});
        schoolCodes.put("1900528", new String[]{"0", "Спортно у-ще", "Спортно у-ще Дръстър"});
        schoolCodes.put("1900511", new String[]{"0", "ОУ Отец Паисий", "ОУ Отец Паисий"});
        schoolCodes.put("1900512", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1900514", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSliven() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2000105", new String[]{"0", "СУ Х. Мина Пашов", "СУ Хаджи Мина Пашов"});
        schoolCodes.put("2000109", new String[]{"0", SU_PEIO_YAVOROV_SHORT, SU_PEIO_YAVOROV_LONG});
        schoolCodes.put("2000114", new String[]{"0", "СУ Йордан Йовков", "СУ Йордан Йовков"});
        schoolCodes.put("2000115", new String[]{"0", "СУ К. Константинов", "СУ Константин Константинов"});
        schoolCodes.put("2000117", new String[]{"0", "ПГ по текстил", "ПГ по текстил и облекло Добри Желязков"});
        schoolCodes.put("2000118", new String[]{"0", "ПГ по електрот.", "ПГ по електротехника и електроника"});
        schoolCodes.put("2000119", new String[]{"0", "ПГ по икономика", "ПГ по икономика Проф. д-р Димитър Табаков"});
        schoolCodes.put("2000120", new String[]{"0", "ПГ по хотелиерство", "ПГ по хотелиерство и туризъм"});
        schoolCodes.put("2000122", new String[]{"0", "ПГ по стр. и геод.", "Сливенска ПГ по строителство и геодезия"});
        schoolCodes.put("2000123", new String[]{"0", "ПГ по механотехника", "ПГ по механотехника"});
        schoolCodes.put("2000125", new String[]{"0", "СУ Аргира Жечкова", "СУ Аргира Жечкова"});
        schoolCodes.put("2000126", new String[]{"0", "ППМГ", "ППМГ Добри Чинтулов"});
        schoolCodes.put("2000127", new String[]{"0", "Гимн. със зап. ез.", "ПГ с преподаване на западни езици"});
        schoolCodes.put("2000128", new String[]{"0", "Спортно у-ще", "Спортно у-ще Димитър Рохов"});
        schoolCodes.put("2000129", new String[]{"0", "Хуманит. гимназия", "Хуманитарна гимназия Дамян Дамянов"});
        schoolCodes.put("2902504", new String[]{"0", "Худож. гимназия", "Художествена гимназия Димитър Добрович"});
        schoolCodes.put("2000106", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("2000107", new String[]{"0", "ОУ Ив. Селимински", "ОУ Д-р Ив. Селимински"});
        schoolCodes.put("2000108", new String[]{"0", "ОУ Д. Петров", "ОУ Д. Петров"});
        schoolCodes.put("2000110", new String[]{"0", "ОУ Бр. Миладинови", "ОУ Братя Миладинови"});
        schoolCodes.put("2000111", new String[]{"0", "ОУ П. Хитов", "ОУ Панайот Хитов"});
        schoolCodes.put("2000112", new String[]{"0", "ОУ Юрий Гагарин", "ОУ Юрий Гагарин"});
        schoolCodes.put("2000113", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("2000116", new String[]{"0", "ОУ Ел. Багряна", "ОУ Елисавета Багряна"});
        schoolCodes.put("2000102", new String[]{"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSmolyan() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2100103", new String[]{"0", SU_KIRIL_I_METODII_SHORT, SU_KIRIL_I_METODII_LONG});
        schoolCodes.put("2100105", new String[]{"0", "СУ Отец Паисий", "СУ Отец Паисий"});
        schoolCodes.put("2100111", new String[]{"0", "ПГ по техника", "ПГ по техника и технологии"});
        schoolCodes.put("2100113", new String[]{"0", "ПГ по икономика", "Професионална гимназия по икономика"});
        schoolCodes.put("2100115", new String[]{"0", "ПГ по туризъм", "Смолянска ПГ по туризъм и строителство"});
        schoolCodes.put("2103321", new String[]{"0", "ППМГ", "ППМГ Васил Левски"});
        schoolCodes.put("2103331", new String[]{"0", "ЕГ Иван Вазов", "ЕГ Иван Вазов"});
        schoolCodes.put("2902506", new String[]{"0", "ПГ за прил. изк.", "ПГ за приложни изкуства"});
        schoolCodes.put("2100104", new String[]{"0", "ОУ Юрий Гагарин", "ОУ Юрий Гагарин"});
        schoolCodes.put("2100107", new String[]{"0", "ОУ Асен Златаров", "ОУ Проф. д-р Асен Златаров"});
        schoolCodes.put("2100109", new String[]{"0", "ОУ Стою Шишков", "ОУ Стою Шишков"});
        schoolCodes.put("2100110", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesStaraZagora() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2400014", new String[]{"0", "СУ Железник", "СУ Железник"});
        schoolCodes.put("2400102", new String[]{"0", "ППМГ Гео Милев", "ППМГ Гео Милев"});
        schoolCodes.put("2400104", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI});
        schoolCodes.put("2400105", new String[]{"0", "СУ Хр. Смирненски", "СУ Христо Смирненски"});
        schoolCodes.put("2400106", new String[]{"0", "СУ Максим Горки", "СУ Максим Горки"});
        schoolCodes.put("2400107", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV});
        schoolCodes.put("2400108", new String[]{"0", "Спортно у-ще", "Спортно у-ще Тодор Каблешков"});
        schoolCodes.put("2400110", new String[]{"0", "Вечерно СУ", "Вечерно СУ Захари Стоянов"});
        schoolCodes.put("2400111", new String[]{"0", "ПГ по механот.", "ПГ по механотехника и транспорт"});
        schoolCodes.put("2400112", new String[]{"0", "ПГ по електрот.", "ПГ по електротехника и технологии"});
        schoolCodes.put("2400116", new String[]{"0", "ПГ по вет. медицина", "Национална ПГ по ветеринарна медицина"});
        schoolCodes.put("2400117", new String[]{"0", "ПГ по електроника", "ПГ по електроника"});
        schoolCodes.put("2400119", new String[]{"0", "ПГ по строит и дърв.", "ПГ по строителство и дървообработване"});
        schoolCodes.put("2400121", new String[]{"0", "СУ Минчо Кънчев", "СУ Поп Минчо Кънчев"});
        schoolCodes.put("2400165", new String[]{"0", "ПГ по облекло", "ПГ по облекло и хранене"});
        schoolCodes.put("2400174", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("2402016", new String[]{"0", "Търговска гимназия", "Търговска гимназия Княз Симеон Търновски"});
        schoolCodes.put("2402131", new String[]{"0", "ПГ по строит., арх. и геод.", "ПГ по строителство, архитектура и геодезия"});
        schoolCodes.put("2403264", new String[]{"0", "ГПЧЕ Ромен Ролан", "ГПЧЕ Ромен Ролан"});
        schoolCodes.put("2902104", new String[]{"0", "НУМСИ", "НУМСИ Христина Морфова"});
        schoolCodes.put("2400109", new String[]{"0", "ОУ Георги Райчев", "ОУ Георги Райчев"});
        schoolCodes.put("2400122", new String[]{"0", "ОУ Георги Бакалов", "ОУ Георги Бакалов"});
        schoolCodes.put("2400123", new String[]{"0", "ОУ П. Славейков", "2 ОУ П. Р. Славейков"});
        schoolCodes.put("2400125", new String[]{"0", "ОУ Кирил Христов", "ОУ Кирил Христов"});
        schoolCodes.put("2400126", new String[]{"0", "ОУ М. Станев", "5 ОУ М. Станев"});
        schoolCodes.put("2400129", new String[]{"0", "ОУ Самара", "ОУ Самара"});
        schoolCodes.put("2400130", new String[]{"0", "ОУ В. Ханчев", "9 ОУ В. Ханчев"});
        schoolCodes.put("2400132", new String[]{"0", "ОУ Николай Лилиев", "11 ОУ Николай Лилиев"});
        schoolCodes.put("2400133", new String[]{"0", "ОУ Стефан Караджа", "12 ОУ Стефан Караджа"});
        schoolCodes.put("2400134", new String[]{"0", "ОУ П. Хилендарски", "13 ОУ Св. П. Хилендарски"});
        schoolCodes.put("2400167", new String[]{"1", "Елин Пелин", "ЧОУ Елин Пелин"});
        schoolCodes.put("2403219", new String[]{"0", "ОУ Св. Никола", "6 ОУ Св. Никола"});
        schoolCodes.put("2400124", new String[]{"0", "НУ Кольо Ганчв", "НУ Кольо Ганчв"});
        schoolCodes.put("2400146", new String[]{"0", "НУ Д. Благоев", "НУ Димитър Благоев"});
        schoolCodes.put("2400147", new String[]{"0", "НУ Зора", "НУ Зора"});
        schoolCodes.put("2400020", new String[]{"0", "ПГ по комп. науки", "ПГ по комп. науки и мат. анализ Проф. Минко Балкански"});


        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesTurgovishte() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2500203", new String[]{"0", "Спортно у-ще", "Спортно училище Никола Симов"});
        schoolCodes.put("2500204", new String[]{"0", "1 СУ", "1 СУ Свети Седмочисленици"});
        schoolCodes.put("2500301", new String[]{"0", "ПГИЧЕ", " ПГИЧЕ Митрополит Андрей"});
        schoolCodes.put("2500601", new String[]{"0", "ПГ по икон. инф.", "ПГ по икономическа информатика"});
        schoolCodes.put("2500602", new String[]{"0", "Техническа гимназия", "Професионална техническа гимназия"});
        schoolCodes.put("2500603", new String[]{"0", "ПГ по електрот.", "ПГ по електротехника и строителство"});
        schoolCodes.put("2500604", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм и хран.-вкусови технологии"});
        schoolCodes.put("2500605", new String[]{"0", "ПГ по земеделие", "ПГ по земеделие"});
        schoolCodes.put("2500703", new String[]{"0", "У-ще за уч. с увр. слух", "Специално у-ще за ученици с увреден слух"});
        schoolCodes.put("2501694", new String[]{"0", "2 СУ", "2 СУ Проф. Никола Маринов"});
        schoolCodes.put("2500101", new String[]{"0", "1 ОУ", "1 ОУ Христо Ботев"});
        schoolCodes.put("2500102", new String[]{"0", "2 ОУ", "2 ОУ Н. Вапцаров"});
        schoolCodes.put("2500103", new String[]{"0", "3 ОУ", "3 ОУ П. Р. Славейков"});
        schoolCodes.put("2500104", new String[]{"0", "4 ОУ", "4 ОУ Иван Вазов"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesHaskovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2601025", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI});
        schoolCodes.put("2601026", new String[]{"0", "СУ П. Хилендарски", "СУ Св. Паисий Хилендарски"});
        schoolCodes.put("2601027", new String[]{"0", "Спортно у-ще", "Спортно у-ще Стефан Караджа"});
        schoolCodes.put("2601028", new String[]{"0", "ЕГ", "ЕГ Проф. д-р Асен Златаров"});
        schoolCodes.put("2601029", new String[]{"0", "ПМГ", "ПМГ Акад. Боян Петканчин"});
        schoolCodes.put("2601031", new String[]{"0", "Финансово-стопанска", "Финансово-стопанска гимназия Атанас Буров"});
        schoolCodes.put("2601032", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Александър Паскалев"});
        schoolCodes.put("2601034", new String[]{"0", "ПГ по дървообр.", "ПГ по дървообработване и строителство"});
        schoolCodes.put("2601035", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост Райна Княгиня"});
        schoolCodes.put("2601036", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника"});
        schoolCodes.put("2601904", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт и аграрни технологии"});
        schoolCodes.put("2601004", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("2601005", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("2601006", new String[]{"0", "ОУ Шандор Петьофи", "ОУ Шандор Петьофи"});
        schoolCodes.put("2601008", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("2601009", new String[]{"0", "ОУ Н. Вапцаров", "ОУ Н. Й. Вапцаров"});
        schoolCodes.put("2601010", new String[]{"0", "ОУ Иван Рилски", "ОУ Св. Иван Рилски"});
        schoolCodes.put("2601011", new String[]{"0", "ОУ Хр. Смирненски", "ОУ Христо Смирненски"});
        schoolCodes.put("2601001", new String[]{"0", "НУ Г. С. Раковски", "НУ Георги Сава Раковски"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesShumen() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2700006", new String[]{"0", "ПГ по строителство", "ПГ по строителство, архитектура и геодезия"});
        schoolCodes.put("2700011", new String[]{"0", "ПГ по икономика", "ПГ по икономика"});
        schoolCodes.put("2700031", new String[]{"0", "ПГ по облекло", "ПГ по облекло, хранене и химични технологии"});
        schoolCodes.put("2700064", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});
        schoolCodes.put("2700076", new String[]{"0", "СУ Панайот Волов", "СУ Панайот Волов"});
        schoolCodes.put("2700083", new String[]{"0", "ЕГ Н. Вапцаров", "ЕГ Никола Йонков Вапцаров"});
        schoolCodes.put("2700147", new String[]{"0", "СУ Трайко Симеонов", "СУ Трайко Симеонов"});
        schoolCodes.put("2700182", new String[]{"0", "СУ Йоан Екзарх", "СУ Йоан Екзарх Български"});
        schoolCodes.put("2700197", new String[]{"0", "СУ С. Доброплодни", "СУ Сава Доброплодни"});
        schoolCodes.put("2700217", new String[]{"0", "Духовно училище", "Духовно училище Нювваб"});
        schoolCodes.put("2700221", new String[]{"0", "ППМГ", "ППМГ Нанчо Попович"});
        schoolCodes.put("2700231", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI});
        schoolCodes.put("2707033", new String[]{"0", "ПГ по механот.", "ПГ по механот., електр., телеком. и транспорт"});
        schoolCodes.put("2700104", new String[]{"0", "ОУ П. Волов", "ОУ Панайот Волов"});
        schoolCodes.put("2700114", new String[]{"0", "ОУ Петър Берон", "ОУ Д-р Петър Берон"});
        schoolCodes.put("2700146", new String[]{"0", "ОУ Д. Благоев", "ОУ Димитър Благоев"});
        schoolCodes.put("2700269", new String[]{"0", "ОУ Е. Марковски", "ОУ Еньо Марковски"});
        schoolCodes.put("2700082", new String[]{"0", "НУ Илия Блъсков", "НУ Илия Блъсков"});
        schoolCodes.put("2700153", new String[]{"0", "НУ Княз Борис I", "НУ Княз Борис I"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesIambol() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2811510", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("2811515", new String[]{"0", "ПГ Васил Левски", "ПГ Васил Левски"});
        schoolCodes.put("2811516", new String[]{"0", "ПМГ", "ПМГ Атанас Радев"});
        schoolCodes.put("2811517", new String[]{"0", "ЕГ В. Карагьозов", "ЕГ Васил Карагьозов"});
        schoolCodes.put("2811518", new String[]{"0", "Спортно у-ще", "Спортно у-ще Пиер дьо Кубертен"});
        schoolCodes.put("2811601", new String[]{"0", "Техническа гимназия", "Професионална техническа гимназия Иван Райнов"});
        schoolCodes.put("2811602", new String[]{"0", "ПГ по икономика", "ПГ по икономика Георги Стойков Раковски"});
        schoolCodes.put("2811603", new String[]{"0", "ПГ по хранит. техн.", "ПГ по хранителни технологии и туризъм"});
        schoolCodes.put("2811604", new String[]{"0", "ПГ по земеделие", "ПГ по земеделие Христо Ботев"});
        schoolCodes.put("2811607", new String[]{"0", "Гимназия по строит.", "Гимназия по строителство и архитектура"});
        schoolCodes.put("2811608", new String[]{"0", "ПГ по подемна техн.", "ПГ по подемна, строителна и транспортна техника"});
        schoolCodes.put("2811613", new String[]{"0", "ПГ по лека пром.", "ПГ по лека пром., екология и хим. технологии"});
        schoolCodes.put("2811506", new String[]{"0", "ОУ Йордан Йовков", "ОУ Йордан Йовков"});
        schoolCodes.put("2811507", new String[]{"0", "ОУ Н. Петрини", "ОУ Николай Петрини"});
        schoolCodes.put("2811509", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("2811512", new String[]{"0", "ОУ П. Р. Славейков", "ОУ П. Р. Славейков"});
        schoolCodes.put("2811513", new String[]{"0", "ОУ Хр. Смирненски", "ОУ Христо Смирненски"});
        schoolCodes.put("2811514", new String[]{"0", "ОбУ Д-р Петър Берон", "ОУ Д-р Петър Берон"});
        schoolCodes.put("2811501", new String[]{"0", "НУ Петър Нойков", "НУ Проф. Петър Нойков"});
        schoolCodes.put("2811504", new String[]{"0", NU_KIRIL_I_METODII_SHORT, NU_KIRIL_I_METODII_LONG});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesAitos() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200104", new String[]{"0", "ОУ Атанас Манчев", "ОУ Атанас Манчев"});
        schoolCodes.put("200112", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("200113", new String[]{"0", "СУ Н. Вапцаров", "СУ Н. Вапцаров"});
        schoolCodes.put("200114", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesAsenovgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1600101", new String[]{"0", "ОУ Ангел Кънчев", "ОУ Ангел Кънчев"});
        schoolCodes.put("1600102", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("1600103", new String[]{"0", "ОУ П. Хилендарски", "ОУ Отец Паисий Хилендарски"});
        schoolCodes.put("1600104", new String[]{"0", "ОУ П. Каравелов", "ОУ Петко Каравелов"});
        schoolCodes.put("1600105", new String[]{"0", "ОУ Н. Вапцаров", "ОУ Никола Вапцаров"});
        schoolCodes.put("1600107", new String[]{"0", "ОУ П. Волов", "ОУ Панайот Волов"});
        schoolCodes.put("1600114", new String[]{"0", "СУ Княз Борис И", "СУ Св. Княз Борис I"});
        schoolCodes.put("1600116", new String[]{"0", SU_KIRIL_I_METODII_SHORT, SU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1600128", new String[]{"0", "ПГ Св. П. Евтимий", "ПГ Св. Патриарх Евтимий"});
        schoolCodes.put("1600617", new String[]{"0", "ПГ по хран.-вк. техн.", "ПГ по хранително-вкусови технологии"});
        schoolCodes.put("1600618", new String[]{"0", "ПГ Иван Асен II", "ПГ Цар Иван Асен II"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBotevgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2301045", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("2308753", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("2308760", new String[]{"0", "ОУ Н. Вапцаров", "ОУ Никола Вапцаров"});
        schoolCodes.put("2300099", new String[]{"0", "ППМГ", "ППМГ Акад. проф. д-р Асен Златаров"});
        schoolCodes.put("2300284", new String[]{"0", "ПГ по техника", "ПГ по техника и мениджмънт"});
        schoolCodes.put("2301044", new String[]{"0", "Техническа ПГ", "Техническа ПГ Стамен Панчев"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVelingrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1301674", new String[]{"0", SU_KIRIL_I_METODII_SHORT, SU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1301699", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("1301707", new String[]{"0", "ОУ Г. Бенковски", "ОУ Георги Бенковски"});
        schoolCodes.put("1302573", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI});
        schoolCodes.put("1306811", new String[]{"0", "ПГ по дървообр.", "ПГ по дървообработване"});
        schoolCodes.put("1302979", new String[]{"0", "ОУ Неофит Рилски", "ОУ Неофит Рилски"});
        schoolCodes.put("1304231", new String[]{"0", "ПГ по иконом. и тур.", "ПГ по икономика и туризъм"});
        schoolCodes.put("1311390", new String[]{"0", "НПГ по горско стоп.", "Национална ПГ по горско стопанство"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesGornaOryahovitsa() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("300201", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});
        schoolCodes.put("300202", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("300205", new String[]{"0", "ОУ ОУ П. Хилендарски", "ОУ Св. Паисий Хилендарски"});
        schoolCodes.put("300216", new String[]{"0", "СУ Г. Измирлиев", "СУ Георги Измирлиев"});
        schoolCodes.put("300217", new String[]{"0", "СУ В. Грънчаров", "СУ Вичо Грънчаров"});
        schoolCodes.put("300218", new String[]{"0", "ПТГ В. Левски", "ПТГ Васил Левски"});
        schoolCodes.put("300219", new String[]{"0", "ПГ по електрот. и електрон.", "ПГ по електротехника и електроника"});
        schoolCodes.put("300220", new String[]{"0", "ПГ по хранит. техн.", "ПГ по хранителни технологии"});
        schoolCodes.put("300221", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост и икономика"});
        schoolCodes.put("300222", new String[]{"0", "ПГ по ЖП транспорт", "ПГ по железопътен транспорт"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesGotseDelchev() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("103402", new String[]{"0", "1 ОУ", "1 ОУ Св. Св. Кирил и Методий"});
        schoolCodes.put("103403", new String[]{"0", "2 ОУ", "2 ОУ Гоце Делчев"});
        schoolCodes.put("103404", new String[]{"0", "3 ОУ", "3 ОУ Братя Миладинови"});
        schoolCodes.put("102002", new String[]{"0", "ПМГ Яне Сандански", "ПМГ Яне Сандански"});
        schoolCodes.put("102001", new String[]{"0", "Неврокопска ПГ", "Неврокопска ПГ Димитър Талев"});
        schoolCodes.put("102016", new String[]{"0", "ПГ по механизация", "ПГ по мхан. на селското стоп."});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDimitrovgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2602002", new String[]{"0", "ОУ П. Яворов", "ОУ Пейо Яворов"});
        schoolCodes.put("2602003", new String[]{"0", "ОбУ Кирил и Методий", "ОбУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2602004", new String[]{"0", OU_ALEKO_KONSTANTINOV_SHORT, OU_ALEKO_KONSTANTINOV_LONG});
        schoolCodes.put("2602006", new String[]{"0", "ОУ П. Славейков", "ОУ Пенчо Славейков"});
        schoolCodes.put("2602017", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("2602018", new String[]{"0", SU_LIUBEN_KARAVELOV_SHORT, SU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("2602019", new String[]{"0", "ПМГЗИЧЕ", "ПМГ със ЗИЧЕ Иван Вазов"});
        schoolCodes.put("2602020", new String[]{"0", "ЕГ И. Богоров", "Профилирана ЕГ Д-р Иван Богоров"});
        schoolCodes.put("2602023", new String[]{"0", "ПГ А. Златаров", "ПГ Проф. д-р Асен Златаров"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDupnitsa() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1000034", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1000035", new String[]{"0", "СЕУ П. Хилендарски", "СЕУ Св. Паисий Хилендарски"});
        schoolCodes.put("1000036", new String[]{"0", "ОУ Неофит Рилски", "ОУ Неофит Рилски"});
        schoolCodes.put("1000037", new String[]{"0", "ОУ Хр. Павлович", "ОУ Христаки Павлович"});
        schoolCodes.put("1000038", new String[]{"0", "ОУ Евл. Георгиев", "ОУ Евлоги Георгиев"});
        schoolCodes.put("1000039", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("1000049", new String[]{"0", "ПГ по облекло", "ПГ по облекло и стоп. упр."});
        schoolCodes.put("1000051", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт"});
        schoolCodes.put("1000052", new String[]{"0", PG_HRISTO_BOTEV, PG_HRISTO_BOTEV});
        schoolCodes.put("1002136", new String[]{"0", "ПГ С. Королоьов", "ПГ Акад. Сергей П. Корольов"});
        schoolCodes.put("1002137", new String[]{"0", "ПГ по хран.-вк. техн.", "ПГ по хранително-вкусови технологии"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesIhtiman() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2300188", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("2304101", new String[]{"0", "ОУ Д. Дебелянов", "ОУ Димчо Дебелянов"});
        schoolCodes.put("2308810", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("2300417", new String[]{"0", "ПГ Васил Левски", "ПГ Васил Левски"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKazanluk() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2400262", new String[]{"0", "ППМГ", "ППМГ Никола Обрешков"});
        schoolCodes.put("2400264", new String[]{"0", "СУ Антим I", "СУ Екзарх Антим I"});
        schoolCodes.put("2400271", new String[]{"0", "ОУ Кулата", "ОУ Кулата"});
        schoolCodes.put("2400272", new String[]{"0", "ОУ Г. Кирков", "ОУ Георги Кирков"});
        schoolCodes.put("2400273", new String[]{"0", "ОУ П. Хилендарски", "ОУ Св. Паисий Хилендарски"});
        schoolCodes.put("2400274", new String[]{"0", "ОУ Мати Болгария", "ОУ Мати Болгария"});
        schoolCodes.put("2400275", new String[]{"0", "ОУ Чудомир", "ОУ Чудомир"});
        schoolCodes.put("2400276", new String[]{"0", "ОУ Н. Вапцаров", "ОУ Никола Вапцаров"});
        schoolCodes.put("2400277", new String[]{"0", "ОУ А. Страшимиров", "ОУ Антон Страшимиров"});
        schoolCodes.put("2902505", new String[]{"0", "НУПИД А. Узунов", "НУ по пласт. изк. и дизайн"});
        schoolCodes.put("2400261", new String[]{"0", "ПГ П. Стайнов", "ПГ Акад. Петко Стайнов"});
        schoolCodes.put("2400263", new String[]{"0", "ПХГ Кирил и Методий", "ПХГ Св. Св. Кирил и Методий"});
        schoolCodes.put("2400265", new String[]{"0", "ПГ Иван Хаджиенов", "ПГ Иван Хаджиенов"});
        schoolCodes.put("2400266", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт и мениджмънт"});
        schoolCodes.put("2400268", new String[]{"0", "ПГ по лека пром.", "ПГ по лека пром. и туризъм"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKarlovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1601301", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI});
        schoolCodes.put("1601302", new String[]{"0", "СУ Хр. Проданов", "СУ Христо Проданов"});
        schoolCodes.put("1601304", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1601305", new String[]{"0", "ОУ Райно Попович", "ОУ Райно Попович"});
        schoolCodes.put("1601361", new String[]{"0", "ПГ по жп транспорт", "ПГ по жп транспорт"});
        schoolCodes.put("1601364", new String[]{"0", "ПГ Евл. и Хр. Георгиеви", "ПГ Евлогий и Христо Георгиеви"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKarnobat() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200404", new String[]{"0", "ОУ Хр. Смирненски", "ОУ Христо Смирненски"});
        schoolCodes.put("200405", new String[]{"0", "ОУ П. Р. Славейков", "ОУ Петко Р. Славейков"});
        schoolCodes.put("200411", new String[]{"0", SU_KIRIL_I_METODII_SHORT, SU_KIRIL_I_METODII_LONG});
        schoolCodes.put("200412", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("200413", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKostinbrod() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2309638", new String[]{"0", "СУ Петър Берон", "СУ Д-р Петър Берон"});
        schoolCodes.put("2309735", new String[]{"0", "ПГ по вет. мед.", "ПГ по ветеринарна медицина"});
        schoolCodes.put("2300067", new String[]{"0", "1 ОУ", "1 ОУ Васил Левски"});
        schoolCodes.put("2308290", new String[]{"0", "2 ОУ", "2 ОУ Васил Левски"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesLom() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1203512", new String[]{"0", "1 ОУ Н. Първанов", "1 ОУ Никола Първанов"});
        schoolCodes.put("1209002", new String[]{"0", "2 ОУ К. Фотинов", "2 ОУ Константин Фотинов"});
        schoolCodes.put("1209003", new String[]{"0", "СУ Отец Паисий", "СУ Отец Паисий"});
        schoolCodes.put("1209004", new String[]{"0", "4 ОУ Христо Ботев", "4 ОУ Христо Ботев"});
        schoolCodes.put("1209005", new String[]{"0", "СУ Д. Маринов", "СУ Димитър Маринов"});
        schoolCodes.put("1202036", new String[]{"0", "ПГ по хранене", "ПГ по хранене и земеделие"});
        schoolCodes.put("1209006", new String[]{"0", "ПГ Найден Геров", "ПГ Найден Геров"});
        schoolCodes.put("1209012", new String[]{"0", "ПГ по произв. техн.", "ПГ по произв. технологии"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesLukovit() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1100402", new String[]{"0", "СУ А. Константинов", "СУ Алеко Константинов"});
        schoolCodes.put("1100411", new String[]{"0", "НУ Г. Вълков", "НУ Инж. Георги Вълков"});
        schoolCodes.put("1100410", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesNesebar() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200608", new String[]{"0", SU_LIUBEN_KARAVELOV_SHORT, SU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("200609", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesNovaZagora() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2000301", new String[]{"0", "НУ П. Хилендарски", "НУ Св. Паисий Хилендарски"});
        schoolCodes.put("2000302", new String[]{"0", NU_LIUBEN_KARAVELOV_SHORT, NU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("2000303", new String[]{"0", "ОУ Хр. Смирненски", "ОУ Хр. Смирненски"});
        schoolCodes.put("2000304", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV});
        schoolCodes.put("2000305", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("2000306", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});
        schoolCodes.put("2000307", new String[]{"0", "ПГ по техника", "ПГ по техника и технологии"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesObzor() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200601", new String[]{"0", "ОбУ Кирил и Методий", "ОбУ Св. Св. Кирил и Методий"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPanagiurishte() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1301731", new String[]{"0", "ОУ Марин Дринов", "ОУ Проф. Марин Дринов"});
        schoolCodes.put("1301749", new String[]{"0", "ОУ 20 Април", "ОУ 20 Април"});
        schoolCodes.put("1302623", new String[]{"0", "СУ Нешо Бончев", "СУ Нешо Бончев"});
        schoolCodes.put("1305587", new String[]{"0", "ПГ по индустр. техн.", "ПГ по индустриални техн."});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPetrich() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("103310", new String[]{"0", "СУ Н. Вапцаров", "СУ Никола Вапцаров"});
        schoolCodes.put("104002", new String[]{"0", "СУ А. Попов", "СУ Антон Попов"});
        schoolCodes.put("104006", new String[]{"0", "1 ОУ К. Мавродиев", "Първо ОУ Кочо Мавродиев"});
        schoolCodes.put("104007", new String[]{"0", "3 ОУ Гоце Делчев", "Трето ОУ Гоце Делчев"});
        schoolCodes.put("104008", new String[]{"0", "4 ОУ Хр. Смирненски", "Четвърто ОУ Христо Смирненски"});
        schoolCodes.put("102009", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника"});
        schoolCodes.put("102014", new String[]{"0", "ПГ по икон. и туризъм", "ПГ по икономика и туризъм"});
        schoolCodes.put("104001", new String[]{"0", "ПГ П. К. Яворов", "ПГ Пейо К. Яворов"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPeshtera() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1300034", new String[]{"0", "ОУ П. Р. Славейков", "ОУ Петко Рачов Славейков"});
        schoolCodes.put("1301329", new String[]{"0", "НУ Михаил Каролиди", "НУ Михаил Каролиди"});
        schoolCodes.put("1301343", new String[]{"0", "НУ Михаил Куманов", "НУ Михаил Куманов"});
        schoolCodes.put("1301763", new String[]{"0", "ОУ Патр. Евтимий", "ОУ Св. Патриарх Евтимий"});
        schoolCodes.put("1302630", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("1304357", new String[]{"0", "ОбУ Л. Каравелов", "ОбУ Любен Каравелов"});
        schoolCodes.put("1302819", new String[]{"0", "ПГ по хран.-вк. техн.", "ПГ по хран.-вк. технологии"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPomorie() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200703", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("200711", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV});
        schoolCodes.put("200712", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPopovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2540101", new String[]{"0", "ОУ Н. Вапцаров", "ОУ Никола Вапцаров"});
        schoolCodes.put("2540102", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("2540103", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("2540401", new String[]{"0", PG_HRISTO_BOTEV, PG_HRISTO_BOTEV});
        schoolCodes.put("2540601", new String[]{"0", "ПГ по техника", "ПГ по техника"});
        schoolCodes.put("2540602", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPravets() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2309862", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("2304770", new String[]{"0", "ГПЧЕ", "ГПЧЕ Алеко Константинов"});
        schoolCodes.put("2309991", new String[]{"0", "НПГ по КТС", "НПГ по КТС"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRadomir() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1403648", new String[]{"0", "НУ Арх. Зиновий", "НУ Архимандрит Зиновий"});
        schoolCodes.put("1403650", new String[]{"0", "ОУ Хр. Смирненски", "ОУ Христо Смирненски"});
        schoolCodes.put("1403655", new String[]{"0", SU_KIRIL_I_METODII_SHORT, SU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1403656", new String[]{"0", "Техническа ПГ", "Техническа ПГ Никола Вапцаров"});
        schoolCodes.put("1403657", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRakovski() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1602502", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("1602503", new String[]{"0", "ОУ Хр. Смирненски", "ОУ Христо Смирненски"});
        schoolCodes.put("1602511", new String[]{"0", "ПГ Петър Парчевич", "ПГ Петър Парчевич"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSamokov() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2300131", new String[]{"0", "ПГ К. Фотинов", "ПГ Константин Фотинов"});
        schoolCodes.put("2301881", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("2303106", new String[]{"0", "СУ Отец Паисий", "СУ Отец Паисий"});
        schoolCodes.put("2304610", new String[]{"0", "СпУ Никола Велчев", "Спортно у-ще Никола Велчев"});
        schoolCodes.put("2308917", new String[]{"0", "ОУ А. Велешки", "ОУ Митрополит Авксентий Велешки"});
        schoolCodes.put("2308924", new String[]{"0", "ОУ Х. Максимов", "ОУ Х. Максимов"});
        schoolCodes.put("2303825", new String[]{"0", "ОбУ Неофит Рилски", "ОбУ Неофит Рилски"});
        schoolCodes.put("2308899", new String[]{"0", "НУ С. Доспевски", "НУ Станислав Доспевски"});
        schoolCodes.put("2300291", new String[]{"0", "ПТГ Н. Вапцаров", "ПТГ Никола Вапцаров"});
        schoolCodes.put("2300505", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSandanski() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("104104", new String[]{"0", "1 ОУ", "1 ОУ Св. Климент Охридски"});
        schoolCodes.put("102606", new String[]{"0", "2 ОУ", "2 ОУ Христо Смирненски"});
        schoolCodes.put("104106", new String[]{"0", "3 ОУ", "3 ОУ Христо Ботев"});
        schoolCodes.put("104107", new String[]{"0", "4 ОУ", "4 ОУ Св. Св. Козма и Дамян"});
        schoolCodes.put("109185", new String[]{"0", "Спортно у-ще", "Спортно училище"});
        schoolCodes.put("102007", new String[]{"0", "Техническа гимн.", "Професионална техническа гимназия"});
        schoolCodes.put("102013", new String[]{"0", "Земеделска гимн.", "Земеделска професионална гимназия"});
        schoolCodes.put("104101", new String[]{"0", "ПГ Яне Сандански", "ПГ Яне Сандански"});
        schoolCodes.put("108021", new String[]{"0", "Вечерна гимн.", "Вечерна профилирана гимназия"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSvilengrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2605001", new String[]{"0", "НУ Хр. Попмарков", "НУ Христо Попмарков"});
        schoolCodes.put("2605002", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});
        schoolCodes.put("2605003", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("2605008", new String[]{"0", "СУ Петър Берон", "СУ Д-р Петър Берон"});
        schoolCodes.put("2605016", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSvishtov() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("300801", new String[]{"0", "ОУ Ф. Сакелариевич", "ОУ Филип Сакелариевич"});
        schoolCodes.put("300814", new String[]{"0", "СУ Цв. Радославов", "СУ Цветан Радославов"});
        schoolCodes.put("300815", new String[]{"0", "СУ Н. Катранов", "СУ Николай Катранов"});
        schoolCodes.put("300816", new String[]{"0", "СУ Д. Благоев", "СУ Димитър Благоев"});
        schoolCodes.put("300817", new String[]{"0", "Търговска гимн.", "ПДТГ Димитър Хадживасилев"});
        schoolCodes.put("300819", new String[]{"0", "ПГ Ал. Константинов", "Свищовска ПГ Алеко Константинов"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSvoge() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2304051", new String[]{"0", "НУ Петър Берон", "НУ Д-р Петър Берон"});
        schoolCodes.put("2308867", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV});
        schoolCodes.put("2303022", new String[]{"0", "ПГ Велизар Пеев", "ПГ Велизар Пеев"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSevlievo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("700307", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV});
        schoolCodes.put("700308", new String[]{"0", "ОУ Стефан Пешев", "ОУ Стефан Пешев"});
        schoolCodes.put("700318", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI});
        schoolCodes.put("700323", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника"});
        schoolCodes.put("700330", new String[]{"0", "ПГ Марин Попов", "ПГ Марин Попов"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesTroyan() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1100601", new String[]{"0", "ОУ Иван Хаджийски", "ОУ Иван Хаджийски"});
        schoolCodes.put("1100612", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI});
        schoolCodes.put("1100613", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("1100614", new String[]{"0", NU_KIRIL_I_METODII_SHORT, NU_KIRIL_I_METODII_LONG});
        schoolCodes.put("1100615", new String[]{"0", NU_HRISTO_BOTEV, NU_HRISTO_BOTEV});
        schoolCodes.put("2902502", new String[]{"0", "НУПИ Венко Колев", "НУПИ Проф. Венко Колев"});
        schoolCodes.put("1100616", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesHarmanli() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2603001", new String[]{"0", "НУ Отец Паисий", "НУ Отец Паисий"});
        schoolCodes.put("2603002", new String[]{"0", "НУ А. Константинов", "НУ Алеко Константинов"});
        schoolCodes.put("2603007", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});
        schoolCodes.put("2603008", new String[]{"0", "СУ Неофит Рилски", "СУ Неофит Рилски"});
        schoolCodes.put("2603009", new String[]{"0", "ПГ по електропром.", "ПГ по електропромишленост"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesChirpan() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2401178", new String[]{"0", SU_PEIO_YAVOROV_SHORT, SU_PEIO_YAVOROV_LONG});
        schoolCodes.put("2401181", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("2401182", new String[]{"0", OU_KIRIL_I_METODII_SHORT, OU_KIRIL_I_METODII_LONG});
        schoolCodes.put("2401189", new String[]{"0", NU_KLIMENT_OHRIDSKI_SHORT, NU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("2401179", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG});

        return schoolCodes;
    }
}
