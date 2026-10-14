package com.smartreplyai.servicecatalog.dto;

import com.smartreplyai.servicecatalog.ServiceItem;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class ServiceItemDto {

    private UUID id;
    private UUID businessId;
    private UUID branchId;
    private String branchName;
    private String name;
    private String category;
    private String description;
    private int durationMinutes;
    private int bufferBeforeMinutes;
    private int bufferAfterMinutes;
    private BigDecimal price;
    private String currency;
    private boolean isActive;
    private Instant createdAt;

    public ServiceItemDto() {
    }

    public static ServiceItemDto fromEntity(ServiceItem s) {
        ServiceItemDto dto = new ServiceItemDto();
        dto.setId(s.getId());
        dto.setBusinessId(s.getBusiness().getId());
        if (s.getBranch() != null) {
            dto.setBranchId(s.getBranch().getId());
            dto.setBranchName(s.getBranch().getName());
        }
        dto.setName(s.getName());
        dto.setCategory(s.getCategory());
        dto.setDescription(s.getDescription());
        dto.setDurationMinutes(s.getDurationMinutes());
        dto.setBufferBeforeMinutes(s.getBufferBeforeMinutes());
        dto.setBufferAfterMinutes(s.getBufferAfterMinutes());
        dto.setPrice(s.getPrice());
        dto.setCurrency(s.getCurrency());
        dto.setActive(s.isActive());
        dto.setCreatedAt(s.getCreatedAt());
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

    public UUID getBranchId() {
        return branchId;
    }

    public void setBranchId(UUID branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public int getBufferBeforeMinutes() {
        return bufferBeforeMinutes;
    }

    public void setBufferBeforeMinutes(int bufferBeforeMinutes) {
        this.bufferBeforeMinutes = bufferBeforeMinutes;
    }

    public int getBufferAfterMinutes() {
        return bufferAfterMinutes;
    }

    public void setBufferAfterMinutes(int bufferAfterMinutes) {
        this.bufferAfterMinutes = bufferAfterMinutes;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
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
