package com.smartreplyai.message.dto;

import com.smartreplyai.message.Message;
import java.time.Instant;
import java.util.UUID;

public class MessageDto {

    private UUID id;
    private UUID conversationId;
    private String senderType; // CUSTOMER, AGENT, AI, SYSTEM
    private String textContent;
    private String externalMessageId;
    private String deliveryStatus;
    private Instant createdAt;

    public MessageDto() {
    }

    public static MessageDto fromEntity(Message m) {
        MessageDto dto = new MessageDto();
        dto.setId(m.getId());
        dto.setConversationId(m.getConversation().getId());
        dto.setSenderType(m.getSenderType());
        dto.setTextContent(m.getTextContent());
        dto.setExternalMessageId(m.getExternalMessageId());
        dto.setDeliveryStatus(m.getDeliveryStatus());
        dto.setCreatedAt(m.getCreatedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getConversationId() {
        return conversationId;
    }

    public void setConversationId(UUID conversationId) {
        this.conversationId = conversationId;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
