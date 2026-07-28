package com.krahaso.product.dto;

import java.io.Serializable;

public record CatalogStatsDto(
        long productCount,
        long storeCount,
        long comparableCount,
        long avgSavings
) implements Serializable {
}
