package com.krahaso.seller.dto;

import com.krahaso.seller.Seller;

import java.io.Serializable;
import java.time.Instant;

public record SellerDto(
        Long id,
        String businessName,
        String taxId,
        String contactEmail,
        boolean verified,
        Instant createdAt) implements Serializable {

    public static SellerDto from(Seller seller) {
        return new SellerDto(
                seller.getId(),
                seller.getBusinessName(),
                seller.getTaxId(),
                seller.getContactEmail(),
                seller.isVerified(),
                seller.getCreatedAt());
    }
}
