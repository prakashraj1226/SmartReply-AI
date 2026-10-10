package com.smartreplyai.automation.dto;

import com.smartreplyai.automation.AutomationExecution;
import java.time.Instant;
import java.util.UUID;

public class AutomationExecutionDto {

    private UUID id;
    private UUID ruleId;
    private String ruleName;
    private String triggerEvent;
    private String status;
    private String errorMessage;
    private Instant executedAt;

    public AutomationExecutionDto() {
    }

    public static AutomationExecutionDto fromEntity(AutomationExecution e) {
        AutomationExecutionDto dto = new AutomationExecutionDto();
        dto.setId(e.getId());
        if (e.getRule() != null) {
            dto.setRuleId(e.getRule().getId());
            dto.setRuleName(e.getRule().getName());
        }
        dto.setTriggerEvent(e.getTriggerEvent());
        dto.setStatus(e.getStatus());
        dto.setErrorMessage(e.getErrorMessage());
        dto.setExecutedAt(e.getExecutedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getRuleId() {
        return ruleId;
    }

    public void setRuleId(UUID ruleId) {
        this.ruleId = ruleId;
    }

    public String getRuleName() {
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
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
