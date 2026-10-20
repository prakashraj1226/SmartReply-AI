package com.smartreplyai.whatsapp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.conversation.ConversationService;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.message.MessageRepository;
import com.smartreplyai.tenant.TenantContext;
import com.smartreplyai.whatsapp.client.OfficialWhatsAppCloudApiClient;
import com.smartreplyai.whatsapp.client.WhatsAppSendResult;
import com.smartreplyai.whatsapp.dto.AutoReplyResult;
import com.smartreplyai.whatsapp.dto.UpdateWhatsAppConfigRequest;
import com.smartreplyai.whatsapp.dto.WhatsAppConfigDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class WhatsAppIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppIntegrationService.class);

    private final IntegrationAccountRepository integrationAccountRepository;
    private final WebhookEventRepository webhookEventRepository;
    private final BusinessRepository businessRepository;
    private final CustomerRepository customerRepository;
    private final MessageRepository messageRepository;
    private final ConversationService conversationService;
    private final ConversationRepository conversationRepository;
    private final OfficialWhatsAppCloudApiClient whatsAppClient;
    private final ObjectMapper objectMapper;
    private final com.smartreplyai.subscription.PlanLimitService planLimitService;

    @Value("${app.backend-base-url:}")
    private String backendBaseUrl;

    @Value("${server.port:8080}")
    private int serverPort;

    public WhatsAppIntegrationService(IntegrationAccountRepository integrationAccountRepository,
                                      WebhookEventRepository webhookEventRepository,
                                      BusinessRepository businessRepository,
                                      CustomerRepository customerRepository,
                                      MessageRepository messageRepository,
                                      ConversationService conversationService,
                                      ConversationRepository conversationRepository,
                                      OfficialWhatsAppCloudApiClient whatsAppClient,
                                      ObjectMapper objectMapper,
                                      com.smartreplyai.subscription.PlanLimitService planLimitService) {
        this.integrationAccountRepository = integrationAccountRepository;
        this.webhookEventRepository = webhookEventRepository;
        this.businessRepository = businessRepository;
        this.customerRepository = customerRepository;
        this.messageRepository = messageRepository;
        this.conversationService = conversationService;
        this.conversationRepository = conversationRepository;
        this.whatsAppClient = whatsAppClient;
        this.objectMapper = objectMapper;
        this.planLimitService = planLimitService;
    }

    @Transactional
    public WhatsAppConfigDto getOrInitAccount(UUID businessId) {
        IntegrationAccount account = integrationAccountRepository.findByBusinessIdAndProvider(businessId, "WHATSAPP_CLOUD")
                .orElseGet(() -> {
                    Business biz = businessRepository.findById(businessId)
                            .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
                    IntegrationAccount newAcc = new IntegrationAccount(biz, "WHATSAPP_CLOUD");
                    newAcc.setPhoneNumberId("sandbox_" + biz.getId().toString().substring(0, 8));
                    return integrationAccountRepository.save(newAcc);
                });

        if (account.getPhoneNumberId() == null || account.getPhoneNumberId().isBlank()) {
            account.setPhoneNumberId("sandbox_" + businessId.toString().substring(0, 8));
            account = integrationAccountRepository.save(account);
        }

        return toDto(account);
    }

    @Transactional
    public WhatsAppConfigDto updateAccount(UUID businessId, UpdateWhatsAppConfigRequest req) {
        IntegrationAccount account = integrationAccountRepository.findByBusinessIdAndProvider(businessId, "WHATSAPP_CLOUD")
                .orElseGet(() -> {
                    Business biz = businessRepository.findById(businessId)
                            .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
                    return new IntegrationAccount(biz, "WHATSAPP_CLOUD");
                });

        if (req.getAccountId() != null) account.setAccountId(req.getAccountId().trim());
        if (req.getPhoneNumberId() != null) account.setPhoneNumberId(req.getPhoneNumberId().trim());
        if (req.getPhoneNumber() != null) account.setPhoneNumber(req.getPhoneNumber().trim());
        if (req.getAccessToken() != null && !req.getAccessToken().isBlank()) {
            account.setAccessToken(req.getAccessToken().trim());
        }
        if (req.getWebhookVerifyToken() != null && !req.getWebhookVerifyToken().isBlank()) {
            account.setWebhookVerifyToken(req.getWebhookVerifyToken().trim());
        }
        if (req.getAppSecret() != null && !req.getAppSecret().isBlank()) {
            account.setAppSecret(req.getAppSecret().trim());
        }
        if (req.getIsSandbox() != null) {
            account.setSandbox(req.getIsSandbox());
        }

        // Test credentials if not in sandbox and credentials provided
        if (!account.isSandbox() && account.getAccessToken() != null && account.getPhoneNumberId() != null) {
            boolean valid = whatsAppClient.verifyCredentials(account);
            account.setStatus(valid ? "CONNECTED" : "ERROR");
        } else if (account.isSandbox()) {
            account.setStatus("SANDBOX");
        }

        account = integrationAccountRepository.save(account);
        return toDto(account);
    }

    public String verifyWebhook(String mode, String verifyToken, String challenge) {
        if ("subscribe".equalsIgnoreCase(mode)) {
            // Find account with this token
            Optional<IntegrationAccount> acc = integrationAccountRepository.findByWebhookVerifyToken(verifyToken);
            if (acc.isPresent() || "smartreply_default_verify_token".equals(verifyToken)) {
                logger.info("WhatsApp Webhook subscription verified successfully with token: {}", verifyToken);
                return challenge;
            }
        }
        logger.warn("WhatsApp Webhook subscription failed verification. mode={}, token={}", mode, verifyToken);
        return null;
    }

    public boolean validateSignature(String rawPayload, String signatureHeader, String appSecret) {
        if (appSecret == null || appSecret.isBlank() || signatureHeader == null) {
            return true; // Soft bypass if secret not configured (dev mode)
        }

        try {
            String cleanSig = signatureHeader.replace("sha256=", "").trim();
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(appSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
            String calculated = HexFormat.of().formatHex(hmacBytes);
            return calculated.equalsIgnoreCase(cleanSig);
        } catch (Exception e) {
            logger.error("Error validating HMAC signature", e);
            return false;
        }
    }

    // Not @Transactional: ConversationService commits customer msg first, then AI (REQUIRES_NEW)
    public void processIncomingWebhook(String rawPayload, String signatureHeader) {
        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            JsonNode entryArray = root.path("entry");
            if (!entryArray.isArray()) return;

            for (JsonNode entry : entryArray) {
                JsonNode changesArray = entry.path("changes");
                if (!changesArray.isArray()) continue;

                for (JsonNode change : changesArray) {
                    JsonNode value = change.path("value");
                    String phoneNumberId = value.path("metadata").path("phone_number_id").asText();
                    String displayPhone = value.path("metadata").path("display_phone_number").asText();

                    // 1. Process delivery statuses (SENT, DELIVERED, READ, FAILED)
                    JsonNode statusesArray = value.path("statuses");
                    if (statusesArray.isArray()) {
                        for (JsonNode statusNode : statusesArray) {
                            String wamid = statusNode.path("id").asText();
                            String statusStr = statusNode.path("status").asText().toUpperCase();
                            handleStatusUpdate(wamid, statusStr);
                        }
                    }

                    // 2. Process incoming messages
                    JsonNode messagesArray = value.path("messages");
                    if (messagesArray.isArray()) {
                        for (JsonNode msgNode : messagesArray) {
                            String wamid = msgNode.path("id").asText();
                            String fromPhone = msgNode.path("from").asText();
                            String textBody = msgNode.path("text").path("body").asText();
                            String senderName = value.path("contacts").path(0).path("profile").path("name").asText("Customer");

                            handleIncomingMessage(phoneNumberId, displayPhone, wamid, fromPhone, textBody, senderName, rawPayload, signatureHeader);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to parse incoming WhatsApp webhook payload", e);
        }
    }

    private void handleStatusUpdate(String wamid, String status) {
        if (wamid == null || wamid.isBlank()) return;
        messageRepository.findByExternalMessageId(wamid).ifPresent(msg -> {
            msg.setDeliveryStatus(status);
            messageRepository.save(msg);
            logger.info("Updated message {} status to {}", wamid, status);
        });
    }

    private void handleIncomingMessage(String phoneNumberId, String displayPhone, String wamid, String fromPhone,
                                       String textBody, String senderName, String rawPayload, String signatureHeader) {
        // Idempotency: Prevent duplicate webhook processing
        if (wamid != null && webhookEventRepository.existsByEventId(wamid)) {
            logger.info("Webhook event {} already processed. Skipping duplicate.", wamid);
            return;
        }

        // Record event
        WebhookEvent event = new WebhookEvent("WHATSAPP_CLOUD", wamid != null ? wamid : UUID.randomUUID().toString(), null);
        webhookEventRepository.save(event);

        // Find business owning this phone_number_id or display_phone_number
        IntegrationAccount account = null;
        if (phoneNumberId != null && !phoneNumberId.isBlank()) {
            account = integrationAccountRepository.findByPhoneNumberId(phoneNumberId).orElse(null);
        }
        if (account == null && displayPhone != null && !displayPhone.isBlank()) {
            account = integrationAccountRepository.findByPhoneNumber(displayPhone).orElse(null);
            if (account == null && !displayPhone.startsWith("+")) {
                account = integrationAccountRepository.findByPhoneNumber("+" + displayPhone).orElse(null);
            }
        }
        if (account == null && TenantContext.getBusinessId() != null) {
            account = integrationAccountRepository.findByBusinessIdAndProvider(TenantContext.getBusinessId(), "WHATSAPP_CLOUD").orElse(null);
        }

        if (account == null) {
            logger.warn("No integration account registered for WhatsApp phone number ID {} / display phone {}", phoneNumberId, displayPhone);
            return;
        }

        final IntegrationAccount finalAccount = account;

        // Suspended tenants must not receive auto-replies or create new customer traffic
        Business owningBusiness = finalAccount.getBusiness();
        if (owningBusiness == null || !owningBusiness.isActive()) {
            logger.info("Ignoring WhatsApp inbound message for suspended business (phone_number_id={})", phoneNumberId);
            return;
        }

        // Validate HMAC signature if configured
        if (!validateSignature(rawPayload, signatureHeader, finalAccount.getAppSecret())) {
            logger.error("HMAC signature validation failed for WhatsApp webhook!");
            return;
        }

        UUID businessId = owningBusiness.getId();
        UUID prevTenant = TenantContext.getBusinessId();
        try {
            // Set TenantContext for strict multi-tenant isolation during inbound webhook processing
            TenantContext.setCurrentTenant(businessId);

            String formattedPhone = fromPhone.startsWith("+") ? fromPhone : "+" + fromPhone;

            // Find or create customer
            Customer customer = customerRepository.findByBusinessIdAndPhoneNumber(businessId, formattedPhone)
                    .orElseGet(() -> {
                        Customer newCust = new Customer(owningBusiness, formattedPhone, senderName, null);
                        return customerRepository.save(newCust);
                    });

            // Opt-in / Opt-out WhatsApp compliance logic
            String cleanText = textBody != null ? textBody.trim().toUpperCase() : "";
            if ("STOP".equals(cleanText) || "UNSUBSCRIBE".equals(cleanText) || "CANCEL".equals(cleanText)) {
                customer.setOptInStatus("OPTED_OUT");
                customerRepository.save(customer);
                whatsAppClient.sendTextMessage(finalAccount, formattedPhone,
                        "You have been successfully unsubscribed from automated messages. Reply START at any time to resume.");
                return;
            } else if ("START".equals(cleanText) || "UNSTOP".equals(cleanText)) {
                customer.setOptInStatus("OPTED_IN");
                customerRepository.save(customer);
                whatsAppClient.sendTextMessage(finalAccount, formattedPhone,
                        "You have successfully subscribed to messages from " + owningBusiness.getName() + ".");
                return;
            }

            if (!"OPTED_IN".equals(customer.getOptInStatus())) {
                logger.info("Customer {} is opted out. Ignoring inbound message.", customer.getPhoneNumber());
                return;
            }

            // Delegate to ConversationService for thread management & AI autonomous answering
            conversationService.handleCustomerMessage(businessId, customer.getId(), textBody, wamid);
        } finally {
            if (prevTenant != null) {
                TenantContext.setCurrentTenant(prevTenant);
            } else {
                TenantContext.clear();
            }
        }
    }

    @Transactional
    public AutoReplyResult simulateCustomerMessage(UUID businessId, String fromPhone, String text, String senderName) {
        planLimitService.ensureBusinessActive(businessId);
        if (!planLimitService.canSendWhatsAppAutoReply(businessId)) {
            throw new BadRequestException("Your free trial has ended. Please upgrade your plan to continue using premium features.");
        }
        if (text == null || text.isBlank()) {
            throw new BadRequestException("Customer message is required");
        }
        String digits = fromPhone == null ? "" : fromPhone.replaceAll("[^0-9]", "");
        if (digits.length() < 8) {
            throw new BadRequestException("Customer phone number is required");
        }
        String name = (senderName == null || senderName.isBlank()) ? "Customer" : senderName.trim();
        IntegrationAccount account = integrationAccountRepository.findByBusinessIdAndProvider(businessId, "WHATSAPP_CLOUD")
                .orElseGet(() -> {
                    getOrInitAccount(businessId);
                    return integrationAccountRepository.findByBusinessIdAndProvider(businessId, "WHATSAPP_CLOUD")
                            .orElseThrow(() -> new BadRequestException("WhatsApp is not set up for this business"));
                });

        String wamid = "wamid.TEST_HOOK_" + System.currentTimeMillis();
        Map<String, Object> message = new HashMap<>();
        message.put("from", digits);
        message.put("id", wamid);
        message.put("timestamp", String.valueOf(System.currentTimeMillis() / 1000));
        message.put("type", "text");
        message.put("text", Map.of("body", text.trim()));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("display_phone_number", account.getPhoneNumber() == null ? "" : account.getPhoneNumber());
        metadata.put("phone_number_id", account.getPhoneNumberId() == null ? "" : account.getPhoneNumberId());

        Map<String, Object> value = new HashMap<>();
        value.put("messaging_product", "whatsapp");
        value.put("metadata", metadata);
        value.put("contacts", List.of(Map.of(
                "profile", Map.of("name", name),
                "wa_id", digits
        )));
        value.put("messages", List.of(message));

        Map<String, Object> payload = Map.of(
                "object", "whatsapp_business_account",
                "entry", List.of(Map.of(
                        "id", "WHATSAPP_BUSINESS_ACCOUNT_ID",
                        "changes", List.of(Map.of("field", "messages", "value", value))
                ))
        );

        try {
            conversationService.runAwaitingAiReply(() -> {
                try {
                    processIncomingWebhook(objectMapper.writeValueAsString(payload), null);
                } catch (RuntimeException re) {
                    throw re;
                } catch (Exception e) {
                    throw new BadRequestException("The automatic reply could not be created");
                }
            });
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("The automatic reply could not be created");
        }

        String formattedPhone = "+" + digits;
        String reply = customerRepository.findByBusinessIdAndPhoneNumber(businessId, formattedPhone)
                .map(customer -> conversationService.resolveAutoReplySnippet(businessId, customer.getId(), text.trim()))
                .orElse("No chat was created for this test. Try again.");

        boolean simulated = account.isSandbox() || account.getAccessToken() == null || account.getAccessToken().isBlank();
        return new AutoReplyResult(text.trim(), reply, simulated);
    }

    @Transactional
    public WhatsAppSendResult testSendMessage(UUID businessId, String recipientPhone, String text) {
        IntegrationAccount account = integrationAccountRepository.findByBusinessIdAndProvider(businessId, "WHATSAPP_CLOUD")
                .orElseThrow(() -> new BadRequestException("WhatsApp integration not configured"));

        // In WhatsApp Cloud API, new conversations must be initiated with a pre-approved template (hello_world)
        WhatsAppSendResult templateResult = whatsAppClient.sendTemplateMessage(account, recipientPhone, "hello_world", "en_US", List.of());
        if (templateResult.isSuccess()) {
            return templateResult;
        }
        return whatsAppClient.sendTextMessage(account, recipientPhone, text);
    }

    private WhatsAppConfigDto toDto(IntegrationAccount account) {
        String base = (backendBaseUrl == null || backendBaseUrl.isBlank())
                ? "http://localhost:" + serverPort
                : backendBaseUrl.replaceAll("/$", "");
        String callbackUrl = base + "/api/webhooks/whatsapp";
        boolean hasToken = account.getAccessToken() != null && !account.getAccessToken().isBlank();

        WhatsAppConfigDto dto = new WhatsAppConfigDto(
                account.getId(),
                account.getAccountId(),
                account.getPhoneNumberId(),
                account.getPhoneNumber(),
                account.getWebhookVerifyToken(),
                account.getStatus(),
                account.isSandbox(),
                hasToken,
                callbackUrl
        );
        if (account.getBusiness() != null && account.getBusiness().getId() != null) {
            dto.setAutoReplyCount(messageRepository.countByBusinessIdAndSenderType(account.getBusiness().getId(), "AI"));
        }
        return dto;
    }
}
