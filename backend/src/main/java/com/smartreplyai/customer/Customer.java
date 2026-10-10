package com.smartreplyai.customer;

import com.smartreplyai.business.Business;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "customers", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"business_id", "phone_number"})
})
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(name = "phone_number", nullable = false, length = 50)
    private String phoneNumber;

    @Column
    private String name;

    @Column
    private String email;

    @Column(name = "opt_in_status", nullable = false, length = 50)
    private String optInStatus = "OPTED_IN"; // OPTED_IN, OPTED_OUT

    @Column(name = "tags_json", columnDefinition = "TEXT")
    private String tagsJson = "[]";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Customer() {
    }

    public Customer(Business business, String phoneNumber, String name, String email) {
        this.business = business;
        this.phoneNumber = phoneNumber;
        this.name = name;
        this.email = email;
        this.optInStatus = "OPTED_IN";
        this.tagsJson = "[]";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Business getBusiness() {
        return business;
    }

    public void setBusiness(Business business) {
        this.business = business;
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
