package com.krahaso.product;

import com.krahaso.price.PriceHistoryRepository;
import com.krahaso.product.dto.CatalogStatsDto;
import com.krahaso.product.dto.GroupedProductDto;
import com.krahaso.product.dto.PricePointDto;
import com.krahaso.product.dto.ProductDetailDto;
import com.krahaso.product.dto.ProductOfferDto;
import com.krahaso.product.dto.ProductSummaryDto;
import jakarta.persistence.criteria.Predicate;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    public ProductService(ProductRepository productRepository, PriceHistoryRepository priceHistoryRepository) {
        this.productRepository = productRepository;
        this.priceHistoryRepository = priceHistoryRepository;
    }

    public Page<ProductSummaryDto> findProducts(String categorySlug,
                                                BigDecimal minPrice,
                                                BigDecimal maxPrice,
                                                Boolean inStock,
                                                String sort,
                                                int page,
                                                int size) {
        return productRepository.findAll(buildSpec(categorySlug, minPrice, maxPrice, inStock),
                        PageRequest.of(page, size, sortOrder(sort)))
                .map(ProductSummaryDto::from);
    }

    /**
     * One card per product across retailers: listings that share the same
     * match_key are candidates, then split further when category / specs
     * checks disagree. Only products with 2+ in-stock stores are returned.
     * Offers are in-stock only, sorted cheapest-first.
     */
    public Page<GroupedProductDto> findGrouped(String categorySlug,
                                               BigDecimal minPrice,
                                               BigDecimal maxPrice,
                                               Boolean inStock,
                                               String sort,
                                               int page,
                                               int size) {
        List<Product> listings = productRepository.findAll(
                buildSpec(categorySlug, null, null, inStock),
                Sort.by(Sort.Direction.ASC, "currentPrice"));

        Map<String, List<Product>> byKey = new LinkedHashMap<>();
        for (Product product : listings) {
            String key = product.getMatchKey();
            if (key == null || key.isBlank() || key.startsWith("weak ")) {
                // Weak keys are not safe to cross-match — keep each listing alone
                key = "id:" + product.getId();
            }
            byKey.computeIfAbsent(key, ignored -> new ArrayList<>()).add(product);
        }

        List<GroupedProductDto> grouped = new ArrayList<>();
        for (List<Product> bucket : byKey.values()) {
            for (List<Product> cluster : ProductMatching.partitionCompatible(bucket)) {
                GroupedProductDto card = toGrouped(cluster);
                // Need 2+ in-stock retailers — nothing to compare otherwise
                if (card == null || card.offerCount() < 2) {
                    continue;
                }
                grouped.add(card);
            }
        }

        grouped = grouped.stream()
                .filter(g -> {
                    if (minPrice != null && g.lowestPrice().compareTo(minPrice) < 0) return false;
                    if (maxPrice != null && g.lowestPrice().compareTo(maxPrice) > 0) return false;
                    return true;
                })
                .sorted(groupedComparator(sort))
                .toList();

        int from = Math.min(page * size, grouped.size());
        int to = Math.min(from + size, grouped.size());
        return new PageImpl<>(grouped.subList(from, to), PageRequest.of(page, size), grouped.size());
    }

    /**
     * Builds a comparison card from in-stock retailer offers only.
     * Out-of-stock listings are excluded from comparison and from the catalog.
     */
    private GroupedProductDto toGrouped(List<Product> listings) {
        List<Product> inStock = listings.stream().filter(Product::isInStock).toList();
        List<Product> offers = ProductMatching.dedupeByProvider(inStock).stream()
                .sorted(Comparator.comparing(Product::getCurrentPrice))
                .toList();
        if (offers.isEmpty()) {
            return null;
        }

        Product cheapest = offers.getFirst();
        Product display = pickDisplayProduct(offers, cheapest);

        List<ProductOfferDto> offerDtos = offers.stream()
                .map(p -> new ProductOfferDto(
                        p.getId(),
                        p.getProvider().getName(),
                        p.getProvider().getSlug(),
                        p.getCurrentPrice(),
                        p.getCurrency(),
                        p.isInStock(),
                        p.getProductUrl(),
                        p.getImageUrl()))
                .toList();

        String key;
        if (offers.size() > 1 && cheapest.getMatchKey() != null
                && !cheapest.getMatchKey().isBlank()
                && !cheapest.getMatchKey().startsWith("weak ")) {
            key = cheapest.getMatchKey();
        } else {
            key = "id:" + cheapest.getId();
        }

        return new GroupedProductDto(
                key,
                display.getName(),
                display.getBrand(),
                display.getImageUrl(),
                display.getCategory().getSlug(),
                cheapest.getCurrentPrice(),
                cheapest.getCurrency(),
                offerDtos.size(),
                offerDtos);
    }

    /**
     * Prefer images from CDNs that allow hotlinking (Gjirafa, Buton, Aztech).
     * Neptun blocks requests that send a localhost Referer, so use it last.
     */
    private Product pickDisplayProduct(List<Product> offers, Product fallback) {
        return offers.stream()
                .filter(p -> p.getImageUrl() != null && !p.getImageUrl().isBlank())
                .min(Comparator.comparingInt(p -> imagePriority(p.getProvider().getSlug())))
                .orElse(fallback);
    }

    private static int imagePriority(String providerSlug) {
        return switch (providerSlug == null ? "" : providerSlug) {
            case "gjirafa50" -> 0;
            case "buton" -> 1;
            case "75mall" -> 2;
            case "aztech" -> 3;
            case "foleja" -> 4;
            case "neptun" -> 9;
            default -> 5;
        };
    }

    private Comparator<GroupedProductDto> groupedComparator(String sort) {
        Comparator<GroupedProductDto> byStores =
                Comparator.comparingInt(GroupedProductDto::offerCount).reversed();
        Comparator<GroupedProductDto> byPrice = Comparator.comparing(GroupedProductDto::lowestPrice);
        return switch (sort == null ? "" : sort) {
            case "price_desc" -> byPrice.reversed();
            case "price_asc" -> byPrice;
            case "newest" -> Comparator.comparing(GroupedProductDto::name);
            // Default & "best": multi-store matches first, then cheapest
            case "best", "" -> byStores.thenComparing(byPrice);
            default -> byStores.thenComparing(byPrice);
        };
    }

    private Specification<Product> buildSpec(String categorySlug,
                                             BigDecimal minPrice,
                                             BigDecimal maxPrice,
                                             Boolean inStock) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            // Hide tiny accessories / spare parts that land in main category buckets
            predicates.add(cb.greaterThanOrEqualTo(root.get("currentPrice"), BigDecimal.valueOf(50)));
            String junkPattern = "%(aksesor|accessor|kabllo|kabell|cable|mbeshtjellese|screen protector|mbrojt|"
                    + "karikues|charger|adapter|case|cover|maus|mouse|çantë|cante|bateri|battery|"
                    + "ftohës|ftohes|cooling pad|bravë|brave|lock|stand|mbajtëse|mbajtese)%";
            predicates.add(cb.not(cb.like(cb.lower(root.get("name")), junkPattern)));
            predicates.add(cb.not(cb.like(cb.lower(cb.coalesce(root.get("brand"), "")), "aksesor%")));
            // Hide seed / demo rows from the live catalog
            predicates.add(cb.notEqual(root.get("provider").get("slug"), "demo"));
            if (categorySlug != null && !categorySlug.isBlank()) {
                predicates.add(cb.equal(root.get("category").get("slug"), categorySlug));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("currentPrice"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("currentPrice"), maxPrice));
            }
            if (inStock != null) {
                predicates.add(cb.equal(root.get("inStock"), inStock));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort sortOrder(String sort) {
        return switch (sort == null ? "" : sort) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "currentPrice");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "currentPrice");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    public List<ProductSummaryDto> search(String query) {
        return productRepository.search(query).stream()
                .map(ProductSummaryDto::from)
                .toList();
    }

    public List<GroupedProductDto> searchGrouped(String query) {
        Map<String, List<Product>> byKey = new LinkedHashMap<>();
        for (Product product : productRepository.search(query)) {
            String key = product.getMatchKey();
            if (key == null || key.isBlank() || key.startsWith("weak ")) {
                key = "id:" + product.getId();
            }
            byKey.computeIfAbsent(key, ignored -> new ArrayList<>()).add(product);
        }
        List<GroupedProductDto> grouped = new ArrayList<>();
        for (List<Product> bucket : byKey.values()) {
            for (List<Product> cluster : ProductMatching.partitionCompatible(bucket)) {
                GroupedProductDto card = toGrouped(cluster);
                if (card == null || card.offerCount() < 2) {
                    continue;
                }
                grouped.add(card);
            }
        }
        return grouped.stream()
                .sorted(Comparator.comparing(GroupedProductDto::lowestPrice))
                .toList();
    }

    @Cacheable(value = "productDetail", key = "#id")
    public ProductDetailDto findById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produkti nuk u gjet"));
        List<PricePointDto> history = priceHistoryRepository.findByProductIdOrderByScrapedAtAsc(id).stream()
                .map(PricePointDto::from)
                .toList();

        List<Product> siblings;
        String matchKey = product.getMatchKey();
        if (matchKey == null || matchKey.isBlank() || matchKey.startsWith("weak ")) {
            siblings = List.of(product);
        } else {
            siblings = productRepository.findByMatchKey(matchKey).stream()
                    .filter(s -> ProductMatching.compatible(product, s))
                    .toList();
        }
        if (siblings.isEmpty()) {
            siblings = List.of(product);
        }

        // Compare in-stock retailers only — OOS offers are omitted entirely
        List<Product> inStockSiblings = siblings.stream().filter(Product::isInStock).toList();
        List<Product> offerProducts = ProductMatching.dedupeByProvider(inStockSiblings).stream()
                .sorted(Comparator.comparing(Product::getCurrentPrice))
                .toList();
        Product imageSource = pickDisplayProduct(
                offerProducts.isEmpty() ? List.of(product) : offerProducts,
                product);
        List<ProductOfferDto> offers = offerProducts.stream()
                .map(p -> new ProductOfferDto(
                        p.getId(),
                        p.getProvider().getName(),
                        p.getProvider().getSlug(),
                        p.getCurrentPrice(),
                        p.getCurrency(),
                        p.isInStock(),
                        p.getProductUrl(),
                        p.getImageUrl()))
                .toList();

        return ProductDetailDto.from(product, history, offers, imageSource.getImageUrl());
    }

    public CatalogStatsDto catalogStats() {
        ProductRepository.CatalogStatsRow row = productRepository.catalogStats();
        return new CatalogStatsDto(
                row.getProductCount(),
                row.getStoreCount(),
                row.getComparableCount(),
                row.getAvgSavings());
    }

    public List<ProductDetailDto> compare(List<Long> ids) {
        if (ids.size() < 2 || ids.size() > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Krahaso 2 deri në 4 produkte");
        }
        return ids.stream().map(this::findById).toList();
    }
}
