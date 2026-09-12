package com.krahaso.seller.feed.webhook;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.Instant;

/**
 * Record that an event has been processed. Exists only to answer "have I seen this
 * one?" — what the event actually did is recorded in feed_sync_logs.
 */
@Entity
@Table(name = "webhook_events")
public class WebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "feed_id")
    private Long feedId;

    @Column(name = "event_id")
    private String eventId;

    @Generated(event = EventType.INSERT)
    @Column(name = "received_at", insertable = false, updatable = false)
    private Instant receivedAt;

    public Long getId() {
        return id;
    }

    public Long getFeedId() {
        return feedId;
    }

    public void setFeedId(Long feedId) {
        this.feedId = feedId;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }
}
