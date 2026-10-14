package com.smartreplyai.staff.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public class UpdateStaffRequest {

    private UUID branchId;
    private UUID userId;

    @Size(max = 255, message = "Staff name must not exceed 255 characters")
    private String name;

    private String staffType;

    @Size(max = 50, message = "Phone must not exceed 50 characters")
    private String phone;

    private String email;

    private Boolean isActive;

    public UpdateStaffRequest() {
    }

    public UUID getBranchId() {
        return branchId;
    }

    public void setBranchId(UUID branchId) {
        this.branchId = branchId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStaffType() {
        return staffType;
    }

    public void setStaffType(String staffType) {
        this.staffType = staffType;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
