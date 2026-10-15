package com.smartreplyai.customer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Page<Customer> findByBusinessId(UUID businessId, Pageable pageable);

    List<Customer> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

    Optional<Customer> findByBusinessIdAndId(UUID businessId, UUID id);

    Optional<Customer> findByBusinessIdAndPhoneNumber(UUID businessId, String phoneNumber);

    boolean existsByBusinessIdAndPhoneNumber(UUID businessId, String phoneNumber);

    long countByBusinessId(UUID businessId);

    long countByBusinessIdAndOptInStatus(UUID businessId, String optInStatus);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.business.id = :businessId AND LOWER(c.tagsJson) LIKE '%vip%'")
    long countVipByBusinessId(@Param("businessId") UUID businessId);

    @Query("SELECT c FROM Customer c WHERE c.business.id = :businessId AND " +
            "(LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.phoneNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Customer> searchCustomers(@Param("businessId") UUID businessId,
                                   @Param("query") String query,
                                   Pageable pageable);
}
