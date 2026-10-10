package com.smartreplyai.settings.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.UUID;

public class AiConfigDto {
    private UUID id;

    @NotBlank(message = "Assistant name cannot be blank")
    private String assistantName;

    @NotBlank(message = "Tone cannot be blank")
    private String tone;

    private String greetingMessage;
    private String fallbackMessage;

    @DecimalMin(value = "0.10", message = "Confidence threshold must be at least 0.10")
    @DecimalMax(value = "1.00", message = "Confidence threshold cannot exceed 1.00")
    private BigDecimal confidenceThreshold;

    private boolean isEnabled;
    private int maxResponseTokens;

    public AiConfigDto() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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
}
