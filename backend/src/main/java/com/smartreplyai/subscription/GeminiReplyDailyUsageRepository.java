package com.smartreplyai.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GeminiReplyDailyUsageRepository extends JpaRepository<GeminiReplyDailyUsage, UUID> {

    Optional<GeminiReplyDailyUsage> findByBusinessIdAndUsageDate(UUID businessId, LocalDate usageDate);

    @Query("SELECT COALESCE(SUM(u.replyCount), 0) FROM GeminiReplyDailyUsage u " +
            "WHERE u.business.id = :businessId AND u.usageDate >= :start AND u.usageDate <= :end")
    long sumRepliesBetween(@Param("businessId") UUID businessId,
                           @Param("start") LocalDate start,
                           @Param("end") LocalDate end);
}
