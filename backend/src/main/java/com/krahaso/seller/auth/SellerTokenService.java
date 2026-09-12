package com.krahaso.seller.auth;

import com.krahaso.seller.Seller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

/**
 * Issues and verifies stateless HMAC-SHA256 signed tokens for seller sessions.
 * Format: base64url(sellerId:email:expiryEpochSeconds).base64url(signature)
 */
@Service
public class SellerTokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    private final byte[] secret;
    private final Duration ttl;

    public SellerTokenService(
            @Value("${krahaso.seller.token-secret}") String secret,
            @Value("${krahaso.seller.token-ttl}") Duration ttl) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.ttl = ttl;
    }

    public Duration ttl() {
        return ttl;
    }

    public String issue(Seller seller) {
        long expiresAt = Instant.now().plus(ttl).getEpochSecond();
        String payload = seller.getId() + ":" + seller.getContactEmail() + ":" + expiresAt;
        String encodedPayload = ENCODER.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encodedPayload + "." + ENCODER.encodeToString(sign(encodedPayload));
    }

    /** Returns the principal when the signature is valid and the token has not expired. */
    public Optional<SellerPrincipal> verify(String token) {
        int separator = token.lastIndexOf('.');
        if (separator <= 0 || separator == token.length() - 1) {
            return Optional.empty();
        }

        String encodedPayload = token.substring(0, separator);
        byte[] presented;
        byte[] payloadBytes;
        try {
            presented = DECODER.decode(token.substring(separator + 1));
            payloadBytes = DECODER.decode(encodedPayload);
        } catch (IllegalArgumentException malformedBase64) {
            return Optional.empty();
        }

        if (!MessageDigest.isEqual(sign(encodedPayload), presented)) {
            return Optional.empty();
        }

        // payload is sellerId:email:expiry — email itself never contains ':'
        String[] parts = new String(payloadBytes, StandardCharsets.UTF_8).split(":");
        if (parts.length != 3) {
            return Optional.empty();
        }

        try {
            if (Instant.now().getEpochSecond() > Long.parseLong(parts[2])) {
                return Optional.empty();
            }
            return Optional.of(new SellerPrincipal(Long.parseLong(parts[0]), parts[1]));
        } catch (NumberFormatException malformedPayload) {
            return Optional.empty();
        }
    }

    private byte[] sign(String encodedPayload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
            return mac.doFinal(encodedPayload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception unrecoverable) {
            throw new IllegalStateException("Unable to sign seller token", unrecoverable);
        }
    }
}
