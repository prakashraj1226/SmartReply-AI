package com.smartreplyai.admin.dto;

import java.math.BigDecimal;
import java.util.Map;

public class AdminOverviewDto {
    private long totalBusinesses;
    private long activeBusinesses;
    private long totalUsers;
    private long totalConversations;
    private long totalMessages;
    private BigDecimal estimatedMrrInr;
    private long activeIntegrations;
    private long totalAppointments;
    private long completedAppointments;
    private Map<String, Long> businessesByIndustry;

    public AdminOverviewDto() {
    }

    public AdminOverviewDto(long totalBusinesses, long activeBusinesses, long totalUsers,
                            long totalConversations, long totalMessages,
                            BigDecimal estimatedMrrInr, long activeIntegrations) {
        this.totalBusinesses = totalBusinesses;
        this.activeBusinesses = activeBusinesses;
        this.totalUsers = totalUsers;
        this.totalConversations = totalConversations;
        this.totalMessages = totalMessages;
        this.estimatedMrrInr = estimatedMrrInr;
        this.activeIntegrations = activeIntegrations;
    }

    public long getTotalBusinesses() {
        return totalBusinesses;
    }

    public void setTotalBusinesses(long totalBusinesses) {
        this.totalBusinesses = totalBusinesses;
    }

    public long getActiveBusinesses() {
        return activeBusinesses;
    }

    public void setActiveBusinesses(long activeBusinesses) {
        this.activeBusinesses = activeBusinesses;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalConversations() {
        return totalConversations;
    }

    public void setTotalConversations(long totalConversations) {
        this.totalConversations = totalConversations;
    }

    public long getTotalMessages() {
        return totalMessages;
    }

    public void setTotalMessages(long totalMessages) {
        this.totalMessages = totalMessages;
    }

    public BigDecimal getEstimatedMrrInr() {
        return estimatedMrrInr;
    }

    public void setEstimatedMrrInr(BigDecimal estimatedMrrInr) {
        this.estimatedMrrInr = estimatedMrrInr;
    }

    public long getActiveIntegrations() {
        return activeIntegrations;
    }

    public void setActiveIntegrations(long activeIntegrations) {
        this.activeIntegrations = activeIntegrations;
    }

    public long getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public long getCompletedAppointments() {
        return completedAppointments;
    }

    public void setCompletedAppointments(long completedAppointments) {
        this.completedAppointments = completedAppointments;
    }

    public Map<String, Long> getBusinessesByIndustry() {
        return businessesByIndustry;
    }

    public void setBusinessesByIndustry(Map<String, Long> businessesByIndustry) {
        this.businessesByIndustry = businessesByIndustry;
    }
}
