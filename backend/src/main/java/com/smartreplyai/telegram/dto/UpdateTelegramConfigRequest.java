package com.smartreplyai.telegram.dto;

public class UpdateTelegramConfigRequest {

    private String botToken;
    private Boolean isSandbox;
    private String webhookSecret;

    public UpdateTelegramConfigRequest() {
    }

    public UpdateTelegramConfigRequest(String botToken, Boolean isSandbox, String webhookSecret) {
        this.botToken = botToken;
        this.isSandbox = isSandbox;
        this.webhookSecret = webhookSecret;
    }

    public String getBotToken() {
        return botToken;
    }

    public void setBotToken(String botToken) {
        this.botToken = botToken;
    }

    public Boolean getIsSandbox() {
        return isSandbox;
    }

    public void setIsSandbox(Boolean isSandbox) {
        this.isSandbox = isSandbox;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }
}
