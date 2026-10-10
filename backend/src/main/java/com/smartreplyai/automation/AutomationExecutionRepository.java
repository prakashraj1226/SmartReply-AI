package com.smartreplyai.automation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AutomationExecutionRepository extends JpaRepository<AutomationExecution, UUID> {

    Page<AutomationExecution> findByBusinessIdOrderByExecutedAtDesc(UUID businessId, Pageable pageable);

    Page<AutomationExecution> findByBusinessIdAndRuleIdOrderByExecutedAtDesc(UUID businessId, UUID ruleId, Pageable pageable);
}
