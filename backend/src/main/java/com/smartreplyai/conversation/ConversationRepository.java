package com.smartreplyai.conversation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Page<Conversation> findByBusinessId(UUID businessId, Pageable pageable);

    Page<Conversation> findByBusinessIdAndStatus(UUID businessId, String status, Pageable pageable);

    Optional<Conversation> findByBusinessIdAndCustomerId(UUID businessId, UUID customerId);

    Optional<Conversation> findByBusinessIdAndId(UUID businessId, UUID id);

    @Query("SELECT c FROM Conversation c JOIN c.customer cust WHERE c.business.id = :businessId " +
           "AND (LOWER(cust.name) LIKE :query OR LOWER(cust.phoneNumber) LIKE :query OR LOWER(c.lastMessageSnippet) LIKE :query)")
    Page<Conversation> searchByQuery(@Param("businessId") UUID businessId, @Param("query") String query, Pageable pageable);

    @Query("SELECT c FROM Conversation c JOIN c.customer cust WHERE c.business.id = :businessId AND c.status = :status " +
           "AND (LOWER(cust.name) LIKE :query OR LOWER(cust.phoneNumber) LIKE :query OR LOWER(c.lastMessageSnippet) LIKE :query)")
    Page<Conversation> searchByStatusAndQuery(@Param("businessId") UUID businessId, @Param("status") String status, @Param("query") String query, Pageable pageable);

    long countByBusinessId(UUID businessId);

    long countByBusinessIdAndCreatedAtBetween(UUID businessId, Instant start, Instant end);

    @Query("SELECT COUNT(c) FROM Conversation c WHERE c.business.id = :businessId AND " +
            "((c.lastMessageAt IS NOT NULL AND c.lastMessageAt >= :since) OR (c.lastMessageAt IS NULL AND c.createdAt >= :since))")
    long countRecentByBusinessId(@Param("businessId") UUID businessId, @Param("since") Instant since);
}
