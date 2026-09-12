package com.krahaso.seller.feed;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SellerOfferRepository extends JpaRepository<SellerOffer, Long> {

    List<SellerOffer> findByFeedId(Long feedId);

    long countBySellerId(Long sellerId);

    long countByFeedId(Long feedId);
}
