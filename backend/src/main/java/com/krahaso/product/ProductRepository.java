package com.krahaso.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    /**
     * Full-text search over the generated search_vector column, with an ILIKE
     * fallback so partial words (e.g. "iph") still match.
     */
    @Query(value = """
            SELECT * FROM products
            WHERE search_vector @@ plainto_tsquery('simple', :query)
               OR name ILIKE '%' || :query || '%'
               OR brand ILIKE '%' || :query || '%'
            ORDER BY current_price
            LIMIT 50
            """, nativeQuery = true)
    List<Product> search(@Param("query") String query);
}
