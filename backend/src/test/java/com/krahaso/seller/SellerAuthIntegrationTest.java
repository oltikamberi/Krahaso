package com.krahaso.seller;

import com.krahaso.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.JsonNode;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Seller registration, login and the bearer-token guard on /api/seller/**.
 * These are the gates in front of every other seller feature, so they are
 * tested against the real security filter chain rather than in isolation.
 */
class SellerAuthIntegrationTest extends IntegrationTestBase {

    @Autowired
    private SellerRepository sellerRepository;

    @Test
    @DisplayName("register → 201, unverified, password stored as a BCrypt hash, email normalised")
    void registerCreatesUnverifiedSellerWithHashedPassword() throws Exception {
        String email = unique("Reg") + "@Dyqan.Test";

        postJson("/api/seller/register", Map.of(
                "businessName", "  Dyqani Test  ",
                "taxId", "810123456",
                "contactEmail", email,
                "password", "supersecret1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.expiresInSeconds").isNumber())
                .andExpect(jsonPath("$.seller.verified").value(false))
                .andExpect(jsonPath("$.seller.businessName").value("Dyqani Test"))
                .andExpect(jsonPath("$.seller.contactEmail").value(email.toLowerCase()))
                .andExpect(jsonPath("$.seller.passwordHash").doesNotExist());

        Seller stored = sellerRepository.findByContactEmail(email.toLowerCase()).orElseThrow();
        assertThat(stored.getPasswordHash())
                .as("bcrypt hash, never the plain password")
                .startsWith("$2")
                .doesNotContain("supersecret1");
        assertThat(stored.isVerified()).isFalse();
    }

    @Test
    void registerRejectsShortPasswordWithValidationMessage() throws Exception {
        postJson("/api/seller/register", Map.of(
                "businessName", "Dyqani",
                "taxId", "1",
                "contactEmail", unique("short") + "@dyqan.test",
                "password", "short"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Fjalëkalimi duhet të ketë së paku 8 karaktere"));
    }

    @Test
    void registerRejectsInvalidEmail() throws Exception {
        postJson("/api/seller/register", Map.of(
                "businessName", "Dyqani",
                "taxId", "1",
                "contactEmail", "not-an-email",
                "password", "supersecret1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email-i nuk është valid"));
    }

    @Test
    @DisplayName("same email twice → 409, case-insensitively")
    void registerRejectsDuplicateEmail() throws Exception {
        String email = unique("dup") + "@dyqan.test";
        registerSeller(email);

        postJson("/api/seller/register", Map.of(
                "businessName", "Tjetri",
                "taxId", "2",
                "contactEmail", email.toUpperCase(),
                "password", "supersecret1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ky email është regjistruar më parë"));
    }

    @Test
    void loginWithCorrectCredentialsReturnsTokenThatWorksOnMe() throws Exception {
        String email = unique("login") + "@dyqan.test";
        registerSeller(email);

        String body = postJson("/api/seller/login", Map.of("contactEmail", email, "password", "supersecret1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String token = json.readTree(body).get("token").asString();

        mvc.perform(get("/api/seller/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contactEmail").value(email));
    }

    @Test
    @DisplayName("wrong password and unknown email produce the identical 401 — no account enumeration")
    void loginFailuresAreIndistinguishable() throws Exception {
        String email = unique("enum") + "@dyqan.test";
        registerSeller(email);

        String wrongPassword = postJson("/api/seller/login", Map.of("contactEmail", email, "password", "wrong-password"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String unknownEmail = postJson("/api/seller/login", Map.of("contactEmail", unique("nobody") + "@dyqan.test", "password", "supersecret1"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        assertThat(wrongPassword).isEqualTo(unknownEmail);
        assertThat(json.readTree(wrongPassword).get("message").asString()).isEqualTo("Email ose fjalëkalim i pasaktë");
    }

    @Test
    void protectedEndpointsRejectMissingToken() throws Exception {
        mvc.perform(get("/api/seller/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/seller/feeds")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/seller/feeds/api-key")).andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointsRejectGarbageToken() throws Exception {
        mvc.perform(get("/api/seller/me").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/seller/me").header("Authorization", "Basic d2hhdDpldmVy"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("a seller cannot see or delete another seller's feed — it is simply not found")
    void feedsAreIsolatedBetweenSellers() throws Exception {
        String ownerBearer = registerSeller(unique("owner") + "@dyqan.test");
        String intruderBearer = registerSeller(unique("intruder") + "@dyqan.test");

        JsonNode credentials = json.readTree(mvc.perform(post("/api/seller/feeds/api-key")
                        .header("Authorization", "Bearer " + ownerBearer))
                .andReturn().getResponse().getContentAsString());
        long feedId = credentials.get("feedId").asLong();

        mvc.perform(get("/api/seller/feeds").header("Authorization", "Bearer " + intruderBearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mvc.perform(delete("/api/seller/feeds/" + feedId).header("Authorization", "Bearer " + intruderBearer))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Integrimi nuk u gjet"));

        mvc.perform(get("/api/seller/feeds/" + feedId + "/syncs/1").header("Authorization", "Bearer " + intruderBearer))
                .andExpect(status().isNotFound());

        // Still there for the owner
        mvc.perform(get("/api/seller/feeds").header("Authorization", "Bearer " + ownerBearer))
                .andExpect(jsonPath("$[0].id").value(feedId));
    }

    @Test
    @DisplayName("public catalog stays public — no token required")
    void publicCatalogIsNotBehindSellerAuth() throws Exception {
        mvc.perform(get("/api/products")).andExpect(status().isOk());
        mvc.perform(get("/api/categories")).andExpect(status().isOk());
    }
}
