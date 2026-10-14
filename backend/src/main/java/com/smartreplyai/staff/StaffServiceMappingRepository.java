package com.smartreplyai.staff;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffServiceMappingRepository extends JpaRepository<StaffServiceMapping, UUID> {
    List<StaffServiceMapping> findByBusinessIdAndStaffId(UUID businessId, UUID staffId);
    List<StaffServiceMapping> findByBusinessIdAndServiceItemId(UUID businessId, UUID serviceId);
    Optional<StaffServiceMapping> findByBusinessIdAndStaffIdAndServiceItemId(UUID businessId, UUID staffId, UUID serviceId);

    @Query("SELECT ssm.staff FROM StaffServiceMapping ssm WHERE ssm.business.id = :businessId AND ssm.serviceItem.id = :serviceId AND ssm.staff.isActive = true")
    List<Staff> findEligibleStaffForService(@Param("businessId") UUID businessId, @Param("serviceId") UUID serviceId);

    void deleteByBusinessIdAndStaffId(UUID businessId, UUID staffId);
}
