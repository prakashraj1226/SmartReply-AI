package com.smartreplyai.subscription;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // FREE, STARTER, GROWTH, PRO

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "price_inr", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceInr;

    @Column(name = "billing_interval", nullable = false, length = 20)
    private String billingInterval = "MONTHLY";

    @Column(name = "max_conversations_monthly", nullable = false)
    private int maxConversationsMonthly;

    @Column(name = "max_agents", nullable = false)
    private int maxAgents;

    @Column(name = "ai_features_enabled", nullable = false)
    private boolean aiFeaturesEnabled;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "features_json", columnDefinition = "TEXT")
    private String featuresJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public SubscriptionPlan() {
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPriceInr() {
        return priceInr;
    }

    public void setPriceInr(BigDecimal priceInr) {
        this.priceInr = priceInr;
    }

    public String getBillingInterval() {
        return billingInterval;
    }

    public void setBillingInterval(String billingInterval) {
        this.billingInterval = billingInterval;
    }

    public int getMaxConversationsMonthly() {
        return maxConversationsMonthly;
    }

    public void setMaxConversationsMonthly(int maxConversationsMonthly) {
        this.maxConversationsMonthly = maxConversationsMonthly;
    }

    public int getMaxAgents() {
        return maxAgents;
    }

    public void setMaxAgents(int maxAgents) {
        this.maxAgents = maxAgents;
    }

    public boolean isAiFeaturesEnabled() {
        return aiFeaturesEnabled;
    }

    public void setAiFeaturesEnabled(boolean aiFeaturesEnabled) {
        this.aiFeaturesEnabled = aiFeaturesEnabled;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getFeaturesJson() {
        return featuresJson;
    }

    public void setFeaturesJson(String featuresJson) {
        this.featuresJson = featuresJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
