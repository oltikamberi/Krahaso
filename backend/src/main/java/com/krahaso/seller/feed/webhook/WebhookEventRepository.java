package com.krahaso.seller.feed.webhook;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, Long> {

    boolean existsByFeedIdAndEventId(Long feedId, String eventId);
}
