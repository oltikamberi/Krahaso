package com.krahaso.seller.feed.parse;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Best-effort mapping of a seller's own category text onto our category slugs.
 * The seller's raw text is always kept on the offer, so an unmatched row is still
 * usable — it just shows up as unmapped in the preview.
 */
@Component
public class CategoryMatcher {

    private static final Map<String, List<String>> KEYWORDS = buildKeywords();

    private static Map<String, List<String>> buildKeywords() {
        Map<String, List<String>> keywords = new LinkedHashMap<>();
        keywords.put("gaming", List.of(
                "gaming", "gamer", "konsol", "console", "playstation", "play station", "ps5", "ps4",
                "xbox", "nintendo", "switch", "steam deck"));
        keywords.put("telefona", List.of(
                "telefon", "phone", "smartphone", "smart phone", "mobil", "celular", "iphone"));
        keywords.put("laptope", List.of(
                "laptop", "notebook", "macbook", "ultrabook", "kompjuter portativ"));
        keywords.put("televizore", List.of(
                "televizor", "television", "smart tv", "tv"));
        keywords.put("pajisje-shtepiake", List.of(
                "pajisje shtepiake", "pajisje shtëpiake", "home appliance", "appliance", "lavatric",
                "washing", "frigorifer", "fridge", "refrigerator", "furre", "furrë", "oven",
                "enelarese", "enëlarëse", "dishwasher", "kondicioner", "air condition"));
        return keywords;
    }

    /**
     * Matches against the seller's category text first, then falls back to the
     * product name (feeds often omit a category column entirely).
     */
    public Optional<String> match(String rawCategory, String productName) {
        return firstMatch(rawCategory).or(() -> firstMatch(productName));
    }

    private Optional<String> firstMatch(String text) {
        if (text == null || text.isBlank()) {
            return Optional.empty();
        }

        String haystack = text.toLowerCase(Locale.ROOT);
        for (Map.Entry<String, List<String>> entry : KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (matches(haystack, keyword)) {
                    return Optional.of(entry.getKey());
                }
            }
        }
        return Optional.empty();
    }

    /** "tv" must not match inside words like "tvsh", so short keywords need a word boundary. */
    private boolean matches(String haystack, String keyword) {
        if (keyword.length() > 3) {
            return haystack.contains(keyword);
        }
        return haystack.matches(".*\\b" + java.util.regex.Pattern.quote(keyword) + "\\b.*");
    }
}
