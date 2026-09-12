package com.krahaso.seller.feed;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SellerFeedRepository extends JpaRepository<SellerFeed, Long> {

    List<SellerFeed> findBySellerIdOrderByIdAsc(Long sellerId);

    Optional<SellerFeed> findByIdAndSellerId(Long id, Long sellerId);

    Optional<SellerFeed> findFirstBySellerIdAndTypeOrderByIdAsc(Long sellerId, String type);

    /** Authenticates a webhook call; the key is only ever stored hashed. */
    Optional<SellerFeed> findByApiKeyHash(String apiKeyHash);

    /** Feeds whose next scheduled poll has come due. A null next poll means never polled. */
    @Query("""
            SELECT feed FROM SellerFeed feed
            WHERE feed.type = 'url'
              AND feed.feedUrl IS NOT NULL
              AND feed.status <> 'disabled'
              AND (feed.nextPollAt IS NULL OR feed.nextPollAt <= :now)
            ORDER BY feed.nextPollAt ASC NULLS FIRST
            """)
    List<SellerFeed> findDueUrlFeeds(@Param("now") Instant now);
}
