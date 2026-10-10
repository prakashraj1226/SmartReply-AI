package com.smartreplyai.dashboard;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.dashboard.dto.DashboardStatsResponse;
import com.smartreplyai.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardStatsController {

    private final DashboardService dashboardService;

    public DashboardStatsController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats(
            @RequestParam(name = "range", defaultValue = "last_7_days") String range) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("No active business tenant context found");
        }
        DashboardStatsResponse stats = dashboardService.getStats(businessId, range);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
