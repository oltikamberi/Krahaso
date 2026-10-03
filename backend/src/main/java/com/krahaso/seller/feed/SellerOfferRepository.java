package com.krahaso.seller.feed;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SellerOfferRepository extends JpaRepository<SellerOffer, Long> {

    List<SellerOffer> findByFeedId(Long feedId);

    List<SellerOffer> findBySellerId(Long sellerId);

    /** Webhook updates address products by SKU across every feed the seller owns. */
    List<SellerOffer> findBySellerIdAndSku(Long sellerId, String sku);

    long countBySellerId(Long sellerId);

    long countByFeedId(Long feedId);
}
