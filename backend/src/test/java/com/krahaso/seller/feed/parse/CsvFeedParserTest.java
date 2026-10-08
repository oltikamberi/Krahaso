package com.krahaso.seller.feed.parse;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CsvFeedParserTest {

    private final CsvFeedParser parser = new CsvFeedParser();

    private static byte[] utf8(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }

    // ── Format detection ─────────────────────────────────────────────────────

    @ParameterizedTest(name = "supports({0}, {1}) = {2}")
    @CsvSource(nullValues = "null", value = {
            "products.csv,        null,                       true",
            "PRODUCTS.CSV,        null,                       true",
            "export.tsv,          null,                       true",
            "download,            text/csv,                   true",
            "download,            application/csv; charset=utf-8, true",
            "feed.xml,            null,                       false",
            "feed.xml,            application/xml,            false",
            "null,                null,                       false",
            "data.json,           application/json,           false",
    })
    void supportsCsvByExtensionOrContentType(String filename, String contentType, boolean expected) {
        assertThat(parser.supports(filename, contentType)).isEqualTo(expected);
    }

    // ── Happy path ───────────────────────────────────────────────────────────

    @Test
    void parsesCommaSeparatedRowsWithOneBasedRowNumbers() {
        List<FeedRow> rows = parser.parse(utf8("""
                sku,name,brand,price,url
                A1,iPhone 15,Apple,999.00,https://shop.test/a1
                A2,Galaxy S25,Samsung,899.00,https://shop.test/a2
                """));

        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).rowNumber()).isEqualTo(1);
        assertThat(rows.get(0).sku()).isEqualTo("A1");
        assertThat(rows.get(0).name()).isEqualTo("iPhone 15");
        assertThat(rows.get(0).price()).isEqualByComparingTo("999.00");
        assertThat(rows.get(1).rowNumber()).isEqualTo(2);
        assertThat(rows.get(1).brand()).isEqualTo("Samsung");
    }

    @Test
    @DisplayName("semicolon-separated files (Excel in EU locales) are detected from the header")
    void detectsSemicolonDelimiter() {
        List<FeedRow> rows = parser.parse(utf8("""
                Emri;Çmimi;Linku
                Laptop Dell;1.299,00;https://shop.test/dell
                """));

        assertThat(rows).singleElement().satisfies(row -> {
            assertThat(row.valid()).isTrue();
            assertThat(row.name()).isEqualTo("Laptop Dell");
            assertThat(row.price()).as("EU-formatted price inside a semicolon file").isEqualByComparingTo("1299.00");
            assertThat(row.productUrl()).isEqualTo("https://shop.test/dell");
        });
    }

    @Test
    void detectsTabDelimiter() {
        List<FeedRow> rows = parser.parse(utf8("name\tprice\turl\nTV LG\t499\thttps://shop.test/lg\n"));

        assertThat(rows).singleElement().satisfies(row -> {
            assertThat(row.name()).isEqualTo("TV LG");
            assertThat(row.price()).isEqualByComparingTo("499.00");
        });
    }

    @Test
    void detectsPipeDelimiter() {
        List<FeedRow> rows = parser.parse(utf8("name|price|url\nPS5|549|https://shop.test/ps5\n"));

        assertThat(rows).singleElement().extracting(FeedRow::name).isEqualTo("PS5");
    }

    @Test
    @DisplayName("a UTF-8 BOM (Excel export) is stripped so the first header still matches")
    void stripsByteOrderMark() {
        List<FeedRow> rows = parser.parse(utf8("\uFEFFname,price,url\nX,1,https://shop.test/x\n"));

        assertThat(rows).singleElement().satisfies(row -> {
            assertThat(row.valid()).isTrue();
            assertThat(row.name()).isEqualTo("X");
        });
    }

    @Test
    void handlesQuotedFieldsContainingTheDelimiterAndQuotes() {
        List<FeedRow> rows = parser.parse(utf8("""
                name,price,url
                "Laptop 15"", i7, 16GB","1,299.00",https://shop.test/l
                """));

        assertThat(rows).singleElement().satisfies(row -> {
            assertThat(row.name()).isEqualTo("Laptop 15\", i7, 16GB");
            assertThat(row.price()).isEqualByComparingTo("1299.00");
        });
    }

    @Test
    void trimsSurroundingSpacesAndSkipsEmptyLines() {
        List<FeedRow> rows = parser.parse(utf8("""
                name , price , url

                  Padded  ,  10  ,  https://shop.test/p

                """));

        assertThat(rows).singleElement().satisfies(row -> {
            assertThat(row.name()).isEqualTo("Padded");
            assertThat(row.price()).isEqualByComparingTo("10.00");
            assertThat(row.productUrl()).isEqualTo("https://shop.test/p");
        });
    }

    @Test
    void handlesWindowsLineEndings() {
        List<FeedRow> rows = parser.parse(utf8("name,price,url\r\nA,1,https://shop.test/a\r\nB,2,https://shop.test/b\r\n"));

        assertThat(rows).extracting(FeedRow::name).containsExactly("A", "B");
    }

    // ── Bad rows are reported, not thrown ────────────────────────────────────

    @Test
    @DisplayName("invalid rows are returned alongside valid ones with their row number and reason")
    void invalidRowsAreKeptWithErrors() {
        List<FeedRow> rows = parser.parse(utf8("""
                name,price,url
                Good,10,https://shop.test/good
                ,10,https://shop.test/noname
                No price,,https://shop.test/noprice
                No url,10,
                Bad price,abc,https://shop.test/bad
                """));

        assertThat(rows).hasSize(5);
        assertThat(rows.get(0).valid()).isTrue();
        assertThat(rows.get(1).error()).isEqualTo("Mungon emri i produktit");
        assertThat(rows.get(2).error()).isEqualTo("Mungon çmimi");
        assertThat(rows.get(3).error()).isEqualTo("Mungon linku i produktit");
        assertThat(rows.get(4).error()).isEqualTo("Çmimi nuk lexohet: abc");
        assertThat(rows.get(4).rowNumber()).isEqualTo(5);
    }

    @Test
    void shortRowsWithMissingTrailingColumnsStillParse() {
        List<FeedRow> rows = parser.parse(utf8("""
                name,price,url,image
                A,1,https://shop.test/a
                """));

        assertThat(rows).singleElement().satisfies(row -> {
            assertThat(row.valid()).isTrue();
            assertThat(row.imageUrl()).isNull();
        });
    }

    @Test
    void duplicateHeadersDoNotCrashAndFirstColumnWins() {
        List<FeedRow> rows = parser.parse(utf8("""
                name,price,price,url
                A,10,99,https://shop.test/a
                """));

        assertThat(rows).singleElement().satisfies(row -> {
            assertThat(row.valid()).isTrue();
            assertThat(row.price()).isIn(
                    new java.math.BigDecimal("10.00"),
                    new java.math.BigDecimal("99.00"));
        });
    }

    @Test
    void headerOnlyFileYieldsNoRows() {
        assertThat(parser.parse(utf8("name,price,url\n"))).isEmpty();
    }

    @Test
    void emptyFileYieldsNoRows() {
        assertThat(parser.parse(utf8(""))).isEmpty();
    }
}
