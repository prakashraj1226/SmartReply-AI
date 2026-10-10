package com.smartreplyai.customer.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateCustomerRequest {

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private String name;
    private String email;
    private String optInStatus = "OPTED_IN";
    private String tagsJson = "[]";
    private String notes;

    public CreateCustomerRequest() {
    }

    public CreateCustomerRequest(String phoneNumber, String name, String email) {
        this.phoneNumber = phoneNumber;
        this.name = name;
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOptInStatus() {
        return optInStatus;
    }

    public void setOptInStatus(String optInStatus) {
        this.optInStatus = optInStatus;
    }

    public String getTagsJson() {
        return tagsJson;
    }

    public void setTagsJson(String tagsJson) {
        this.tagsJson = tagsJson;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
