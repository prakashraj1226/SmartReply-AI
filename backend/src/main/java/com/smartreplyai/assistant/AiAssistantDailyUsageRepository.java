package com.smartreplyai.assistant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiAssistantDailyUsageRepository extends JpaRepository<AiAssistantDailyUsage, UUID> {

    Optional<AiAssistantDailyUsage> findByBusinessIdAndUsageDate(UUID businessId, LocalDate usageDate);
}
