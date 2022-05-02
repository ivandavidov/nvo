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
        schoolCodes.put("_", new String[] {"0", "_", "_"});

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
}
