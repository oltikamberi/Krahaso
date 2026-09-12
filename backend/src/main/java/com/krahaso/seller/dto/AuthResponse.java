package com.krahaso.seller.dto;

import java.io.Serializable;

/** Token is stored by the frontend in an httpOnly cookie — never in browser JS. */
public record AuthResponse(String token, long expiresInSeconds, SellerDto seller) implements Serializable {
}
