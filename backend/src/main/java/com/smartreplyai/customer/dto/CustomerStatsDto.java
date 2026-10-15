package com.smartreplyai.customer.dto;

public class CustomerStatsDto {

    private long totalCustomers;
    private long optedInCustomers;
    private double optedInPercentage;
    private long vipCustomers;
    private long recentEnquiries;

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getOptedInCustomers() {
        return optedInCustomers;
    }

    public void setOptedInCustomers(long optedInCustomers) {
        this.optedInCustomers = optedInCustomers;
    }

    public double getOptedInPercentage() {
        return optedInPercentage;
    }

    public void setOptedInPercentage(double optedInPercentage) {
        this.optedInPercentage = optedInPercentage;
    }

    public long getVipCustomers() {
        return vipCustomers;
    }

    public void setVipCustomers(long vipCustomers) {
        this.vipCustomers = vipCustomers;
    }

    public long getRecentEnquiries() {
        return recentEnquiries;
    }

    public void setRecentEnquiries(long recentEnquiries) {
        this.recentEnquiries = recentEnquiries;
    }
}
