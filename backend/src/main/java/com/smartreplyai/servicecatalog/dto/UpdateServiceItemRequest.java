package com.smartreplyai.servicecatalog.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public class UpdateServiceItemRequest {

    private UUID branchId;

    @Size(max = 255, message = "Service name must not exceed 255 characters")
    private String name;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;

    private String description;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer durationMinutes;

    @Min(value = 0, message = "Buffer before must be non-negative")
    private Integer bufferBeforeMinutes;

    @Min(value = 0, message = "Buffer after must be non-negative")
    private Integer bufferAfterMinutes;

    @Min(value = 0, message = "Price cannot be negative")
    private BigDecimal price;

    private String currency;

    private Boolean isActive;

    public UpdateServiceItemRequest() {
    }

    public UUID getBranchId() {
        return branchId;
    }

    public void setBranchId(UUID branchId) {
        this.branchId = branchId;
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

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Integer getBufferBeforeMinutes() {
        return bufferBeforeMinutes;
    }

    public void setBufferBeforeMinutes(Integer bufferBeforeMinutes) {
        this.bufferBeforeMinutes = bufferBeforeMinutes;
    }

    public Integer getBufferAfterMinutes() {
        return bufferAfterMinutes;
    }

    public void setBufferAfterMinutes(Integer bufferAfterMinutes) {
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
