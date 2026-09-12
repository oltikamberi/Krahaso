package com.krahaso.seller;

import com.krahaso.seller.auth.SellerPrincipal;
import com.krahaso.seller.auth.SellerTokenService;
import com.krahaso.seller.dto.AuthResponse;
import com.krahaso.seller.dto.LoginRequest;
import com.krahaso.seller.dto.RegisterRequest;
import com.krahaso.seller.dto.SellerDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller")
public class SellerAuthController {

    private final SellerService sellerService;
    private final SellerTokenService tokenService;

    public SellerAuthController(SellerService sellerService, SellerTokenService tokenService) {
        this.sellerService = sellerService;
        this.tokenService = tokenService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authResponse(sellerService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authResponse(sellerService.authenticate(request));
    }

    @GetMapping("/me")
    public SellerDto me(@AuthenticationPrincipal SellerPrincipal principal) {
        return SellerDto.from(sellerService.requireById(principal.sellerId()));
    }

    private AuthResponse authResponse(Seller seller) {
        return new AuthResponse(
                tokenService.issue(seller),
                tokenService.ttl().toSeconds(),
                SellerDto.from(seller));
    }
}
