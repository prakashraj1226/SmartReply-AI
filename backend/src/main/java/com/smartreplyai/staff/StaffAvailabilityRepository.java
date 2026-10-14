package com.smartreplyai.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffAvailabilityRepository extends JpaRepository<StaffAvailability, UUID> {
    List<StaffAvailability> findByBusinessIdAndStaffIdAndIsActiveTrue(UUID businessId, UUID staffId);
    List<StaffAvailability> findByBusinessIdAndStaffId(UUID businessId, UUID staffId);
    Optional<StaffAvailability> findByBusinessIdAndStaffIdAndDayOfWeek(UUID businessId, UUID staffId, int dayOfWeek);
    List<StaffAvailability> findByBusinessIdAndDayOfWeekAndIsActiveTrue(UUID businessId, int dayOfWeek);
}
