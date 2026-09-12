package com.krahaso.seller.feed;

import com.krahaso.seller.feed.storage.ObjectStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Fetches a registered feed URL and hands it to the same pipeline an upload uses.
 * Deliberately not transactional: each step must be committed before the next one
 * reads it, exactly like the upload path.
 */
@Service
public class FeedPollingService {

    private static final Logger log = LoggerFactory.getLogger(FeedPollingService.class);

    private final FeedUrlFetcher fetcher;
    private final ObjectStorage storage;
    private final FeedService feedService;
    private final FeedIngestionService ingestionService;
    private final SellerFeedRepository feedRepository;
    private final FeedSyncLogRepository syncLogRepository;
    private final Duration maxBackoff;

    public FeedPollingService(
            FeedUrlFetcher fetcher,
            ObjectStorage storage,
            FeedService feedService,
            FeedIngestionService ingestionService,
            SellerFeedRepository feedRepository,
            FeedSyncLogRepository syncLogRepository,
            @Value("${krahaso.feed.max-backoff}") Duration maxBackoff) {
        this.fetcher = fetcher;
        this.storage = storage;
        this.feedService = feedService;
        this.ingestionService = ingestionService;
        this.feedRepository = feedRepository;
        this.syncLogRepository = syncLogRepository;
        this.maxBackoff = maxBackoff;
    }

    /**
     * Runs one poll. Never throws: a failing feed records its error and backs off
     * rather than taking down the scheduler run or the caller's request.
     */
    public void poll(Long feedId) {
        SellerFeed feed = feedRepository.findById(feedId).orElse(null);
        if (feed == null || feed.getFeedUrl() == null) {
            return;
        }

        Instant now = Instant.now();
        try {
            FeedUrlFetcher.FeedFetchResult result =
                    fetcher.fetch(feed.getFeedUrl(), feed.getHttpEtag(), feed.getHttpLastModified());

            if (result.notModified()) {
                log.debug("Feed {} unchanged (304)", feedId);
                recordSuccess(feedId, now, null, result, "ok");
                return;
            }

            String hash = sha256(result.content());
            if (hash.equals(feed.getContentHash())) {
                log.debug("Feed {} unchanged (same content)", feedId);
                recordSuccess(feedId, now, hash, result, "ok");
                return;
            }

            ingest(feed, result, hash, now);
        } catch (FeedUrlFetcher.FeedFetchException fetchFailure) {
            recordFailure(feedId, now, fetchFailure.getMessage());
        } catch (RuntimeException unexpected) {
            log.error("Polling feed {} failed", feedId, unexpected);
            recordFailure(feedId, now, "Përpunimi dështoi: " + unexpected.getMessage());
        }
    }

    private void ingest(SellerFeed feed, FeedUrlFetcher.FeedFetchResult result, String hash, Instant now) {
        String key = feedService.storageKey(feed.getSellerId(), feed.getId(), nameFor(feed, result));
        storage.put(key, result.content(), result.contentType());

        FeedSyncLog syncLog = feedService.startSync(feed.getId(), key);
        ingestionService.ingest(syncLog.getId(), nameFor(feed, result), result.contentType());

        FeedSyncLog parsed = syncLogRepository.findById(syncLog.getId()).orElseThrow();
        if (!"parsed".equals(parsed.getState())) {
            recordFailure(feed.getId(), now,
                    parsed.getErrorSummary() == null ? "Asnjë rresht i vlefshëm" : parsed.getErrorSummary());
            return;
        }

        // The very first poll waits for the seller to confirm the preview, so they
        // can check their columns map correctly. After that, polls publish on their own.
        boolean publishedBefore = syncLogRepository.existsByFeedIdAndState(feed.getId(), "applied");
        if (publishedBefore) {
            feedService.confirm(feed.getSellerId(), feed.getId(), parsed.getId());
        }

        recordSuccess(feed.getId(), now, hash, result, parsed.getRowsFailed() > 0 ? "partial" : "ok");
    }

    /**
     * Reloaded fresh because {@link FeedService#confirm} may have just written to the
     * same row; the copy this class started with would overwrite those changes.
     */
    private void recordSuccess(
            Long feedId,
            Instant now,
            String hash,
            FeedUrlFetcher.FeedFetchResult result,
            String status) {
        feedRepository.findById(feedId).ifPresent(feed -> {
            feed.setLastAttemptAt(now);
            feed.setLastSyncedAt(now);
            feed.setLastStatus(status);
            feed.setConsecutiveFailures(0);
            if (hash != null) {
                feed.setContentHash(hash);
            }
            if (result.etag() != null) {
                feed.setHttpEtag(result.etag());
            }
            if (result.lastModified() != null) {
                feed.setHttpLastModified(result.lastModified());
            }
            feed.setNextPollAt(now.plus(cadence(feed)));
            feedRepository.save(feed);
        });
    }

    /**
     * Offers already published stay live — a seller's site being briefly down should
     * not empty their catalogue. The stale badge and the error text carry the warning.
     */
    private void recordFailure(Long feedId, Instant now, String message) {
        feedRepository.findById(feedId).ifPresent(feed -> {
            int failures = feed.getConsecutiveFailures() + 1;
            feed.setLastAttemptAt(now);
            feed.setLastStatus("failed");
            feed.setConsecutiveFailures(failures);
            feed.setNextPollAt(now.plus(backoff(feed, failures)));
            feedRepository.save(feed);

            FeedSyncLog syncLog = new FeedSyncLog();
            syncLog.setFeedId(feedId);
            syncLog.setSourceRef(feed.getFeedUrl());
            syncLog.setState("failed");
            syncLog.setErrorSummary(message);
            syncLog.setFinishedAt(now);
            syncLogRepository.save(syncLog);
        });
        log.warn("Feed {} poll failed: {}", feedId, message);
    }

    private Duration cadence(SellerFeed feed) {
        return Duration.ofMinutes(feed.getScheduleMinutes() == null ? 360 : feed.getScheduleMinutes());
    }

    /** Doubles the wait per consecutive failure, capped so a dead feed is still retried. */
    private Duration backoff(SellerFeed feed, int failures) {
        Duration base = cadence(feed);
        Duration backoff = base.multipliedBy(1L << Math.min(failures - 1, 10));
        return backoff.compareTo(maxBackoff) > 0 ? maxBackoff : backoff;
    }

    /** Parser selection is by name, so keep the extension the URL implies. */
    private String nameFor(SellerFeed feed, FeedUrlFetcher.FeedFetchResult result) {
        String url = feed.getFeedUrl().toLowerCase();
        String contentType = result.contentType() == null ? "" : result.contentType().toLowerCase();

        if (url.contains(".csv") || url.contains(".tsv") || contentType.contains("csv")) {
            return "feed.csv";
        }
        if (url.contains(".xml") || url.contains(".rss") || contentType.contains("xml")) {
            return "feed.xml";
        }
        // Unknown: XML is self-describing, so try it and let the parser report a real error
        return "feed.xml";
    }

    private String sha256(byte[] content) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 unavailable", impossible);
        }
    }
}
