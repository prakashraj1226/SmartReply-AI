package com.smartreplyai.reports;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    private final ReportsService reportsService;

    public ReportsController(ReportsService reportsService) {
        this.reportsService = reportsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ReportsSummaryDto>> getSummary(
            @RequestParam(name = "period", defaultValue = "30_DAYS") String period) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        ReportsSummaryDto dto = reportsService.getSummary(businessId, period);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @GetMapping("/export-csv")
    public ResponseEntity<byte[]> exportConversationsCsv() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        byte[] csvData = reportsService.exportConversationsCsv(businessId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"conversations_report_" + System.currentTimeMillis() + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
