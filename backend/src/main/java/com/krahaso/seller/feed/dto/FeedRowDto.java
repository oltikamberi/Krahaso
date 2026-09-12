package com.krahaso.seller.feed.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public record FeedRowDto(
        int rowNumber,
        String sku,
        String name,
        String brand,
        String categorySlug,
        String rawCategory,
        BigDecimal price,
        String currency,
        Boolean inStock,
        String availability,
        String productUrl,
        String imageUrl,
        String error) implements Serializable {
}
