package com.smartreplyai.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffRepository extends JpaRepository<Staff, UUID> {
    List<Staff> findByBusinessIdAndIsActiveTrue(UUID businessId);
    List<Staff> findByBusinessId(UUID businessId);
    Optional<Staff> findByBusinessIdAndId(UUID businessId, UUID id);
    List<Staff> findByBusinessIdAndBranchId(UUID businessId, UUID branchId);
    List<Staff> findByBusinessIdAndBranchIdAndIsActiveTrue(UUID businessId, UUID branchId);
    List<Staff> findByBusinessIdAndStaffType(UUID businessId, String staffType);
    List<Staff> findByBusinessIdAndStaffTypeAndIsActiveTrue(UUID businessId, String staffType);
    Optional<Staff> findByBusinessIdAndUserId(UUID businessId, UUID userId);
    boolean existsByBusinessIdAndUserId(UUID businessId, UUID userId);
    Optional<Staff> findByBusinessIdAndEmail(UUID businessId, String email);
    boolean existsByBusinessIdAndEmail(UUID businessId, String email);
    long countByBusinessId(UUID businessId);
    long countByBusinessIdAndIsActiveTrue(UUID businessId);
}
