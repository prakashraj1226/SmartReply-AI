package com.smartreplyai.whatsapp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebhookEventRepository extends JpaRepository<WebhookEvent, UUID> {

    boolean existsByEventId(String eventId);

    Optional<WebhookEvent> findByEventId(String eventId);
}
