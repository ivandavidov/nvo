package nvo.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.nio.file.Files;
import java.nio.file.Path;

import static nvo.api.JsonGenerator.*;

public class IndexGenerator {

    public void generate() throws Exception {
        Path outputDir = Path.of(OUTPUT_BASE);
        Files.createDirectories(outputDir);

        // Generate index.json
        JsonObject root = new JsonObject();
        JsonArray gradesArr = new JsonArray();
        for (String[] g : GRADES) {
            JsonObject gObj = new JsonObject();
            gObj.addProperty("grade", Integer.parseInt(g[0]));
            gObj.addProperty("label", g[1]);
            gObj.add("yearsRange", GeneratorUtils.buildYearsRange(lastYearForGrade(g[0])));
            gObj.addProperty("scaleMin", Integer.parseInt(g[2]));
            gObj.addProperty("scaleMax", Integer.parseInt(g[3]));
            gObj.addProperty("dataUrl", g[0] + "/data.json");
            gradesArr.add(gObj);
        }
        root.add("grades", gradesArr);
        root.addProperty("schoolsUrl", "schools.json");
        root.addProperty("schoolsIndexUrl", "schools-index.json");
        root.addProperty("citiesUrl", "cities.json");
        root.addProperty("rankingsPath", "rankings/");
        root.addProperty("baloveUrl", "balove/index.json");

        Gson gson = new GsonBuilder().create();
        Files.writeString(outputDir.resolve("index.json"), gson.toJson(root) + "\n");
        System.out.println("Generated: " + outputDir.resolve("index.json"));

        // Generate index.html
        Files.writeString(outputDir.resolve("index.html"), buildIndexHtml());
        System.out.println("Generated: " + outputDir.resolve("index.html"));
    }

    private static nvo.site.SiteLayout.Page page() {
        return new nvo.site.SiteLayout.Page("../../").favicon("favicon-7.png");
    }

