package com.krahaso.product;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Conservative merge rules: same match_key is necessary but not sufficient.
 * Titles are parsed for identity specs (RAM, storage, CPU, GPU, chassis).
 * If any of those disagree, the listings are not the same product.
 */
final class ProductMatching {

    private ProductMatching() {
    }

    static List<List<Product>> partitionCompatible(List<Product> listings) {
        List<List<Product>> clusters = new ArrayList<>();
        for (Product candidate : listings) {
            boolean placed = false;
            for (List<Product> cluster : clusters) {
                if (compatibleWithCluster(candidate, cluster)) {
                    cluster.add(candidate);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                List<Product> fresh = new ArrayList<>();
                fresh.add(candidate);
                clusters.add(fresh);
            }
        }
        return clusters;
    }

    private static boolean compatibleWithCluster(Product candidate, List<Product> cluster) {
        for (Product existing : cluster) {
            if (!compatible(candidate, existing)) {
                return false;
            }
        }
        return true;
    }

    static boolean compatible(Product a, Product b) {
        if (a.getId() != null && a.getId().equals(b.getId())) {
            return true;
        }
        // Never merge across categories
        if (a.getCategory() != null && b.getCategory() != null
                && !Objects.equals(a.getCategory().getId(), b.getCategory().getId())) {
            return false;
        }
        ProductIdentity left = ProductIdentity.of(a.getName(), a.getBrand(), a.getSpecs());
        ProductIdentity right = ProductIdentity.of(b.getName(), b.getBrand(), b.getSpecs());
        return left.compatibleWith(right);
    }

    static boolean specsCompatible(Map<String, Object> a, Map<String, Object> b) {
        return ProductIdentity.specsCompatible(a, b);
    }

    /**
     * Within a compatible cluster, keep one listing per provider.
     * Prefer in-stock over OOS; among equals, keep the cheapest.
     */
    static List<Product> dedupeByProvider(List<Product> listings) {
        Map<String, Product> byProvider = new LinkedHashMap<>();
        for (Product product : listings) {
            String slug = product.getProvider().getSlug();
            Product existing = byProvider.get(slug);
            if (existing == null) {
                byProvider.put(slug, product);
                continue;
            }
            if (product.isInStock() && !existing.isInStock()) {
                byProvider.put(slug, product);
            } else if (product.isInStock() == existing.isInStock()
                    && product.getCurrentPrice().compareTo(existing.getCurrentPrice()) < 0) {
                byProvider.put(slug, product);
            }
        }
        return new ArrayList<>(byProvider.values());
    }
}
