package com.krahaso.seller.feed;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeedSyncLogRepository extends JpaRepository<FeedSyncLog, Long> {

    Optional<FeedSyncLog> findByIdAndFeedId(Long id, Long feedId);

    List<FeedSyncLog> findByFeedIdOrderByStartedAtDesc(Long feedId);

    Optional<FeedSyncLog> findFirstByFeedIdAndStateInOrderByStartedAtDesc(Long feedId, List<String> states);

    /** True once a feed has published at least once, which is what gates auto-publishing. */
    boolean existsByFeedIdAndState(Long feedId, String state);
}
