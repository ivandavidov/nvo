package nvo;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Stream;

public class SitemapGenerator {

    public static void main(String... args) throws Exception {
        new SitemapGenerator().generate();
    }

    public void generate() throws Exception {
        String today = LocalDate.now().toString();
        Set<String> urls = new TreeSet<>();

        // Static pages
        urls.add(ProjectConfig.SITE_BASE_URL + "4/");
        urls.add(ProjectConfig.SITE_BASE_URL + "7/");
        urls.add(ProjectConfig.SITE_BASE_URL + "10/");
        urls.add(ProjectConfig.SITE_BASE_URL + "12/");
        urls.add(ProjectConfig.SITE_BASE_URL + "stats/");
        urls.add(ProjectConfig.SITE_BASE_URL + "games/");
        urls.add(ProjectConfig.SITE_BASE_URL + "api/v1/");
        urls.add(ProjectConfig.SITE_BASE_URL + "embed/");
        urls.add(ProjectConfig.SITE_BASE_URL + "blog/");

        // Scan docs/{grade}/ for city and year subdirectories with index.html
        for (String[] gradeDef : ProjectConfig.GRADES) {
            String grade = gradeDef[0];
            Path gradeDir = Path.of(ProjectConfig.DOCS_DIR, grade);
            if (!Files.isDirectory(gradeDir)) continue;

            try (var stream = Files.list(gradeDir)) {
                stream.filter(Files::isDirectory)
                        .forEach(subDir -> {
                            Path indexFile = subDir.resolve("index.html");
                            if (Files.exists(indexFile)) {
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
                            if (Files.exists(subDir.resolve("index.html"))) {
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
            sb.append("    <lastmod>").append(today).append("</lastmod>\n");
            sb.append("  </url>\n");
        }
        sb.append("</urlset>\n");

        Path sitemapPath = Path.of(ProjectConfig.DOCS_DIR, "sitemap.xml");
        Files.writeString(sitemapPath, sb.toString());
        System.out.println("Generated sitemap: " + sitemapPath + " (" + urls.size() + " URLs)");
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
}
