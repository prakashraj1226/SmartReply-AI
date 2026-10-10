package com.smartreplyai.business;

import com.smartreplyai.business.dto.BusinessDto;
import com.smartreplyai.business.dto.UpdateBusinessProfileRequest;
import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/business")
public class BusinessController {

    private final BusinessService businessService;

    public BusinessController(BusinessService businessService) {
        this.businessService = businessService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<BusinessDto>> getProfile() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        BusinessDto dto = businessService.getBusinessById(businessId);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<BusinessDto>> updateProfile(@Valid @RequestBody UpdateBusinessProfileRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        BusinessDto dto = businessService.updateBusinessProfile(businessId, request);
        return ResponseEntity.ok(ApiResponse.ok("Business profile updated successfully", dto));
    }

    @GetMapping("/checklist")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChecklist() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        Map<String, Object> checklist = businessService.getSetupChecklist(businessId);
        return ResponseEntity.ok(ApiResponse.ok(checklist));
    }
}
