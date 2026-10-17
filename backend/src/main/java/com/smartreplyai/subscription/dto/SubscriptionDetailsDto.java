package com.smartreplyai.subscription.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

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

    // Trial-specific information
    private Instant trialStartedAt;
    private Instant trialEndsAt;
    private String trialStatus;

    @JsonProperty("isTrial")
    private boolean isTrial;

    @JsonProperty("isTrialExpired")
    private boolean isTrialExpired;
    private long daysRemaining;

    // Plan usage counters & limits for UI inspection and warning
    private long staffCount;
    private int staffLimit;
    private long customerCount;
    private int customerLimit;
    private long knowledgeCount;
    private int knowledgeLimit;
    private long faqCount;
    private int faqLimit;
    private int aiTodayChats;
    private int aiTodayLimit;
    private long appointmentTodayCount;
    private int appointmentTodayLimit;
    private long appointmentTotalCount;
    private int appointmentTotalLimit;
    private long geminiRepliesToday;
    private int geminiRepliesDailyLimit;
    private long geminiRepliesMonth;
    private int geminiRepliesMonthlyLimit;

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

    public Instant getTrialStartedAt() {
        return trialStartedAt;
    }

    public void setTrialStartedAt(Instant trialStartedAt) {
        this.trialStartedAt = trialStartedAt;
    }

    public Instant getTrialEndsAt() {
        return trialEndsAt;
    }

    public void setTrialEndsAt(Instant trialEndsAt) {
        this.trialEndsAt = trialEndsAt;
    }

    public String getTrialStatus() {
        return trialStatus;
    }

    public void setTrialStatus(String trialStatus) {
        this.trialStatus = trialStatus;
    }

    @JsonProperty("isTrial")
    public boolean isTrial() {
        return isTrial;
    }

    public boolean getTrial() {
        return isTrial;
    }

    public void setTrial(boolean trial) {
        isTrial = trial;
    }

    @JsonProperty("isTrialExpired")
    public boolean isTrialExpired() {
        return isTrialExpired;
    }

    public boolean getTrialExpired() {
        return isTrialExpired;
    }

    public void setTrialExpired(boolean trialExpired) {
        isTrialExpired = trialExpired;
    }

    public long getDaysRemaining() {
        return daysRemaining;
    }

    public void setDaysRemaining(long daysRemaining) {
        this.daysRemaining = daysRemaining;
    }

    public long getStaffCount() {
        return staffCount;
    }

    public void setStaffCount(long staffCount) {
        this.staffCount = staffCount;
    }

    public int getStaffLimit() {
        return staffLimit;
    }

    public void setStaffLimit(int staffLimit) {
        this.staffLimit = staffLimit;
    }

    public long getCustomerCount() {
        return customerCount;
    }

    public void setCustomerCount(long customerCount) {
        this.customerCount = customerCount;
    }

    public int getCustomerLimit() {
        return customerLimit;
    }

    public void setCustomerLimit(int customerLimit) {
        this.customerLimit = customerLimit;
    }

    public long getKnowledgeCount() {
        return knowledgeCount;
    }

    public void setKnowledgeCount(long knowledgeCount) {
        this.knowledgeCount = knowledgeCount;
    }

    public int getKnowledgeLimit() {
        return knowledgeLimit;
    }

    public void setKnowledgeLimit(int knowledgeLimit) {
        this.knowledgeLimit = knowledgeLimit;
    }

    public long getFaqCount() {
        return faqCount;
    }

    public void setFaqCount(long faqCount) {
        this.faqCount = faqCount;
    }

    public int getFaqLimit() {
        return faqLimit;
    }

    public void setFaqLimit(int faqLimit) {
        this.faqLimit = faqLimit;
    }

    public int getAiTodayChats() {
        return aiTodayChats;
    }

    public void setAiTodayChats(int aiTodayChats) {
        this.aiTodayChats = aiTodayChats;
    }

    public int getAiTodayLimit() {
        return aiTodayLimit;
    }

    public void setAiTodayLimit(int aiTodayLimit) {
        this.aiTodayLimit = aiTodayLimit;
    }

    public long getAppointmentTodayCount() {
        return appointmentTodayCount;
    }

    public void setAppointmentTodayCount(long appointmentTodayCount) {
        this.appointmentTodayCount = appointmentTodayCount;
    }

    public int getAppointmentTodayLimit() {
        return appointmentTodayLimit;
    }

    public void setAppointmentTodayLimit(int appointmentTodayLimit) {
        this.appointmentTodayLimit = appointmentTodayLimit;
    }

    public long getAppointmentTotalCount() {
        return appointmentTotalCount;
    }

    public void setAppointmentTotalCount(long appointmentTotalCount) {
        this.appointmentTotalCount = appointmentTotalCount;
    }

    public int getAppointmentTotalLimit() {
        return appointmentTotalLimit;
    }

    public void setAppointmentTotalLimit(int appointmentTotalLimit) {
        this.appointmentTotalLimit = appointmentTotalLimit;
    }

    public long getGeminiRepliesToday() {
        return geminiRepliesToday;
    }

    public void setGeminiRepliesToday(long geminiRepliesToday) {
        this.geminiRepliesToday = geminiRepliesToday;
    }

    public int getGeminiRepliesDailyLimit() {
        return geminiRepliesDailyLimit;
    }

    public void setGeminiRepliesDailyLimit(int geminiRepliesDailyLimit) {
        this.geminiRepliesDailyLimit = geminiRepliesDailyLimit;
    }

    public long getGeminiRepliesMonth() {
        return geminiRepliesMonth;
    }

    public void setGeminiRepliesMonth(long geminiRepliesMonth) {
        this.geminiRepliesMonth = geminiRepliesMonth;
    }

    public int getGeminiRepliesMonthlyLimit() {
        return geminiRepliesMonthlyLimit;
    }

    public void setGeminiRepliesMonthlyLimit(int geminiRepliesMonthlyLimit) {
        this.geminiRepliesMonthlyLimit = geminiRepliesMonthlyLimit;
    }
}
