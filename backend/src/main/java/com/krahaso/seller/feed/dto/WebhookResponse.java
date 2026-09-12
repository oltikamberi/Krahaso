package com.krahaso.seller.feed.dto;

import java.io.Serializable;
import java.util.List;

/**
 * @param duplicate true when this event was already processed; the call is a no-op
 * @param notes     per-SKU explanations for anything that was not applied
 */
public record WebhookResponse(
        String eventId,
        boolean duplicate,
        int updated,
        int created,
        int skipped,
        List<String> notes) implements Serializable {

    public static WebhookResponse duplicate(String eventId) {
        return new WebhookResponse(eventId, true, 0, 0, 0, List.of());
    }
}
