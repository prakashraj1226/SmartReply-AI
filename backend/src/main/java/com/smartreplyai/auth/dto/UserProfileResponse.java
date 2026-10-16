package com.smartreplyai.auth.dto;

import java.util.UUID;

public class UserProfileResponse {

    private UUID id;
    private String email;
    private String fullName;
    private String role;
    private String tenantRole;
    private String phone;
    private UUID businessId;
    private String businessName;
    private boolean onboardingCompleted;

    public UserProfileResponse() {
    }

    public UserProfileResponse(UUID id, String email, String fullName, String role,
                               UUID businessId, String businessName, boolean onboardingCompleted) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.tenantRole = role;
        this.businessId = businessId;
        this.businessName = businessName;
        this.onboardingCompleted = onboardingCompleted;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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

    public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
    }

    public String getTenantRole() {
        return tenantRole;
    }

    public void setTenantRole(String tenantRole) {
        this.tenantRole = tenantRole;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
