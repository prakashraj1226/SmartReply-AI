package com.smartreplyai.automation;

import com.smartreplyai.automation.dto.AutomationExecutionDto;
import com.smartreplyai.automation.dto.AutomationRuleDto;
import com.smartreplyai.automation.dto.CreateAutomationRuleRequest;
import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/automations")
public class AutomationController {

    private final AutomationEngineService automationEngineService;

    public AutomationController(AutomationEngineService automationEngineService) {
        this.automationEngineService = automationEngineService;
    }

    @GetMapping("/rules")
    public ResponseEntity<ApiResponse<List<AutomationRuleDto>>> getRules() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        List<AutomationRuleDto> rules = automationEngineService.getRules(businessId);
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @PostMapping("/rules")
    public ResponseEntity<ApiResponse<AutomationRuleDto>> createRule(
            @Valid @RequestBody CreateAutomationRuleRequest req) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        AutomationRuleDto rule = automationEngineService.createRule(businessId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Automation rule created", rule));
    }

    @PutMapping("/rules/{id}")
    public ResponseEntity<ApiResponse<AutomationRuleDto>> updateRule(
            @PathVariable("id") UUID id,
            @Valid @RequestBody CreateAutomationRuleRequest req) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        AutomationRuleDto rule = automationEngineService.updateRule(businessId, id, req);
        return ResponseEntity.ok(ApiResponse.ok("Automation rule updated", rule));
    }

    @PatchMapping("/rules/{id}/toggle")
    public ResponseEntity<ApiResponse<AutomationRuleDto>> toggleRule(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        AutomationRuleDto rule = automationEngineService.toggleRule(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Automation rule status updated", rule));
    }

    @DeleteMapping("/rules/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        automationEngineService.deleteRule(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Automation rule deleted", null));
    }

    @GetMapping("/executions")
    public ResponseEntity<ApiResponse<Page<AutomationExecutionDto>>> getExecutions(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        Page<AutomationExecutionDto> executions = automationEngineService.getExecutions(businessId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(executions));
    }
}
