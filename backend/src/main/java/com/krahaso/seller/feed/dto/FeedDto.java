package com.krahaso.seller.feed.dto;

import java.io.Serializable;
import java.time.Instant;

public record FeedDto(
        Long id,
        String type,
        String label,
        String status,
        String feedUrl,
        Integer scheduleMinutes,
        Instant lastSyncedAt,
        String lastStatus,
        boolean stale,
        long staleAfterHours,
        long offerCount,
        int lastRowsProcessed,
        int lastRowsFailed,
        String lastErrorSummary,
        /** Sync waiting for the seller to confirm the preview, if any. */
        Long pendingSyncId,
        Instant nextPollAt,
        Instant lastAttemptAt,
        int consecutiveFailures) implements Serializable {
}
