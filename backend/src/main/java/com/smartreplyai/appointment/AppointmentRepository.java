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
           "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
           "AND (:excludeId IS NULL OR a.id != :excludeId) " +
           "AND (:staffName IS NULL OR a.staffName = :staffName) " +
           "AND (a.startTime < :endTime AND a.endTime > :startTime)")
    long countConflictingAppointments(@Param("businessId") UUID businessId,
                                      @Param("excludeId") UUID excludeId,
                                      @Param("staffName") String staffName,
                                      @Param("startTime") Instant startTime,
                                      @Param("endTime") Instant endTime);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.business.id = :businessId " +
           "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
           "AND (:excludeId IS NULL OR a.id != :excludeId) " +
           "AND (:staffId IS NULL OR a.staff.id = :staffId) " +
           "AND (a.startTime < :endTime AND a.endTime > :startTime)")
    long countConflictingStaffAppointments(@Param("businessId") UUID businessId,
                                           @Param("excludeId") UUID excludeId,
                                           @Param("staffId") UUID staffId,
                                           @Param("startTime") Instant startTime,
                                           @Param("endTime") Instant endTime);

    @Query("SELECT a FROM Appointment a WHERE a.business.id = :businessId " +
           "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
           "AND (:branchId IS NULL OR a.branch.id = :branchId) " +
           "AND (:staffId IS NULL OR a.staff.id = :staffId) " +
           "AND a.startTime >= :rangeStart AND a.endTime <= :rangeEnd " +
           "ORDER BY a.startTime ASC")
    List<Appointment> findActiveAppointmentsInRange(@Param("businessId") UUID businessId,
                                                   @Param("branchId") UUID branchId,
                                                   @Param("staffId") UUID staffId,
                                                   @Param("rangeStart") Instant rangeStart,
                                                   @Param("rangeEnd") Instant rangeEnd);

    long countByBusinessIdAndStartTimeAfter(UUID businessId, Instant now);

    long countByBusinessIdAndStatus(UUID businessId, String status);

    long countByStatus(String status);

    long countByBusinessIdAndCreatedAtBetween(UUID businessId, Instant start, Instant end);

    long countByBusinessIdAndCreatedAtGreaterThanEqual(UUID businessId, Instant start);
}
