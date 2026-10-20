package com.smartreplyai.whatsapp;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationAccountRepository extends JpaRepository<IntegrationAccount, UUID> {

    @EntityGraph(attributePaths = {"business"})
    Optional<IntegrationAccount> findByBusinessIdAndProvider(UUID businessId, String provider);

    @EntityGraph(attributePaths = {"business"})
    Optional<IntegrationAccount> findByPhoneNumberId(String phoneNumberId);

    @EntityGraph(attributePaths = {"business"})
    Optional<IntegrationAccount> findByPhoneNumber(String phoneNumber);

    @EntityGraph(attributePaths = {"business"})
    Optional<IntegrationAccount> findByWebhookVerifyToken(String webhookVerifyToken);

    @EntityGraph(attributePaths = {"business"})
    java.util.List<IntegrationAccount> findByBusinessId(UUID businessId);
}
