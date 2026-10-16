package com.smartreplyai.settings.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class InviteMemberRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Role is required")
    private String role; // BUSINESS_ADMIN, MANAGER, RECEPTIONIST, DOCTOR, DENTIST, SALON_STAFF, AGENT

    private String phone;

    private String password;

    public InviteMemberRequest() {
    }

    public InviteMemberRequest(String email, String fullName, String role, String phone, String password) {
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.phone = phone;
        this.password = password;
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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
