package com.smartreplyai.reports;

public class ReportsSummaryDto {

    private long totalConversations;
    private long openConversations;
    private long pendingConversations;
    private long resolvedConversations;
    private double resolutionRatePercentage;
    private long aiHandledConversations;
    private long humanHandledConversations;
    private double aiAutomationRatePercentage;
    private double avgResponseTimeSeconds;
    private long totalAppointments;
    private long confirmedAppointments;
    private long totalCustomers;

    public ReportsSummaryDto() {
    }

    public long getTotalConversations() {
        return totalConversations;
    }

    public void setTotalConversations(long totalConversations) {
        this.totalConversations = totalConversations;
    }

    public long getOpenConversations() {
        return openConversations;
    }

    public void setOpenConversations(long openConversations) {
        this.openConversations = openConversations;
    }

    public long getPendingConversations() {
        return pendingConversations;
    }

    public void setPendingConversations(long pendingConversations) {
        this.pendingConversations = pendingConversations;
    }

    public long getResolvedConversations() {
        return resolvedConversations;
    }

    public void setResolvedConversations(long resolvedConversations) {
        this.resolvedConversations = resolvedConversations;
    }

    public double getResolutionRatePercentage() {
        return resolutionRatePercentage;
    }

    public void setResolutionRatePercentage(double resolutionRatePercentage) {
        this.resolutionRatePercentage = resolutionRatePercentage;
    }

    public long getAiHandledConversations() {
        return aiHandledConversations;
    }

    public void setAiHandledConversations(long aiHandledConversations) {
        this.aiHandledConversations = aiHandledConversations;
    }

    public long getHumanHandledConversations() {
        return humanHandledConversations;
    }

    public void setHumanHandledConversations(long humanHandledConversations) {
        this.humanHandledConversations = humanHandledConversations;
    }

    public double getAiAutomationRatePercentage() {
        return aiAutomationRatePercentage;
    }

    public void setAiAutomationRatePercentage(double aiAutomationRatePercentage) {
        this.aiAutomationRatePercentage = aiAutomationRatePercentage;
    }

    public double getAvgResponseTimeSeconds() {
        return avgResponseTimeSeconds;
    }

    public void setAvgResponseTimeSeconds(double avgResponseTimeSeconds) {
        this.avgResponseTimeSeconds = avgResponseTimeSeconds;
    }

    public long getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public long getConfirmedAppointments() {
        return confirmedAppointments;
    }

    public void setConfirmedAppointments(long confirmedAppointments) {
        this.confirmedAppointments = confirmedAppointments;
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }
}
