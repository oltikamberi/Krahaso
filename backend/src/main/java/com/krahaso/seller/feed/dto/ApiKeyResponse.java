package com.krahaso.seller.feed.dto;

import java.io.Serializable;

/**
 * The only time these values are ever returned. The key is stored hashed and the
 * secret is not shown again, so a seller who loses them has to generate a new pair.
 */
public record ApiKeyResponse(
        Long feedId,
        String apiKey,
        String signingSecret,
        String webhookUrl) implements Serializable {
}
