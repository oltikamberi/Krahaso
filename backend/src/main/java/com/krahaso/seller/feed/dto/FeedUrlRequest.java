package com.krahaso.seller.feed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FeedUrlRequest(
        @NotBlank(message = "Adresa e feed-it është e detyrueshme")
        @Size(max = 2000, message = "Adresa është shumë e gjatë")
        @Pattern(regexp = "^https?://.+", message = "Adresa duhet të fillojë me http:// ose https://")
        String feedUrl,

        /** One of the cadences the dashboard offers; null falls back to the default. */
        Integer scheduleMinutes) {
}
