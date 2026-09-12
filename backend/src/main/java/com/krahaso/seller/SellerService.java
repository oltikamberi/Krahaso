package com.krahaso.seller;

import com.krahaso.seller.dto.LoginRequest;
import com.krahaso.seller.dto.RegisterRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class SellerService {

    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;

    public SellerService(SellerRepository sellerRepository, PasswordEncoder passwordEncoder) {
        this.sellerRepository = sellerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Seller register(RegisterRequest request) {
        String email = normalizeEmail(request.contactEmail());
        if (sellerRepository.existsByContactEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ky email është regjistruar më parë");
        }

        Seller seller = new Seller();
        seller.setBusinessName(request.businessName().trim());
        seller.setTaxId(request.taxId().trim());
        seller.setContactEmail(email);
        seller.setPasswordHash(passwordEncoder.encode(request.password()));
        seller.setVerified(false);
        return sellerRepository.save(seller);
    }

    /** Same error for unknown email and wrong password — avoids account enumeration. */
    public Seller authenticate(LoginRequest request) {
        return sellerRepository.findByContactEmail(normalizeEmail(request.contactEmail()))
                .filter(seller -> passwordEncoder.matches(request.password(), seller.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email ose fjalëkalim i pasaktë"));
    }

    public Seller requireById(Long id) {
        return sellerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shitësi nuk u gjet"));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
