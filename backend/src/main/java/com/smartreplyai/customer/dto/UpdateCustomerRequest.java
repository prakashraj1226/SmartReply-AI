package com.smartreplyai.customer.dto;

public class UpdateCustomerRequest {

    private String name;
    private String email;
    private String optInStatus;
    private String tagsJson;
    private String notes;

    public UpdateCustomerRequest() {
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
