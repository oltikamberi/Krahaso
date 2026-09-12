package com.krahaso.seller.feed.parse;

import java.math.BigDecimal;

/**
 * One row as read from a seller feed, before the category is resolved against
 * our own categories. {@code error} is non-null when the row cannot be used.
 */
public record FeedRow(
        int rowNumber,
        String sku,
        String name,
        String brand,
        String rawCategory,
        BigDecimal price,
        String currency,
        Boolean inStock,
        String availability,
        String productUrl,
        String imageUrl,
        String error) {

    public boolean valid() {
        return error == null;
    }

    public static FeedRow invalid(int rowNumber, String rawCategory, String name, String error) {
        return new FeedRow(rowNumber, null, name, null, rawCategory, null, null, null, null, null, null, error);
    }
}
