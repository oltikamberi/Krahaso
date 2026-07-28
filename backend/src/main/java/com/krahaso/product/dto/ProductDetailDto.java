package com.krahaso.product.dto;

import com.krahaso.product.Product;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductDetailDto(
        Long id,
        String matchKey,
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
        List<PricePointDto> priceHistory,
        List<ProductOfferDto> offers
) implements Serializable {

    public static ProductDetailDto from(
            Product product,
            List<PricePointDto> priceHistory,
            List<ProductOfferDto> offers,
            String preferredImageUrl
    ) {
        String imageUrl = preferredImageUrl != null && !preferredImageUrl.isBlank()
                ? preferredImageUrl
                : product.getImageUrl();
        return new ProductDetailDto(
                product.getId(),
                product.getMatchKey(),
                product.getName(),
                product.getBrand(),
                imageUrl,
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
                priceHistory,
                offers
        );
    }
}
