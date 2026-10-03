package com.krahaso.seller.feed;

import com.krahaso.category.Category;
import com.krahaso.category.CategoryRepository;
import com.krahaso.product.Product;
import com.krahaso.product.ProductRepository;
import com.krahaso.provider.Provider;
import com.krahaso.provider.ProviderRepository;
import com.krahaso.seller.Seller;
import com.krahaso.seller.SellerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Promotes approved {@link SellerOffer}s into the public {@code products} table so
 * sellers appear alongside scraped retailers on the comparison pages.
 *
 * <p>Called after every publish event — file confirm, URL auto-publish, webhook
 * update — so the public catalog always reflects the latest approved prices.
 *
 * <p>Each seller maps to exactly one {@link Provider} row (slug {@code seller-{id}}).
 * Created the first time they publish; their {@code sellers.provider_id} caches the
 * reference so we skip the slug look-up on every subsequent sync.
 */
@Service
public class SellerCatalogSyncService {

    private static final Logger log = LoggerFactory.getLogger(SellerCatalogSyncService.class);

    private final SellerRepository sellerRepository;
    private final SellerOfferRepository offerRepository;
    private final ProviderRepository providerRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public SellerCatalogSyncService(
            SellerRepository sellerRepository,
            SellerOfferRepository offerRepository,
            ProviderRepository providerRepository,
            ProductRepository productRepository,
            CategoryRepository categoryRepository) {
        this.sellerRepository = sellerRepository;
        this.offerRepository = offerRepository;
        this.providerRepository = providerRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public void syncToPublicCatalog(Long sellerId) {
        Seller seller = sellerRepository.findById(sellerId).orElse(null);
        if (seller == null) {
            log.warn("syncToPublicCatalog called for unknown seller {}", sellerId);
            return;
        }

        Provider provider = resolveProvider(seller);

        Map<Long, Category> categoriesById = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, c -> c));

        List<SellerOffer> offers = offerRepository.findBySellerId(sellerId);
        int upserted = 0;

        for (SellerOffer offer : offers) {
            try {
                upsert(offer, provider, categoriesById);
                upserted++;
            } catch (Exception unexpected) {
                log.warn("Could not sync offer {} (seller {}) to public catalog: {}",
                        offer.getId(), sellerId, unexpected.getMessage());
            }
        }

        log.info("Synced {} offers for seller {} ({}) to public catalog",
                upserted, sellerId, seller.getBusinessName());
    }

    // ── internals ────────────────────────────────────────────────────────────

    private Provider resolveProvider(Seller seller) {
        if (seller.getProviderId() != null) {
            return providerRepository.findById(seller.getProviderId())
                    .orElseGet(() -> createProvider(seller));
        }
        String slug = "seller-" + seller.getId();
        return providerRepository.findBySlug(slug)
                .orElseGet(() -> {
                    Provider created = createProvider(seller);
                    seller.setProviderId(created.getId());
                    sellerRepository.save(seller);
                    return created;
                });
    }

    private Provider createProvider(Seller seller) {
        String slug = "seller-" + seller.getId();
        // Derive a best-effort website URL from the seller's contact domain
        String domain = domainOf(seller.getContactEmail());
        String websiteUrl = "https://" + domain;

        Provider provider = new Provider();
        provider.setSlug(slug);
        provider.setName(seller.getBusinessName());
        provider.setWebsiteUrl(websiteUrl);
        Provider saved = providerRepository.save(provider);

        seller.setProviderId(saved.getId());
        sellerRepository.save(seller);

        log.info("Created provider '{}' (slug={}) for seller {}",
                seller.getBusinessName(), slug, seller.getId());
        return saved;
    }

    private void upsert(SellerOffer offer, Provider provider, Map<Long, Category> categoriesById) {
        Product product = productRepository
                .findByProviderIdAndProductUrl(provider.getId(), offer.getProductUrl())
                .orElseGet(Product::new);

        boolean isNew = product.getId() == null;

        if (offer.getCategoryId() != null) {
            product.setCategory(categoriesById.get(offer.getCategoryId()));
        } else if (isNew) {
            // A product must have a category; use the first available as a fallback
            categoriesById.values().stream().findFirst().ifPresent(product::setCategory);
        }

        product.setProvider(provider);
        product.setName(offer.getName());
        product.setBrand(offer.getBrand());
        product.setImageUrl(offer.getImageUrl());
        product.setProductUrl(offer.getProductUrl());
        product.setCurrentPrice(offer.getPrice());
        product.setCurrency(offer.getCurrency() != null ? offer.getCurrency() : "EUR");
        // Offers removed from a feed stay in the table as unavailable rather than vanishing
        product.setInStock(offer.isInStock() && !"removed_from_feed".equals(offer.getAvailability()));
        product.setExternalId(offer.getSku() != null ? offer.getSku() : offer.getProductUrl());
        product.setMatchKey(matchKey(offer.getBrand(), offer.getName()));
        if (product.getSpecs() == null || isNew) {
            product.setSpecs(Map.of());
        }

        productRepository.save(product);
    }

    /**
     * Produces the same normalised key the V3 migration used to backfill existing
     * rows: lowercase, diacritics stripped, non-alphanumeric collapsed to a space,
     * and then words are sorted alphabetically so the key is order-independent.
     * Shared {@code match_key} groups the same product across all providers.
     */
    static String matchKey(String brand, String name) {
        String raw = (brand == null ? "" : brand + " ") + (name == null ? "" : name);
        String nfd = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        String normalized = nfd.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
        // Sort words so the key is stable regardless of brand/name ordering
        String[] words = normalized.split(" +");
        java.util.Arrays.sort(words);
        return String.join(" ", words);
    }

    private static String domainOf(String email) {
        if (email != null && email.contains("@")) {
            return email.substring(email.indexOf('@') + 1);
        }
        return "krahaso.com";
    }
}
