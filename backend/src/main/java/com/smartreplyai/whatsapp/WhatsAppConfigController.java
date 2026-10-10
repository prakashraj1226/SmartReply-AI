package com.smartreplyai.whatsapp;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import com.smartreplyai.whatsapp.client.WhatsAppSendResult;
import com.smartreplyai.whatsapp.dto.UpdateWhatsAppConfigRequest;
import com.smartreplyai.whatsapp.dto.WhatsAppConfigDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApiResponse<WhatsAppConfigDto>> getConfig() {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        WhatsAppConfigDto dto = whatsAppIntegrationService.getOrInitAccount(businessId);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<WhatsAppConfigDto>> updateConfig(
            @Valid @RequestBody UpdateWhatsAppConfigRequest req) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        WhatsAppConfigDto dto = whatsAppIntegrationService.updateAccount(businessId, req);
        return ResponseEntity.ok(ApiResponse.ok("WhatsApp configuration updated", dto));
    }

    @PostMapping("/test-send")
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
    public ResponseEntity<ApiResponse<String>> simulateWebhook(
            @RequestBody Map<String, String> body) {
        String fromPhone = body.getOrDefault("fromPhone", "+919876543210");
        String messageText = body.getOrDefault("text", "Hello, do you have appointments today?");
        String senderName = body.getOrDefault("senderName", "WhatsApp User");

        UUID businessId = TenantContext.getBusinessId();
        WhatsAppConfigDto cfg = whatsAppIntegrationService.getOrInitAccount(businessId);
        String phoneId = cfg.getPhoneNumberId() != null ? cfg.getPhoneNumberId() : "1029384756";
        String wamid = "wamid.TEST_HOOK_" + System.currentTimeMillis();

        String payload = String.format("""
        {
          "object": "whatsapp_business_account",
          "entry": [{
            "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
            "changes": [{
              "value": {
                "messaging_product": "whatsapp",
                "metadata": {
                  "display_phone_number": "1555001122",
                  "phone_number_id": "%s"
                },
                "contacts": [{
                  "profile": { "name": "%s" },
                  "wa_id": "%s"
                }],
                "messages": [{
                  "from": "%s",
                  "id": "%s",
                  "timestamp": "%d",
                  "text": { "body": "%s" },
                  "type": "text"
                }]
              },
              "field": "messages"
            }]
          }]
        }
        """, phoneId, senderName, fromPhone.replaceAll("[^0-9]", ""), fromPhone, wamid, System.currentTimeMillis() / 1000, messageText);

        whatsAppIntegrationService.processIncomingWebhook(payload, null);
        return ResponseEntity.ok(ApiResponse.ok("Simulated webhook processed", wamid));
    }
}
