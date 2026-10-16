package com.smartreplyai.whatsapp;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import com.smartreplyai.whatsapp.client.WhatsAppSendResult;
import com.smartreplyai.whatsapp.dto.AutoReplyResult;
import com.smartreplyai.whatsapp.dto.UpdateWhatsAppConfigRequest;
import com.smartreplyai.whatsapp.dto.WhatsAppConfigDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/whatsapp")
public class WhatsAppConfigController {

    private final WhatsAppIntegrationService whatsAppIntegrationService;

    public WhatsAppConfigController(WhatsAppIntegrationService whatsAppIntegrationService) {
        this.whatsAppIntegrationService = whatsAppIntegrationService;
    }

    @GetMapping("/config")
    @PreAuthorize("@tenantSecurity.canManageIntegrations()")
    public ResponseEntity<ApiResponse<WhatsAppConfigDto>> getConfig() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        WhatsAppConfigDto dto = whatsAppIntegrationService.getOrInitAccount(businessId);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PutMapping("/config")
    @PreAuthorize("@tenantSecurity.canManageIntegrations()")
    public ResponseEntity<ApiResponse<WhatsAppConfigDto>> updateConfig(
            @Valid @RequestBody UpdateWhatsAppConfigRequest req) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        WhatsAppConfigDto dto = whatsAppIntegrationService.updateAccount(businessId, req);
        return ResponseEntity.ok(ApiResponse.ok("WhatsApp configuration updated", dto));
    }

    @PostMapping("/test-send")
    @PreAuthorize("@tenantSecurity.canManageIntegrations()")
    public ResponseEntity<ApiResponse<WhatsAppSendResult>> testSend(
            @RequestBody Map<String, String> body) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        String recipient = body.get("recipientPhone");
        String message = body.get("message");
        if (recipient == null || recipient.isBlank()) throw new BadRequestException("Recipient phone number is required");
        if (message == null || message.isBlank()) throw new BadRequestException("Message content is required");

        WhatsAppSendResult result = whatsAppIntegrationService.testSendMessage(businessId, recipient, message);
        return ResponseEntity.ok(ApiResponse.ok("Test message dispatched", result));
    }

    @PostMapping("/simulate-webhook")
    public ResponseEntity<ApiResponse<AutoReplyResult>> simulateWebhook(
            @RequestBody Map<String, String> body) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        AutoReplyResult result = whatsAppIntegrationService.simulateCustomerMessage(
                businessId,
                body.get("fromPhone"),
                body.get("text"),
                body.get("senderName")
        );
        return ResponseEntity.ok(ApiResponse.ok("Automatic reply created", result));
    }
}
