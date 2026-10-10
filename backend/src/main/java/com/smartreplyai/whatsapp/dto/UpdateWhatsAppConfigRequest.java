package com.smartreplyai.whatsapp.dto;

import jakarta.validation.constraints.Size;

public class UpdateWhatsAppConfigRequest {

    private String accountId; // WABA ID
    private String phoneNumberId;
    private String phoneNumber;

    @Size(max = 2048)
    private String accessToken;

    private String webhookVerifyToken;
    private String appSecret;
    private Boolean isSandbox;

    public UpdateWhatsAppConfigRequest() {
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

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getWebhookVerifyToken() {
        return webhookVerifyToken;
    }

    public void setWebhookVerifyToken(String webhookVerifyToken) {
        this.webhookVerifyToken = webhookVerifyToken;
    }

    public String getAppSecret() {
        return appSecret;
    }

    public void setAppSecret(String appSecret) {
        this.appSecret = appSecret;
    }

    public Boolean getIsSandbox() {
        return isSandbox;
    }

    public void setIsSandbox(Boolean sandbox) {
        isSandbox = sandbox;
    }
}
