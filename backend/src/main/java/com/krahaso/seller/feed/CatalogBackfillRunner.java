package com.krahaso.seller.feed;

import com.krahaso.seller.Seller;
import com.krahaso.seller.SellerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * On startup, promotes any seller offers that exist in the database but have not
 * yet been copied to the public catalog. This covers:
 * <ul>
 *   <li>Sellers who confirmed a feed before this promotion logic existed.</li>
 *   <li>Offers written while the backend was offline.</li>
 * </ul>
 * The sync is idempotent — running it again is always safe.
 */
@Component
public class CatalogBackfillRunner {

    private static final Logger log = LoggerFactory.getLogger(CatalogBackfillRunner.class);

    private final SellerRepository sellerRepository;
    private final SellerOfferRepository offerRepository;
    private final SellerCatalogSyncService catalogSyncService;

    public CatalogBackfillRunner(
            SellerRepository sellerRepository,
            SellerOfferRepository offerRepository,
            SellerCatalogSyncService catalogSyncService) {
        this.sellerRepository = sellerRepository;
        this.offerRepository = offerRepository;
        this.catalogSyncService = catalogSyncService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void backfill() {
        List<Seller> sellers = sellerRepository.findAll();
        for (Seller seller : sellers) {
            long count = offerRepository.countBySellerId(seller.getId());
            if (count == 0) {
                continue;
            }
            log.info("Backfilling {} offers for seller {} ({}) into public catalog",
                    count, seller.getId(), seller.getBusinessName());
            try {
                catalogSyncService.syncToPublicCatalog(seller.getId());
            } catch (Exception failure) {
                log.error("Backfill failed for seller {}: {}", seller.getId(), failure.getMessage(), failure);
            }
        }
    }
}
