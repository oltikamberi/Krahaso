package com.krahaso.price;

import com.krahaso.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "price_history")
public class PricePoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    private BigDecimal price;

    @Column(name = "in_stock")
    private boolean inStock;

    @Column(name = "scraped_at")
    private Instant scrapedAt;

    public Long getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public boolean isInStock() {
        return inStock;
    }

    public Instant getScrapedAt() {
        return scrapedAt;
    }
}
