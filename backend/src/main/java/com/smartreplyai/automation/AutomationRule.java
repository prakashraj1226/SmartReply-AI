package com.smartreplyai.automation;

import com.smartreplyai.business.Business;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "automation_rules")
public class AutomationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(nullable = false)
    private String name;

    @Column(name = "trigger_event", nullable = false, length = 100)
    private String triggerEvent; // FIRST_MESSAGE_RECEIVED, APPOINTMENT_CONFIRMED, AI_FALLBACK_TRIGGERED, CONVERSATION_UNANSWERED

    @Column(name = "conditions_json", columnDefinition = "TEXT")
    private String conditionsJson;

    @Column(name = "actions_json", columnDefinition = "TEXT")
    private String actionsJson;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public AutomationRule() {
    }

    public AutomationRule(Business business, String name, String triggerEvent,
                          String conditionsJson, String actionsJson) {
        this.business = business;
        this.name = name;
        this.triggerEvent = triggerEvent;
        this.conditionsJson = conditionsJson;
        this.actionsJson = actionsJson;
        this.isActive = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTriggerEvent() {
        return triggerEvent;
    }

    public void setTriggerEvent(String triggerEvent) {
        this.triggerEvent = triggerEvent;
    }

    public String getConditionsJson() {
        return conditionsJson;
    }

    public void setConditionsJson(String conditionsJson) {
        this.conditionsJson = conditionsJson;
    }

    public String getActionsJson() {
        return actionsJson;
    }

    public void setActionsJson(String actionsJson) {
        this.actionsJson = actionsJson;
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

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
