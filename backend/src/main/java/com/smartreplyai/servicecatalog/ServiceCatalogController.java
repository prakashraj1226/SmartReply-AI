package com.smartreplyai.servicecatalog;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.servicecatalog.dto.CreateServiceItemRequest;
import com.smartreplyai.servicecatalog.dto.ServiceItemDto;
import com.smartreplyai.servicecatalog.dto.UpdateServiceItemRequest;
import com.smartreplyai.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/services")
public class ServiceCatalogController {

    private final ServiceCatalogService serviceCatalogService;

    public ServiceCatalogController(ServiceCatalogService serviceCatalogService) {
        this.serviceCatalogService = serviceCatalogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceItemDto>>> getServices(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "true") Boolean activeOnly) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        List<ServiceItemDto> services = serviceCatalogService.getServices(businessId, branchId, category, activeOnly);
        return ResponseEntity.ok(ApiResponse.ok(services));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        List<String> categories = serviceCatalogService.getCategories(businessId);
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceItemDto>> getServiceById(@PathVariable UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        ServiceItemDto service = serviceCatalogService.getServiceById(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok(service));
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<ServiceItemDto>> createService(@Valid @RequestBody CreateServiceItemRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        ServiceItemDto service = serviceCatalogService.createService(businessId, request);
        return ResponseEntity.ok(ApiResponse.ok("Service created successfully", service));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<ServiceItemDto>> updateService(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateServiceItemRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        ServiceItemDto service = serviceCatalogService.updateService(businessId, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Service updated successfully", service));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<Void>> deactivateService(@PathVariable UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        serviceCatalogService.deactivateService(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Service deactivated successfully", null));
    }
}
