package com.smartreplyai.telegram;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/telegram")
public class TelegramWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(TelegramWebhookController.class);

    private final TelegramIntegrationService telegramIntegrationService;

    public TelegramWebhookController(TelegramIntegrationService telegramIntegrationService) {
        this.telegramIntegrationService = telegramIntegrationService;
    }

    /**
     * Standard Telegram Webhook receiver endpoint.
     * Supports authentication via X-Telegram-Bot-Api-Secret-Token header or ?secret= query parameter.
     */
    @PostMapping
    public ResponseEntity<String> receiveWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(name = "X-Telegram-Bot-Api-Secret-Token", required = false) String secretHeader,
            @RequestParam(name = "secret", required = false) String secretParam) {

        logger.debug("Received Telegram webhook event payload");
        String secret = secretHeader != null && !secretHeader.isBlank() ? secretHeader : secretParam;
        telegramIntegrationService.processIncomingWebhook(rawPayload, secret, null);

        // Telegram Bot API requires a 200 OK response to prevent message redelivery loops
        return ResponseEntity.ok("OK");
    }

    /**
     * Path-based Telegram Webhook receiver endpoint: /api/webhooks/telegram/{secretPath}
     * Guarantees exact tenant mapping even if headers are stripped by reverse proxies.
     */
    @PostMapping("/{secretPath}")
    public ResponseEntity<String> receiveWebhookWithPath(
            @PathVariable String secretPath,
            @RequestBody String rawPayload,
            @RequestHeader(name = "X-Telegram-Bot-Api-Secret-Token", required = false) String secretHeader) {

        logger.debug("Received Telegram webhook event payload with path secret");
        telegramIntegrationService.processIncomingWebhook(rawPayload, secretHeader, secretPath);
        return ResponseEntity.ok("OK");
    }
}
