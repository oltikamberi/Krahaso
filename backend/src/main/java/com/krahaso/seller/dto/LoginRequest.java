package com.krahaso.seller.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Email-i është i detyrueshëm")
        String contactEmail,

        @NotBlank(message = "Fjalëkalimi është i detyrueshëm")
        String password) {
}
