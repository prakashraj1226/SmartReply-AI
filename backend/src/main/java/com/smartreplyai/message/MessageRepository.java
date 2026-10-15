package com.smartreplyai.message;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByBusinessIdAndConversationIdOrderByCreatedAtAsc(UUID businessId, UUID conversationId);
    long countByBusinessIdAndConversationId(UUID businessId, UUID conversationId);
    java.util.Optional<Message> findByExternalMessageId(String externalMessageId);

    long countByBusinessIdAndSenderType(UUID businessId, String senderType);

    @Modifying
    @Query("DELETE FROM Message m WHERE m.business.id = :businessId AND m.conversation.id = :conversationId")
    void deleteByBusinessIdAndConversationId(@Param("businessId") UUID businessId, @Param("conversationId") UUID conversationId);
}

