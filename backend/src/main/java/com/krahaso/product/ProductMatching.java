package com.krahaso.product;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Conservative merge rules: same match_key is necessary but not sufficient.
 * Listings must also share category and not conflict on identity specs.
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
        if (!specsCompatible(a.getSpecs(), b.getSpecs())) {
            return false;
        }
        return true;
    }

    static boolean specsCompatible(Map<String, Object> a, Map<String, Object> b) {
        if (a == null || a.isEmpty() || b == null || b.isEmpty()) {
            return true; // missing specs never block; conflicts do
        }
        Map<String, String> mapA = canonicalize(a);
        Map<String, String> mapB = canonicalize(b);
        for (Map.Entry<String, String> entry : mapA.entrySet()) {
            String other = mapB.get(entry.getKey());
            if (other == null || other.isBlank()) {
                continue;
            }
            String left = entry.getValue();
            if (left.equals(other) || left.contains(other) || other.contains(left)) {
                continue;
            }
            return false;
        }
        return true;
    }

    private static Map<String, String> canonicalize(Map<String, Object> specs) {
        Map<String, String> out = new HashMap<>();
        for (Map.Entry<String, Object> entry : specs.entrySet()) {
            if (entry.getValue() == null) {
                continue;
            }
            String key = canonicalKey(entry.getKey());
            String value = normalizeValue(String.valueOf(entry.getValue()));
            if (!key.isBlank() && !value.isBlank()) {
                out.put(key, value);
            }
        }
        return out;
    }

    private static String canonicalKey(String key) {
        String k = fold(key).replaceAll("[^a-z0-9]", "");
        return switch (k) {
            case "ram", "memorie" -> "ram";
            case "memorja", "memory", "storage", "disku", "disk", "ssd", "hdd" -> "storage";
            case "procesori", "processor", "cpu" -> "cpu";
            case "ekrani", "screen", "display" -> "screen";
            case "kapaciteti", "capacity" -> "capacity";
            case "rrotullime", "rpm" -> "rpm";
            case "rezolucioni", "resolution" -> "resolution";
            case "model", "modeli" -> "model";
            default -> k;
        };
    }

    private static String normalizeValue(String value) {
        String v = fold(value)
                .replaceAll("(\\d+)\\s*(gb|tb|mb)\\b", "$1$2")
                .replaceAll("[^a-z0-9]", "");
        return v;
    }

    private static String fold(String input) {
        String n = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return n.toLowerCase(Locale.ROOT);
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
