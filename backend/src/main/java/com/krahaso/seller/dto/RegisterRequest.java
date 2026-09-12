package com.krahaso.seller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Emri i biznesit është i detyrueshëm")
        @Size(max = 200)
        String businessName,

        @NotBlank(message = "Numri fiskal / i regjistrimit është i detyrueshëm")
        @Size(max = 60)
        String taxId,

        @NotBlank(message = "Email-i është i detyrueshëm")
        @Email(message = "Email-i nuk është valid")
        @Size(max = 200)
        String contactEmail,

        @NotBlank(message = "Fjalëkalimi është i detyrueshëm")
        @Size(min = 8, max = 100, message = "Fjalëkalimi duhet të ketë së paku 8 karaktere")
        String password) {
}
