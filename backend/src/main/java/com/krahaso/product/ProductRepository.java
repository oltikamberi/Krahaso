package com.krahaso.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    List<Product> findByMatchKey(String matchKey);

    /**
     * Full-text search over the generated search_vector column, with an ILIKE
     * fallback so partial words (e.g. "iph") still match.
     */
    @Query(value = """
            SELECT * FROM products
            WHERE current_price >= 50
              AND lower(name) NOT LIKE '%aksesor%'
              AND lower(name) NOT LIKE '%accessor%'
              AND lower(name) NOT LIKE '%maus%'
              AND lower(name) NOT LIKE '%çantë%'
              AND lower(name) NOT LIKE '%bateri%'
              AND lower(coalesce(brand, '')) NOT LIKE 'aksesor%'
              AND provider_id NOT IN (SELECT id FROM providers WHERE slug = 'demo')
              AND (
                   search_vector @@ plainto_tsquery('simple', :query)
                OR name ILIKE '%' || :query || '%'
                OR brand ILIKE '%' || :query || '%'
              )
            ORDER BY current_price
            LIMIT 50
            """, nativeQuery = true)
    List<Product> search(@Param("query") String query);

    @Query(value = """
            SELECT
              (SELECT count(*) FROM (
                 SELECT match_key FROM products
                 WHERE current_price >= 50
                   AND match_key IS NOT NULL AND match_key <> ''
                   AND match_key NOT LIKE 'weak %'
                   AND provider_id NOT IN (SELECT id FROM providers WHERE slug = 'demo')
                 GROUP BY match_key
                 HAVING count(DISTINCT provider_id) >= 2
              ) g) AS "productCount",
              (SELECT count(*) FROM providers WHERE slug <> 'demo') AS "storeCount",
              (SELECT count(*) FROM (
                 SELECT match_key FROM products
                 WHERE current_price >= 50 AND match_key IS NOT NULL AND match_key <> ''
                   AND match_key NOT LIKE 'weak %'
                 GROUP BY match_key HAVING count(DISTINCT provider_id) >= 2
              ) m) AS "comparableCount",
              (SELECT coalesce(round(avg(spread)), 0) FROM (
                 SELECT max(current_price) - min(current_price) AS spread
                 FROM products
                 WHERE current_price >= 50 AND match_key IS NOT NULL AND match_key <> ''
                   AND match_key NOT LIKE 'weak %'
                 GROUP BY match_key
                 HAVING count(DISTINCT provider_id) >= 2
              ) s) AS "avgSavings"
            """, nativeQuery = true)
    CatalogStatsRow catalogStats();

    interface CatalogStatsRow {
        long getProductCount();
        long getStoreCount();
        long getComparableCount();
        long getAvgSavings();
    }
}
