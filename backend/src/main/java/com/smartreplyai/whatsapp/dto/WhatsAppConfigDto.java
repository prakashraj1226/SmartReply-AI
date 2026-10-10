package com.smartreplyai.whatsapp.dto;

import java.util.UUID;

public class WhatsAppConfigDto {

    private UUID id;
    private String accountId;
    private String phoneNumberId;
    private String phoneNumber;
    private String webhookVerifyToken;
    private String status;
    private boolean isSandbox;
    private boolean hasAccessToken;
    private String webhookCallbackUrl;

    public WhatsAppConfigDto() {
    }

    public WhatsAppConfigDto(UUID id, String accountId, String phoneNumberId, String phoneNumber,
                             String webhookVerifyToken, String status, boolean isSandbox,
                             boolean hasAccessToken, String webhookCallbackUrl) {
        this.id = id;
        this.accountId = accountId;
        this.phoneNumberId = phoneNumberId;
        this.phoneNumber = phoneNumber;
        this.webhookVerifyToken = webhookVerifyToken;
        this.status = status;
        this.isSandbox = isSandbox;
        this.hasAccessToken = hasAccessToken;
        this.webhookCallbackUrl = webhookCallbackUrl;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public String getPhoneNumberId() {
        return phoneNumberId;
    }

    public void setPhoneNumberId(String phoneNumberId) {
        this.phoneNumberId = phoneNumberId;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
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
        return isSandbox;
    }

    public void setSandbox(boolean sandbox) {
        isSandbox = sandbox;
    }

    public boolean isHasAccessToken() {
        return hasAccessToken;
    }

    public void setHasAccessToken(boolean hasAccessToken) {
        this.hasAccessToken = hasAccessToken;
    }

    public String getWebhookCallbackUrl() {
        return webhookCallbackUrl;
    }

    public void setWebhookCallbackUrl(String webhookCallbackUrl) {
        this.webhookCallbackUrl = webhookCallbackUrl;
    }
}
