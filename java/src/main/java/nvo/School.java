package nvo;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class School implements Comparable<School> {
    private static final Map<String, String[]> schoolCodes = prepareSchoolCodes();

    String label;
    String name;
    String code;
    List<Double> first = new ArrayList<>();
    List<Double> second = new ArrayList<>();

    public School() {}

    public boolean isPrivate() {
        return schoolCodes.containsKey(code) && schoolCodes.get(code)[0].equals("1");
    }

    public String getLabel() {
        return schoolCodes.containsKey(code) ? schoolCodes.get(code)[1] : code + ": " + label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getName() {
        return schoolCodes.containsKey(code) ? schoolCodes.get(code)[2] : name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public List<Double> getFirst() {
        return first;
    }

    public void setFirst(List<Double> first) {
        this.first = first;
    }

    public List<Double> getSecond() {
        return second;
    }

    public void setSecond(List<Double> second) {
        this.second = second;
    }

    public double calculateMedian() {
        double medianFirst = 0.0d;
        double medianSecond = 0.0d;
        int numYears = 3;
        int dividerFirst = numYears;
        int dividerSecond = numYears;

        for(int i = 1; i <=numYears; i++ ) {
            int index = first.size() - i;
            if(first.get(index) == 0.0d) {
                --dividerFirst;
            } else {
                medianFirst += first.get(index);
            }
            if(second.get(index) == 0.0d) {
                --dividerSecond;
            } else {
                medianSecond += second.get(index);
            }
        }

        medianFirst = dividerFirst > 0 ? medianFirst / dividerFirst : 0.0d;
        medianSecond = dividerSecond > 0 ? medianSecond / dividerSecond : 0.0d;

        return (medianFirst + medianSecond) / 2d;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        School school = (School) o;
        return label.equals(school.label) &&
                name.equals(school.name) &&
                code.equals(school.code) &&
                first.equals(school.first) &&
                second.equals(school.second);
    }

    @Override
    public int hashCode() {
        return Objects.hash(label, name, first, second, code);
    }

    @Override
    public String toString() {
        return "School {" +
                "code='" + code + '\'' +
                ", label='" + label + '\'' +
                ", name='" + name + '\'' +
                ", first=" + first +
                ", second=" + second +
                '}';
    }

    @Override
    public int compareTo(School o) {
        return calculateMedian() < o.calculateMedian() ? 1 : -1;
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
        schoolCodes.put("2211420", new String[] {"0", "Финансово-стопанска гимназия", "Финансово-стопанска гимназия"});
        schoolCodes.put("2221157", new String[] {"0", "157 СУ", "157 СУ Сесар Вайехо"});
        schoolCodes.put("2224433", new String[] {"0", "Търговско-банкова гимназия", "Търговско-банкова гимназия"});
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
        schoolCodes.put("2216423", new String[] {"0", "ПГ по туризъм", "ПГ по туризъм"});
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
        schoolCodes.put("2220014", new String[] {"0", "14 СУ", "69 СУ Проф. Д-р Асен Златаров"});
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
        schoolCodes.put("2217426", new String[] {"0", "ПГ по с. стоп.", "ПГ по селско стопанство"});
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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPlovdiv() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1690150", new String[]{"0", "СУ Любен Каравелов", "СУ Любен Каравелов"});
        schoolCodes.put("1690153", new String[]{"0", "Хуманитарна гимназия", "Хуманитарна гимназия Св. Св. Кирил и Методий"});
        schoolCodes.put("1690154", new String[]{"0", "СУ Св. П. Хилендарски", "СУ Св. П. Хилендарски"});
        schoolCodes.put("1690155", new String[]{"0", "СУ Св. Климент Охридски", "СУ Св. Климент Охридски"});
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
        schoolCodes.put("1690345", new String[]{"0", "СУ Св. Св. Кирил и Методий", "СУ Св. Св. Кирил и Методий"});
        schoolCodes.put("1690346", new String[]{"0", "МГ Акад. Кирил Попов", "МГ Акад. Кирил Попов"});
        schoolCodes.put("1690347", new String[]{"0", "Сп. у-ще Васил Левски", "Спортно училище Васил Левски"});
        schoolCodes.put("1690446", new String[]{"0", "СУ Никола Вапцаров", "СУ Никола Вапцаров"});
        schoolCodes.put("1690447", new String[]{"0", "СУ Пейо Яворов", "СУ Пейо Крачолов Яворов"});
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
        schoolCodes.put("400037", new String[]{"0", "СУ Л. Каравелов", "СУ Л. Каравелов"});
        schoolCodes.put("400039", new String[]{"0", "СУ Пейо К. Яворов", "СУ Пейо К. Яворов"});
        schoolCodes.put("400040", new String[]{"0", "СУ Св. Климент Охридски", "СУ Св. Климент Охридски"});
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
        schoolCodes.put("403564", new String[]{"0", "Монтесори", "ЧСУ Монтесори"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBurgas() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200221", new String[]{"0", "СУ Христо Ботев", "СУ Христо Ботев"});
        schoolCodes.put("200227", new String[]{"0", "СУ Иван Вазов", "СУ Иван Вазов"});
        schoolCodes.put("200228", new String[]{"0", "СУ Йордан Йовков", "СУ Йордан Йовков"});
        schoolCodes.put("200229", new String[]{"0", "СУ Еп. К. Преславски", "СУ Еп. К. Преславски"});
        schoolCodes.put("200230", new String[]{"0", "СУ Димчо Дебелянов", "СУ Димчо Дебелянов"});
        schoolCodes.put("200231", new String[]{"0", "СУ Добри Чинтулов", "СУ Добри Чинтулов"});
        schoolCodes.put("200232", new String[]{"0", "СУ Конст. Петканов", "СУ Константин Петканов"});
        schoolCodes.put("200233", new String[]{"0", "СУ Петко Росен", "СУ Петко Росен"});
        schoolCodes.put("200234", new String[]{"0", "СУ Св. Св. Кирил и Методий", "СУ Св. Св. Кирил и Методий"});
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
        schoolCodes.put("101880", new String[]{"0", "СУ Иван Вазов", "СУ Иван Вазов"});
        schoolCodes.put("102060", new String[]{"0", "СУ Г. Измирлиев", "5 СУ Георги Измирлиев"});
        schoolCodes.put("109174", new String[]{"1", "Димитър и Йоан", "ЧСУ Димитър и Йоан"});

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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVidin() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("500102", new String[]{"0", "ППМГ", "ППМГ Екзарх Антим I"});
        schoolCodes.put("500108", new String[]{"0", "ПТГ", "ПТГ Васил Левски"});
        schoolCodes.put("500110", new String[]{"0", "ПГТ", "ПГТ Михалаки Георгиев"});
        schoolCodes.put("502035", new String[]{"0", "ПГ А. Златаров", "ПГ Проф. д-р Асен Златаров"});
        schoolCodes.put("503132", new String[]{"0", "СУ Цар Симеон", "СУ Цар Симеон Велики"});
        schoolCodes.put("503241", new String[]{"0", "СУ Кирил и Методий", "СУ Св. Св. Кирил и Методий"});
        schoolCodes.put("503242", new String[]{"0", "СУ П. Славейков", "СУ Петко Рачов Славейков"});
        schoolCodes.put("503322", new String[]{"0", "ГПЧЕ", "ГПЧЕ Йордан Радичков"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVraca() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("600061", new String[]{"0", "ЕГ", "Профилирана ЕГ Йоан Екзарх"});
        schoolCodes.put("600327", new String[]{"0", "СУ Козма Тричков", "СУ Козма Тричков"});
        schoolCodes.put("602062", new String[]{"0", "ППМГ", "ППМГ Акад. Иван Ценов"});
        schoolCodes.put("603057", new String[]{"0", "СУ Отец Паисий", "СУ Отец Паисий"});
        schoolCodes.put("603058", new String[]{"0", "СУ Христо Ботев", "СУ Христо Ботев"});
        schoolCodes.put("603059", new String[]{"0", "СУ Васил Кънчов", "СУ Васил Кънчов"});
        schoolCodes.put("603065", new String[]{"0", "Техническа гимназия", "Професионална техническа гимназия"});
        schoolCodes.put("603067", new String[]{"0", "ПГ по търговия", "ПГ по търговия и ресторантьорство"});
        schoolCodes.put("603070", new String[]{"0", "СУ Никола Войводов", "СУ Никола Войводов"});
        schoolCodes.put("603071", new String[]{"0", "ПГ Д. Хаджитошин", "ПГ Димитраки Хаджитошин"});
        schoolCodes.put("603140", new String[]{"0", "СУ Мито Орозов", "СУ Мито Орозов"});
        schoolCodes.put("608060", new String[]{"0", "Спортно у-ще", "Спортно у-ще Св. Климент Охридски"});

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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDobrich() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("800013", new String[]{"0", "СУ Димитър Талев", "СУ Димитър Талев"});
        schoolCodes.put("800015", new String[]{"0", "СУ Св. Климент Охридски", "СУ Св. Климент Охридски"});
        schoolCodes.put("800016", new String[]{"0", "СУ Любен Каравелов", "СУ Любен Каравелов"});
        schoolCodes.put("800017", new String[]{"0", "СУ Петко Славейков", "СУ Петко Славейков"});
        schoolCodes.put("800018", new String[]{"0", "СУ Кирил и Методий", "СУ Св. Св. Кирил и Методий"});
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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKiustendil() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1000002", new String[]{"0", "ПГ по с. стоп.", "ПГ по селско стопанство"});
        schoolCodes.put("1000540", new String[]{"0", "ЕГ", "ЕГ Д-р Петър Берон"});
        schoolCodes.put("1000550", new String[]{"0", "ПМГ", "ПМГ Проф. Емануил Иванов"});
        schoolCodes.put("1001360", new String[]{"0", "Техн. гимназия", "Професионална техническа гимназия"});
        schoolCodes.put("1001380", new String[]{"0", "ПГ по икономика", "ПГ по икономика и мениджмънт"});
        schoolCodes.put("1001390", new String[]{"0", "Спортно у-ще", "Спортно у-ще Васил Левски"});
        schoolCodes.put("1001420", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Н. Вапцаров"});
        schoolCodes.put("1001670", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост"});

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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesLovetch() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1100316", new String[]{"0", "СУ Тодор Кирков", "СУ Тодор Кирков"});
        schoolCodes.put("1100318", new String[]{"0", "СУ Св. Кл. Охридски", "СУ Св. Климент Охридски"});
        schoolCodes.put("1100320", new String[]{"0", "ППМГ", "ППМГ"});
        schoolCodes.put("1100322", new String[]{"0", "ПГ по механ.", "ПГ по механоелектротехника"});
        schoolCodes.put("1100324", new String[]{"0", "СУ Димитър Митев", "СУ Димитър Митев"});
        schoolCodes.put("1100328", new String[]{"0", "ЕГ", "Профилирана ЕГ Екзарх Йосиф I"});
        schoolCodes.put("1100329", new String[]{"0", "ПГ по вет. медицина", "Национална ПГ по ветеринарна медицина"});
        schoolCodes.put("1100331", new String[]{"0", "ПГ по икономика", "ПГ по икономика, търговия и услуги"});

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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPazardzhik() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1301139", new String[]{"0", "ПГ по икономика", "ПГ по икономика и мениджмънт"});
        schoolCodes.put("1301234", new String[]{"0", "СУ Димитър Гачев", "СУ Димитър Гачев"});
        schoolCodes.put("1301911", new String[]{"0", "ПГ по с. стопанство", "ПГ по селско стопанство"});
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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPernik() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1403213", new String[]{"0", "5 СУ", "5 СУ Петко Славейков"});
        schoolCodes.put("1403214", new String[]{"0", "6 СУ", "6 СУ Св. Св. Кирил и Методий"});
        schoolCodes.put("1403216", new String[]{"0", "СУРИЧЕ", "СУРИЧЕ Д-р Петър Берон"});
        schoolCodes.put("1403217", new String[]{"0", "Спортно у-ще", "Спортно у-ще Олимпиец"});
        schoolCodes.put("1403219", new String[]{"0", "ПМГ", "ПМГ Хрристо Смирненски"});
        schoolCodes.put("1403220", new String[]{"0", "ГПЧЕ", "ГПЧЕ Симеон Радев"});
        schoolCodes.put("1403233", new String[]{"0", "ПГ по енергетика", "ПГ по енергетика и минна промишленост"});
        schoolCodes.put("1403234", new String[]{"0", "ПГ по техника", "ПГ по техника и строителство"});
        schoolCodes.put("1403235", new String[]{"0", "ПГ Мария Кюри", "Технологична ПГ Мария Кюри"});
        schoolCodes.put("1403236", new String[]{"0", "ПГ по икономика", "ПГ по икономика"});
        schoolCodes.put("1403237", new String[]{"0", "ПГ по облекло", "Професионална гимназия по облекло и туризъм"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPleven() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1500130", new String[]{"0", "МГ Гео Милев", "МГ Гео Милев"});
        schoolCodes.put("1500131", new String[]{"0", "ГПЧЕ", "ГПЧЕ"});
        schoolCodes.put("1500132", new String[]{"0", "СУ А. Димитрова", "СУ Анастасия Димитрова"});
        schoolCodes.put("1500133", new String[]{"0", "СУ Стоян Заимов", "СУ Стоян Заимов"});
        schoolCodes.put("1500134", new String[]{"0", "СУ Иван Вазов", "СУ Иван Вазов"});
        schoolCodes.put("1500135", new String[]{"0", "СУ Пейо Яворов", "СУ Пейо Яворов"});
        schoolCodes.put("1500136", new String[]{"0", "СУ Х. Смирненски", "Средно училище Христо Смирненски"});
        schoolCodes.put("1500138", new String[]{"0", "Спортно у-ще", "Спортно у-ще Георги Бенковски"});
        schoolCodes.put("1500140", new String[]{"0", "Финансово-стопанска", "Държавна финансово-стопанска гимназия"});
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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRazgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1702601", new String[]{"0", "ПГ по икономика", "ПГ по икономика Робер Шуман"});
        schoolCodes.put("1702602", new String[]{"0", "Техническа гимназия", "Национална професионална техническа гимназия"});
        schoolCodes.put("1702603", new String[]{"0", "ПГ по хим. техн.", "ПГ по химични технологии и биотехнологии"});
        schoolCodes.put("1702604", new String[]{"0", "ПГ по с. стоп.", "ПГ по селско стопанство и хранително-вкусови технологии"});
        schoolCodes.put("1702607", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт и строителство"});
        schoolCodes.put("1702608", new String[]{"0", "ГПЧЕ", "ГПЧЕ Екзарх Йосиф"});
        schoolCodes.put("1702609", new String[]{"0", "ППМГ", "ППМГ Акад. Никола Обрешков"});
        schoolCodes.put("1702612", new String[]{"0", "СУ Христо Ботев", "СУ Христо Ботев"});
        schoolCodes.put("1702629", new String[]{"0", "ПГ по облекло", "ПГ по облекло"});
        schoolCodes.put("1702640", new String[]{"0", "Спортно у-ще", "Спортно у-ще - Разград"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRuse() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1806201", new String[]{"0", "АЕГ Гео Милев", "Английска ЕГ Гео Милев"});
        schoolCodes.put("1806202", new String[]{"0", "МГ Баба Тонка", "МГ Баба Тонка"});
        schoolCodes.put("1806203", new String[]{"0", "СУ за европ. езици", "СУ за европейски езици"});
        schoolCodes.put("1806204", new String[]{"0", "СУ Фридрих Шилер", "СУ с немски език Фридрих Шилер"});
        schoolCodes.put("1806206", new String[]{"0", "СУ Йордан Йовков", "СУ Йордан Йовков"});
        schoolCodes.put("1806207", new String[]{"0", "СУ Христо Ботев", "СУ Христо Ботев"});
        schoolCodes.put("1806208", new String[]{"0", "СУ Възраждане", "СУ Възраждане"});
        schoolCodes.put("1806209", new String[]{"0", "СУ Васил Левски", "СУ Васил Левски"});
        schoolCodes.put("1806210", new String[]{"0", "Духовно училище", "Духовно училище"});
        schoolCodes.put("1806213", new String[]{"1", "Леонардо да Винчи", "Първо ЧСУ Леонардо да Винчи"});
        schoolCodes.put("1806215", new String[]{"1", "Джордж Байрон", "ЧПАГ Джордж Байрон"});
        schoolCodes.put("1806301", new String[]{"0", "ПГ по електрот.", "ПГ по електротехника и електроника"});
        schoolCodes.put("1806302", new String[]{"0", "ПГ по дървообр.", "ПГ по дървообработване и вътрешна архитектура"});
        schoolCodes.put("1806305", new String[]{"0", "ПГ по с. стоп.", "ПГ по селско стопанство"});
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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSliven() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2000105", new String[]{"0", "СУ Х. Мина Пашов", "СУ Хаджи Мина Пашов"});
        schoolCodes.put("2000109", new String[]{"0", "СУ Пейо Яворов", "СУ Пейо Яворов"});
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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSmolyan() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2100103", new String[]{"0", "СУ Кирил и Методий", "СУ Св. Св. Кирил и Методий"});
        schoolCodes.put("2100105", new String[]{"0", "СУ Отец Паисий", "СУ Отец Паисий"});
        schoolCodes.put("2100111", new String[]{"0", "ПГ по техника", "ПГ по техника и технологии"});
        schoolCodes.put("2100113", new String[]{"0", "ПГ по икономика", "Професионална гимназия по икономика"});
        schoolCodes.put("2100115", new String[]{"0", "ПГ по туризъм", "Смолянска ПГ по туризъм и строителство"});
        schoolCodes.put("2103321", new String[]{"0", "ППМГ", "ППМГ Васил Левски"});
        schoolCodes.put("2103331", new String[]{"0", "ЕГ Иван Вазов", "ЕГ Иван Вазов"});
        schoolCodes.put("2902506", new String[]{"0", "ПГ за прил. изк.", "ПГ за приложни изкуства"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesStaraZagora() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2400014", new String[]{"0", "СУ Железник", "СУ Железник"});
        schoolCodes.put("2400102", new String[]{"0", "ППМГ Гео Милев", "ППМГ Гео Милев"});
        schoolCodes.put("2400104", new String[]{"0", "СУ Васил Левски", "СУ Васил Левски"});
        schoolCodes.put("2400105", new String[]{"0", "СУ Хр. Смирненски", "СУ Христо Смирненски"});
        schoolCodes.put("2400106", new String[]{"0", "СУ Максим Горки", "СУ Максим Горки"});
        schoolCodes.put("2400107", new String[]{"0", "СУ Иван Вазов", "СУ Иван Вазов"});
        schoolCodes.put("2400108", new String[]{"0", "Спортно у-ще", "Спортно у-ще Тодор Каблешков"});
        schoolCodes.put("2400110", new String[]{"0", "Вечерно СУ", "Вечерно СУ Захари Стоянов"});
        schoolCodes.put("2400111", new String[]{"0", "ПГ по механот.", "ПГ по механотехника и транспорт"});
        schoolCodes.put("2400112", new String[]{"0", "ПГ по електрот.", "ПГ по електротехника и технологии"});
        schoolCodes.put("2400116", new String[]{"0", "ПГ по вет. медицина", "Национална ПГ по ветеринарна медицина"});
        schoolCodes.put("2400117", new String[]{"0", "ПГ по електроника", "ПГ по електроника"});
        schoolCodes.put("2400119", new String[]{"0", "ПГ по строит и дърв.", "ПГ по строителство и дървообработване"});
        schoolCodes.put("2400121", new String[]{"0", "СУ Минчо Кънчев", "СУ Поп Минчо Кънчев"});
        schoolCodes.put("2400165", new String[]{"0", "ПГ по облекло", "ПГ по облекло и хранене"});
        schoolCodes.put("2400174", new String[]{"0", "СУ Христо Ботев", "СУ Христо Ботев"});
        schoolCodes.put("2402016", new String[]{"0", "Търговска гимназия", "Търговска гимназия Княз Симеон Търновски"});
        schoolCodes.put("2402131", new String[]{"0", "ПГ по строит., арх. и геод.", "ПГ по строителство, архитектура и геодезия"});
        schoolCodes.put("2403264", new String[]{"0", "ГПЧЕ Ромен Ролан", "ГПЧЕ Ромен Ролан"});
        schoolCodes.put("2902104", new String[]{"0", "НУМСИ", "НУМСИ Христина Морфова"});

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

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesHaskovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2601025", new String[]{"0", "СУ Васил Левски", "СУ Васил Левски"});
        schoolCodes.put("2601026", new String[]{"0", "СУ П. Хилендарски", "СУ Св. Паисий Хилендарски"});
        schoolCodes.put("2601027", new String[]{"0", "Спортно у-ще", "Спортно у-ще Стефан Караджа"});
        schoolCodes.put("2601028", new String[]{"0", "ЕГ", "ЕГ Проф. д-р Асен Златаров"});
        schoolCodes.put("2601029", new String[]{"0", "ПМГ", "ПМГ Акад. Боян Петканчин"});
        schoolCodes.put("2601031", new String[]{"0", "Фин.-стопанска", "Финансово-стопанска гимназия Атанас Буров"});
        schoolCodes.put("2601032", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Александър Паскалев"});
        schoolCodes.put("2601034", new String[]{"0", "ПГ по дървообр.", "ПГ по дървообработване и строителство"});
        schoolCodes.put("2601035", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост Райна Княгиня"});
        schoolCodes.put("2601036", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника"});
        schoolCodes.put("2601904", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт и аграрни технологии"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesShumen() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2700006", new String[]{"0", "ПГ по строителство", "ПГ по строителство, архитектура и геодезия"});
        schoolCodes.put("2700011", new String[]{"0", "ПГ по икономика", "ПГ по икономика"});
        schoolCodes.put("2700031", new String[]{"0", "ПГ по облекло", "ПГ по облекло, хранене и химични технологии"});
        schoolCodes.put("2700064", new String[]{"0", "ПГ по с. стоп.", "ПГ по селско стопанство и хранителни технологии"});
        schoolCodes.put("2700076", new String[]{"0", "СУ Панайот Волов", "СУ Панайот Волов"});
        schoolCodes.put("2700083", new String[]{"0", "ЕГ Н. Вапцаров", "ЕГ Никола Йонков Вапцаров"});
        schoolCodes.put("2700147", new String[]{"0", "СУ Трайко Симеонов", "СУ Трайко Симеонов"});
        schoolCodes.put("2700182", new String[]{"0", "СУ Йоан Екзарх", "СУ Йоан Екзарх Български"});
        schoolCodes.put("2700197", new String[]{"0", "СУ С. Доброплодни", "СУ Сава Доброплодни"});
        schoolCodes.put("2700217", new String[]{"0", "Духовно училище", "Духовно училище Нювваб"});
        schoolCodes.put("2700221", new String[]{"0", "ППМГ", "ППМГ Нанчо Попович"});
        schoolCodes.put("2700231", new String[]{"0", "СУ Васил Левски", "СУ Васил Левски"});
        schoolCodes.put("2707033", new String[]{"0", "ПГ по механот.", "ПГ по механот., електр., телеком. и транспорт"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesIambol() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2811510", new String[]{"0", "СУ Св. Кл. Охридски", "СУ Св. Климент Охридски"});
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

        return schoolCodes;
    }
}
