package com.smartreplyai.ai.dto;

import com.smartreplyai.knowledgebase.KnowledgeArticle;
import java.util.List;
import java.util.UUID;

public class AiGenerationRequest {

    private UUID businessId;
    private String businessName;
    private String businessCategory;
    private String businessDescription;
    private String operatingHours;
    private String assistantName;
    private String tone;
    private String customerMessage;
    private List<String> conversationHistory;
    private List<KnowledgeArticle> approvedKnowledge;
    private double confidenceThreshold = 0.70;
    private String fallbackMessage;

    public AiGenerationRequest() {
    }

    public UUID getBusinessId() {
        return businessId;
    }

    public void setBusinessId(UUID businessId) {
        this.businessId = businessId;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getBusinessCategory() {
        return businessCategory;
    }

    public void setBusinessCategory(String businessCategory) {
        this.businessCategory = businessCategory;
    }

    public String getBusinessDescription() {
        return businessDescription;
    }

    public void setBusinessDescription(String businessDescription) {
        this.businessDescription = businessDescription;
    }

    public String getOperatingHours() {
        return operatingHours;
    }

    public void setOperatingHours(String operatingHours) {
        this.operatingHours = operatingHours;
    }

    public String getAssistantName() {
        return assistantName;
    }

    public void setAssistantName(String assistantName) {
        this.assistantName = assistantName;
    }

    public String getTone() {
        return tone;
    }

    public void setTone(String tone) {
        this.tone = tone;
    }

    public String getCustomerMessage() {
        return customerMessage;
    }

    public void setCustomerMessage(String customerMessage) {
        this.customerMessage = customerMessage;
    }

    public List<String> getConversationHistory() {
        return conversationHistory;
    }

    public void setConversationHistory(List<String> conversationHistory) {
        this.conversationHistory = conversationHistory;
    }

    public List<KnowledgeArticle> getApprovedKnowledge() {
        return approvedKnowledge;
    }

    public void setApprovedKnowledge(List<KnowledgeArticle> approvedKnowledge) {
        this.approvedKnowledge = approvedKnowledge;
    }

    public double getConfidenceThreshold() {
        return confidenceThreshold;
    }

    public void setConfidenceThreshold(double confidenceThreshold) {
        this.confidenceThreshold = confidenceThreshold;
    }

    public String getFallbackMessage() {
        return fallbackMessage;
    }

    public void setFallbackMessage(String fallbackMessage) {
        this.fallbackMessage = fallbackMessage;
    }
}
