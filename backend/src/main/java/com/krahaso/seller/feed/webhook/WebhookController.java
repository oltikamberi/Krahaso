package com.krahaso.seller.feed.webhook;

import com.krahaso.seller.feed.dto.WebhookResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Inbound webhook for seller price and stock updates. Authenticated by API key and
 * signature rather than a session, so it sits outside /api/seller/**.
 *
 * <p>The body is taken as raw bytes because the signature covers exactly what was
 * sent; re-serializing the JSON first would invalidate every signature.
 */
@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private final WebhookService webhookService;

    public WebhookController(WebhookService webhookService) {
        this.webhookService = webhookService;
    }

    @PostMapping(value = "/offers", consumes = MediaType.APPLICATION_JSON_VALUE)
    public WebhookResponse offers(
            @RequestBody byte[] rawBody,
            @RequestHeader(value = WebhookSignature.KEY_HEADER, required = false) String apiKey,
            @RequestHeader(value = WebhookSignature.TIMESTAMP_HEADER, required = false) String timestamp,
            @RequestHeader(value = WebhookSignature.SIGNATURE_HEADER, required = false) String signature) {
        try {
            return webhookService.handle(rawBody, apiKey, timestamp, signature);
        } catch (DataIntegrityViolationException concurrentRetry) {
            // Two copies of the same event arrived at once and the unique index
            // rejected the loser. Report success: the work was done by the other one.
            return WebhookResponse.duplicate(webhookService.eventIdOf(rawBody));
        }
    }
}
