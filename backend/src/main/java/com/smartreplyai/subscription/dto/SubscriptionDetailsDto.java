package com.smartreplyai.subscription.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SubscriptionDetailsDto {

    private UUID id;
    private String planCode;
    private String planName;
    private BigDecimal priceInr;
    private String status;
    private Instant currentPeriodStart;
    private Instant currentPeriodEnd;
    private boolean cancelAtPeriodEnd;
    private int maxConversationsMonthly;
    private int maxAgents;
    private boolean aiFeaturesEnabled;
    private long currentMonthConversations;
    private long remainingConversations;
    private List<PaymentTransactionDto> transactions;

    public SubscriptionDetailsDto() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(String planCode) {
        this.planCode = planCode;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public BigDecimal getPriceInr() {
        return priceInr;
    }

    public void setPriceInr(BigDecimal priceInr) {
        this.priceInr = priceInr;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCurrentPeriodStart() {
        return currentPeriodStart;
    }

    public void setCurrentPeriodStart(Instant currentPeriodStart) {
        this.currentPeriodStart = currentPeriodStart;
    }

    public Instant getCurrentPeriodEnd() {
        return currentPeriodEnd;
    }

    public void setCurrentPeriodEnd(Instant currentPeriodEnd) {
        this.currentPeriodEnd = currentPeriodEnd;
    }

    public boolean isCancelAtPeriodEnd() {
        return cancelAtPeriodEnd;
    }

    public void setCancelAtPeriodEnd(boolean cancelAtPeriodEnd) {
        this.cancelAtPeriodEnd = cancelAtPeriodEnd;
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

    public long getCurrentMonthConversations() {
        return currentMonthConversations;
    }

    public void setCurrentMonthConversations(long currentMonthConversations) {
        this.currentMonthConversations = currentMonthConversations;
    }

    public long getRemainingConversations() {
        return remainingConversations;
    }

    public void setRemainingConversations(long remainingConversations) {
        this.remainingConversations = remainingConversations;
    }

    public List<PaymentTransactionDto> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<PaymentTransactionDto> transactions) {
        this.transactions = transactions;
    }
}
