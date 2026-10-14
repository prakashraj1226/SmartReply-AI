package com.smartreplyai.staff;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.servicecatalog.dto.ServiceItemDto;
import com.smartreplyai.staff.dto.*;
import com.smartreplyai.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StaffDto>>> getStaff(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) String staffType,
            @RequestParam(required = false) UUID serviceId,
            @RequestParam(required = false, defaultValue = "true") Boolean activeOnly) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        List<StaffDto> list = staffService.getStaff(businessId, branchId, staffType, serviceId, activeOnly);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StaffDto>> getStaffById(@PathVariable UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        StaffDto staff = staffService.getStaffById(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok(staff));
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<StaffDto>> createStaff(@Valid @RequestBody CreateStaffRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        StaffDto staff = staffService.createStaff(businessId, request);
        return ResponseEntity.ok(ApiResponse.ok("Staff member created successfully", staff));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<StaffDto>> updateStaff(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStaffRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        StaffDto staff = staffService.updateStaff(businessId, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Staff member updated successfully", staff));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<Void>> deactivateStaff(@PathVariable UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        staffService.deactivateStaff(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Staff member deactivated successfully", null));
    }

    // --- Services ---

    @GetMapping("/{id}/services")
    public ResponseEntity<ApiResponse<List<ServiceItemDto>>> getAssignedServices(@PathVariable UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        List<ServiceItemDto> services = staffService.getAssignedServices(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok(services));
    }

    @PostMapping("/{id}/services")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<List<ServiceItemDto>>> assignServices(
            @PathVariable UUID id,
            @Valid @RequestBody AssignServicesRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        List<ServiceItemDto> services = staffService.assignServices(businessId, id, request.getServiceIds());
        return ResponseEntity.ok(ApiResponse.ok("Staff services assigned successfully", services));
    }

    @GetMapping("/for-service/{serviceId}")
    public ResponseEntity<ApiResponse<List<StaffDto>>> getStaffForService(@PathVariable UUID serviceId) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        List<StaffDto> staffList = staffService.getEligibleStaffForService(businessId, serviceId);
        return ResponseEntity.ok(ApiResponse.ok(staffList));
    }

    // --- Availability ---

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<List<StaffAvailabilityDto>>> getStaffAvailability(@PathVariable UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        List<StaffAvailabilityDto> list = staffService.getStaffAvailability(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PutMapping("/{id}/availability")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<List<StaffAvailabilityDto>>> saveStaffAvailability(
            @PathVariable UUID id,
            @Valid @RequestBody List<SaveStaffAvailabilityRequest> requests) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        List<StaffAvailabilityDto> updated = staffService.saveStaffAvailability(businessId, id, requests);
        return ResponseEntity.ok(ApiResponse.ok("Staff availability updated successfully", updated));
    }

    // --- Leaves ---

    @GetMapping("/{id}/leaves")
    public ResponseEntity<ApiResponse<List<StaffLeaveDto>>> getStaffLeaves(@PathVariable UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        List<StaffLeaveDto> leaves = staffService.getStaffLeaves(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok(leaves));
    }

    @PostMapping("/{id}/leaves")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<StaffLeaveDto>> createStaffLeave(
            @PathVariable UUID id,
            @Valid @RequestBody CreateStaffLeaveRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        StaffLeaveDto leave = staffService.createStaffLeave(businessId, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Staff leave recorded successfully", leave));
    }

    @DeleteMapping("/{id}/leaves/{leaveId}")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<Void>> cancelStaffLeave(
            @PathVariable UUID id,
            @PathVariable UUID leaveId) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        staffService.cancelStaffLeave(businessId, id, leaveId);
        return ResponseEntity.ok(ApiResponse.ok("Staff leave cancelled successfully", null));
    }
}
