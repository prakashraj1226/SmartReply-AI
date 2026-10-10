package com.smartreplyai.customer.dto;

import com.smartreplyai.customer.Customer;
import java.time.Instant;
import java.util.UUID;

public class CustomerDto {

    private UUID id;
    private UUID businessId;
    private String phoneNumber;
    private String name;
    private String email;
    private String optInStatus;
    private String tagsJson;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public CustomerDto() {
    }

    public static CustomerDto fromEntity(Customer c) {
        CustomerDto dto = new CustomerDto();
        dto.setId(c.getId());
        dto.setBusinessId(c.getBusiness().getId());
        dto.setPhoneNumber(c.getPhoneNumber());
        dto.setName(c.getName());
        dto.setEmail(c.getEmail());
        dto.setOptInStatus(c.getOptInStatus());
        dto.setTagsJson(c.getTagsJson());
        dto.setNotes(c.getNotes());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getBusinessId() {
        return businessId;
    }

    public void setBusinessId(UUID businessId) {
        this.businessId = businessId;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
