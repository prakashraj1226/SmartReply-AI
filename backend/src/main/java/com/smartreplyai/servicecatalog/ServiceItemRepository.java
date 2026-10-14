package com.smartreplyai.servicecatalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceItemRepository extends JpaRepository<ServiceItem, UUID> {
    List<ServiceItem> findByBusinessIdAndIsActiveTrue(UUID businessId);
    List<ServiceItem> findByBusinessId(UUID businessId);
    Optional<ServiceItem> findByBusinessIdAndId(UUID businessId, UUID id);
    List<ServiceItem> findByBusinessIdAndCategory(UUID businessId, String category);
    List<ServiceItem> findByBusinessIdAndCategoryAndIsActiveTrue(UUID businessId, String category);
    List<ServiceItem> findByBusinessIdAndBranchId(UUID businessId, UUID branchId);
    List<ServiceItem> findByBusinessIdAndBranchIdAndIsActiveTrue(UUID businessId, UUID branchId);
    long countByBusinessId(UUID businessId);
    long countByBusinessIdAndIsActiveTrue(UUID businessId);

    @Query("SELECT DISTINCT s.category FROM ServiceItem s WHERE s.business.id = :businessId AND s.category IS NOT NULL AND s.category <> ''")
    List<String> findDistinctCategoriesByBusinessId(@Param("businessId") UUID businessId);
}
