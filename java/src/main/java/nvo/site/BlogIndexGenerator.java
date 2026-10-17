package nvo.site;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import nvo.ProjectConfig;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Началната страница на блога docs/blog/index.html от манифеста docs/blog/posts.json
 * (slug, date, dateLabel, tag, title, headline, excerpt, info, more). Нова статия =
 * docs/blog/{slug}/index.html + един запис в манифеста.
 *
 * Usage: java -cp nvo-v2.jar nvo.site.BlogIndexGenerator
 */
public final class BlogIndexGenerator {

    private BlogIndexGenerator() {
    }

    public static void main(String[] args) throws IOException {
        Path docs = Path.of(ProjectConfig.DOCS_DIR);
        List<Map<String, Object>> posts = readPosts(docs);

        SiteLayout.Page page = new SiteLayout.Page("../").active(SiteLayout.BLOG).css("blog.css");
        Map<String, Object> ctx = page.context();
        ctx.put("head", SiteLayout.head(page));
        ctx.put("header", SiteLayout.header(page));
        ctx.put("footer", SiteLayout.footer(page));
        ctx.put("siteUrl", ProjectConfig.SITE_BASE_URL);
        ctx.put("description", "Блог с анализи и наблюдения върху НВО и ДЗИ в България, стъпили върху отворените данни: "
                + "тенденции, класации, сравнения между училища и градове.");
        ctx.put("posts", posts);
        ctx.put("count", posts.size());
        ctx.put("jsonLd", jsonLd(posts));
        Path target = docs.resolve("blog/index.html");
        Files.writeString(target, SiteLayout.render("blog-index", ctx), StandardCharsets.UTF_8);
        System.out.println("BlogIndexGenerator: " + posts.size() + " posts -> " + target);
    }

    /** Статиите от манифеста, най-новите първи; проверява, че всяка статия съществува. */
    static List<Map<String, Object>> readPosts(Path docs) throws IOException {
        JsonArray arr = JsonParser.parseString(Files.readString(docs.resolve("blog/posts.json"), StandardCharsets.UTF_8))
                .getAsJsonObject().getAsJsonArray("posts");
        List<Map<String, Object>> posts = new ArrayList<>();
        for (JsonElement el : arr) {
            JsonObject o = el.getAsJsonObject();
            Map<String, Object> post = new HashMap<>();
            for (String key : new String[]{"slug", "date", "dateLabel", "tag", "title", "headline", "excerpt", "info", "more"}) {
                if (!o.has(key)) {
                    throw new IllegalStateException("posts.json: missing '" + key + "' in " + o);
                }
                post.put(key, o.get(key).getAsString());
            }
            if (!Files.exists(docs.resolve("blog").resolve((String) post.get("slug")).resolve("index.html"))) {
                throw new IllegalStateException("posts.json: no article for slug " + post.get("slug"));
            }
            posts.add(post);
        }
        posts.sort(Comparator.comparing((Map<String, Object> p) -> (String) p.get("date")).reversed());
        return posts;
    }

    private static String jsonLd(List<Map<String, Object>> posts) {
        Map<String, Object> author = new LinkedHashMap<>();
        author.put("@type", "Person");
        author.put("name", "Иван Давидов");
        author.put("url", "https://www.linkedin.com/in/ivandavidov");
        List<Map<String, Object>> items = new ArrayList<>();
        for (Map<String, Object> p : posts) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("@type", "BlogPosting");
            item.put("headline", p.get("headline"));
            item.put("url", ProjectConfig.SITE_BASE_URL + "blog/" + p.get("slug") + "/");
            item.put("datePublished", p.get("date"));
            item.put("inLanguage", "bg");
            items.add(item);
        }
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("@context", "https://schema.org");
        root.put("@type", "Blog");
        root.put("name", "Блог – НВО и ДЗИ");
        root.put("description", "Анализи и наблюдения върху НВО и ДЗИ в България, стъпили върху отворените данни.");
        root.put("url", ProjectConfig.SITE_BASE_URL + "blog/");
        root.put("inLanguage", "bg");
        root.put("author", author);
        root.put("blogPost", items);
        return new GsonBuilder().disableHtmlEscaping().setPrettyPrinting().create().toJson(root)
                .replace("</", "<\\/");
    }
}
