package com.krahaso.seller.auth;

/** Authenticated seller, resolved from the bearer token on each request. */
public record SellerPrincipal(Long sellerId, String contactEmail) {
}
