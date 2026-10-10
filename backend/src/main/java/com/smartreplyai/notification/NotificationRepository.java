package com.smartreplyai.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByBusinessIdOrderByCreatedAtDesc(UUID businessId, Pageable pageable);

    long countByBusinessIdAndIsReadFalse(UUID businessId);

    Optional<Notification> findByBusinessIdAndId(UUID businessId, UUID id);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.business.id = :businessId AND n.isRead = false")
    void markAllAsRead(@Param("businessId") UUID businessId);
}
