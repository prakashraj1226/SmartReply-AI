package com.smartreplyai.branch.dto;

import jakarta.validation.constraints.Size;

public class UpdateBranchRequest {

    @Size(max = 255, message = "Branch name must not exceed 255 characters")
    private String name;

    private String address;

    @Size(max = 50, message = "Phone must not exceed 50 characters")
    private String phone;

    private String timezone;

    private Boolean isActive;

    public UpdateBranchRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
