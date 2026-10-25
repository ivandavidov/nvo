package nvo.site;

import java.util.List;

/**
 * Менюто "Изтегли ▾" (CSV · JSON · PDF) - същата разметка като exportMenuHtml() в
 * docs/js/ui/export-menu.js. Поведението е в docs/js/ui/popover.js, действията -
 * в JS на страницата (data-action).
 */
public final class ExportMenu {

    /** Ред в менюто: kind = csv|json|pdf; action (бутон) или href (+ download). */
    public record Item(String kind, String hint, String action, String href, String download) {
        public static Item action(String kind, String hint, String action) {
            return new Item(kind, hint, action, null, null);
        }

        public static Item link(String kind, String hint, String href, String download) {
            return new Item(kind, hint, null, href, download);
        }
    }

    private ExportMenu() {
    }

    public static String html(String title, List<Item> items, String note, String cls) {
        StringBuilder h = new StringBuilder();
        h.append("<details class=\"menu-button").append(cls == null ? "" : " " + cls).append("\" data-popover>")
                .append("<summary class=\"btn btn--sm\">").append(Icons.svg("download"))
                .append("<span class=\"menu-button__long\">Изтегли данните</span><span class=\"menu-button__short\">Изтегли</span>")
                .append("<span class=\"menu-button__caret\">").append(Icons.svg("chevron-down")).append("</span></summary>")
                .append("<div class=\"menu-button__panel\"><p class=\"menu-button__title\">").append(esc(title)).append("</p>");
        for (Item it : items) {
            String icon = switch (it.kind()) {
                case "csv" -> "table";
                case "json" -> "code";
                default -> "file";
            };
            String body = Icons.svg(icon) + "<span><strong>" + it.kind().toUpperCase() + "</strong><span class=\"menu-button__hint\">"
                    + esc(it.hint()) + "</span></span>";
            if (it.href() != null) {
                h.append("<a class=\"menu-button__item\" href=\"").append(esc(it.href())).append("\"")
                        .append(it.download() != null ? " download=\"" + esc(it.download()) + "\"" : "")
                        .append(">").append(body).append("</a>");
            } else {
                h.append("<button type=\"button\" class=\"menu-button__item\" data-action=\"").append(esc(it.action())).append("\">")
                        .append(body).append("</button>");
            }
        }
        if (note != null) {
            h.append("<p class=\"menu-button__note\">").append(esc(note)).append("</p>");
        }
        return h.append("</div></details>").toString();
    }

    private static String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
