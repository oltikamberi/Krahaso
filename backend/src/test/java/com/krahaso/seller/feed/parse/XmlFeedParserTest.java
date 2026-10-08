package com.krahaso.seller.feed.parse;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class XmlFeedParserTest {

    private final XmlFeedParser parser = new XmlFeedParser();

    private static byte[] utf8(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }

    // ── Format detection ─────────────────────────────────────────────────────

    @ParameterizedTest(name = "supports({0}, {1}) = {2}")
    @CsvSource(nullValues = "null", value = {
            "feed.xml,     null,                 true",
            "FEED.XML,     null,                 true",
            "feed.rss,     null,                 true",
            "download,     application/xml,      true",
            "download,     text/xml; charset=utf-8, true",
            "products.csv, null,                 false",
            "products.csv, text/csv,             false",
            "null,         null,                 false",
    })
    void supportsXmlByExtensionOrContentType(String filename, String contentType, boolean expected) {
        assertThat(parser.supports(filename, contentType)).isEqualTo(expected);
    }

    // ── Schema-agnostic record detection ─────────────────────────────────────

    @Test
    void parsesSimpleProductList() {
        List<FeedRow> rows = parser.parse(utf8("""
                <?xml version="1.0" encoding="UTF-8"?>
                <products>
                  <product>
                    <sku>A1</sku>
                    <name>iPhone 15</name>
                    <brand>Apple</brand>
                    <price>999.00</price>
                    <url>https://shop.test/a1</url>
                  </product>
                  <product>
                    <sku>A2</sku>
                    <name>Galaxy S25</name>
                    <price>899</price>
                    <url>https://shop.test/a2</url>
                  </product>
                </products>
                """));

        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).rowNumber()).isEqualTo(1);
        assertThat(rows.get(0).sku()).isEqualTo("A1");
        assertThat(rows.get(0).brand()).isEqualTo("Apple");
        assertThat(rows.get(1).rowNumber()).isEqualTo(2);
        assertThat(rows.get(1).price()).isEqualByComparingTo("899.00");
    }

    @Test
    @DisplayName("Google Merchant / RSS feed: g: prefixes are dropped and <item> is found under <channel>")
    void parsesGoogleMerchantRss() {
        List<FeedRow> rows = parser.parse(utf8("""
                <?xml version="1.0"?>
                <rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
                  <channel>
                    <title>Dyqani Test</title>
                    <link>https://shop.test</link>
                    <description>Feed</description>
                    <item>
                      <g:id>TV-1</g:id>
                      <title>LG OLED 55</title>
                      <g:brand>LG</g:brand>
                      <g:price>1299.00 EUR</g:price>
                      <g:availability>in stock</g:availability>
                      <link>https://shop.test/tv-1</link>
                      <g:image_link>https://shop.test/tv-1.jpg</g:image_link>
                      <g:product_type>Televizorë</g:product_type>
                    </item>
                    <item>
                      <g:id>TV-2</g:id>
                      <title>Samsung QLED</title>
                      <g:price>999.00 EUR</g:price>
                      <g:availability>out of stock</g:availability>
                      <link>https://shop.test/tv-2</link>
                    </item>
                  </channel>
                </rss>
                """));

        assertThat(rows).hasSize(2);
        FeedRow first = rows.get(0);
        assertThat(first.valid()).isTrue();
        assertThat(first.sku()).isEqualTo("TV-1");
        assertThat(first.name()).isEqualTo("LG OLED 55");
        assertThat(first.brand()).isEqualTo("LG");
        assertThat(first.price()).isEqualByComparingTo("1299.00");
        assertThat(first.inStock()).isTrue();
        assertThat(first.productUrl()).isEqualTo("https://shop.test/tv-1");
        assertThat(first.imageUrl()).isEqualTo("https://shop.test/tv-1.jpg");
        assertThat(first.rawCategory()).isEqualTo("Televizorë");
        assertThat(rows.get(1).inStock()).isFalse();
    }

    @Test
    @DisplayName("the repeated element wins even when the wrapper has its own text children")
    void picksTheMostRepeatedElementAsTheRecord() {
        List<FeedRow> rows = parser.parse(utf8("""
                <catalog>
                  <shop>Dyqani</shop>
                  <generated>2026-10-08</generated>
                  <offers>
                    <offer><name>A</name><price>1</price><url>https://s.test/a</url></offer>
                    <offer><name>B</name><price>2</price><url>https://s.test/b</url></offer>
                    <offer><name>C</name><price>3</price><url>https://s.test/c</url></offer>
                  </offers>
                </catalog>
                """));

        assertThat(rows).extracting(FeedRow::name).containsExactly("A", "B", "C");
    }

    @Test
    @DisplayName("one nested level is flattened, so <pricing><price> maps to price")
    void flattensOneNestedLevel() {
        List<FeedRow> rows = parser.parse(utf8("""
                <products>
                  <product>
                    <name>Nested</name>
                    <pricing><price>49.90</price><currency>eur</currency></pricing>
                    <url>https://shop.test/n</url>
                  </product>
                  <product><name>Flat A</name><price>1</price><url>https://shop.test/a</url></product>
                  <product><name>Flat B</name><price>2</price><url>https://shop.test/b</url></product>
                </products>
                """));

        assertThat(rows).hasSize(3);
        assertThat(rows.get(0).name()).isEqualTo("Nested");
        assertThat(rows.get(0).price()).isEqualByComparingTo("49.90");
        assertThat(rows.get(0).currency()).isEqualTo("EUR");
        assertThat(rows.get(0).productUrl()).isEqualTo("https://shop.test/n");
    }

    @Test
    @DisplayName("a nested wrapper present on every product does not steal the record role")
    void recordElementWinsOverAUniformlyPresentNestedWrapper() {
        List<FeedRow> rows = parser.parse(utf8("""
                <products>
                  <product>
                    <name>First</name>
                    <pricing><price>49.90</price><currency>eur</currency></pricing>
                    <url>https://shop.test/n</url>
                  </product>
                  <product>
                    <name>Second</name>
                    <pricing><price>5</price></pricing>
                    <url>https://shop.test/s</url>
                  </product>
                </products>
                """));

        assertThat(rows).hasSize(2);
        assertThat(rows).allMatch(FeedRow::valid);
        assertThat(rows).extracting(FeedRow::name).containsExactly("First", "Second");
        assertThat(rows.get(0).price()).isEqualByComparingTo("49.90");
    }

    @Test
    void readsCdataAndEntityEscapedText() {
        List<FeedRow> rows = parser.parse(utf8("""
                <products>
                  <product>
                    <name><![CDATA[Laptop 15" & Dock]]></name>
                    <price>1</price>
                    <url>https://shop.test/a?x=1&amp;y=2</url>
                  </product>
                  <product>
                    <name>Plain &amp; simple</name>
                    <price>1</price>
                    <url>https://shop.test/b</url>
                  </product>
                </products>
                """));

        assertThat(rows.get(0).name()).isEqualTo("Laptop 15\" & Dock");
        assertThat(rows.get(0).productUrl()).isEqualTo("https://shop.test/a?x=1&y=2");
        assertThat(rows.get(1).name()).isEqualTo("Plain & simple");
    }

    @Test
    void invalidRowsAreReportedNotThrown() {
        List<FeedRow> rows = parser.parse(utf8("""
                <products>
                  <product><name>Good</name><price>1</price><url>https://s.test/g</url></product>
                  <product><price>1</price><url>https://s.test/noname</url></product>
                  <product><name>No price</name><url>https://s.test/np</url></product>
                </products>
                """));

        assertThat(rows).hasSize(3);
        assertThat(rows.get(0).valid()).isTrue();
        assertThat(rows.get(1).error()).isEqualTo("Mungon emri i produktit");
        assertThat(rows.get(2).error()).isEqualTo("Mungon çmimi");
    }

    @Test
    void emptyDocumentYieldsNoRows() {
        assertThat(parser.parse(utf8("<products/>"))).isEmpty();
    }

    // ── Hostile input ────────────────────────────────────────────────────────

    @Test
    @DisplayName("XXE: a DOCTYPE with an external entity is rejected outright, never resolved")
    void rejectsExternalEntities() {
        byte[] xxe = utf8("""
                <?xml version="1.0"?>
                <!DOCTYPE products [
                  <!ENTITY xxe SYSTEM "file:///etc/passwd">
                ]>
                <products>
                  <product><name>&xxe;</name><price>1</price><url>https://s.test/x</url></product>
                </products>
                """);

        assertThatThrownBy(() -> parser.parse(xxe))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageStartingWith("XML-i nuk lexohet");
    }

    @Test
    @DisplayName("billion-laughs style entity expansion is rejected because DOCTYPE itself is disallowed")
    void rejectsEntityExpansionBomb() {
        byte[] bomb = utf8("""
                <?xml version="1.0"?>
                <!DOCTYPE lolz [
                  <!ENTITY lol "lol">
                  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
                  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
                ]>
                <products><product><name>&lol3;</name></product></products>
                """);

        assertThatThrownBy(() -> parser.parse(bomb)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void malformedXmlIsReportedAsUnreadable() {
        assertThatThrownBy(() -> parser.parse(utf8("<products><product><name>unclosed")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageStartingWith("XML-i nuk lexohet");
    }

    @Test
    void nonXmlBytesAreReportedAsUnreadable() {
        assertThatThrownBy(() -> parser.parse(utf8("name,price,url\nA,1,https://s.test/a")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
