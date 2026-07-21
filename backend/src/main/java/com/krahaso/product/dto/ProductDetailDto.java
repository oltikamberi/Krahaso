package com.krahaso.product.dto;

import com.krahaso.product.Product;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductDetailDto(
        Long id,
        String name,
        String brand,
        String imageUrl,
        String productUrl,
        BigDecimal price,
        String currency,
        boolean inStock,
        String categorySlug,
        String categoryName,
        String providerName,
        String providerSlug,
        String providerWebsiteUrl,
        Map<String, Object> specs,
        List<PricePointDto> priceHistory
) implements Serializable {

    public static ProductDetailDto from(Product product, List<PricePointDto> priceHistory) {
        return new ProductDetailDto(
                product.getId(),
                product.getName(),
                product.getBrand(),
                product.getImageUrl(),
                product.getProductUrl(),
                product.getCurrentPrice(),
                product.getCurrency(),
                product.isInStock(),
                product.getCategory().getSlug(),
                product.getCategory().getName(),
                product.getProvider().getName(),
                product.getProvider().getSlug(),
                product.getProvider().getWebsiteUrl(),
                product.getSpecs(),
                priceHistory
        );
    }
}
