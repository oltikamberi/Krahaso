package com.krahaso.seller.feed.parse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Maps a seller's own column names onto our fields. Matching is case-insensitive
 * and ignores separators, so "Product Name", "product_name" and "productname"
 * are all the same column.
 */
public final class FeedFieldMapper {

    // Order matters: earlier aliases win when a feed has several usable columns.
    private static final List<String> NAME_KEYS =
            List.of("name", "title", "productname", "producttitle", "emri", "emer", "produkti", "product");
    private static final List<String> BRAND_KEYS =
            List.of("brand", "marka", "marke", "manufacturer", "make", "prodhuesi");
    private static final List<String> PRICE_KEYS =
            List.of("price", "cmimi", "çmimi", "cmim", "saleprice", "priceeur", "amount", "cena", "vlera");
    private static final List<String> CURRENCY_KEYS =
            List.of("currency", "valuta", "monedha");
    private static final List<String> STOCK_KEYS =
            List.of("instock", "stock", "stoku", "availability", "disponueshmeria", "gjendje", "quantity", "qty");
    private static final List<String> URL_KEYS =
            List.of("url", "link", "linku", "producturl", "productlink", "produkturl", "lidhja");
    private static final List<String> IMAGE_KEYS =
            List.of("image", "imageurl", "imagelink", "picture", "thumbnail", "foto", "fotoja", "imazhi");
    private static final List<String> CATEGORY_KEYS =
            List.of("category", "kategoria", "categoryname", "producttype", "kategori", "type");
    private static final List<String> SKU_KEYS =
            List.of("sku", "externalid", "id", "code", "kodi", "mpn", "gtin", "barcode", "artikulli");

    /** Below this length an alias must match a header exactly ("id" must not hit "videoid"). */
    private static final int MIN_PARTIAL_MATCH_LENGTH = 4;

    private static final Set<String> TRUTHY =
            Set.of("true", "1", "yes", "y", "po", "instock", "in stock", "available", "ne stok", "në stok",
                    "ka", "disponueshem", "disponueshëm", "stock", "aktiv");
    private static final Set<String> FALSY =
            Set.of("false", "0", "no", "n", "jo", "outofstock", "out of stock", "unavailable", "ska",
                    "s'ka", "pa stok", "sold out", "i shitur");

    private FeedFieldMapper() {
    }

    public static FeedRow toRow(int rowNumber, Map<String, String> raw) {
        Map<String, String> fields = normalizeKeys(raw);

        String name = value(fields, NAME_KEYS);
        String rawCategory = value(fields, CATEGORY_KEYS);
        String priceText = value(fields, PRICE_KEYS);
        String productUrl = value(fields, URL_KEYS);

        if (isBlank(name)) {
            return FeedRow.invalid(rowNumber, rawCategory, name, "Mungon emri i produktit");
        }
        if (isBlank(productUrl)) {
            return FeedRow.invalid(rowNumber, rawCategory, name, "Mungon linku i produktit");
        }

        BigDecimal price = parsePrice(priceText);
        if (price == null) {
            return FeedRow.invalid(rowNumber, rawCategory, name,
                    isBlank(priceText) ? "Mungon çmimi" : "Çmimi nuk lexohet: " + priceText);
        }
        if (price.signum() <= 0) {
            return FeedRow.invalid(rowNumber, rawCategory, name, "Çmimi duhet të jetë më i madh se 0");
        }

        String stockText = value(fields, STOCK_KEYS);
        String currency = value(fields, CURRENCY_KEYS);

        return new FeedRow(
                rowNumber,
                value(fields, SKU_KEYS),
                name.trim(),
                value(fields, BRAND_KEYS),
                rawCategory,
                price,
                isBlank(currency) ? "EUR" : currency.trim().toUpperCase(Locale.ROOT),
                parseStock(stockText),
                stockText,
                productUrl.trim(),
                value(fields, IMAGE_KEYS),
                null);
    }

    /** Lowercases keys and strips anything that is not a letter or digit. */
    private static Map<String, String> normalizeKeys(Map<String, String> raw) {
        Map<String, String> normalized = new java.util.LinkedHashMap<>();
        for (Map.Entry<String, String> entry : raw.entrySet()) {
            if (entry.getKey() == null) continue;
            String key = entry.getKey().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9çë]", "");
            // First column wins when a feed repeats an equivalent header
            normalized.putIfAbsent(key, entry.getValue());
        }
        return normalized;
    }

    /**
     * Exact header matches win. Failing that, a header that merely contains the
     * alias is accepted, which covers Albanian definite forms and decorated
     * headers ("Linku", "Emri i produktit", "Cmimi me TVSH") without listing
     * every variation.
     */
    private static String value(Map<String, String> fields, List<String> keys) {
        for (String key : keys) {
            String found = fields.get(key);
            if (!isBlank(found)) {
                return found;
            }
        }

        for (String key : keys) {
            if (key.length() < MIN_PARTIAL_MATCH_LENGTH) {
                continue;
            }
            for (Map.Entry<String, String> entry : fields.entrySet()) {
                if (entry.getKey().contains(key) && !isBlank(entry.getValue())) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    /** Handles both EU (1.234,56) and US (1,234.56) formatting. */
    static BigDecimal parsePrice(String text) {
        if (isBlank(text)) return null;

        String digits = text.replaceAll("[^0-9,.]", "").trim();
        if (digits.isEmpty()) return null;

        int lastComma = digits.lastIndexOf(',');
        int lastDot = digits.lastIndexOf('.');

        String normalized;
        if (lastComma > lastDot) {
            normalized = digits.replace(".", "").replace(',', '.');
        } else if (lastDot > lastComma) {
            normalized = digits.replace(",", "");
        } else if (lastComma >= 0) {
            // Only commas present — a 1-2 digit tail means it is the decimal separator
            int tail = digits.length() - lastComma - 1;
            normalized = tail > 0 && tail <= 2
                    ? digits.substring(0, lastComma) + "." + digits.substring(lastComma + 1)
                    : digits.replace(",", "");
        } else {
            normalized = digits;
        }

        try {
            return new BigDecimal(normalized).setScale(2, java.math.RoundingMode.HALF_UP);
        } catch (NumberFormatException unparseable) {
            return null;
        }
    }

    /** Defaults to in stock when the feed says nothing about availability. */
    static Boolean parseStock(String text) {
        if (isBlank(text)) return Boolean.TRUE;

        String value = text.trim().toLowerCase(Locale.ROOT);
        if (TRUTHY.contains(value)) return Boolean.TRUE;
        if (FALSY.contains(value)) return Boolean.FALSE;

        String collapsed = value.replaceAll("[^a-z0-9']", "");
        if (TRUTHY.contains(collapsed)) return Boolean.TRUE;
        if (FALSY.contains(collapsed)) return Boolean.FALSE;

        // Quantities: anything above zero counts as in stock
        try {
            return new BigDecimal(value.replaceAll("[^0-9.]", "")).signum() > 0;
        } catch (NumberFormatException notANumber) {
            return Boolean.TRUE;
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
