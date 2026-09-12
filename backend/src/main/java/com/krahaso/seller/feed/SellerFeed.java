package com.krahaso.seller.feed;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.Instant;

@Entity
@Table(name = "seller_feeds")
public class SellerFeed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seller_id")
    private Long sellerId;

    private String type;

    private String label;

    @Column(name = "feed_url")
    private String feedUrl;

    @Column(name = "schedule_minutes")
    private Integer scheduleMinutes;

    @Column(name = "api_key_hash")
    private String apiKeyHash;

    private String status;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @Column(name = "last_status")
    private String lastStatus;

    @Column(name = "next_poll_at")
    private Instant nextPollAt;

    @Column(name = "last_attempt_at")
    private Instant lastAttemptAt;

    @Column(name = "consecutive_failures")
    private int consecutiveFailures;

    @Column(name = "content_hash")
    private String contentHash;

    @Column(name = "http_etag")
    private String httpEtag;

    @Column(name = "http_last_modified")
    private String httpLastModified;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Generated(event = EventType.INSERT)
    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getFeedUrl() {
        return feedUrl;
    }

    public void setFeedUrl(String feedUrl) {
        this.feedUrl = feedUrl;
    }

    public Integer getScheduleMinutes() {
        return scheduleMinutes;
    }

    public void setScheduleMinutes(Integer scheduleMinutes) {
        this.scheduleMinutes = scheduleMinutes;
    }

    public String getApiKeyHash() {
        return apiKeyHash;
    }

    public void setApiKeyHash(String apiKeyHash) {
        this.apiKeyHash = apiKeyHash;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getLastSyncedAt() {
        return lastSyncedAt;
    }

    public void setLastSyncedAt(Instant lastSyncedAt) {
        this.lastSyncedAt = lastSyncedAt;
    }

    public String getLastStatus() {
        return lastStatus;
    }

    public void setLastStatus(String lastStatus) {
        this.lastStatus = lastStatus;
    }

    public Instant getNextPollAt() {
        return nextPollAt;
    }

    public void setNextPollAt(Instant nextPollAt) {
        this.nextPollAt = nextPollAt;
    }

    public Instant getLastAttemptAt() {
        return lastAttemptAt;
    }

    public void setLastAttemptAt(Instant lastAttemptAt) {
        this.lastAttemptAt = lastAttemptAt;
    }

    public int getConsecutiveFailures() {
        return consecutiveFailures;
    }

    public void setConsecutiveFailures(int consecutiveFailures) {
        this.consecutiveFailures = consecutiveFailures;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }

    public String getHttpEtag() {
        return httpEtag;
    }

    public void setHttpEtag(String httpEtag) {
        this.httpEtag = httpEtag;
    }

    public String getHttpLastModified() {
        return httpLastModified;
    }

    public void setHttpLastModified(String httpLastModified) {
        this.httpLastModified = httpLastModified;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
