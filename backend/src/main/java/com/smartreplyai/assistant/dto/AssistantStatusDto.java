package com.smartreplyai.assistant.dto;

public class AssistantStatusDto {

    private boolean configured;
    private String model;
    private String provider;

    public AssistantStatusDto() {
    }

    public AssistantStatusDto(boolean configured, String model, String provider) {
        this.configured = configured;
        this.model = model;
        this.provider = provider;
    }

    public boolean isConfigured() {
        return configured;
    }

    public void setConfigured(boolean configured) {
        this.configured = configured;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}
