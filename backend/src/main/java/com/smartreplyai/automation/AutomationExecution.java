package com.smartreplyai.automation;

import com.smartreplyai.business.Business;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "automation_executions")
public class AutomationExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private AutomationRule rule;

    @Column(name = "trigger_event", nullable = false, length = 100)
    private String triggerEvent;

    @Column(nullable = false, length = 50)
    private String status; // SUCCESS, FAILED

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "executed_at", nullable = false)
    private Instant executedAt = Instant.now();

    public AutomationExecution() {
    }

    public AutomationExecution(Business business, AutomationRule rule, String triggerEvent, String status, String errorMessage) {
        this.business = business;
        this.rule = rule;
        this.triggerEvent = triggerEvent;
        this.status = status;
        this.errorMessage = errorMessage;
        this.executedAt = Instant.now();
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

    public AutomationRule getRule() {
        return rule;
    }

    public void setRule(AutomationRule rule) {
        this.rule = rule;
    }

    public String getTriggerEvent() {
        return triggerEvent;
    }

    public void setTriggerEvent(String triggerEvent) {
        this.triggerEvent = triggerEvent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Instant getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(Instant executedAt) {
        this.executedAt = executedAt;
    }
}
