package com.krahaso.seller.feed.webhook;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/** Generation and hashing of webhook credentials. */
public final class ApiKeys {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;
    private static final String KEY_PREFIX = "krh_";
    private static final String SECRET_PREFIX = "krhsec_";
    /** Enough of the key to recognise it, far too little to guess the rest. */
    private static final int DISPLAY_PREFIX_LENGTH = 12;

    private ApiKeys() {
    }

    public static String generateKey() {
        return KEY_PREFIX + token();
    }

    public static String generateSigningSecret() {
        return SECRET_PREFIX + token();
    }

    public static String displayPrefix(String apiKey) {
        return apiKey.substring(0, Math.min(DISPLAY_PREFIX_LENGTH, apiKey.length()));
    }

    /**
     * API keys are high-entropy random values, so a plain SHA-256 is enough and can
     * be looked up directly by index. A slow password hash would mean a costly
     * comparison against every row on every webhook call.
     */
    public static String hash(String apiKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(apiKey.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 unavailable", impossible);
        }
    }

    private static String token() {
        byte[] bytes = new byte[TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
