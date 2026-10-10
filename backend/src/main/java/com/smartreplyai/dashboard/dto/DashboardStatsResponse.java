package com.smartreplyai.dashboard.dto;

import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {

    private long totalConversations;
    private long openConversations;
    private long unansweredEnquiries;
    private long resolvedConversations;
    private String averageResponseTime;
    private long aiHandledConversations;
    private long humanHandledConversations;
    private long upcomingAppointmentsCount;
    private List<Map<String, Object>> volumeTrend;
    private List<Map<String, Object>> resolutionTrend;
    private List<Map<String, Object>> recentActivity;

    public DashboardStatsResponse() {
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

    public long getUnansweredEnquiries() {
        return unansweredEnquiries;
    }

    public void setUnansweredEnquiries(long unansweredEnquiries) {
        this.unansweredEnquiries = unansweredEnquiries;
    }

    public long getResolvedConversations() {
        return resolvedConversations;
    }

    public void setResolvedConversations(long resolvedConversations) {
        this.resolvedConversations = resolvedConversations;
    }

    public String getAverageResponseTime() {
        return averageResponseTime;
    }

    public void setAverageResponseTime(String averageResponseTime) {
        this.averageResponseTime = averageResponseTime;
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

    public long getUpcomingAppointmentsCount() {
        return upcomingAppointmentsCount;
    }

    public void setUpcomingAppointmentsCount(long upcomingAppointmentsCount) {
        this.upcomingAppointmentsCount = upcomingAppointmentsCount;
    }

    public List<Map<String, Object>> getVolumeTrend() {
        return volumeTrend;
    }

    public void setVolumeTrend(List<Map<String, Object>> volumeTrend) {
        this.volumeTrend = volumeTrend;
    }

    public List<Map<String, Object>> getResolutionTrend() {
        return resolutionTrend;
    }

    public void setResolutionTrend(List<Map<String, Object>> resolutionTrend) {
        this.resolutionTrend = resolutionTrend;
    }

    public List<Map<String, Object>> getRecentActivity() {
        return recentActivity;
    }

    public void setRecentActivity(List<Map<String, Object>> recentActivity) {
        this.recentActivity = recentActivity;
    }
}
