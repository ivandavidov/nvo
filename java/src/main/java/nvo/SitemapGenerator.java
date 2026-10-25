package nvo;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Stream;

public class SitemapGenerator {

    public static void main(String... args) throws Exception {
        new SitemapGenerator().generate();
    }

    public void generate() throws Exception {
        String today = LocalDate.now().toString();
        Map<String, String> lastmod = gitLastModified(today);
        Set<String> urls = new TreeSet<>();

        // Static pages
        urls.add(ProjectConfig.SITE_BASE_URL);
        urls.add(ProjectConfig.SITE_BASE_URL + "za-proekta/");
        urls.add(ProjectConfig.SITE_BASE_URL + "4/");
        urls.add(ProjectConfig.SITE_BASE_URL + "7/");
        urls.add(ProjectConfig.SITE_BASE_URL + "10/");
        urls.add(ProjectConfig.SITE_BASE_URL + "12/");
        urls.add(ProjectConfig.SITE_BASE_URL + "stats/");
        urls.add(ProjectConfig.SITE_BASE_URL + "api/v1/");
        urls.add(ProjectConfig.SITE_BASE_URL + "embed/");
        urls.add(ProjectConfig.SITE_BASE_URL + "blog/");

        // Scan docs/{grade}/ for city and year subdirectories with index.html (без пренасочващите страници)
        for (String[] gradeDef : ProjectConfig.GRADES) {
            String grade = gradeDef[0];
            Path gradeDir = Path.of(ProjectConfig.DOCS_DIR, grade);
            if (!Files.isDirectory(gradeDir)) continue;

            try (var stream = Files.list(gradeDir)) {
                stream.filter(Files::isDirectory)
                        .forEach(subDir -> {
                            Path indexFile = subDir.resolve("index.html");
                            if (Files.exists(indexFile) && !isExcluded(indexFile)) {
                                String dirName = subDir.getFileName().toString();
                                urls.add(ProjectConfig.SITE_BASE_URL + grade + "/" + dirName + "/");
                            }
                        });
            }
        }

        // Scan docs/{grade}/{RUO_DIR_NAME}/**/index.html for generated balove pages.
        for (String[] gradeDef : ProjectConfig.GRADES) {
            String grade = gradeDef[0];
            Path ruoDir = Path.of(ProjectConfig.DOCS_DIR, grade, ProjectConfig.RUO_DIR_NAME);
            if (!Files.isDirectory(ruoDir)) continue;

            try (Stream<Path> stream = Files.walk(ruoDir)) {
                stream.filter(Files::isRegularFile)
                        .filter(path -> "index.html".equals(path.getFileName().toString()))
                        .forEach(path -> urls.add(pathToUrl(path)));
            }
        }

        // Scan docs/school/{code}/index.html for generated per-school pages.
        Path schoolDir = Path.of(ProjectConfig.DOCS_DIR, "school");
        if (Files.isDirectory(schoolDir)) {
            try (var stream = Files.list(schoolDir)) {
                stream.filter(Files::isDirectory)
                        .forEach(subDir -> {
                            if (Files.exists(subDir.resolve("index.html")) && !isExcluded(subDir.resolve("index.html"))) {
                                urls.add(ProjectConfig.SITE_BASE_URL + "school/"
                                        + subDir.getFileName() + "/");
                            }
                        });
            }
        }

        // Scan docs/blog/{slug}/index.html for blog post pages.
        Path blogDir = Path.of(ProjectConfig.DOCS_DIR, "blog");
        if (Files.isDirectory(blogDir)) {
            try (var stream = Files.list(blogDir)) {
                stream.filter(Files::isDirectory)
                        .forEach(subDir -> {
                            if (Files.exists(subDir.resolve("index.html"))) {
                                urls.add(ProjectConfig.SITE_BASE_URL + "blog/"
                                        + subDir.getFileName() + "/");
                            }
                        });
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        for (String url : urls) {
            sb.append("  <url>\n");
            sb.append("    <loc>").append(url).append("</loc>\n");
            String page = "docs/" + url.substring(ProjectConfig.SITE_BASE_URL.length()) + "index.html";
            sb.append("    <lastmod>").append(lastmod.getOrDefault(page, today)).append("</lastmod>\n");
            sb.append("  </url>\n");
        }
        sb.append("</urlset>\n");

        Path sitemapPath = Path.of(ProjectConfig.DOCS_DIR, "sitemap.xml");
        Files.writeString(sitemapPath, sb.toString());
        System.out.println("Generated sitemap: " + sitemapPath + " (" + urls.size() + " URLs)");
    }

    /**
     * Реалната дата на промяна на всяка страница (път от корена на repo-то → yyyy-MM-dd): датата на
     * последния commit, който я е променил. Генераторите пренаписват всички страници при всеки build,
     * но непроменената страница излиза байт по байт същата, затова git знае кога наистина се е
     * променила. Променените и новите (още не commit-нати) страници получават днешна дата - също и
     * всички, ако git не е наличен. Без това всички адреси имаха датата на build-а и Google спира
     * да вярва на lastmod.
     */
    private static Map<String, String> gitLastModified(String today) {
        Map<String, String> dates = new HashMap<>();
        try {
            String date = null;
            for (String line : git("log", "--format=%x00%cs", "--name-only", "--", "docs")) {
                if (line.startsWith("\0")) {
                    date = line.substring(1);
                } else if (!line.isBlank() && date != null) {
                    dates.putIfAbsent(line, date);
                }
            }
            Set<String> changed = new HashSet<>();
            for (String line : git("status", "--porcelain", "--untracked-files=all", "--", "docs")) {
                if (line.length() > 3) {
                    String path = line.substring(3);
                    int arrow = path.indexOf(" -> ");
                    changed.add(arrow >= 0 ? path.substring(arrow + 4) : path);
                }
            }
            changed.forEach(path -> dates.put(path, today));
        } catch (Exception e) {
            System.err.println("Sitemap: git is not available, lastmod = today (" + e.getMessage() + ")");
            return Map.of();
        }
        return dates;
    }

    private static List<String> git(String... args) throws Exception {
        List<String> command = new java.util.ArrayList<>(List.of("git", "-C", ProjectConfig.BASE_DIR, "-c", "core.quotepath=off"));
        command.addAll(List.of(args));
        Process process = new ProcessBuilder(command).redirectError(ProcessBuilder.Redirect.DISCARD).start();
        List<String> lines;
        try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(
                process.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            lines = reader.lines().toList();
        }
        if (process.waitFor() != 0) {
            throw new IllegalStateException("git " + String.join(" ", args) + " failed");
        }
        return lines;
    }

    private String pathToUrl(Path indexPath) {
        Path docsBase = Path.of(ProjectConfig.DOCS_DIR);
        Path relative = docsBase.relativize(indexPath);
        String normalized = relative.toString().replace('\\', '/');

        if (normalized.endsWith("/index.html")) {
            normalized = normalized.substring(0, normalized.length() - "/index.html".length()) + "/";
        }

        return ProjectConfig.SITE_BASE_URL + normalized;
    }

    /** Пренасочващите страници (стари адреси на профили) не влизат в sitemap-а. */
    /** Пренасочващите страници и тези с noindex (напр. профил само със стари резултати). */
    private static boolean isExcluded(Path page) {
        try {
            String html = Files.readString(page);
            return html.contains("http-equiv=\"refresh\"") || html.contains("<meta name=\"robots\" content=\"noindex\">");
        } catch (java.io.IOException e) {
            return false;
        }
    }
}
