package com.smartreplyai.whatsapp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationAccountRepository extends JpaRepository<IntegrationAccount, UUID> {

    Optional<IntegrationAccount> findByBusinessIdAndProvider(UUID businessId, String provider);

    Optional<IntegrationAccount> findByPhoneNumberId(String phoneNumberId);

    Optional<IntegrationAccount> findByWebhookVerifyToken(String webhookVerifyToken);
}
