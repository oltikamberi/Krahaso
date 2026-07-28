package com.krahaso.product.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public record ProductOfferDto(
        Long id,
        String providerName,
        String providerSlug,
        BigDecimal price,
        String currency,
        boolean inStock,
        String productUrl,
        String imageUrl
) implements Serializable {
}
