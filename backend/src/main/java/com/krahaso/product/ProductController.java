package com.krahaso.product;

import com.krahaso.product.dto.CatalogStatsDto;
import com.krahaso.product.dto.GroupedProductDto;
import com.krahaso.product.dto.ProductDetailDto;
import com.krahaso.product.dto.ProductSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    public record PageResponse<T>(List<T> items, int page, int totalPages, long totalItems) implements Serializable {
    }

    @GetMapping("/stats")
    public CatalogStatsDto stats() {
        return productService.catalogStats();
    }

    /** Flat listings (one row per retailer offer) — used by admin/debug. */
    @GetMapping("/listings")
    public PageResponse<ProductSummaryDto> listings(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        Page<ProductSummaryDto> result =
                productService.findProducts(category, minPrice, maxPrice, inStock, sort, page, Math.min(size, 100));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getTotalPages(),
                result.getTotalElements());
    }

    /** Grouped catalog — one card per product, offers from all retailers. */
    @GetMapping
    public PageResponse<GroupedProductDto> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        Page<GroupedProductDto> result =
                productService.findGrouped(category, minPrice, maxPrice, inStock, sort, page, Math.min(size, 100));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getTotalPages(),
                result.getTotalElements());
    }

    @GetMapping("/search")
    public List<GroupedProductDto> search(@RequestParam("q") String query) {
        return productService.searchGrouped(query);
    }

    @GetMapping("/{id}")
    public ProductDetailDto detail(@PathVariable Long id) {
        return productService.findById(id);
    }

    @GetMapping("/compare")
    public List<ProductDetailDto> compare(@RequestParam List<Long> ids) {
        return productService.compare(ids);
    }
}
