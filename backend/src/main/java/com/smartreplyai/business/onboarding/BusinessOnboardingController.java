package com.smartreplyai.business.onboarding;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/business/onboarding")
public class BusinessOnboardingController {

    private final BusinessOnboardingService onboardingService;

    public BusinessOnboardingController(BusinessOnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping("/templates")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTemplates() {
        return ResponseEntity.ok(ApiResponse.ok(onboardingService.getAvailableTemplates()));
    }

    @PostMapping("/apply-template")
    @PreAuthorize("@tenantSecurity.canManageCatalog()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> applyTemplate(@Valid @RequestBody ApplyTemplateRequest request) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        Map<String, Object> result = onboardingService.applyTemplate(businessId, request);
        return ResponseEntity.ok(ApiResponse.ok("Onboarding template applied successfully", result));
    }
}
