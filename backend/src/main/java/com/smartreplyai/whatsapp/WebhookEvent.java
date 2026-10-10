package com.smartreplyai.whatsapp;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "webhook_events", uniqueConstraints = {
        @UniqueConstraint(name = "uk_webhook_events_event_id", columnNames = {"event_id"})
})
public class WebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(name = "event_id", nullable = false, unique = true)
    private String eventId;

    @Column(name = "payload_hash")
    private String payloadHash;

    @Column(nullable = false, length = 50)
    private String status = "PROCESSED";

    @Column(name = "processed_at", nullable = false)
    private Instant processedAt = Instant.now();

    public WebhookEvent() {
    }

    public WebhookEvent(String provider, String eventId, String payloadHash) {
        this.provider = provider;
        this.eventId = eventId;
        this.payloadHash = payloadHash;
        this.status = "PROCESSED";
        this.processedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getPayloadHash() {
        return payloadHash;
    }

    public void setPayloadHash(String payloadHash) {
        this.payloadHash = payloadHash;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }
}
