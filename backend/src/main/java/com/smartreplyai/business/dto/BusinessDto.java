package com.smartreplyai.business.dto;

import com.smartreplyai.business.Business;
import java.time.Instant;
import java.util.UUID;

public class BusinessDto {

    private UUID id;
    private String name;
    private String slug;
    private String category;
    private String email;
    private String phone;
    private String address;
    private String timezone;
    private String operatingHoursJson;
    private String preferredLanguage;
    private String description;
    private boolean onboardingCompleted;
    private boolean isActive;
    private Instant createdAt;

    public BusinessDto() {
    }

    public static BusinessDto fromEntity(Business b) {
        BusinessDto dto = new BusinessDto();
        dto.setId(b.getId());
        dto.setName(b.getName());
        dto.setSlug(b.getSlug());
        dto.setCategory(b.getCategory());
        dto.setEmail(b.getEmail());
        dto.setPhone(b.getPhone());
        dto.setAddress(b.getAddress());
        dto.setTimezone(b.getTimezone());
        dto.setOperatingHoursJson(b.getOperatingHoursJson());
        dto.setPreferredLanguage(b.getPreferredLanguage());
        dto.setDescription(b.getDescription());
        dto.setOnboardingCompleted(b.isOnboardingCompleted());
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getOperatingHoursJson() {
        return operatingHoursJson;
    }

    public void setOperatingHoursJson(String operatingHoursJson) {
        this.operatingHoursJson = operatingHoursJson;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
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
