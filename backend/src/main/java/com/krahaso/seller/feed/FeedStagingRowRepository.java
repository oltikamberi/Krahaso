package com.krahaso.seller.feed;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface FeedStagingRowRepository extends JpaRepository<FeedStagingRow, Long> {

    Page<FeedStagingRow> findBySyncIdOrderByRowNumberAsc(Long syncId, Pageable pageable);

    List<FeedStagingRow> findBySyncIdAndErrorIsNullOrderByRowNumberAsc(Long syncId);

    long countBySyncIdAndErrorIsNotNull(Long syncId);

    @Modifying
    @Transactional
    @Query("DELETE FROM FeedStagingRow row WHERE row.syncId = :syncId")
    void deleteBySyncId(@Param("syncId") Long syncId);
}
