package com.krahaso.seller.feed.dto;

import com.krahaso.seller.feed.FeedSyncLog;

import java.io.Serializable;
import java.time.Instant;

public record FeedSyncDto(
        Long id,
        Long feedId,
        String state,
        int rowsProcessed,
        int rowsFailed,
        String errorSummary,
        Instant startedAt,
        Instant finishedAt) implements Serializable {

    public static FeedSyncDto from(FeedSyncLog log) {
        return new FeedSyncDto(
                log.getId(),
                log.getFeedId(),
                log.getState(),
                log.getRowsProcessed(),
                log.getRowsFailed(),
                log.getErrorSummary(),
                log.getStartedAt(),
                log.getFinishedAt());
    }
}
