package com.smartreplyai.auth.dto;

import java.util.UUID;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private UUID userId;
    private String email;
    private String fullName;
    private String role;
    private UUID businessId;
    private String businessName;
    private boolean onboardingCompleted;

    public AuthResponse() {
    }

    public AuthResponse(String token, UUID userId, String email, String fullName, String role,
                        UUID businessId, String businessName, boolean onboardingCompleted) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.businessId = businessId;
        this.businessName = businessName;
        this.onboardingCompleted = onboardingCompleted;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
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
}
