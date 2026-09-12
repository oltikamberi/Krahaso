package com.krahaso.seller.feed;

import com.krahaso.category.Category;
import com.krahaso.category.CategoryRepository;
import com.krahaso.config.AsyncConfig;
import com.krahaso.seller.feed.parse.CategoryMatcher;
import com.krahaso.seller.feed.parse.FeedParser;
import com.krahaso.seller.feed.parse.FeedRow;
import com.krahaso.seller.feed.storage.ObjectStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * The single ingestion pipeline shared by every integration type. Whatever the
 * source is — an uploaded file, a polled URL, or a webhook payload — the bytes
 * land in object storage first and then flow through this one path: parse, map
 * fields, resolve categories, stage rows for preview.
 */
@Service
public class FeedIngestionService {

    private static final Logger log = LoggerFactory.getLogger(FeedIngestionService.class);
    private static final int ERROR_SUMMARY_LIMIT = 5;

    private final ObjectStorage storage;
    private final List<FeedParser> parsers;
    private final CategoryMatcher categoryMatcher;
    private final CategoryRepository categoryRepository;
    private final SellerFeedRepository feedRepository;
    private final FeedSyncLogRepository syncLogRepository;
    private final FeedStagingRowRepository stagingRowRepository;

    public FeedIngestionService(
            ObjectStorage storage,
            List<FeedParser> parsers,
            CategoryMatcher categoryMatcher,
            CategoryRepository categoryRepository,
            SellerFeedRepository feedRepository,
            FeedSyncLogRepository syncLogRepository,
            FeedStagingRowRepository stagingRowRepository) {
        this.storage = storage;
        this.parsers = parsers;
        this.categoryMatcher = categoryMatcher;
        this.categoryRepository = categoryRepository;
        this.feedRepository = feedRepository;
        this.syncLogRepository = syncLogRepository;
        this.stagingRowRepository = stagingRowRepository;
    }

    /** Entry point for uploads: returns before the file has been parsed. */
    @Async(AsyncConfig.FEED_EXECUTOR)
    public void ingestAsync(long syncId, String sourceName, String contentType) {
        try {
            ingest(syncId, sourceName, contentType);
        } catch (RuntimeException failure) {
            log.error("Feed ingestion failed for sync {}", syncId, failure);
            markFailed(syncId, failure.getMessage());
        }
    }

    @Transactional
    public void ingest(long syncId, String sourceName, String contentType) {
        FeedSyncLog syncLog = syncLogRepository.findById(syncId)
                .orElseThrow(() -> new IllegalStateException("Unknown sync " + syncId));

        FeedParser parser = parsers.stream()
                .filter(candidate -> candidate.supports(sourceName, contentType))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Formati i skedarit nuk mbështetet: " + sourceName));

        List<FeedRow> rows = parser.parse(read(syncLog.getSourceRef()));
        Map<String, Long> categoryIdsBySlug = categoryIdsBySlug();

        List<FeedStagingRow> staged = rows.stream()
                .map(row -> toStagingRow(syncId, row, categoryIdsBySlug))
                .toList();
        stagingRowRepository.saveAll(staged);

        int failed = (int) rows.stream().filter(row -> !row.valid()).count();
        syncLog.setRowsProcessed(rows.size() - failed);
        syncLog.setRowsFailed(failed);
        syncLog.setErrorSummary(summarize(rows, failed));
        syncLog.setFinishedAt(Instant.now());
        syncLog.setState(rows.size() - failed == 0 ? "failed" : "parsed");
        syncLogRepository.save(syncLog);

        feedRepository.findById(syncLog.getFeedId()).ifPresent(feed -> {
            // Stays in review until the seller confirms the preview
            feed.setStatus(syncLog.getState().equals("failed") ? feed.getStatus() : "pending_review");
            feedRepository.save(feed);
        });
    }

    @Transactional
    public void markFailed(long syncId, String message) {
        syncLogRepository.findById(syncId).ifPresent(syncLog -> {
            syncLog.setState("failed");
            syncLog.setErrorSummary(message == null ? "Përpunimi dështoi" : message);
            syncLog.setFinishedAt(Instant.now());
            syncLogRepository.save(syncLog);
        });
    }

    private byte[] read(String sourceRef) {
        try (InputStream stream = storage.open(sourceRef)) {
            return stream.readAllBytes();
        } catch (IOException unreadable) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Skedari nuk mund të lexohet nga ruajtja", unreadable);
        }
    }

    private Map<String, Long> categoryIdsBySlug() {
        return categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getSlug, Category::getId));
    }

    private FeedStagingRow toStagingRow(long syncId, FeedRow row, Map<String, Long> categoryIdsBySlug) {
        FeedStagingRow staged = new FeedStagingRow();
        staged.setSyncId(syncId);
        staged.setRowNumber(row.rowNumber());
        staged.setSku(row.sku());
        staged.setName(row.name());
        staged.setBrand(row.brand());
        staged.setRawCategory(row.rawCategory());
        staged.setPrice(row.price());
        staged.setCurrency(row.currency());
        staged.setInStock(row.inStock());
        staged.setAvailability(row.availability());
        staged.setProductUrl(row.productUrl());
        staged.setImageUrl(row.imageUrl());
        staged.setError(row.error());

        categoryMatcher.match(row.rawCategory(), row.name())
                .map(categoryIdsBySlug::get)
                .ifPresent(staged::setCategoryId);

        return staged;
    }

    /** Groups identical row errors so the seller sees "3 rows: missing price". */
    private String summarize(List<FeedRow> rows, int failed) {
        if (failed == 0) {
            return null;
        }

        Map<String, Integer> counts = new HashMap<>();
        for (FeedRow row : rows) {
            if (!row.valid()) {
                counts.merge(row.error(), 1, Integer::sum);
            }
        }

        List<String> parts = new ArrayList<>();
        counts.entrySet().stream()
                .sorted((left, right) -> Integer.compare(right.getValue(), left.getValue()))
                .limit(ERROR_SUMMARY_LIMIT)
                .forEach(entry -> parts.add(entry.getValue() + "x " + entry.getKey()));

        if (counts.size() > ERROR_SUMMARY_LIMIT) {
            parts.add("dhe " + (counts.size() - ERROR_SUMMARY_LIMIT) + " gabime të tjera");
        }
        return String.join("; ", parts);
    }
}
