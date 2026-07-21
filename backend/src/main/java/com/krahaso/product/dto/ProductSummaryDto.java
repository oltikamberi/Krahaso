package com.krahaso.product.dto;

import com.krahaso.product.Product;

import java.io.Serializable;
import java.math.BigDecimal;

public record ProductSummaryDto(
        Long id,
        String name,
        String brand,
        String imageUrl,
        String productUrl,
        BigDecimal price,
        String currency,
        boolean inStock,
        String categorySlug,
        String providerName,
        String providerSlug
) implements Serializable {

    public static ProductSummaryDto from(Product product) {
        return new ProductSummaryDto(
                product.getId(),
                product.getName(),
                product.getBrand(),
                product.getImageUrl(),
                product.getProductUrl(),
                product.getCurrentPrice(),
                product.getCurrency(),
                product.isInStock(),
                product.getCategory().getSlug(),
                product.getProvider().getName(),
                product.getProvider().getSlug()
        );
    }
}
