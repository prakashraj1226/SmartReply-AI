package com.smartreplyai.settings.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class BusinessProfileDto {
    private UUID id;

    @NotBlank(message = "Business name cannot be blank")
    private String name;

    private String category;
    private String email;
    private String phone;
    private String address;
    private String timezone;
    private String operatingHoursJson;
    private String preferredLanguage;
    private String description;

    public BusinessProfileDto() {
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
}
