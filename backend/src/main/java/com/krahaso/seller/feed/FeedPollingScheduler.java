package com.krahaso.seller.feed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Wakes up on a fixed interval and polls the feed URLs that have come due. The
 * per-feed cadence lives on the feed itself; this only decides how often we look.
 */
@Component
public class FeedPollingScheduler {

    private static final Logger log = LoggerFactory.getLogger(FeedPollingScheduler.class);

    private final SellerFeedRepository feedRepository;
    private final FeedPollingService pollingService;

    public FeedPollingScheduler(SellerFeedRepository feedRepository, FeedPollingService pollingService) {
        this.feedRepository = feedRepository;
        this.pollingService = pollingService;
    }

    @Scheduled(
            fixedDelayString = "${krahaso.feed.poll-interval}",
            initialDelayString = "${krahaso.feed.poll-initial-delay}")
    public void pollDueFeeds() {
        List<SellerFeed> due = feedRepository.findDueUrlFeeds(Instant.now());
        if (due.isEmpty()) {
            return;
        }

        log.info("Polling {} due feed URL(s)", due.size());
        for (SellerFeed feed : due) {
            // poll() swallows its own errors so one bad feed cannot stop the rest
            pollingService.poll(feed.getId());
        }
    }
}