    private String buildIndexHtml() {
        StringBuilder sb = new StringBuilder();
        String siteBaseUrl = SITE_BASE_URL;
        String apiBaseUrl = SITE_BASE_URL + "api/v1/";
        String socialPreviewUrl = SITE_BASE_URL + "images/social-preview.png";
        String apiBaseDisplay = SITE_BASE_URL + "api/v1";
        sb.append("""
                <!DOCTYPE html>
                <html lang="bg">
                <head>
                  <meta charset="utf-8">
                  <title>НВО и ДЗИ API v1 | Иван Давидов</title>
                  <meta name="description" content="Публично JSON API с резултати от НВО и ДЗИ (от 2018 г.) от Иван Давидов. Данни за училища, градове и класации.">
                  <meta name="author" content="Иван Давидов">
                  <link rel="canonical" href="%s">

                  <meta property="og:type" content="website">
                  <meta property="og:url" content="%s">
                  <meta property="og:title" content="НВО и ДЗИ API v1 | Иван Давидов">
                  <meta property="og:description" content="Публично JSON API с резултати от НВО и ДЗИ (от 2018 г.) от Иван Давидов.">
                  <meta property="og:image" content="%s">
                  <meta property="og:locale" content="bg_BG">
                  <meta property="og:site_name" content="НВО и ДЗИ - Иван Давидов">
                  <meta name="twitter:card" content="summary_large_image">
                  <meta name="twitter:title" content="НВО и ДЗИ API v1 | Иван Давидов">
                  <meta name="twitter:description" content="Публично JSON API с резултати от НВО и ДЗИ (от 2018 г.) от Иван Давидов.">
                  <meta name="twitter:image" content="%s">

                  <script type="application/ld+json">
                  {
                    "@context": "https://schema.org",
                    "@graph": [
                      {
                        "@type": "WebSite",
                        "name": "НВО и ДЗИ - Иван Давидов",
                        "url": "%s",
                        "author": { "@id": "#author" },
                        "inLanguage": "bg"
                      },
                      {
                        "@type": "Person",
                        "@id": "#author",
                        "name": "Иван Давидов",
                        "url": "https://www.linkedin.com/in/ivandavidov"
                      },
                      {
                        "@type": "WebAPI",
                        "name": "НВО и ДЗИ API v1",
                        "description": "Публично JSON API с резултати от Национално външно оценяване и Държавни зрелостни изпити (от 2018 г.) за всички училища в България.",
                        "url": "%s",
                        "provider": { "@id": "#author" },
                        "documentation": "%s"
                      }
                    ]
                  }
                  </script>
                %s
                  <style>
                    .api-docs .api-base { margin-bottom: var(--sp-6); padding: var(--sp-3) var(--sp-4); border: 1px solid var(--border);
                      border-radius: var(--radius-md); background: var(--surface); font-family: var(--font-mono); font-size: var(--fs-sm); color: var(--text-3); }
                    .api-docs .api-base code { border: 0; background: none; color: var(--text); }
                    .api-docs h4 { margin: var(--sp-8) 0 var(--sp-3) !important; font-size: var(--fs-xs); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-4); }
                    .endpoint { margin-bottom: var(--sp-2); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
                    .endpoint-header { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-3) var(--sp-4); cursor: pointer; user-select: none; }
                    .endpoint-header:hover { background: var(--surface-2); }
                    .method { flex-shrink: 0; padding: 0.15rem 0.5rem; border-radius: var(--radius-xs); background: var(--success-soft); color: var(--success);
                      font-family: var(--font-mono); font-size: var(--fs-xs); font-weight: 700; }
                    .path { font-family: var(--font-mono); font-size: var(--fs-md); color: var(--text); text-decoration: none; }
                    a.path:hover { color: var(--primary); text-decoration: underline; }
                    .path-param { color: var(--primary); }
                    .endpoint-desc { margin-left: auto; color: var(--text-3); font-size: var(--fs-sm); text-align: right; }
                    .endpoint-body { display: none; padding: var(--sp-4); border-top: 1px solid var(--border); }
                    .endpoint.open .endpoint-body { display: block; }
                    .endpoint-arrow { color: var(--text-4); font-size: var(--fs-xs); transition: transform var(--dur) var(--ease); }
                    .endpoint.open .endpoint-arrow { transform: rotate(90deg); }
                    .try-it { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-2) var(--sp-3); margin-top: var(--sp-3); padding: var(--sp-3);
                      border-radius: var(--radius-sm); background: var(--surface-2); }
                    .try-it label { font-size: var(--fs-sm); font-weight: 600; color: var(--text-2); }
                    .try-it select, .try-it input { height: 34px; max-width: 14rem; padding: 0 var(--sp-2); border: 1px solid var(--border-strong);
                      border-radius: var(--radius-xs); background: var(--surface); color: var(--text); font-size: var(--fs-sm); }
                    .try-it > div { flex-basis: 100%%; }
                    .try-it .try-link { display: inline-block; margin-top: var(--sp-1); font-family: var(--font-mono); font-size: var(--fs-sm); word-break: break-all; }
                    .schema-table { width: 100%%; margin-top: var(--sp-2); border-collapse: collapse; font-size: var(--fs-sm); }
                    .schema-table th { padding: var(--sp-2) var(--sp-3); background: var(--surface-2); color: var(--text-3); font-size: var(--fs-xs); font-weight: 650; text-align: left; border-bottom: 1px solid var(--border); }
                    .schema-table td { padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border); vertical-align: top; }
                    .schema-table td:first-child { font-family: var(--font-mono); font-size: var(--fs-xs); }
                    .schema-table .type { color: var(--primary); font-family: var(--font-mono); font-size: var(--fs-xs); }
                    pre.example { margin: var(--sp-3) 0 0; padding: var(--sp-3) var(--sp-4); overflow-x: auto; border-radius: var(--radius-sm);
                      background: var(--surface-2); font-size: var(--fs-xs); line-height: 1.55; }
                    .section-label { margin: var(--sp-3) 0 var(--sp-1); font-size: var(--fs-sm); font-weight: 650; }
                    .grade-endpoints { margin-top: var(--sp-2); }
                    @media (max-width: 640px) {
                      .endpoint-desc { display: none; }
                      .endpoint-header { gap: var(--sp-2); }
                    }
                  </style>
                </head>
                <body>
                %s
                  <main id="main" class="container container--narrow page api-docs">
                    <nav class="breadcrumbs" aria-label="Път">
                      <ol><li><a href="../../">Начало</a></li><li><span aria-current="page">JSON API</span></li></ol>
                    </nav>
                    <header class="page-head">
                      <p class="page-head__eyebrow">Отворени данни · v1</p>
                      <h1 class="page-head__title">НВО &amp; ДЗИ API</h1>
                      <p class="page-head__lead">Публично JSON API с резултати от НВО и ДЗИ (2018-""".formatted(
                apiBaseUrl,
                apiBaseUrl,
                socialPreviewUrl,
                socialPreviewUrl,
                siteBaseUrl,
                apiBaseUrl,
                apiBaseUrl,
                nvo.site.SiteLayout.head(page()),
                nvo.site.SiteLayout.header(page())));
        sb.append(LAST_YEAR);
        sb.append("""
                ). Без ключ и без ограничения - статични файлове, които се обновяват заедно със сайта.</p>
                      <p class="muted text-sm">Резултатите са в оригиналния вид от МОН, от 2018 г. НВО след 7 клас за 2018 г. е по 65-точкова скала (сайтът показва данните от 2019 г. насам).</p>
                    </header>
                    <div class="api-base">Base URL: <code>%s</code></div>

                    <h2 style="margin-bottom:0.75rem">Общи</h2>
                """.formatted(apiBaseDisplay));

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
        sb.append("      <h2 style=\"margin-top:1.5rem\">Справочник</h2>\n");

        sb.append(endpointCard(
                "/schools.json",
                "schools.json",
                "Всички училища с метаданни",
                """
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>schools</td><td class="type">object</td><td>Училища с данни (ключ = код)</td></tr>
                          <tr><td>schools.*.shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>schools.*.fullName</td><td class="type">string</td><td>Пълно име на училището</td></tr>
                          <tr><td>schools.*.monName</td><td class="type">string|null</td><td>Името точно както е в данните на МОН</td></tr>
                          <tr><td>schools.*.registerStatus</td><td class="type">string|null</td><td>Статус в регистъра на МОН: действаща, закрита, преобразувана (закрита), отписана, заличена</td></tr>
                          <tr><td>schools.*.officialName</td><td class="type">string|null</td><td>Официалното име, изчистено (без кавички, с правилни главни букви и препинание)</td></tr>
                          <tr><td>schools.*.website</td><td class="type">string|null</td><td>Уебсайт (null ако няма)</td></tr>
                          <tr><td>schools.*.isPrivate</td><td class="type">boolean</td><td>Частно училище</td></tr>
                          <tr><td>schools.*.city</td><td class="type">string|null</td><td>Slug на града</td></tr>
                          <tr><td>schools.*.grades</td><td class="type">array</td><td>Класове, в които има данни</td></tr>
                        </table>"""));

        sb.append(endpointCard(
                "/schools-index.json",
                "schools-index.json",
                "Компактен индекс за търсене на училище",
                """
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>schools</td><td class="type">array</td><td>Списък училища</td></tr>
                          <tr><td>schools[].code</td><td class="type">string</td><td>Код на училището</td></tr>
                          <tr><td>schools[].shortName</td><td class="type">string</td><td>Кратко име</td></tr>
                          <tr><td>schools[].fullName</td><td class="type">string</td><td>Пълно име</td></tr>
                          <tr><td>schools[].isPrivate</td><td class="type">boolean</td><td>Частно училище</td></tr>
                          <tr><td>schools[].city</td><td class="type">string</td><td>Име на града</td></tr>
                          <tr><td>schools[].cityOrder</td><td class="type">number</td><td>Подредба на града (както в сайта)</td></tr>
                          <tr><td>schools[].grades</td><td class="type">array</td><td>Класове с данни</td></tr>
                        </table>"""));

        sb.append(endpointCardNoLink(
                "/schools/{code}.json",
                "Данни за училище: резултати по класове + рангове",
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
                          <tr><td>monName</td><td class="type">string|null</td><td>Името точно както е в данните на МОН</td></tr>
                          <tr><td>registerStatus</td><td class="type">string|null</td><td>Статус в регистъра на МОН: действаща, закрита, преобразувана (закрита), отписана, заличена</td></tr>
                          <tr><td>officialName</td><td class="type">string|null</td><td>Официалното име, изчистено (без кавички, с правилни главни букви и препинание)</td></tr>
                          <tr><td>website</td><td class="type">string|null</td><td>Уебсайт (null ако няма)</td></tr>
                          <tr><td>isPrivate</td><td class="type">boolean</td><td>Частно училище</td></tr>
                          <tr><td>city</td><td class="type">object|null</td><td>Град: {slug, name}</td></tr>
                          <tr><td>yearsRange</td><td class="type">array</td><td>Масив с години</td></tr>
                          <tr><td>grades</td><td class="type">object</td><td>Данни по клас (ключ = 4/7/10/12)</td></tr>
                          <tr><td>grades.*.belScore / matScore</td><td class="type">array</td><td>Резултати по години (null = няма)</td></tr>
                          <tr><td>grades.*.belStudents / matStudents</td><td class="type">array</td><td>Брой ученици по години</td></tr>
                          <tr><td>grades.*.latestYear</td><td class="type">number</td><td>Последна година с данни</td></tr>
                          <tr><td>grades.*.nationalRank / nationalTotal</td><td class="type">number</td><td>Национален ранг (последна година)</td></tr>
                          <tr><td>grades.*.cityRank / cityTotal</td><td class="type">number</td><td>Ранг в града (последна година)</td></tr>
                          <tr><td>grades.*.medianRank / medianAdjustedRank / medianTotal</td><td class="type">number</td><td>3-годишен медианен ранг</td></tr>
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
                            <option value="">-</option>
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
        sb.append("      <h2>По клас</h2>\n");

        for (String[] g : GRADES) {
            String grade = g[0];
            String label = g[1];
            String scaleRange = g[2] + "-" + g[3];

            sb.append(endpointCard(
                    "/" + grade + "/data.json",
                    grade + "/data.json",
                    label + " - всички градове и училища",
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

        sb.append("      <h2>По град</h2>\n");

        sb.append(endpointCardNoLink(
                "/{grade}/{city}/data.json",
                "Данни за конкретен град",
                """
                        <div class="try-it">
                          <label>Клас:</label>
                          <select id="city-grade" onchange="updateCityDropdown()">
                            <option value="">-</option>
                          </select>
                          <label>Град:</label>
                          <select id="city-city" onchange="updateCityLink()">
                            <option value="">-</option>
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
                            <option value="">-</option>
                          </select>
                          <label>Град:</label>
                          <select id="school-city" onchange="updateSchoolCodeDropdown()">
                            <option value="">-</option>
                          </select>
                          <label>Училище:</label>
                          <select id="school-code" onchange="updateSchoolLink()">
                            <option value="">-</option>
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
        sb.append("      <h2>Класации</h2>\n");

        sb.append(endpointCardNoLink(
                "/rankings/median/{grade}/{year}.json",
                "Класация по медиана (3-годишен прозорец)",
                """
                        <div class="try-it">
                          <label>Клас:</label>
                          <select id="rank-med-grade" onchange="updateRankMedLink()">
                            <option value="">-</option>
                          </select>
                          <label>Крайна година:</label>
                          <select id="rank-med-year" onchange="updateRankMedLink()">
                            <option value="">-</option>
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
                            <option value="">-</option>
                          </select>
                          <label>Година:</label>
                          <select id="rank-year-year" onchange="updateRankYearLink()">
                            <option value="">-</option>
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

        // Balove (min/max admission scores after 7th grade) - written by RuoDecomplexor / RuoIndexPage
        sb.append("    <div class=\"grade-endpoints\">\n");
        sb.append("      <h2>Балове след 7 клас</h2>\n");
        sb.append("      <p class=\"muted text-sm\">Минимален и максимален бал на приетите по паралелки и класирания (РУО). "
                + "В данните има дупки: за някои градове липсват години или класирания, а разбивката по пол често я няма - "
                + "<code>coverage</code> казва какво има за всяка година.</p>\n");
        sb.append(endpointCard("/balove/index.json", "balove/index.json", "Градовете с балове",
                """
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>years</td><td class="type">array</td><td>Всички години с данни (по всички градове)</td></tr>
                          <tr><td>dataUrl</td><td class="type">string</td><td>Всички градове в един файл</td></tr>
                          <tr><td>cities[]</td><td class="type">array</td><td>slug, name, years (годините с данни за града), schools, profiles, url</td></tr>
                        </table>"""));
        sb.append(endpointCardNoLink("/balove/{city}.json", "Баловете за един град",
                """
                        <p>Пример: <a class="try-link" href="balove/sofia.json">balove/sofia.json</a></p>
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>city</td><td class="type">object</td><td>slug и name</td></tr>
                          <tr><td>years</td><td class="type">array</td><td>Годините с данни за града (година, която я няма, е без данни)</td></tr>
                          <tr><td>coverage.{year}.rankings</td><td class="type">array</td><td>Класиранията (1-4) с данни в града за годината</td></tr>
                          <tr><td>coverage.{year}.gender</td><td class="type">boolean</td><td>Има ли разбивка по пол за годината</td></tr>
                          <tr><td>schools[]</td><td class="type">array</td><td>code, name, fullName, isPrivate, profiles[]</td></tr>
                          <tr><td>schools[].profiles[]</td><td class="type">array</td><td>code, name и years - обект по година</td></tr>
                          <tr><td>profiles[].years.{year}</td><td class="type">array</td><td>4 елемента (1-во…4-то класиране): обект или null - няма данни (паралелката е попълнена по-рано или класирането не е публикувано; виж coverage). Година без данни за паралелката липсва.</td></tr>
                          <tr><td>…{year}[k].min / max</td><td class="type">number</td><td>Минимален / максимален бал</td></tr>
                          <tr><td>…{year}[k].minMale / minFemale / maxMale / maxFemale</td><td class="type">number|null</td><td>По пол; null - няма разбивка</td></tr>
                        </table>"""));
        sb.append(endpointCard("/balove/data.json", "balove/data.json", "Всички градове в един файл",
                """
                        <p class="section-label">Отговор</p>
                        <table class="schema-table">
                          <tr><th>Поле</th><th>Тип</th><th>Описание</th></tr>
                          <tr><td>years</td><td class="type">array</td><td>Всички години с данни</td></tr>
                          <tr><td>cities[]</td><td class="type">array</td><td>Документите на градовете (същите като /balove/{city}.json)</td></tr>
                        </table>"""));
        sb.append("    </div>\n");

        // Footer and script
        sb.append("""
                    <p class="muted text-sm mt-8">Данни: <a href="https://data.egov.bg">data.egov.bg</a> · <a href="../../embed/">Вграждане на графики</a> · <a href="../../za-proekta/">За проекта</a></p>
                  </main>
                """ + nvo.site.SiteLayout.footer(page()) + """
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
                      sel.innerHTML = '<option value="">- ' + placeholder + ' -</option>';
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
}
