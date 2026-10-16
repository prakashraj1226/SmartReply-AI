package com.smartreplyai.telegram;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.conversation.Conversation;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.conversation.ConversationService;
import com.smartreplyai.message.MessageRepository;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.subscription.PlanLimitService;
import com.smartreplyai.telegram.client.TelegramBotInfo;
import com.smartreplyai.telegram.client.TelegramClient;
import com.smartreplyai.telegram.client.TelegramSendResult;
import com.smartreplyai.telegram.dto.TelegramConfigDto;
import com.smartreplyai.telegram.dto.UpdateTelegramConfigRequest;
import com.smartreplyai.tenant.TenantContext;
import com.smartreplyai.whatsapp.IntegrationAccount;
import com.smartreplyai.whatsapp.IntegrationAccountRepository;
import com.smartreplyai.whatsapp.WebhookEvent;
import com.smartreplyai.whatsapp.WebhookEventRepository;
import com.smartreplyai.whatsapp.dto.AutoReplyResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class TelegramIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(TelegramIntegrationService.class);

    private final IntegrationAccountRepository integrationAccountRepository;
    private final BusinessRepository businessRepository;
    private final CustomerRepository customerRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ConversationService conversationService;
    private final PlanLimitService planLimitService;
    private final WebhookEventRepository webhookEventRepository;
    private final TelegramClient telegramClient;
    private final ObjectMapper objectMapper;

    @Value("${server.port:8081}")
    private String serverPort;

    @Value("${backend.base-url:}")
    private String backendBaseUrl;

    @Value("${app.telegram.bot-token:${TELEGRAM_BOT_TOKEN:}}")
    private String defaultBotToken;

    public TelegramIntegrationService(IntegrationAccountRepository integrationAccountRepository,
                                      BusinessRepository businessRepository,
                                      CustomerRepository customerRepository,
                                      ConversationRepository conversationRepository,
                                      MessageRepository messageRepository,
                                      ConversationService conversationService,
                                      PlanLimitService planLimitService,
                                      WebhookEventRepository webhookEventRepository,
                                      TelegramClient telegramClient,
                                      ObjectMapper objectMapper) {
        this.integrationAccountRepository = integrationAccountRepository;
        this.businessRepository = businessRepository;
        this.customerRepository = customerRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.conversationService = conversationService;
        this.planLimitService = planLimitService;
        this.webhookEventRepository = webhookEventRepository;
        this.telegramClient = telegramClient;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public TelegramConfigDto getOrInitAccount(UUID businessId) {
        IntegrationAccount account = integrationAccountRepository.findByBusinessIdAndProvider(businessId, "TELEGRAM_BOT")
                .orElseGet(() -> {
                    Business biz = businessRepository.findById(businessId)
                            .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
                    IntegrationAccount newAcc = new IntegrationAccount(biz, "TELEGRAM_BOT");
                    newAcc.setWebhookVerifyToken("tg_sec_" + UUID.randomUUID().toString().replace("-", ""));
                    newAcc.setStatus("SANDBOX");
                    newAcc.setMode("SANDBOX");
                    return integrationAccountRepository.save(newAcc);
                });

        if (account.getWebhookVerifyToken() == null || account.getWebhookVerifyToken().isBlank()) {
            account.setWebhookVerifyToken("tg_sec_" + UUID.randomUUID().toString().replace("-", ""));
            account = integrationAccountRepository.save(account);
        }

        if ((account.getAccessToken() == null || account.getAccessToken().isBlank())
                && defaultBotToken != null && !defaultBotToken.isBlank()) {
            account.setAccessToken(defaultBotToken.trim());
            TelegramBotInfo botInfo = telegramClient.getMe(defaultBotToken.trim());
            if (botInfo.isValid()) {
                account.setStatus("CONNECTED");
                account.setSandbox(false);
                if (botInfo.getUsername() != null) {
                    account.setBotUsername(botInfo.getUsername());
                    account.setPhoneNumber(botInfo.getUsername());
                }
                if (botInfo.getFirstName() != null) {
                    account.setDisplayName(botInfo.getFirstName());
                }
            }
            account = integrationAccountRepository.save(account);
        }

        return toDto(account);
    }

    @Transactional
    public TelegramConfigDto updateAccount(UUID businessId, UpdateTelegramConfigRequest req) {
        IntegrationAccount account = integrationAccountRepository.findByBusinessIdAndProvider(businessId, "TELEGRAM_BOT")
                .orElseGet(() -> {
                    Business biz = businessRepository.findById(businessId)
                            .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
                    IntegrationAccount newAcc = new IntegrationAccount(biz, "TELEGRAM_BOT");
                    newAcc.setWebhookVerifyToken("tg_sec_" + UUID.randomUUID().toString().replace("-", ""));
                    return integrationAccountRepository.save(newAcc);
                });

        if (req.getBotToken() != null && !req.getBotToken().isBlank()) {
            account.setAccessToken(req.getBotToken().trim());
        }

        if (req.getWebhookSecret() != null && !req.getWebhookSecret().isBlank()) {
            account.setWebhookVerifyToken(req.getWebhookSecret().trim());
        }

        if (req.getIsSandbox() != null) {
            account.setSandbox(req.getIsSandbox());
        }

        if (!account.isSandbox() && account.getAccessToken() != null && !account.getAccessToken().isBlank()) {
            TelegramBotInfo botInfo = telegramClient.getMe(account.getAccessToken());
            if (botInfo.isValid()) {
                account.setStatus("CONNECTED");
                if (botInfo.getUsername() != null) {
                    account.setBotUsername(botInfo.getUsername());
                    account.setPhoneNumber(botInfo.getUsername());
                }
                if (botInfo.getFirstName() != null) {
                    account.setDisplayName(botInfo.getFirstName());
                }

                // If public webhook URL is HTTPS, attempt to register webhook directly with Telegram
                String webhookUrl = getWebhookUrl(account);
                if (webhookUrl != null && webhookUrl.startsWith("https://")) {
                    telegramClient.setWebhook(account.getAccessToken(), webhookUrl, account.getWebhookVerifyToken());
                }

                // Register default bot menu commands (/start, /services, /hours, /book, /help)
                try {
                    telegramClient.setMyCommands(account.getAccessToken());
                } catch (Exception e) {
                    logger.warn("Could not register bot commands: {}", e.getMessage());
                }
            } else {
                account.setStatus("ERROR");
                logger.warn("Telegram bot token verification failed: {}", botInfo.getErrorMessage());
            }
        } else if (account.isSandbox()) {
            account.setStatus("SANDBOX");
        }

        account = integrationAccountRepository.save(account);
        return toDto(account);
    }

    @Transactional
    public void processIncomingWebhook(String rawPayload, String secretHeader, String pathSecret) {
        String secret = (secretHeader != null && !secretHeader.isBlank()) ? secretHeader.trim() : null;
        if (secret == null && pathSecret != null && !pathSecret.isBlank()) {
            secret = pathSecret.trim();
        }

        if (secret == null) {
            logger.warn("Telegram webhook rejected: missing secret header or path secret");
            throw new BadRequestException("Missing Telegram webhook secret");
        }

        IntegrationAccount account = integrationAccountRepository.findByWebhookVerifyToken(secret)
                .filter(acc -> "TELEGRAM_BOT".equalsIgnoreCase(acc.getProvider()))
                .orElse(null);

        if (account == null) {
            logger.warn("Telegram webhook rejected: secret token does not match any registered bot account");
            throw new BadRequestException("Invalid Telegram webhook secret");
        }

        Business owningBusiness = account.getBusiness();
        if (owningBusiness == null || !owningBusiness.isActive()) {
            logger.info("Ignoring Telegram inbound update for suspended business (account={})", account.getId());
            return;
        }

        UUID businessId = owningBusiness.getId();
        UUID prevTenant = TenantContext.getBusinessId();
        try {
            TenantContext.setCurrentTenant(businessId);

            JsonNode root = objectMapper.readTree(rawPayload);
            long updateId = root.path("update_id").asLong(0);
            if (updateId == 0) {
                logger.warn("Telegram update missing update_id");
                return;
            }

            // Idempotency: Skip duplicate update_id
            String eventId = "tg_" + updateId;
            if (webhookEventRepository.existsByEventId(eventId)) {
                logger.info("Telegram update {} already processed. Skipping duplicate.", updateId);
                return;
            }
            webhookEventRepository.save(new WebhookEvent("TELEGRAM_BOT", eventId, null));

            JsonNode messageNode = root.path("message");
            if (messageNode.isMissingNode() || messageNode.isNull()) {
                // Ignore non-message updates (inline queries, callback queries, etc.)
                return;
            }

            JsonNode fromNode = messageNode.path("from");
            JsonNode chatNode = messageNode.path("chat");
            long fromId = fromNode.path("id").asLong();
            long chatId = chatNode.path("id").asLong();
            long messageId = messageNode.path("message_id").asLong();
            String text = messageNode.path("text").asText(null);

            // Handle non-text messages safely
            if (text == null || text.isBlank()) {
                logger.info("Non-text message received from Telegram chat {}. Sending fallback reply.", chatId);
                telegramClient.sendMessage(account, String.valueOf(chatId),
                        "Thank you for reaching out! Currently, I can only understand text messages. Please type your question.");
                return;
            }

            // Extract display name
            String firstName = fromNode.path("first_name").asText("").trim();
            String lastName = fromNode.path("last_name").asText("").trim();
            String username = fromNode.path("username").asText("").trim();
            String displayName = (firstName + " " + lastName).trim();
            if (displayName.isBlank() && !username.isBlank()) {
                displayName = "@" + username;
            }
            if (displayName.isBlank()) {
                displayName = "Telegram User";
            }
            final String finalDisplayName = displayName;

            // Stable synthetic key for customer phone: tg:<telegram_user_id>
            String syntheticPhone = "tg:" + fromId;

            Customer customer = customerRepository.findByBusinessIdAndPhoneNumber(businessId, syntheticPhone)
                    .orElseGet(() -> {
                        Customer newCust = new Customer(account.getBusiness(), syntheticPhone, finalDisplayName, null);
                        return customerRepository.save(newCust);
                    });

            if (!displayName.equalsIgnoreCase(customer.getName()) && !"Telegram User".equalsIgnoreCase(displayName)) {
                customer.setName(displayName);
                customerRepository.save(customer);
            }

            // Delegate to ConversationService for thread management, billing limit checks, and AI grounding
            conversationService.handleCustomerMessage(businessId, customer.getId(), text, "tg_msg_" + messageId);

        } catch (BadRequestException bre) {
            throw bre;
        } catch (Exception e) {
            logger.error("Failed to process Telegram webhook update", e);
        } finally {
            if (prevTenant != null) {
                TenantContext.setCurrentTenant(prevTenant);
            } else {
                TenantContext.clear();
            }
        }
    }

    @Transactional
    public AutoReplyResult simulateCustomerMessage(UUID businessId, String text, String fromUserId, String senderName, String username) {
        planLimitService.ensureBusinessActive(businessId);
        if (!planLimitService.canSendWhatsAppAutoReply(businessId)) {
            throw new BadRequestException("Your free trial has ended. Please upgrade your plan to continue using premium features.");
        }
        if (text == null || text.isBlank()) {
            throw new BadRequestException("Customer message is required");
        }

        String userIdStr = (fromUserId == null || fromUserId.isBlank()) ? "987654321" : fromUserId.trim();
        long userId = 987654321L;
        try {
            userId = Long.parseLong(userIdStr.replaceAll("[^0-9]", ""));
        } catch (Exception ignored) {
        }
        if (userId <= 0) userId = 987654321L;

        String name = (senderName == null || senderName.isBlank()) ? "Telegram Tester" : senderName.trim();
        String uName = (username == null || username.isBlank()) ? "test_user" : username.trim();

        IntegrationAccount account = integrationAccountRepository.findByBusinessIdAndProvider(businessId, "TELEGRAM_BOT")
                .orElseGet(() -> {
                    getOrInitAccount(businessId);
                    return integrationAccountRepository.findByBusinessIdAndProvider(businessId, "TELEGRAM_BOT")
                            .orElseThrow(() -> new BadRequestException("Telegram is not set up for this business"));
                });

        long updateId = System.currentTimeMillis();
        long messageId = System.currentTimeMillis() % 1000000;

        Map<String, Object> fromMap = new HashMap<>();
        fromMap.put("id", userId);
        fromMap.put("is_bot", false);
        fromMap.put("first_name", name);
        fromMap.put("username", uName);

        Map<String, Object> chatMap = new HashMap<>();
        chatMap.put("id", userId);
        chatMap.put("type", "private");
        chatMap.put("first_name", name);
        chatMap.put("username", uName);

        Map<String, Object> msgMap = new HashMap<>();
        msgMap.put("message_id", messageId);
        msgMap.put("from", fromMap);
        msgMap.put("chat", chatMap);
        msgMap.put("date", System.currentTimeMillis() / 1000);
        msgMap.put("text", text.trim());

        Map<String, Object> payload = Map.of(
                "update_id", updateId,
                "message", msgMap
        );

        try {
            processIncomingWebhook(objectMapper.writeValueAsString(payload), account.getWebhookVerifyToken(), null);
        } catch (Exception e) {
            logger.error("Error simulating Telegram webhook", e);
            throw new BadRequestException("The automatic reply could not be created: " + e.getMessage());
        }

        String syntheticPhone = "tg:" + userId;
        String reply = customerRepository.findByBusinessIdAndPhoneNumber(businessId, syntheticPhone)
                .flatMap(customer -> conversationRepository.findByBusinessIdAndCustomerId(businessId, customer.getId()))
                .map(Conversation::getLastMessageSnippet)
                .filter(snippet -> snippet != null && !snippet.equals(text.trim()))
                .orElse("The automatic reply is turned off for this chat.");

        boolean simulated = account.isSandbox() || account.getAccessToken() == null || account.getAccessToken().isBlank();
        return new AutoReplyResult(text.trim(), reply, simulated);
    }

    @Transactional
    public TelegramSendResult testSendMessage(UUID businessId, String chatId, String text) {
        IntegrationAccount account = integrationAccountRepository.findByBusinessIdAndProvider(businessId, "TELEGRAM_BOT")
                .orElseThrow(() -> new BadRequestException("Telegram integration not configured"));

        if (account.getAccessToken() == null || account.getAccessToken().isBlank()) {
            throw new BadRequestException("Telegram bot token not configured. Please save a bot token first.");
        }

        return telegramClient.sendMessage(account, chatId, text);
    }

    public String getWebhookUrl(IntegrationAccount account) {
        String base = (backendBaseUrl == null || backendBaseUrl.isBlank())
                ? "http://localhost:" + serverPort
                : backendBaseUrl.replaceAll("/$", "");

        if (account != null && account.getWebhookVerifyToken() != null && !account.getWebhookVerifyToken().isBlank()) {
            return base + "/api/webhooks/telegram/" + account.getWebhookVerifyToken();
        }
        return base + "/api/webhooks/telegram";
    }

    private TelegramConfigDto toDto(IntegrationAccount account) {
        String webhookUrl = getWebhookUrl(account);
        boolean hasToken = account.getAccessToken() != null && !account.getAccessToken().isBlank();
        String maskedToken = maskToken(account.getAccessToken());

        String username = account.getBotUsername() != null ? account.getBotUsername() : account.getPhoneNumber();

        TelegramConfigDto dto = new TelegramConfigDto(
                account.getId(),
                username,
                account.getDisplayName(),
                account.getWebhookVerifyToken(),
                account.getStatus(),
                account.isSandbox(),
                hasToken,
                maskedToken,
                webhookUrl,
                0L
        );

        if (account.getBusiness() != null && account.getBusiness().getId() != null) {
            dto.setAutoReplyCount(messageRepository.countByBusinessIdAndSenderType(account.getBusiness().getId(), "AI"));
        }
        return dto;
    }

    private String maskToken(String token) {
        if (token == null || token.isBlank()) return null;
        if (token.length() <= 10) return "••••••••";
        return token.substring(0, 6) + "..." + token.substring(token.length() - 4);
    }
}
