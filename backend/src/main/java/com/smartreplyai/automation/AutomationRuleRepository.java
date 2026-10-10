package com.smartreplyai.automation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AutomationRuleRepository extends JpaRepository<AutomationRule, UUID> {

    List<AutomationRule> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

    List<AutomationRule> findByBusinessIdAndTriggerEventAndIsActiveTrue(UUID businessId, String triggerEvent);

    Optional<AutomationRule> findByBusinessIdAndId(UUID businessId, UUID id);
}
