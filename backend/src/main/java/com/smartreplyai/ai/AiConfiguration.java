package com.smartreplyai.ai;

import com.smartreplyai.auth.User;
import com.smartreplyai.business.Business;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_configurations")
public class AiConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false, unique = true)
    private Business business;

    @Column(name = "assistant_name", nullable = false)
    private String assistantName = "SmartReply Assistant";

    @Column(nullable = false, length = 50)
    private String tone = "PROFESSIONAL";

    @Column(name = "greeting_message", columnDefinition = "TEXT")
    private String greetingMessage = "Hello! Welcome to our service. How may I assist you today?";

    @Column(name = "fallback_message", columnDefinition = "TEXT")
    private String fallbackMessage = "I apologize, but I don't have that specific information right now. Let me connect you with one of our team members.";

    @Column(name = "confidence_threshold", nullable = false, precision = 4, scale = 2)
    private BigDecimal confidenceThreshold = new BigDecimal("0.70");

    @Column(name = "is_enabled", nullable = false)
    private boolean isEnabled = true;

    @Column(name = "max_response_tokens", nullable = false)
    private int maxResponseTokens = 250;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalation_agent_id")
    private User escalationAgent;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public AiConfiguration() {
    }

    public AiConfiguration(Business business) {
        this.business = business;
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Business getBusiness() {
        return business;
    }

    public void setBusiness(Business business) {
        this.business = business;
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

    public String getGreetingMessage() {
        return greetingMessage;
    }

    public void setGreetingMessage(String greetingMessage) {
        this.greetingMessage = greetingMessage;
    }

    public String getFallbackMessage() {
        return fallbackMessage;
    }

    public void setFallbackMessage(String fallbackMessage) {
        this.fallbackMessage = fallbackMessage;
    }

    public BigDecimal getConfidenceThreshold() {
        return confidenceThreshold;
    }

    public void setConfidenceThreshold(BigDecimal confidenceThreshold) {
        this.confidenceThreshold = confidenceThreshold;
    }

    public boolean isEnabled() {
        return isEnabled;
    }

    public void setEnabled(boolean enabled) {
        isEnabled = enabled;
    }

    public int getMaxResponseTokens() {
        return maxResponseTokens;
    }

    public void setMaxResponseTokens(int maxResponseTokens) {
        this.maxResponseTokens = maxResponseTokens;
    }

    public User getEscalationAgent() {
        return escalationAgent;
    }

    public void setEscalationAgent(User escalationAgent) {
        this.escalationAgent = escalationAgent;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
