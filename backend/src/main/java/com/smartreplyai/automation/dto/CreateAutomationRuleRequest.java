package com.smartreplyai.automation.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateAutomationRuleRequest {

    @NotBlank(message = "Rule name is required")
    private String name;

    @NotBlank(message = "Trigger event is required")
    private String triggerEvent;

    private String conditionsJson;

    @NotBlank(message = "Actions configuration is required")
    private String actionsJson;

    public CreateAutomationRuleRequest() {
    }

    public CreateAutomationRuleRequest(String name, String triggerEvent, String conditionsJson, String actionsJson) {
        this.name = name;
        this.triggerEvent = triggerEvent;
        this.conditionsJson = conditionsJson;
        this.actionsJson = actionsJson;
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
}
