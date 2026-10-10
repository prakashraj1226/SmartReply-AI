package com.smartreplyai.automation.dto;

import com.smartreplyai.automation.AutomationRule;
import java.time.Instant;
import java.util.UUID;

public class AutomationRuleDto {

    private UUID id;
    private String name;
    private String triggerEvent;
    private String conditionsJson;
    private String actionsJson;
    private boolean isActive;
    private Instant createdAt;

    public AutomationRuleDto() {
    }

    public static AutomationRuleDto fromEntity(AutomationRule r) {
        AutomationRuleDto dto = new AutomationRuleDto();
        dto.setId(r.getId());
        dto.setName(r.getName());
        dto.setTriggerEvent(r.getTriggerEvent());
        dto.setConditionsJson(r.getConditionsJson());
        dto.setActionsJson(r.getActionsJson());
        dto.setActive(r.isActive());
        dto.setCreatedAt(r.getCreatedAt());
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

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
