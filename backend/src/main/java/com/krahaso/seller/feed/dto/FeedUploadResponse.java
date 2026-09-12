package com.krahaso.seller.feed.dto;

import java.io.Serializable;

/** Returned immediately after upload — parsing continues in the background. */
public record FeedUploadResponse(Long feedId, Long syncId, String filename) implements Serializable {
}
