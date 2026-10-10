package com.smartreplyai.appointment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    List<Appointment> findByBusinessIdAndStartTimeGreaterThanEqualAndEndTimeLessThanEqualOrderByStartTimeAsc(
            UUID businessId, Instant start, Instant end);

    Page<Appointment> findByBusinessIdOrderByStartTimeDesc(UUID businessId, Pageable pageable);

    List<Appointment> findByBusinessIdAndCustomerIdOrderByStartTimeDesc(UUID businessId, UUID customerId);

    Optional<Appointment> findByBusinessIdAndId(UUID businessId, UUID id);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.business.id = :businessId " +
           "AND a.status != 'CANCELLED' " +
           "AND (:excludeId IS NULL OR a.id != :excludeId) " +
           "AND (:staffName IS NULL OR a.staffName = :staffName) " +
           "AND (a.startTime < :endTime AND a.endTime > :startTime)")
    long countConflictingAppointments(@Param("businessId") UUID businessId,
                                     @Param("excludeId") UUID excludeId,
                                     @Param("staffName") String staffName,
                                     @Param("startTime") Instant startTime,
                                     @Param("endTime") Instant endTime);

    long countByBusinessIdAndStartTimeAfter(UUID businessId, Instant now);
}
