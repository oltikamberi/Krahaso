package com.krahaso.seller.feed.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * A batch of price/stock updates pushed by a seller.
 *
 * <p>{@code eventId} makes retries safe and {@code sentAt} decides ordering, so an
 * update that overtakes a newer one on the wire is dropped rather than applied.
 */
public record WebhookRequest(
        String eventId,
        Instant sentAt,
        List<OfferUpdate> updates) implements Serializable {

    /**
     * Only the fields present are changed, so a price-only call cannot blank out a
     * product's name. The product fields are needed only when the SKU is new.
     */
    public record OfferUpdate(
            String sku,
            BigDecimal price,
            String currency,
            Boolean inStock,
            String availability,
            String name,
            String brand,
            String category,
            String productUrl,
            String imageUrl) implements Serializable {
    }
}
