package com.smartreplyai.whatsapp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/whatsapp")
public class WhatsAppWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppWebhookController.class);

    private final WhatsAppIntegrationService whatsAppIntegrationService;

    public WhatsAppWebhookController(WhatsAppIntegrationService whatsAppIntegrationService) {
        this.whatsAppIntegrationService = whatsAppIntegrationService;
    }

    /**
     * Meta WhatsApp Webhook Subscription Verification
     */
    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.verify_token", required = false) String verifyToken,
            @RequestParam(name = "hub.challenge", required = false) String challenge) {

        logger.info("Received WhatsApp webhook verification request: mode={}, token={}", mode, verifyToken);
        String validChallenge = whatsAppIntegrationService.verifyWebhook(mode, verifyToken, challenge);

        if (validChallenge != null) {
            return ResponseEntity.ok(validChallenge);
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification token mismatch");
        }
    }

    /**
     * Meta WhatsApp Event Notifications Receiver
     */
    @PostMapping
    public ResponseEntity<String> receiveWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(name = "X-Hub-Signature-256", required = false) String signatureHeader) {

        logger.debug("Received WhatsApp webhook event payload");
        whatsAppIntegrationService.processIncomingWebhook(rawPayload, signatureHeader);

        // Meta requires an immediate 200 OK response to avoid delivery retries
        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}
