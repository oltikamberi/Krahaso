package com.krahaso.seller.feed.parse;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class CategoryMatcherTest {

    private final CategoryMatcher matcher = new CategoryMatcher();

    @ParameterizedTest(name = "category \"{0}\" → {1}")
    @CsvSource(delimiter = '|', value = {
            "Telefona                 | telefona",
            "Smartphones              | telefona",
            "Mobile Phones            | telefona",
            "Celularë                 | telefona",
            "Laptops                  | laptope",
            "Laptopë dhe Notebook     | laptope",
            "Kompjuter portativ       | laptope",
            "Televizorë               | televizore",
            "Smart TV                 | televizore",
            "TV                       | televizore",
            "Gaming                   | gaming",
            "Konsola                  | gaming",
            "PlayStation 5            | gaming",
            "Nintendo Switch          | gaming",
            "Pajisje shtëpiake        | pajisje-shtepiake",
            "Pajisje Shtepiake        | pajisje-shtepiake",
            "Home Appliances          | pajisje-shtepiake",
            "Lavatrice                | pajisje-shtepiake",
            "Frigoriferë              | pajisje-shtepiake",
            "Kondicionerë             | pajisje-shtepiake",
    })
    void matchesSellerCategoryTextCaseInsensitively(String rawCategory, String expectedSlug) {
        assertThat(matcher.match(rawCategory, "irrelevant product name")).contains(expectedSlug);
    }

    @Test
    @DisplayName("feeds without a category column still get classified from the product name")
    void fallsBackToProductName() {
        assertThat(matcher.match(null, "Apple iPhone 15 Pro 256GB")).contains("telefona");
        assertThat(matcher.match("", "Lenovo IdeaPad 3 15.6\" Laptop")).contains("laptope");
        assertThat(matcher.match("   ", "Samsung 55\" QLED Smart TV")).contains("televizore");
    }

    @Test
    void categoryTextTakesPriorityOverProductName() {
        // Name says laptop, seller's own category says gaming — the seller knows their shelf
        assertThat(matcher.match("Gaming", "ASUS ROG Laptop")).contains("gaming");
    }

    @Test
    void unmatchedCategoryFallsBackToNameAndThenToEmpty() {
        assertThat(matcher.match("Aksesorë", "Apple iPhone 15 case")).contains("telefona");
        assertThat(matcher.match("Aksesorë", "Kabllo USB-C 2m")).isEmpty();
        assertThat(matcher.match(null, null)).isEmpty();
    }

    @Test
    @DisplayName("short keyword \"tv\" needs a word boundary, so \"TVSH\" (VAT) does not mean television")
    void shortKeywordsRespectWordBoundaries() {
        assertThat(matcher.match("Çmimi me TVSH", "Kabllo HDMI")).isEmpty();
        assertThat(matcher.match("Aksesorë TV", "Kabllo HDMI")).contains("televizore");
        assertThat(matcher.match(null, "Mbajtëse muri për TV 55\"")).contains("televizore");
    }

    @Test
    @DisplayName("short gaming keywords: \"ps5\" matches as a word, not inside other tokens")
    void ps5MatchesAsAWord() {
        assertThat(matcher.match(null, "Sony PS5 Slim 1TB")).contains("gaming");
        assertThat(matcher.match(null, "Kontroller për PS5")).contains("gaming");
        assertThat(matcher.match(null, "Steps5 pedometer")).isEmpty();
    }

    @Test
    @DisplayName("gaming is checked first, so a \"gaming laptop\" lands in gaming rather than laptope")
    void keywordGroupsAreCheckedInDeclaredOrder() {
        assertThat(matcher.match(null, "Gaming Laptop MSI Katana")).contains("gaming");
        assertThat(matcher.match(null, "Laptop MSI Modern")).contains("laptope");
    }

    @Test
    void longerKeywordsMatchAnywhereInsideTheText() {
        assertThat(matcher.match(null, "Kompjuterlaptop special")).contains("laptope");
        assertThat(matcher.match(null, "Superfrigoriferi i ri")).contains("pajisje-shtepiake");
    }
}
