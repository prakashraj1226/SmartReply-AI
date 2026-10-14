package com.smartreplyai.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffLeaveRepository extends JpaRepository<StaffLeave, UUID> {
    List<StaffLeave> findByBusinessIdAndStaffId(UUID businessId, UUID staffId);
    List<StaffLeave> findByBusinessIdAndStaffIdAndLeaveDate(UUID businessId, UUID staffId, LocalDate leaveDate);
    boolean existsByBusinessIdAndStaffIdAndLeaveDateAndStatus(UUID businessId, UUID staffId, LocalDate leaveDate, String status);
    Optional<StaffLeave> findByBusinessIdAndId(UUID businessId, UUID id);
}
