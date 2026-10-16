package com.smartreplyai.settings.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateTeamMemberRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phone;

    private String role; // BUSINESS_ADMIN, MANAGER, RECEPTIONIST, DOCTOR, DENTIST, SALON_STAFF, AGENT

    private String status; // ACTIVE, SUSPENDED

    private String password; // Optional password reset

    public UpdateTeamMemberRequest() {
    }

    public UpdateTeamMemberRequest(String fullName, String phone, String role, String status, String password) {
        this.fullName = fullName;
        this.phone = phone;
        this.role = role;
        this.status = status;
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
