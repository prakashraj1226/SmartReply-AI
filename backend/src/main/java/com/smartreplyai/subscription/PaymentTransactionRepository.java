package com.smartreplyai.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    List<PaymentTransaction> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

    Optional<PaymentTransaction> findByBusinessIdAndOrderId(UUID businessId, String orderId);

    Optional<PaymentTransaction> findByReferenceCode(String referenceCode);

    @Query("SELECT t FROM PaymentTransaction t JOIN FETCH t.business JOIN FETCH t.plan WHERE t.status = :status ORDER BY t.createdAt ASC")
    List<PaymentTransaction> findDetailedByStatus(@Param("status") String status);
}
