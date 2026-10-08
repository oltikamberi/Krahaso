package com.krahaso.seller.feed.parse;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Column-alias matching, price parsing and stock parsing. These run without
 * Spring: the mapper is a pure function from a header→value map to a FeedRow.
 */
class FeedFieldMapperTest {

    /** A complete, well-formed row every test can start from and then break one piece of. */
    private static Map<String, String> goodRow() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("sku", "ABC-1");
        row.put("name", "iPhone 15");
        row.put("brand", "Apple");
        row.put("category", "Telefona");
        row.put("price", "999.00");
        row.put("currency", "eur");
        row.put("stock", "yes");
        row.put("url", "https://shop.test/iphone-15");
        row.put("image", "https://shop.test/iphone-15.jpg");
        return row;
    }

    @Test
    void mapsEveryFieldOfAWellFormedRow() {
        FeedRow row = FeedFieldMapper.toRow(1, goodRow());

        assertThat(row.valid()).isTrue();
        assertThat(row.rowNumber()).isEqualTo(1);
        assertThat(row.sku()).isEqualTo("ABC-1");
        assertThat(row.name()).isEqualTo("iPhone 15");
        assertThat(row.brand()).isEqualTo("Apple");
        assertThat(row.rawCategory()).isEqualTo("Telefona");
        assertThat(row.price()).isEqualByComparingTo("999.00");
        assertThat(row.currency()).as("currency upper-cased").isEqualTo("EUR");
        assertThat(row.inStock()).isTrue();
        assertThat(row.availability()).isEqualTo("yes");
        assertThat(row.productUrl()).isEqualTo("https://shop.test/iphone-15");
        assertThat(row.imageUrl()).isEqualTo("https://shop.test/iphone-15.jpg");
    }

    // ── Header alias matching ────────────────────────────────────────────────

    @Nested
    class HeaderMatching {

        @ParameterizedTest(name = "\"{0}\" is recognised as the name column")
        @ValueSource(strings = {"name", "Name", "NAME", "Product Name", "product_name", "productName",
                "title", "Emri", "Emri i produktit", "Produkti"})
        void nameAliasesAreCaseAndSeparatorInsensitive(String header) {
            Map<String, String> row = goodRow();
            row.remove("name");
            row.put(header, "Galaxy S25");

            assertThat(FeedFieldMapper.toRow(1, row).name()).isEqualTo("Galaxy S25");
        }

        @ParameterizedTest(name = "\"{0}\" is recognised as the price column")
        @ValueSource(strings = {"price", "Price (EUR)", "Cmimi", "Çmimi", "Cmimi me TVSH", "sale_price", "Vlera"})
        void priceAliasesIncludeAlbanianAndDecoratedHeaders(String header) {
            Map<String, String> row = goodRow();
            row.remove("price");
            row.put(header, "12.50");

            assertThat(FeedFieldMapper.toRow(1, row).price()).isEqualByComparingTo("12.50");
        }

        @ParameterizedTest(name = "\"{0}\" is recognised as the url column")
        @ValueSource(strings = {"url", "link", "Linku", "Product URL", "product_link", "Lidhja"})
        void urlAliases(String header) {
            Map<String, String> row = goodRow();
            row.remove("url");
            row.put(header, "https://shop.test/x");

            assertThat(FeedFieldMapper.toRow(1, row).productUrl()).isEqualTo("https://shop.test/x");
        }

        @Test
        @DisplayName("short alias \"id\" must match a header exactly — \"videoid\" is not the SKU")
        void shortAliasesNeverPartialMatch() {
            Map<String, String> row = goodRow();
            row.remove("sku");
            row.put("videoid", "VID-123");

            assertThat(FeedFieldMapper.toRow(1, row).sku()).isNull();

            row.put("id", "REAL-1");
            assertThat(FeedFieldMapper.toRow(1, row).sku()).isEqualTo("REAL-1");
        }

        @Test
        @DisplayName("short alias \"url\" does not partial-match, so \"imageurl\" is not the product link")
        void imageUrlColumnIsNotMistakenForProductUrl() {
            Map<String, String> row = goodRow();
            row.remove("url");
            row.remove("image");
            row.put("imageurl", "https://shop.test/pic.jpg");

            FeedRow result = FeedFieldMapper.toRow(1, row);
            assertThat(result.valid()).isFalse();
            assertThat(result.error()).isEqualTo("Mungon linku i produktit");
        }

        @Test
        @DisplayName("exact alias wins over a partial one even when the partial column comes first")
        void exactMatchBeatsPartialMatchRegardlessOfColumnOrder() {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("product_title_long", "Long marketing title");
            row.put("name", "Short name");
            row.put("price", "1");
            row.put("url", "https://shop.test/x");

            assertThat(FeedFieldMapper.toRow(1, row).name()).isEqualTo("Short name");
        }

        @Test
        @DisplayName("earlier alias wins when a feed has several usable columns")
        void aliasOrderDecidesBetweenCompetingColumns() {
            Map<String, String> row = goodRow();
            row.put("title", "From title");
            row.put("name", "From name");

            assertThat(FeedFieldMapper.toRow(1, row).name()).isEqualTo("From name");
        }

        @Test
        @DisplayName("an empty cell under the preferred header falls through to the next alias")
        void blankPreferredColumnFallsThrough() {
            Map<String, String> row = goodRow();
            row.put("name", "   ");
            row.put("title", "From title");

            assertThat(FeedFieldMapper.toRow(1, row).name()).isEqualTo("From title");
        }

        @Test
        void firstColumnWinsWhenAFeedRepeatsAnEquivalentHeader() {
            Map<String, String> row = goodRow();
            row.put("Price", "5.00"); // normalises to the same key as "price"

            assertThat(FeedFieldMapper.toRow(1, row).price()).isEqualByComparingTo("999.00");
        }

        @Test
        void nullHeaderIsIgnored() {
            Map<String, String> row = goodRow();
            row.put(null, "junk");

            assertThat(FeedFieldMapper.toRow(1, row).valid()).isTrue();
        }
    }

    // ── Validation errors ────────────────────────────────────────────────────

    @Nested
    class Validation {

        @Test
        void missingNameIsInvalid() {
            Map<String, String> row = goodRow();
            row.remove("name");

            FeedRow result = FeedFieldMapper.toRow(7, row);
            assertThat(result.valid()).isFalse();
            assertThat(result.rowNumber()).isEqualTo(7);
            assertThat(result.error()).isEqualTo("Mungon emri i produktit");
            assertThat(result.rawCategory()).as("kept so the preview can still group it").isEqualTo("Telefona");
        }

        @Test
        void missingUrlIsInvalidAndKeepsTheName() {
            Map<String, String> row = goodRow();
            row.remove("url");

            FeedRow result = FeedFieldMapper.toRow(1, row);
            assertThat(result.error()).isEqualTo("Mungon linku i produktit");
            assertThat(result.name()).isEqualTo("iPhone 15");
        }

        @Test
        void missingPriceIsInvalid() {
            Map<String, String> row = goodRow();
            row.remove("price");

            assertThat(FeedFieldMapper.toRow(1, row).error()).isEqualTo("Mungon çmimi");
        }

        @Test
        void unreadablePriceReportsTheOffendingText() {
            Map<String, String> row = goodRow();
            row.put("price", "call us");

            assertThat(FeedFieldMapper.toRow(1, row).error()).isEqualTo("Çmimi nuk lexohet: call us");
        }

        @ParameterizedTest
        @ValueSource(strings = {"0", "0.00", "0,00", "€0"})
        void zeroPriceIsInvalid(String price) {
            Map<String, String> row = goodRow();
            row.put("price", price);

            assertThat(FeedFieldMapper.toRow(1, row).error()).isEqualTo("Çmimi duhet të jetë më i madh se 0");
        }

        @Test
        void currencyDefaultsToEurAndNameAndUrlAreTrimmed() {
            Map<String, String> row = goodRow();
            row.remove("currency");
            row.put("name", "  Padded  ");
            row.put("url", " https://shop.test/p ");

            FeedRow result = FeedFieldMapper.toRow(1, row);
            assertThat(result.currency()).isEqualTo("EUR");
            assertThat(result.name()).isEqualTo("Padded");
            assertThat(result.productUrl()).isEqualTo("https://shop.test/p");
        }
    }

    // ── Price parsing ────────────────────────────────────────────────────────

    @Nested
    class PriceParsing {

        @ParameterizedTest(name = "\"{0}\" → {1}")
        @CsvSource(delimiter = '|', value = {
                "999             | 999.00",
                "999.5           | 999.50",
                "1,234.56        | 1234.56",   // US thousands + decimal
                "1.234,56        | 1234.56",   // EU thousands + decimal
                "1.234.567,89    | 1234567.89",
                "12,50           | 12.50",     // comma as decimal, no thousands
                "€ 1.299,00      | 1299.00",
                "1299 EUR        | 1299.00",
                "$49.99          | 49.99",
                "  7  ,  5       | 7.50",      // spaces stripped before parsing
                "0.005           | 0.01",      // HALF_UP to two decimals
        })
        void parsesEuAndUsFormats(String text, String expected) {
            assertThat(FeedFieldMapper.parsePrice(text)).isEqualByComparingTo(new BigDecimal(expected));
        }

        @ParameterizedTest(name = "\"{0}\" → {1}")
        @CsvSource(delimiter = '|', value = {
                "1,234           | 1234.00",
                "1,299 EUR       | 1299.00",
                "12,345          | 12345.00",
        })
        void loneCommaWithThreeDigitTailIsAThousandsSeparator(String text, String expected) {
            assertThat(FeedFieldMapper.parsePrice(text)).isEqualByComparingTo(new BigDecimal(expected));
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "   ", "free", "N/A", "€", ".", ",", "1.2.3.4,5,6"})
        void unparseableTextReturnsNull(String text) {
            assertThat(FeedFieldMapper.parsePrice(text)).isNull();
        }

        @Test
        void nullReturnsNull() {
            assertThat(FeedFieldMapper.parsePrice(null)).isNull();
        }
    }

    // ── Stock parsing ────────────────────────────────────────────────────────

    @Nested
    class StockParsing {

        @ParameterizedTest
        @ValueSource(strings = {"true", "1", "yes", "Y", "po", "In Stock", "instock", "available",
                "në stok", "ne stok", "Disponueshëm", "ka", "aktiv", "IN-STOCK"})
        void truthyValues(String text) {
            assertThat(FeedFieldMapper.parseStock(text)).isTrue();
        }

        @ParameterizedTest
        @ValueSource(strings = {"false", "0", "no", "N", "jo", "Out of stock", "outofstock", "unavailable",
                "s'ka", "ska", "pa stok", "Sold Out", "i shitur", "OUT_OF_STOCK"})
        void falsyValues(String text) {
            assertThat(FeedFieldMapper.parseStock(text)).isFalse();
        }

        @ParameterizedTest(name = "quantity \"{0}\" → in stock = {1}")
        @CsvSource({"5, true", "120, true", "0.0, false", "00, false", "3 pcs, true", "0 pcs, false"})
        void quantitiesAboveZeroCountAsInStock(String text, boolean expected) {
            assertThat(FeedFieldMapper.parseStock(text)).isEqualTo(expected);
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "  "})
        void blankDefaultsToInStock(String text) {
            assertThat(FeedFieldMapper.parseStock(text)).isTrue();
        }

        @Test
        void nullDefaultsToInStock() {
            assertThat(FeedFieldMapper.parseStock(null)).isTrue();
        }

        @Test
        @DisplayName("unknown free text is treated as in stock rather than hiding the offer")
        void unknownTextDefaultsToInStock() {
            assertThat(FeedFieldMapper.parseStock("ships in 3 days")).isTrue();
            assertThat(FeedFieldMapper.parseStock("preorder")).isTrue();
        }
    }
}
