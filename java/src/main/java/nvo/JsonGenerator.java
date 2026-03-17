package nvo;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
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
            System.err.println("Expected argument: index, 4, 7, 10, or 12");
            System.exit(1);
        }

        String mode = args[0];
        JsonGenerator gen = new JsonGenerator();

        if ("index".equals(mode)) {
            gen.generateIndex();
        } else if (Set.of("4", "7", "10", "12").contains(mode)) {
            gen.generate(mode);
        } else {
            System.err.println("Invalid argument: " + mode + ". Expected: index, 4, 7, 10, or 12");
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
            gObj.addProperty("firstYear", FIRST_YEAR);
            gObj.addProperty("lastYear", LAST_YEAR);
            gObj.addProperty("scaleMin", Integer.parseInt(g[2]));
            gObj.addProperty("scaleMax", Integer.parseInt(g[3]));
            gObj.addProperty("dataUrl", g[0] + "/data.json");
            gradesArr.add(gObj);
        }
        root.add("grades", gradesArr);

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
                      <p>Публичен JSON API с резултати от НВО и ДЗИ (2018&ndash;""");
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
                          <tr><td>grades[].firstYear</td><td class="type">number</td><td>Първа година с данни</td></tr>
                          <tr><td>grades[].lastYear</td><td class="type">number</td><td>Последна година с данни</td></tr>
                          <tr><td>grades[].scaleMin</td><td class="type">number</td><td>Минимална стойност на скалата</td></tr>
                          <tr><td>grades[].scaleMax</td><td class="type">number</td><td>Максимална стойност на скалата</td></tr>
                          <tr><td>grades[].dataUrl</td><td class="type">string</td><td>Относителен път до пълните данни</td></tr>
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
                              <tr><td>firstYear</td><td class="type">number</td><td>Първа година</td></tr>
                              <tr><td>lastYear</td><td class="type">number</td><td>Последна година</td></tr>
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
                        <p style="font-size:0.85rem;color:var(--text-muted);margin:0.25rem 0 0">Същата структура като /{grade}/data.json, но cities съдържа само един град.</p>"""));

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
                        <p style="font-size:0.85rem;color:var(--text-muted);margin:0.25rem 0 0">Същата структура като /{grade}/data.json, но cities съдържа само един град с едно училище.</p>"""));

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
                      ['city-grade', 'school-grade'].forEach(function(id) {
                        var sel = document.getElementById(id);
                        grades.forEach(function(g) { var o = document.createElement('option'); o.value = g; o.textContent = g; sel.appendChild(o); });
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
        root.addProperty("firstYear", FIRST_YEAR);
        root.addProperty("lastYear", LAST_YEAR);

        JsonObject citiesJson = new JsonObject();
        Path gradeDir = Path.of(OUTPUT_BASE, grade);

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
                            schoolRoot.addProperty("firstYear", FIRST_YEAR);
                            schoolRoot.addProperty("lastYear", LAST_YEAR);
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
            cityRoot.addProperty("firstYear", FIRST_YEAR);
            cityRoot.addProperty("lastYear", LAST_YEAR);
            cityRoot.add("cities", oneCities);
            String cityJsonStr = collapseArrays(gson.toJson(cityRoot));
            Files.writeString(cityDir.resolve("data.json"), cityJsonStr + "\n");
        }

        root.add("cities", citiesJson);

        // Write main output: {grade}/data.json
        Files.createDirectories(gradeDir);
        Path outputFile = gradeDir.resolve("data.json");
        String json = collapseArrays(gson.toJson(root));
        Files.writeString(outputFile, json + "\n");

        System.out.println("Generated: " + outputFile);
    }

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
                int start = i;
                int depth = 1;
                i++;
                boolean simple = true;
                while (i < json.length() && depth > 0) {
                    char c = json.charAt(i);
                    if (c == '[' || c == '{') {
                        simple = false;
                        depth++;
                    } else if (c == ']') {
                        depth--;
                    } else if (c == '}') {
                        depth--;
                    }
                    i++;
                }
                if (simple) {
                    String arr = json.substring(start, i);
                    arr = arr.replaceAll("\\s*\n\\s*", " ");
                    sb.append(arr);
                } else {
                    sb.append(json, start, i);
                }
            } else {
                sb.append(json.charAt(i));
                i++;
            }
        }
        return sb.toString();
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
