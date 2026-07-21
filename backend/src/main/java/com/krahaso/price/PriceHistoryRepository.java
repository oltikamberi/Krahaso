package com.krahaso.price;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PriceHistoryRepository extends JpaRepository<PricePoint, Long> {

    List<PricePoint> findByProductIdOrderByScrapedAtAsc(Long productId);
}
