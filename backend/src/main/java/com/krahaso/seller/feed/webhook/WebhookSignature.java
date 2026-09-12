package com.krahaso.seller.feed.webhook;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Verifies the HMAC signature on an inbound webhook.
 *
 * <p>The signed value includes the timestamp, not just the body, so a captured
 * request cannot be replayed once its timestamp falls outside the tolerance window.
 * Signing the raw bytes matters: re-serializing the JSON first would change
 * whitespace and key order and break every signature.
 *
 * <pre>
 * signed_payload = timestamp + "." + raw_body
 * signature      = hex(HMAC_SHA256(signing_secret, signed_payload))
 * </pre>
 */
@Component
public class WebhookSignature {

    public static final String KEY_HEADER = "X-Krahaso-Key";
    public static final String TIMESTAMP_HEADER = "X-Krahaso-Timestamp";
    public static final String SIGNATURE_HEADER = "X-Krahaso-Signature";
    private static final String SIGNATURE_PREFIX = "sha256=";
    private static final String ALGORITHM = "HmacSHA256";

    private final Duration tolerance;

    public WebhookSignature(@Value("${krahaso.webhook.timestamp-tolerance}") Duration tolerance) {
        this.tolerance = tolerance;
    }

    public void verify(String signingSecret, String timestampHeader, String signatureHeader, byte[] body) {
        if (timestampHeader == null || timestampHeader.isBlank()) {
            throw unauthorized("Mungon header " + TIMESTAMP_HEADER);
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            throw unauthorized("Mungon header " + SIGNATURE_HEADER);
        }

        Instant sentAt = parseTimestamp(timestampHeader);
        Duration drift = Duration.between(sentAt, Instant.now()).abs();
        if (drift.compareTo(tolerance) > 0) {
            throw unauthorized("Koha e kërkesës është jashtë intervalit të lejuar");
        }

        String expected = sign(signingSecret, timestampHeader, body);
        String provided = signatureHeader.startsWith(SIGNATURE_PREFIX)
                ? signatureHeader.substring(SIGNATURE_PREFIX.length())
                : signatureHeader;

        // Constant-time compare so a wrong signature leaks nothing through timing
        if (!MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                provided.getBytes(StandardCharsets.UTF_8))) {
            throw unauthorized("Nënshkrimi është i pavlefshëm");
        }
    }

    public String sign(String signingSecret, String timestamp, byte[] body) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(signingSecret.getBytes(StandardCharsets.UTF_8), ALGORITHM));
            mac.update(timestamp.getBytes(StandardCharsets.UTF_8));
            mac.update((byte) '.');
            mac.update(body);
            return HexFormat.of().formatHex(mac.doFinal());
        } catch (GeneralSecurityException impossible) {
            throw new IllegalStateException("HMAC-SHA256 unavailable", impossible);
        }
    }

    /** Accepts unix seconds or an ISO-8601 instant, since senders differ. */
    private Instant parseTimestamp(String value) {
        try {
            return Instant.ofEpochSecond(Long.parseLong(value.trim()));
        } catch (NumberFormatException notEpochSeconds) {
            try {
                return Instant.parse(value.trim());
            } catch (RuntimeException notIso) {
                throw unauthorized("Header " + TIMESTAMP_HEADER + " nuk lexohet");
            }
        }
    }

    private ResponseStatusException unauthorized(String reason) {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, reason);
    }
}
