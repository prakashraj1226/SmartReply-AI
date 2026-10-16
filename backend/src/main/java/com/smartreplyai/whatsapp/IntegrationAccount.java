package com.smartreplyai.whatsapp;

import com.smartreplyai.business.Business;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "integration_accounts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_business_provider", columnNames = {"business_id", "provider"})
})
public class IntegrationAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(nullable = false, length = 50)
    private String provider = "WHATSAPP_CLOUD";

    @Column(name = "waba_id")
    private String accountId; // WhatsApp Business Account ID

    @Column(name = "phone_number_id", length = 100)
    private String phoneNumberId;

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "encrypted_access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "webhook_verify_token")
    private String webhookVerifyToken;

    @Column(name = "app_secret")
    private String appSecret;

    @Column(nullable = false, length = 50)
    private String status = "SANDBOX"; // SANDBOX, CONNECTED, DISCONNECTED, ERROR

    @Column(name = "mode", nullable = false, length = 50)
    private String mode = "SANDBOX"; // SANDBOX, PRODUCTION

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;

    @Column(name = "bot_username", length = 100)
    private String botUsername;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public IntegrationAccount() {
    }

    public IntegrationAccount(Business business, String provider) {
        this.business = business;
        this.provider = provider;
        this.status = "SANDBOX";
        this.mode = "SANDBOX";
        this.webhookVerifyToken = "smartreply_verify_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isSandbox() {
        return "SANDBOX".equalsIgnoreCase(this.mode);
    }

    public void setSandbox(boolean sandbox) {
        this.mode = sandbox ? "SANDBOX" : "PRODUCTION";
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

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
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

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getConfigJson() {
        return configJson;
    }

    public void setConfigJson(String configJson) {
        this.configJson = configJson;
    }

    public String getBotUsername() {
        return botUsername;
    }

    public void setBotUsername(String botUsername) {
        this.botUsername = botUsername;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
