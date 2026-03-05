package nvo;

import java.util.List;

final class Cities {
    record City(String fullName, String shortName, String hrefName, int orderPosition, int i) {}

    private static int NEXT_INDEX = 0;

    static final List<City> ORDERED = List.of(
            city("София", "sofia", "София", 1),
            city("Пловдив", "plovdiv", "Пловдив", 1),
            city("Варна", "varna", "Варна", 1),
            city("Бургас", "burgas", "Бургас", 1),

            city("Благоевград", "blagoevgrad", "Благоевград", 2),
            city("Велико Търново", "veliko-turnovo", "В. Търново", 2),
            city("Видин", "vidin", "Видин", 2),
            city("Враца", "vratsa", "Враца", 2),
            city("Габрово", "gabrovo", "Габрово", 2),
            city("Добрич", "dobrich", "Добрич", 2),
            city("Кърджали", "kurdzhali", "Кърджали", 2),
            city("Кюстендил", "kiustendil", "Кюстендил", 2),
            city("Ловеч", "lovech", "Ловеч", 2),
            city("Монтана", "montana", "Монтана", 2),
            city("Пазарджик", "pazardzhik", "Пазарджик", 2),
            city("Перник", "pernik", "Перник", 2),
            city("Плевен", "pleven", "Плевен", 2),
            city("Разград", "razgrad", "Разград", 2),
            city("Русе", "ruse", "Русе", 2),
            city("Силистра", "silistra", "Силистра", 2),
            city("Сливен", "sliven", "Сливен", 2),
            city("Смолян", "smolian", "Смолян", 2),
            city("Стара Загора", "stara-zagora", "Ст. Загора", 2),
            city("Търговище", "turgovishte", "Търговище", 2),
            city("Хасково", "haskovo", "Хасково", 2),
            city("Шумен", "shumen", "Шумен", 2),
            city("Ямбол", "iambol", "Ямбол", 2),

            city("Айтос", "aitos", "Айтос", 3),
            city("Асеновград", "asenovgrad", "Асеновград", 3),
            city("Балчик", "balchik", "Балчик", 3),
            city("Банкя", "bankiq", "Банкя", 3),
            city("Банско", "bansko", "Банско", 3),
            city("Берковица", "berkovitsa", "Берковица", 3),
            city("Ботевград", "botevgrad", "Ботевград", 3),
            city("Велинград", "velingrad", "Велинград", 3),
            city("Горна Оряховица", "gorna-oryahovitsa", "Г. Оряховица", 3),
            city("Гоце Делчев", "gotse-delchev", "Гоце Делчев", 3),
            city("Димитровград", "dimitrovgrad", "Димитровград", 3),
            city("Дупница", "dupnitsa", "Дупница", 3),
            city("Ихтиман", "ihtiman", "Ихтиман", 3),
            city("Каварна", "kavarna", "Каварна", 3),
            city("Казанлък", "kazanluk", "Казанлък", 3),
            city("Карлово", "karlovo", "Карлово", 3),
            city("Карнобат", "karnobat", "Карнобат", 3),
            city("Козлодуй", "kozlodui", "Козлодуй", 3),
            city("Костинброд", "kostinbrod", "Костинброд", 3),
            city("Лом", "lom", "Лом", 3),
            city("Луковит", "lukovit", "Луковит", 3),
            city("Несебър", "nesebar", "Несебър", 3),
            city("Нова Загора", "nova-zagora", "Нова Загора", 3),
            city("Нови Искър", "novi-iskar", "Нови Искър", 3),
            city("Нови пазар", "novi-pazar", "Нови пазар", 3),
            city("Обзор", "obzor", "Обзор", 3),
            city("Панагюрище", "panagiurishte", "Панагюрище", 3),
            city("Петрич", "petrich", "Петрич", 3),
            city("Пещера", "peshtera", "Пещера", 3),
            city("Поморие", "pomorie", "Поморие", 3),
            city("Попово", "popovo", "Попово", 3),
            city("Правец", "pravets", "Правец", 3),
            city("Провадия", "provadia", "Провадия", 3),
            city("Първомай", "purvomai", "Първомай", 3),
            city("Раднево", "radnevo", "Раднево", 3),
            city("Радомир", "radomir", "Радомир", 3),
            city("Разлог", "razlog", "Разлог", 3),
            city("Раковски", "rakovski", "Раковски", 3),
            city("Самоков", "samokov", "Самоков", 3),
            city("Сандански", "sandanski", "Сандански", 3),
            city("Свиленград", "svilengrad", "Свиленград", 3),
            city("Свищов", "svishtov", "Свищов", 3),
            city("Своге", "svoge", "Своге", 3),
            city("Севлиево", "sevlievo", "Севлиево", 3),
            city("Стамболийски", "stanbiliiski", "Стамболийски", 3),
            city("Троян", "troyan", "Троян", 3),
            city("Харманли", "harmanli", "Харманли", 3),
            city("Червен бряг", "cherven-briag", "Червен бряг", 3),
            city("Чирпан", "chirpan", "Чирпан", 3)
    );

    private static City city(String fullName, String hrefName, String shortName, int orderPosition) {
        return new City(fullName, shortName, hrefName, orderPosition, NEXT_INDEX++);
    }

    private Cities() {
    }
}
