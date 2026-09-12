package com.krahaso.seller;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SellerRepository extends JpaRepository<Seller, Long> {

    Optional<Seller> findByContactEmail(String contactEmail);

    boolean existsByContactEmail(String contactEmail);
}
