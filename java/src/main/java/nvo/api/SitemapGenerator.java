package nvo.api;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Set;
import java.util.TreeSet;

import static nvo.api.JsonGenerator.*;

public class SitemapGenerator {

    public void generate() throws Exception {
        String today = LocalDate.now().toString();
        Set<String> urls = new TreeSet<>();

        // Static pages
        urls.add(SITE_BASE_URL + "4/");
        urls.add(SITE_BASE_URL + "7/");
        urls.add(SITE_BASE_URL + "10/");
        urls.add(SITE_BASE_URL + "12/");
        urls.add(SITE_BASE_URL + "stats/");
        urls.add(SITE_BASE_URL + "games/");
        urls.add(SITE_BASE_URL + "api/v1/");
        urls.add(SITE_BASE_URL + "embed/");

        // Scan docs/{grade}/ for city and year subdirectories with index.html
        for (String[] g : GRADES) {
            String grade = g[0];
            Path gradeDir = Path.of(DOCS_BASE, grade);
            if (!Files.isDirectory(gradeDir)) continue;

            try (var stream = Files.list(gradeDir)) {
                stream.filter(Files::isDirectory)
                        .forEach(subDir -> {
                            Path indexFile = subDir.resolve("index.html");
                            if (Files.exists(indexFile)) {
                                String dirName = subDir.getFileName().toString();
                                urls.add(SITE_BASE_URL + grade + "/" + dirName + "/");
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

        Path sitemapPath = Path.of(DOCS_BASE, "sitemap.xml");
        Files.writeString(sitemapPath, sb.toString());
        System.out.println("Generated sitemap: " + sitemapPath + " (" + urls.size() + " URLs)");
    }
}
