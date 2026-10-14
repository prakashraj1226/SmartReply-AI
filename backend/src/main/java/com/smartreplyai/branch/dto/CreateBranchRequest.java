package com.smartreplyai.branch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateBranchRequest {

    @NotBlank(message = "Branch name is required")
    @Size(max = 255, message = "Branch name must not exceed 255 characters")
    private String name;

    private String address;

    @Size(max = 50, message = "Phone must not exceed 50 characters")
    private String phone;

    private String timezone = "Asia/Kolkata";

    public CreateBranchRequest() {
    }

    public CreateBranchRequest(String name, String address, String phone, String timezone) {
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.timezone = timezone != null ? timezone : "Asia/Kolkata";
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
}
