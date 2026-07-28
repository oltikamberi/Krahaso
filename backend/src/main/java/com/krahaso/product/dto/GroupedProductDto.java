package com.krahaso.product.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

public record GroupedProductDto(
        String matchKey,
        String name,
        String brand,
        String imageUrl,
        String categorySlug,
        BigDecimal lowestPrice,
        String currency,
        int offerCount,
        List<ProductOfferDto> offers
) implements Serializable {
}
