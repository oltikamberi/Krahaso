package com.krahaso.seller.feed;

import com.krahaso.category.Category;
import com.krahaso.category.CategoryRepository;
import com.krahaso.seller.feed.dto.FeedDto;
import com.krahaso.seller.feed.dto.FeedRowDto;
import com.krahaso.seller.feed.dto.FeedSyncDto;
import com.krahaso.seller.feed.dto.FeedUploadResponse;
import com.krahaso.seller.feed.storage.ObjectStorage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FeedService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("csv", "tsv", "xml", "rss");
    private static final List<String> PREVIEWABLE_STATES = List.of("parsed");
    /** Cadences the dashboard offers: hourly, every 6h, every 12h, daily. */
    private static final Set<Integer> ALLOWED_SCHEDULES = Set.of(60, 360, 720, 1440);

    private final ObjectStorage storage;
    private final FeedIngestionService ingestionService;
    private final SellerFeedRepository feedRepository;
    private final FeedSyncLogRepository syncLogRepository;
    private final FeedStagingRowRepository stagingRowRepository;
    private final SellerOfferRepository offerRepository;
    private final CategoryRepository categoryRepository;
    private final Duration staleAfter;
    private final long maxUploadBytes;
    private final int defaultScheduleMinutes;

    public FeedService(
            ObjectStorage storage,
            FeedIngestionService ingestionService,
            SellerFeedRepository feedRepository,
            FeedSyncLogRepository syncLogRepository,
            FeedStagingRowRepository stagingRowRepository,
            SellerOfferRepository offerRepository,
            CategoryRepository categoryRepository,
            @Value("${krahaso.feed.stale-after}") Duration staleAfter,
            @Value("${krahaso.feed.max-upload-bytes}") long maxUploadBytes,
            @Value("${krahaso.feed.default-schedule-minutes}") int defaultScheduleMinutes) {
        this.storage = storage;
        this.ingestionService = ingestionService;
        this.feedRepository = feedRepository;
        this.syncLogRepository = syncLogRepository;
        this.stagingRowRepository = stagingRowRepository;
        this.offerRepository = offerRepository;
        this.categoryRepository = categoryRepository;
        this.staleAfter = staleAfter;
        this.maxUploadBytes = maxUploadBytes;
        this.defaultScheduleMinutes = defaultScheduleMinutes;
    }

    /**
     * Stores the file and hands it to the background pipeline. Intentionally not
     * wrapped in one transaction: the sync row must be committed before the async
     * worker looks it up.
     */
    public FeedUploadResponse upload(Long sellerId, MultipartFile file) {
        String filename = file.getOriginalFilename() == null ? "feed" : file.getOriginalFilename();
        validate(file, filename);

        SellerFeed feed = findOrCreateUploadFeed(sellerId);

        String key = storageKey(sellerId, feed.getId(), filename);
        try {
            storage.put(key, file.getBytes(), contentTypeOf(file));
        } catch (IOException unreadable) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Skedari nuk mund të lexohet", unreadable);
        }

        FeedSyncLog syncLog = startSync(feed.getId(), key);
        ingestionService.ingestAsync(syncLog.getId(), filename, contentTypeOf(file));

        return new FeedUploadResponse(feed.getId(), syncLog.getId(), filename);
    }

    /**
     * Opens a new ingestion attempt for a feed, dropping any earlier one that was
     * still waiting for review. Shared by uploads and polled URLs.
     */
    public FeedSyncLog startSync(Long feedId, String sourceRef) {
        supersedePendingSyncs(feedId);
        return createSyncLog(feedId, sourceRef);
    }

    public String storageKey(Long sellerId, Long feedId, String filename) {
        return "sellers/%d/feeds/%d/%s-%s".formatted(
                sellerId, feedId, UUID.randomUUID(), sanitize(filename));
    }

    /** Registers or updates the seller's feed URL. One URL feed per seller for now. */
    @Transactional
    public FeedDto saveUrlFeed(Long sellerId, String feedUrl, Integer scheduleMinutes) {
        int schedule = scheduleMinutes == null ? defaultScheduleMinutes : scheduleMinutes;
        if (!ALLOWED_SCHEDULES.contains(schedule)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Intervali nuk është i vlefshëm");
        }

        SellerFeed feed = feedRepository.findFirstBySellerIdAndTypeOrderByIdAsc(sellerId, "url")
                .orElseGet(() -> {
                    SellerFeed created = new SellerFeed();
                    created.setSellerId(sellerId);
                    created.setType("url");
                    created.setLabel("Feed URL");
                    created.setStatus("draft");
                    return created;
                });

        boolean urlChanged = !feedUrl.equals(feed.getFeedUrl());
        feed.setFeedUrl(feedUrl);
        feed.setScheduleMinutes(schedule);
        if (urlChanged) {
            // A different URL invalidates the cached validators and the failure streak
            feed.setContentHash(null);
            feed.setHttpEtag(null);
            feed.setHttpLastModified(null);
            feed.setConsecutiveFailures(0);
        }
        // Due immediately so the seller sees a result without waiting for the timer
        feed.setNextPollAt(null);

        return toDto(feedRepository.save(feed));
    }

    @Transactional(readOnly = true)
    public FeedDto feed(Long sellerId, Long feedId) {
        return toDto(requireFeed(sellerId, feedId));
    }

    /** Removes a feed along with its offers and history (cascaded by the schema). */
    @Transactional
    public void deleteFeed(Long sellerId, Long feedId) {
        feedRepository.delete(requireFeed(sellerId, feedId));
    }

    @Transactional(readOnly = true)
    public List<FeedDto> listFeeds(Long sellerId) {
        return feedRepository.findBySellerIdOrderByIdAsc(sellerId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FeedSyncDto sync(Long sellerId, Long feedId, Long syncId) {
        return FeedSyncDto.from(requireSync(sellerId, feedId, syncId));
    }

    @Transactional(readOnly = true)
    public Page<FeedRowDto> previewRows(Long sellerId, Long feedId, Long syncId, int page, int size) {
        requireSync(sellerId, feedId, syncId);

        Map<Long, String> slugsById = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, Category::getSlug));

        return stagingRowRepository
                .findBySyncIdOrderByRowNumberAsc(syncId, PageRequest.of(page, Math.min(size, 200)))
                .map(row -> toRowDto(row, slugsById));
    }

    /**
     * Publishes a previewed sync. The file is treated as the source of truth, so
     * offers that are no longer in it are marked unavailable rather than left
     * behind at a stale price.
     */
    @Transactional
    public FeedDto confirm(Long sellerId, Long feedId, Long syncId) {
        SellerFeed feed = requireFeed(sellerId, feedId);
        FeedSyncLog syncLog = requireSync(sellerId, feedId, syncId);

        if (!PREVIEWABLE_STATES.contains(syncLog.getState())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Kjo ngarkesë nuk është gati për publikim");
        }

        Map<String, SellerOffer> current = new LinkedHashMap<>();
        for (SellerOffer offer : offerRepository.findByFeedId(feedId)) {
            current.put(offer.getProductUrl(), offer);
        }

        Instant now = Instant.now();
        Map<String, SellerOffer> applied = new LinkedHashMap<>();
        for (FeedStagingRow row : stagingRowRepository.findBySyncIdAndErrorIsNullOrderByRowNumberAsc(syncId)) {
            // A feed can repeat the same URL — last row wins rather than failing the upload
            SellerOffer offer = applied.computeIfAbsent(row.getProductUrl(),
                    url -> current.getOrDefault(url, newOffer(sellerId, feedId)));
            apply(offer, row, syncId, now);
            offerRepository.save(offer);
        }

        for (Map.Entry<String, SellerOffer> entry : current.entrySet()) {
            if (!applied.containsKey(entry.getKey())) {
                SellerOffer removed = entry.getValue();
                removed.setInStock(false);
                removed.setAvailability("removed_from_feed");
                removed.setUpdatedAt(now);
                offerRepository.save(removed);
            }
        }

        syncLog.setState("applied");
        syncLog.setFinishedAt(now);
        syncLogRepository.save(syncLog);

        feed.setStatus("live");
        feed.setLastSyncedAt(now);
        feed.setLastStatus(syncLog.getRowsFailed() > 0 ? "partial" : "ok");
        feedRepository.save(feed);

        // Staged rows have become offers; the counts live on in the sync log
        stagingRowRepository.deleteBySyncId(syncId);

        return toDto(feed);
    }

    @Transactional
    public void discard(Long sellerId, Long feedId, Long syncId) {
        FeedSyncLog syncLog = requireSync(sellerId, feedId, syncId);
        syncLog.setState("discarded");
        syncLog.setFinishedAt(Instant.now());
        syncLogRepository.save(syncLog);
        stagingRowRepository.deleteBySyncId(syncId);
    }

    // The helpers below deliberately run outside a shared transaction so each write
    // is committed before the async worker starts. Repository methods carry their own.
    private SellerFeed findOrCreateUploadFeed(Long sellerId) {
        return feedRepository.findFirstBySellerIdAndTypeOrderByIdAsc(sellerId, "upload")
                .orElseGet(() -> {
                    SellerFeed feed = new SellerFeed();
                    feed.setSellerId(sellerId);
                    feed.setType("upload");
                    feed.setLabel("Ngarkim skedari");
                    feed.setStatus("draft");
                    return feedRepository.save(feed);
                });
    }

    /**
     * Only one upload can await review at a time, so any earlier one is dropped.
     * Rows staged by an older failed sync go too — they were only kept so the
     * seller could read the errors.
     */
    private void supersedePendingSyncs(Long feedId) {
        for (FeedSyncLog syncLog : syncLogRepository.findByFeedIdOrderByStartedAtDesc(feedId)) {
            String state = syncLog.getState();
            if ("parsed".equals(state) || "parsing".equals(state)) {
                syncLog.setState("discarded");
                syncLog.setFinishedAt(Instant.now());
                syncLogRepository.save(syncLog);
                stagingRowRepository.deleteBySyncId(syncLog.getId());
            } else if ("failed".equals(state)) {
                stagingRowRepository.deleteBySyncId(syncLog.getId());
            }
        }
    }

    private FeedSyncLog createSyncLog(Long feedId, String sourceRef) {
        FeedSyncLog syncLog = new FeedSyncLog();
        syncLog.setFeedId(feedId);
        syncLog.setSourceRef(sourceRef);
        syncLog.setState("parsing");
        return syncLogRepository.save(syncLog);
    }

    private SellerFeed requireFeed(Long sellerId, Long feedId) {
        return feedRepository.findByIdAndSellerId(feedId, sellerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Integrimi nuk u gjet"));
    }

    private FeedSyncLog requireSync(Long sellerId, Long feedId, Long syncId) {
        requireFeed(sellerId, feedId);
        return syncLogRepository.findByIdAndFeedId(syncId, feedId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sinkronizimi nuk u gjet"));
    }

    private SellerOffer newOffer(Long sellerId, Long feedId) {
        SellerOffer offer = new SellerOffer();
        offer.setSellerId(sellerId);
        offer.setFeedId(feedId);
        return offer;
    }

    private void apply(SellerOffer offer, FeedStagingRow row, Long syncId, Instant now) {
        offer.setSourceSyncId(syncId);
        offer.setSourceRow(row.getRowNumber());
        offer.setSku(row.getSku());
        offer.setName(row.getName());
        offer.setBrand(row.getBrand());
        offer.setCategoryId(row.getCategoryId());
        offer.setRawCategory(row.getRawCategory());
        offer.setPrice(row.getPrice());
        offer.setCurrency(row.getCurrency() == null ? "EUR" : row.getCurrency());
        offer.setInStock(Boolean.TRUE.equals(row.getInStock()));
        offer.setAvailability(row.getAvailability());
        offer.setProductUrl(row.getProductUrl());
        offer.setImageUrl(row.getImageUrl());
        offer.setUpdatedAt(now);
    }

    private FeedDto toDto(SellerFeed feed) {
        List<FeedSyncLog> syncs = syncLogRepository.findByFeedIdOrderByStartedAtDesc(feed.getId());
        FeedSyncLog latest = syncs.isEmpty() ? null : syncs.getFirst();
        Long pendingSyncId = syncs.stream()
                .filter(syncLog -> PREVIEWABLE_STATES.contains(syncLog.getState()))
                .map(FeedSyncLog::getId)
                .findFirst()
                .orElse(null);

        return new FeedDto(
                feed.getId(),
                feed.getType(),
                feed.getLabel(),
                feed.getStatus(),
                feed.getFeedUrl(),
                feed.getScheduleMinutes(),
                feed.getLastSyncedAt(),
                feed.getLastStatus(),
                isStale(feed),
                staleAfter.toHours(),
                offerRepository.countByFeedId(feed.getId()),
                latest == null ? 0 : latest.getRowsProcessed(),
                latest == null ? 0 : latest.getRowsFailed(),
                latest == null ? null : latest.getErrorSummary(),
                pendingSyncId,
                feed.getNextPollAt(),
                feed.getLastAttemptAt(),
                feed.getConsecutiveFailures(),
                feed.getApiKeyPrefix());
    }

    /** Only live feeds go stale — a draft has simply never synced. */
    private boolean isStale(SellerFeed feed) {
        if (!"live".equals(feed.getStatus())) {
            return false;
        }
        return feed.getLastSyncedAt() == null
                || feed.getLastSyncedAt().isBefore(Instant.now().minus(staleAfter));
    }

    private FeedRowDto toRowDto(FeedStagingRow row, Map<Long, String> slugsById) {
        return new FeedRowDto(
                row.getRowNumber(),
                row.getSku(),
                row.getName(),
                row.getBrand(),
                row.getCategoryId() == null ? null : slugsById.get(row.getCategoryId()),
                row.getRawCategory(),
                row.getPrice(),
                row.getCurrency(),
                row.getInStock(),
                row.getAvailability(),
                row.getProductUrl(),
                row.getImageUrl(),
                row.getError());
    }

    private void validate(MultipartFile file, String filename) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Skedari është bosh");
        }
        if (file.getSize() > maxUploadBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Skedari është më i madh se " + (maxUploadBytes / (1024 * 1024)) + " MB");
        }
        if (!ALLOWED_EXTENSIONS.contains(extensionOf(filename))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Formati nuk mbështetet. Përdor CSV ose XML.");
        }
    }

    private String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? "" : filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private String contentTypeOf(MultipartFile file) {
        return file.getContentType() == null ? "application/octet-stream" : file.getContentType();
    }

    private String sanitize(String filename) {
        return filename.replaceAll("[^A-Za-z0-9._-]", "_");
    }
}
