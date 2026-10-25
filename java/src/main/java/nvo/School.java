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

    public static final String NU_ALEKO_KONSTANTINOV_SHORT = "НУ А. Константинов";
    public static final String NU_ALEKO_KONSTANTINOV_LONG = "НУ Алеко Константинов";
    public static final String NU_ZINOVII_SHORT = "НУ Арх. Зиновий";
    public static final String NU_ZINOVII_LONG = "НУ Архимандрит Зиновий";
    public static final String NU_VASIL_DRUMEV = "НУ Васил Друмев";
    public static final String NU_VASIL_LEVSKI = "НУ Васил Левски";
    public static final String NU_GEORGI_SAVA_RAKOVSKI = "НУ Георги Раковски";
    public static final String NU_PETAR_BERON_SHORT = "НУ Петър Берон";
    public static final String NU_PETAR_BERON_LONG = "НУ Д-р Петър Берон";
    public static final String NU_DIMITAR_BLAGOEV = "НУ Димитър Благоев";
    public static final String NU_EDINSTVO = "НУ Единство";
    public static final String NU_ZAHARI_STOYANOV = "НУ Захари Стоянов";
    public static final String NU_ZORA = "НУ Зора";
    public static final String NU_IVAN_VAZOV = "НУ Иван Вазов";
    public static final String NU_ILARION_MAKARIOPOLSKI_SHORT = "НУ И. Макариополски";
    public static final String NU_ILARION_MAKARIOPOLSKI_LONG = "НУ Иларион Макариополски";
    public static final String NU_ILIYA_BLASKOV = "НУ Илия Блъсков";
    public static final String NU_GEORGI_VALKOV_SHORT = "НУ Георги Вълков";
    public static final String NU_GEORGI_VALKOV_LONG = "НУ Инж. Георги Вълков";
    public static final String NU_KIRIL_I_METODII = "НУ Кирил и Методий";
    public static final String NU_KLIMENT_OHRIDSKI_SHORT = "НУ Кл. Охридски";
    public static final String NU_KLIMENT_OHRIDSKI_LONG = "НУ Климент Охридски";
    public static final String NU_KNEZHITSA = "НУ Кнежица";
    public static final String OU_KOLO_GANCHEV = "ОУ Кольо Ганчев";
    public static final String NU_LIUBEN_KARAVELOV_SHORT = "НУ Л. Каравелов";
    public static final String NU_LIUBEN_KARAVELOV_LONG = "НУ Любен Каравелов";
    public static final String NU_MIHAIL_KAROLIDI = "НУ Михаил Каролиди";
    public static final String NU_MIHAIL_KUMANOV = "НУ Михаил Куманов";
    public static final String NU_NEDELYA_PETKOVA = "НУ Неделя Петкова";
    public static final String NU_NIKOLA_FURNADZHIEV_SHORT = "НУ Н. Фурнаджиев";
    public static final String NU_NIKOLA_FURNADZHIEV_LONG = "НУ Никола Фурнаджиев";
    public static final String NU_OTEC_PAISII = "НУ Отец Паисий";
    public static final String NU_PAISII_HILENDARSKI_SHORT = "НУ П. Хилендарски";
    public static final String NU_PAISII_HILENDARSKI_LONG = "НУ Паисий Хилендарски";
    public static final String NU_EVTIMII_SHORT = "НУ Патр. Евтимий";
    public static final String NU_EVTIMII_LONG = "НУ Патриарх Евтимий";
    public static final String NU_PETAR_NOIKOV_SHORT = "НУ Петър Нойков";
    public static final String NU_PETAR_NOIKOV_LONG = "НУ Проф. Петър Нойков";
    public static final String NU_STANISLAV_DOSPEVSKI_SHORT = "НУ Стан. Доспевски";
    public static final String NU_STANISLAV_DOSPEVSKI_LONG = "НУ Станислав Доспевски";
    public static final String NU_TODOR_VLAIKOV = "НУ Тодор Влайков";
    public static final String NU_HADZHI_GENCHO = "НУ Хаджи Генчо";
    public static final String NU_HRISTO_BOTEV = "НУ Христо Ботев";
    public static final String NU_HRISTO_POPMARKOV = "НУ Христо Попмарков";
    public static final String NU_HRISTO_SMIRNENSKI_SHORT = "НУ Хр. Смирненски";
    public static final String NU_HRISTO_SMIRNENSKI_LONG = "НУ Христо Смирненски";
    public static final String NU_TSANI_GINCHEV = "НУ Цани Гинчев";
    public static final String NU_YANE_SANDANSKI = "НУ Яне Сандански";

    public static final String OU_PETKO_SLAVEIKOV = "ОУ Петко Славейков";
    public static final String OU_PETAR_BERON = "ОУ Петър Берон";
    public static final String OU_DAKI_IORDANOV_SHORT = "ОУ Даки Йорданов";
    public static final String OU_DAKI_IORDANOV_LONG = "ОУ Акад. Даки Йорданов";
    public static final String OU_ALEKO_KONSTANTINOV_SHORT = "ОУ А. Константинов";
    public static final String OU_ALEKO_KONSTANTINOV_LONG = "ОУ Алеко Константинов";
    public static final String OU_ANGEL_KANCHEV = "ОУ Ангел Кънчев";
    public static final String OU_ANTON_STRASHIMIROV_SHORT = "ОУ А. Страшимиров";
    public static final String OU_ANTON_STRASHIMIROV_LONG = "ОУ Антон Страшимиров";
    public static final String OU_ATANAS_MANCHEV = "ОУ Атанас Манчев";
    public static final String OU_BACHO_KIRO = "ОУ Бачо Киро";
    public static final String OU_BRATYA_MILADINOVI_SHORT = "ОУ Бр. Миладинови";
    public static final String OU_BRATYA_MILADINOVI_LONG = "ОУ Братя Миладинови";
    public static final String OU_VALERI_PETROV = "ОУ Валери Петров";
    public static final String OU_VASIL_APRILOV = "ОУ Васил Априлов";
    public static final String OU_VASIL_DRUMEV = "ОУ Васил Друмев";
    public static final String OU_VASIL_LEVSKI = "ОУ Васил Левски";
    public static final String OU_VASIL_PETLESHKOV = "ОУ Васил Петлешков";
    public static final String OU_G_S_RAKOVSKI = "ОУ Георги Раковски";
    public static final String OU_GEO_MILEV = "ОУ Гео Милев";
    public static final String OU_GEORGI_BAKALOV = "ОУ Георги Бакалов";
    public static final String OU_GEORGI_BENKOVSKI = "ОУ Георги Бенковски";
    public static final String OU_GEORGI_KARASLAVOV_SHORT = "ОУ Г. Караславов";
    public static final String OU_GEORGI_KARASLAVOV_LONG = "ОУ Георги Караславов";
    public static final String OU_GEORGI_KIRKOV = "ОУ Георги Кирков";
    public static final String OU_GEORGI_RAICHEV = "ОУ Георги Райчев";
    public static final String OU_IV_SELIMINSKI_SHORT = "ОУ И. Селимински";
    public static final String OU_IV_SELIMINSKI_LONG = "ОУ Д-р Иван Селимински";
    public static final String OU_PETAR_BERON_2_SHORT = "ОУ Петър Берон";
    public static final String OU_PETAR_BERON_2_LONG = "ОУ Д-р Петър Берон";
    public static final String OU_DASKAL_DIMITRI = "ОУ Даскал Димитри";
    public static final String OU_DIMITAR_BLAGOEV = "ОУ Димитър Благоев";
    public static final String OU_DIMITAR_DIMOV = "ОУ Димитър Димов";
    public static final String OU_DIMITAR_PETROV = "ОУ Димитър Петров";
    public static final String OU_DIMITAR_TALEV = "ОУ Димитър Талев";
    public static final String OU_DIMCHO_DEBELYANOV = "ОУ Димчо Дебелянов";
    public static final String OU_DOBRI_CHINTULOV = "ОУ Добри Чинтулов";
    public static final String OU_DRAGAN_MANCHOV = "ОУ Драган Манчов";
    public static final String OU_DUSHO_HADZHIDEKOV = "ОУ Душо Хаджидеков";
    public static final String OU_EVLOGI_GEORGIEV = "ОУ Евлоги Георгиев";
    public static final String OU_ELIN_PELIN = "ОУ Елин Пелин";
    public static final String OU_ELISAVETA_BAGRYANA_SHORT = "ОУ Е. Багряна";
    public static final String OU_ELISAVETA_BAGRYANA_LONG = "ОУ Елисавета Багряна";
    public static final String OU_ENO_MARKOVSKI = "ОУ Еньо Марковски";
    public static final String OU_SOFRONII_VRACHANSKI = "ОУ Софроний Врачански";
    public static final String OU_ZAHARI_STOYANOV = "ОУ Захари Стоянов";
    public static final String OU_I_S_TURGENEV = "ОУ И. С. Тургенев";
    public static final String OU_IVAN_VAZOV = "ОУ Иван Вазов";
    public static final String OU_IVAN_HADZHIISKI = "ОУ Иван Хаджийски";
    public static final String OU_IORDAN_IOVKOV = "ОУ Йордан Йовков";
    public static final String OU_KIRIL_HRISTOV = "ОУ Кирил Христов";
    public static final String OU_KIRIL_I_METODII = "ОУ Кирил и Методий";
    public static final String OU_KLIMENT_OHRIDSKI_SHORT = "ОУ Кл. Охридски";
    public static final String OU_KLIMENT_OHRIDSKI_LONG = "ОУ Климент Охридски";
    public static final String OU_KONSTANTIN_ARABADZHIEV_SHORT = "ОУ К. Арабаджиев";
    public static final String OU_KONSTANTIN_ARABADZHIEV_LONG = "ОУ Константин Арабаджиев";
    public static final String OU_KOCHO_CHESTEMENSKI = "ОУ Кочо Честеменски";
    public static final String OU_KULATA = "ОУ Кулата";
    public static final String OU_LAZAR_STANEV = "ОУ Лазар Станев";
    public static final String OU_LIUBEN_KARAVELOV_SHORT = "ОУ Л. Каравелов";
    public static final String OU_LIUBEN_KARAVELOV_LONG = "ОУ Любен Каравелов";
    public static final String OU_MAKSIM_GORKI = "ОУ Максим Горки";
    public static final String OU_MATI_BOLGARIYA = "ОУ Мати Болгария";
    public static final String OU_AVKSENTII_VELESHKI_SHORT = "ОУ Авксентий Велешки";
    public static final String OU_AVKSENTII_VELESHKI_LONG = "ОУ Митрополит Авксентий Велешки";
    public static final String OU_N_IKONOMOV = "ОУ Н. Икономов";
    public static final String OU_NAIDEN_GEROV = "ОУ Найден Геров";
    public static final String OU_NEOFIT_RILSKI = "ОУ Неофит Рилски";
    public static final String OU_NIKOLA_VAPTSAROV_SHORT = "ОУ Н. Вапцаров";
    public static final String OU_NIKOLA_VAPTSAROV_LONG = "ОУ Никола Вапцаров";
    public static final String OU_NIKOLA_OBRETENOV = "ОУ Никола Обретенов";
    public static final String OU_NIKOLA_PARAPUNOV = "ОУ Никола Парапунов";
    public static final String OU_NIKOLAI_PETRINI = "ОУ Николай Петрини";
    public static final String OU_OLIMPI_PANOV = "ОУ Олимпи Панов";
    public static final String OU_OTEC_PAISII = "ОУ Отец Паисий";
    public static final String OU_PAISII_HILENDARSKI_SHORT = "ОУ П. Хилендарски";
    public static final String OU_PAISII_HILENDARSKI_LONG = "ОУ Паисий Хилендарски";
    public static final String OU_PANAIOT_VOLOV = "ОУ Панайот Волов";
    public static final String OU_PANAIOT_PIPKOV = "ОУ Панайот Пипков";
    public static final String OU_PANAIOT_HITOV = "ОУ Панайот Хитов";
    public static final String OU_PEIO_YAVOROV = "ОУ Пейо Яворов";
    public static final String OU_PENCHO_SLAVEIKOV = "ОУ Пенчо Славейков";
    public static final String OU_PETKO_KARAVELOV = "ОУ Петко Каравелов";
    public static final String OU_PETAR_BONEV = "ОУ Петър Бонев";
    public static final String OU_IV_BATAKLIEV_SHORT = "ОУ Иван Батаклиев";
    public static final String OU_IV_BATAKLIEV_LONG = "ОУ Проф. Иван Батаклиев";
    public static final String OU_MARIN_DRINOV_SHORT = "ОУ Марин Дринов";
    public static final String OU_MARIN_DRINOV_LONG = "ОУ Проф. Марин Дринов";
    public static final String OU_PENCHO_NIKOLOV_RAIKOV_SHORT = "ОУ Пенчо Николов Райков";
    public static final String OU_PENCHO_NIKOLOV_RAIKOV_LONG = "ОУ Проф. Пенчо Николов Райков";
    public static final String OU_ASEN_ZLATAROV_SHORT = "ОУ Асен Златаров";
    public static final String OU_ASEN_ZLATAROV_LONG = "ОУ Проф. д-р Асен Златаров";
    public static final String OU_RAINA_KNYAGINYA = "ОУ Райна Княгиня";
    public static final String OU_RAINO_POPOVICH = "ОУ Райно Попович";
    public static final String OU_RAN_BOSILEK = "ОУ Ран Босилек";
    public static final String OU_SAMARA = "ОУ Самара";
    public static final String OU_IVAN_RILSKI_SHORT = "ОУ Иван Рилски";
    public static final String OU_IVAN_RILSKI_LONG = "ОУ Св. Иван Рилски";
    public static final String OU_KONST_K_FILOSOF_SHORT = "ОУ К. К. Философ";
    public static final String OU_KONST_K_FILOSOF_LONG = "ОУ Св. Конст. К. Философ";
    public static final String OU_PATRIARH_EVTIMII_SHORT = "ОУ Патр. Евтимий";
    public static final String OU_PATRIARH_EVTIMII_LONG = "ОУ Патриарх Евтимий";
    public static final String OU_STEFAN_ZAHARIEV = "ОУ Стефан Захариев";
    public static final String OU_STEFAN_KARADZHA = "ОУ Стефан Караджа";
    public static final String OU_STEFAN_PESHEV = "ОУ Стефан Пешев";
    public static final String OU_STOIU_SHISHKOV = "ОУ Стою Шишков";
    public static final String OU_STOYAN_MIHAILOVSKI_SHORT = "ОУ Ст. Михайловски";
    public static final String OU_STOYAN_MIHAILOVSKI_LONG = "ОУ Стоян Михайловски";
    public static final String OU_TODOR_KABLESHKOV = "ОУ Тодор Каблешков";
    public static final String OU_TOMA_KARDZHIEV = "ОУ Тома Кърджиев";
    public static final String OU_TIUTIUNDZHYAN = "ОУ Тютюнджян";
    public static final String OU_FILIP_SAKELARIEVICH_SHORT = "ОУ Ф. Сакелариевич";
    public static final String OU_FILIP_SAKELARIEVICH_LONG = "ОУ Филип Сакелариевич";
    public static final String OU_H_MAKSIMOV = "ОУ Христо Максимов";
    public static final String OU_HAN_ASPARUH = "ОУ Хан Аспарух";
    public static final String OU_HRISTAKI_PAVLOVICH_SHORT = "ОУ Хр. Павлович";
    public static final String OU_HRISTAKI_PAVLOVICH_LONG = "ОУ Христаки Павлович";
    public static final String OU_HRISTO_BOTEV = "ОУ Христо Ботев";
    public static final String OU_HRISTO_NIKIFOROV = "ОУ Христо Никифоров";
    public static final String OU_HRISTO_SMIRNENSKI_SHORT = "ОУ Хр. Смирненски";
    public static final String OU_HRISTO_SMIRNENSKI_LONG = "ОУ Христо Смирненски";
    public static final String OU_TSVETAN_SPASOV = "ОУ Цветан Спасов";
    public static final String OU_CHERNORIZETS_HRABAR_SHORT = "ОУ Ч. Храбър";
    public static final String OU_CHERNORIZETS_HRABAR_LONG = "ОУ Черноризец Храбър";
    public static final String OU_CHUDOMIR = "ОУ Чудомир";
    public static final String OU_SHANDOR_PETOFI = "ОУ Шандор Петьофи";
    public static final String OU_IURII_GAGARIN = "ОУ Юрий Гагарин";
    public static final String OU_YANE_SANDANSKI = "ОУ Яне Сандански";


    public static final String PG_HRISTO_BOTEV = "ПГ Христо Ботев";
    public static final String PG_SELSKO_STOPANSTVO_SHORT = "ПГ по селско стоп.";
    public static final String PG_SELSKO_STOPANSTVO_LONG = "ПГ по селско стопанство";

    public static final String SU_ALEKO_KONSTANTINOV_SHORT = "СУ А. Константинов";
    public static final String SU_ALEKO_KONSTANTINOV_LONG = "СУ Алеко Константинов";
    public static final String SU_ANASTASIYA_DIMITROVA_SHORT = "СУ Ан. Димитрова";
    public static final String SU_ANASTASIYA_DIMITROVA_LONG = "СУ Анастасия Димитрова";
    public static final String SU_ANGEL_KARALIICHEV = "СУ Ангел Каралийчев";
    public static final String SU_ANTON_POPOV = "СУ Антон Попов";
    public static final String SU_ARGIRA_ZHECHKOVA = "СУ Аргира Жечкова";
    public static final String SU_ASEN_ZLATAROV = "СУ Асен Златаров";
    public static final String SU_BACHO_KIRO = "СУ Бачо Киро";
    public static final String SU_BRATYA_MILADINOVI = "СУ Братя Миладинови";
    public static final String SU_VASIL_DECHEV = "СУ Васил Дечев";
    public static final String SU_VASIL_KANCHOV = "СУ Васил Кънчов";
    public static final String SU_VASIL_LEVSKI = "СУ Васил Левски";
    public static final String SU_VELA_BLAGOEVA = "СУ Вела Благоева";
    public static final String SU_VICHO_GRANCHAROV = "СУ Вичо Грънчаров";
    public static final String SU_VLADIMIR_DIMITROV_SHORT = "СУ Влад. Димитров";
    public static final String SU_VLADIMIR_DIMITROV_LONG = "СУ Влад. Димитров - Майстора";
    public static final String SU_VLADIMIR_KOMAROV = "СУ Владимир Комаров";
    public static final String SU_VAZRAZHDANE = "СУ Възраждане";
    public static final String SU_GEO_MILEV = "СУ Гео Милев";
    public static final String SU_GEORGI_BENKOVSKI = "СУ Георги Бенковски";
    public static final String SU_GEORGI_BREGOV = "СУ Георги Брегов";
    public static final String SU_GEORGI_IZMIRLIEV = "СУ Георги Измирлиев";
    public static final String SU_GEORGI_RAKOVSKI = "СУ Георги Раковски";
    public static final String SU_PETAR_BERON_SHORT = "СУ Петър Берон";
    public static final String SU_PETAR_BERON_LONG = "СУ Д-р Петър Берон";
    public static final String SU_DIMITAR_BLAGOEV = "СУ Димитър Благоев";
    public static final String SU_DIMITAR_GACHEV = "СУ Димитър Гачев";
    public static final String SU_DIMITAR_MARINOV = "СУ Димитър Маринов";
    public static final String SU_DIMITAR_MATEVSKI = "СУ Димитър Матевски";
    public static final String SU_DIMITAR_MITEV = "СУ Димитър Митев";
    public static final String SU_DIMITAR_TALEV = "СУ Димитър Талев";
    public static final String SU_DIMCHO_DEBELYANOV = "СУ Димчо Дебелянов";
    public static final String SU_DOBRI_CHINTULOV = "СУ Добри Чинтулов";
    public static final String SU_ELIN_PELIN = "СУ Елин Пелин";
    public static final String SU_EMILIYAN_STANEV = "СУ Емилиян Станев";
    public static final String SU_K_PRESLAVSKI_SHORT = "СУ Конст. Преславски";
    public static final String SU_K_PRESLAVSKI_LONG = "СУ Еп. Конст. Преславски";
    public static final String SU_ZHELEZNIK = "СУ Железник";
    public static final String SU_ZHELYAZKO_TERPESHEV = "СУ Желязко Терпешев";
    public static final String SU_IVAN_VAZOV = "СУ Иван Вазов";
    public static final String SU_IVAN_NIKOLOV_MOMCHILOV_SHORT = "СУ Иван Момчилов";
    public static final String SU_IVAN_NIKOLOV_MOMCHILOV_LONG = "СУ Иван Николов Момчилов";
    public static final String SU_Ioan_EKZARH_BALGARSKI_SHORT = "СУ Йоан Екзарх";
    public static final String SU_Ioan_EKZARH_BALGARSKI_LONG = "СУ Йоан Екзарх Български";
    public static final String SU_IORDAN_IOVKOV = "СУ Йордан Йовков";
    public static final String SU_KOZMA_TRICHKOV = "СУ Козма Тричков";
    public static final String SU_KONSTANTIN_VELICHKOV_SHORT = "СУ Конст. Величков";
    public static final String SU_KONSTANTIN_VELICHKOV_LONG = "СУ Константин Величков";
    public static final String SU_KONSTANTIN_KONSTANTINOV_SHORT = "СУ К. Константинов";
    public static final String SU_KONSTANTIN_KONSTANTINOV_LONG = "СУ Константин Константинов";
    public static final String SU_KONSTANTIN_PETKANOV_SHORT = "СУ Конст. Петканов";
    public static final String SU_KONSTANTIN_PETKANOV_LONG = "СУ Константин Петканов";
    public static final String SU_KRUM_POPOV = "СУ Крум Попов";
    public static final String SU_HRISTO_TOPRAKCHIEV_SHORT = "СУ Христо Топракчиев";
    public static final String SU_HRISTO_TOPRAKCHIEV_LONG = "СУ Летец Христо Топракчиев";
    public static final String SU_LIUBEN_KARAVELOV_SHORT = "СУ Л. Каравелов";
    public static final String SU_LIUBEN_KARAVELOV_LONG = "СУ Любен Каравелов";
    public static final String SU_MAKSIM_GORKI = "СУ Максим Горки";
    public static final String SU_MAKSIM_RAIKOVICH = "СУ Максим Райкович";
    public static final String SU_MITO_OROZOV = "СУ Мито Орозов";
    public static final String SU_NAIDEN_GEROV = "СУ Найден Геров";
    public static final String SU_NEOFIT_BOZVELI = "СУ Неофит Бозвели";
    public static final String SU_NEOFIT_RILSKI = "СУ Неофит Рилски";
    public static final String SU_NESHO_BONCHEV = "СУ Нешо Бончев";
    public static final String SU_NIKOLA_VAPTSAROV = "СУ Никола Вапцаров";
    public static final String SU_NIKOLA_VOIVODOV = "СУ Никола Войводов";
    public static final String SU_NIKOLAI_KATRANOV = "СУ Николай Катранов";
    public static final String SU_OTEC_PAISII = "СУ Отец Паисий";
    public static final String SU_PAISII_HILENDARSKI_SHORT = "СУ П. Хилендарски";
    public static final String SU_PAISII_HILENDARSKI_LONG = "СУ Паисий Хилендарски";
    public static final String SU_PANAIOT_VOLOV = "СУ Панайот Волов";
    public static final String SU_PATRIARH_EVTIMII_SHORT = "СУ Патр. Евтимий";
    public static final String SU_PATRIARH_EVTIMII_LONG = "СУ Патриарх Евтимий";
    public static final String SU_PEIO_YAVOROV = "СУ Пейо Яворов";
    public static final String SU_PETKO_RACHOV_SLAVEIKOV_SHORT = "СУ Петко Славейков";
    public static final String SU_PETKO_RACHOV_SLAVEIKOV_LONG = "СУ Петко Рачов Славейков";
    public static final String SU_PETKO_ROSEN = "СУ Петко Росен";
    public static final String SU_MINCHO_KANCHEV_SHORT = "СУ Минчо Кънчев";
    public static final String SU_MINCHO_KANCHEV_LONG = "СУ Поп Минчо Кънчев";
    public static final String SU_ASEN_ZLATAROV_2_SHORT = "СУ Асен Златаров";
    public static final String SU_ASEN_ZLATAROV_2_LONG = "СУ Проф. д-р Асен Златаров";
    public static final String SU_RAICHO_KAROLEV = "СУ Райчо Каролев";
    public static final String SU_SAVA_DOBROPLODNI = "СУ Сава Доброплодни";
    public static final String SU_SAVO_TSENOV_SAVOV = "СУ Саво Ценов Савов";
    public static final String SU_K_KIRIL_FILOSOF_SHORT = "СУ К. Кирил Философ";
    public static final String SU_K_KIRIL_FILOSOF_LONG = "СУ Св. К. Кирил Философ";
    public static final String SU_KLIMENT_OHRIDSKI_SHORT = "СУ Кл. Охридски";
    public static final String SU_KLIMENT_OHRIDSKI_LONG = "СУ Климент Охридски";
    public static final String SU_KIRIL_I_METODII = "СУ Кирил и Методий";
    public static final String SU_SEDMOCHISLENITSI_SHORT = "СУ Св. Седмочисленици";
    public static final String SU_SEDMOCHISLENITSI_LONG = "СУ Свети Седмочисленици";
    public static final String SU_SIMON_BOLIVAR = "СУ Симон Боливар";
    public static final String SU_SOFRONII_VRACHANSKI = "СУ Софроний Врачански";
    public static final String SU_STEFAN_KARADZHA = "СУ Стефан Караджа";
    public static final String SU_STOYAN_ZAIMOV = "СУ Стоян Заимов";
    public static final String SU_TODOR_KIRKOV = "СУ Тодор Кирков";
    public static final String SU_TRAIKO_SIMEONOV = "СУ Трайко Симеонов";
    public static final String SU_HADZHI_MINA_PASHOV = "СУ Хаджи Мина Пашов";
    public static final String SU_HAN_ISPERIH = "СУ Хан Исперих";
    public static final String SU_HRISTO_BOTEV = "СУ Христо Ботев";
    public static final String SU_HRISTO_GRUEV_DANOV_SHORT = "СУ Христо Данов";
    public static final String SU_HRISTO_GRUEV_DANOV_LONG = "СУ Христо Груев Данов";
    public static final String SU_HRISTO_PRODANOV = "СУ Христо Проданов";
    public static final String SU_HRISTO_SMIRNENSKI_SHORT = "СУ Хр. Смирненски";
    public static final String SU_HRISTO_SMIRNENSKI_LONG = "СУ Христо Смирненски";
    public static final String SU_HRISTO_YASENOV = "СУ Христо Ясенов";
    public static final String SU_TSAR_SIMEON_VELIKI_SHORT = "СУ Цар Симеон";
    public static final String SU_TSAR_SIMEON_VELIKI_LONG = "СУ Цар Симеон Велики";
    public static final String SU_TSVETAN_RADOSLAVOV_SHORT = "СУ Цв. Радославов";
    public static final String SU_TSVETAN_RADOSLAVOV_LONG = "СУ Цветан Радославов";
    public static final String SU_CHERNORIZETS_HRABAR_SHORT = "СУ Ч. Храбър";
    public static final String SU_CHERNORIZETS_HRABAR_LONG = "СУ Черноризец Храбър";

    String label;
    String name;
    String code;
    String website;
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
        int byMedian = Double.compare(o.calculateMedian(), calculateMedian());
        if(byMedian != 0) {
            return byMedian;
        }

        int byCode = compareNullable(code, o.code);
        if(byCode != 0) {
            return byCode;
        }

        int byName = compareNullable(name, o.name);
        if(byName != 0) {
            return byName;
        }

        return compareNullable(label, o.label);
    }

    private static int compareNullable(String first, String second) {
        if(first == null && second == null) {
            return 0;
        }
        if(first == null) {
            return -1;
        }
        if(second == null) {
            return 1;
        }
        return first.compareTo(second);
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
        schoolCodes.putAll(prepareSchoolCodesBalchik());
        // Bankia - part of Sofia
        schoolCodes.putAll(prepareSchoolCodesBerkovitsa());
        schoolCodes.putAll(prepareSchoolCodesBialaRuse());
        schoolCodes.putAll(prepareSchoolCodesBotevgrad());
        schoolCodes.putAll(prepareSchoolCodesVelingrad());
        schoolCodes.putAll(prepareSchoolCodesGornaOryahovitsa());
        schoolCodes.putAll(prepareSchoolCodesGotseDelchev());
        schoolCodes.putAll(prepareSchoolCodesDimitrovgrad());
        schoolCodes.putAll(prepareSchoolCodesDupnitsa());
        schoolCodes.putAll(prepareSchoolCodesIhtiman());
        schoolCodes.putAll(prepareSchoolCodesKavarna());
        schoolCodes.putAll(prepareSchoolCodesKazanluk());
        schoolCodes.putAll(prepareSchoolCodesKarlovo());
        schoolCodes.putAll(prepareSchoolCodesKarnobat());
        schoolCodes.putAll(prepareSchoolCodesKozlodui());
        schoolCodes.putAll(prepareSchoolCodesKostinbrod());
        schoolCodes.putAll(prepareSchoolCodesLom());
        schoolCodes.putAll(prepareSchoolCodesLukovit());
        schoolCodes.putAll(prepareSchoolCodesNesebar());
        schoolCodes.putAll(prepareSchoolCodesNovaZagora());
        // Novi Iskar - part of Sofia
        schoolCodes.putAll(prepareSchoolCodesNoviPazar());
        schoolCodes.putAll(prepareSchoolCodesObzor());
        schoolCodes.putAll(prepareSchoolCodesPanagiurishte());
        schoolCodes.putAll(prepareSchoolCodesPetrich());
        schoolCodes.putAll(prepareSchoolCodesPeshtera());
        schoolCodes.putAll(prepareSchoolCodesPomorie());
        schoolCodes.putAll(prepareSchoolCodesPopovo());
        schoolCodes.putAll(prepareSchoolCodesPravets());
        schoolCodes.putAll(prepareSchoolCodesProvadia());
        schoolCodes.putAll(prepareSchoolCodesPurvomai());
        schoolCodes.putAll(prepareSchoolCodesRadnevo());
        schoolCodes.putAll(prepareSchoolCodesRadomir());
        schoolCodes.putAll(prepareSchoolCodesRazlog());
        schoolCodes.putAll(prepareSchoolCodesRakovski());
        schoolCodes.putAll(prepareSchoolCodesSamokov());
        schoolCodes.putAll(prepareSchoolCodesSandanski());
        schoolCodes.putAll(prepareSchoolCodesSvilengrad());
        schoolCodes.putAll(prepareSchoolCodesSvishtov());
        schoolCodes.putAll(prepareSchoolCodesSvoge());
        schoolCodes.putAll(prepareSchoolCodesSevlievo());
        schoolCodes.putAll(prepareSchoolCodesStamboliiski());
        schoolCodes.putAll(prepareSchoolCodesTroyan());
        schoolCodes.putAll(prepareSchoolCodesHarmanli());
        schoolCodes.putAll(prepareSchoolCodesChervenBriag());
        schoolCodes.putAll(prepareSchoolCodesChirpan());

        schoolCodes.putAll(prepareSchoolCodesYakoruda());
        schoolCodes.putAll(prepareSchoolCodesBansko());
        schoolCodes.putAll(prepareSchoolCodesSimitli());
        schoolCodes.putAll(prepareSchoolCodesTeteven());
        schoolCodes.putAll(prepareSchoolCodesVarshets());
        schoolCodes.putAll(prepareSchoolCodesRakitovo());
        schoolCodes.putAll(prepareSchoolCodesLevski());
        schoolCodes.putAll(prepareSchoolCodesSopot());
        schoolCodes.putAll(prepareSchoolCodesIsperih());
        schoolCodes.putAll(prepareSchoolCodesDulovo());
        schoolCodes.putAll(prepareSchoolCodesKotel());
        schoolCodes.putAll(prepareSchoolCodesDevin());
        schoolCodes.putAll(prepareSchoolCodesPirdop());
        schoolCodes.putAll(prepareSchoolCodesGulyubovo());
        schoolCodes.putAll(prepareSchoolCodesOmurtag());
        schoolCodes.putAll(prepareSchoolCodesSimeonovgrad());
        schoolCodes.putAll(prepareSchoolCodesVelikiPreslav());
        schoolCodes.putAll(prepareSchoolCodesElhovo());
        schoolCodes.putAll(prepareSchoolCodesAksakovo());
        schoolCodes.putAll(prepareSchoolCodesBelogradchik());
        schoolCodes.putAll(prepareSchoolCodesByalaSlatina());
        schoolCodes.putAll(prepareSchoolCodesGeneralToshevo());
        schoolCodes.putAll(prepareSchoolCodesDevnya());
        schoolCodes.putAll(prepareSchoolCodesDolniChiflik());
        schoolCodes.putAll(prepareSchoolCodesDryanovo());
        schoolCodes.putAll(prepareSchoolCodesDulgopol());
        schoolCodes.putAll(prepareSchoolCodesElena());
        schoolCodes.putAll(prepareSchoolCodesKrumovgrad());
        schoolCodes.putAll(prepareSchoolCodesLyaskovets());
        schoolCodes.putAll(prepareSchoolCodesMezdra());
        schoolCodes.putAll(prepareSchoolCodesMomchilgrad());
        schoolCodes.putAll(prepareSchoolCodesOryahovo());
        schoolCodes.putAll(prepareSchoolCodesPavlikeni());
        schoolCodes.putAll(prepareSchoolCodesSredets());
        schoolCodes.putAll(prepareSchoolCodesStrazhitsa());
        schoolCodes.putAll(prepareSchoolCodesSuvorov());
        schoolCodes.putAll(prepareSchoolCodesTervel());
        schoolCodes.putAll(prepareSchoolCodesTryavna());
        schoolCodes.putAll(prepareSchoolCodesTsarevo());
        schoolCodes.putAll(prepareSchoolCodesSopol());
        schoolCodes.putAll(prepareSchoolCodesBobovDol());
        schoolCodes.putAll(prepareSchoolCodesBelene());
        schoolCodes.putAll(prepareSchoolCodesKneza());
        schoolCodes.putAll(prepareSchoolCodesKuklen());
        schoolCodes.putAll(prepareSchoolCodesSuedinenie());

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSofia() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2204091", new String[] {"0", "91 НЕГ", "91 немска ЕГ", "https://91neg.bg"});
        schoolCodes.put("2213507", new String[] {"1", "Американски колеж", "Американски колеж", "https://acs.bg"});
        schoolCodes.put("2221563", new String[] {"1", "ПЧМГ", "Първа Частна Математическа Гимназия", "https://parvamatematicheska.com"});
        schoolCodes.put("2216164", new String[] {"0", "164 ГПИЕ", "164 ГПИЕ Мигел де Сервантес", "https://ibbcervantes-bg.com"});
        schoolCodes.put("2216306", new String[] {"0", "СМГ", "СМГ Паисий Хилендарски", "https://smg.bg"});
        schoolCodes.put("2224073", new String[] {"0", "73 СУ", "73 СУ Владислав Граматик", "https://73su.bg"});
        schoolCodes.put("2216301", new String[] {"0", "1 АЕГ", "Първа английска ЕГ", "https://fels-sofia.org"});
        schoolCodes.put("2206302", new String[] {"0", "2 АЕГ", "Втора английска ЕГ", "https://2els.com"});
        schoolCodes.put("2209529", new String[] {"1", "Дорис Тенеди", "ЧЕСУ Дорис Тенеди", "https://doristenedi.com"});
        schoolCodes.put("2213503", new String[] {"1", "Меридиан 22", "ЧПГ Меридиан 22", "https://meridian22.bg"});
        schoolCodes.put("2200040", new String[] {"1", "Прогресивно обр.", "ЧПГ Прогресивно образование", "https://highschool1.transform.bg"});
        schoolCodes.put("2222009", new String[] {"0", "9 ФЕГ", "9 Френска ЕГ Алфонс дьо Ламартин", "https://feg.bg"});
        schoolCodes.put("2211304", new String[] {"0", "НПМГ", "НПМГ Акад. Любомир Чакалов", "https://npmg.org"});
        schoolCodes.put("2212540", new String[] {"1", "Ерих Кестнер", "ЧНГ Ерих Кестнер", "https://e-kestner.eu"});
        schoolCodes.put("2205520", new String[] {"1", "Иван Апостолов", "ЧЕГ Проф. Иван Апостолов", "https://ivanapostolov.bg"});
        schoolCodes.put("2223547", new String[] {"1", "В. Златарски", "ЧЕГ Проф. д-р В. Златарски", "https://zlatarskischool.org"});
        schoolCodes.put("2902702", new String[] {"0", "НГДЕК", "Национална гимназия за древни езици и култури", "https://ngdek.com"});
        schoolCodes.put("2222133", new String[] {"0", "133 СУ", "133 СУ Александър Сергеевич Пушкин", "https://133sou.com"});
        schoolCodes.put("2204032", new String[] {"0", "32 СУ", "32 СУ Св. Климент Охридски", "https://school32.com"});
        schoolCodes.put("2203603", new String[] {"0", "Луи Брайл", "Специално училище за ученици с нарушено зрение Луи Брайл", "https://suunz.org"});
        schoolCodes.put("2211035", new String[] {"0", "35 СЕУ", "35 СЕУ Добри Войников", "https://35sou.bg"});
        schoolCodes.put("2216532", new String[] {"1", "Увекинд", "ЧСУ Увекинд", "https://uwekind.com"});
        schoolCodes.put("2224022", new String[] {"0", "22 СЕУ", "22 СЕУ Георги С. Раковски", "https://22seu.bg"});
        schoolCodes.put("2221031", new String[] {"0", "31 СУ", "31 СУ Иван Вазов", "https://ivanvazov.com"});
        schoolCodes.put("2902701", new String[] {"0", "НУКК", "НУКК (Италиански лицей)", "https://nukk.org"});
        schoolCodes.put("2202574", new String[] {"1", "Св. Георги", "ЧСУ Свети Георги", "https://stgeorgeschool.eu"});
        schoolCodes.put("2204018", new String[] {"0", "18 СУ", "18 СУ Уилям Гладстон", "https://18sou.net"});
        schoolCodes.put("2213350", new String[] {"0", "ТУЕС", "ТУЕС към Технически Университет", "https://elsys-bg.org"});
        schoolCodes.put("2204549", new String[] {"1", "Веда", "ЧСУ с немски език Веда", "https://wedaschule.com"});
        schoolCodes.put("2213600", new String[] {"1", "Абрахам Линкълн", "ЧСУ с чуждоезиков профил Абрахам Линкълн", "https://lincolnsofia.com"});
        schoolCodes.put("2204134", new String[] {"0", "134 СУ", "134 СУ Димчо Дебелянов", "https://hebrewschool-bg.org"});
        schoolCodes.put("2211420", new String[] {"0", "НФСГ", "Национална финансово-стопанска гимназия", "https://www.nfsg-sofia.net"});
        schoolCodes.put("2221157", new String[] {"0", "157 ГИЧЕ", "157 ГИЧЕ Сесар Вайехо", "https://157giche.com"});
        schoolCodes.put("2224433", new String[] {"0", "НТБГ", "Национална търговско-банкова гимназия", "https://ntbg.bg"});
        schoolCodes.put("2222127", new String[] {"0", "127 СУ", "127 СУ Иван Николаевич Денкоглу", "https://127sou.com"});
        schoolCodes.put("2204030", new String[] {"0", "30 СУ", "30 СУ Братя Миладинови", "https://30su-bg.com"});
        schoolCodes.put("2202536", new String[] {"1", "Британика", "ЧСЕУ Британика", "https://britanica-parkschool.bg"});
        schoolCodes.put("2222007", new String[] {"0", "7 СУ", "7 СУ Св. Седмочисленици", "https://7-mo.com"});
        schoolCodes.put("2211419", new String[] {"0", "Гимназия по строит., арх. и геод.", "Гимназия по строителство, архитектура и геодезия", "https://sgcag.info"});
        schoolCodes.put("2209051", new String[] {"0", "51 СУ", "51 СУ Елисавета Багряна", "https://51su.info"});
        schoolCodes.put("2201515", new String[] {"1", "Цар Симеон Велики", "ЧСУ Цар Симеон Велики", "https://tzarsimeon.bg"});
        schoolCodes.put("2216533", new String[] {"1", "ПЧАГ", "Първа частна английска гимназия", "https://fpels.ws"});
        schoolCodes.put("2902101", new String[] {"0", "НМУ", "Национално музикално училище", "https://nmu.bg"});
        schoolCodes.put("2203720", new String[] {"1", "Дружба", "ЧСУ Дружба", "https://drujba.org"});
        schoolCodes.put("2204311", new String[] {"0", "Румънска гимназия", "Румънска гимназия Михай Еминеску", "https://pgiire.com"});
        schoolCodes.put("2205119", new String[] {"0", "119 СУ", "119 СУ Акад. Михаил Арнаудов", "https://119su.bg"});
        schoolCodes.put("2211517", new String[] {"1", "Банкер", "ЧПГ Банкер", "https://banker-school.com"});
        schoolCodes.put("2902501", new String[] {"0", "НГПИ Св. Лука","Национална гимназия за приложни изкуства", "https://ngpisvetiluka.com"});
        schoolCodes.put("2212303", new String[] {"0", "33 ЕГ", "33 ЕГ Света София", "https://33eg.eu"});
        schoolCodes.put("2209019", new String[] {"0", "19 СУ", "19 СУ Елин Пелин", "https://19su.bg"});
        schoolCodes.put("2205407", new String[] {"0", "ПГ по електроника", "ПГ по електроника Джон Атанасов", "https://spge.bg"});
        schoolCodes.put("2202002", new String[] {"0", "2 СУ", "2 СУ Акад. Емилиян Станев", "https://2su.bg"});
        schoolCodes.put("2222012", new String[] {"0", "12 СУ", "12 СУ Цар Иван Асен II", "https://12sou-sofia.info"});
        schoolCodes.put("2211021", new String[] {"0", "21 СУ", "21 СУ Христо Ботев", "https://21su.bg"});
        schoolCodes.put("2221590", new String[] {"1", "Обр. технологии", "ЧПГ Образователни технологии", "https://eduteh.eu"});
        schoolCodes.put("2902401", new String[] {"0", "НУИИ И. Петров","Национално училище за изящни изкуства", "https://hg-iliapetrov.com"});
        schoolCodes.put("2216001", new String[] {"0", "1 СУ", "1 СУ Пенчо Славейков", "https://1sousofia.org"});
        schoolCodes.put("2204402", new String[] {"0", "ПГ по прец. техн. и опт.", "ПГ по прецизна техника и оптика", "https://lomonosov.bg"});
        schoolCodes.put("2221138", new String[] {"0", "138 СУ", "138 СУ Проф. Васил Златарски", "https://138suzie.com"});
        schoolCodes.put("2214054", new String[] {"0", "54 СУ", "54 СУ Св. Иван Рилски", "https://54suivanrilski.com"});
        schoolCodes.put("2212056", new String[] {"0", "56 СУ", "56 СУ Проф. Константин Иречек", "https://su-56.com"});
        schoolCodes.put("2223431", new String[] {"0", "ПГ по телекомуникации", "ПГ по телекомуникации", "https://tcom-sf.org"});
        schoolCodes.put("2216423", new String[] {"0", "ПГ по туризъм", "Софийска ПГ по туризъм", "https://spgt.org"});
        schoolCodes.put("2212096", new String[] {"0", "96 СУ", "96 СУ Лев Николаевич Толстой", "https://96sou.com"});
        schoolCodes.put("2212137", new String[] {"0", "137 СУ", "137 СУ Ангел Кънчев", "https://137su.org"});
        schoolCodes.put("2204511", new String[] {"1", "Езиков свят", "ЧПГ с чуждоезиково обучение Езиков свят", "https://www.ezikovsviat.com"});
        schoolCodes.put("2202535", new String[] {"1", "Рьорих", "ЧСУ Рьорих", "https://roerich-school.org"});
        schoolCodes.put("2217088", new String[] {"0", "88 СУ", "88 СУ Димитър Попниколов", "https://88cy.info"});
        schoolCodes.put("2219044", new String[] {"0", "44 СУ", "44 СУ Неофит Бозвели", "https://44sou.eu"});
        schoolCodes.put("2902301", new String[] {"0", "НУТИ", "Национално училище за танцово изкуство", "https://nutibg.com"});
        schoolCodes.put("2221023", new String[] {"0", "23 СУ", "23 СУ Фредерик Жолио-Кюри", "https://23su.info"});
        schoolCodes.put("2205105", new String[] {"0", "105 СУ", "105 СУ Атанас Далчев", "https://105su.bg"});
        schoolCodes.put("2217424", new String[] {"0", "ПГ по електрот. и авт.", "ПГ по електротехника и автоматика", "https://pgea.bg"});
        schoolCodes.put("2213081", new String[] {"0", "81 СУ", "81 СУ Виктор Юго", "https://81su.eu"});
        schoolCodes.put("2202401", new String[] {"0", "ПГ по екол. и биот.", "ПГ по екология и биотехнологии", "https://pgeb-bg.com"});
        schoolCodes.put("2208526", new String[] {"1", "Орфей", "ЧСУ Орфей", "https://orfei.net"});
        schoolCodes.put("2224432", new String[] {"0", "ПГ по дизайн", "ПГ по дизайн Елисавета Вазова", "https://pgdsofia.com"});
        schoolCodes.put("2209305", new String[] {"0", "203 ПЕГ", "203 Профилирана ЕГ Свети Методий", "https://203peg.com"});
        schoolCodes.put("2209036", new String[] {"0", "36 СУ", "36 СУ Максим Горки", "https://36sou.com"});
        schoolCodes.put("2224545", new String[] {"1", "Банково дело", "ЧПГ по банково дело търговия и финанси", "https://btf.ntbg.bg"});
        schoolCodes.put("2213118", new String[] {"0", "118 СУ", "118 СУ Акад. Людмил Стоянов", "https://sou118.com"});
        schoolCodes.put("2213144", new String[] {"0", "144 СУ", "144 СУ Народни будители", "https://144sou.bg"});
        schoolCodes.put("2220308", new String[] {"0", "ПГ за изобр. изкуства", "ПГ за изобразителни изкуства", "https://pgii-nrainov.eu"});
        schoolCodes.put("2902601", new String[] {"0", "ПГ по полигр. и фотогр.", "ПГ по полиграфия и фотография", "https://npgpf.com"});
        schoolCodes.put("2214101", new String[] {"0", "101 СУ", "101 СУ Бачо Киро", "https://101su.bg"});
        schoolCodes.put("2208135", new String[] {"0", "135 СУ", "135 СУ Ян Амос Коменски", "https://sites.google.com/view/135su-new"});
        schoolCodes.put("2202534", new String[] {"1", "Св. Наум", "ЧПСУ Свети Наум", "https://svetinaum.net"});
        schoolCodes.put("2213128", new String[] {"0", "128 СУ", "128 СУ Алберт Айнщайн", "https://128sou-sofia.info"});
        schoolCodes.put("2213039", new String[] {"0", "39 СУ", "39 СУ Петър Динеков", "https://39su.eu"});
        schoolCodes.put("2202026", new String[] {"0", "26 СУ", "26 СУ Йордан Йовков", "https://26coy.net"});
        schoolCodes.put("2217151", new String[] {"0", "Национално СУ", "Национално СУ София"});
        schoolCodes.put("2211557", new String[] {"0", "Духовна семинария", "Софийска духовна семинария", "https://sofia-seminaria.org"});
        schoolCodes.put("2211417", new String[] {"0", "ПГ по облекло", "ПГ по облекло", "https://pgo-sofia.com"});
        schoolCodes.put("2219095", new String[] {"0", "95 СУ", "95 СУ Проф. Иван Шишманов", "https://95su.bg"});
        schoolCodes.put("2212097", new String[] {"0", "97 СУ", "97 СУ Братя Миладинови", "https://97su.bg"});
        schoolCodes.put("2209132", new String[] {"0", "132 СУ", "132 СУ Ваня Войнова", "https://132su.bg"});
        schoolCodes.put("2212079", new String[] {"0", "79 СУ", "79 СУ Индира Ганди", "https://79su.bg"});
        schoolCodes.put("2207108", new String[] {"0", "108 СУ", "108 СУ Никола Беловеждов", "https://108su.net"});
        schoolCodes.put("2213131", new String[] {"0", "131 СУ", "131 СУ Климент Аркад. Тимирязев", "https://131su.eu"});
        schoolCodes.put("2206410", new String[] {"0", "ПГВТ Ал. Попов", "ПГ по високи технологии Ал. Попов", "https://aspopov.bg"});
        schoolCodes.put("2213307", new String[] {"0", "СпУ Вл. Стойчев", "Спортно у-ще ген. Владимир Стойчев", "https://sugvs-sofia.com"});
        schoolCodes.put("2207069", new String[] {"0", "69 СУ", "69 СУ Димитър Маринов", "https://sou69.com"});
        schoolCodes.put("2220014", new String[] {"0", "14 СУ", "14 СУ Проф. Д-р Асен Златаров", "https://14su.bg"});
        schoolCodes.put("2204310", new String[] {"0", "5 ВСУ", "5 вечерно СУ Пеньо Пенев", "https://5vsu-ppenev.com"});
        schoolCodes.put("2203074", new String[] {"0", "74 СУ", "74 СУ Гоце Делчев", "https://74su.org"});
        schoolCodes.put("2206409", new String[] {"0", "ПГ по трансп. и енерг.", "ПГ по транспорт и енергетика", "https://pgtehford.com"});
        schoolCodes.put("2208028", new String[] {"0", "28 СУ", "28 СУ Алеко Константинов", "https://28sou.eu"});
        schoolCodes.put("2212040", new String[] {"0", "40 СУ", "40 СУ Луи Пастьор", "https://40-su.com"});
        schoolCodes.put("2212090", new String[] {"0", "90 СУ", "90 СУ Ген. Хосе де Сан Мартин"});
        schoolCodes.put("2213010", new String[] {"0", "10 СУ", "10 СУ Теодор Траянов", "https://10sou.eu"});
        schoolCodes.put("2216309", new String[] {"0", "Сменно-вечерна гимназия", "IV сменно-вечерна гимназия", "https://ve4erna.com"});
        schoolCodes.put("2219166", new String[] {"0", "СпУ В. Левски", "166 спортно у-ще Васил Левски", "https://166su.com"});
        schoolCodes.put("2224121", new String[] {"0", "121 СУ", "121 СУ Георги Измирлиев", "https://121su.org"});
        schoolCodes.put("2202612", new String[] {"0", "У-ще за ученици с увр. слух", "Специално училище за ученици с увреден слух", "https://deafschoolsofia.com"});
        schoolCodes.put("2203140", new String[] {"0", "140 СУ", "140 СУ Иван Богоров", "https://140su.com"});
        schoolCodes.put("2204403", new String[] {"0", "ПГ Вл. Димитров", "ПГ Владимир Димитров - Майстора", "https://pgvdm.com"});
        schoolCodes.put("2204405", new String[] {"0", "ПГ по под/стр/тр. техн.", "ПГ по подемна, строителна и транспортна техника", "https://pgpstt.com"});
        schoolCodes.put("2205408", new String[] {"0", "ПГ Княгиня Евдокия", "Софийска ПГ Княгиня Евдокия", "https://spgke.com"});
        schoolCodes.put("2206003", new String[] {"0", "3 СУ", "3 СУ Марин Дринов", "https://3coy.eu"});
        schoolCodes.put("2206113", new String[] {"0", "113 СУ", "113 СУ Сава Филаретов", "https://113su.net"});
        schoolCodes.put("2206411", new String[] {"0", "ПГ по хран.-вк. техн.", "ПГ по хранително-вкусови технологии", "https://pghvt-gpavlov.org"});
        schoolCodes.put("2207068", new String[] {"0", "68 СУ", "68 СУ Акад. Никола Обрешков", "https://68su.org"});
        schoolCodes.put("2207412", new String[] {"0", "ПГ по транспорт", "ПГ по транспорт", "https://pgtsofia.com"});
        schoolCodes.put("2208017", new String[] {"0", "17 СУ", "17 СУ Дамян Груев", "https://17su.bg"});
        schoolCodes.put("2208057", new String[] {"0", "СпУ Св. Наум", "57 спортно у-ще Св. Наум Охридски", "https://57su.com"});
        schoolCodes.put("2208123", new String[] {"0", "123 СУ", "123 СУ Стефан Стамболов", "https://123sustefanstambolov.com"});
        schoolCodes.put("2208413", new String[] {"0", "Гимн. по хлебни техн.", "Софийска гимназия по хлебни/сладкарски технологии", "https://sghst.com"});
        schoolCodes.put("2208539", new String[] {"1", "Булпрогрес", "ЧПГ Булпрогрес", "https://www.bulprogress.com"});
        schoolCodes.put("2210085", new String[] {"0", "85 СУ", "85 СУ Отец Паисий", "https://su85.org"});
        schoolCodes.put("2210117", new String[] {"0", "117 СУ", "117 СУ Св. Св. Кирил и Методий", "https://117sou.bg"});
        schoolCodes.put("2211571", new String[] {"1", "Охрана и сигурност", "ЧПГ по охрана и сигурност"});
        schoolCodes.put("2212037", new String[] {"0", "37 СУ", "37 СУ Райна Княгиня", "https://37su.eu"});
        schoolCodes.put("2213125", new String[] {"0", "125 СУИЧЕ", "125 СУИЧЕ Боян Пенев", "https://125su.com"});
        schoolCodes.put("2214015", new String[] {"0", "15 СУ", "15 СУ Адам Мицкевич", "https://15sou-sofia.com"});
        schoolCodes.put("2214153", new String[] {"0", "СпУ Неофит Рилски", "153 спортно у-ще Неофит Рилски", "https://nrilski153.org"});
        schoolCodes.put("2216422", new String[] {"0", "ПГ по механоел.", "ПГ по механоелектротехника", "https://pgme-sofia.eu"});
        schoolCodes.put("2217066", new String[] {"0", "66 СУ", "66 СУ Филип Станиславов", "https://66sou.org"});
        schoolCodes.put("2217149", new String[] {"0", "149 СУ", "149 СУ Иван Хаджийски", "https://www.149suih.org"});
        schoolCodes.put("2217426", new String[] {"0", "ПГ Ст. Григоров", "ПГ Д-р Стамен Григоров", "https://pg-drstamengrigorov.com"});
        schoolCodes.put("2218606", new String[] {"0", "СУ Св. Иван Рилски", "СУ Св. Иван Рилски", "https://su-ivanrilski.com"});
        schoolCodes.put("2219024", new String[] {"0", "24 СУ", "24 СУ Пейо К. Яворов", "https://24sou.eu"});
        schoolCodes.put("2219130", new String[] {"0", "130 СУ", "130 СУ Стефан Караджа", "https://130cy.com"});
        schoolCodes.put("2220029", new String[] {"0", "29 СУ", "29 СУ Кузман Шапкарев", "https://sou29.com"});
        schoolCodes.put("2220427", new String[] {"0", "ПГ по жел. трансп.", "ПГ по железопътен транспорт"});
        schoolCodes.put("2221093", new String[] {"0", "93 СУ", "93 СУ Ал. Теодоров - Балан", "https://93su.bg"});
        schoolCodes.put("2221094", new String[] {"0", "94 СУ", "94 СУ Д. Страшимиров", "https://school94-sofia.com"});
        schoolCodes.put("2221430", new String[] {"0", "ПГ по трансп. Макгахан", "ПГ по транспорт Макгахан", "https://pgtmakgahan.eu"});
        schoolCodes.put("2224047", new String[] {"0", "47 СУ", "47 СУ Христо Г. Данов", "https://47suhristodanov.com"});
        schoolCodes.put("2900001", new String[] {"0", "БСУ Христо Ботев", "Българско СУ Христо Ботев", "https://bsu-bratislava.com"});
        schoolCodes.put("2900102", new String[] {"0", "БСУ Петър Берон", "Българско СУ Д-р Петър Берон", "https://bgschool.eu"});
        schoolCodes.put("2200015", new String[] {"1", "Васил Златарски", "ЧОУ Проф. д-р Васил Златарски", "https://zlatarskischool.org"});
        schoolCodes.put("2202005", new String[] {"0", "5 ОУ", "5 ОУ Иван Вазов", "https://5ou-ivanvazov.com"});
        schoolCodes.put("2202050", new String[] {"0", "50 ОУ", "50 ОУ Васил Левски", "https://50ou-vasil-levski.com"});
        schoolCodes.put("2202052", new String[] {"0", "52 ОУ", "52 ОУ Цанко Церковски", "https://52ou.webnode.page"});
        schoolCodes.put("2202064", new String[] {"0", "64 ОУ", "64 ОУ Цар Симеон Велики", "https://64outsarsimeonveliki.com"});
        schoolCodes.put("2202537", new String[] {"1", "Св. София", "ЧОУ Света София", "https://svetasofia.com"});
        schoolCodes.put("2202620", new String[] {"1", "Николай Райнов", "ЧСУ Проф. Николай Райнов", "https://waldorf.bg"});
        schoolCodes.put("2202704", new String[] {"1", "Евл. и Хр. Георгиеви", "ЧСУ Евлоги и Христо Георгиеви", "https://unischool.bg"});
        schoolCodes.put("2203061", new String[] {"0", "61 ОУ", "61 ОУ Св. Св. Кирил и Методий", "https://ou-61.org"});
        schoolCodes.put("2203062", new String[] {"0", "62 ОУ", "62 ОУ Христо Ботев", "https://www.62ou.com"});
        schoolCodes.put("2203070", new String[] {"0", "70 ОУ", "70 ОУ Св. Климент Охридски", "https://70ou.com"});
        schoolCodes.put("2204046", new String[] {"0", "46 ОУ", "46 ОУ Константин Фотинов", "https://46ou.net"});
        schoolCodes.put("2204067", new String[] {"0", "67 ОУ", "67 ОУ Васил Друмев", "https://67ouvasildrumev.com"});
        schoolCodes.put("2204076", new String[] {"0", "76 ОУ", "76 ОУ Уилям Сароян", "https://76ou.eu"});
        schoolCodes.put("2204136", new String[] {"0", "136 ОУ", "136 ОУ Любен Каравелов", "https://136ou.com"});
        schoolCodes.put("2204595", new String[] {"1", "Светлина", "ЧОУ Светлина", "https://svetlina.net"});
        schoolCodes.put("2204674", new String[] {"1", "Езиков свят", "ЧОУ Езиков свят", "https://ezikovsviat.com"});
        schoolCodes.put("2205011", new String[] {"0", "11 ОУ", "11 ОУ Св. Пимен Зографски", "https://11oy.bg"});
        schoolCodes.put("2205521", new String[] {"1", "Св. Климент Охридски", "ЧОУ Св. Климент Охридски", "https://saintkliment.com"});
        schoolCodes.put("2206043", new String[] {"0", "43 ОУ", "43 ОУ Христо Смирненски", "https://43ou.com"});
        schoolCodes.put("2206045", new String[] {"0", "45 ОУ", "45 ОУ Константин Величков", "https://kv45ou.com"});
        schoolCodes.put("2207004", new String[] {"0", "4 ОУ", "4 ОУ Проф. Джон Атанасов", "https://4ou.bg"});
        schoolCodes.put("2207089", new String[] {"0", "89 ОУ", "89 ОУ Д-р Христо Стамболски", "https://sites.google.com/view/89ousofia"});
        schoolCodes.put("2207150", new String[] {"0", "150 ОУ", "150 ОУ Цар Симеон I", "https://150ou.org"});
        schoolCodes.put("2207163", new String[] {"0", "163 ОУ", "163 ОУ Черноризец Храбър", "https://163ou.bg"});
        schoolCodes.put("2208075", new String[] {"0", "75 ОУ", "75 ОУ Тодор Каблешков", "https://ou75sofia.com"});
        schoolCodes.put("2208092", new String[] {"0", "92 ОУ", "92 ОУ Димитър Талев", "https://92dimitartalev.com"});
        schoolCodes.put("2208147", new String[] {"0", "147 ОУ", "147 ОУ Йордан Радичков", "https://147ou.com"});
        schoolCodes.put("2209025", new String[] {"0", "25 ОУ", "25 ОУ Петър Берон", "https://25ou.bg"});
        schoolCodes.put("2209034", new String[] {"0", "34 ОУ", "34 ОУ Стою Шишков", "https://34ou.org"});
        schoolCodes.put("2209142", new String[] {"0", "142 ОУ", "142 ОУ Веселин Ханчев", "https://142ou.com"});
        schoolCodes.put("2210156", new String[] {"0", "156 ОбУ", "156 ОбУ Васил Левски", "https://156ou.bg"});
        schoolCodes.put("2210159", new String[] {"0", "159 ОУ", "159 ОУ Васил Левски", "https://ou159.com"});
        schoolCodes.put("2210162", new String[] {"0", "162 СУ", "162 СУ Отец Паисий", "https://162ou.com"});
        schoolCodes.put("2211107", new String[] {"0", "107 ОУ", "107 ОУ Хан Крум", "https://www.107ou.com"});
        schoolCodes.put("2211120", new String[] {"0", "120 ОУ", "120 ОУ Г. С. Раковски", "https://ou120.org"});
        schoolCodes.put("2211122", new String[] {"0", "122 ОУ", "122 ОУ Н. Лилиев", "https://122ou.com"});
        schoolCodes.put("2211139", new String[] {"0", "139 ОУ", "139 ОУ Захарий Круша", "https://www.139ou.com"});
        schoolCodes.put("2211518", new String[] {"1", "Петър Берон", "ЧОУ Д-р Петър Берон", "https://pberon.com"});
        schoolCodes.put("2211519", new String[] {"1", "Банкерче", "ЧОУ Банкерче"});
        schoolCodes.put("2211564", new String[] {"1", "Българско школо", "ЧСУ Българско школо", "https://bgshkolo.com"});
        schoolCodes.put("2211598", new String[] {"1", "Никатор", "ЧСУ Никатор", "https://ruliceum.org"});
        schoolCodes.put("2212027", new String[] {"0", "27 СУ", "27 СУ Акад. Георги Караславов", "https://27su.eu"});
        schoolCodes.put("2212033", new String[] {"0", "33 ОУ", "33 ОУ Санкт Петербург", "https://33-ou.com"});
        schoolCodes.put("2212077", new String[] {"0", "77 ОУ", "77 ОУ Св. Св. Кирил и Методий", "https://77ou-sofia.com"});
        schoolCodes.put("2212103", new String[] {"0", "103 ОУ", "103 ОУ Васил Левски", "https://103ouvasillevski.bg"});
        schoolCodes.put("2212553", new String[] {"1", "Петко Славейков", "ЧСУ Петко Рачов Славейков", "https://slaveikov-school.org"});
        schoolCodes.put("2212554", new String[] {"1", "Ерих Кестнер", "ЧОУ Ерих Кестнер", "https://e-kestner.eu"});
        schoolCodes.put("2213082", new String[] {"0", "82 ОУ", "82 ОУ Васил Априлов", "https://82ou.bg"});
        schoolCodes.put("2213145", new String[] {"0", "145 ОУ", "145 ОУ Симеон Радев", "https://145ou.com"});
        schoolCodes.put("2213502", new String[] {"1", "Меридиан 22", "ЧОУ Меридиан 22", "https://meridian22.bg"});
        schoolCodes.put("2213506", new String[] {"1", "ЕСПА", "ЧСУ с РЧЕО ЕСПА", "https://espa.bg"});
        schoolCodes.put("2213721", new String[] {"1", "Азбуки", "ЧОУ Азбуки", "https://azbuki-school.bg"});
        schoolCodes.put("2214016", new String[] {"0", "16 ОУ", "16 ОУ Райко Жинзифов", "https://ou16.bg"});
        schoolCodes.put("2214063", new String[] {"0", "63 ОУ", "63 ОУ Христо Ботев", "https://63ou.bg"});
        schoolCodes.put("2214102", new String[] {"0", "102 ОУ", "102 ОУ Панайот Волов", "https://102ou.com"});
        schoolCodes.put("2214141", new String[] {"0", "141 ОУ", "141 ОУ Народни будители", "https://141ou.com"});
        schoolCodes.put("2216112", new String[] {"0", "112 ОУ", "112 ОУ Стоян Заимов", "https://112ou.org"});
        schoolCodes.put("2216129", new String[] {"0", "129 ОУ", "129 ОУ Антим I", "https://129ou.bg"});
        schoolCodes.put("2217053", new String[] {"0", "53 ОУ", "53 ОУ Николай Хрелков", "https://53ou.com"});
        schoolCodes.put("2217072", new String[] {"0", "72 ОУ", "72 ОУ Христо Ботев"});
        schoolCodes.put("2217525", new String[] {"1", "Стремеж", "ЧОУ Стремеж", "https://stremezh-education.com"});
        schoolCodes.put("2217575", new String[] {"1", "Евростар", "ЧСУ Евростар"});
        schoolCodes.put("2217722", new String[] {"1", "Томас Едисън", "ЧОУ Томас Едисън", "https://edisonschool.eu"});
        schoolCodes.put("2218083", new String[] {"0", "83 ОУ", "83 ОУ Елин Пелин", "https://83ou.org"});
        schoolCodes.put("2218084", new String[] {"0", "84 ОУ", "84 ОУ Васил Левски", "https://84ou.com"});
        schoolCodes.put("2218703", new String[] {"1", "Изгрев", "ЧОУ Изгрев", "https://izgrevou.com"});
        schoolCodes.put("2219042", new String[] {"0", "42 ОУ", "42 ОУ Хаджи Димитър", "https://42ou.com"});
        schoolCodes.put("2219049", new String[] {"0", "49 ОУ", "49 ОУ Бенито Хуарес", "https://49ousofia.com"});
        schoolCodes.put("2219106", new String[] {"0", "106 ОУ", "106 ОУ Григорий Цамблак", "https://106ou.info"});
        schoolCodes.put("2219124", new String[] {"0", "124 ОУ", "124 ОУ Васил Левски", "https://124-ou.com"});
        schoolCodes.put("2219143", new String[] {"0", "143 ОУ", "143 ОУ Г. Бенковски", "https://143ou.com"});
        schoolCodes.put("2219199", new String[] {"0", "199 ОУ", "199 ОУ Св. Ап. Йоан Богослов", "https://199ou.bg"});
        schoolCodes.put("2220048", new String[] {"0", "48 ОУ", "48 ОУ Й. Ковачев", "https://48-ou.com"});
        schoolCodes.put("2220058", new String[] {"0", "58 ОУ", "58 ОУ Сергей Румянцев", "https://58ou.bg"});
        schoolCodes.put("2220059", new String[] {"0", "59 СУ", "59 СУ Васил Левски", "https://sites.google.com/view/59sou"});
        schoolCodes.put("2220060", new String[] {"0", "60 ОУ", "60 ОУ Св. Св. Кирил и Методий", "https://60ousvsvkirilimetodii.com"});
        schoolCodes.put("2220100", new String[] {"0", "100 ОУ", "100 ОУ Найден Геров", "https://www.100ou.info"});
        schoolCodes.put("2221109", new String[] {"0", "109 ОУ", "109 ОУ Христо Смирненски", "https://109ou.net"});
        schoolCodes.put("2221148", new String[] {"0", "148 ОУ", "148 ОУ Проф. д-р Л. Милетич", "https://148ou.bg"});
        schoolCodes.put("2221501", new String[] {"1", "Образов. технологии", "ЧОУ Образователни технологии", "https://eduteh.eu"});
        schoolCodes.put("2221614", new String[] {"1", "Джани Родари", "ЧСУ Джани Родари", "https://djanirodari.org"});
        schoolCodes.put("2222006", new String[] {"0", "6 ОУ", "6 ОУ Граф Игнатиев", "https://6ou.bg"});
        schoolCodes.put("2222038", new String[] {"0", "38 ОУ", "38 ОУ Васил Априлов", "https://vasilaprilov.com"});
        schoolCodes.put("2223008", new String[] {"0", "8 СУ", "8 СУ Васил Левски", "https://8sou.com"});
        schoolCodes.put("2223055", new String[] {"0", "55 СУ", "55 СУ Петко Каравелов", "https://55su.bg"});
        schoolCodes.put("2224020", new String[] {"0", "20 ОУ", "20 ОУ Тодор Минков", "https://20ou.bg"});
        schoolCodes.put("2224041", new String[] {"0", "41 ОУ", "41 ОУ Св. Патриарх Евтимий", "https://41ou.com"});
        schoolCodes.put("2224104", new String[] {"0", "104 ОУ", "104 ОУ Захари Стоянов", "https://104ou.com"});
        schoolCodes.put("2224126", new String[] {"0", "126 ОУ", "126 ОУ Петко Тодоров", "https://sites.google.com/126ou.net/new"});
        schoolCodes.put("2224544", new String[] {"1", "Артис", "ЧСУ Артис", "https://artisbg.com"});
        schoolCodes.put("2224672", new String[] {"1", "Куест", "ЧОУ Куест", "https://questschool.bg"});
        schoolCodes.put("2224677", new String[] {"1", "Прогресивно обр. 1", "ОПУ Прогресивно обр. 1", "https://school1.transform.bg"});
        schoolCodes.put("2200037", new String[] {"1", "Прогресивно обр. 3", "ОПУ Прогресивно обр. 3", "https://school3.transform.bg"});
        schoolCodes.put("2204676", new String[] {"1", "Кралица София Исп.", "ЧСУ Кралица София Испанска"});
        schoolCodes.put("2200021", new String[] {"1", "Роналд Лаудер", "ЧСУ Роналд Лаудер", "https://lauderschool.bg"});
        schoolCodes.put("2200023", new String[] {"1", "Константин-Кирил", "ЧСУ Константин-Кирил Философ", "https://kkf.bg"});
        schoolCodes.put("2200024", new String[] {"1", "Наука за деца", "ЧСУ Наука за деца", "https://izzi.academy"});
        schoolCodes.put("2202705", new String[] {"1", "Откривател", "ЧОУ Откривател", "https://montessorischools.bg"});
        schoolCodes.put("2214098", new String[] {"0", "98 НУ", "98 НУ Св. Св. Кирил и Методий", "https://nu98.org"});
        schoolCodes.put("2221621", new String[] {"1", "Питагор", "ЧСУ Питагор", "https://pitagor-school.eu"});
        schoolCodes.put("2201078", new String[] {"0", "78 СУ", "78 СУ Христо Смирненски", "https://78su.net"});
        schoolCodes.put("2201505", new String[] {"1", "Фоти", "ЧНУ Фоти"});
        schoolCodes.put("2202086", new String[] {"0", "86 ОУ", "86 ОУ Св. Климент Охридски", "https://86ou.bg"});
        schoolCodes.put("2202152", new String[] {"0", "152 ОУ", "152 ОУ Св. Св. Кирил и Методий", "https://152oy-murchaevo.com"});
        schoolCodes.put("2203146", new String[] {"0", "146 ОУ", "146 ОУ Патриарх Евтимий"});
        schoolCodes.put("2203175", new String[] {"0", "175 ОУ", "175 ОУ Васил Левски", "https://ou175.bg"});
        schoolCodes.put("2207065", new String[] {"0", "65 ОУ", "65 ОУ Св. Св. Кирил и Методий", "https://65ou.ucoz.com"});
        schoolCodes.put("2210115", new String[] {"0", "115 ОУ", "115 ОУ Св. Св. Кирил и Методий", "https://ou115.com"});
        schoolCodes.put("2210116", new String[] {"0", "116 ОУ", "116 ОУ Паисий Хилендарски", "https://116ouphilendarski.org"});
        schoolCodes.put("2215160", new String[] {"0", "160 ОУ", "160 ОУ Кирил и Методий", "https://ou-160.com"});
        schoolCodes.put("2215170", new String[] {"0", "170 СУ", "170 СУ Васил Левски", "https://170su.com"});
        schoolCodes.put("2215171", new String[] {"0", "171 ОУ", "171 ОУ Стоил Попов", "https://171ou.bg"});
        schoolCodes.put("2215172", new String[] {"0", "172 ОбУ", "172 ОбУ Христо Ботев", "https://172obu.com"});
        schoolCodes.put("2215176", new String[] {"0", "176 ОбУ", "176 ОбУ Св. Св. Кирил и Методий", "https://ou176-negovan.com"});
        schoolCodes.put("2215177", new String[] {"0", "177 ОУ", "177 ОУ Св. Св. Кирил и Методий", "https://177ou.com"});
        schoolCodes.put("2215179", new String[] {"0", "179 ОУ", "179 ОУ Васил Левски", "https://179ou.com"});
        schoolCodes.put("2218071", new String[] {"0", "71 СУ", "71 СУ Пейо Яворов", "https://71sou.org"});
        schoolCodes.put("2218191", new String[] {"0", "191 ОУ", "191 ОУ Отец Паисий", "https://191ou.info"});
        schoolCodes.put("2218192", new String[] {"0", "192 СУ", "192 СУ Христо Ботев", "https://hristobotev.net"});
        schoolCodes.put("2218200", new String[] {"0", "200 ОУ", "200 ОУ Отец Паисий", "https://200ou.org"});
        schoolCodes.put("2218201", new String[] {"0", "201 ОУ", "201 ОУ Св. Св. Кирил и Методий", "https://201ou.alle.bg"});
        schoolCodes.put("2218202", new String[] {"0", "202 ОУ", "202 ОУ Христо Ботев", "https://202ou.com"});
        schoolCodes.put("2201400", new String[] {"0", "ПГТ - Банкя", "ПГ по туризъм А. Константинов", "https://pgtbankya.com"});
        schoolCodes.put("2200039", new String[] {"1", "Асен Йорданов", "ЧГ по прир. науки и предпр. Асен Йорданов", "https://tzarsimeon.bg"});
        schoolCodes.put("2200013", new String[] {"1", "СофтУни Будител", "ЧПГ по дигитални науки СофтУни Будител", "https://buditel.softuni.bg"});
        schoolCodes.put("2200014", new String[] {"1", "Светилник", "ЧНУ Светилник", "https://svetilnik.bg"});
        schoolCodes.put("2200022", new String[] {"1", "Милеа", "ЧОУ Милеа", "https://school.milea.bg"});
        schoolCodes.put("2200031", new String[] {"1", "Канадско мече", "ЧСУ Канадско мече", "https://maplebear.bg"});
        schoolCodes.put("2200045", new String[] {"1", "Фюжън", "ЧОУ Фюжън", "https://school.fusion.bg"});
        schoolCodes.put("2200034", new String[] {"1", "Дени Дидро", "ЧСУ Дени Дидро", "https://denisdiderot.bg"});
        schoolCodes.put("2300005", new String[] {"1", "Космос", "ЧСУ Космос", "https://cischool.bg"});
        schoolCodes.put("2303852", new String[] {"1", "Челопеч", "ЧПГ Челопеч", "https://pelss-chelopech.bg"});
        schoolCodes.put("2200042", new String[] {"1", "Акатамус", "ЧПГ Акатамус", "https://acatamus.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPlovdiv() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1690150", new String[]{"0", SU_LIUBEN_KARAVELOV_SHORT, SU_LIUBEN_KARAVELOV_LONG, "https://sulkaravelovpd.eu"});
        schoolCodes.put("1690153", new String[]{"0", "Хуманитарна гимназия", "Хуманитарна гимназия Св. Св. Кирил и Методий"});
        schoolCodes.put("1690154", new String[]{"0", SU_PAISII_HILENDARSKI_SHORT, SU_PAISII_HILENDARSKI_LONG, "https://paisii.info"});
        schoolCodes.put("1690155", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG, "https://suklohridski.eu"});
        schoolCodes.put("1690156", new String[]{"0", SU_PATRIARH_EVTIMII_SHORT, SU_PATRIARH_EVTIMII_LONG, "https://patriarcha.com"});
        schoolCodes.put("1690157", new String[]{"0", SU_TSAR_SIMEON_VELIKI_SHORT, SU_TSAR_SIMEON_VELIKI_LONG, "https://csv-plovdiv.com"});
        schoolCodes.put("1690174", new String[]{"0", "ПГ по електрот. и електрон.", "ПГ по електротехника и електроника", "https://pgee-plovdiv.com"});
        schoolCodes.put("1690175", new String[]{"0", "НТГ", "Национална Търговска Гимназия", "https://ntg-plovdiv.net"});
        schoolCodes.put("1690176", new String[]{"0", "ПГ по облекло", "ПГ по облекло Ана Май", "https://pgoanamay.com"});
        schoolCodes.put("1690177", new String[]{"0", "ПГВАД Хр. Ботев", "ПГ по вътрешна архитектура и дървообработване"});
        schoolCodes.put("1690178", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Проф д-р Асен Златаров", "https://pgt-zlatarov-plovdiv.com"});
        schoolCodes.put("1690179", new String[]{"0", "ПГ по битова техника", "ПГ по битова техника", "https://pgbt-plovdiv-bg.com"});
        schoolCodes.put("1690187", new String[]{"0", "Духовна семинария", "Пловдивска духовна семинария", "https://seminaria.bg"});
        schoolCodes.put("1690247", new String[]{"0", SU_NAIDEN_GEROV, SU_NAIDEN_GEROV, "https://naidengerov-pd.org"});
        schoolCodes.put("1690271", new String[]{"0", "У-ще за ученици с увр. слух", "Специално училище за ученици с увреден слух", "https://spu-belinov.com"});
        schoolCodes.put("1690272", new String[]{"0", "ПГ по арх., строит. и геод.", "ПГ по архитектура строителство и геодезия", "https://pgasg-plovdiv.com"});
        schoolCodes.put("1690273", new String[]{"0", "ПГ по трансп. и стр. техн.", "ПГ по транспорт и строителни технологии", "https://pgtst-plovdiv.com"});
        schoolCodes.put("1690274", new String[]{"0", "ПГ по строит. техн.", "ПГ по строителни технологии Пеньо Пенев"});
        schoolCodes.put("1690345", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://www.ecoschoolplovdiv.bg"});
        schoolCodes.put("1690346", new String[]{"0", "МГ Акад. Кирил Попов", "МГ Акад. Кирил Попов", "https://omg-bg.com"});
        schoolCodes.put("1690347", new String[]{"0", "СпУ Васил Левски", "Спортно у-ще Васил Левски", "https://suvlevski.com"});
        schoolCodes.put("1690446", new String[]{"0", SU_NIKOLA_VAPTSAROV, SU_NIKOLA_VAPTSAROV, "https://vapcarov.com"});
        schoolCodes.put("1690447", new String[]{"0", SU_PEIO_YAVOROV, SU_PEIO_YAVOROV, "https://suyavorov.com"});
        schoolCodes.put("1690448", new String[]{"0", SU_HRISTO_GRUEV_DANOV_SHORT, SU_HRISTO_GRUEV_DANOV_LONG, "https://soudanov.org"});
        schoolCodes.put("1690449", new String[]{"0", "ЕГ Пловдив", "ЕГ Пловдив"});
        schoolCodes.put("1690450", new String[]{"0", "ЕГ Иван Вазов", "ЕГ Иван Вазов", "https://egiv-plovdiv.bg"});
        schoolCodes.put("1690451", new String[]{"0", "Френска ЕГ", "Френска ЕГ Антоан дьо Сент-Екзюпери", "https://feg-exupery.com"});
        schoolCodes.put("1690472", new String[]{"0", "ПГ по хр. техн. и техника", "ПГ по хранителни технологии и техника", "https://pghtt.net"});
        schoolCodes.put("1690473", new String[]{"0", "ПГ по кожени изделия", "ПГ по кожени изделия и текстил Д-р Иван Богоров", "https://pgkitbogorov-plovdiv.com"});
        schoolCodes.put("1690542", new String[]{"0", SU_BRATYA_MILADINOVI, SU_BRATYA_MILADINOVI, "https://miladinovi.eu"});
        schoolCodes.put("1690549", new String[]{"0", SU_KONSTANTIN_VELICHKOV_SHORT, SU_KONSTANTIN_VELICHKOV_LONG, "https://soukv.com"});
        schoolCodes.put("1690550", new String[]{"0", SU_K_KIRIL_FILOSOF_SHORT, SU_K_KIRIL_FILOSOF_LONG, "https://kkfilosof.com"});
        schoolCodes.put("1690572", new String[]{"0", "ПГ по механотехника", "ПГ по механотехника", "https://pgmtplovdiv.info"});
        schoolCodes.put("1690573", new String[]{"0", "ПГ по машиностроене", "ПГ по машиностроене", "https://pgm-plovdiv.com"});
        schoolCodes.put("1690642", new String[]{"0", SU_DIMITAR_MATEVSKI, SU_DIMITAR_MATEVSKI, "https://sudm.eu"});
        schoolCodes.put("1690643", new String[]{"0", SU_SEDMOCHISLENITSI_SHORT, SU_SEDMOCHISLENITSI_LONG, "https://sou7.org"});
        schoolCodes.put("1690644", new String[]{"0", SU_SOFRONII_VRACHANSKI, SU_SOFRONII_VRACHANSKI, "https://sofrony.net"});
        schoolCodes.put("1690645", new String[]{"0", SU_CHERNORIZETS_HRABAR_SHORT, SU_CHERNORIZETS_HRABAR_LONG, "https://cherhrab.com"});
        schoolCodes.put("1690901", new String[]{"1", "Дружба", "ЧСУ Дружба", "https://drujbaplovdiv.bg"});
        schoolCodes.put("1690904", new String[]{"1", "Класик", "ЧПГ Класик", "https://classicschool.org"});
        schoolCodes.put("1690906", new String[]{"1", "Едмънд Бърк", "ЧПГ Едмънд Бърк", "https://edburk.eu"});
        schoolCodes.put("1690909", new String[]{"1", "Стоян Сариев", "ЧЕГ Стоян Сариев", "https://sarievschools.eu"});
        schoolCodes.put("1690910", new String[]{"1", "Икономика и управление", "ЧПГ по икономика и управление", "https://chpgiu.org"});
        schoolCodes.put("2902102", new String[]{"0", "НУМТИ", "НУМТИ Добрин Петков", "https://plovdivmusicschool.wordpress.com"});
        schoolCodes.put("2902302", new String[]{"0", "НГСЕИ", "Гимназия за сценични и екранни изкуства"});
        schoolCodes.put("2902402", new String[]{"0", "НХГ Ц. Лавренов", "Национална художествена гимназия", "https://nhglavrenov.bg"});
        schoolCodes.put("1690142", new String[]{"0", OU_ALEKO_KONSTANTINOV_SHORT, OU_ALEKO_KONSTANTINOV_LONG, "https://oualeko.com"});
        schoolCodes.put("1690143", new String[]{"0", OU_TIUTIUNDZHYAN, OU_TIUTIUNDZHYAN, "https://tutunjian.bg"});
        schoolCodes.put("1690144", new String[]{"0", OU_GEO_MILEV, OU_GEO_MILEV, "https://ougeomilev.eu"});
        schoolCodes.put("1690146", new String[]{"0", OU_PETAR_BERON, OU_PETAR_BERON, "https://petarberon.com"});
        schoolCodes.put("1690147", new String[]{"0", OU_DUSHO_HADZHIDEKOV, OU_DUSHO_HADZHIDEKOV, "https://sites.google.com/oudh.org/oudh"});
        schoolCodes.put("1690148", new String[]{"0", "ОУ Екзарх Антим I", "ОУ Екзарх Антим I", "https://ekzarhantim1.com"});
        schoolCodes.put("1690149", new String[]{"0", OU_KOCHO_CHESTEMENSKI, OU_KOCHO_CHESTEMENSKI, "https://chestemenski.com"});
        schoolCodes.put("1690152", new String[]{"0", "ОУ Кн. Александър I", "ОУ Княз Александър I", "https://ka1.bg"});
        schoolCodes.put("1690244", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://vasil-levski.net"});
        schoolCodes.put("1690245", new String[]{"0", OU_DIMCHO_DEBELYANOV, OU_DIMCHO_DEBELYANOV, "https://oudebelyanov.com"});
        schoolCodes.put("1690246", new String[]{"0", "ОбУ Пенчо Славейков", "ОбУ Пенчо Славейков", "https://ouslavejkov.org"});
        schoolCodes.put("1690248", new String[]{"0", SU_SIMON_BOLIVAR, SU_SIMON_BOLIVAR, "https://sousimonbolivar.com"});
        schoolCodes.put("1690341", new String[]{"0", OU_VASIL_PETLESHKOV, OU_VASIL_PETLESHKOV, "https://oupetleshkov.org"});
        schoolCodes.put("1690342", new String[]{"0", OU_DRAGAN_MANCHOV, OU_DRAGAN_MANCHOV, "https://draganmanchov.info"});
        schoolCodes.put("1690343", new String[]{"0", OU_ELIN_PELIN, OU_ELIN_PELIN, "https://elinpelinpld.webnode.page"});
        schoolCodes.put("1690344", new String[]{"0", OU_TODOR_KABLESHKOV, OU_TODOR_KABLESHKOV, "https://kableshkov.com"});
        schoolCodes.put("1690442", new String[]{"0", OU_DIMITAR_DIMOV, OU_DIMITAR_DIMOV, "https://oudimitardimov.com"});
        schoolCodes.put("1690443", new String[]{"0", "ОбУ Й. Йовков", "ОбУ Йордан Йовков", "https://www.jovkovplovdiv.com"});
        schoolCodes.put("1690444", new String[]{"0", OU_PANAIOT_VOLOV, OU_PANAIOT_VOLOV, "https://www.daskalo.com/pdndiotvolov/"});
        schoolCodes.put("1690445", new String[]{"0", OU_RAINA_KNYAGINYA, OU_RAINA_KNYAGINYA, "https://rainakniaginia.com"});
        schoolCodes.put("1690544", new String[]{"0", OU_DIMITAR_TALEV, OU_DIMITAR_TALEV, "https://www.ou-dtalev.info/talev/"});
        schoolCodes.put("1690545", new String[]{"0", OU_ZAHARI_STOYANOV, OU_ZAHARI_STOYANOV, "https://ou-zstoyanov-plovdiv.com"});
        schoolCodes.put("1690546", new String[]{"0", OU_STOYAN_MIHAILOVSKI_SHORT, OU_STOYAN_MIHAILOVSKI_LONG, "https://ou-stmihaylovski.com"});
        schoolCodes.put("1690547", new String[]{"0", OU_YANE_SANDANSKI, OU_YANE_SANDANSKI, "https://sandanskiplovdiv.bg"});
        schoolCodes.put("1690907", new String[]{"1", "Класик", "ЧОУ Класик", "https://classicschool.org"});
        schoolCodes.put("1690912", new String[]{"1", "Бъдеще", "ЧОУ Бъдеще", "https://sarievschools.eu"});
        schoolCodes.put("1690242", new String[] {"0", "НУ Кирил Нектариев", "39 НУ Кирил Нектариев", "https://knektariev.com"});
        schoolCodes.put("1690243", new String[] {"0", "НУ Петко Славейков", "НУ Петко Рачов Славейков", "https://nu-prslaveikov-plovdiv.eu"});
        schoolCodes.put("1690441", new String[] {"0", NU_HRISTO_BOTEV, NU_HRISTO_BOTEV, "https://nu-hrbotev.org"});
        schoolCodes.put("1690543", new String[] {"0", NU_KLIMENT_OHRIDSKI_SHORT, NU_KLIMENT_OHRIDSKI_LONG, "https://ohridski.net"});
        schoolCodes.put("1600026", new String[] {"1", "Информ. и комп. науки", "ЧПГ по информатика и комп. науки", "https://gikn.eu"});
        schoolCodes.put("1600017", new String[] {"1", "Талантите", "ЧСБУ Талантите", "https://talantite.org"});
        schoolCodes.put("1600033", new String[] {"1", "Искра", "ЧОУ Искра", "https://iskraschool.bg"});
        schoolCodes.put("1600018", new String[] {"1", "Слънчев лъч", "ЧОУ Слънчев лъч", "https://sun-ray-school.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVarna() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2902106", new String[]{"0", "НУИ Добри Христов", "НУИ Добри Христов", "https://artschool-varna.com"});
        schoolCodes.put("400030", new String[]{"0", "7 СУ Н. Геров", "7 СУ Найден Геров", "https://7suvarna.com"});
        schoolCodes.put("400031", new String[]{"0", "СУЕО Пушкин", "СУЕО Ал. С. Пушкин", "https://sueovarna.com"});
        schoolCodes.put("400033", new String[]{"0", "СпУ Г. Бенковски", "Спортно у-ще Г. Бенковски", "https://sportno-varna.com"});
        schoolCodes.put("400034", new String[]{"0", SU_GEO_MILEV, SU_GEO_MILEV, "https://geomilev.info"});
        schoolCodes.put("400036", new String[]{"0", SU_ELIN_PELIN, SU_ELIN_PELIN, "https://elinpelin-varna.com"});
        schoolCodes.put("400037", new String[]{"0", SU_LIUBEN_KARAVELOV_SHORT, SU_LIUBEN_KARAVELOV_LONG, "https://soukaravelov.com"});
        schoolCodes.put("400039", new String[]{"0", SU_PEIO_YAVOROV, SU_PEIO_YAVOROV, "https://souyavorov-varna.com"});
        schoolCodes.put("400040", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG, "https://klimentvarna.com"});
        schoolCodes.put("400041", new String[]{"0", "3 ПМГ М. Попов", "3 ПМГ Акад. Методий Попов", "https://pmg3-varna.org"});
        schoolCodes.put("400042", new String[]{"0", "4 ЕГ Ф. Ж. Кюри", "4 ЕГ Фредерик Жолио-Кюри", "https://4egvarna.com"});
        schoolCodes.put("400043", new String[]{"0", "ГПЧЕ Й. Екзарх", "ГПЧЕ Йоан Екзарх", "https://5eg.org"});
        schoolCodes.put("400044", new String[]{"0", "ПГИТ И. Богоров", "ПГ по икономика и технологии", "https://pgi-varna.com"});
        schoolCodes.put("400045", new String[]{"0", "1 ЕГ", "Първа ЕГ", "https://1eg.eu"});
        schoolCodes.put("400046", new String[]{"0", "МГ Петър Берон", "МГ Д-р Петър Берон", "https://mgberon.com"});
        schoolCodes.put("400047", new String[]{"0", "СУ за ХНИ", "СУ за хуманитарни науки и изкуства", "https://hnivarna.eu"});
        schoolCodes.put("400054", new String[]{"0", "Спец. у-ще за уч. с нар. зр.", "Специално у-ще за ученици с нарушено зрение", "https://suunzvarna.com"});
        schoolCodes.put("400055", new String[]{"0", "Проф. техн. гимназия", "Професионална техническа гимназия", "https://ptgvarna.com"});
        schoolCodes.put("400058", new String[]{"0", "ПГ по хим. и хр.-вк. техн.", "ПГ по химични и хранително-вкусови технологии", "https://pghhvt-varna.com"});
        schoolCodes.put("400063", new String[]{"0", "ПГ по стр., арх. и геод.", "ПГ по строителство, архитектура и геодезия", "https://pgsag-varna.com"});
        schoolCodes.put("400070", new String[]{"1", "Търговска гимназия", "Частна Търговска Гимназия Конто Трейд", "https://tradescl.com"});
        schoolCodes.put("400074", new String[]{"1", "А. Екзюпери", "ЧПГ Антоан дьо Сент-Екзюпери", "https://exupery.net"});
        schoolCodes.put("400076", new String[]{"1", "Джордж Байрон", "ЧЕГ Джордж Байрон", "https://byronschool-varna.com"});
        schoolCodes.put("402030", new String[]{"0", "Варненска търг. гимназия", "Варненска търговска гимназия", "https://vtg-rakovski.eu"});
        schoolCodes.put("402161", new String[]{"0", "ПГ по текстил и моден дизайн", "ПГ по текстил и моден дизайн", "https://pgtmd-varna.com"});
        schoolCodes.put("402172", new String[]{"0", "ПГ по горско стопанство", "ПГ по горско стопанство и дървообр.", "https://pggsd-varna.com"});
        schoolCodes.put("402183", new String[]{"0", "Варненска морска гимназия", "Варненска морска гимназия", "https://vmg.bg"});
        schoolCodes.put("403531", new String[]{"0", "ПГ по електротехника", "ПГ по електротехника", "https://pgevarna.com"});
        schoolCodes.put("403534", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм", "https://pgtvarna.com"});
        schoolCodes.put("403537", new String[]{"0", SU_DIMCHO_DEBELYANOV, SU_DIMCHO_DEBELYANOV});
        schoolCodes.put("403538", new String[]{"0", SU_NEOFIT_BOZVELI, SU_NEOFIT_BOZVELI, "https://neofit-bozveli.bg"});
        schoolCodes.put("403558", new String[]{"1", "Мечтатели", "ЧСУ Мечтатели", "https://mechtateli.eu"});
        schoolCodes.put("403564", new String[]{"1", "Мария Монтесори", "ЧСУ Мария Монтесори", "https://montessori-varna.com"});
        schoolCodes.put("400003", new String[]{"0", OU_ANTON_STRASHIMIROV_SHORT, OU_ANTON_STRASHIMIROV_LONG, "https://oustrashimirov.bg"});
        schoolCodes.put("400005", new String[]{"0", OU_VASIL_APRILOV, OU_VASIL_APRILOV, "https://ouvasilaprilov.com"});
        schoolCodes.put("400006", new String[]{"0", OU_G_S_RAKOVSKI, OU_G_S_RAKOVSKI, "https://ourakovski.com"});
        schoolCodes.put("400007", new String[]{"0", OU_DOBRI_CHINTULOV, OU_DOBRI_CHINTULOV, "https://dobri-chintulov-varna.bg"});
        schoolCodes.put("400008", new String[]{"0", OU_ZAHARI_STOYANOV, OU_ZAHARI_STOYANOV, "https://ou-zaharistoyanov.com"});
        schoolCodes.put("400009", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV, "https://ouivazov-varna.bg"});
        schoolCodes.put("400010", new String[]{"0", OU_IVAN_RILSKI_SHORT, OU_IVAN_RILSKI_LONG, "https://ou-ivanrilski.com"});
        schoolCodes.put("400011", new String[]{"0", OU_IORDAN_IOVKOV, OU_IORDAN_IOVKOV, "https://www.yovkovschoolvarna.bg"});
        schoolCodes.put("400012", new String[]{"0", OU_KONSTANTIN_ARABADZHIEV_SHORT, OU_KONSTANTIN_ARABADZHIEV_LONG, "https://oukonstantinarabadjiev.com"});
        schoolCodes.put("400015", new String[]{"0", "ОУ Кап. Петко войвода", "ОУ Кап. Петко войвода", "https://ou-kap-petko.com"});
        schoolCodes.put("400017", new String[]{"0", OU_OTEC_PAISII, OU_OTEC_PAISII, "https://ou-paisii.com"});
        schoolCodes.put("400018", new String[]{"0", OU_PANAIOT_VOLOV, OU_PANAIOT_VOLOV, "https://oupvolov.com"});
        schoolCodes.put("400019", new String[]{"0", OU_PATRIARH_EVTIMII_SHORT, OU_PATRIARH_EVTIMII_LONG, "https://patriarha.com"});
        schoolCodes.put("400020", new String[]{"0", OU_PETKO_SLAVEIKOV, OU_PETKO_SLAVEIKOV, "https://slaveykov.net"});
        schoolCodes.put("400022", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://ousvsvkirilimetodii.com"});
        schoolCodes.put("400023", new String[]{"0", OU_STEFAN_KARADZHA, OU_STEFAN_KARADZHA, "https://stefankaradja.com"});
        schoolCodes.put("400024", new String[]{"0", OU_STOYAN_MIHAILOVSKI_SHORT, OU_STOYAN_MIHAILOVSKI_LONG, "https://oustmihaylovski.org"});
        schoolCodes.put("400026", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://hristobotev-varna.com"});
        schoolCodes.put("400028", new String[]{"0", "ОУ Цар Симеон І", "ОУ Цар Симеон І", "https://ousimeon.com"});
        schoolCodes.put("400029", new String[]{"0", OU_CHERNORIZETS_HRABAR_SHORT, OU_CHERNORIZETS_HRABAR_LONG, "https://chernorizets.com"});
        schoolCodes.put("400032", new String[]{"0", OU_VASIL_DRUMEV, OU_VASIL_DRUMEV, "https://oudrumev.com"});
        schoolCodes.put("400061", new String[]{"1", "Аз съм българче", "ЧСУ Аз съм българче", "https://balgarche.eu"});
        schoolCodes.put("400075", new String[]{"1", "Малкият принц", "ЧОУ Малкият принц", "https://thelittleprinceschool.com"});
        schoolCodes.put("403535", new String[]{"0", "ОУ Княз Борис I", "ОУ Св. Княз Борис I", "https://1ou-varna.com"});
        schoolCodes.put("403536", new String[]{"0", "3 ОУ А. Кънчев", "3 ОУ Ангел Кънчев", "https://3ou-akanchev-vn.com"});
        schoolCodes.put("403543", new String[]{"0", "2 ОУ Н. Вапцаров", "2 ОУ Н. Вапцаров"});
        schoolCodes.put("400001", new String[] {"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI, "https://nu-levski.com"});
        schoolCodes.put("400120", new String[] {"1", "Монтесори Варна", "ЧОУ Монтесори Варна", "https://montessorischoolvarna.eu"});
        schoolCodes.put("400065", new String[] {"1", "Прогресивно обр. 2", "ОПУ Прогресивно обр. 2", "https://school2.transform.bg"});
        schoolCodes.put("400167", new String[] {"1", "Феникс", "ЧОУ Феникс 2020", "https://fenix-park.eu"});
        schoolCodes.put("400132", new String[] {"1", "Демокр. образов.", "ЧСУ Демократично образование", "https://demokratichno.com"});
        schoolCodes.put("400104", new String[] {"0", "ПГ по комп. моделиране", "ПГ по комп. моделиране и комп. системи", "https://itpg-varna.bg"});
        schoolCodes.put("403559", new String[] {"1", "Юрий Гагарин", "ЧСУ Юрий Гагарин"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBurgas() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200221", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://suhristobotevburgas.com"});
        schoolCodes.put("200227", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV, "https://ivazov-burgas.com"});
        schoolCodes.put("200228", new String[]{"0", SU_IORDAN_IOVKOV, SU_IORDAN_IOVKOV, "https://jovkov.org"});
        schoolCodes.put("200229", new String[]{"0", SU_K_PRESLAVSKI_SHORT, SU_K_PRESLAVSKI_LONG, "https://preslavski.org"});
        schoolCodes.put("200230", new String[]{"0", SU_DIMCHO_DEBELYANOV, SU_DIMCHO_DEBELYANOV, "https://ddebelyanov-bs.com"});
        schoolCodes.put("200231", new String[]{"0", SU_DOBRI_CHINTULOV, SU_DOBRI_CHINTULOV, "https://dchintulov.com"});
        schoolCodes.put("200232", new String[]{"0", SU_KONSTANTIN_PETKANOV_SHORT, SU_KONSTANTIN_PETKANOV_LONG, "https://su-konstantin-petkanov.com"});
        schoolCodes.put("200233", new String[]{"0", SU_PETKO_ROSEN, SU_PETKO_ROSEN, "https://petko-rosen.com"});
        schoolCodes.put("200234", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://sukim.bg"});
        schoolCodes.put("200235", new String[]{"0", "ПГ за романски езици", "ПГ за романски езици", "https://gre-rakovski.com"});
        schoolCodes.put("200236", new String[]{"0", "Английска ЕГ", "Английска ЕГ Гео Милев", "https://gpaeburgas.org"});
        schoolCodes.put("200237", new String[]{"0", "НЕГ Гьоте", "Немска езикова гимназия Гьоте", "https://neg-goethe.org"});
        schoolCodes.put("200238", new String[]{"0", "ПГ за чужди езици", "ПГ за чужди езици Васил Левски", "https://gimnasy-rus-bs.net"});
        schoolCodes.put("200239", new String[]{"0", "ППМГ", "ППМГ Акад. Никола Обрешков", "https://pmgbs.com"});
        schoolCodes.put("200240", new String[]{"0", "СпУ Юрий Гагарин", "Спортно у-ще Юрий Гагарин", "https://sportnotoburgas.com"});
        schoolCodes.put("200242", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм", "https://pgtbs.com"});
        schoolCodes.put("200243", new String[]{"0", "ПГ по м. кораб. и риб.", "ПГ по морско корабоплаване и риболов", "https://newsite.morskoburgas.com"});
        schoolCodes.put("200244", new String[]{"0", "ПГ по мех. и електр.", "ПГ по механоелектротехника и електроника", "https://pgmee.com"});
        schoolCodes.put("200245", new String[]{"0", "ПГ по стр., арх. и геод.", "ПГ по строителство, архитектура и геодезия", "https://kolioficheto.com"});
        schoolCodes.put("200246", new String[]{"0", "Търговска гимназия", "Търговска гимназия", "https://tg-bs.com"});
        schoolCodes.put("200247", new String[]{"0", "ПГ по хим. техн.", "ПГ по химични технологии", "https://pght-zelinskij.com"});
        schoolCodes.put("200248", new String[]{"0", "ПГ по ел. и ел.", "ПГ по електротехника и електроника", "https://pgee-bourgas.com"});
        schoolCodes.put("200249", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт", "https://autoburgas.com"});
        schoolCodes.put("200250", new String[]{"0", "Проф. техн. гимназия", "Професионална техническа гимназия", "https://ptgburgas.com"});
        schoolCodes.put("200251", new String[]{"0", "ПГ по дървообр.", "ПГ по дървообработване"});
        schoolCodes.put("200252", new String[]{"0", "ПГ по сград. и инст.", "ПГ по сградостроителство и инсталации", "https://pgsi.bg"});
        schoolCodes.put("200255", new String[]{"0", "Вечерно СУ", "Вечерно СУ Захари Стоянов"});
        schoolCodes.put("200258", new String[]{"1", "Британика", "ЧПГ Британика", "https://britanika-bs.com"});
        schoolCodes.put("2902103", new String[]{"0", "НУМСИ", "НУМСИ Проф. Панчо Владигеров", "https://numsiburgas.com"});
        schoolCodes.put("200205", new String[]{"0", OU_PETKO_SLAVEIKOV, OU_PETKO_SLAVEIKOV, "https://slaveykovoto.org"});
        schoolCodes.put("200206", new String[]{"0", "ОУ Княз Борис І", "ОУ Св. Княз Борис І", "https://oukniazboris.org"});
        schoolCodes.put("200207", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG, "https://lkaravelov.net"});
        schoolCodes.put("200208", new String[]{"0", OU_NAIDEN_GEROV, OU_NAIDEN_GEROV, "https://ou-ngerovbs.com"});
        schoolCodes.put("200209", new String[]{"0", OU_ANTON_STRASHIMIROV_SHORT, OU_ANTON_STRASHIMIROV_LONG, "https://astrashimirovbs.com"});
        schoolCodes.put("200210", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://ohridski-burgas.org"});
        schoolCodes.put("200211", new String[]{"0", OU_GEORGI_BENKOVSKI, OU_GEORGI_BENKOVSKI, "https://ou-gbenkovski.com"});
        schoolCodes.put("200212", new String[]{"0", OU_PEIO_YAVOROV, OU_PEIO_YAVOROV, "https://ouyavorov.org"});
        schoolCodes.put("200213", new String[]{"0", OU_VASIL_APRILOV, OU_VASIL_APRILOV, "https://ouaprilov.org"});
        schoolCodes.put("200214", new String[]{"0", OU_BRATYA_MILADINOVI_SHORT, OU_BRATYA_MILADINOVI_LONG, "https://brmiladinovi.eu"});
        schoolCodes.put("200215", new String[]{"0", OU_ELIN_PELIN, OU_ELIN_PELIN, "https://elinpelin-burgas.com"});
        schoolCodes.put("200216", new String[]{"0", "ОбУ Васил Левски", "ОбУ Васил Левски - Бургас", "https://oulevski.net"});
        schoolCodes.put("200217", new String[]{"0", "ОУ Ботев - Сарафово", "ОУ Христо Ботев - Сарафово", "https://ou-sarafovo.eu"});
        schoolCodes.put("200218", new String[]{"0", "ОУ Ботев - Победа", "ОУ Христо Ботев - Победа", "https://hristobotev-1921.eu"});
        schoolCodes.put("200219", new String[]{"0", "ОУ Ботев - Езерово", "ОУ Христо Ботев - Д. Езерово", "https://schoolde.weebly.com"});
        schoolCodes.put("200222", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV, "https://ou-banevo.com"});
        schoolCodes.put("200223", new String[]{"0", "ОУ Ботев - Ветрен", "ОУ Христо Ботев - Ветрен", "https://vetren-ou.eu"});
        schoolCodes.put("200241", new String[]{"0", "Коджакафалията", "ОУ А. Георгиев - Коджакафалията", "https://ouagk.com"});
        schoolCodes.put("200259", new String[]{"1", "ПЧОУ", "Първо Частно Основно Училище", "https://burgasschool.com"});
        schoolCodes.put("200201", new String[] {"0", "НУ М. Лъкатник", "НУ Михаил Лъкатник", "https://lakatnik.org"});
        schoolCodes.put("200203", new String[] {"1", "Мария Монтесори", "ЧСЕУ Д-р Мария Монтесори", "https://montessorischool.bg"});
        schoolCodes.put("200226", new String[] {"0", "СУ Кл. Охридски", "СУ Св. Климент Охридски", "https://su-rudnik.com"});
        schoolCodes.put("200120", new String[] {"0", "ПГ по компют. програм.", "ПГ по комп. програмиране и иновации", "https://codingburgas.bg"});
        schoolCodes.put("200124", new String[] {"1", "Селестен Френе", "ЧОУ Селестен Френе", "https://frene.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBlagoevgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("100052", new String[]{"0", "ПГ Ичко Бойчев", "ПГ Ичко Бойчев", "https://bpg-blg.com"});
        schoolCodes.put("100070", new String[]{"0", "СУ К. Шапкарев", "7 СУ Кузман Шапкарев", "https://7sou-blagoevgrad.com"});
        schoolCodes.put("100190", new String[]{"0", "ЕГ Акад. Л. Стоянов", "ЕГ Акад. Людмил Стоянов", "https://egblg.com"});
        schoolCodes.put("100200", new String[]{"0", "ПМГ Акад. С. Корольов", "ПМГ Акад. Сергей Корольов", "https://pmg-blg.com"});
        schoolCodes.put("100280", new String[]{"0", "ПГ по икономика", "ПГ по икономика", "https://pgiblg.com"});
        schoolCodes.put("100300", new String[]{"0", "ПГ по строителство", "ПГ по строителство, архитектура и геодезия", "https://pgsag-blg.com"});
        schoolCodes.put("101250", new String[]{"0", "СУИЧЕ", "СУИЧЕ Св. Кл. Охридски"});
        schoolCodes.put("101730", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм и лека промишленост", "https://pgtlp-blg.com"});
        schoolCodes.put("101870", new String[]{"0", "Хуманитарна гимн.", "Национална хуманитарна гимназия", "https://nhg-blg.com"});
        schoolCodes.put("101880", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV, "https://souivanvazov.com"});
        schoolCodes.put("102060", new String[]{"0", "СУ Г. Измирлиев", "5 СУ Георги Измирлиев", "https://petosoubl.com"});
        schoolCodes.put("109174", new String[]{"1", "Димитър и Йоан", "ЧСУ Димитър и Йоан"});
        schoolCodes.put("100020", new String[]{"0", "ОУ Д. Благоев", "2 ОУ Димитър Благоев", "https://2oublg.com"});
        schoolCodes.put("100040", new String[]{"0", "ОУ Д. Дебелянов", "4 ОУ Димчо Дебелянов", "https://chetvurtoblg.com"});
        schoolCodes.put("100110", new String[]{"0", OU_HRISTO_BOTEV, "11 ОУ Христо Ботев", "https://blg11ou.com"});
        schoolCodes.put("101290", new String[]{"0", "ОУ Д. Талев", "3 ОУ Димитър Талев", "https://3ou-blg.info"});
        schoolCodes.put("101580", new String[]{"0", "СУ А. Костенцев", "8 СУ Арсени Костенцев", "https://8su-blg.com"});
        schoolCodes.put("101700", new String[]{"0", "ОУ Пейо Яворов", "9 ОУ Пейо Яворов", "https://9ou-blagoevgrad.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVelikoTurnovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("300121", new String[]{"0", "Хуманитарна гимн.", "Профилирана Хуманитарна гимназия", "https://phg-vt.com"});
        schoolCodes.put("300122", new String[]{"0", "ПМГ В. Друмев", "ПМГ Васил Друмев", "https://pmgvt.org"});
        schoolCodes.put("300123", new String[]{"0", "ЕГ", "ПЕГ Проф. д-р Асен Златаров", "https://ezikovavt.com"});
        schoolCodes.put("300124", new String[]{"0", SU_EMILIYAN_STANEV, SU_EMILIYAN_STANEV, "https://em-stanev.org"});
        schoolCodes.put("300125", new String[]{"0", SU_VELA_BLAGOEVA, SU_VELA_BLAGOEVA, "https://velavt.net"});
        schoolCodes.put("300126", new String[]{"0", SU_VLADIMIR_KOMAROV, SU_VLADIMIR_KOMAROV, "https://su-komarov.com"});
        schoolCodes.put("300127", new String[]{"0", "СУ Г. Раковски", SU_GEORGI_RAKOVSKI, "https://sourakovski.weebly.com"});
        schoolCodes.put("300128", new String[]{"0", "ПГ по строителство", "ПГ по строителство архитектура и геодезия", "https://pgsagapvt.alle.bg"});
        schoolCodes.put("300129", new String[]{"0", "ПГ по икономика", "Старопрестолна ПГ по икономика", "https://sgivt.com"});
        schoolCodes.put("300130", new String[]{"0", "ПГ по електроника", "ПГ по електроника", "https://pgevtpopov.com"});
        schoolCodes.put("300131", new String[]{"0", "ПГ по моден дизайн", "ПГ по моден дизайн"});
        schoolCodes.put("300132", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм", "https://vtpgt.com"});
        schoolCodes.put("300141", new String[]{"1", "АК-Аркус", "ЧПГ АК-Аркус", "https://ac-arcus.com"});
        schoolCodes.put("300143", new String[]{"0", "СпУ Г. Живков", "Спортно училище Георги Живков", "https://sportnovt.com"});
        schoolCodes.put("300101", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://ou-botev-vt.com"});
        schoolCodes.put("300102", new String[]{"0", OU_BACHO_KIRO, OU_BACHO_KIRO, "https://bkiro.info"});
        schoolCodes.put("300103", new String[]{"0", OU_PATRIARH_EVTIMII_SHORT, OU_PATRIARH_EVTIMII_LONG, "https://oupe-vt.com"});
        schoolCodes.put("300104", new String[]{"0", OU_DIMITAR_BLAGOEV, OU_DIMITAR_BLAGOEV, "https://ou-blagoev.com/nov/"});
        schoolCodes.put("300105", new String[]{"0", OU_PETKO_SLAVEIKOV, OU_PETKO_SLAVEIKOV, "https://prsvt.org"});
        schoolCodes.put("300144", new String[]{"1", "Димитър Екимов", "ЧОУ Димитър Екимов", "https://rusalya.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVidin() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("500102", new String[]{"0", "ППМГ", "ППМГ Екзарх Антим I", "https://pmg-vd.org"});
        schoolCodes.put("500108", new String[]{"0", "ПТГ", "ПТГ Васил Левски", "https://ptg-vid.com"});
        schoolCodes.put("500110", new String[]{"0", "ПГТ", "ПГТ Михалаки Георгиев", "https://pgtvidin.com"});
        schoolCodes.put("502035", new String[]{"0", "ПГ А. Златаров", "ПГ Проф. д-р Асен Златаров", "https://pgaz.org"});
        schoolCodes.put("503132", new String[]{"0", SU_TSAR_SIMEON_VELIKI_SHORT, SU_TSAR_SIMEON_VELIKI_LONG, "https://csv-vidin.eu"});
        schoolCodes.put("503241", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://sukm-vidin.com"});
        schoolCodes.put("503242", new String[]{"0", SU_PETKO_RACHOV_SLAVEIKOV_SHORT, SU_PETKO_RACHOV_SLAVEIKOV_LONG, "https://su-slaveykov-vidin.org"});
        schoolCodes.put("503322", new String[]{"0", "ГПЧЕ Й. Радичков", "ГПЧЕ Йордан Радичков", "https://radichkovls-vidin.org"});
        schoolCodes.put("500104", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG, "https://lk-vidin.eu"});
        schoolCodes.put("500111", new String[]{"0", OU_SOFRONII_VRACHANSKI, OU_SOFRONII_VRACHANSKI});
        schoolCodes.put("500112", new String[]{"0", OU_OTEC_PAISII, OU_OTEC_PAISII});
        schoolCodes.put("500113", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://ousko.wordpress.com"});
        schoolCodes.put("503312", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV, "https://schoolvazov.wixsite.com/vidin"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVraca() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("600061", new String[]{"0", "ЕГ", "Профилирана ЕГ Йоан Екзарх", "https://eg-vratza.org"});
        schoolCodes.put("600327", new String[]{"0", SU_KOZMA_TRICHKOV, SU_KOZMA_TRICHKOV, "https://kozmatrichkov.com"});
        schoolCodes.put("602062", new String[]{"0", "ППМГ", "ППМГ Акад. Иван Ценов", "https://pmg-vratsa.org"});
        schoolCodes.put("603057", new String[]{"0", SU_OTEC_PAISII, SU_OTEC_PAISII, "https://otecpaisii.com"});
        schoolCodes.put("603058", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://hristobotev.org"});
        schoolCodes.put("603059", new String[]{"0", SU_VASIL_KANCHOV, SU_VASIL_KANCHOV, "https://vasilkunchov.com"});
        schoolCodes.put("603065", new String[]{"0", "Техническа гимназия", "Професионална техническа гимназия", "https://ptgvaptsarov-vratsa.org"});
        schoolCodes.put("603067", new String[]{"0", "ПГ по търговия", "ПГ по търговия и ресторантьорство"});
        schoolCodes.put("603070", new String[]{"0", SU_NIKOLA_VOIVODOV, SU_NIKOLA_VOIVODOV, "https://su-nikola-voivodov.org"});
        schoolCodes.put("603071", new String[]{"0", "ПГ Д. Хаджитошин", "ПГ Димитраки Хаджитошин", "https://pg-vratza.com"});
        schoolCodes.put("603140", new String[]{"0", SU_MITO_OROZOV, SU_MITO_OROZOV, "https://su-morozov.org"});
        schoolCodes.put("608060", new String[]{"0", "Спортно у-ще", "Спортно у-ще Св. Климент Охридски", "https://sportno-vratsa.com"});
        schoolCodes.put("1203007", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII});
        schoolCodes.put("602041", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://vlevski-vratsa.info"});
        schoolCodes.put("602042", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII});
        schoolCodes.put("601031", new String[] {"0", "НУ Иванчо Младенов", "НУ Иванчо Младенов", "https://nu-ivanchomladenov.org"});
        schoolCodes.put("601035", new String[] {"0", NU_IVAN_VAZOV, NU_IVAN_VAZOV, "https://nuivanvazov-vr.org"});
        schoolCodes.put("601037", new String[] {"0", "НУ Софр. Врач.", "НУ Св. Софроний Врачански", "https://sofronii-vr.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesGabrovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("700113", new String[]{"0", SU_OTEC_PAISII, SU_OTEC_PAISII, "https://otecpaisii.eu"});
        schoolCodes.put("700114", new String[]{"0", SU_RAICHO_KAROLEV, SU_RAICHO_KAROLEV, "https://raichokarolev.com"});
        schoolCodes.put("700115", new String[]{"0", "Априловска гимн.", "Национална априловска гимназия", "https://nag-school.org"});
        schoolCodes.put("700116", new String[]{"0", "ПМГ", "ПМГ Акад. Иван Гюзелев", "https://pmg-gabrovo.bg"});
        schoolCodes.put("700118", new String[]{"0", "Техническа гимн.", "Професионална техническа гимназия", "https://ptg-gabrovo.com"});
        schoolCodes.put("700120", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Пенчо Семов", "https://pgt.gabrovo.bg"});
        schoolCodes.put("700102", new String[]{"0", OU_RAN_BOSILEK, OU_RAN_BOSILEK, "https://ranbosilek.com"});
        schoolCodes.put("700103", new String[]{"0", OU_NEOFIT_RILSKI, OU_NEOFIT_RILSKI, "https://neofitrilski.com"});
        schoolCodes.put("700106", new String[]{"0", OU_IVAN_VAZOV, "6 ОУ Иван Вазов", "https://www.daskalo.com/ivanvazov58/"});
        schoolCodes.put("700108", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII});
        schoolCodes.put("700112", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://ou-hristobotev-bg.com/bg/"});
        schoolCodes.put("700101", new String[] {"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI, "https://nu-vlevski-gabrovo.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDobrich() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("800013", new String[]{"0", SU_DIMITAR_TALEV, SU_DIMITAR_TALEV, "https://su-dtalev.com"});
        schoolCodes.put("800015", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG, "https://klohridski.com"});
        schoolCodes.put("800016", new String[]{"0", SU_LIUBEN_KARAVELOV_SHORT, SU_LIUBEN_KARAVELOV_LONG, "https://karavelov.com"});
        schoolCodes.put("800017", new String[]{"0", SU_PETKO_RACHOV_SLAVEIKOV_SHORT, SU_PETKO_RACHOV_SLAVEIKOV_LONG, "https://prslaveikov.com"});
        schoolCodes.put("800018", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://hg-dobrich.eu"});
        schoolCodes.put("800019", new String[]{"0", "ПМГ Иван Вазов", "ПМГ Иван Вазов", "https://pmg-dobrich.com"});
        schoolCodes.put("800020", new String[]{"0", "ЕГ Гео Милев", "ЕГ Гео Милев", "https://eg-dobrich.com"});
        schoolCodes.put("800023", new String[]{"0", "Финансово-стопанска", "Финансово-стопанска гимназия", "https://fsg-dobrich.com"});
        schoolCodes.put("800325", new String[]{"1", "Райко Цончев", "ЧПГ Райко Цончев", "https://rconchev.com"});
        schoolCodes.put("800326", new String[]{"1", "Леонардо да Винчи", "ЧСУ Леонардо да Винчи", "https://leonardo-dobrich.com"});
        schoolCodes.put("800012", new String[]{"0", "Спортно у-ще", "Спортно у-ще Георги Раковски", "https://sportnodobrich.com"});
        schoolCodes.put("800021", new String[]{"0", "ПГ по техника", "ПГ по техника и строителство", "https://pglomonosov.org"});
        schoolCodes.put("800022", new String[]{"0", "ПГ по вет. медицина", "ПГ по ветеринарна медицина", "https://pgvm-dobrich.eu"});
        schoolCodes.put("800026", new String[]{"0", "ПГ по агр. стоп.", "Професионална гимназия по аграрно стопанство", "https://pgasdobrich.com"});
        schoolCodes.put("800028", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм П. К. Яворов", "https://pgtdobrich.org"});
        schoolCodes.put("800328", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт, обслужване и лека промишленост", "https://pgtolp.com"});
        schoolCodes.put("800003", new String[]{"0", "ОбУ Йордан Йовков", "ОбУ Йордан Йовков", "https://ouyovkovdobrich.com"});
        schoolCodes.put("800004", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG});
        schoolCodes.put("800007", new String[]{"0", OU_PANAIOT_VOLOV, OU_PANAIOT_VOLOV, "https://ou-pvolov.eu/wordpress/"});
        schoolCodes.put("800008", new String[]{"0", OU_STEFAN_KARADZHA, OU_STEFAN_KARADZHA, "https://stkaradja-dobrich.com"});
        schoolCodes.put("800009", new String[]{"0", OU_HAN_ASPARUH, OU_HAN_ASPARUH, "https://hanasparuh.com"});
        schoolCodes.put("800010", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://ouhrsmirnenski-dobrich.com"});
        schoolCodes.put("800011", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://ou-botev.org"});
        schoolCodes.put("800112", new String[]{"1", "Мария Монтесори", "ЧОУ Мария Монтесори", "https://montessori-dobrich.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKurdzhali() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("909101", new String[]{"0", SU_VLADIMIR_DIMITROV_SHORT, SU_VLADIMIR_DIMITROV_LONG, "https://vdmaystora.com"});
        schoolCodes.put("909103", new String[]{"0", SU_IORDAN_IOVKOV, SU_IORDAN_IOVKOV, "https://yovkov.bg"});
        schoolCodes.put("909105", new String[]{"0", SU_OTEC_PAISII, SU_OTEC_PAISII, "https://paisii-kardjali.com"});
        schoolCodes.put("909106", new String[]{"0", SU_PETKO_RACHOV_SLAVEIKOV_SHORT, SU_PETKO_RACHOV_SLAVEIKOV_LONG, "https://slaveykov.bg"});
        schoolCodes.put("909107", new String[]{"0", "ЕГ Хр. Ботев", "ЕГ Христо Ботев", "https://botev-kardzhali.com"});
        schoolCodes.put("909108", new String[]{"0", "ПГ по икономика", "ПГ по икономика", "https://pgikj.com"});
        schoolCodes.put("909109", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм", "https://pgt-kj.com"});
        schoolCodes.put("909110", new String[]{"0", "ПГ В. Левски", "ПГ Васил Левски", "https://pglevski.com"});
        schoolCodes.put("909111", new String[]{"0", "ПГ по облекло", "ПГ по облекло и дизайн", "https://evridika.eu"});
        schoolCodes.put("909112", new String[]{"0", "ПГ по електр.", "ПГ по електротехника и електроника", "https://pgee-kardjali.com"});
        schoolCodes.put("909113", new String[]{"0", "ПГ по с/г стоп.", "ПГ по селско и горско стопанство", "https://pgposgs.idwebbg.com"});
        schoolCodes.put("909114", new String[]{"0", "ПГ по строит.", "ПГ по строителство"});
        schoolCodes.put("909104", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://ou-kliment-kj.com"});
        schoolCodes.put("909115", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://ouvlevski-kj.net"});
        schoolCodes.put("909116", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII});
        schoolCodes.put("909117", new String[]{"0", OU_PEIO_YAVOROV, OU_PEIO_YAVOROV, "https://ou-iavorov-kj.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKiustendil() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1000002", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgsskn.com"});
        schoolCodes.put("1000540", new String[]{"0", "ЕГ", "ЕГ Д-р Петър Берон", "https://eg-kn.eu"});
        schoolCodes.put("1000550", new String[]{"0", "ПМГ", "ПМГ Проф. Емануил Иванов", "https://pmgkn.com"});
        schoolCodes.put("1001360", new String[]{"0", "Техн. гимназия", "Професионална техническа гимназия", "https://ptg-kn.com"});
        schoolCodes.put("1001380", new String[]{"0", "ПГ по икономика", "ПГ по икономика и мениджмънт", "https://pgimkn.com"});
        schoolCodes.put("1001390", new String[]{"0", "Спортно у-ще", "Спортно у-ще Васил Левски", "https://suvlkn.com"});
        schoolCodes.put("1001420", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Н. Вапцаров"});
        schoolCodes.put("1001670", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост", "https://pglp-kn.com"});
        schoolCodes.put("1000053", new String[]{"0", OU_HRISTO_BOTEV, "5 ОУ Христо Ботев"});
        schoolCodes.put("1000330", new String[]{"0", OU_MARIN_DRINOV_SHORT, OU_MARIN_DRINOV_LONG, "https://marindrinov.wordpress.com"});
        schoolCodes.put("1001410", new String[]{"0", "ОУ П. Хилендарски", "6 ОУ Св. Паисий Хилендарски", "https://6ou.info"});
        schoolCodes.put("1001590", new String[]{"0", "ОУ Ильо войвода", "7 ОУ Ильо войвода"});
        schoolCodes.put("1001680", new String[]{"0", OU_DASKAL_DIMITRI, OU_DASKAL_DIMITRI});
        schoolCodes.put("1001830", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://www.kmkn.eu"});
        schoolCodes.put("1000380", new String[]{"0", NU_KLIMENT_OHRIDSKI_SHORT, NU_KLIMENT_OHRIDSKI_LONG, "https://nu-kn.com"});
        schoolCodes.put("1000005", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesLovetch() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1100316", new String[]{"0", SU_TODOR_KIRKOV, SU_TODOR_KIRKOV, "https://todorkirkov-su.com"});
        schoolCodes.put("1100318", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG, "https://gimnaziata.net"});
        schoolCodes.put("1100320", new String[]{"0", "ППМГ", "ППМГ", "https://pmg-lovech.com"});
        schoolCodes.put("1100322", new String[]{"0", "ПГ по механ.", "ПГ по механоелектротехника", "https://pgmet-lovech.com"});
        schoolCodes.put("1100324", new String[]{"0", SU_DIMITAR_MITEV, SU_DIMITAR_MITEV, "https://su-dm.idwebbg.com"});
        schoolCodes.put("1100328", new String[]{"0", "ЕГ", "Профилирана ЕГ Екзарх Йосиф I", "https://ezikova-lovech.eu"});
        schoolCodes.put("1100329", new String[]{"0", "ПГ по вет. медицина", "Национална ПГ по ветеринарна медицина", "https://npgvm-lovech.com"});
        schoolCodes.put("1100331", new String[]{"0", "ПГ по икономика", "ПГ по икономика, търговия и услуги", "https://pgitu-lovech.com"});
        schoolCodes.put("1100301", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://vlevski-lovech.com"});
        schoolCodes.put("1100304", new String[]{"0", OU_HRISTO_NIKIFOROV, OU_HRISTO_NIKIFOROV, "https://ou-nikiforov.com"});
        schoolCodes.put("1100305", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://oukirilimetodiylovech.eu"});
        schoolCodes.put("1100317", new String[]{"0", OU_PANAIOT_PIPKOV, OU_PANAIOT_PIPKOV, "https://ppipkov.com"});
        schoolCodes.put("1100336", new String[]{"0", OU_DIMITAR_DIMOV, OU_DIMITAR_DIMOV, "https://ouprofddimov.org"});
        schoolCodes.put("1100102", new String[]{"1", "Св. Седмочисленици", "ЧНУ Св. Седмочисленици", "https://sedmochislenitsi.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesMontana() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1201001", new String[]{"0", "ППМГ", "ППМГ Св. Климент Охридски", "https://newsite.pmgmontana.com"});
        schoolCodes.put("1201002", new String[]{"0", "ГПЧЕ П. Богдан", "ГПЧЕ Петър Богдан", "https://gpchemont.com"});
        schoolCodes.put("1201004", new String[]{"0", "2 СУ", "2 СУ Никола Вапцаров", "https://vtoro-montana.bg"});
        schoolCodes.put("1201007", new String[]{"0", "5 ОУ", "5 ОУ Христо Ботев", "https://petooumontana.com"});
        schoolCodes.put("1201011", new String[]{"0", "7 СУ", "7 СУ Йордан Радичков", "https://su-radichkov.eu"});
        schoolCodes.put("1201021", new String[]{"0", "Финансово-стопанска", "Финансово-стопанска ПГ", "https://fsg-montana.com"});
        schoolCodes.put("1201022", new String[]{"0", "ПГ по строителство", "ПГ по строителство, архитектура и компютърни науки", "https://pgsakn-montana.com"});
        schoolCodes.put("1201023", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост", "https://pglpmontana.com"});
        schoolCodes.put("1201033", new String[]{"0", "ПГ по техника", "ПГ по техника и електротехника", "https://pgtemontana.com"});
        schoolCodes.put("1201034", new String[]{"0", "6 СУ", "6 СУ Отец Паисий"});
        schoolCodes.put("1201003", new String[]{"0", "1 ОУ", "І ОУ Св. Св. Кирил и Методий", "https://1ou-montana.com"});
        schoolCodes.put("1201005", new String[]{"0", "3 ОУ", "3 ОУ Д-р Петър Берон", "https://tretoou.com"});
        schoolCodes.put("1201006", new String[]{"0", "4 ОУ", "4 ОУ Иван Вазов", "https://4ou-montana.com"});
        schoolCodes.put("1201000", new String[] {"0", "НУ Г. Бенковски", "НУ Г. Бенковски", "https://nu-gbenkovski.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPazardzhik() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1301139", new String[]{"0", "ПГ по икономика", "ПГ по икономика и мениджмънт", "https://pgimpazardjik.com"});
        schoolCodes.put("1301234", new String[]{"0", SU_DIMITAR_GACHEV, SU_DIMITAR_GACHEV, "https://dgachev.eu"});
        schoolCodes.put("1301911", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgss-pz.com"});
        schoolCodes.put("1302580", new String[]{"0", "ПГ Иван Аксаков", "Профилирана гимназия Иван С. Аксаков", "https://aksakov-bg.com"});
        schoolCodes.put("1302769", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника", "https://pgmetpz.com"});
        schoolCodes.put("1302961", new String[]{"0", "ПГ по хим. и хр. техн.", "ПГ по химични и хранителни технологии", "https://pghht.weebly.com"});
        schoolCodes.put("1303006", new String[]{"0", "ПГ по пром. техн.", "ПГ по промишлени технологии", "https://pgpt-pazardzhik.com"});
        schoolCodes.put("1303344", new String[]{"0", "ПГ по фризьорство", "ПГ по фризьорство и ресторантьорство", "https://pgfr-pz.com"});
        schoolCodes.put("1304290", new String[]{"0", "ЕГ", "ЕГ Бертолт Брехт", "https://egbb.org"});
        schoolCodes.put("1304332", new String[]{"0", "ПГ по строителство", "ПГ по строителство и архитектура", "https://pgsa-paz.com"});
        schoolCodes.put("1304948", new String[]{"0", SU_GEORGI_BENKOVSKI, SU_GEORGI_BENKOVSKI, "https://sougbenkovski.info"});
        schoolCodes.put("1305338", new String[]{"0", SU_GEORGI_BREGOV, SU_GEORGI_BREGOV, "https://bregov.eu"});
        schoolCodes.put("1305831", new String[]{"0", "СУ П. Берон", SU_PETAR_BERON_LONG, "https://beronpz.eu"});
        schoolCodes.put("1309018", new String[]{"0", "ПМГ", "ПМГ Константин Величков", "https://mgpz.org"});
        schoolCodes.put("1300013", new String[]{"0", "СпУ Пазарджик", "Спортно у-ще Пазарджик", "https://sportnopz.com"});
        schoolCodes.put("1301717", new String[]{"0", OU_IV_BATAKLIEV_SHORT, OU_IV_BATAKLIEV_LONG, "https://batakliev.org"});
        schoolCodes.put("1301724", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://progimnaziapz.weebly.com"});
        schoolCodes.put("1302502", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://kliment-ohridski.com"});
        schoolCodes.put("1302517", new String[]{"0", OU_STEFAN_ZAHARIEV, OU_STEFAN_ZAHARIEV, "https://st-zahariev.com"});
        schoolCodes.put("1302534", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://oubotev-pz.bg"});
        schoolCodes.put("1304930", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_SHORT, "https://ouh.lodts.org"});
        schoolCodes.put("1307267", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG, "https://lkaravelov.eu"});
        schoolCodes.put("1301215", new String[]{"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI, "https://vlevskipz.com/wp/"});
        schoolCodes.put("1301222", new String[]{"0", NU_OTEC_PAISII, NU_OTEC_PAISII, "https://nu-paisij-pz.com"});
        schoolCodes.put("1301247", new String[]{"0", NU_VASIL_DRUMEV, NU_VASIL_DRUMEV});
        schoolCodes.put("1301254", new String[]{"0", NU_GEORGI_SAVA_RAKOVSKI, NU_GEORGI_SAVA_RAKOVSKI, "https://nugsrpz.com"});
        schoolCodes.put("1305320", new String[]{"0", NU_NIKOLA_FURNADZHIEV_SHORT, NU_NIKOLA_FURNADZHIEV_LONG, "https://nikola-furnadjiev.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPernik() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1403213", new String[]{"0", "5 СУ", "5 СУ Петко Рачов Славейков", "https://5supernik.bg"});
        schoolCodes.put("1403214", new String[]{"0", "6 СУ", "6 СУ Св. Св. Кирил и Методий", "https://6su-pernik.eu"});
        schoolCodes.put("1403216", new String[]{"0", "СУРИЧЕ П. Берон", "СУРИЧЕ Д-р Петър Берон", "https://suberon-pernik.com"});
        schoolCodes.put("1403217", new String[]{"0", "СпУ Олимпиец", "Спортно у-ще Олимпиец", "https://sportnopernik.com"});
        schoolCodes.put("1403219", new String[]{"0", "ПМГ", "ПМГ Христо Смирненски", "https://pmg-pernik.com"});
        schoolCodes.put("1403220", new String[]{"0", "ГПЧЕ С. Радев", "ГПЧЕ Симеон Радев"});
        schoolCodes.put("1403233", new String[]{"0", "ПГ по техн. и енерг.", "ПГ по техника и енергетика", "https://pgtehristobotev.com"});
        schoolCodes.put("1403234", new String[]{"0", "ПГ по техн. и строит.", "ПГ по техника и строителство", "https://pgts.info"});
        schoolCodes.put("1403235", new String[]{"0", "ПГ Мария Кюри", "Технологична ПГ Мария Кюри", "https://tpg-pk.eu"});
        schoolCodes.put("1403236", new String[]{"0", "ПГ по икономика", "ПГ по икономика", "https://pgi-pernik.bg-schools.com"});
        schoolCodes.put("1403237", new String[]{"0", "ПГ по облекло", "Професионална гимназия по облекло и туризъм", "https://pgotpernik.com"});
        schoolCodes.put("1403201", new String[]{"0", OU_IVAN_RILSKI_SHORT, OU_IVAN_RILSKI_LONG, "https://ouivanrilski.com"});
        schoolCodes.put("1403202", new String[]{"0", "7 ОУ", "7 ОУ Георги С. Раковски", "https://7ou-pernik.com"});
        schoolCodes.put("1403203", new String[]{"0", "8 ОУ", "8 ОУ Кракра Пернишки", "https://8oupernik.com"});
        schoolCodes.put("1403204", new String[]{"0", "СУ Темелко Ненков", "СУ Темелко Ненков", "https://obutnenkov.com"});
        schoolCodes.put("1403205", new String[]{"0", "10 ОУ", "10 ОУ Ал. Константинов", "https://sites.google.com/view/10ou"});
        schoolCodes.put("1403206", new String[]{"0", "11 ОУ", "11 ОУ Елин Пелин", "https://11ouelinpelin-pernik.com"});
        schoolCodes.put("1403207", new String[]{"0", "12 ОУ", "12 ОУ Васил Левски", "https://12ou-pernik.com"});
        schoolCodes.put("1403208", new String[]{"0", "13 ОУ", "13 ОУ Св. Св. Кирил и Методий", "https://13oupernik.weebly.com"});
        schoolCodes.put("1403211", new String[]{"0", OU_KONST_K_FILOSOF_SHORT, OU_KONST_K_FILOSOF_LONG, "https://ou-kkfilosof.com"});
        schoolCodes.put("1403215", new String[]{"0", "16 ОУ", "16 ОУ Св. Св. Кирил и Методий", "https://16ou-pernik.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPleven() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1500130", new String[]{"0", "МГ Гео Милев", "МГ Гео Милев", "https://pleven-mg.com"});
        schoolCodes.put("1500131", new String[]{"0", "ГПЧЕ Д. Димов", "ГПЧЕ Димитър Димов", "https://pgpche-pl.com"});
        schoolCodes.put("1500132", new String[]{"0", SU_ANASTASIYA_DIMITROVA_SHORT, SU_ANASTASIYA_DIMITROVA_LONG, "https://www.daskalo.com/anastasia"});
        schoolCodes.put("1500133", new String[]{"0", SU_STOYAN_ZAIMOV, SU_STOYAN_ZAIMOV, "https://zaimov-pl.com"});
        schoolCodes.put("1500134", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV, "https://suivanvazov.com"});
        schoolCodes.put("1500135", new String[]{"0", SU_PEIO_YAVOROV, SU_PEIO_YAVOROV, "https://su-yavorov-pl.com"});
        schoolCodes.put("1500136", new String[]{"0", SU_HRISTO_SMIRNENSKI_SHORT, SU_HRISTO_SMIRNENSKI_LONG, "https://smirnenskipleven.com"});
        schoolCodes.put("1500138", new String[]{"0", "СпУ Г. Бенковски", "Спортно у-ще Георги Бенковски", "https://supleven.bg"});
        schoolCodes.put("1500140", new String[]{"0", "ДФСГ Интелект", "Държавна финансово-стопанска гимназия Интелект", "https://dfsg-intellect.com"});
        schoolCodes.put("1500141", new String[]{"0", "ПГ по механ.", "ПГ по механоелектротехника", "https://pgmet-pleven.bg"});
        schoolCodes.put("1500142", new String[]{"0", "ПГ по хран.-вк. техн.", "ПГ по хранително-вкусови технологии", "https://pghvt.com"});
        schoolCodes.put("1500143", new String[]{"0", "ПГ по мениджмънт", "ПГ по мениджмънт и хранителни технологии", "https://pgmht-pleven.com"});
        schoolCodes.put("1500144", new String[]{"0", "ПГ по строителство", "ПГ по строит., арх. и геод.", "https://pgsag-pleven.com"});
        schoolCodes.put("1500145", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт", "https://sites.google.com/view/pgtpleven"});
        schoolCodes.put("1500146", new String[]{"0", "ПГ по лоз. и вин.", "ПГ по лозарство и винарство", "https://pglv-pleven.alle.bg"});
        schoolCodes.put("1500147", new String[]{"0", "ПГ по облекло", "ПГ по облекло и текстил", "https://pgot-pleven.com"});
        schoolCodes.put("1500148", new String[]{"0", "ПГ по ел. и хим.", "ПГ по електроника и химични технологии", "https://pgeht.net"});
        schoolCodes.put("1500149", new String[]{"0", "ПГ по рест., търг. и обсл.", "ПГ по ресторантьорство, търговия и обслужване", "https://pgrto.com"});
        schoolCodes.put("1500151", new String[]{"0", "ПГ по под/стр/тр. техн.", "ПГ по подемна, строителна и транспортна техника", "https://pgpstt-pleven.com"});
        schoolCodes.put("1500152", new String[]{"0", "ПГ Захарий Зограф", "ПГ Захарий Зограф", "https://pgzzograf-pl.com"});
        schoolCodes.put("1500153", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Алеко Константинов", "https://pgt-pleven.com"});
        schoolCodes.put("2902107", new String[]{"0", "НУИ", "НУИ Панайот Пипков", "https://plevenartschool.com"});
        schoolCodes.put("1500109", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG});
        schoolCodes.put("1500110", new String[]{"0", OU_PETAR_BERON, OU_PETAR_BERON, "https://beronpleven.com"});
        schoolCodes.put("1500112", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://ouklohridski.com"});
        schoolCodes.put("1500113", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://vlevski-pl.com"});
        schoolCodes.put("1500114", new String[]{"0", OU_IORDAN_IOVKOV, OU_IORDAN_IOVKOV, "https://ou-yovkov-pleven.eu"});
        schoolCodes.put("1500115", new String[]{"0", OU_LAZAR_STANEV, OU_LAZAR_STANEV, "https://ou-lazarstanev.eu"});
        schoolCodes.put("1500129", new String[]{"0", OU_TSVETAN_SPASOV, OU_TSVETAN_SPASOV, "https://cvetan-spasov.com"});
        schoolCodes.put("1500201", new String[]{"0", OU_VALERI_PETROV, OU_VALERI_PETROV, "https://ouvaleripetrov.com"});
        schoolCodes.put("1500101", new String[]{"0", NU_EDINSTVO, NU_EDINSTVO, "https://nu-edinstvo.info"});
        schoolCodes.put("1500102", new String[]{"0", NU_HRISTO_BOTEV, NU_HRISTO_BOTEV, "https://hristobotevpl.info"});
        schoolCodes.put("1500103", new String[]{"0", NU_EVTIMII_SHORT, NU_EVTIMII_LONG, "https://nupepleven.com"});
        schoolCodes.put("1500105", new String[]{"0", NU_OTEC_PAISII, NU_OTEC_PAISII, "https://otec-paisiy.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRazgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1702601", new String[]{"0", "ПГ по икономика", "ПГ по икономика Робер Шуман", "https://pgi-rz.com"});
        schoolCodes.put("1702602", new String[]{"0", "Техническа гимназия", "Национална професионална техническа гимназия", "https://ptgrz.org"});
        schoolCodes.put("1702603", new String[]{"0", "ПГ по хим. техн.", "ПГ по химични технологии и биотехнологии", "https://mariya-kyuri.net"});
        schoolCodes.put("1702604", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgsshvt.com"});
        schoolCodes.put("1702607", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт и строителство", "https://pgtsrz.wordpress.com"});
        schoolCodes.put("1702608", new String[]{"0", "ГПЧЕ Е. Йосиф", "ГПЧЕ Екзарх Йосиф", "https://gpcherazgrad.com"});
        schoolCodes.put("1702609", new String[]{"0", "ППМГ", "ППМГ Акад. Никола Обрешков", "https://pmgrz.net"});
        schoolCodes.put("1702612", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://subotev-razgrad.com"});
        schoolCodes.put("1702629", new String[]{"0", "ПГ по облекло", "ПГ по облекло", "https://pgo-razgrad.idwebbg.com"});
        schoolCodes.put("1702640", new String[]{"0", "Спортно у-ще", "Спортно у-ще - Разград", "https://sportno-uchilishte.com"});
        schoolCodes.put("1702611", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG, "https://vapcarov.org"});
        schoolCodes.put("1702613", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://vlevski.com"});
        schoolCodes.put("1702614", new String[]{"0", OU_N_IKONOMOV, OU_N_IKONOMOV, "https://nikonomov.com"});
        schoolCodes.put("1702615", new String[]{"0", OU_I_S_TURGENEV, OU_I_S_TURGENEV, "https://ou-turgenev.com"});
        schoolCodes.put("1702616", new String[]{"0", OU_OTEC_PAISII, OU_OTEC_PAISII, "https://oupaisii.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRuse() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1806201", new String[]{"0", "АЕГ Гео Милев", "Английска ЕГ Гео Милев", "https://elsruse.eu"});
        schoolCodes.put("1806202", new String[]{"0", "МГ Баба Тонка", "МГ Баба Тонка", "https://mg-babatonka.bg"});
        schoolCodes.put("1806203", new String[]{"0", "СУ за европ. езици", "СУ за европейски езици", "https://souee.bg"});
        schoolCodes.put("1806204", new String[]{"0", "СУ Фридрих Шилер", "СУ с немски език Фридрих Шилер", "https://schiller-schule.info/bg/"});
        schoolCodes.put("1806206", new String[]{"0", SU_IORDAN_IOVKOV, SU_IORDAN_IOVKOV, "https://yovkov-rs.info"});
        schoolCodes.put("1806207", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://sou-botev.com"});
        schoolCodes.put("1806208", new String[]{"0", SU_VAZRAZHDANE, SU_VAZRAZHDANE, "https://vazrajdane.com"});
        schoolCodes.put("1806209", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://sulevski-ruse.org"});
        schoolCodes.put("1806210", new String[]{"0", "Духовно училище", "Духовно училище", "https://sodu-ruse.com"});
        schoolCodes.put("1806213", new String[]{"1", "Леонардо да Винчи", "Първо ЧСУ Леонардо да Винчи", "https://psleonardo.com"});
        schoolCodes.put("1806215", new String[]{"1", "Джордж Байрон", "ЧПАГ Джордж Байрон"});
        schoolCodes.put("1806301", new String[]{"0", "ПГ по електрот.", "ПГ по електротехника и електроника", "https://electroschool.com"});
        schoolCodes.put("1806302", new String[]{"0", "ПГ по дървообр.", "ПГ по дървообработване и вътрешна архитектура", "https://pgdva-ruse.net"});
        schoolCodes.put("1806305", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgss-ruse.com"});
        schoolCodes.put("1806306", new String[]{"0", "ПГ по механот.", "ПГ по механотехника", "https://pgmt-ruse.com"});
        schoolCodes.put("1806307", new String[]{"0", "ПГ по облекло", "ПГ по облекло", "https://pgo-rousse.com"});
        schoolCodes.put("1806309", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм", "https://pgtourism.info"});
        schoolCodes.put("1806310", new String[]{"0", "ПГ по икономика", "ПГ по икономика и управление", "https://pgiu-ruse.jusoft.net"});
        schoolCodes.put("1806311", new String[]{"0", "ПГ по корабостр.", "ПГ по речно корабостроене и корабоплаване", "https://pgrkk-ruse-bg.net"});
        schoolCodes.put("1806312", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт", "https://pgtransport-ruse.com"});
        schoolCodes.put("1806313", new String[]{"0", "ПГ по строителство", "ПГ по строителство, архитектура и геодезия", "https://pgsag.com"});
        schoolCodes.put("1806315", new String[]{"0", "ПГ по пром. техн.", "ПГ по промишлени технологии", "https://pgpt.org"});
        schoolCodes.put("1806401", new String[]{"0", "СпУ Ат. Узунов", "Спортно у-ще Атанас Узунов", "https://suruse.eu"});
        schoolCodes.put("2902105", new String[]{"0", "НУИ", "НУИ Проф. Веселин Стоянов", "https://artrousse.com"});
        schoolCodes.put("1806101", new String[]{"0", OU_OTEC_PAISII, OU_OTEC_PAISII, "https://otetzpaisii.com"});
        schoolCodes.put("1806102", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG, "https://oulkruse.org"});
        schoolCodes.put("1806103", new String[]{"0", OU_ANGEL_KANCHEV, OU_ANGEL_KANCHEV, "https://ouangelkinchev-ruse.com"});
        schoolCodes.put("1806104", new String[]{"0", OU_BRATYA_MILADINOVI_SHORT, OU_BRATYA_MILADINOVI_LONG, "https://oubratyamiladinovi.com"});
        schoolCodes.put("1806106", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV, "https://ivanvazovruse.org"});
        schoolCodes.put("1806108", new String[]{"0", OU_ALEKO_KONSTANTINOV_SHORT, OU_ALEKO_KONSTANTINOV_LONG, "https://aleko-ruse.com"});
        schoolCodes.put("1806109", new String[]{"0", OU_TOMA_KARDZHIEV, OU_TOMA_KARDZHIEV, "https://tomakardjiev.idwebbg.com"});
        schoolCodes.put("1806110", new String[]{"0", OU_NIKOLA_OBRETENOV, OU_NIKOLA_OBRETENOV, "https://ounikolaobretenov.weebly.com"});
        schoolCodes.put("1806111", new String[]{"0", OU_VASIL_APRILOV, OU_VASIL_APRILOV, "https://vaprilov-ruse.com"});
        schoolCodes.put("1806112", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://ouhrsmir.com"});
        schoolCodes.put("1806205", new String[]{"0", OU_OLIMPI_PANOV, OU_OLIMPI_PANOV, "https://olimpipanov-ruse.com"});
        schoolCodes.put("1806216", new String[]{"1", "Вяра Надежда Любов", "ЧНУ Вяра Надежда Любов"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSilistra() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1900502", new String[]{"0", SU_NIKOLA_VAPTSAROV, SU_NIKOLA_VAPTSAROV, "https://suvapcarov.com"});
        schoolCodes.put("1900503", new String[]{"0", "ПМГ", "ПМГ Св. Климент Охридски", "https://pmg-silistra.com"});
        schoolCodes.put("1900504", new String[]{"0", "ЕГ", "ЕГ Пейо Яворов", "https://eg-yavorov.com"});
        schoolCodes.put("1900505", new String[]{"0", "ПГ по механотехника", "ПГ по механотехника", "https://pgmt-komarov.eu"});
        schoolCodes.put("1900506", new String[]{"0", "ПГ по стоп. упр.", "ПГ по стопанско управление", "https://pgsuau-burov.com"});
        schoolCodes.put("1900507", new String[]{"0", "Земеделска гимназия", "Професионална земеделска гимназия", "https://pzg-dobrudja.bg"});
        schoolCodes.put("1900508", new String[]{"0", "ПГ по строителство", "ПГ по строителство Пеньо Пенев", "https://pgs-silistra.com"});
        schoolCodes.put("1900509", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост Пенчо Славейков"});
        schoolCodes.put("1900510", new String[]{"0", "ПГ по произв. техн.", "ПГ по производствени технологии"});
        schoolCodes.put("1900528", new String[]{"0", "Спортно у-ще", "Спортно у-ще Дръстър", "https://susilistra.com"});
        schoolCodes.put("1900511", new String[]{"0", OU_OTEC_PAISII, OU_OTEC_PAISII, "https://paisii.oisy.org"});
        schoolCodes.put("1900512", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://km-silistra.com"});
        schoolCodes.put("1900514", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV, "https://ivazov-silistra.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSliven() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2000105", new String[]{"0", SU_HADZHI_MINA_PASHOV, SU_HADZHI_MINA_PASHOV, "https://suhmpashov.com"});
        schoolCodes.put("2000109", new String[]{"0", SU_PEIO_YAVOROV, SU_PEIO_YAVOROV, "https://sou5sl.com"});
        schoolCodes.put("2000114", new String[]{"0", SU_IORDAN_IOVKOV, SU_IORDAN_IOVKOV, "https://10sou.sliven.net"});
        schoolCodes.put("2000115", new String[]{"0", SU_KONSTANTIN_KONSTANTINOV_SHORT, SU_KONSTANTIN_KONSTANTINOV_LONG, "https://kkonstantinov.com"});
        schoolCodes.put("2000117", new String[]{"0", "ПГ по текстил", "ПГ по текстил и облекло Добри Желязков", "https://pgto-sliven.com"});
        schoolCodes.put("2000118", new String[]{"0", "ПГ по електрот.", "ПГ по електротехника и електроника", "https://pgee-sliven.bg"});
        schoolCodes.put("2000119", new String[]{"0", "ПГ по икономика", "ПГ по икономика Проф. д-р Димитър Табаков", "https://pgisliven.eu"});
        schoolCodes.put("2000120", new String[]{"0", "ПГ по хотелиерство", "ПГ по хотелиерство и туризъм", "https://pght-sliven.com"});
        schoolCodes.put("2000122", new String[]{"0", "ПГ по стр. и геод.", "Сливенска ПГ по строителство и геодезия", "https://pgsg-sliven.com"});
        schoolCodes.put("2000123", new String[]{"0", "ПГ по механотехника", "ПГ по механотехника", "https://pgmsliven.com"});
        schoolCodes.put("2000125", new String[]{"0", SU_ARGIRA_ZHECHKOVA, SU_ARGIRA_ZHECHKOVA, "https://prisonschool-bg.org"});
        schoolCodes.put("2000126", new String[]{"0", "ППМГ", "ППМГ Добри Чинтулов", "https://ppmgsliven.com"});
        schoolCodes.put("2000127", new String[]{"0", "Гимн. със зап. ез.", "ПГ с преподаване на западни езици", "https://gpzebg.org"});
        schoolCodes.put("2000128", new String[]{"0", "СпУ Д. Рохов", "Спортно у-ще Димитър Рохов", "https://sportno-uchilishte.sliven.net"});
        schoolCodes.put("2000129", new String[]{"0", "Хуманит. гимн.", "Хуманитарна гимназия Дамян Дамянов", "https://hg.sliven.net"});
        schoolCodes.put("2902504", new String[]{"0", "НХГ Д. Добрович", "Национална художествена гимназия", "https://nhgdd-sliven.net"});
        schoolCodes.put("2000106", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://ouhristobotev-sliven.com"});
        schoolCodes.put("2000107", new String[]{"0", OU_IV_SELIMINSKI_SHORT, OU_IV_SELIMINSKI_LONG, "https://ou-seliminski.com"});
        schoolCodes.put("2000108", new String[]{"0", OU_DIMITAR_PETROV, OU_DIMITAR_PETROV, "https://dpetrov.bg"});
        schoolCodes.put("2000110", new String[]{"0", OU_BRATYA_MILADINOVI_SHORT, OU_BRATYA_MILADINOVI_LONG, "https://6oumiladinovi.com"});
        schoolCodes.put("2000111", new String[]{"0", OU_PANAIOT_HITOV, OU_PANAIOT_HITOV, "https://7ouhitov.org"});
        schoolCodes.put("2000112", new String[]{"0", "ОУ Ю. Гагарин", OU_IURII_GAGARIN, "https://ougagarin-sliven.com"});
        schoolCodes.put("2000113", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://9ou-sliven.com"});
        schoolCodes.put("2000116", new String[]{"0", OU_ELISAVETA_BAGRYANA_SHORT, OU_ELISAVETA_BAGRYANA_LONG, "https://12ou.sliven.net"});
        schoolCodes.put("2000102", new String[]{"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI, "https://nu-v-levski.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSmolyan() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2100103", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://sou-kim.com"});
        schoolCodes.put("2100105", new String[]{"0", SU_OTEC_PAISII, SU_OTEC_PAISII, "https://sou7-smolian.weebly.com"});
        schoolCodes.put("2100111", new String[]{"0", "ПГ по техника", "ПГ по техника и технологии", "https://pgtt-smolyan.com"});
        schoolCodes.put("2100113", new String[]{"0", "ПГ по икономика", "Професионална гимназия по икономика", "https://pgi-smolyan.info"});
        schoolCodes.put("2100115", new String[]{"0", "ПГ по туризъм", "Смолянска ПГ по туризъм и строителство", "https://pg-turizam.org"});
        schoolCodes.put("2103321", new String[]{"0", "ППМГ", "ППМГ Васил Левски", "https://pmg-smolyan.org"});
        schoolCodes.put("2103331", new String[]{"0", "ЕГ Иван Вазов", "ЕГ Иван Вазов", "https://egsmolyan.com"});
        schoolCodes.put("2902506", new String[]{"0", "ПГ за прил. изк.", "ПГ за приложни изкуства", "https://pgpi-smolyan.com"});
        schoolCodes.put("2100104", new String[]{"0", OU_IURII_GAGARIN, OU_IURII_GAGARIN, "https://ou-gagarin.com"});
        schoolCodes.put("2100107", new String[]{"0", OU_ASEN_ZLATAROV_SHORT, OU_ASEN_ZLATAROV_LONG, "https://2ou-smolyan.com"});
        schoolCodes.put("2100109", new String[]{"0", OU_STOIU_SHISHKOV, OU_STOIU_SHISHKOV, "https://oushishkov-smolyan.com"});
        schoolCodes.put("2100110", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesStaraZagora() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2400014", new String[]{"0", SU_ZHELEZNIK, SU_ZHELEZNIK, "https://jeleznik.org"});
        schoolCodes.put("2400102", new String[]{"0", "ППМГ Гео Милев", "ППМГ Гео Милев", "https://pmgsz.com"});
        schoolCodes.put("2400104", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://sou-vlevski-sz.org"});
        schoolCodes.put("2400105", new String[]{"0", SU_HRISTO_SMIRNENSKI_SHORT, SU_HRISTO_SMIRNENSKI_LONG, "https://souhssz.com"});
        schoolCodes.put("2400106", new String[]{"0", SU_MAKSIM_GORKI, SU_MAKSIM_GORKI, "https://soumgsz.info"});
        schoolCodes.put("2400107", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV, "https://suvazov.bg"});
        schoolCodes.put("2400108", new String[]{"0", "СпУ Т. Каблешков", "Спортно у-ще Тодор Каблешков", "https://sportno-sz.com"});
        schoolCodes.put("2400110", new String[]{"0", "Вечерно СУ", "Вечерно СУ Захари Стоянов", "https://vsousz.org"});
        schoolCodes.put("2400111", new String[]{"0", "ПГ по механот.", "ПГ по механотехника и транспорт", "https://pgmttsz.com"});
        schoolCodes.put("2400112", new String[]{"0", "ПГ по електрот.", "ПГ по електротехника и технологии", "https://pgetstz.eu"});
        schoolCodes.put("2400116", new String[]{"0", "ПГ по вет. медицина", "Национална ПГ по ветеринарна медицина", "https://pgvm-bg.com"});
        schoolCodes.put("2400117", new String[]{"0", "ПГ по електроника", "ПГ по електроника", "https://pgeja-sz.com"});
        schoolCodes.put("2400119", new String[]{"0", "ПГ по строит и дърв.", "ПГ по строителство и дървообработване", "https://pgsdsz.com"});
        schoolCodes.put("2400121", new String[]{"0", SU_MINCHO_KANCHEV_SHORT, SU_MINCHO_KANCHEV_LONG, "https://soupmk.com"});
        schoolCodes.put("2400165", new String[]{"0", "ПГ по облекло", "ПГ по облекло и хранене", "https://pgohsz.com"});
        schoolCodes.put("2400174", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://souhrbsz.com"});
        schoolCodes.put("2402016", new String[]{"0", "Търговска гимназия", "Търговска гимназия Княз Симеон Търновски", "https://www.tgstz.bg"});
        schoolCodes.put("2402131", new String[]{"0", "ПГ по строит., арх. и геод.", "ПГ по строителство, архитектура и геодезия", "https://pgsag-sz.org"});
        schoolCodes.put("2403264", new String[]{"0", "ГПЧЕ Ромен Ролан", "ГПЧЕ Ромен Ролан", "https://romainrolland.org"});
        schoolCodes.put("2902104", new String[]{"0", "НУМСИ", "НУМСИ Христина Морфова", "https://numsi-sz.com"});
        schoolCodes.put("2400109", new String[]{"0", OU_GEORGI_RAICHEV, OU_GEORGI_RAICHEV, "https://sougrsz.bg"});
        schoolCodes.put("2400122", new String[]{"0", OU_GEORGI_BAKALOV, OU_GEORGI_BAKALOV});
        schoolCodes.put("2400123", new String[]{"0", OU_PETKO_SLAVEIKOV, "2 ОУ Петко Рачов Славейков", "https://ou2sz.com"});
        schoolCodes.put("2400125", new String[]{"0", OU_KIRIL_HRISTOV, OU_KIRIL_HRISTOV, "https://oukhsz.com"});
        schoolCodes.put("2400126", new String[]{"0", "ОУ М. Станев", "5 ОУ М. Станев", "https://ou5sz.com"});
        schoolCodes.put("2400129", new String[]{"0", OU_SAMARA, OU_SAMARA, "https://ousamara.com"});
        schoolCodes.put("2400130", new String[]{"0", "ОУ В. Ханчев", "9 ОУ В. Ханчев", "https://9ou-stz.bg"});
        schoolCodes.put("2400132", new String[]{"0", "ОУ Николай Лилиев", "11 ОУ Николай Лилиев", "https://11ou.weebly.com"});
        schoolCodes.put("2400133", new String[]{"0", "ОУ Стефан Караджа", "12 ОУ Стефан Караджа", "https://sites.google.com/site/12oustefankaradzagrstarazagora"});
        schoolCodes.put("2400134", new String[]{"0", "ОУ П. Хилендарски", "13 ОУ Св. П. Хилендарски", "https://13ou.org"});
        schoolCodes.put("2400167", new String[]{"1", "Елин Пелин", "ЧОУ Елин Пелин", "https://elin-pelin.biz"});
        schoolCodes.put("2403219", new String[]{"0", "ОУ Св. Никола", "6 ОУ Св. Никола", "https://ousvetinikola-sz.org"});
        schoolCodes.put("2400124", new String[]{"0", OU_KOLO_GANCHEV, OU_KOLO_GANCHEV, "https://nukgsz.com"});
        schoolCodes.put("2400146", new String[]{"0", NU_DIMITAR_BLAGOEV, NU_DIMITAR_BLAGOEV, "https://dblagoev-stz.webnode.page"});
        schoolCodes.put("2400147", new String[]{"0", NU_ZORA, NU_ZORA, "https://nuzora.alle.bg"});
        schoolCodes.put("2400020", new String[]{"0", "ПГ по комп. науки", "ПГ по комп. науки и мат. анализ Проф. Минко Балкански", "https://pgknma.com"});
        schoolCodes.put("2400161", new String[]{"1", "Нов век", "ЧСУ Нов век", "https://novvek.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesTurgovishte() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2500203", new String[]{"0", "Спортно у-ще", "Спортно училище Никола Симов", "https://sportno-nsimov.com"});
        schoolCodes.put("2500204", new String[]{"0", "1 СУ", "1 СУ Свети Седмочисленици", "https://1su-tg.com"});
        schoolCodes.put("2500301", new String[]{"0", "ПГИЧЕ", "ПГИЧЕ Митрополит Андрей"});
        schoolCodes.put("2500601", new String[]{"0", "ПГ по икон. инф.", "ПГ по икономическа информатика", "https://pgii-targovishte.com"});
        schoolCodes.put("2500602", new String[]{"0", "Техническа гимназия", "Професионална техническа гимназия"});
        schoolCodes.put("2500603", new String[]{"0", "ПГ по електрот.", "ПГ по електротехника и строителство"});
        schoolCodes.put("2500604", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм и хран.-вкусови технологии", "https://pgthvt-tg.com"});
        schoolCodes.put("2500605", new String[]{"0", "ПГ по земеделие", "ПГ по земеделие", "https://www.daskalo.com/pgzemedelietg/"});
        schoolCodes.put("2500703", new String[]{"0", "У-ще за уч. с увр. слух", "Специално у-ще за ученици с увреден слух", "https://deafschool-tg.bg"});
        schoolCodes.put("2501694", new String[]{"0", "2 СУ", "2 СУ Проф. Никола Маринов", "https://2su-tg.com"});
        schoolCodes.put("2500101", new String[]{"0", "1 ОУ", "1 ОУ Христо Ботев", "https://1ou-tg.com"});
        schoolCodes.put("2500102", new String[]{"0", "2 ОУ", "2 ОУ Никола Вапцаров"});
        schoolCodes.put("2500103", new String[]{"0", "3 ОУ", "3 ОУ Петко Рачов Славейков", "https://3ou-tg.com"});
        schoolCodes.put("2500104", new String[]{"0", "4 ОУ", "4 ОУ Иван Вазов", "https://4ou-tg.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesHaskovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2601025", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://soulevski-hs.com"});
        schoolCodes.put("2601026", new String[]{"0", SU_PAISII_HILENDARSKI_SHORT, SU_PAISII_HILENDARSKI_LONG, "https://sou-paisiy.com"});
        schoolCodes.put("2601027", new String[]{"0", "СпУ Ст. Караджа", "Спортно у-ще Стефан Караджа", "https://sportno-haskovo.com"});
        schoolCodes.put("2601028", new String[]{"0", "ЕГ", "ЕГ Проф. д-р Асен Златаров", "https://eghaskovo.org"});
        schoolCodes.put("2601029", new String[]{"0", "ПМГ", "ПМГ Акад. Боян Петканчин", "https://pmg-haskovo.org"});
        schoolCodes.put("2601031", new String[]{"0", "Финансово-стопанска", "Финансово-стопанска гимназия Атанас Буров", "https://fsghs.org"});
        schoolCodes.put("2601032", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Александър Паскалев", "https://pgthas.com"});
        schoolCodes.put("2601034", new String[]{"0", "ПГ по дървообр.", "ПГ по дървообработване и строителство", "https://pgds.org"});
        schoolCodes.put("2601035", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост Райна Княгиня", "https://pglp.bg"});
        schoolCodes.put("2601036", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника", "https://pgmethaskovo.com"});
        schoolCodes.put("2601904", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт и аграрни технологии", "https://pgtathaskovo.com"});
        schoolCodes.put("2601004", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG, "https://karavelov-hs.com"});
        schoolCodes.put("2601005", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://kim-haskovo.com"});
        schoolCodes.put("2601006", new String[]{"0", OU_SHANDOR_PETOFI, OU_SHANDOR_PETOFI, "https://ou-shandor.com"});
        schoolCodes.put("2601008", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://kliment-hs.com"});
        schoolCodes.put("2601009", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG, "https://ou-vaptsarov.com"});
        schoolCodes.put("2601010", new String[]{"0", OU_IVAN_RILSKI_SHORT, OU_IVAN_RILSKI_LONG, "https://ivanrilski.com"});
        schoolCodes.put("2601011", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://ousmirnenski.com"});
        schoolCodes.put("2601001", new String[]{"0", NU_GEORGI_SAVA_RAKOVSKI, NU_GEORGI_SAVA_RAKOVSKI, "https://rakovski-hs.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesShumen() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2700006", new String[]{"0", "ПГ по строителство", "ПГ по строителство, архитектура и геодезия"});
        schoolCodes.put("2700011", new String[]{"0", "ПГ по икономика", "ПГ по икономика", "https://pgishumen.bg"});
        schoolCodes.put("2700031", new String[]{"0", "ПГ по облекло", "ПГ по облекло, хранене и химични технологии", "https://pgohht-zlatarov.com"});
        schoolCodes.put("2700064", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgssht.com"});
        schoolCodes.put("2700076", new String[]{"0", SU_PANAIOT_VOLOV, SU_PANAIOT_VOLOV, "https://volov.iservice.bg"});
        schoolCodes.put("2700083", new String[]{"0", "ЕГ Н. Вапцаров", "ПЕГ Никола Йонков Вапцаров", "https://peg-shumen.bg"});
        schoolCodes.put("2700147", new String[]{"0", SU_TRAIKO_SIMEONOV, SU_TRAIKO_SIMEONOV, "https://school-ts.com"});
        schoolCodes.put("2700182", new String[]{"0", SU_Ioan_EKZARH_BALGARSKI_SHORT, SU_Ioan_EKZARH_BALGARSKI_LONG, "https://suyeb.com"});
        schoolCodes.put("2700197", new String[]{"0", SU_SAVA_DOBROPLODNI, SU_SAVA_DOBROPLODNI, "https://suizku.com"});
        schoolCodes.put("2700217", new String[]{"0", "Духовно училище", "Духовно училище Нювваб", "https://nuvvab.net"});
        schoolCodes.put("2700221", new String[]{"0", "ППМГ", "ППМГ Нанчо Попович", "https://ppmgshumen.bg"});
        schoolCodes.put("2700231", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://souvl.com"});
        schoolCodes.put("2707033", new String[]{"0", "ПГ по механот.", "ПГ по механот., електр., телеком. и транспорт", "https://pgmett.com"});
        schoolCodes.put("2700104", new String[]{"0", OU_PANAIOT_VOLOV, OU_PANAIOT_VOLOV, "https://ou-volov.com"});
        schoolCodes.put("2700114", new String[]{"0", OU_PETAR_BERON_2_SHORT, OU_PETAR_BERON_2_LONG, "https://bazovo.com"});
        schoolCodes.put("2700146", new String[]{"0", OU_DIMITAR_BLAGOEV, OU_DIMITAR_BLAGOEV, "https://iiiou-shumen.com"});
        schoolCodes.put("2700269", new String[]{"0", OU_ENO_MARKOVSKI, OU_ENO_MARKOVSKI, "https://6oushumen.com"});
        schoolCodes.put("2700082", new String[]{"0", NU_ILIYA_BLASKOV, NU_ILIYA_BLASKOV, "https://nublaskov-shumen.eu"});
        schoolCodes.put("2700153", new String[]{"0", "НУ Княз Борис I", "НУ Княз Борис I", "https://nu-kniazboris.icon.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesIambol() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2811510", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG, "https://souko-yambol.eu"});
        schoolCodes.put("2811515", new String[]{"0", "ПГ Васил Левски", "ПГ Васил Левски", "https://gvlevski.com"});
        schoolCodes.put("2811516", new String[]{"0", "ПМГ", "ПМГ Атанас Радев", "https://pmgyambol.bg"});
        schoolCodes.put("2811517", new String[]{"0", "ЕГ В. Карагьозов", "ЕГ Васил Карагьозов", "https://eg-yambol.org"});
        schoolCodes.put("2811518", new String[]{"0", "СпУ Кубертен", "Спортно у-ще Пиер дьо Кубертен", "https://cubertene.com"});
        schoolCodes.put("2811601", new String[]{"0", "Техническа гимназия", "Професионална техническа гимназия Иван Райнов", "https://ptg-yambol.bg"});
        schoolCodes.put("2811602", new String[]{"0", "ПГ по икономика", "ПГ по икономика Георги Стойков Раковски", "https://pgi-rakovski.com"});
        schoolCodes.put("2811603", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Алеко Константинов", "https://pghtt-yambol.net"});
        schoolCodes.put("2811604", new String[]{"0", "ПГ по земеделие", "ПГ по земеделие Христо Ботев", "https://pgz-yambol.com"});
        schoolCodes.put("2811607", new String[]{"0", "Гимназия по строит.", "Гимназия по строителство и архитектура", "https://pgsa-yambol.org"});
        schoolCodes.put("2811608", new String[]{"0", "ПГ по подемна техн.", "ПГ по подемна, строителна и транспортна техника", "https://pgpstt-yambol.com"});
        schoolCodes.put("2811613", new String[]{"0", "ПГ по техн.", "ПГ по технологии Леонардо да Винчи", "https://pgt-davinci.com"});
        schoolCodes.put("2811506", new String[]{"0", OU_IORDAN_IOVKOV, OU_IORDAN_IOVKOV, "https://iiovkov.com"});
        schoolCodes.put("2811507", new String[]{"0", OU_NIKOLAI_PETRINI, OU_NIKOLAI_PETRINI, "https://oupetrini.com"});
        schoolCodes.put("2811509", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG, "https://karavelov-school.com"});
        schoolCodes.put("2811512", new String[]{"0", OU_PETKO_SLAVEIKOV, OU_PETKO_SLAVEIKOV, "https://school-slaveykov.org"});
        schoolCodes.put("2811513", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://hrsmirnenski.com"});
        schoolCodes.put("2811514", new String[]{"0", "ОбУ Петър Берон", "ОбУ Д-р Петър Берон", "https://ouberon-yambol.com"});
        schoolCodes.put("2811501", new String[]{"0", NU_PETAR_NOIKOV_SHORT, NU_PETAR_NOIKOV_LONG, "https://www.daskalo.com/prnoykov/"});
        schoolCodes.put("2811504", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://ou-kim.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesAitos() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200104", new String[]{"0", OU_ATANAS_MANCHEV, OU_ATANAS_MANCHEV});
        schoolCodes.put("200112", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://subotev-aytos.org"});
        schoolCodes.put("200113", new String[]{"0", SU_NIKOLA_VAPTSAROV, SU_NIKOLA_VAPTSAROV, "https://vaptsarov.org"});
        schoolCodes.put("200114", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgss-aitos.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesAsenovgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1600101", new String[]{"0", OU_ANGEL_KANCHEV, OU_ANGEL_KANCHEV, "https://ou-angelkynchev.com"});
        schoolCodes.put("1600102", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://www.hristobotev.asenovgrad-bg.com"});
        schoolCodes.put("1600103", new String[]{"0", OU_OTEC_PAISII, OU_OTEC_PAISII, "https://www.otecpaisii.asenovgrad-bg.com"});
        schoolCodes.put("1600104", new String[]{"0", OU_PETKO_KARAVELOV, OU_PETKO_KARAVELOV, "https://www.petkokaravelov.asenovgrad-bg.com"});
        schoolCodes.put("1600105", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG, "https://ou-vapcarov.com"});
        schoolCodes.put("1600107", new String[]{"0", OU_PANAIOT_VOLOV, OU_PANAIOT_VOLOV, "https://pvolov.bg"});
        schoolCodes.put("1600114", new String[]{"0", "СУ Княз Борис I", "СУ Княз Борис I", "https://www.susvetiknyazboris.bg"});
        schoolCodes.put("1600116", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://susskm.com"});
        schoolCodes.put("1600128", new String[]{"0", "ПГ Св. П. Евтимий", "ПГ Св. Патриарх Евтимий", "https://www.pgpe.asenovgrad-bg.com"});
        schoolCodes.put("1600617", new String[]{"0", "ПГ по хран.-вк. техн.", "ПГ по хранително-вкусови технологии", "https://pghvt-asenovgrad.com"});
        schoolCodes.put("1600618", new String[]{"0", "ПГ Иван Асен II", "ПГ Цар Иван Асен II", "https://pgcarivanasen.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBalchik() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("800059", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://km-balchik.com"});
        schoolCodes.put("800060", new String[]{"0", "ОУ Антим I", "ОУ Антим I", "https://www.daskalo.com/ouantim1941/"});
        schoolCodes.put("800061", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://su-balchik.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBerkovitsa() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1202001", new String[]{"0", "1 ОУ", "1 ОУ Никола Вапцаров"});
        schoolCodes.put("1202002", new String[]{"0", "2 ОУ", "2 ОУ Христо Смирненски", "https://berk-2ou.com"});
        schoolCodes.put("1202003", new String[]{"0", "3 ОУ", "3 ОУ Иван Вазов", "https://outreto-berk.com"});
        schoolCodes.put("1202004", new String[]{"0", "4 ОУ", "4 ОУ Георги Раковски", "https://4ou-berkovitsa.org"});
        schoolCodes.put("1202000", new String[]{"0", "ПГ Иван Панов", "ПГ Д-р Иван Панов", "https://ipanov.com"});
        schoolCodes.put("1202011", new String[]{"0", "Лесотехн. ПГ", "Лесотехническа ПГ", "https://lpg-berk.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBialaRuse() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1802004", new String[]{"0", SU_PANAIOT_VOLOV, SU_PANAIOT_VOLOV});
        schoolCodes.put("1802005", new String[]{"0", "ПГ Бяла", "ПГ Бяла"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBotevgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2301045", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://oukirilmetodii.com"});
        schoolCodes.put("2308753", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://oulevski.org"});
        schoolCodes.put("2308760", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG, "https://ouvaptsarov.net"});
        schoolCodes.put("2300099", new String[]{"0", "ППМГ", "ППМГ Акад. проф. д-р Асен Златаров", "https://ppmg-botevgrad.bg"});
        schoolCodes.put("2300284", new String[]{"0", "ПГ по техника", "ПГ по техника и мениджмънт", "https://www.pgtmbg.com"});
        schoolCodes.put("2301044", new String[]{"0", "Техническа ПГ", "Техническа ПГ Стамен Панчев", "https://tpgstamenpanchev.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVelingrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1301674", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://new.soukim.com"});
        schoolCodes.put("1301699", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://oubotew-vd.org"});
        schoolCodes.put("1301707", new String[]{"0", OU_GEORGI_BENKOVSKI, OU_GEORGI_BENKOVSKI});
        schoolCodes.put("1302573", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://souvl-velingrad.com"});
        schoolCodes.put("1306811", new String[]{"0", OU_NEOFIT_RILSKI, OU_NEOFIT_RILSKI, "https://ou-nrilski-velingrad.com"});
        schoolCodes.put("1302979", new String[]{"0", "ПГ по дървообр.", "ПГ по дървообработване", "https://pgd-velingrad.com"});
        schoolCodes.put("1304231", new String[]{"0", "ПГ по иконом. и тур.", "ПГ по икономика и туризъм"});
        schoolCodes.put("1311390", new String[]{"0", "НПГ по горско стоп.", "Национална ПГ по горско стопанство", "https://www.pggs.info"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesGornaOryahovitsa() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("300201", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV, "https://www.ivazov.org"});
        schoolCodes.put("300202", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://treto.yankov.net"});
        schoolCodes.put("300205", new String[]{"0", OU_PAISII_HILENDARSKI_SHORT, OU_PAISII_HILENDARSKI_LONG, "https://ou-philendarski.com"});
        schoolCodes.put("300216", new String[]{"0", SU_GEORGI_IZMIRLIEV, SU_GEORGI_IZMIRLIEV, "https://izmirliev.bg"});
        schoolCodes.put("300217", new String[]{"0", SU_VICHO_GRANCHAROV, SU_VICHO_GRANCHAROV, "https://vicho-grancharov.eu"});
        schoolCodes.put("300218", new String[]{"0", "ПТГ В. Левски", "ПТГ Васил Левски", "https://ptg-go.com"});
        schoolCodes.put("300219", new String[]{"0", "ПГ по електрот. и електрон.", "ПГ по електротехника и електроника"});
        schoolCodes.put("300220", new String[]{"0", "ПГ по хранит. техн.", "ПГ по хранителни технологии", "https://pght-go.com"});
        schoolCodes.put("300221", new String[]{"0", "ПГ по лека пром.", "ПГ по лека промишленост и икономика", "https://burov.eu"});
        schoolCodes.put("300222", new String[]{"0", "ПГ по ЖП транспорт", "ПГ по железопътен транспорт", "https://pgjpt-go.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesGotseDelchev() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("103402", new String[]{"0", "1 ОУ", "1 ОУ Св. Св. Кирил и Методий", "https://parvo-gd.com"});
        schoolCodes.put("103403", new String[]{"0", "2 ОУ", "2 ОУ Гоце Делчев", "https://vtoro-ou-gd.com"});
        schoolCodes.put("103404", new String[]{"0", "3 ОУ", "3 ОУ Братя Миладинови", "https://treto-gd.com"});
        schoolCodes.put("102002", new String[]{"0", "ПМГ Яне Сандански", "ПМГ Яне Сандански", "https://pmggd.bg"});
        schoolCodes.put("102001", new String[]{"0", "Неврокопска ПГ", "Неврокопска ПГ Димитър Талев", "https://npg.bg"});
        schoolCodes.put("102016", new String[]{"0", "ПГ по механизация", "ПГ по мхан. на селското стоп.", "https://www.pgmss-gd.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDimitrovgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2602002", new String[]{"0", "ОУ П. Яворов", OU_PEIO_YAVOROV, "https://yavorov.eu"});
        schoolCodes.put("2602003", new String[]{"0", "ОбУ Кирил и Методий", "ОбУ Св. Св. Кирил и Методий", "https://oukmdg.com"});
        schoolCodes.put("2602004", new String[]{"0", OU_ALEKO_KONSTANTINOV_SHORT, OU_ALEKO_KONSTANTINOV_LONG, "https://tvschool.eu/site/"});
        schoolCodes.put("2602006", new String[]{"0", OU_PENCHO_SLAVEIKOV, OU_PENCHO_SLAVEIKOV, "https://ppslaveikov.com"});
        schoolCodes.put("2602017", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://vlevski-dimitrovgrad.com"});
        schoolCodes.put("2602018", new String[]{"0", SU_LIUBEN_KARAVELOV_SHORT, SU_LIUBEN_KARAVELOV_LONG, "https://lubenkaravelov.eu"});
        schoolCodes.put("2602019", new String[]{"0", "ПМГЗИЧЕ", "ПМГ със ЗИЧЕ Иван Вазов", "https://pmgdimitrovgrad.net"});
        schoolCodes.put("2602020", new String[]{"0", "ЕГ И. Богоров", "Профилирана ЕГ Д-р Иван Богоров", "https://eg-dg-bg.com"});
        schoolCodes.put("2602023", new String[]{"0", "ПГ А. Златаров", "ПГ Проф. д-р Асен Златаров", "https://pgazdg.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDupnitsa() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1000034", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://ousvsvkirilimetodii-dupnitsa.com"});
        schoolCodes.put("1000035", new String[]{"0", "СЕУ П. Хилендарски", "СЕУ Св. Паисий Хилендарски", "https://souphd.info"});
        schoolCodes.put("1000036", new String[]{"0", OU_NEOFIT_RILSKI, OU_NEOFIT_RILSKI, "https://neofit-rilski.com"});
        schoolCodes.put("1000037", new String[]{"0", OU_HRISTAKI_PAVLOVICH_SHORT, OU_HRISTAKI_PAVLOVICH_LONG, "https://ou-hrpavlovich.com"});
        schoolCodes.put("1000038", new String[]{"0", OU_EVLOGI_GEORGIEV, OU_EVLOGI_GEORGIEV, "https://ouevlogigeorgiev.com"});
        schoolCodes.put("1000039", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://ousvklohridski-dupnica.com"});
        schoolCodes.put("1000049", new String[]{"0", "ПГ по облекло", "ПГ по облекло и стоп. упр.", "https://pgosu-dupnica.com"});
        schoolCodes.put("1000051", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт", "https://www.daskalo.com/pgtdupnica/"});
        schoolCodes.put("1000052", new String[]{"0", PG_HRISTO_BOTEV, PG_HRISTO_BOTEV, "https://hrbotev.com"});
        schoolCodes.put("1002136", new String[]{"0", "ПГ С. Корольов", "ПГ Акад. Сергей П. Корольов", "https://pgkoroljov.weebly.com"});
        schoolCodes.put("1002137", new String[]{"0", "ПГ по хран.-вк. техн.", "ПГ по хранително-вкусови технологии", "https://pghvht.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesIhtiman() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2300188", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://su-hristobotev-ihtiman.net"});
        schoolCodes.put("2304101", new String[]{"0", OU_DIMCHO_DEBELYANOV, OU_DIMCHO_DEBELYANOV, "https://oudimchodebelianov.com"});
        schoolCodes.put("2308810", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://ousvsvkirilimetodiy.com"});
        schoolCodes.put("2300417", new String[]{"0", "ПГ Васил Левски", "ПГ Васил Левски", "https://pgvasillevski.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKavarna() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("800080", new String[]{"0", OU_IORDAN_IOVKOV, OU_IORDAN_IOVKOV, "https://ou-kavarna.com"});
        schoolCodes.put("800082", new String[]{"0", SU_STEFAN_KARADZHA, SU_STEFAN_KARADZHA, "https://sou-kavarna.com"});
        schoolCodes.put("800086", new String[]{"0", "Земеделска гимн.", "Проф. земеделска гимназия", "https://pzg-kavarna.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKazanluk() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2400262", new String[]{"0", "ППМГ", "ППМГ Никола Обрешков", "https://ppmgkk.com"});
        schoolCodes.put("2400264", new String[]{"0", "СУ Антим I", "СУ Екзарх Антим I", "https://antim1-kk.com"});
        schoolCodes.put("2400271", new String[]{"0", OU_KULATA, OU_KULATA, "https://oukulata-kk.com"});
        schoolCodes.put("2400272", new String[]{"0", OU_GEORGI_KIRKOV, OU_GEORGI_KIRKOV, "https://oukirkov.info"});
        schoolCodes.put("2400273", new String[]{"0", OU_PAISII_HILENDARSKI_SHORT, OU_PAISII_HILENDARSKI_LONG, "https://ouhilendarski-kk.com"});
        schoolCodes.put("2400274", new String[]{"0", OU_MATI_BOLGARIYA, OU_MATI_BOLGARIYA, "https://oumatibolgaria.eu"});
        schoolCodes.put("2400275", new String[]{"0", OU_CHUDOMIR, OU_CHUDOMIR, "https://ouchudomir.bg"});
        schoolCodes.put("2400276", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG, "https://ouvapcarov-kk.com"});
        schoolCodes.put("2400277", new String[]{"0", OU_ANTON_STRASHIMIROV_SHORT, OU_ANTON_STRASHIMIROV_LONG, "https://oustrashimirov-kk.com"});
        schoolCodes.put("2902505", new String[]{"0", "НУПИД А. Узунов", "НУ по пласт. изк. и дизайн", "https://art-school.eu"});
        schoolCodes.put("2400261", new String[]{"0", "ПГ П. Стайнов", "ПГ Акад. Петко Стайнов", "https://pgstainov.bg"});
        schoolCodes.put("2400263", new String[]{"0", "ПХГ Кирил и Методий", "ПХГ Св. Св. Кирил и Методий", "https://phgsvsvkirilimetodij.com"});
        schoolCodes.put("2400265", new String[]{"0", "ПГ Иван Хаджиенов", "ПГ Иван Хаджиенов", "https://pgih.org"});
        schoolCodes.put("2400266", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт и мениджмънт", "https://pgttm.com"});
        schoolCodes.put("2400268", new String[]{"0", "ПГ по лека пром.", "ПГ по лека пром. и туризъм"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKarlovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1601301", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI});
        schoolCodes.put("1601302", new String[]{"0", SU_HRISTO_PRODANOV, SU_HRISTO_PRODANOV});
        schoolCodes.put("1601304", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://oukm-karlovo.com"});
        schoolCodes.put("1601305", new String[]{"0", OU_RAINO_POPOVICH, OU_RAINO_POPOVICH, "https://www.daskalo.com/ourp/"});
        schoolCodes.put("1601361", new String[]{"0", "ПГ по жп транспорт", "ПГ по жп транспорт", "https://pgjpt-karlovo.com"});
        schoolCodes.put("1601364", new String[]{"0", "ПГ Евл. и Хр. Георгиеви", "ПГ Евлогий и Христо Георгиеви", "https://tmtkarlovo.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKarnobat() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200404", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://ou-smirnenski-karnobat.eu"});
        schoolCodes.put("200405", new String[]{"0", OU_PETKO_SLAVEIKOV, OU_PETKO_SLAVEIKOV, "https://ouslaveikov-karnobat.com"});
        schoolCodes.put("200411", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://kirilimetodikt.com"});
        schoolCodes.put("200412", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://hristobotev.info"});
        schoolCodes.put("200413", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://www.pgsslp-karnobat.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKozlodui() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("601071", new String[]{"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI, "https://nuvasillevski.com"});
        schoolCodes.put("603076", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://su-hrbotev.com"});
        schoolCodes.put("603077", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://kim-kozloduy.com"});
        schoolCodes.put("603078", new String[]{"0", "ПГ по ядрена енерг.", "ПГ по ядрена енерг.", "https://pgqe.weebly.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKostinbrod() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2309638", new String[]{"0", SU_PETAR_BERON_SHORT, SU_PETAR_BERON_LONG, "https://su-pberon-kbrod.com"});
        schoolCodes.put("2309735", new String[]{"0", "ПГ по вет. мед.", "ПГ по ветеринарна медицина", "https://pgvmss.org"});
        schoolCodes.put("2300067", new String[]{"0", "2 ОУ", "2 ОУ Васил Левски", "https://vlevski-kostinbrod.com"});
        schoolCodes.put("2308290", new String[]{"0", "1 ОУ", "1 ОУ Васил Левски", "https://1ou-kostinbrod.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesLom() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1203512", new String[]{"0", "1 ОУ Н. Първанов", "1 ОУ Никола Първанов", "https://ounikolapurvanov-lom.com"});
        schoolCodes.put("1209002", new String[]{"0", "2 ОУ К. Фотинов", "2 ОУ Константин Фотинов", "https://ou-fotinov.org"});
        schoolCodes.put("1209003", new String[]{"0", SU_OTEC_PAISII, SU_OTEC_PAISII, "https://souop-lom.com"});
        schoolCodes.put("1209004", new String[]{"0", "4 ОУ Христо Ботев", "4 ОУ Христо Ботев", "https://oubotev.eu"});
        schoolCodes.put("1209005", new String[]{"0", SU_DIMITAR_MARINOV, SU_DIMITAR_MARINOV, "https://sudm-lom.bg"});
        schoolCodes.put("1202036", new String[]{"0", "ПГ по хранене", "ПГ по хранене и земеделие"});
        schoolCodes.put("1209006", new String[]{"0", "ПГ Найден Геров", "ПГ Найден Геров", "https://info.gymnasium-lom.com"});
        schoolCodes.put("1209012", new String[]{"0", "ПГ по произв. техн.", "ПГ по произв. технологии", "https://pgptlom.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesLukovit() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1100402", new String[]{"0", SU_ALEKO_KONSTANTINOV_SHORT, SU_ALEKO_KONSTANTINOV_LONG, "https://su-lukovit.com"});
        schoolCodes.put("1100411", new String[]{"0", NU_GEORGI_VALKOV_SHORT, NU_GEORGI_VALKOV_LONG, "https://nuvalkov.com"});
        schoolCodes.put("1100410", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgss-lukovit.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesNesebar() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200608", new String[]{"0", SU_LIUBEN_KARAVELOV_SHORT, SU_LIUBEN_KARAVELOV_LONG, "https://sou-nessebar.org"});
        schoolCodes.put("200609", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм", "https://pgturizam-nesebar.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesNovaZagora() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2000301", new String[]{"0", NU_PAISII_HILENDARSKI_SHORT, NU_PAISII_HILENDARSKI_LONG, "https://pshilendarski-nz.org"});
        schoolCodes.put("2000302", new String[]{"0", NU_LIUBEN_KARAVELOV_SHORT, NU_LIUBEN_KARAVELOV_LONG, "https://schoolkaravelov.com"});
        schoolCodes.put("2000303", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_SHORT, "https://ousmirnenskinz.com"});
        schoolCodes.put("2000304", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV, "https://ivan-vazov.com"});
        schoolCodes.put("2000305", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://souhrbotev-nz.com"});
        schoolCodes.put("2000306", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgss-nz.com"});
        schoolCodes.put("2000307", new String[]{"0", "ПГ по техника", "ПГ по техника и технологии", "https://pgtt-nz.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesNoviPazar() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2700047", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://su-vasillevski.org"});
        schoolCodes.put("2700071", new String[]{"0", SU_HAN_ISPERIH, SU_HAN_ISPERIH, "https://su-han-isperih.com"});
        schoolCodes.put("2700194", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG, "https://www.ounpazar.net"});
        schoolCodes.put("2700220", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgss-novipazarbg.com"});
        schoolCodes.put("2700224", new String[]{"0", "ПГ по хим. техн.", "ПГ по химични технологии", "https://pghtd-az.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesObzor() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200601", new String[]{"0", "ОбУ Кирил и Методий", "ОбУ Кирил и Методий", "https://ou-obzor.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPanagiurishte() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1301731", new String[]{"0", OU_MARIN_DRINOV_SHORT, OU_MARIN_DRINOV_LONG, "https://oumarindrinov.com"});
        schoolCodes.put("1301749", new String[]{"0", "ОУ 20 Април", "ОУ 20 Април", "https://ou-20april.com"});
        schoolCodes.put("1302623", new String[]{"0", SU_NESHO_BONCHEV, SU_NESHO_BONCHEV, "https://nbnet.org"});
        schoolCodes.put("1305587", new String[]{"0", "ПГ по индустр. техн.", "ПГ по индустриални техн.", "https://pgitmt.idwebbg.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPetrich() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("103310", new String[]{"0", SU_NIKOLA_VAPTSAROV, SU_NIKOLA_VAPTSAROV});
        schoolCodes.put("104002", new String[]{"0", "СУ А. Попов", SU_ANTON_POPOV, "https://www.su-anton-popov.com"});
        schoolCodes.put("104006", new String[]{"0", "1 ОУ К. Мавродиев", "Първо ОУ Кочо Мавродиев", "https://kochomavrodiev.org"});
        schoolCodes.put("104007", new String[]{"0", "3 ОУ Гоце Делчев", "Трето ОУ Гоце Делчев", "https://gd03.org"});
        schoolCodes.put("104008", new String[]{"0", "4 ОУ Хр. Смирненски", "Четвърто ОУ Христо Смирненски"});
        schoolCodes.put("102009", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника"});
        schoolCodes.put("102014", new String[]{"0", "ПГ по икон. и туризъм", "ПГ по икономика и туризъм", "https://pgit-petrich.com"});
        schoolCodes.put("104001", new String[]{"0", "ПГ П. К. Яворов", "ПГ Пейо К. Яворов", "https://www.gimnaziapetrich.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPeshtera() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1300034", new String[]{"0", OU_PETKO_SLAVEIKOV, OU_PETKO_SLAVEIKOV, "https://ou-slaveikov-peshtera.eu"});
        schoolCodes.put("1301329", new String[]{"0", NU_MIHAIL_KAROLIDI, NU_MIHAIL_KAROLIDI, "https://numihailkarolidi.bg"});
        schoolCodes.put("1301343", new String[]{"0", NU_MIHAIL_KUMANOV, NU_MIHAIL_KUMANOV, "https://numihailkumanov.idwebbg.com"});
        schoolCodes.put("1301763", new String[]{"0", OU_PATRIARH_EVTIMII_SHORT, OU_PATRIARH_EVTIMII_LONG, "https://pe-pestera.eu"});
        schoolCodes.put("1302630", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG, "https://ohridski.eu"});
        schoolCodes.put("1304357", new String[]{"0", "ОбУ Л. Каравелов", "ОбУ Любен Каравелов", "https://karavelov.org"});
        schoolCodes.put("1302819", new String[]{"0", "ПГ по хран.-вк. техн.", "ПГ по хран.-вк. технологии", "https://www.daskalo.com/pghvt/"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPomorie() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("200703", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://oubotev-pm.org"});
        schoolCodes.put("200711", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV, "https://suvazov-pomorie.bg"});
        schoolCodes.put("200712", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм", "https://pgt-pomorie.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPopovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2540101", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG, "https://ouvapcarov-popovo.info"});
        schoolCodes.put("2540102", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://www.kliment-popovo.com"});
        schoolCodes.put("2540103", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG, "https://karavelov-popovo.com"});
        schoolCodes.put("2540401", new String[]{"0", PG_HRISTO_BOTEV, PG_HRISTO_BOTEV, "https://gimn-popovo.com/wordpress/"});
        schoolCodes.put("2540601", new String[]{"0", "ПГ по техника", "ПГ по техника", "https://www.pgtlp-popovo.info"});
        schoolCodes.put("2540602", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgss-popovo.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPravets() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2309862", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://ouvasillevski.jimdofree.com"});
        schoolCodes.put("2304770", new String[]{"0", "ГПЧЕ А. Константинов", "ГПЧЕ Алеко Константинов", "https://pgpche-pravets.com"});
        schoolCodes.put("2309991", new String[]{"0", "НПГ по КТС", "НПГ по КТС", "https://uktc-bg.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesProvadia() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("400146", new String[]{"0", "1 ОУ", "1 ОУ Христо Смирненски", "https://1ouprovadia.weebly.com"});
        schoolCodes.put("400147", new String[]{"0", "2 ОУ", "2 ОУ Иван Вазов", "https://2ouprovadia.alle.bg"});
        schoolCodes.put("400148", new String[]{"0", SU_DIMITAR_BLAGOEV, SU_DIMITAR_BLAGOEV, "https://souprovadia.info"});
        schoolCodes.put("400149", new String[]{"0", "ПГ по хотелиерство", "ПГ по хотелиерство", "https://pghrt.idwebbg.com"});
        schoolCodes.put("400150", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgssprovadia.weebly.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPurvomai() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1602301", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://www.oukim-parvomay.com"});
        schoolCodes.put("1602302", new String[]{"0", OU_GEORGI_KARASLAVOV_SHORT, OU_GEORGI_KARASLAVOV_LONG});
        schoolCodes.put("1602311", new String[]{"0", NU_HRISTO_BOTEV, NU_HRISTO_BOTEV, "https://nuhristobotev.com"});
        schoolCodes.put("1602314", new String[]{"0", SU_ASEN_ZLATAROV_2_SHORT, SU_ASEN_ZLATAROV_2_SHORT, "https://su-zlatarov.org"});
        schoolCodes.put("1602315", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgss-vlevski.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRadnevo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2401052", new String[]{"0", SU_GEO_MILEV, SU_GEO_MILEV, "https://sou-radnevo.idwebbg.com"});
        schoolCodes.put("2401054", new String[]{"0", "1 ОУ", "1 ОУ Св. Климент Охридски", "https://ou1-radnevo.com"});
        schoolCodes.put("2401055", new String[]{"0", "2 ОУ", "2 ОУ Св. Паисий Хилендарски", "https://ou2radnevo.bg"});
        schoolCodes.put("2401053", new String[]{"0", "ПГ Иван Рилски", "ПГ Св. Иван Рилски", "https://pg-radnevo.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRadomir() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1403648", new String[]{"0", NU_ZINOVII_SHORT, NU_ZINOVII_LONG, "https://arhimandritzinovii.com"});
        schoolCodes.put("1403650", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://hsmirnenski.com"});
        schoolCodes.put("1403655", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://www.su-radomir.com"});
        schoolCodes.put("1403656", new String[]{"0", "Техническа ПГ", "Техническа ПГ Никола Вапцаров", "https://tpg-radomir.com"});
        schoolCodes.put("1403657", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт", "https://pgt-radomir.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRazlog() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("103501", new String[]{"0", "СУ бр. Каназиреви", "СУ братя Каназиреви"});
        schoolCodes.put("103502", new String[]{"0", OU_NIKOLA_PARAPUNOV, OU_NIKOLA_PARAPUNOV, "https://nparapunov-razlog.org"});
        schoolCodes.put("103510", new String[]{"0", NU_YANE_SANDANSKI, NU_YANE_SANDANSKI, "https://nu-yane-sandansky.com"});
        schoolCodes.put("103511", new String[]{"0", NU_KIRIL_I_METODII, NU_KIRIL_I_METODII, "https://nukirilimetodii-razlog.com"});
        schoolCodes.put("102012", new String[]{"0", "Разложка ПГ", "Разложка ПГ", "https://rpg-nstoychev.eu"});
        schoolCodes.put("102017", new String[]{"0", "ПГ по механ. на с. стоп.", "ПГ по механ. на селското стоп.", "https://pgmssrazlog.com"});
        schoolCodes.put("102113", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт", "https://pgt-razlog.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRakovski() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1602502", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://oubotev.bg"});
        schoolCodes.put("1602503", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://smirnenski.com"});
        schoolCodes.put("1602511", new String[]{"0", "ПГ Петър Парчевич", "ПГ Петър Парчевич", "https://pgparchevich-rakovski.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSamokov() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2300131", new String[]{"0", "ПГ К. Фотинов", "ПГ Константин Фотинов", "https://pgfotinov.com"});
        schoolCodes.put("2301881", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://unkirilimetodi.eu"});
        schoolCodes.put("2303106", new String[]{"0", SU_OTEC_PAISII, SU_OTEC_PAISII, "https://susamokov.bg"});
        schoolCodes.put("2304610", new String[]{"0", "СпУ Никола Велчев", "Спортно у-ще Никола Велчев", "https://suvelchev.eu"});
        schoolCodes.put("2308917", new String[]{"0", OU_AVKSENTII_VELESHKI_SHORT, OU_AVKSENTII_VELESHKI_LONG, "https://veleshki.com"});
        schoolCodes.put("2308924", new String[]{"0", OU_H_MAKSIMOV, OU_H_MAKSIMOV, "https://hristomaksimov.com"});
        schoolCodes.put("2303825", new String[]{"0", "ОбУ Неофит Рилски", "ОбУ Неофит Рилски", "https://obu-neofitrilski.com"});
        schoolCodes.put("2308899", new String[]{"0", NU_STANISLAV_DOSPEVSKI_SHORT, NU_STANISLAV_DOSPEVSKI_LONG, "https://nu-stdospevski.eu"});
        schoolCodes.put("2300291", new String[]{"0", "ПТГ Н. Вапцаров", "ПТГ Никола Вапцаров", "https://ptg-nikola-vapcarov.bg"});
        schoolCodes.put("2300505", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм", "https://www.pgtsamokov.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSandanski() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("104104", new String[]{"0", "1 ОУ", "1 ОУ Св. Климент Охридски", "https://1ousandanski.wordpress.com"});
        schoolCodes.put("102606", new String[]{"0", "2 ОУ", "2 ОУ Христо Смирненски", "https://2ousandanski.bg"});
        schoolCodes.put("104106", new String[]{"0", "3 ОУ", "3 ОУ Христо Ботев", "https://www.3ousandanski.com"});
        schoolCodes.put("104107", new String[]{"0", "4 ОУ", "4 ОУ Св. Св. Козма и Дамян", "https://sandanski-4ou.com"});
        schoolCodes.put("109185", new String[]{"0", "Спортно у-ще", "Спортно училище", "https://sport-u-sandanski.com"});
        schoolCodes.put("102007", new String[]{"0", "Техническа гимн.", "Професионална техническа гимназия", "https://ptg-sandanski.eu"});
        schoolCodes.put("102013", new String[]{"0", "Земеделска гимн.", "Земеделска професионална гимназия", "https://zpg-sandanski.com"});
        schoolCodes.put("104101", new String[]{"0", "ПГ Яне Сандански", "ПГ Яне Сандански", "https://pgsandanski.com"});
        schoolCodes.put("108021", new String[]{"0", "Вечерна гимн.", "Вечерна профилирана гимназия"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSvilengrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2605001", new String[]{"0", NU_HRISTO_POPMARKOV, NU_HRISTO_POPMARKOV});
        schoolCodes.put("2605002", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV, "https://ouivanvazov.info"});
        schoolCodes.put("2605003", new String[]{"0", OU_LIUBEN_KARAVELOV_SHORT, OU_LIUBEN_KARAVELOV_LONG, "https://oulk-svilengrad.com"});
        schoolCodes.put("2605008", new String[]{"0", SU_PETAR_BERON_SHORT, SU_PETAR_BERON_LONG, "https://suberon.org"});
        schoolCodes.put("2605016", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgssi.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSvishtov() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("300801", new String[]{"0", OU_FILIP_SAKELARIEVICH_SHORT, OU_FILIP_SAKELARIEVICH_LONG, "https://oufilipsacelarievich.com"});
        schoolCodes.put("300814", new String[]{"0", SU_TSVETAN_RADOSLAVOV_SHORT, SU_TSVETAN_RADOSLAVOV_LONG, "https://su-cvetanradoslavov.com"});
        schoolCodes.put("300815", new String[]{"0", SU_NIKOLAI_KATRANOV, SU_NIKOLAI_KATRANOV, "https://katranov.com"});
        schoolCodes.put("300816", new String[]{"0", SU_DIMITAR_BLAGOEV, SU_DIMITAR_BLAGOEV, "https://blagoevschool.org"});
        schoolCodes.put("300817", new String[]{"0", "Търговска гимн.", "ПДТГ Димитър Хадживасилев", "https://dtg-svishtov.com"});
        schoolCodes.put("300819", new String[]{"0", "ПГ Ал. Константинов", "Свищовска ПГ Алеко Константинов", "https://spg-svishtov.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSvoge() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2304051", new String[]{"0", NU_PETAR_BERON_SHORT, NU_PETAR_BERON_LONG, "https://nupberon.com"});
        schoolCodes.put("2308867", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV, "https://su-vazov.com"});
        schoolCodes.put("2303022", new String[]{"0", "ПГ Велизар Пеев", "ПГ Велизар Пеев", "https://www.pg-vpeev.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSevlievo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("700307", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://hristobotevsevlievo.com"});
        schoolCodes.put("700308", new String[]{"0", OU_STEFAN_PESHEV, OU_STEFAN_PESHEV, "https://ou2-sevlievo.com"});
        schoolCodes.put("700318", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://su-sevlievo.com"});
        schoolCodes.put("700323", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника", "https://pgmet.com"});
        schoolCodes.put("700330", new String[]{"0", "ПГ Марин Попов", "ПГ Марин Попов", "https://pg-marinpopov.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesStamboliiski() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1602904", new String[]{"0", "ОбУ Христо Ботев", "ОбУ Христо Ботев", "https://ouhristobotev.com"});
        schoolCodes.put("1602905", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://smirnensky.weebly.com"});
        schoolCodes.put("1602907", new String[]{"0", SU_OTEC_PAISII, SU_OTEC_PAISII, "https://www.paisiibg.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesTroyan() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1100601", new String[]{"0", OU_IVAN_HADZHIISKI, OU_IVAN_HADZHIISKI, "https://ou-ihtroyan.info"});
        schoolCodes.put("1100612", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://vlevski.eu"});
        schoolCodes.put("1100613", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("1100614", new String[]{"0", NU_KIRIL_I_METODII, NU_KIRIL_I_METODII, "https://km-troyan.com"});
        schoolCodes.put("1100615", new String[]{"0", NU_HRISTO_BOTEV, NU_HRISTO_BOTEV, "https://nu-hristobotev.com"});
        schoolCodes.put("2902502", new String[]{"0", "НУПИ Венко Колев", "НУПИ Проф. Венко Колев"});
        schoolCodes.put("1100616", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника", "https://www.daskalo.com/mehanotehnikum/"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesHarmanli() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2603001", new String[]{"0", NU_OTEC_PAISII, NU_OTEC_PAISII, "https://www.daskalo.com/paisiiharmanli/"});
        schoolCodes.put("2603002", new String[]{"0", NU_ALEKO_KONSTANTINOV_SHORT, NU_ALEKO_KONSTANTINOV_LONG});
        schoolCodes.put("2603007", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV, "https://ivanvazov.net"});
        schoolCodes.put("2603008", new String[]{"0", SU_NEOFIT_RILSKI, SU_NEOFIT_RILSKI, "https://www.sounr-harmanli.com"});
        schoolCodes.put("2603009", new String[]{"0", "ПГ по електропром.", "ПГ по електропромишленост", "https://pget-harmanli.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesChirpan() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2401178", new String[]{"0", SU_PEIO_YAVOROV, SU_PEIO_YAVOROV, "https://iavorov.com"});
        schoolCodes.put("2401181", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://ouvlevski.alle.bg"});
        schoolCodes.put("2401182", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://oukmchirpan.com"});
        schoolCodes.put("2401189", new String[]{"0", NU_KLIMENT_OHRIDSKI_SHORT, NU_KLIMENT_OHRIDSKI_LONG, "https://nuchirpan.com"});
        schoolCodes.put("2401179", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgss-chirpan.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesChervenBriag() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1500203", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://ou-smirnenski-chervenbryag.com"});
        schoolCodes.put("1500204", new String[]{"0", OU_ALEKO_KONSTANTINOV_SHORT, OU_ALEKO_KONSTANTINOV_LONG, "https://www.aleko-chervenbryag.com"});
        schoolCodes.put("1500215", new String[]{"0", SU_PETAR_BERON_SHORT, SU_PETAR_BERON_LONG, "https://su-beron.org"});
        schoolCodes.put("1500217", new String[]{"0", "ПГ по хран. техн.", "ПГ по хранителни технологии", "https://pght-ugagarin.com"});
        schoolCodes.put("1500218", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника", "https://pgmet-9mai.eu"});
        schoolCodes.put("1500219", new String[]{"0", "Търговска гимн.", "Търговска гимназия", "https://tg-aprilov.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesYakoruda() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("102011", new String[]{"0", "ПГ Петко Славейков", "ПГ Петко Рачов Славейков", "https://pg-yakoruda.com"});
        schoolCodes.put("107090", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://souyakoruda.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBansko() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("102004", new String[]{"0", "ПГ лесотехническа", "ПГ лесотехническа Н. Вапцаров", "https://pltgbansko.edupage.org"});
        schoolCodes.put("102010", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Ал. Константинов", "https://gt-bansko.com"});
        schoolCodes.put("102015", new String[]{"0", "ПГ по електроника", "ПГ по електроника и енергетика", "https://pgeebansko.org"});
        schoolCodes.put("105201", new String[]{"0", SU_NEOFIT_RILSKI, SU_NEOFIT_RILSKI, "https://www.subansko.com"});
        schoolCodes.put("105204", new String[]{"0", NU_PAISII_HILENDARSKI_SHORT, NU_PAISII_HILENDARSKI_LONG, "https://nu-bansko.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSimitli() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("103133", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://susimitli.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesTeteven() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1100509", new String[]{"0", SU_GEORGI_BENKOVSKI, SU_GEORGI_BENKOVSKI, "https://sugb.bg"});
        schoolCodes.put("1100511", new String[]{"0", "НПГ горско стоп.", "НПГ горско стопанство Сава Младенов", "https://npgteteven.bg"});
        schoolCodes.put("1100513", new String[]{"0", NU_HADZHI_GENCHO, NU_HADZHI_GENCHO});
        schoolCodes.put("1100514", new String[]{"0", "ПГ по строителство", "ПГ по строителство и услуги", "https://pgseu-teteven.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVarshets() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1208000", new String[]{"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI, "https://nu-vlevski.com"});
        schoolCodes.put("1208002", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV, "https://www.ivan-vazov.info"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesRakitovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1300054", new String[]{"0", OU_NEOFIT_RILSKI, OU_NEOFIT_RILSKI, "https://nrilski-kostandovo.com"});
        schoolCodes.put("1301368", new String[]{"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI});
        schoolCodes.put("1301375", new String[]{"0", NU_PAISII_HILENDARSKI_SHORT, NU_PAISII_HILENDARSKI_LONG, "https://nu-paisiihilendarski.com"});
        schoolCodes.put("1301770", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG, "https://surakitovo.com"});
        schoolCodes.put("1301788", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://hrbotev-sp.org"});
        schoolCodes.put("1302662", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://soustrelcha.net"});
        schoolCodes.put("1302722", new String[]{"0", "ВУ-интернат", "Възпитателно училище-интернат Ангел Узунов"});
        schoolCodes.put("1302993", new String[]{"0", "ПГ по мех. на земеделието", "Професионална гимназия по механизация на земеделското стопанство", "https://pgmzs.bg"});
        schoolCodes.put("1303889", new String[]{"0", SU_HRISTO_SMIRNENSKI_SHORT, SU_HRISTO_SMIRNENSKI_LONG, "https://su-smirnenski.net"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesLevski() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1500602", new String[]{"0", OU_MAKSIM_GORKI, OU_MAKSIM_GORKI, "https://ou-maksim-gorki.com"});
        schoolCodes.put("1500611", new String[]{"0", SU_KRUM_POPOV, SU_KRUM_POPOV, "https://su-krumpopov.com"});
        schoolCodes.put("1500613", new String[]{"0", "ПГ по сел. стоп.", "ПГ по сел. стоп. и транспорт Н. Вапцаров", "https://pgsst-vapcarov.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSopot() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1601303", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV, "https://susopot.eu"});
        schoolCodes.put("1601320", new String[]{"0", NU_NEDELYA_PETKOVA, NU_NEDELYA_PETKOVA, "https://nu-sopot.com"});
        schoolCodes.put("1601363", new String[]{"0", "ПГ Ген. Вл. Заимов", "ПГ Генерал Владимир Заимов", "https://pgzaimov.com"});
        schoolCodes.put("1601401", new String[]{"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI, "https://nuvlevski.com"});
        schoolCodes.put("1601403", new String[]{"0", SU_PETKO_RACHOV_SLAVEIKOV_SHORT, SU_PETKO_RACHOV_SLAVEIKOV_LONG, "https://su-prslaveikov.com"});
        schoolCodes.put("1602401", new String[]{"0", OU_PETAR_BONEV, OU_PETAR_BONEV, "https://ou-petarbonev.com"});
        schoolCodes.put("1602402", new String[]{"0", "ПГ по лозарство и винарство", "Професионална гимназия по лозарство и винарство Христо Ботев", "https://pglv-hristobotev.com"});
        schoolCodes.put("1603301", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("1603302", new String[]{"0", NU_LIUBEN_KARAVELOV_SHORT, NU_LIUBEN_KARAVELOV_LONG});
        schoolCodes.put("1603704", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://vasillevski-hisar.com"});
        schoolCodes.put("1603705", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://ouklhisar.idwebbg.com"});
        schoolCodes.put("1603708", new String[]{"0", SU_HRISTO_SMIRNENSKI_SHORT, SU_HRISTO_SMIRNENSKI_LONG, "https://su-hisarya.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesIsperih() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1701401", new String[]{"0", "ПГ Васил Левски", "ПГ Васил Левски"});
        schoolCodes.put("1701402", new String[]{"0", OU_VASIL_APRILOV, OU_VASIL_APRILOV, "https://www.ouvasilaprilov.bg"});
        schoolCodes.put("1701403", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://botevisperih.bg"});
        schoolCodes.put("1701405", new String[]{"0", "ПГ по сел. стоп.", "ПГ по сел. стоп. Хан Аспарух", "https://pgpossisperih.bg"});
        schoolCodes.put("1701601", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://soukubrat.com"});
        schoolCodes.put("1701602", new String[]{"0", "ПГ по профес.", "ПГ по професионално обучение", "https://pgkubrat.wordpress.com"});
        schoolCodes.put("1701604", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://ouhrsmirnenski-kubrat.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDulovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1900301", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://su-dulovo.com"});
        schoolCodes.put("1900314", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://ouhristosmirnenski.com"});
        schoolCodes.put("1900327", new String[]{"0", "ПГ по облекло и трансп.", "ПГ по облекло и транспорт", "https://pgoot.info"});
        schoolCodes.put("1900701", new String[]{"0", SU_IORDAN_IOVKOV, SU_IORDAN_IOVKOV, "https://souyovkov.com"});
        schoolCodes.put("1900702", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://hrbotev.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKotel() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2000201", new String[]{"0", SU_GEORGI_RAKOVSKI, SU_GEORGI_RAKOVSKI, "https://su-kotel.com"});
        schoolCodes.put("2000402", new String[]{"0", SU_NEOFIT_RILSKI, SU_NEOFIT_RILSKI, "https://sutvarditsa.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDevin() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2100401", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV});
        schoolCodes.put("2100402", new String[]{"0", "ПГ по електротехника", "ПГ по електротехника А.С. Попов"});
        schoolCodes.put("2100409", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII});
        schoolCodes.put("2100606", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI, "https://ou-levski.com"});
        schoolCodes.put("2100701", new String[]{"0", SU_OTEC_PAISII, SU_OTEC_PAISII});
        schoolCodes.put("2100704", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG, "https://ou-sharenka.eu"});
        schoolCodes.put("2100901", new String[]{"0", SU_VASIL_DECHEV, SU_VASIL_DECHEV, "https://souchepelare.com"});
        schoolCodes.put("2100903", new String[]{"0", "ПГ сел. горско стоп.", "ПГ по сел. горско стоп. Н. Вапцаров", "https://pgsgst.org"});
        schoolCodes.put("2100920", new String[]{"0", "СпУ Олимп. надежди", "Спортно у-ще Олимпийски надежди"});
        schoolCodes.put("2102145", new String[]{"0", "ПГ Васил Димитров", "ПГ Васил Димитров"});
        schoolCodes.put("2103232", new String[]{"0", "СУ Антим I", "СУ Антим I", "https://su-antim1-zlatograd.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPirdop() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1304532", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://ou-rakitovo.idwebbg.com"});
        schoolCodes.put("2300105", new String[]{"0", SU_SAVO_TSENOV_SAVOV, SU_SAVO_TSENOV_SAVOV, "https://supirdop.bg"});
        schoolCodes.put("2300163", new String[]{"0", SU_ASEN_ZLATAROV_2_SHORT, SU_ASEN_ZLATAROV_2_LONG, "https://www.suzlatarovgodech.com"});
        schoolCodes.put("2300170", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://su-vasillevski.com"});
        schoolCodes.put("2300195", new String[]{"0", SU_HRISTO_YASENOV, SU_HRISTO_YASENOV, "https://hristo-yassenov.com"});
        schoolCodes.put("2300302", new String[]{"0", "ПГ Златица", "ПГ Златица", "https://www.pgzlatitsa.bg"});
        schoolCodes.put("2300327", new String[]{"0", "ПГ Тодор Пеев", "ПГ Тодор Пеев", "https://pg-etropole.eu"});
        schoolCodes.put("2300448", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Никола Димов", "https://pgthtpirdop.com"});
        schoolCodes.put("2300455", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт Н. Вапцаров", "https://www.pgt-slivnitsa.bg"});
        schoolCodes.put("2302504", new String[]{"0", "ПГ по механоел.", "ПГ по механоелектротехника", "https://pgme-pirdop.com"});
        schoolCodes.put("2303490", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG});
        schoolCodes.put("2303582", new String[]{"0", PG_HRISTO_BOTEV, PG_HRISTO_BOTEV, "https://pghristobotev.weebly.com"});
        schoolCodes.put("2304717", new String[]{"0", "ПГ Г.С. Раковски", "ПГ Георги Сава Раковски", "https://pgrakovski.com"});
        schoolCodes.put("2306213", new String[]{"0", SU_NEOFIT_RILSKI, SU_NEOFIT_RILSKI, "https://suneofitrilski.eu"});
        schoolCodes.put("2306517", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://suslivnitsa.bg"});
        schoolCodes.put("2307576", new String[]{"0", NU_HRISTO_BOTEV, NU_HRISTO_BOTEV, "https://nu-hristobotev.org"});
        schoolCodes.put("2306477", new String[]{"0", NU_OTEC_PAISII, NU_OTEC_PAISII, "https://nu-otecpaisii.com"});
        schoolCodes.put("2308778", new String[]{"0", "ОУ Ст. Стефанов", "ОУ Стефан Стефанов", "https://ou-sstefanov.idwebbg.com"});
        schoolCodes.put("2308785", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://etropole-botev.com"});
        schoolCodes.put("2308792", new String[]{"0", SU_PAISII_HILENDARSKI_SHORT, SU_PAISII_HILENDARSKI_LONG, "https://su-zlatitsa.bg"});
        schoolCodes.put("2308850", new String[]{"0", NU_TODOR_VLAIKOV, NU_TODOR_VLAIKOV, "https://nuvlaikov.com"});
        schoolCodes.put("2308970", new String[]{"0", SU_HRISTO_TOPRAKCHIEV_SHORT, SU_HRISTO_TOPRAKCHIEV_LONG, "https://soubozhurishte.com"});
        schoolCodes.put("2309531", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://ou-kostenets.com"});
        schoolCodes.put("2304763", new String[]{"0", "ОУ К. Костенечки", "ОУ Константин Костенечки", "https://ou-konstantinkostenetchki.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesGulyubovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2404107", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://sou-vasil-levski.bg/wp/"});
        schoolCodes.put("2404108", new String[]{"0", "ПГ по енергетика", "ПГ по енергетика и електротехника", "https://pgee-galabovo.info"});
        schoolCodes.put("2404109", new String[]{"0", "I ОУ Паисий Хил.", "I ОУ Св. Паисий Хилендарски", "https://1ou-galabovo.com"});
        schoolCodes.put("2404110", new String[]{"0", "II ОУ Хр. Ботев", "II ОУ Христо Ботев", "https://2ougalabovo.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesOmurtag() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2520001", new String[]{"0", "I НУ Хр. Смирненски", "I НУ Христо Смирненски", "https://1nu-smirnenski.com"});
        schoolCodes.put("2520002", new String[]{"0", "II НУ Васил Левски", "II НУ Васил Левски", "https://nu2-omurtag.eu"});
        schoolCodes.put("2520401", new String[]{"0", "ПГ Симеон Велчев", "ПГ Симеон Велчев", "https://gimsv.com"});
        schoolCodes.put("2520501", new String[]{"0", OU_DAKI_IORDANOV_SHORT, OU_DAKI_IORDANOV_LONG, "https://ou-omurtag.ucoz.site"});
        schoolCodes.put("2520601", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт и лека промишленост", "https://pgtlp-omurtag.org"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSimeonovgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2604001", new String[]{"0", NU_OTEC_PAISII, NU_OTEC_PAISII, "https://nu-simeonovgrad.com"});
        schoolCodes.put("2604003", new String[]{"0", OU_IVAN_VAZOV, OU_IVAN_VAZOV, "https://ou-simeonovgrad.com"});
        schoolCodes.put("2604004", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG, "https://sou-simeonovgrad.com"});
        schoolCodes.put("2606001", new String[]{"0", NU_ZAHARI_STOYANOV, NU_ZAHARI_STOYANOV, "https://nu-zaharistoyanov-lubimec.com"});
        schoolCodes.put("2606002", new String[]{"0", NU_HRISTO_BOTEV, NU_HRISTO_BOTEV, "https://nu-hristo-botev.com"});
        schoolCodes.put("2606005", new String[]{"0", SU_ZHELYAZKO_TERPESHEV, SU_ZHELYAZKO_TERPESHEV, "https://www.su-jt.eu"});
        schoolCodes.put("2611001", new String[]{"0", NU_KIRIL_I_METODII, NU_KIRIL_I_METODII, "https://nu-topolovgrad.com"});
        schoolCodes.put("2611018", new String[]{"0", SU_PETAR_BERON_SHORT, SU_PETAR_BERON_LONG, "https://sou-topolovgrad.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesVelikiPreslav() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2700103", new String[]{"0", SU_CHERNORIZETS_HRABAR_SHORT, SU_CHERNORIZETS_HRABAR_LONG, "https://su-vp.com"});
        schoolCodes.put("2700180", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://ou-vpreslav.com"});
        schoolCodes.put("2700024", new String[]{"0", "ПТГ Симеон Велики", "ПТГ Симеон Велики", "https://ptg-sv.eu"});
        schoolCodes.put("2700282", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://www.daskalo.com/pgss1vp/"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesElhovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("2831522", new String[]{"0", "ПГ Кл. Охридски", "ПГ Св. Климент Охридски", "https://kliment-ohridski-elhovo.com"});
        schoolCodes.put("2831523", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://kim-elhovo.com"});
        schoolCodes.put("2831524", new String[]{"0", OU_PAISII_HILENDARSKI_SHORT, OU_PAISII_HILENDARSKI_LONG, "https://ph-elhovo.com"});
        schoolCodes.put("2831609", new String[]{"0", "ПГ Стефан Караджа", "ПГ Стефан Караджа", "https://pgsk-elhovo.com"});
        schoolCodes.put("2841532", new String[]{"0", SU_PEIO_YAVOROV, SU_PEIO_YAVOROV});
        schoolCodes.put("2841534", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://oustraldja.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesAksakovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("400087", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG, "https://souaksakovo.com"});
        schoolCodes.put("400095", new String[]{"0", NU_OTEC_PAISII, NU_OTEC_PAISII, "https://nubeloslav.com"});
        schoolCodes.put("400096", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://soubeloslav.com"});
        schoolCodes.put("400097", new String[]{"0", OU_PATRIARH_EVTIMII_SHORT, OU_PATRIARH_EVTIMII_LONG, "https://patriarhevtimii.eu"});
        schoolCodes.put("400098", new String[]{"0", "ПГ Св. Димитър Солунски", "ПГ Св. Димитър Солунски", "https://pg-beloslav.com"});
        schoolCodes.put("400137", new String[]{"0", NU_IVAN_VAZOV, NU_IVAN_VAZOV, "https://nu-ivanvazov.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBelogradchik() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("500201", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://sou-hb.org"});
        schoolCodes.put("500203", new String[]{"0", NU_VASIL_LEVSKI, NU_VASIL_LEVSKI, "https://nulevski.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesByalaSlatina() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("600221", new String[]{"0", "ПГ по облекло", "ПГ по облекло Ел. Багряна", "https://pgo-elbag.eu"});
        schoolCodes.put("601007", new String[]{"0", NU_HRISTO_BOTEV, NU_HRISTO_BOTEV, "https://hristobotevbsll.wordpress.com"});
        schoolCodes.put("601008", new String[]{"0", NU_TSANI_GINCHEV, NU_TSANI_GINCHEV, "https://www.nucaniginchev.com"});
        schoolCodes.put("601009", new String[]{"0", NU_HRISTO_SMIRNENSKI_SHORT, NU_HRISTO_SMIRNENSKI_LONG, "https://hristosmirnenskibsl.wordpress.com"});
        schoolCodes.put("601015", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://klohridskibsl.com"});
        schoolCodes.put("601110", new String[]{"0", NU_KIRIL_I_METODII, NU_KIRIL_I_METODII, "https://nu-kirilimetodii.com"});
        schoolCodes.put("601111", new String[]{"0", NU_PETAR_BERON_SHORT, NU_PETAR_BERON_LONG, "https://nu-beron67.com"});
        schoolCodes.put("603024", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://su-bsl.com"});
        schoolCodes.put("603026", new String[]{"0", "ПГ агротехническа", "ПГ агротехническа Н. Вапцаров", "https://pag-bsl.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesGeneralToshevo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("800073", new String[]{"0", OU_HRISTO_SMIRNENSKI_SHORT, OU_HRISTO_SMIRNENSKI_LONG, "https://smirnenski-gt.org"});
        schoolCodes.put("800074", new String[]{"0", SU_NIKOLA_VAPTSAROV, SU_NIKOLA_VAPTSAROV, "https://su-vapcarov-gtoshevo.com"});
        schoolCodes.put("800076", new String[]{"0", "ПГ по земеделие", "ПГ по земеделие Тодор Рачински", "https://www.pgzemedelie.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDevnya() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("400123", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://soudevnya.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDolniChiflik() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("400126", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://su-dolnichiflik.com"});
        schoolCodes.put("400127", new String[]{"0", "ПГ по сел. стоп.", "ПГ по сел. стоп. И.В. Мичурин", "https://pgss-michurin.iweb.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDryanovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("700204", new String[]{"0", SU_MAKSIM_RAIKOVICH, SU_MAKSIM_RAIKOVICH});
        schoolCodes.put("700205", new String[]{"0", "ПГ по иконом. и техника", "ПГ по икономика и техника", "https://pgidryanovo.com"});
        schoolCodes.put("700401", new String[]{"0", OU_PENCHO_NIKOLOV_RAIKOV_SHORT, OU_PENCHO_NIKOLOV_RAIKOV_LONG, "https://ouraikov.jimdofree.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesDulgopol() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("400136", new String[]{"0", SU_KLIMENT_OHRIDSKI_SHORT, SU_KLIMENT_OHRIDSKI_LONG, "https://su-dalgopol.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesElena() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("300301", new String[]{"0", NU_ILARION_MAKARIOPOLSKI_SHORT, NU_ILARION_MAKARIOPOLSKI_LONG, "https://nu-elena.eu"});
        schoolCodes.put("300305", new String[]{"0", SU_IVAN_NIKOLOV_MOMCHILOV_SHORT, SU_IVAN_NIKOLOV_MOMCHILOV_LONG, "https://www.momchilov.bg"});
        schoolCodes.put("300602", new String[]{"0", OU_KLIMENT_OHRIDSKI_SHORT, OU_KLIMENT_OHRIDSKI_LONG, "https://www.oupavlikeni.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKrumovgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("909501", new String[]{"0", SU_VASIL_LEVSKI, SU_VASIL_LEVSKI, "https://suvlevski-krumovgrad.com"});
        schoolCodes.put("909503", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт Хр. Смирненски", "https://pg-transport.net"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesLyaskovets() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("300501", new String[]{"0", NU_TSANI_GINCHEV, NU_TSANI_GINCHEV, "https://www.nucginchev.com"});
        schoolCodes.put("300507", new String[]{"0", SU_MAKSIM_RAIKOVICH, SU_MAKSIM_RAIKOVICH, "https://su-mrlc.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesMezdra() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("602092", new String[]{"0", OU_KIRIL_I_METODII, OU_KIRIL_I_METODII, "https://oukm-mz.com"});
        schoolCodes.put("602093", new String[]{"0", OU_HRISTO_BOTEV, OU_HRISTO_BOTEV, "https://ouhristobotev-mezdra.com"});
        schoolCodes.put("603098", new String[]{"0", SU_IVAN_VAZOV, SU_IVAN_VAZOV, "https://vazov-school.com"});
        schoolCodes.put("603100", new String[]{"0", "ПГ Ал. Константинов", "ПГ Алеко Константинов", "https://www.pgalekokonstantinov.com"});
        schoolCodes.put("603101", new String[]{"0", "ПГ Васил Левски", "ПГ Васил Левски", "https://pgvlevski-mezdra.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesMomchilgrad() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("909601", new String[]{"0", SU_NIKOLA_VAPTSAROV, SU_NIKOLA_VAPTSAROV, "https://sou-vapcarov-mg.com"});
        schoolCodes.put("909608", new String[]{"0", OU_PETAR_BERON, "ОУ Д-р Петър Берон", "https://ou-beron.org"});
        schoolCodes.put("909603", new String[]{"0", "ПГ по туризъм", "ПГ по туризъм Кирил и Методий", "https://pgthvpm.com"});
        schoolCodes.put("909613", new String[]{"0", "Духовно училище", "Духовно училище", "https://du-momchilgrad.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesOryahovo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("603116", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://su-oryahovo.idwebbg.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesPavlikeni() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("300618", new String[]{"0", SU_BACHO_KIRO, SU_BACHO_KIRO, "https://supavlikeni.com"});
        schoolCodes.put("300619", new String[]{"0", "ПГ по аграрни техн.", "ПГ по аграрни технологии Ц. Церковски", "https://pgat.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSredets() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("201104", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://new.susredets.org"});
        schoolCodes.put("201106", new String[]{"0", "ПГ по механизация", "ПГ по механизация Н. Вапцаров", "https://pgmsse.com"});
        schoolCodes.put("2902201", new String[]{"0", "НУФИ Филип Кутев", "Национално училище за фолклорни изкуства Филип Кутев"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesStrazhitsa() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("300911", new String[]{"0", SU_ANGEL_KARALIICHEV, SU_ANGEL_KARALIICHEV, "https://soustrajica.com"});
        schoolCodes.put("300912", new String[]{"0", "ПГ по транспорт", "ПГ по транспорт В. Друмев", "https://pgt-str.eu"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSuvorov() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("400163", new String[]{"0", SU_NIKOLA_VAPTSAROV, SU_NIKOLA_VAPTSAROV});
        schoolCodes.put("400166", new String[]{"0", "ПГ по сел. стоп.", PG_SELSKO_STOPANSTVO_LONG, "https://pgss-suvorovo.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesTervel() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("800094", new String[]{"0", SU_IORDAN_IOVKOV, SU_IORDAN_IOVKOV});
        schoolCodes.put("800105", new String[]{"0", "ПГ по техника и облекло", "ПГ по техника и облекло Д. Михайлов", "https://pgto-tervel.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesTryavna() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("700403", new String[]{"0", SU_PETKO_RACHOV_SLAVEIKOV_SHORT, SU_PETKO_RACHOV_SLAVEIKOV_LONG, "https://sou-tryavna.info"});
        schoolCodes.put("2902503", new String[]{"0", "НГПИ Тревненска школа", "НГПИ Тревненска школа", "https://artschooltryavna.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesTsarevo() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("201305", new String[]{"0", SU_NIKOLA_VAPTSAROV, SU_NIKOLA_VAPTSAROV, "https://su-tsarevo.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSopol() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("201009", new String[]{"0", SU_KIRIL_I_METODII, SU_KIRIL_I_METODII, "https://www.sukimsozopol.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBobovDol() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1000015", new String[]{"0", OU_NIKOLA_VAPTSAROV_SHORT, OU_NIKOLA_VAPTSAROV_LONG, "https://sites.google.com/site/ouvapcarov"});
        schoolCodes.put("1000016", new String[]{"0", SU_HRISTO_BOTEV, SU_HRISTO_BOTEV, "https://subobovdol.weebly.com"});
        schoolCodes.put("1000018", new String[]{"0", SU_PETAR_BERON_SHORT, SU_PETAR_BERON_LONG, "https://soudpb.weebly.com"});
        schoolCodes.put("1002451", new String[]{"0", "ПГ по проф. обуч.", "ПГ по професионално обучение", "https://pg-bobovdol.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesBelene() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1500702", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("1500705", new String[]{"0", SU_DIMCHO_DEBELYANOV, SU_DIMCHO_DEBELYANOV});
        schoolCodes.put("1500706", new String[]{"0", "ПГ по ядрена енерг.", "ПГ ядрена енергетика М. Кюри", "https://pgbelene.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKneza() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1501101", new String[]{"0", NU_KNEZHITSA, NU_KNEZHITSA, "https://nuknezhitsa.weebly.com"});
        schoolCodes.put("1501102", new String[]{"0", OU_VASIL_LEVSKI, OU_VASIL_LEVSKI});
        schoolCodes.put("1501103", new String[]{"0", OU_OTEC_PAISII, OU_OTEC_PAISII, "https://www.daskalo.com/oupaisii/"});
        schoolCodes.put("1501108", new String[]{"0", SU_NEOFIT_RILSKI, SU_NEOFIT_RILSKI});
        schoolCodes.put("1501109", new String[]{"0", "ПГ по земеделие", "ПГ по земеделие Стефан Цанов", "https://pgzemedelie.weebly.com"});
        schoolCodes.put("1501110", new String[]{"0", "ПГ по механоел.", "ПГ по механоел. Хр. Смирненски", "https://pgmet-knezha.bg"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesKuklen() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1601101", new String[]{"0", SU_OTEC_PAISII, SU_OTEC_PAISII, "https://otecpaisii-kuklen.eu"});
        schoolCodes.put("1601102", new String[]{"0", PG_SELSKO_STOPANSTVO_SHORT, PG_SELSKO_STOPANSTVO_LONG, "https://pgss-kuklen.com"});

        return schoolCodes;
    }

    private static Map<String, String[]> prepareSchoolCodesSuedinenie() {
        Map<String, String[]> schoolCodes = new HashMap<>();

        schoolCodes.put("1600035", new String[]{"0", "СУ Н. Шилева", "СУ Недялка Шилева", "https://su-saedinenie.com"});

        return schoolCodes;
    }
}
