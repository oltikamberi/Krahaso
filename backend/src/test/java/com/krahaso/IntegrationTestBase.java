package com.krahaso;

import com.krahaso.seller.feed.webhook.WebhookSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Boots the real application against real Postgres, Redis and MinIO.
 *
 * <p>The containers are static singletons: they start once for the whole JVM and
 * every test class shares them, together with Spring's cached context. Tests
 * therefore share database state and must use unique emails, SKUs and event ids
 * (see {@link #unique}) rather than assuming an empty table.
 *
 * <p>Images match docker-compose.yml so nothing new has to be pulled locally.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        // Keep the poller quiet; polling has its own tests with a fake upstream
        "krahaso.feed.poll-initial-delay=24h",
        // Production posture, so the SSRF guard is what gets tested
        "krahaso.feed.allow-private-hosts=false",
        "krahaso.webhook.url=http://test.local/api/webhooks/offers",
        "logging.level.com.krahaso=WARN"
})
public abstract class IntegrationTestBase {

    @ServiceConnection
    static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:16-alpine");

    @ServiceConnection(name = "redis")
    static final GenericContainer<?> REDIS =
            new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    static final MinIOContainer MINIO = new MinIOContainer(
            DockerImageName.parse("quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z")
                    .asCompatibleSubstituteFor("minio/minio"));

    static {
        // Boot starts @ServiceConnection containers itself; MinIO has no connection
        // details type, so it is started here and wired through properties below.
        MINIO.start();
    }

    @DynamicPropertySource
    static void objectStorage(DynamicPropertyRegistry registry) {
        registry.add("krahaso.storage.endpoint", MINIO::getS3URL);
        registry.add("krahaso.storage.access-key", MINIO::getUserName);
        registry.add("krahaso.storage.secret-key", MINIO::getPassword);
        registry.add("krahaso.storage.bucket", () -> "krahaso-test-feeds");
    }

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    @Autowired
    protected WebhookSignature webhookSignature;

    // ── Helpers shared by the test classes ───────────────────────────────────

    /** Short random suffix so parallel-safe fixtures never collide across tests. */
    protected static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    protected ResultActions postJson(String path, Object body) throws Exception {
        return mvc.perform(post(path)
                .contentType("application/json")
                .content(json.writeValueAsBytes(body)));
    }

    protected ResultActions postJson(String path, Object body, String bearer) throws Exception {
        return mvc.perform(post(path)
                .header("Authorization", "Bearer " + bearer)
                .contentType("application/json")
                .content(json.writeValueAsBytes(body)));
    }

    /** Registers a fresh seller and returns the bearer token. */
    protected String registerSeller(String email) throws Exception {
        String body = postJson("/api/seller/register", Map.of(
                "businessName", "Test Dyqan " + email,
                "taxId", unique("TAX"),
                "contactEmail", email,
                "password", "supersecret1"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asString();
    }

    protected Map<String, String> readMap(ResultActions result) throws Exception {
        String body = result.andReturn().getResponse().getContentAsString();
        return json.readValue(body, json.getTypeFactory().constructMapType(Map.class, String.class, String.class));
    }

    /**
     * Builds a correctly signed webhook request — the exact work a seller's system
     * must do. Tests tamper with individual pieces to prove each check fires.
     */
    protected MockHttpServletRequestBuilder signedWebhook(
            String apiKey, String secret, Object payload) throws Exception {
        byte[] body = json.writeValueAsBytes(payload);
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        return webhook(apiKey, timestamp, webhookSignature.sign(secret, timestamp, body), body);
    }

    protected MockHttpServletRequestBuilder webhook(
            String apiKey, String timestamp, String signature, byte[] body) {
        MockHttpServletRequestBuilder request = post("/api/webhooks/offers")
                .contentType("application/json")
                .content(body);
        if (apiKey != null) request.header(WebhookSignature.KEY_HEADER, apiKey);
        if (timestamp != null) request.header(WebhookSignature.TIMESTAMP_HEADER, timestamp);
        if (signature != null) request.header(WebhookSignature.SIGNATURE_HEADER, "sha256=" + signature);
        return request;
    }

    protected static byte[] utf8(String value) {
        return value.getBytes(StandardCharsets.UTF_8);
    }
}
