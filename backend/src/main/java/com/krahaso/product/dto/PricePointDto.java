package com.krahaso.product.dto;

import com.krahaso.price.PricePoint;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

public record PricePointDto(BigDecimal price, boolean inStock, Instant scrapedAt) implements Serializable {

    public static PricePointDto from(PricePoint pricePoint) {
        return new PricePointDto(pricePoint.getPrice(), pricePoint.isInStock(), pricePoint.getScrapedAt());
    }
}
