package com.smartreplyai.settings.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateMemberRoleRequest {

    @NotBlank(message = "New role is required")
    private String role; // BUSINESS_ADMIN, MANAGER, RECEPTIONIST, DOCTOR, DENTIST, SALON_STAFF, AGENT

    public UpdateMemberRoleRequest() {
    }

    public UpdateMemberRoleRequest(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
