package com.krahaso.seller.feed.webhook;

import com.krahaso.seller.feed.SellerFeed;
import com.krahaso.seller.feed.SellerFeedRepository;
import com.krahaso.seller.feed.dto.ApiKeyResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApiKeyService {

    private final SellerFeedRepository feedRepository;
    private final String webhookUrl;

    public ApiKeyService(
            SellerFeedRepository feedRepository,
            @Value("${krahaso.webhook.url}") String webhookUrl) {
        this.feedRepository = feedRepository;
        this.webhookUrl = webhookUrl;
    }

    /**
     * Issues a fresh key and signing secret, replacing any previous pair. Returns
     * them in the clear this once — only the key's hash is kept, so they cannot be
     * shown again.
     */
    @Transactional
    public ApiKeyResponse generate(Long sellerId) {
        SellerFeed feed = feedRepository.findFirstBySellerIdAndTypeOrderByIdAsc(sellerId, "api")
                .orElseGet(() -> {
                    SellerFeed created = new SellerFeed();
                    created.setSellerId(sellerId);
                    created.setType("api");
                    created.setLabel("API / Webhook");
                    created.setStatus("draft");
                    return created;
                });

        String apiKey = ApiKeys.generateKey();
        String signingSecret = ApiKeys.generateSigningSecret();

        feed.setApiKeyHash(ApiKeys.hash(apiKey));
        feed.setApiKeyPrefix(ApiKeys.displayPrefix(apiKey));
        feed.setApiSigningSecret(signingSecret);
        feedRepository.save(feed);

        return new ApiKeyResponse(feed.getId(), apiKey, signingSecret, webhookUrl);
    }
}
