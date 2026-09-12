package com.krahaso.seller.feed.webhook;

import tools.jackson.databind.ObjectMapper;
import com.krahaso.category.Category;
import com.krahaso.category.CategoryRepository;
import com.krahaso.seller.feed.FeedSyncLog;
import com.krahaso.seller.feed.FeedSyncLogRepository;
import com.krahaso.seller.feed.SellerFeed;
import com.krahaso.seller.feed.SellerFeedRepository;
import com.krahaso.seller.feed.SellerOffer;
import com.krahaso.seller.feed.SellerOfferRepository;
import com.krahaso.seller.feed.dto.WebhookRequest;
import com.krahaso.seller.feed.dto.WebhookResponse;
import com.krahaso.seller.feed.parse.CategoryMatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);
    private static final int MAX_UPDATES_PER_EVENT = 1000;
    private static final int MAX_NOTES = 20;

    private final ObjectMapper objectMapper;
    private final WebhookSignature signature;
    private final WebhookEventRepository eventRepository;
    private final SellerFeedRepository feedRepository;
    private final SellerOfferRepository offerRepository;
    private final FeedSyncLogRepository syncLogRepository;
    private final CategoryMatcher categoryMatcher;
    private final CategoryRepository categoryRepository;

    public WebhookService(
            ObjectMapper objectMapper,
            WebhookSignature signature,
            WebhookEventRepository eventRepository,
            SellerFeedRepository feedRepository,
            SellerOfferRepository offerRepository,
            FeedSyncLogRepository syncLogRepository,
            CategoryMatcher categoryMatcher,
            CategoryRepository categoryRepository) {
        this.objectMapper = objectMapper;
        this.signature = signature;
        this.eventRepository = eventRepository;
        this.feedRepository = feedRepository;
        this.offerRepository = offerRepository;
        this.syncLogRepository = syncLogRepository;
        this.categoryMatcher = categoryMatcher;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public WebhookResponse handle(byte[] rawBody, String apiKey, String timestamp, String providedSignature) {
        SellerFeed feed = authenticate(apiKey);
        signature.verify(feed.getApiSigningSecret(), timestamp, providedSignature, rawBody);

        WebhookRequest request = parse(rawBody);
        validate(request);

        if (eventRepository.existsByFeedIdAndEventId(feed.getId(), request.eventId())) {
            log.debug("Ignoring duplicate webhook event {} for feed {}", request.eventId(), feed.getId());
            return WebhookResponse.duplicate(request.eventId());
        }

        WebhookEvent event = new WebhookEvent();
        event.setFeedId(feed.getId());
        event.setEventId(request.eventId());
        eventRepository.save(event);

        return apply(feed, request);
    }

    /** The key is compared by hash, so a database leak yields no usable keys. */
    private SellerFeed authenticate(String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Mungon header " + WebhookSignature.KEY_HEADER);
        }

        return feedRepository.findByApiKeyHash(ApiKeys.hash(apiKey.trim()))
                .filter(feed -> feed.getApiSigningSecret() != null)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "API key i pavlefshëm"));
    }

    private WebhookResponse apply(SellerFeed feed, WebhookRequest request) {
        Map<String, Long> categoryIdsBySlug = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getSlug, Category::getId));

        Instant now = Instant.now();
        Instant sentAt = request.sentAt();
        List<String> notes = new ArrayList<>();
        int updated = 0;
        int created = 0;
        int skipped = 0;

        for (WebhookRequest.OfferUpdate update : request.updates()) {
            if (update.sku() == null || update.sku().isBlank()) {
                skipped++;
                note(notes, "Rresht pa SKU");
                continue;
            }

            String sku = update.sku().trim();
            List<SellerOffer> matches = offerRepository.findBySellerIdAndSku(feed.getSellerId(), sku);

            if (matches.isEmpty()) {
                if (!canCreate(update)) {
                    skipped++;
                    note(notes, sku + ": i panjohur, mungojnë emri/linku/çmimi për t'u krijuar");
                    continue;
                }
                offerRepository.save(create(feed, update, sku, sentAt, now, categoryIdsBySlug));
                created++;
                continue;
            }

            for (SellerOffer offer : matches) {
                // Out of order: an event older than the one already applied is dropped
                if (offer.getLastEventAt() != null && !sentAt.isAfter(offer.getLastEventAt())) {
                    skipped++;
                    note(notes, sku + ": përditësim i vjetër, u anashkalua");
                    continue;
                }
                merge(offer, update, sentAt, now);
                offerRepository.save(offer);
                updated++;
            }
        }

        recordSync(feed, request, updated + created, skipped, notes, now);
        return new WebhookResponse(request.eventId(), false, updated, created, skipped, notes);
    }

    /** Only fields the caller sent are touched, so a price-only call keeps the rest. */
    private void merge(SellerOffer offer, WebhookRequest.OfferUpdate update, Instant sentAt, Instant now) {
        if (update.price() != null) {
            offer.setPrice(update.price().setScale(2, RoundingMode.HALF_UP));
        }
        if (update.currency() != null && !update.currency().isBlank()) {
            offer.setCurrency(update.currency().trim().toUpperCase(Locale.ROOT));
        }
        if (update.inStock() != null) {
            offer.setInStock(update.inStock());
        }
        if (update.availability() != null && !update.availability().isBlank()) {
            offer.setAvailability(update.availability().trim());
        }
        if (update.name() != null && !update.name().isBlank()) {
            offer.setName(update.name().trim());
        }
        if (update.brand() != null && !update.brand().isBlank()) {
            offer.setBrand(update.brand().trim());
        }
        if (update.imageUrl() != null && !update.imageUrl().isBlank()) {
            offer.setImageUrl(update.imageUrl().trim());
        }
        offer.setLastEventAt(sentAt);
        offer.setUpdatedAt(now);
    }

    /** A new product needs the columns the schema insists on. */
    private boolean canCreate(WebhookRequest.OfferUpdate update) {
        return update.name() != null && !update.name().isBlank()
                && update.productUrl() != null && !update.productUrl().isBlank()
                && update.price() != null && update.price().signum() > 0;
    }

    private SellerOffer create(
            SellerFeed feed,
            WebhookRequest.OfferUpdate update,
            String sku,
            Instant sentAt,
            Instant now,
            Map<String, Long> categoryIdsBySlug) {
        SellerOffer offer = new SellerOffer();
        offer.setSellerId(feed.getSellerId());
        offer.setFeedId(feed.getId());
        offer.setSku(sku);
        offer.setName(update.name().trim());
        offer.setBrand(update.brand());
        offer.setPrice(update.price().setScale(2, RoundingMode.HALF_UP));
        offer.setCurrency(update.currency() == null
                ? "EUR"
                : update.currency().trim().toUpperCase(Locale.ROOT));
        offer.setInStock(update.inStock() == null || update.inStock());
        offer.setAvailability(update.availability());
        offer.setProductUrl(update.productUrl().trim());
        offer.setImageUrl(update.imageUrl());
        offer.setRawCategory(update.category());
        offer.setLastEventAt(sentAt);
        offer.setUpdatedAt(now);

        categoryMatcher.match(update.category(), update.name())
                .map(categoryIdsBySlug::get)
                .ifPresent(offer::setCategoryId);

        return offer;
    }

    /**
     * Webhook feeds have no schedule to miss, so "last synced" is the last event we
     * accepted — that is what drives the stale badge after a long silence.
     */
    private void recordSync(
            SellerFeed feed,
            WebhookRequest request,
            int appliedCount,
            int skipped,
            List<String> notes,
            Instant now) {
        FeedSyncLog syncLog = new FeedSyncLog();
        syncLog.setFeedId(feed.getId());
        syncLog.setSourceRef("webhook:" + request.eventId());
        syncLog.setState("applied");
        syncLog.setRowsProcessed(appliedCount);
        syncLog.setRowsFailed(skipped);
        syncLog.setErrorSummary(notes.isEmpty() ? null : String.join("; ", notes));
        syncLog.setFinishedAt(now);
        syncLogRepository.save(syncLog);

        feed.setStatus("live");
        feed.setLastSyncedAt(now);
        feed.setLastStatus(skipped > 0 ? "partial" : "ok");
        feedRepository.save(feed);
    }

    private WebhookRequest parse(byte[] rawBody) {
        try {
            return objectMapper.readValue(rawBody, WebhookRequest.class);
        } catch (Exception malformed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "JSON i pavlefshëm: " + malformed.getMessage());
        }
    }

    private void validate(WebhookRequest request) {
        if (request.eventId() == null || request.eventId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mungon eventId");
        }
        if (request.sentAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mungon sentAt");
        }
        if (request.updates() == null || request.updates().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lista updates është bosh");
        }
        if (request.updates().size() > MAX_UPDATES_PER_EVENT) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Maksimumi " + MAX_UPDATES_PER_EVENT + " përditësime për kërkesë");
        }
    }

    private void note(List<String> notes, String message) {
        if (notes.size() < MAX_NOTES) {
            notes.add(message);
        }
    }

    /** Lets the controller name the event when a concurrent retry loses the race. */
    public String eventIdOf(byte[] rawBody) {
        try {
            return objectMapper.readValue(rawBody, WebhookRequest.class).eventId();
        } catch (RuntimeException unreadable) {
            return null;
        }
    }
}
