package nvo.site;

import com.samskivert.mustache.Mustache;
import com.samskivert.mustache.Template;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Общият layout на сайта: &lt;head&gt; блок, хедър и футър, рендерирани от
 * Mustache шаблоните в resources/templates/. Ползват го всички генератори и
 * LayoutSync (за ръчно писаните страници) - така навигацията има един източник.
 */
public final class SiteLayout {

    /** Активни позиции в навигацията. */
    public static final String HOME = "home";
    public static final String BALOVE = "balove";
    public static final String STATS = "stats";
    public static final String BLOG = "blog";

    private static final String[][] EXAMS = {
            {"4", "НВО след 4 клас"},
            {"7", "НВО след 7 клас"},
            {"10", "НВО след 10 клас"},
            {"12", "ДЗИ след 12 клас"},
    };

    private static final Mustache.Compiler COMPILER = Mustache.compiler()
            .defaultValue("")
            .withLoader(SiteLayout::openTemplate);

    private static final Map<String, Template> CACHE = new ConcurrentHashMap<>();

    private SiteLayout() {
    }

    /** Параметри на страницата, общи за head/header/footer. */
    public static final class Page {
        private final String root;
        private String active = "";
        private String favicon = "favicon.svg";
        private String touchIcon = "favicon-7.png";
        private final List<String> extraCss = new ArrayList<>();
        private boolean unsafeEval;

        /**
         * @param root относителен път до корена на сайта ("./", "../", "../../" ...)
         */
        public Page(String root) {
            this.root = root == null || root.isEmpty() ? "./" : root;
        }

        public Page active(String active) {
            this.active = active == null ? "" : active;
            return this;
        }

        public Page favicon(String favicon) {
            if (favicon != null && !favicon.isEmpty()) {
                this.favicon = favicon;
                if (favicon.endsWith(".png")) {
                    this.touchIcon = favicon;
                }
            }
            return this;
        }

        public Page css(String file) {
            if (file != null && !file.isEmpty()) {
                extraCss.add(file);
            }
            return this;
        }

        public Page unsafeEval(boolean unsafeEval) {
            this.unsafeEval = unsafeEval;
            return this;
        }

        public String root() {
            return root;
        }

        /** Контекстът за шаблоните; генераторите може да го допълнят със свои ключове. */
        public Map<String, Object> context() {
            Map<String, Object> ctx = new HashMap<>();
            ctx.put("root", root);
            ctx.put("icon", iconLambda());
            ctx.put("favicon", favicon);
            ctx.put("faviconType", favicon.endsWith(".svg") ? "image/svg+xml" : "image/png");
            ctx.put("touchIcon", touchIcon);
            ctx.put("extraCss", extraCss);
            ctx.put("unsafeEval", unsafeEval);
            List<Map<String, Object>> exams = new ArrayList<>();
            for (String[] exam : EXAMS) {
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("grade", exam[0]);
                e.put("title", exam[1]);
                e.put("active", exam[0].equals(active));
                exams.add(e);
            }
            ctx.put("exams", exams);
            ctx.put("activeHome", HOME.equals(active));
            ctx.put("activeBalove", BALOVE.equals(active));
            ctx.put("activeStats", STATS.equals(active));
            ctx.put("activeBlog", BLOG.equals(active));
            return ctx;
        }
    }

    /** Относителният път до корена за страница, която е {@code depth} нива под docs/. */
    public static String rootFor(int depth) {
        return depth <= 0 ? "./" : "../".repeat(depth);
    }

    public static String head(Page page) {
        return render("partials/head", page.context());
    }

    public static String header(Page page) {
        return render("partials/header", page.context());
    }

    public static String footer(Page page) {
        return render("partials/footer", page.context());
    }

    /** Рендерира шаблон (име без .mustache) от resources/templates/. */
    public static String render(String name, Map<String, Object> ctx) {
        Template template = CACHE.computeIfAbsent(name, n -> {
            try (Reader reader = openTemplate(n)) {
                return COMPILER.compile(reader);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        });
        return template.execute(ctx);
    }

    /** {{#icon}}search{{/icon}} → inline SVG. */
    public static Mustache.Lambda iconLambda() {
        return (frag, out) -> out.write(Icons.svg(frag.execute().trim()));
    }

    private static Reader openTemplate(String name) {
        String path = "/templates/" + name + ".mustache";
        InputStream in = SiteLayout.class.getResourceAsStream(path);
        if (in == null) {
            throw new IllegalArgumentException("Missing template: " + path);
        }
        return new InputStreamReader(in, StandardCharsets.UTF_8);
    }
}
