package com.smartreplyai.branch.dto;

import com.smartreplyai.branch.Branch;
import java.time.Instant;
import java.util.UUID;

public class BranchDto {

    private UUID id;
    private UUID businessId;
    private String name;
    private String address;
    private String phone;
    private String timezone;
    private boolean isActive;
    private Instant createdAt;

    public BranchDto() {
    }

    public static BranchDto fromEntity(Branch b) {
        BranchDto dto = new BranchDto();
        dto.setId(b.getId());
        dto.setBusinessId(b.getBusiness().getId());
        dto.setName(b.getName());
        dto.setAddress(b.getAddress());
        dto.setPhone(b.getPhone());
        dto.setTimezone(b.getTimezone());
        dto.setActive(b.isActive());
        dto.setCreatedAt(b.getCreatedAt());
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

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
