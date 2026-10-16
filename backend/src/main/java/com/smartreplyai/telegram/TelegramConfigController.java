package com.smartreplyai.telegram;

import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.security.UserPrincipal;
import com.smartreplyai.telegram.client.TelegramSendResult;
import com.smartreplyai.telegram.dto.TelegramConfigDto;
import com.smartreplyai.telegram.dto.UpdateTelegramConfigRequest;
import com.smartreplyai.tenant.TenantContext;
import com.smartreplyai.whatsapp.dto.AutoReplyResult;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/telegram")
public class TelegramConfigController {

    private final TelegramIntegrationService telegramIntegrationService;

    public TelegramConfigController(TelegramIntegrationService telegramIntegrationService) {
        this.telegramIntegrationService = telegramIntegrationService;
    }

    @GetMapping("/config")
    @PreAuthorize("@tenantSecurity.canManageIntegrations()")
    public ResponseEntity<ApiResponse<TelegramConfigDto>> getConfig(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = resolveBusinessId(principal);
        TelegramConfigDto dto = telegramIntegrationService.getOrInitAccount(businessId);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PutMapping("/config")
    @PreAuthorize("@tenantSecurity.canManageIntegrations()")
    public ResponseEntity<ApiResponse<TelegramConfigDto>> updateConfig(
            @Valid @RequestBody UpdateTelegramConfigRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = resolveBusinessId(principal);
        TelegramConfigDto dto = telegramIntegrationService.updateAccount(businessId, req);
        return ResponseEntity.ok(ApiResponse.ok("Telegram Bot configuration updated", dto));
    }

    @PostMapping("/simulate")
    public ResponseEntity<ApiResponse<AutoReplyResult>> simulateWebhook(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = resolveBusinessId(principal);

        String text = body.get("text");
        String fromUserId = body.get("fromUserId");
        String fromName = body.get("fromName");
        String username = body.get("username");

        AutoReplyResult result = telegramIntegrationService.simulateCustomerMessage(
                businessId, text, fromUserId, fromName, username);
        return ResponseEntity.ok(ApiResponse.ok("Telegram automatic reply generated", result));
    }

    @PostMapping("/test-send")
    @PreAuthorize("@tenantSecurity.canManageIntegrations()")
    public ResponseEntity<ApiResponse<TelegramSendResult>> testSend(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = resolveBusinessId(principal);

        String chatId = body.get("chatId");
        String message = body.get("message");
        if (chatId == null || chatId.isBlank()) throw new BadRequestException("Telegram Chat ID is required");
        if (message == null || message.isBlank()) throw new BadRequestException("Message content is required");

        TelegramSendResult result = telegramIntegrationService.testSendMessage(businessId, chatId, message);
        return ResponseEntity.ok(ApiResponse.ok("Test message dispatched to Telegram", result));
    }

    private UUID resolveBusinessId(UserPrincipal principal) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null && principal != null && principal.getDefaultBusinessId() != null) {
            businessId = principal.getDefaultBusinessId();
            TenantContext.setBusinessId(businessId);
        }
        if (businessId == null) {
            throw new BadRequestException("Active business tenant required");
        }
        return businessId;
    }
}
