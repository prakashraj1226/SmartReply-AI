package com.smartreplyai.telegram.dto;

import java.util.UUID;

public class TelegramConfigDto {

    private UUID id;
    private String botUsername;
    private String botDisplayName;
    private String webhookVerifyToken;
    private String status;
    private boolean sandbox;
    private boolean hasToken;
    private String maskedToken;
    private String webhookUrl;
    private long autoReplyCount;

    public TelegramConfigDto() {
    }

    public TelegramConfigDto(UUID id, String botUsername, String botDisplayName, String webhookVerifyToken,
                             String status, boolean sandbox, boolean hasToken, String maskedToken,
                             String webhookUrl, long autoReplyCount) {
        this.id = id;
        this.botUsername = botUsername;
        this.botDisplayName = botDisplayName;
        this.webhookVerifyToken = webhookVerifyToken;
        this.status = status;
        this.sandbox = sandbox;
        this.hasToken = hasToken;
        this.maskedToken = maskedToken;
        this.webhookUrl = webhookUrl;
        this.autoReplyCount = autoReplyCount;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getBotUsername() {
        return botUsername;
    }

    public void setBotUsername(String botUsername) {
        this.botUsername = botUsername;
    }

    public String getBotDisplayName() {
        return botDisplayName;
    }

    public void setBotDisplayName(String botDisplayName) {
        this.botDisplayName = botDisplayName;
    }

    public String getWebhookVerifyToken() {
        return webhookVerifyToken;
    }

    public void setWebhookVerifyToken(String webhookVerifyToken) {
        this.webhookVerifyToken = webhookVerifyToken;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isSandbox() {
        return sandbox;
    }

    public void setSandbox(boolean sandbox) {
        this.sandbox = sandbox;
    }

    public boolean isHasToken() {
        return hasToken;
    }

    public void setHasToken(boolean hasToken) {
        this.hasToken = hasToken;
    }

    public String getMaskedToken() {
        return maskedToken;
    }

    public void setMaskedToken(String maskedToken) {
        this.maskedToken = maskedToken;
    }

    public String getWebhookUrl() {
        return webhookUrl;
    }

    public void setWebhookUrl(String webhookUrl) {
        this.webhookUrl = webhookUrl;
    }

    public long getAutoReplyCount() {
        return autoReplyCount;
    }

    public void setAutoReplyCount(long autoReplyCount) {
        this.autoReplyCount = autoReplyCount;
    }
}
