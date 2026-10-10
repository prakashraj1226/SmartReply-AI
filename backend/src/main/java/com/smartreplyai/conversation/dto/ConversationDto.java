package com.smartreplyai.conversation.dto;

import com.smartreplyai.conversation.Conversation;
import java.time.Instant;
import java.util.UUID;

public class ConversationDto {

    private UUID id;
    private UUID businessId;
    private UUID customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String customerTags;
    private String customerNotes;
    private String channel;
    private String status;
    private int unreadCount;
    private UUID assignedAgentId;
    private String assignedAgentName;
    private boolean aiEnabled;
    private String lastMessageSnippet;
    private Instant lastMessageAt;
    private Instant createdAt;

    public ConversationDto() {
    }

    public static ConversationDto fromEntity(Conversation c) {
        ConversationDto dto = new ConversationDto();
        dto.setId(c.getId());
        dto.setBusinessId(c.getBusiness().getId());
        if (c.getCustomer() != null) {
            dto.setCustomerId(c.getCustomer().getId());
            dto.setCustomerName(c.getCustomer().getName() != null ? c.getCustomer().getName() : c.getCustomer().getPhoneNumber());
            dto.setCustomerPhone(c.getCustomer().getPhoneNumber());
            dto.setCustomerEmail(c.getCustomer().getEmail());
            dto.setCustomerTags(c.getCustomer().getTagsJson());
            dto.setCustomerNotes(c.getCustomer().getNotes());
        }
        dto.setChannel(c.getChannel());
        dto.setStatus(c.getStatus());
        dto.setUnreadCount(c.getUnreadCount());
        if (c.getAssignedAgent() != null) {
            dto.setAssignedAgentId(c.getAssignedAgent().getId());
            dto.setAssignedAgentName(c.getAssignedAgent().getFullName());
        }
        dto.setAiEnabled(c.isAiEnabled());
        dto.setLastMessageSnippet(c.getLastMessageSnippet());
        dto.setLastMessageAt(c.getLastMessageAt());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getBusinessId() {
        return businessId;
    }

    public void setBusinessId(UUID businessId) {
        this.businessId = businessId;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerTags() {
        return customerTags;
    }

    public void setCustomerTags(String customerTags) {
        this.customerTags = customerTags;
    }

    public String getCustomerNotes() {
        return customerNotes;
    }

    public void setCustomerNotes(String customerNotes) {
        this.customerNotes = customerNotes;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(int unreadCount) {
        this.unreadCount = unreadCount;
    }

    public UUID getAssignedAgentId() {
        return assignedAgentId;
    }

    public void setAssignedAgentId(UUID assignedAgentId) {
        this.assignedAgentId = assignedAgentId;
    }

    public String getAssignedAgentName() {
        return assignedAgentName;
    }

    public void setAssignedAgentName(String assignedAgentName) {
        this.assignedAgentName = assignedAgentName;
    }

    public boolean isAiEnabled() {
        return aiEnabled;
    }

    public void setAiEnabled(boolean aiEnabled) {
        this.aiEnabled = aiEnabled;
    }

    public String getLastMessageSnippet() {
        return lastMessageSnippet;
    }

    public void setLastMessageSnippet(String lastMessageSnippet) {
        this.lastMessageSnippet = lastMessageSnippet;
    }

    public Instant getLastMessageAt() {
        return lastMessageAt;
    }

    public void setLastMessageAt(Instant lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
