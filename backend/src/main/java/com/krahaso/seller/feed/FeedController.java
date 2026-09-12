package com.krahaso.seller.feed;

import com.krahaso.seller.auth.SellerPrincipal;
import com.krahaso.seller.feed.dto.FeedDto;
import com.krahaso.seller.feed.dto.FeedRowDto;
import com.krahaso.seller.feed.dto.FeedSyncDto;
import com.krahaso.seller.feed.dto.FeedUploadResponse;
import com.krahaso.seller.feed.dto.FeedUrlRequest;
import com.krahaso.seller.feed.dto.ApiKeyResponse;
import com.krahaso.seller.feed.webhook.ApiKeyService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.Serializable;
import java.util.List;

/** Every route is scoped to the authenticated seller — feeds are never shared. */
@RestController
@RequestMapping("/api/seller/feeds")
public class FeedController {

    private final FeedService feedService;
    private final FeedPollingService pollingService;
    private final ApiKeyService apiKeyService;

    public FeedController(
            FeedService feedService,
            FeedPollingService pollingService,
            ApiKeyService apiKeyService) {
        this.feedService = feedService;
        this.pollingService = pollingService;
        this.apiKeyService = apiKeyService;
    }

    public record PageResponse<T>(List<T> items, int page, int totalPages, long totalItems)
            implements Serializable {
    }

    @GetMapping
    public List<FeedDto> list(@AuthenticationPrincipal SellerPrincipal principal) {
        return feedService.listFeeds(principal.sellerId());
    }

    /** Issues a new key pair, invalidating any previous one. Shown to the seller once. */
    @PostMapping("/api-key")
    public ApiKeyResponse generateApiKey(@AuthenticationPrincipal SellerPrincipal principal) {
        return apiKeyService.generate(principal.sellerId());
    }

    @PostMapping("/url")
    public FeedDto saveUrl(
            @AuthenticationPrincipal SellerPrincipal principal,
            @Valid @RequestBody FeedUrlRequest request) {
        return feedService.saveUrlFeed(
                principal.sellerId(), request.feedUrl().trim(), request.scheduleMinutes());
    }

    /** Manual "check now" — the same poll the scheduler runs, on demand. */
    @PostMapping("/{feedId}/poll")
    public FeedDto poll(
            @AuthenticationPrincipal SellerPrincipal principal,
            @PathVariable Long feedId) {
        FeedDto feed = feedService.feed(principal.sellerId(), feedId);
        pollingService.poll(feed.id());
        return feedService.feed(principal.sellerId(), feedId);
    }

    @DeleteMapping("/{feedId}")
    public void delete(
            @AuthenticationPrincipal SellerPrincipal principal,
            @PathVariable Long feedId) {
        feedService.deleteFeed(principal.sellerId(), feedId);
    }

    @PostMapping("/upload")
    public FeedUploadResponse upload(
            @AuthenticationPrincipal SellerPrincipal principal,
            @RequestPart("file") MultipartFile file) {
        return feedService.upload(principal.sellerId(), file);
    }

    @GetMapping("/{feedId}/syncs/{syncId}")
    public FeedSyncDto sync(
            @AuthenticationPrincipal SellerPrincipal principal,
            @PathVariable Long feedId,
            @PathVariable Long syncId) {
        return feedService.sync(principal.sellerId(), feedId, syncId);
    }

    @GetMapping("/{feedId}/syncs/{syncId}/rows")
    public PageResponse<FeedRowDto> rows(
            @AuthenticationPrincipal SellerPrincipal principal,
            @PathVariable Long feedId,
            @PathVariable Long syncId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<FeedRowDto> result = feedService.previewRows(principal.sellerId(), feedId, syncId, page, size);
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getTotalPages(),
                result.getTotalElements());
    }

    @PostMapping("/{feedId}/syncs/{syncId}/confirm")
    public FeedDto confirm(
            @AuthenticationPrincipal SellerPrincipal principal,
            @PathVariable Long feedId,
            @PathVariable Long syncId) {
        return feedService.confirm(principal.sellerId(), feedId, syncId);
    }

    @DeleteMapping("/{feedId}/syncs/{syncId}")
    public void discard(
            @AuthenticationPrincipal SellerPrincipal principal,
            @PathVariable Long feedId,
            @PathVariable Long syncId) {
        feedService.discard(principal.sellerId(), feedId, syncId);
    }
}
