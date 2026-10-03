package com.krahaso.product;

import com.krahaso.category.Category;
import com.krahaso.provider.Provider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id")
    private Provider provider;

    @Column(name = "external_id")
    private String externalId;

    private String name;

    private String brand;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "product_url")
    private String productUrl;

    @Column(name = "current_price")
    private BigDecimal currentPrice;

    private String currency;

    @Column(name = "in_stock")
    private boolean inStock;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> specs;

    @Column(name = "match_key")
    private String matchKey;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public Category getCategory() {
        return category;
    }

    public Provider getProvider() {
        return provider;
    }

    public String getExternalId() {
        return externalId;
    }

    public String getName() {
        return name;
    }

    public String getBrand() {
        return brand;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getProductUrl() {
        return productUrl;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public String getCurrency() {
        return currency;
    }

    public boolean isInStock() {
        return inStock;
    }

    public Map<String, Object> getSpecs() {
        return specs;
    }

    public String getMatchKey() {
        return matchKey;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public void setProvider(Provider provider) {
        this.provider = provider;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setProductUrl(String productUrl) {
        this.productUrl = productUrl;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public void setInStock(boolean inStock) {
        this.inStock = inStock;
    }

    public void setSpecs(Map<String, Object> specs) {
        this.specs = specs;
    }

    public void setMatchKey(String matchKey) {
        this.matchKey = matchKey;
    }
}
