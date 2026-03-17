package nvo;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class JsonGenerator {

    private static final int FIRST_YEAR = 2018;
    private static final int LAST_YEAR = 2025;
    private static final int NUM_YEARS = LAST_YEAR - FIRST_YEAR + 1;

    private static final String BASE_PATH = "/Users/mac/projects/nvo/";
    private static final String NORMALIZED_PATH = BASE_PATH + "data/normalized/";
    private static final String OUTPUT_BASE = BASE_PATH + "docs/api/v1/";

    private static final String[][] GRADES = {
            {"4", "НВО 4 клас", "0", "100"},
            {"7", "НВО 7 клас", "0", "100"},
            {"10", "НВО 10 клас", "0", "100"},
            {"12", "ДЗИ 12 клас", "2", "6"},
    };

    public static void main(String... args) throws Exception {
        if (args.length == 0) {
            System.err.println("Expected argument: index, schools, cities, 4, 7, 10, or 12");
            System.exit(1);
        }

        String mode = args[0];
        JsonGenerator gen = new JsonGenerator();

        if ("index".equals(mode)) {
            gen.generateIndex();
        } else if ("schools".equals(mode)) {
            gen.generateSchools();
        } else if ("cities".equals(mode)) {
            gen.generateCities();
        } else if (Set.of("4", "7", "10", "12").contains(mode)) {
            gen.generate(mode);
        } else {
            System.err.println("Invalid argument: " + mode + ". Expected: index, schools, cities, 4, 7, 10, or 12");
            System.exit(1);
        }
    }

    private void generateIndex() throws Exception {
        Path outputDir = Path.of(OUTPUT_BASE);
        Files.createDirectories(outputDir);

        // Generate index.json
        JsonObject root = new JsonObject();
        JsonArray gradesArr = new JsonArray();
        for (String[] g : GRADES) {
            JsonObject gObj = new JsonObject();
            gObj.addProperty("grade", Integer.parseInt(g[0]));
            gObj.addProperty("label", g[1]);
            gObj.add("yearsRange", buildYearsRange());
            gObj.addProperty("scaleMin", Integer.parseInt(g[2]));
            gObj.addProperty("scaleMax", Integer.parseInt(g[3]));
            gObj.addProperty("dataUrl", g[0] + "/data.json");
            gradesArr.add(gObj);
        }
        root.add("grades", gradesArr);
        root.addProperty("schoolsUrl", "schools.json");
        root.addProperty("citiesUrl", "cities.json");
        root.addProperty("rankingsPath", "rankings/");

        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        Files.writeString(outputDir.resolve("index.json"), gson.toJson(root) + "\n");
        System.out.println("Generated: " + outputDir.resolve("index.json"));

        // Generate index.html
        Files.writeString(outputDir.resolve("index.html"), buildIndexHtml());
        System.out.println("Generated: " + outputDir.resolve("index.html"));
    }

    private String buildIndexHtml() {
        StringBuilder sb = new StringBuilder();
        sb.append("""
                <!DOCTYPE html>
                <html lang="bg">
                <head>
                  <meta charset="utf-8">
                  <title>НВО API v1</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <link rel="stylesheet" href="../../css/normalize.css">
                  <link rel="stylesheet" href="../../css/custom.css">
                  <link rel="icon" type="image/png" href="../../images/favicon-7.png">
                  <script>
                    (function() {
                      var saved = localStorage.getItem('nvo-theme');
                      if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        saved = 'dark';
                      }
                      if (saved === 'dark') {
                        document.documentElement.setAttribute('data-theme', 'dark');
                      }
                    })();
                  </script>
                  <script src="../../js/theme.js" defer></script>
                  <style>
                    .api-header { margin: 2rem 0 1.5rem; }
                    .api-header h2 { margin: 0 0 0.25rem; }
                    .api-header p { color: var(--text-muted); margin: 0; }
                    .api-base { font-family: var(--font-mono); font-size: 0.85rem; background: var(--bg-surface);
                      border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.75rem 1rem;
                      margin-bottom: 1.5rem; color: var(--text-muted); }
                    .api-base code { color: var(--text-color); }
                    .endpoint { background: var(--bg-surface); border: 1px solid var(--border-color);
                      border-radius: var(--radius-md); margin-bottom: 1rem; overflow: hidden; }
                    .endpoint-header { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem;
                      cursor: pointer; user-select: none; }
                    .endpoint-header:hover { background: var(--bg-hover, var(--border-light)); }
                    .method { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700;
                      padding: 0.2rem 0.5rem; border-radius: 4px; color: #fff; background: #22c55e; flex-shrink: 0; }
                    .path { font-family: var(--font-mono); font-size: 0.9rem; color: var(--text-color); text-decoration: none; }
                    a.path:hover { text-decoration: underline; }
                    .path-param { color: var(--primary); }
                    .endpoint-desc { color: var(--text-muted); font-size: 0.85rem; margin-left: auto; }
                    .endpoint-body { display: none; border-top: 1px solid var(--border-color); padding: 1rem; }
                    .endpoint.open .endpoint-body { display: block; }
                    .try-it { margin-top: 0.75rem; padding: 0.75rem; background: var(--border-light);
                      border-radius: var(--radius-sm); display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem 0; }
                    .try-it label { font-size: 0.8rem; font-weight: 600; margin-right: 0.35rem; }
                    .try-it select { font-size: 0.8rem; padding: 0.25rem 0.4rem; border: 1px solid var(--border-color);
                      border-radius: 4px; background: var(--bg-color); color: var(--text-color); margin-right: 0.75rem;
                      max-width: 12rem; text-overflow: ellipsis; }
                    .try-it > div { flex-basis: 100%; }
                    .try-it .try-link { display: inline-block; margin-top: 0.5rem; font-family: var(--font-mono);
                      font-size: 0.85rem; }
                    .endpoint.open .endpoint-arrow { transform: rotate(90deg); }
                    .endpoint-arrow { color: var(--text-light); transition: transform 0.15s; font-size: 0.8rem; }
                    .schema-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 0.5rem; }
                    .schema-table th { text-align: left; padding: 0.4rem 0.75rem; background: var(--border-light);
                      font-weight: 600; border-bottom: 1px solid var(--border-color); }
                    .schema-table td { padding: 0.4rem 0.75rem; border-bottom: 1px solid var(--border-light); }
                    .schema-table .type { font-family: var(--font-mono); font-size: 0.8rem; color: var(--primary); }
                    pre.example { background: var(--border-light); border-radius: var(--radius-sm); padding: 0.75rem 1rem;
                      font-size: 0.8rem; overflow-x: auto; margin: 0.75rem 0 0; line-height: 1.5; }
                    .section-label { font-weight: 600; font-size: 0.9rem; margin: 0.75rem 0 0.25rem; }
                    .grade-endpoints { margin-top: 0.5rem; }
                    .grade-endpoints h4 { margin: 1.5rem 0 0.75rem; padding-bottom: 0.4rem;
                      border-bottom: 1px solid var(--border-color); }
                    html { overflow-y: scroll; }
                    .back-link { margin-top: 2rem; display: inline-block; }
                    @media (max-width: 640px) {
                      .endpoint-desc { display: none; }
                      .endpoint-header { gap: 0.5rem; }
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="row">
                      <a class="back-link" href="../../7/">&larr; Обратно</a>
                    </div>
                    <div class="api-header">
                      <h2>НВО &amp; ДЗИ API</h2>
                      <p>Публично JSON API с резултати от НВО и ДЗИ (2018&ndash;""");
        sb.append(LAST_YEAR);
        sb.append("""
                )</p>
                    </div>
                    <div class="api-base">Base URL: <code>https://ivandavidov.github.io/nvo/api/v1</code></div>

                    <h4 style="margin-bottom:0.75rem">Общи</h4>
                """);

        // Index endpoint
        sb.append(endpointCard(
                "/index.json",
                "index.json",
                "Списък на наличните класове с метаданни",
                """
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>grades</td><td class="type">array</td><td>Масив с обекти за всеки клас</td></tr>
                          <tr><td>grades[].grade</td><td class="type">number</td><td>Клас (4, 7, 10, 12)</td></tr>
                          <tr><td>grades[].label</td><td class="type">string</td><td>Четимо име</td></tr>
                          <tr><td>grades[].yearsRange</td><td class="type">array</td><td>Масив с години с данни</td></tr>
                          <tr><td>grades[].scaleMin</td><td class="type">number</td><td>Минимална стойност на скалата</td></tr>
                          <tr><td>grades[].scaleMax</td><td class="type">number</td><td>Максимална стойност на скалата</td></tr>
                          <tr><td>grades[].dataUrl</td><td class="type">string</td><td>Относителен път до пълните данни</td></tr>
                        </table>"""));

        // Schools endpoints
        sb.append("      <h4 style=\"margin-top:1.5rem\">Справочник</h4>\n");

        sb.append(endpointCard(
                "/schools.json",
                "schools.json",
                "Всички училища с метаданни",
                """
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>schools</td><td class="type">object</td><td>Училища (ключ = код)</td></tr>
                          <tr><td>schools.*.shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>schools.*.fullName</td><td class="type">string</td><td>Пълно име на училището</td></tr>
                          <tr><td>schools.*.website</td><td class="type">string|null</td><td>Уебсайт (null ако няма)</td></tr>
                          <tr><td>schools.*.isPrivate</td><td class="type">boolean</td><td>Частно училище</td></tr>
                        </table>"""));

        sb.append(endpointCardNoLink(
                "/schools/{code}.json",
                "Метаданни за конкретно училище",
                """
                        <div class="try-it">
                          <label>Код:</label>
                          <input id="lookup-code" type="text" placeholder="напр. 2204091"
                            style="font-size:0.8rem;padding:0.25rem 0.4rem;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-color);color:var(--text-color);width:8rem"
                            oninput="updateLookupLink()">
                          <div><a class="try-link" id="lookup-link" style="display:none"></a></div>
                        </div>
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>code</td><td class="type">string</td><td>Код на училището</td></tr>
                          <tr><td>shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>fullName</td><td class="type">string</td><td>Пълно име на училището</td></tr>
                          <tr><td>website</td><td class="type">string|null</td><td>Уебсайт (null ако няма)</td></tr>
                          <tr><td>isPrivate</td><td class="type">boolean</td><td>Частно училище</td></tr>
                        </table>"""));

        sb.append(endpointCard(
                "/cities.json",
                "cities.json",
                "Всички градове",
                """
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>cities</td><td class="type">object</td><td>Градове (ключ = slug, латиница)</td></tr>
                          <tr><td>cities.*.fullName</td><td class="type">string</td><td>Пълно име</td></tr>
                          <tr><td>cities.*.shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>cities.*.orderPosition</td><td class="type">number</td><td>Група (1=главен, 2=областен, 3=друг)</td></tr>
                        </table>"""));

        sb.append(endpointCardNoLink(
                "/cities/{slug}.json",
                "Метаданни за конкретен град",
                """
                        <div class="try-it">
                          <label>Град:</label>
                          <select id="lookup-city" onchange="updateCityLookupLink()">
                            <option value="">—</option>
                          </select>
                          <div><a class="try-link" id="city-lookup-link" style="display:none"></a></div>
                        </div>
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>slug</td><td class="type">string</td><td>Slug на града (латиница)</td></tr>
                          <tr><td>fullName</td><td class="type">string</td><td>Пълно име</td></tr>
                          <tr><td>shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>orderPosition</td><td class="type">number</td><td>Група (1=главен, 2=областен, 3=друг)</td></tr>
                        </table>"""));

        // Per-grade endpoints
        sb.append("    <div class=\"grade-endpoints\">\n");
        sb.append("      <h4>По клас</h4>\n");

        for (String[] g : GRADES) {
            String grade = g[0];
            String label = g[1];
            String scaleRange = g[2] + "&ndash;" + g[3];

            sb.append(endpointCard(
                    "/" + grade + "/data.json",
                    grade + "/data.json",
                    label + " &mdash; всички градове и училища",
                    """
                            <p class="section-label">Отговор</p>
                            <table class="schema-table">
                              <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                              <tr><td>grade</td><td class="type">number</td><td>Клас</td></tr>
                              <tr><td>yearsRange</td><td class="type">array</td><td>Масив с години с данни</td></tr>
                              <tr><td>cities</td><td class="type">object</td><td>Градове (ключ = hrefName, латиница)</td></tr>
                              <tr><td>cities.*.fullName</td><td class="type">string</td><td>Пълно име на града</td></tr>
                              <tr><td>cities.*.shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                              <tr><td>cities.*.schools</td><td class="type">object</td><td>Училища (ключ = код)</td></tr>
                              <tr><td>schools.*.fullName</td><td class="type">string</td><td>Пълно име на училището</td></tr>
                              <tr><td>schools.*.shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                              <tr><td>schools.*.isPrivate</td><td class="type">boolean</td><td>Частно училище</td></tr>
                              <tr><td>schools.*.belScore</td><td class="type">array</td><td>Резултати БЕЛ ("""
                            + scaleRange + ", null = няма данни)</td></tr>\n"
                            + "          <tr><td>schools.*.matScore</td><td class=\"type\">array</td><td>Резултати МАТ ("
                            + scaleRange + ", null = няма данни)</td></tr>\n"
                            + """
                              <tr><td>schools.*.belStudents</td><td class="type">array</td><td>Брой ученици БЕЛ</td></tr>
                              <tr><td>schools.*.matStudents</td><td class="type">array</td><td>Брой ученици МАТ</td></tr>
                            </table>"""));
        }

        sb.append("      <h4>По град</h4>\n");

        sb.append(endpointCardNoLink(
                "/{grade}/{city}/data.json",
                "Данни за конкретен град",
                """
                        <div class="try-it">
                          <label>Клас:</label>
                          <select id="city-grade" onchange="updateCityDropdown()">
                            <option value="">—</option>
                          </select>
                          <label>Град:</label>
                          <select id="city-city" onchange="updateCityLink()">
                            <option value="">—</option>
                          </select>
                          <div><a class="try-link" id="city-link" style="display:none"></a></div>
                        </div>
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>grade</td><td class="type">number</td><td>Клас</td></tr>
                          <tr><td>yearsRange</td><td class="type">array</td><td>Масив с години с данни</td></tr>
                          <tr><td>cities</td><td class="type">object</td><td>Съдържа само избрания град (ключ = hrefName)</td></tr>
                          <tr><td>cities.*.fullName</td><td class="type">string</td><td>Пълно име на града</td></tr>
                          <tr><td>cities.*.shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>cities.*.schools</td><td class="type">object</td><td>Училища (ключ = код)</td></tr>
                          <tr><td>schools.*.fullName</td><td class="type">string</td><td>Пълно име на училището</td></tr>
                          <tr><td>schools.*.shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>schools.*.isPrivate</td><td class="type">boolean</td><td>Частно училище</td></tr>
                          <tr><td>schools.*.belScore</td><td class="type">array</td><td>Резултати БЕЛ (null = няма данни)</td></tr>
                          <tr><td>schools.*.matScore</td><td class="type">array</td><td>Резултати МАТ (null = няма данни)</td></tr>
                          <tr><td>schools.*.belStudents</td><td class="type">array</td><td>Брой ученици БЕЛ</td></tr>
                          <tr><td>schools.*.matStudents</td><td class="type">array</td><td>Брой ученици МАТ</td></tr>
                        </table>"""));

        sb.append(endpointCardNoLink(
                "/{grade}/{city}/{code}.json",
                "Данни за конкретно училище",
                """
                        <div class="try-it">
                          <label>Клас:</label>
                          <select id="school-grade" onchange="updateSchoolCityDropdown()">
                            <option value="">—</option>
                          </select>
                          <label>Град:</label>
                          <select id="school-city" onchange="updateSchoolCodeDropdown()">
                            <option value="">—</option>
                          </select>
                          <label>Училище:</label>
                          <select id="school-code" onchange="updateSchoolLink()">
                            <option value="">—</option>
                          </select>
                          <div><a class="try-link" id="school-link" style="display:none"></a></div>
                        </div>
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>grade</td><td class="type">number</td><td>Клас</td></tr>
                          <tr><td>yearsRange</td><td class="type">array</td><td>Масив с години с данни</td></tr>
                          <tr><td>cities</td><td class="type">object</td><td>Съдържа само избрания град с едно училище</td></tr>
                          <tr><td>cities.*.fullName</td><td class="type">string</td><td>Пълно име на града</td></tr>
                          <tr><td>cities.*.shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>cities.*.schools</td><td class="type">object</td><td>Едно училище (ключ = код)</td></tr>
                          <tr><td>schools.*.fullName</td><td class="type">string</td><td>Пълно име на училището</td></tr>
                          <tr><td>schools.*.shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>schools.*.isPrivate</td><td class="type">boolean</td><td>Частно училище</td></tr>
                          <tr><td>schools.*.belScore</td><td class="type">array</td><td>Резултати БЕЛ (null = няма данни)</td></tr>
                          <tr><td>schools.*.matScore</td><td class="type">array</td><td>Резултати МАТ (null = няма данни)</td></tr>
                          <tr><td>schools.*.belStudents</td><td class="type">array</td><td>Брой ученици БЕЛ</td></tr>
                          <tr><td>schools.*.matStudents</td><td class="type">array</td><td>Брой ученици МАТ</td></tr>
                        </table>"""));

        sb.append("    </div>\n");

        // Rankings section
        sb.append("    <div class=\"grade-endpoints\">\n");
        sb.append("      <h4>Класации</h4>\n");

        sb.append(endpointCardNoLink(
                "/rankings/median/{grade}/{year}.json",
                "Класация по медиана (3-годишен прозорец)",
                """
                        <div class="try-it">
                          <label>Клас:</label>
                          <select id="rank-med-grade" onchange="updateRankMedLink()">
                            <option value="">—</option>
                          </select>
                          <label>Крайна година:</label>
                          <select id="rank-med-year" onchange="updateRankMedLink()">
                            <option value="">—</option>
                          </select>
                          <div><a class="try-link" id="rank-med-link" style="display:none"></a></div>
                        </div>
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>grade</td><td class="type">number</td><td>Клас</td></tr>
                          <tr><td>type</td><td class="type">string</td><td>"median"</td></tr>
                          <tr><td>medianYears</td><td class="type">number</td><td>Брой години за медианата</td></tr>
                          <tr><td>endYear</td><td class="type">number</td><td>Крайна година на прозореца за изчисление на медианата</td></tr>
                          <tr><td>schools[]</td><td class="type">array</td><td>Сортиран списък с училища</td></tr>
                          <tr><td>schools[].rank</td><td class="type">number</td><td>Позиция в класацията</td></tr>
                          <tr><td>schools[].adjustedRank</td><td class="type">number|null</td><td>Позиция с изключените училища без данни за последната година</td></tr>
                          <tr><td>schools[].code</td><td class="type">string</td><td>Код на училището</td></tr>
                          <tr><td>schools[].cities</td><td class="type">array</td><td>Slug-ове на градовете (някои училища се водят на повече от едно място)</td></tr>
                          <tr><td>schools[].shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>schools[].fullName</td><td class="type">string</td><td>Пълно име</td></tr>
                          <tr><td>schools[].isPrivate</td><td class="type">boolean</td><td>Частно училище</td></tr>
                          <tr><td>schools[].belMedian</td><td class="type">number</td><td>Медиана БЕЛ</td></tr>
                          <tr><td>schools[].matMedian</td><td class="type">number</td><td>Медиана МАТ</td></tr>
                          <tr><td>schools[].score</td><td class="type">number</td><td>Общ резултат (БЕЛ + МАТ)/2</td></tr>
                        </table>"""));

        sb.append(endpointCardNoLink(
                "/rankings/{grade}/{year}.json",
                "Класация за конкретна година",
                """
                        <div class="try-it">
                          <label>Клас:</label>
                          <select id="rank-year-grade" onchange="updateRankYearLink()">
                            <option value="">—</option>
                          </select>
                          <label>Година:</label>
                          <select id="rank-year-year" onchange="updateRankYearLink()">
                            <option value="">—</option>
                          </select>
                          <div><a class="try-link" id="rank-year-link" style="display:none"></a></div>
                        </div>
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>grade</td><td class="type">number</td><td>Клас</td></tr>
                          <tr><td>type</td><td class="type">string</td><td>"year"</td></tr>
                          <tr><td>year</td><td class="type">number</td><td>Година</td></tr>
                          <tr><td>schools[]</td><td class="type">array</td><td>Сортиран списък с училища</td></tr>
                          <tr><td>schools[].rank</td><td class="type">number</td><td>Позиция в класацията</td></tr>
                          <tr><td>schools[].code</td><td class="type">string</td><td>Код на училището</td></tr>
                          <tr><td>schools[].cities</td><td class="type">array</td><td>Slug-ове на градовете (някои училища се водят на повече от едно място)</td></tr>
                          <tr><td>schools[].shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>schools[].fullName</td><td class="type">string</td><td>Пълно име</td></tr>
                          <tr><td>schools[].isPrivate</td><td class="type">boolean</td><td>Частно училище</td></tr>
                          <tr><td>schools[].belScore</td><td class="type">number</td><td>Резултат БЕЛ</td></tr>
                          <tr><td>schools[].matScore</td><td class="type">number</td><td>Резултат МАТ</td></tr>
                          <tr><td>schools[].score</td><td class="type">number</td><td>Общ резултат (БЕЛ + МАТ)/2</td></tr>
                        </table>"""));

        sb.append("    </div>\n");

        // Footer and script
        sb.append("""
                    <div style="margin:2rem 0;color:var(--text-light);font-size:0.8rem">
                      Данни: <a href="https://data.egov.bg" style="color:var(--text-muted)">data.egov.bg</a>
                    </div>
                  </div>
                  <script>
                    document.querySelectorAll('.endpoint-header').forEach(function(h) {
                      h.addEventListener('click', function() {
                        h.closest('.endpoint').classList.toggle('open');
                      });
                    });

                    var grades = [""" + "\"" + String.join("\", \"",
                java.util.Arrays.stream(GRADES).map(g -> g[0]).toArray(String[]::new)) + "\"" + """
                ];
                    var dataCache = {};

                    function populateGradeSelects() {
                      ['city-grade', 'school-grade', 'rank-med-grade', 'rank-year-grade'].forEach(function(id) {
                        var sel = document.getElementById(id);
                        grades.forEach(function(g) { var o = document.createElement('option'); o.value = g; o.textContent = g; sel.appendChild(o); });
                      });
                      ['rank-year-year'].forEach(function(id) {
                        var sel = document.getElementById(id);
                        for (var y = """ + LAST_YEAR + "; y >= " + FIRST_YEAR + """
                    ; y--) {
                          var o = document.createElement('option'); o.value = y; o.textContent = y; sel.appendChild(o);
                        }
                      });
                      ['rank-med-year'].forEach(function(id) {
                        var sel = document.getElementById(id);
                        for (var y = """ + LAST_YEAR + "; y >= 2020" + """
                    ; y--) {
                          var o = document.createElement('option'); o.value = y; o.textContent = y; sel.appendChild(o);
                        }
                      });
                    }
                    populateGradeSelects();

                    var FEATURED = ['София', 'Пловдив', 'Варна', 'Бургас'];
                    var OBLAST = [
                      'Благоевград', 'Бургас', 'Варна', 'Велико Търново', 'Видин', 'Враца', 'Габрово',
                      'Добрич', 'Кърджали', 'Кюстендил', 'Ловеч', 'Монтана', 'Пазарджик', 'Перник',
                      'Плевен', 'Пловдив', 'Разград', 'Русе', 'Силистра', 'Сливен', 'Смолян', 'София',
                      'Стара Загора', 'Търговище', 'Хасково', 'Шумен', 'Ямбол'
                    ];

                    function fetchGradeData(grade, cb) {
                      if (dataCache[grade]) return cb(dataCache[grade]);
                      fetch(grade + '/data.json').then(function(r) { return r.json(); }).then(function(d) {
                        dataCache[grade] = d; cb(d);
                      });
                    }

                    function resetSelect(sel, placeholder) {
                      sel.innerHTML = '<option value="">— ' + placeholder + ' —</option>';
                    }

                    function addSeparator(sel) {
                      var o = document.createElement('option');
                      o.disabled = true; o.textContent = '────';
                      sel.appendChild(o);
                    }

                    function populateCitySelect(sel, cities) {
                      var keys = Object.keys(cities);
                      var featured = [], oblast = [], other = [];
                      keys.forEach(function(key) {
                        var name = cities[key].fullName;
                        if (FEATURED.indexOf(name) >= 0) featured.push(key);
                        else if (OBLAST.indexOf(name) >= 0) oblast.push(key);
                        else other.push(key);
                      });
                      featured.sort(function(a, b) { return FEATURED.indexOf(cities[a].fullName) - FEATURED.indexOf(cities[b].fullName); });
                      var coll = new Intl.Collator('bg');
                      oblast.sort(function(a, b) { return coll.compare(cities[a].fullName, cities[b].fullName); });
                      other.sort(function(a, b) { return coll.compare(cities[a].fullName, cities[b].fullName); });
                      function addGroup(arr) {
                        arr.forEach(function(key) {
                          var o = document.createElement('option');
                          o.value = key; o.textContent = cities[key].fullName;
                          sel.appendChild(o);
                        });
                      }
                      if (featured.length) { addGroup(featured); }
                      if (oblast.length) { addSeparator(sel); addGroup(oblast); }
                      if (other.length) { addSeparator(sel); addGroup(other); }
                    }

                    function updateCityDropdown() {
                      var grade = document.getElementById('city-grade').value;
                      var sel = document.getElementById('city-city');
                      resetSelect(sel, 'град');
                      document.getElementById('city-link').style.display = 'none';
                      if (!grade) return;
                      fetchGradeData(grade, function(d) { populateCitySelect(sel, d.cities); });
                    }

                    function updateCityLink() {
                      var grade = document.getElementById('city-grade').value;
                      var city = document.getElementById('city-city').value;
                      var link = document.getElementById('city-link');
                      if (!grade || !city) { link.style.display = 'none'; return; }
                      var href = grade + '/' + city + '/data.json';
                      link.href = href; link.textContent = href; link.style.display = 'inline-block';
                    }

                    function updateSchoolCityDropdown() {
                      var grade = document.getElementById('school-grade').value;
                      var sel = document.getElementById('school-city');
                      resetSelect(sel, 'град');
                      resetSelect(document.getElementById('school-code'), 'училище');
                      document.getElementById('school-link').style.display = 'none';
                      if (!grade) return;
                      fetchGradeData(grade, function(d) { populateCitySelect(sel, d.cities); });
                    }

                    function updateSchoolCodeDropdown() {
                      var grade = document.getElementById('school-grade').value;
                      var city = document.getElementById('school-city').value;
                      var sel = document.getElementById('school-code');
                      resetSelect(sel, 'училище');
                      document.getElementById('school-link').style.display = 'none';
                      if (!grade || !city) return;
                      fetchGradeData(grade, function(d) {
                        var schools = d.cities[city] && d.cities[city].schools;
                        if (!schools) return;
                        var coll = new Intl.Collator('bg');
                        Object.keys(schools).sort(function(a, b) {
                          return coll.compare(schools[a].shortName, schools[b].shortName);
                        }).forEach(function(code) {
                          var o = document.createElement('option');
                          o.value = code; o.textContent = schools[code].shortName;
                          sel.appendChild(o);
                        });
                      });
                    }

                    function updateLookupLink() {
                      var code = document.getElementById('lookup-code').value.trim();
                      var link = document.getElementById('lookup-link');
                      if (!code) { link.style.display = 'none'; return; }
                      var href = 'schools/' + code + '.json';
                      link.href = href; link.textContent = href; link.style.display = 'inline-block';
                    }

                    function updateCityLookupLink() {
                      var slug = document.getElementById('lookup-city').value;
                      var link = document.getElementById('city-lookup-link');
                      if (!slug) { link.style.display = 'none'; return; }
                      var href = 'cities/' + slug + '.json';
                      link.href = href; link.textContent = href; link.style.display = 'inline-block';
                    }

                    (function populateCityLookupSelect() {
                      fetch('cities.json').then(function(r) { return r.json(); }).then(function(d) {
                        var sel = document.getElementById('lookup-city');
                        var cities = d.cities;
                        var keys = Object.keys(cities);
                        var featured = [], oblast = [], other = [];
                        keys.forEach(function(slug) {
                          var pos = cities[slug].orderPosition;
                          if (pos === 1) featured.push(slug);
                          else if (pos === 2) oblast.push(slug);
                          else other.push(slug);
                        });
                        featured.sort(function(a, b) { return FEATURED.indexOf(cities[a].fullName) - FEATURED.indexOf(cities[b].fullName); });
                        var coll = new Intl.Collator('bg');
                        oblast.sort(function(a, b) { return coll.compare(cities[a].fullName, cities[b].fullName); });
                        other.sort(function(a, b) { return coll.compare(cities[a].fullName, cities[b].fullName); });
                        function addGroup(arr) {
                          arr.forEach(function(slug) {
                            var o = document.createElement('option');
                            o.value = slug; o.textContent = cities[slug].fullName;
                            sel.appendChild(o);
                          });
                        }
                        if (featured.length) { addGroup(featured); }
                        if (oblast.length) { addSeparator(sel); addGroup(oblast); }
                        if (other.length) { addSeparator(sel); addGroup(other); }
                      });
                    })();

                    function updateRankMedLink() {
                      var grade = document.getElementById('rank-med-grade').value;
                      var year = document.getElementById('rank-med-year').value;
                      var link = document.getElementById('rank-med-link');
                      if (!grade || !year) { link.style.display = 'none'; return; }
                      var href = 'rankings/median/' + grade + '/' + year + '.json';
                      link.href = href; link.textContent = href; link.style.display = 'inline-block';
                    }

                    function updateRankYearLink() {
                      var grade = document.getElementById('rank-year-grade').value;
                      var year = document.getElementById('rank-year-year').value;
                      var link = document.getElementById('rank-year-link');
                      if (!grade || !year) { link.style.display = 'none'; return; }
                      var href = 'rankings/' + grade + '/' + year + '.json';
                      link.href = href; link.textContent = href; link.style.display = 'inline-block';
                    }

                    function updateSchoolLink() {
                      var grade = document.getElementById('school-grade').value;
                      var city = document.getElementById('school-city').value;
                      var code = document.getElementById('school-code').value;
                      var link = document.getElementById('school-link');
                      if (!grade || !city || !code) { link.style.display = 'none'; return; }
                      var href = grade + '/' + city + '/' + code + '.json';
                      link.href = href; link.textContent = href; link.style.display = 'inline-block';
                    }
                  </script>
                </body>
                </html>
                """);

        return sb.toString();
    }

    private static String endpointCard(String path, String href, String desc, String body) {
        String coloredPath = path.replaceAll("\\{([^}]+)}", "<span class=\"path-param\">{$1}</span>");
        return "    <div class=\"endpoint\">\n"
                + "      <div class=\"endpoint-header\">\n"
                + "        <span class=\"endpoint-arrow\">&#9654;</span>\n"
                + "        <span class=\"method\">GET</span>\n"
                + "        <a class=\"path\" href=\"" + href + "\" onclick=\"event.stopPropagation()\">" + coloredPath + "</a>\n"
                + "        <span class=\"endpoint-desc\">" + desc + "</span>\n"
                + "      </div>\n"
                + "      <div class=\"endpoint-body\">\n"
                + body + "\n"
                + "      </div>\n"
                + "    </div>\n";
    }

    private static String endpointCardNoLink(String path, String desc, String body) {
        String coloredPath = path.replaceAll("\\{([^}]+)}", "<span class=\"path-param\">{$1}</span>");
        return "    <div class=\"endpoint\">\n"
                + "      <div class=\"endpoint-header\">\n"
                + "        <span class=\"endpoint-arrow\">&#9654;</span>\n"
                + "        <span class=\"method\">GET</span>\n"
                + "        <span class=\"path\">" + coloredPath + "</span>\n"
                + "        <span class=\"endpoint-desc\">" + desc + "</span>\n"
                + "      </div>\n"
                + "      <div class=\"endpoint-body\">\n"
                + body + "\n"
                + "      </div>\n"
                + "    </div>\n";
    }

    private void generateCities() throws Exception {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();

        JsonObject allCities = new JsonObject();
        Path citiesDir = Path.of(OUTPUT_BASE, "cities");
        cleanDirectory(citiesDir);

        for (Cities.City city : Cities.ORDERED) {
            String slug = city.hrefName();

            JsonObject cj = new JsonObject();
            cj.addProperty("fullName", city.fullName());
            cj.addProperty("shortName", city.shortName());
            cj.addProperty("orderPosition", city.orderPosition());
            allCities.add(slug, cj);

            // Write individual cities/{slug}.json
            JsonObject individual = new JsonObject();
            individual.addProperty("slug", slug);
            individual.addProperty("fullName", city.fullName());
            individual.addProperty("shortName", city.shortName());
            individual.addProperty("orderPosition", city.orderPosition());
            Files.writeString(citiesDir.resolve(slug + ".json"), gson.toJson(individual) + "\n");
        }

        // Write bulk cities.json
        JsonObject root = new JsonObject();
        root.add("cities", allCities);
        Files.writeString(Path.of(OUTPUT_BASE, "cities.json"), gson.toJson(root) + "\n");

        System.out.println("Generated: " + Path.of(OUTPUT_BASE, "cities.json")
                + " (" + Cities.ORDERED.size() + " cities)");
    }

    private void generateSchools() throws Exception {
        Gson gson = new GsonBuilder().setPrettyPrinting().serializeNulls().create();

        // Build bulk schools.json
        JsonObject allSchools = new JsonObject();
        Path schoolsDir = Path.of(OUTPUT_BASE, "schools");
        cleanDirectory(schoolsDir);

        School.schoolCodes.entrySet().stream()
                .sorted(java.util.Comparator.comparingInt(e -> Integer.parseInt(e.getKey())))
                .forEach(entry -> {
                    String code = entry.getKey();
                    String[] vals = entry.getValue();
                    // vals: [isPrivate, shortName, fullName] or [isPrivate, shortName, fullName, website]
                    boolean isPrivate = "1".equals(vals[0]);
                    String shortName = vals[1];
                    String fullName = vals[2];
                    String website = vals.length > 3 ? vals[3] : null;

                    JsonObject sj = new JsonObject();
                    sj.addProperty("shortName", shortName);
                    sj.addProperty("fullName", fullName);
                    if (website != null) {
                        sj.addProperty("website", website);
                    } else {
                        sj.add("website", JsonNull.INSTANCE);
                    }
                    sj.addProperty("isPrivate", isPrivate);
                    allSchools.add(code, sj);

                    // Write individual schools/{code}.json
                    try {
                        JsonObject individual = new JsonObject();
                        individual.addProperty("code", code);
                        individual.addProperty("shortName", shortName);
                        individual.addProperty("fullName", fullName);
                        if (website != null) {
                            individual.addProperty("website", website);
                        } else {
                            individual.add("website", JsonNull.INSTANCE);
                        }
                        individual.addProperty("isPrivate", isPrivate);
                        Files.writeString(schoolsDir.resolve(code + ".json"), gson.toJson(individual) + "\n");
                    } catch (Exception ex) {
                        throw new RuntimeException(ex);
                    }
                });

        // Write bulk schools.json
        JsonObject root = new JsonObject();
        root.add("schools", allSchools);
        Files.writeString(Path.of(OUTPUT_BASE, "schools.json"), gson.toJson(root) + "\n");

        System.out.println("Generated: " + Path.of(OUTPUT_BASE, "schools.json")
                + " (" + School.schoolCodes.size() + " schools)");
    }

    private void generate(String grade) throws Exception {
        String prefix = grade.equals("12") ? "dzi" : "nvo-" + grade;

        // city -> code -> SchoolData
        Map<String, Map<String, SchoolData>> citySchools = new HashMap<>();

        for (int yearIndex = 0; yearIndex < NUM_YEARS; yearIndex++) {
            int year = FIRST_YEAR + yearIndex;
            String filePath = NORMALIZED_PATH + prefix + "-" + year + "-normalized.csv";
            File file = new File(filePath);
            if (!file.exists()) {
                System.out.println("Warning: file not found: " + filePath);
                continue;
            }

            List<String> lines = Files.readAllLines(file.toPath());
            for (int i = 1; i < lines.size(); i++) {
                Record record = lineToRecord(lines.get(i));
                if (record == null) {
                    continue;
                }
                if (record.getSchool().startsWith("РУО")
                        || record.getSchool().startsWith("Регионално управление на образованието")) {
                    continue;
                }

                String code = School.fixedCodes.getOrDefault(record.getCode(), record.getCode());

                Map<String, SchoolData> schools = citySchools.computeIfAbsent(
                        record.getCity(), k -> new HashMap<>());
                SchoolData sd = schools.computeIfAbsent(code, k -> new SchoolData());
                sd.csvName = record.getSchool();

                sd.belScore[yearIndex] = record.getBelScore() != null && record.getBelScore() > 0
                        ? record.getBelScore() : null;
                sd.matScore[yearIndex] = record.getMatScore() != null && record.getMatScore() > 0
                        ? record.getMatScore() : null;
                sd.belStudents[yearIndex] = record.getBelStudents() != null && record.getBelStudents() > 0
                        ? record.getBelStudents() : null;
                sd.matStudents[yearIndex] = record.getMatStudents() != null && record.getMatStudents() > 0
                        ? record.getMatStudents() : null;
            }
        }

        Gson gson = new GsonBuilder()
                .setPrettyPrinting()
                .serializeNulls()
                .create();

        // Build JSON using Cities.ORDERED for consistent city ordering
        JsonObject root = new JsonObject();
        root.addProperty("grade", Integer.parseInt(grade));
        root.add("yearsRange", buildYearsRange());

        JsonObject citiesJson = new JsonObject();
        Path gradeDir = Path.of(OUTPUT_BASE, grade);
        cleanDirectory(gradeDir);

        for (Cities.City city : Cities.ORDERED) {
            Map<String, SchoolData> schools = citySchools.get(city.fullName());
            if (schools == null || schools.isEmpty()) {
                continue;
            }

            JsonObject cityJson = new JsonObject();
            cityJson.addProperty("fullName", city.fullName());
            cityJson.addProperty("shortName", city.shortName());

            JsonObject schoolsJson = new JsonObject();
            Path cityDir = gradeDir.resolve(city.hrefName());
            Files.createDirectories(cityDir);

            int gradeNum = Integer.parseInt(grade);

            schools.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(entry -> {
                        String code = entry.getKey();
                        SchoolData sd = entry.getValue();
                        JsonObject sj = buildSchoolJson(code, sd);
                        schoolsJson.add(code, sj);

                        // Write per-school file: {grade}/{hrefName}/{code}.json
                        // Same envelope as main data.json but with single city + single school
                        try {
                            JsonObject oneSchool = new JsonObject();
                            oneSchool.add(code, sj);
                            JsonObject oneCity = new JsonObject();
                            oneCity.addProperty("fullName", city.fullName());
                            oneCity.addProperty("shortName", city.shortName());
                            oneCity.add("schools", oneSchool);
                            JsonObject oneCities = new JsonObject();
                            oneCities.add(city.hrefName(), oneCity);
                            JsonObject schoolRoot = new JsonObject();
                            schoolRoot.addProperty("grade", gradeNum);
                            schoolRoot.add("yearsRange", buildYearsRange());
                            schoolRoot.add("cities", oneCities);
                            Files.writeString(cityDir.resolve(code + ".json"),
                                    collapseArrays(gson.toJson(schoolRoot)) + "\n");
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    });

            cityJson.add("schools", schoolsJson);
            citiesJson.add(city.hrefName(), cityJson);

            // Write per-city file: {grade}/{hrefName}/data.json
            // Same envelope as main data.json but with single city
            JsonObject oneCities = new JsonObject();
            oneCities.add(city.hrefName(), cityJson);
            JsonObject cityRoot = new JsonObject();
            cityRoot.addProperty("grade", gradeNum);
            cityRoot.add("yearsRange", buildYearsRange());
            cityRoot.add("cities", oneCities);
            String cityJsonStr = collapseArrays(gson.toJson(cityRoot));
            Files.writeString(cityDir.resolve("data.json"), cityJsonStr + "\n");
        }

        root.add("cities", citiesJson);

        // Write main output: {grade}/data.json
        Path outputFile = gradeDir.resolve("data.json");
        String json = collapseArrays(gson.toJson(root));
        Files.writeString(outputFile, json + "\n");

        System.out.println("Generated: " + outputFile);

        // Generate rankings
        generateRankings(grade, citySchools, gson);
    }

    private static void generateRankings(String grade, Map<String, Map<String, SchoolData>> citySchools, Gson gson) throws Exception {
        // Build reverse map: code -> list of city slugs (ordered by Cities.ORDERED)
        // Schools appearing in multiple cities (e.g. both Sofia and Novi Iskar) get all slugs
        Map<String, List<String>> codeToCitySlugs = new LinkedHashMap<>();
        for (Cities.City city : Cities.ORDERED) {
            Map<String, SchoolData> schools = citySchools.get(city.fullName());
            if (schools == null) continue;
            for (String code : schools.keySet()) {
                codeToCitySlugs.computeIfAbsent(code, k -> new ArrayList<>()).add(city.hrefName());
            }
        }

        // Collect all schools with their data, deduplicated by code
        Map<String, RankedSchool> seenSchools = new LinkedHashMap<>();
        for (Cities.City city : Cities.ORDERED) {
            Map<String, SchoolData> schools = citySchools.get(city.fullName());
            if (schools == null) continue;
            for (Map.Entry<String, SchoolData> schoolEntry : schools.entrySet()) {
                String code = schoolEntry.getKey();
                if (seenSchools.containsKey(code)) continue; // already added from first city
                SchoolData sd = schoolEntry.getValue();
                String[] overrides = School.schoolCodes.get(code);
                String fullName = overrides != null ? overrides[2] : sd.csvName;
                String shortName = overrides != null ? overrides[1] : sd.csvName;
                boolean isPrivate = overrides != null && "1".equals(overrides[0]);
                List<String> citySlugs = codeToCitySlugs.getOrDefault(code, List.of());

                seenSchools.put(code, new RankedSchool(code, citySlugs, shortName, fullName, isPrivate, sd));
            }
        }
        List<RankedSchool> allSchools = new ArrayList<>(seenSchools.values());

        Path rankingsDir = Path.of(OUTPUT_BASE, "rankings", grade);
        cleanDirectory(rankingsDir);

        // Per-year rankings
        for (int yearIndex = 0; yearIndex < NUM_YEARS; yearIndex++) {
            int year = FIRST_YEAR + yearIndex;
            final int yi = yearIndex;

            List<RankedSchool> yearSchools = allSchools.stream()
                    .filter(rs -> rs.sd.belScore[yi] != null && rs.sd.matScore[yi] != null)
                    .sorted(Comparator.comparingDouble((RankedSchool rs) ->
                            (rs.sd.belScore[yi] + rs.sd.matScore[yi]) / 2.0).reversed())
                    .toList();

            if (yearSchools.isEmpty()) continue;

            JsonObject yearRoot = new JsonObject();
            yearRoot.addProperty("grade", Integer.parseInt(grade));
            yearRoot.addProperty("type", "year");
            yearRoot.addProperty("year", year);
            JsonArray arr = new JsonArray();
            int rank = 0;
            for (RankedSchool rs : yearSchools) {
                rank++;
                double bel = rs.sd.belScore[yi];
                double mat = rs.sd.matScore[yi];
                JsonObject entry = new JsonObject();
                entry.addProperty("rank", rank);
                entry.addProperty("code", rs.code);
                JsonArray citiesArr = new JsonArray();
                rs.citySlugs.forEach(citiesArr::add);
                entry.add("cities", citiesArr);
                entry.addProperty("shortName", rs.shortName);
                entry.addProperty("fullName", rs.fullName);
                entry.addProperty("isPrivate", rs.isPrivate);
                entry.addProperty("belScore", roundTo2(bel));
                entry.addProperty("matScore", roundTo2(mat));
                entry.addProperty("score", roundTo2((bel + mat) / 2.0));
                arr.add(entry);
            }
            yearRoot.add("schools", arr);
            Files.writeString(rankingsDir.resolve(year + ".json"), collapseArrays(gson.toJson(yearRoot)) + "\n");
        }

        // Median-based rankings: rankings/median/{grade}/{endYear}.json
        // Generated from 2020 onwards, each using a 3-year window ending at endYear
        int medianYears = 3;
        int medianStartYear = 2020;
        Path medianDir = Path.of(OUTPUT_BASE, "rankings", "median", grade);
        cleanDirectory(medianDir);
        int medianFileCount = 0;

        for (int endYear = medianStartYear; endYear <= LAST_YEAR; endYear++) {
            int endYearIndex = endYear - FIRST_YEAR;

            List<double[]> medianList = new ArrayList<>();
            List<RankedSchool> medianSchools = new ArrayList<>();

            for (RankedSchool rs : allSchools) {
                double belSum = 0, matSum = 0;
                int belCount = 0, matCount = 0;
                for (int i = 0; i < medianYears; i++) {
                    int idx = endYearIndex - i;
                    if (idx >= 0 && rs.sd.belScore[idx] != null) {
                        belSum += rs.sd.belScore[idx];
                        belCount++;
                    }
                    if (idx >= 0 && rs.sd.matScore[idx] != null) {
                        matSum += rs.sd.matScore[idx];
                        matCount++;
                    }
                }
                if (belCount == 0 || matCount == 0) continue;
                double belMedian = belSum / belCount;
                double matMedian = matSum / matCount;
                medianList.add(new double[]{belMedian, matMedian});
                medianSchools.add(rs);
            }

            // Sort by combined score descending
            Integer[] indices = new Integer[medianSchools.size()];
            for (int i = 0; i < indices.length; i++) indices[i] = i;
            java.util.Arrays.sort(indices, Comparator.comparingDouble((Integer i) ->
                    (medianList.get(i)[0] + medianList.get(i)[1]) / 2.0).reversed());

            JsonObject medianRoot = new JsonObject();
            medianRoot.addProperty("grade", Integer.parseInt(grade));
            medianRoot.addProperty("type", "median");
            medianRoot.addProperty("medianYears", medianYears);
            medianRoot.addProperty("endYear", endYear);
            JsonArray medArr = new JsonArray();
            int rank = 0;
            int adjustedRank = 0;
            for (int idx : indices) {
                rank++;
                RankedSchool rs = medianSchools.get(idx);
                double bel = medianList.get(idx)[0];
                double mat = medianList.get(idx)[1];

                // adjustedRank: only schools with both BEL and MAT data for endYear
                boolean hasEndYearData = rs.sd.belScore[endYearIndex] != null
                        && rs.sd.matScore[endYearIndex] != null;

                JsonObject entry = new JsonObject();
                entry.addProperty("rank", rank);
                if (hasEndYearData) {
                    adjustedRank++;
                    entry.addProperty("adjustedRank", adjustedRank);
                } else {
                    entry.add("adjustedRank", JsonNull.INSTANCE);
                }
                entry.addProperty("code", rs.code);
                JsonArray citiesArr = new JsonArray();
                rs.citySlugs.forEach(citiesArr::add);
                entry.add("cities", citiesArr);
                entry.addProperty("shortName", rs.shortName);
                entry.addProperty("fullName", rs.fullName);
                entry.addProperty("isPrivate", rs.isPrivate);
                entry.addProperty("belMedian", roundTo2(bel));
                entry.addProperty("matMedian", roundTo2(mat));
                entry.addProperty("score", roundTo2((bel + mat) / 2.0));
                medArr.add(entry);
            }
            medianRoot.add("schools", medArr);
            Files.writeString(medianDir.resolve(endYear + ".json"), collapseArrays(gson.toJson(medianRoot)) + "\n");
            medianFileCount++;
        }

        System.out.println("Generated rankings for grade " + grade + ": "
                + medianFileCount + " median files, " + NUM_YEARS + " year files");
    }

    private static double roundTo2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record RankedSchool(String code, List<String> citySlugs, String shortName, String fullName,
                                boolean isPrivate, SchoolData sd) {}

    private static JsonObject buildSchoolJson(String code, SchoolData sd) {
        String[] overrides = School.schoolCodes.get(code);
        JsonObject sj = new JsonObject();
        sj.addProperty("fullName", overrides != null ? overrides[2] : sd.csvName);
        sj.addProperty("shortName", overrides != null ? overrides[1] : sd.csvName);
        sj.addProperty("isPrivate", overrides != null && "1".equals(overrides[0]));
        sj.add("belScore", toDoubleArray(sd.belScore));
        sj.add("matScore", toDoubleArray(sd.matScore));
        sj.add("belStudents", toIntArray(sd.belStudents));
        sj.add("matStudents", toIntArray(sd.matStudents));
        return sj;
    }

    private static String collapseArrays(String json) {
        StringBuilder sb = new StringBuilder(json.length());
        int i = 0;
        while (i < json.length()) {
            if (json.charAt(i) == '[') {
                // Scan ahead to find matching ] and check if array is simple
                int start = i;
                int depth = 1;
                int j = i + 1;
                boolean simple = true;
                while (j < json.length() && depth > 0) {
                    char c = json.charAt(j);
                    if (c == '[' || c == '{') {
                        simple = false;
                        depth++;
                    } else if (c == ']' || c == '}') {
                        depth--;
                    }
                    j++;
                }
                if (simple) {
                    // Simple array (no nested objects/arrays) — collapse to one line
                    String arr = json.substring(start, j);
                    arr = arr.replaceAll("\\s*\n\\s*", " ");
                    sb.append(arr);
                    i = j;
                } else {
                    // Complex array — just emit '[' and continue scanning inside
                    // so that inner simple arrays get collapsed too
                    sb.append('[');
                    i++;
                }
            } else {
                sb.append(json.charAt(i));
                i++;
            }
        }
        return sb.toString();
    }

    /**
     * Recursively deletes all contents of a directory, then recreates it empty.
     * If the directory does not exist, it is created.
     */
    private static void cleanDirectory(Path dir) throws Exception {
        if (Files.exists(dir)) {
            try (var walk = Files.walk(dir)) {
                walk.sorted(Comparator.reverseOrder())
                        .forEach(p -> {
                            try {
                                Files.delete(p);
                            } catch (Exception e) {
                                throw new RuntimeException(e);
                            }
                        });
            }
        }
        Files.createDirectories(dir);
    }

    private static JsonArray toDoubleArray(Double[] values) {
        JsonArray arr = new JsonArray();
        for (Double v : values) {
            if (v == null) {
                arr.add(JsonNull.INSTANCE);
            } else {
                arr.add(v);
            }
        }
        return arr;
    }

    private static JsonArray buildYearsRange() {
        JsonArray arr = new JsonArray();
        for (int y = FIRST_YEAR; y <= LAST_YEAR; y++) arr.add(y);
        return arr;
    }

    private static JsonArray toIntArray(Integer[] values) {
        JsonArray arr = new JsonArray();
        for (Integer v : values) {
            if (v == null) {
                arr.add(JsonNull.INSTANCE);
            } else {
                arr.add(v);
            }
        }
        return arr;
    }

    private Record lineToRecord(String line) {
        try {
            line = normalizeLine(line);
            String[] entries = line.split("\\|");
            String city = entries[0].replaceAll("\"", "");
            String code = entries[1].replaceAll("\"", "");
            String school = entries[2].replaceAll("\"", "");
            String belScore = entries[3].replaceAll("\"", "").trim();
            String matScore = entries[4].replaceAll("\"", "").trim();
            String belStudents = entries[5].replaceAll("\"", "").trim();
            String matStudents = entries[6].replaceAll("\"", "").trim();

            Record r = new Record();
            r.setCity(city);
            r.setCode(code);
            r.setSchool(school);
            r.setBelScore(belScore.isEmpty() ? 0.0 : Double.valueOf(belScore));
            r.setMatScore(matScore.isEmpty() ? 0.0 : Double.valueOf(matScore));
            r.setBelStudents(belStudents.isEmpty() ? 0 : Integer.valueOf(belStudents));
            r.setMatStudents(matStudents.isEmpty() ? 0 : Integer.valueOf(matStudents));
            return r;
        } catch (RuntimeException e) {
            System.err.println("Error parsing line: " + line);
            e.printStackTrace();
            return null;
        }
    }

    private String normalizeLine(String line) {
        line = line.replace(';', '|');
        StringBuilder sb = new StringBuilder(line.length());
        for (int i = 0; i < line.length(); i++) {
            if (line.charAt(i) == ',' && i > 0 && line.charAt(i - 1) == '"') {
                sb.append('|');
            } else {
                sb.append(line.charAt(i));
            }
        }
        return sb.toString();
    }

    private static class SchoolData {
        String csvName;
        Double[] belScore = new Double[NUM_YEARS];
        Double[] matScore = new Double[NUM_YEARS];
        Integer[] belStudents = new Integer[NUM_YEARS];
        Integer[] matStudents = new Integer[NUM_YEARS];
    }
}
