package com.krahaso.product;

import com.krahaso.price.PriceHistoryRepository;
import com.krahaso.product.dto.PricePointDto;
import com.krahaso.product.dto.ProductDetailDto;
import com.krahaso.product.dto.ProductSummaryDto;
import jakarta.persistence.criteria.Predicate;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
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

        Sort sortOrder = switch (sort == null ? "" : sort) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "currentPrice");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "currentPrice");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        return productRepository.findAll(spec, PageRequest.of(page, size, sortOrder))
                .map(ProductSummaryDto::from);
    }

    public List<ProductSummaryDto> search(String query) {
        return productRepository.search(query).stream()
                .map(ProductSummaryDto::from)
                .toList();
    }

    @Cacheable(value = "productDetail", key = "#id")
    public ProductDetailDto findById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produkti nuk u gjet"));
        List<PricePointDto> history = priceHistoryRepository.findByProductIdOrderByScrapedAtAsc(id).stream()
                .map(PricePointDto::from)
                .toList();
        return ProductDetailDto.from(product, history);
    }

    public List<ProductDetailDto> compare(List<Long> ids) {
        if (ids.size() < 2 || ids.size() > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Krahaso 2 deri në 4 produkte");
        }
        return ids.stream().map(this::findById).toList();
    }
}
