package com.smartreplyai.branch;

import com.smartreplyai.branch.dto.BranchDto;
import com.smartreplyai.branch.dto.CreateBranchRequest;
import com.smartreplyai.branch.dto.UpdateBranchRequest;
import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BranchDto>>> getBranches(
            @RequestParam(required = false, defaultValue = "true") Boolean activeOnly) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        List<BranchDto> branches = branchService.getBranches(businessId, activeOnly);
        return ResponseEntity.ok(ApiResponse.ok(branches));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BranchDto>> getBranchById(@PathVariable UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        BranchDto branch = branchService.getBranchById(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok(branch));
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<BranchDto>> createBranch(@Valid @RequestBody CreateBranchRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        BranchDto branch = branchService.createBranch(businessId, request);
        return ResponseEntity.ok(ApiResponse.ok("Branch created successfully", branch));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<BranchDto>> updateBranch(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBranchRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        BranchDto branch = branchService.updateBranch(businessId, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Branch updated successfully", branch));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<Void>> deactivateBranch(@PathVariable UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        branchService.deactivateBranch(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Branch deactivated successfully", null));
    }
}
