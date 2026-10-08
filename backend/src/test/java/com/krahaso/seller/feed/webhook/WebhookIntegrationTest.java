package com.krahaso.seller.feed.webhook;

import com.krahaso.IntegrationTestBase;
import com.krahaso.seller.feed.SellerOffer;
import com.krahaso.seller.feed.SellerOfferRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end coverage of POST /api/webhooks/offers: authentication, signature,
 * replay window, idempotency, ordering, partial updates and create-on-unknown.
 *
 * <p>Each test gets its own seller, API key and one known offer, so the cases
 * are independent and can run in any order.
 */
class WebhookIntegrationTest extends IntegrationTestBase {

    private static final String KNOWN_SKU = "SKU-KNOWN";

    @Autowired
    private SellerOfferRepository offerRepository;

    private String bearer;
    private Long feedId;
    private String apiKey;
    private String secret;
    private Long knownOfferId;

    @BeforeEach
    void seller_with_api_key_and_one_offer() throws Exception {
        bearer = registerSeller(unique("webhook") + "@dyqan.test");

        JsonNode credentials = json.readTree(mvc.perform(post("/api/seller/feeds/api-key")
                        .header("Authorization", "Bearer " + bearer))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        feedId = credentials.get("feedId").asLong();
        apiKey = credentials.get("apiKey").asString();
        secret = credentials.get("signingSecret").asString();

        SellerOffer offer = new SellerOffer();
        offer.setSellerId(sellerIdFromToken());
        offer.setFeedId(feedId);
        offer.setSku(KNOWN_SKU);
        offer.setName("Samsung Galaxy S25");
        offer.setBrand("Samsung");
        offer.setPrice(new BigDecimal("899.00"));
        offer.setCurrency("EUR");
        offer.setInStock(true);
        offer.setProductUrl("https://shop.test/" + unique("galaxy"));
        offer.setUpdatedAt(Instant.now());
        knownOfferId = offerRepository.save(offer).getId();
    }

    // ── Authentication and signature ─────────────────────────────────────────

    @Nested
    class Authentication {

        @Test
        @DisplayName("no headers at all → 401, names the missing key header")
        void rejectsRequestWithoutHeaders() throws Exception {
            mvc.perform(webhook(null, null, null, utf8("{}")))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Mungon header " + WebhookSignature.KEY_HEADER));
        }

        @Test
        @DisplayName("unknown API key → 401 without revealing whether the key format was close")
        void rejectsUnknownApiKey() throws Exception {
            byte[] body = json.writeValueAsBytes(priceUpdate(KNOWN_SKU, "850.00"));
            String ts = now();
            mvc.perform(webhook("krh_definitely-not-a-real-key", ts, webhookSignature.sign(secret, ts, body), body))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("API key i pavlefshëm"));
        }

        @Test
        @DisplayName("valid key but signature made with the wrong secret → 401")
        void rejectsWrongSignature() throws Exception {
            byte[] body = json.writeValueAsBytes(priceUpdate(KNOWN_SKU, "850.00"));
            String ts = now();
            mvc.perform(webhook(apiKey, ts, webhookSignature.sign("krhsec_wrong", ts, body), body))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Nënshkrimi është i pavlefshëm"));
            assertPriceUnchanged();
        }

        @Test
        @DisplayName("body modified after signing → 401, nothing applied")
        void rejectsTamperedBody() throws Exception {
            byte[] signedBody = json.writeValueAsBytes(priceUpdate(KNOWN_SKU, "850.00"));
            byte[] tampered = json.writeValueAsBytes(priceUpdate(KNOWN_SKU, "1.00"));
            String ts = now();
            mvc.perform(webhook(apiKey, ts, webhookSignature.sign(secret, ts, signedBody), tampered))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Nënshkrimi është i pavlefshëm"));
            assertPriceUnchanged();
        }

        @Test
        @DisplayName("correctly signed but one-hour-old timestamp → 401 (replay protection)")
        void rejectsReplayedTimestamp() throws Exception {
            byte[] body = json.writeValueAsBytes(priceUpdate(KNOWN_SKU, "850.00"));
            String stale = String.valueOf(Instant.now().minus(1, ChronoUnit.HOURS).getEpochSecond());
            mvc.perform(webhook(apiKey, stale, webhookSignature.sign(secret, stale, body), body))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Koha e kërkesës është jashtë intervalit të lejuar"));
            assertPriceUnchanged();
        }

        @Test
        @DisplayName("missing timestamp header → 401 even with a valid key")
        void rejectsMissingTimestamp() throws Exception {
            byte[] body = json.writeValueAsBytes(priceUpdate(KNOWN_SKU, "850.00"));
            mvc.perform(webhook(apiKey, null, webhookSignature.sign(secret, "", body), body))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Mungon header " + WebhookSignature.TIMESTAMP_HEADER));
        }

        @Test
        @DisplayName("ISO-8601 timestamps are accepted as well as unix seconds")
        void acceptsIsoTimestamp() throws Exception {
            byte[] body = json.writeValueAsBytes(priceUpdate(KNOWN_SKU, "850.00"));
            String iso = Instant.now().toString();
            mvc.perform(webhook(apiKey, iso, webhookSignature.sign(secret, iso, body), body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updated").value(1));
        }

        @Test
        @DisplayName("after regenerating the key, the old key is dead and the new one works")
        void rotatedKeyStopsWorking() throws Exception {
            JsonNode rotated = json.readTree(mvc.perform(post("/api/seller/feeds/api-key")
                            .header("Authorization", "Bearer " + bearer))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString());
            assertThat(rotated.get("feedId").asLong()).as("rotation keeps the same feed").isEqualTo(feedId);

            mvc.perform(signedWebhook(apiKey, secret, priceUpdate(KNOWN_SKU, "850.00")))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("API key i pavlefshëm"));

            mvc.perform(signedWebhook(
                            rotated.get("apiKey").asString(),
                            rotated.get("signingSecret").asString(),
                            priceUpdate(KNOWN_SKU, "850.00")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updated").value(1));
        }

        @Test
        @DisplayName("the feeds API exposes only the key prefix, never the key or the secret")
        void secretsNeverLeakThroughFeedsApi() throws Exception {
            String body = mvc.perform(get("/api/seller/feeds").header("Authorization", "Bearer " + bearer))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].apiKeyPrefix").value(apiKey.substring(0, 12)))
                    .andReturn().getResponse().getContentAsString();
            assertThat(body).doesNotContain(apiKey).doesNotContain(secret);
        }
    }

    // ── Payload validation ───────────────────────────────────────────────────

    @Nested
    class Validation {

        @Test
        void emptyUpdatesListIsRejected() throws Exception {
            mvc.perform(signedWebhook(apiKey, secret, event(unique("evt"), Instant.now(), List.of())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Lista updates është bosh"));
        }

        @Test
        void missingEventIdIsRejected() throws Exception {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sentAt", Instant.now().toString());
            payload.put("updates", List.of(Map.of("sku", KNOWN_SKU, "price", "850.00")));
            mvc.perform(signedWebhook(apiKey, secret, payload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Mungon eventId"));
        }

        @Test
        void missingSentAtIsRejected() throws Exception {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("eventId", unique("evt"));
            payload.put("updates", List.of(Map.of("sku", KNOWN_SKU, "price", "850.00")));
            mvc.perform(signedWebhook(apiKey, secret, payload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Mungon sentAt"));
        }

        @Test
        void malformedJsonIsRejectedAfterSignatureCheck() throws Exception {
            byte[] body = utf8("{not json");
            String ts = now();
            mvc.perform(webhook(apiKey, ts, webhookSignature.sign(secret, ts, body), body))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("JSON i pavlefshëm")));
        }

        @Test
        void moreThanOneThousandUpdatesIsRejected() throws Exception {
            List<Map<String, Object>> tooMany = java.util.stream.IntStream.rangeClosed(1, 1001)
                    .<Map<String, Object>>mapToObj(i -> Map.of("sku", "S" + i, "price", "1.00"))
                    .toList();
            mvc.perform(signedWebhook(apiKey, secret, event(unique("evt"), Instant.now(), tooMany)))
                    .andExpect(status().isPayloadTooLarge());
        }
    }

    // ── Applying updates ─────────────────────────────────────────────────────

    @Nested
    class Updates {

        @Test
        @DisplayName("price update on a known SKU is applied and recorded as the feed's last sync")
        void updatesKnownSku() throws Exception {
            mvc.perform(signedWebhook(apiKey, secret, priceUpdate(KNOWN_SKU, "850.00")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.duplicate").value(false))
                    .andExpect(jsonPath("$.updated").value(1))
                    .andExpect(jsonPath("$.created").value(0))
                    .andExpect(jsonPath("$.skipped").value(0));

            SellerOffer offer = offerRepository.findById(knownOfferId).orElseThrow();
            assertThat(offer.getPrice()).isEqualByComparingTo("850.00");
            assertThat(offer.getLastEventAt()).isNotNull();

            mvc.perform(get("/api/seller/feeds").header("Authorization", "Bearer " + bearer))
                    .andExpect(jsonPath("$[0].status").value("live"))
                    .andExpect(jsonPath("$[0].lastStatus").value("ok"));
        }

        @Test
        @DisplayName("same eventId twice → second call is a no-op reporting duplicate:true")
        void duplicateEventIsIgnored() throws Exception {
            String eventId = unique("evt");
            mvc.perform(signedWebhook(apiKey, secret, event(eventId, Instant.now(), priceOnly(KNOWN_SKU, "850.00"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updated").value(1));

            // Retry with a different price proves the retry is dropped, not re-applied
            mvc.perform(signedWebhook(apiKey, secret, event(eventId, Instant.now(), priceOnly(KNOWN_SKU, "1.00"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.duplicate").value(true))
                    .andExpect(jsonPath("$.eventId").value(eventId))
                    .andExpect(jsonPath("$.updated").value(0));

            assertThat(offerRepository.findById(knownOfferId).orElseThrow().getPrice())
                    .isEqualByComparingTo("850.00");
        }

        @Test
        @DisplayName("an older event arriving after a newer one is skipped, so the newest price wins")
        void outOfOrderEventIsSkipped() throws Exception {
            Instant newer = Instant.now();
            Instant older = newer.minus(10, ChronoUnit.MINUTES);

            mvc.perform(signedWebhook(apiKey, secret, event(unique("evt"), newer, priceOnly(KNOWN_SKU, "800.00"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updated").value(1));

            mvc.perform(signedWebhook(apiKey, secret, event(unique("evt"), older, priceOnly(KNOWN_SKU, "950.00"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updated").value(0))
                    .andExpect(jsonPath("$.skipped").value(1))
                    .andExpect(jsonPath("$.notes", hasItem(KNOWN_SKU + ": përditësim i vjetër, u anashkalua")));

            assertThat(offerRepository.findById(knownOfferId).orElseThrow().getPrice())
                    .isEqualByComparingTo("800.00");

            // A skip marks the feed's last status as partial so the seller sees it
            mvc.perform(get("/api/seller/feeds").header("Authorization", "Bearer " + bearer))
                    .andExpect(jsonPath("$[0].lastStatus").value("partial"));
        }

        @Test
        @DisplayName("unknown SKU with only a price cannot be created → skipped with a reason")
        void unknownSkuWithoutDetailsIsSkipped() throws Exception {
            String sku = unique("NEW");
            mvc.perform(signedWebhook(apiKey, secret, priceUpdate(sku, "10.00")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.created").value(0))
                    .andExpect(jsonPath("$.skipped").value(1))
                    .andExpect(jsonPath("$.notes", hasItem(
                            sku + ": i panjohur, mungojnë emri/linku/çmimi për t'u krijuar")));
            assertThat(offerRepository.findBySellerIdAndSku(sellerIdFromToken(), sku)).isEmpty();
        }

        @Test
        @DisplayName("unknown SKU with name + productUrl + price is created; later price-only call keeps the rest")
        void unknownSkuWithDetailsIsCreatedAndPartialUpdateKeepsFields() throws Exception {
            String sku = unique("NEW");
            String url = "https://shop.test/" + sku;
            Map<String, Object> full = new LinkedHashMap<>();
            full.put("sku", sku);
            full.put("name", "Dyson V15 Detect");
            full.put("brand", "Dyson");
            full.put("category", "Pajisje shtëpiake");
            full.put("price", "649.00");
            full.put("productUrl", url);
            full.put("inStock", true);

            mvc.perform(signedWebhook(apiKey, secret, event(unique("evt"), Instant.now(), List.of(full))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.created").value(1))
                    .andExpect(jsonPath("$.updated").value(0))
                    .andExpect(jsonPath("$.skipped").value(0));

            List<SellerOffer> created = offerRepository.findBySellerIdAndSku(sellerIdFromToken(), sku);
            assertThat(created).hasSize(1);
            assertThat(created.get(0).getFeedId()).isEqualTo(feedId);
            assertThat(created.get(0).getCurrency()).isEqualTo("EUR");

            long productId = publicProductId("Dyson V15 Detect", url);
            assertThat(publicPrice(productId)).isEqualByComparingTo("649.00");

            mvc.perform(signedWebhook(apiKey, secret, event(unique("evt"), Instant.now(), priceOnly(sku, "599.00"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updated").value(1));

            assertThat(publicPrice(productId))
                    .as("the cached product page must show the price the webhook just wrote")
                    .isEqualByComparingTo("599.00");

            SellerOffer after = offerRepository.findBySellerIdAndSku(sellerIdFromToken(), sku).get(0);
            assertThat(after.getPrice()).isEqualByComparingTo("599.00");
            assertThat(after.getName()).isEqualTo("Dyson V15 Detect");
            assertThat(after.getBrand()).isEqualTo("Dyson");
            assertThat(after.getProductUrl()).isEqualTo(url);
        }

        @Test
        @DisplayName("inStock=false and availability are applied without touching the price")
        void stockOnlyUpdate() throws Exception {
            Map<String, Object> update = Map.of("sku", KNOWN_SKU, "inStock", false, "availability", "out_of_stock");
            mvc.perform(signedWebhook(apiKey, secret, event(unique("evt"), Instant.now(), List.of(update))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updated").value(1));

            SellerOffer offer = offerRepository.findById(knownOfferId).orElseThrow();
            assertThat(offer.isInStock()).isFalse();
            assertThat(offer.getAvailability()).isEqualTo("out_of_stock");
            assertThat(offer.getPrice()).isEqualByComparingTo("899.00");
        }

        @Test
        @DisplayName("a row without a SKU is skipped and the others in the same event still apply")
        void rowWithoutSkuIsSkippedIndependently() throws Exception {
            List<Map<String, Object>> updates = List.of(
                    Map.of("price", "5.00"),
                    Map.of("sku", KNOWN_SKU, "price", "870.00"));
            mvc.perform(signedWebhook(apiKey, secret, event(unique("evt"), Instant.now(), updates)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updated").value(1))
                    .andExpect(jsonPath("$.skipped").value(1))
                    .andExpect(jsonPath("$.notes", hasItem("Rresht pa SKU")));
        }

        @Test
        @DisplayName("another seller's key cannot touch this seller's SKU — same SKU is simply unknown to them")
        void skuMatchingIsScopedToTheSeller() throws Exception {
            String otherBearer = registerSeller(unique("other") + "@dyqan.test");
            JsonNode other = json.readTree(mvc.perform(post("/api/seller/feeds/api-key")
                            .header("Authorization", "Bearer " + otherBearer))
                    .andReturn().getResponse().getContentAsString());

            mvc.perform(signedWebhook(
                            other.get("apiKey").asString(),
                            other.get("signingSecret").asString(),
                            priceUpdate(KNOWN_SKU, "1.00")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.updated").value(0))
                    .andExpect(jsonPath("$.skipped").value(1));

            assertPriceUnchanged();
        }

        @Test
        @DisplayName("a seller's own key never sees events from a different feed id (event ids are per feed)")
        void eventIdsAreScopedPerFeed() throws Exception {
            String otherBearer = registerSeller(unique("other") + "@dyqan.test");
            JsonNode other = json.readTree(mvc.perform(post("/api/seller/feeds/api-key")
                            .header("Authorization", "Bearer " + otherBearer))
                    .andReturn().getResponse().getContentAsString());

            String sharedEventId = unique("evt");
            mvc.perform(signedWebhook(apiKey, secret, event(sharedEventId, Instant.now(), priceOnly(KNOWN_SKU, "850.00"))))
                    .andExpect(jsonPath("$.duplicate").value(false));
            mvc.perform(signedWebhook(
                            other.get("apiKey").asString(),
                            other.get("signingSecret").asString(),
                            event(sharedEventId, Instant.now(), priceOnly("X", "1.00"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.duplicate").value(false));
        }

        @Test
        @DisplayName("notes are capped so a huge bad batch cannot blow up the response")
        void notesAreCapped() throws Exception {
            List<Map<String, Object>> unknowns = java.util.stream.IntStream.rangeClosed(1, 50)
                    .<Map<String, Object>>mapToObj(i -> Map.of("sku", unique("U" + i), "price", "1.00"))
                    .toList();
            mvc.perform(signedWebhook(apiKey, secret, event(unique("evt"), Instant.now(), unknowns)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.skipped").value(50))
                    .andExpect(jsonPath("$.notes", hasSize(20)))
                    .andExpect(jsonPath("$.notes", not(hasSize(50))));
        }
    }

    // ── Fixture helpers ──────────────────────────────────────────────────────

    private Long sellerIdFromToken() throws Exception {
        String me = mvc.perform(get("/api/seller/me").header("Authorization", "Bearer " + bearer))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(me).get("id").asLong();
    }

    private void assertPriceUnchanged() {
        assertThat(offerRepository.findById(knownOfferId).orElseThrow().getPrice())
                .isEqualByComparingTo("899.00");
    }

    private static String now() {
        return String.valueOf(Instant.now().getEpochSecond());
    }

    private static Map<String, Object> priceUpdate(String sku, String price) {
        return event(unique("evt"), Instant.now(), priceOnly(sku, price));
    }

    private static List<Map<String, Object>> priceOnly(String sku, String price) {
        return List.of(Map.of("sku", sku, "price", price));
    }

    private long publicProductId(String query, String productUrl) throws Exception {
        String body = mvc.perform(get("/api/products/search").param("q", query))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        for (JsonNode item : json.readTree(body)) {
            for (JsonNode offer : item.get("offers")) {
                if (productUrl.equals(offer.get("productUrl").asString())) {
                    return offer.get("id").asLong();
                }
            }
        }
        throw new AssertionError("product not on the public catalog: " + productUrl);
    }

    private BigDecimal publicPrice(long productId) throws Exception {
        String body = mvc.perform(get("/api/products/" + productId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return new BigDecimal(json.readTree(body).get("price").asString());
    }

    private static Map<String, Object> event(String eventId, Instant sentAt, List<?> updates) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventId", eventId);
        payload.put("sentAt", sentAt.toString());
        payload.put("updates", updates);
        return payload;
    }
}
