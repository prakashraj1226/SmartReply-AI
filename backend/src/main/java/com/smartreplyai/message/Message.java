package com.smartreplyai.message;

import com.smartreplyai.business.Business;
import com.smartreplyai.conversation.Conversation;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(name = "sender_type", nullable = false, length = 50)
    private String senderType; // CUSTOMER, AGENT, AI, SYSTEM

    @Column(name = "text_content", columnDefinition = "TEXT", nullable = false)
    private String textContent;

    @Column(name = "external_message_id")
    private String externalMessageId;

    @Column(name = "delivery_status", nullable = false, length = 50)
    private String deliveryStatus = "SENT"; // SENT, DELIVERED, READ, FAILED

    @Column(name = "raw_payload_json", columnDefinition = "TEXT")
    private String rawPayloadJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Message() {
    }

    public Message(Conversation conversation, Business business, String senderType, String textContent) {
        this.conversation = conversation;
        this.business = business;
        this.senderType = senderType;
        this.textContent = textContent;
        this.deliveryStatus = "SENT";
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }

    public Business getBusiness() {
        return business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public String getSenderType() {
        return senderType;
    }

    public void setSenderType(String senderType) {
        this.senderType = senderType;
    }

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }

    public String getExternalMessageId() {
        return externalMessageId;
    }

    public void setExternalMessageId(String externalMessageId) {
        this.externalMessageId = externalMessageId;
    }

    public String getDeliveryStatus() {
        return deliveryStatus;
    }

    public void setDeliveryStatus(String deliveryStatus) {
        this.deliveryStatus = deliveryStatus;
    }

    public String getRawPayloadJson() {
        return rawPayloadJson;
    }

    public void setRawPayloadJson(String rawPayloadJson) {
        this.rawPayloadJson = rawPayloadJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
