package com.smartreplyai.telegram;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.conversation.Conversation;
import com.smartreplyai.conversation.ConversationRepository;
import com.smartreplyai.conversation.ConversationService;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.message.MessageRepository;
import com.smartreplyai.subscription.PlanLimitService;
import com.smartreplyai.telegram.client.TelegramBotInfo;
import com.smartreplyai.telegram.client.TelegramClient;
import com.smartreplyai.telegram.dto.TelegramConfigDto;
import com.smartreplyai.telegram.dto.UpdateTelegramConfigRequest;
import com.smartreplyai.whatsapp.IntegrationAccount;
import com.smartreplyai.whatsapp.IntegrationAccountRepository;
import com.smartreplyai.whatsapp.WebhookEvent;
import com.smartreplyai.whatsapp.WebhookEventRepository;
import com.smartreplyai.whatsapp.dto.AutoReplyResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TelegramIntegrationServiceTest {

    @Mock
    private IntegrationAccountRepository integrationAccountRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationService conversationService;

    @Mock
    private PlanLimitService planLimitService;

    @Mock
    private WebhookEventRepository webhookEventRepository;

    @Mock
    private TelegramClient telegramClient;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private TelegramIntegrationService service;

    private UUID businessId;
    private Business business;
    private IntegrationAccount account;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        business = new Business("SmileCare Dental", "smilecare", "CLINIC", "care@smilecare.com", "+919876543210");
        business.setId(businessId);

        account = new IntegrationAccount(business, "TELEGRAM_BOT");
        account.setAccessToken("123456789:ABCdefGHIjklMNOpqrSTUvwxYZ");
        account.setBotUsername("smilecare_bot");
        account.setWebhookVerifyToken("tg_sec_99998888");
        account.setStatus("ACTIVE");

        when(integrationAccountRepository.findByWebhookVerifyToken("tg_sec_99998888"))
                .thenReturn(Optional.of(account));
    }

    @Test
    void testGetConfig_MasksTokenAndExposesSafeMetadata() {
        when(integrationAccountRepository.findByBusinessIdAndProvider(businessId, "TELEGRAM_BOT"))
                .thenReturn(Optional.of(account));

        TelegramConfigDto config = service.getOrInitAccount(businessId);

        assertNotNull(config);
        assertTrue(config.isHasToken());
        assertNotNull(config.getMaskedToken());
        assertFalse(config.getMaskedToken().contains("ABCdef"));
        assertTrue(config.getMaskedToken().contains("..."));
        assertEquals("smilecare_bot", config.getBotUsername());
        assertEquals("ACTIVE", config.getStatus());
        assertNotNull(config.getWebhookUrl());
        assertTrue(config.getWebhookUrl().contains("/api/webhooks/telegram"));
    }

    @Test
    void testUpdateConfig_VerifiesTokenWithGetMeAndSaves() {
        when(integrationAccountRepository.findByBusinessIdAndProvider(businessId, "TELEGRAM_BOT"))
                .thenReturn(Optional.of(account));
        when(integrationAccountRepository.save(any(IntegrationAccount.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        TelegramBotInfo botInfo = new TelegramBotInfo(true, "smilecare_bot", "SmileCare Bot", 123456789L, null);
        when(telegramClient.getMe("123456789:NEW_VALID_TOKEN")).thenReturn(botInfo);

        UpdateTelegramConfigRequest request = new UpdateTelegramConfigRequest();
        request.setBotToken("123456789:NEW_VALID_TOKEN");
        request.setIsSandbox(false);

        TelegramConfigDto updated = service.updateAccount(businessId, request);

        assertNotNull(updated);
        assertEquals("smilecare_bot", updated.getBotUsername());
        verify(telegramClient).getMe("123456789:NEW_VALID_TOKEN");
        verify(integrationAccountRepository).save(account);
    }

    @Test
    void testProcessIncomingWebhook_DuplicateUpdateSkipped() {
        when(webhookEventRepository.existsByEventId("tg_12345")).thenReturn(true);

        String payload = """
                {
                  "update_id": 12345,
                  "message": {
                    "message_id": 100,
                    "from": {"id": 887766, "first_name": "Rohan"},
                    "chat": {"id": 887766, "type": "private"},
                    "text": "Hello bot"
                  }
                }
                """;

        service.processIncomingWebhook(payload, "tg_sec_99998888", null);

        verify(webhookEventRepository, never()).save(any(WebhookEvent.class));
        verify(conversationService, never()).handleCustomerMessage(any(), any(), any(), any());
    }

    @Test
    void testProcessIncomingWebhook_CreatesCustomerWithSyntheticPhoneAndDispatches() {
        when(webhookEventRepository.existsByEventId("tg_555")).thenReturn(false);
        when(customerRepository.findByBusinessIdAndPhoneNumber(businessId, "tg:887766"))
                .thenReturn(Optional.empty());

        Customer savedCustomer = new Customer(business, "tg:887766", "Rohan Verma", null);
        savedCustomer.setId(UUID.randomUUID());
        when(customerRepository.save(any(Customer.class))).thenReturn(savedCustomer);

        String payload = """
                {
                  "update_id": 555,
                  "message": {
                    "message_id": 101,
                    "from": {"id": 887766, "first_name": "Rohan", "last_name": "Verma", "username": "rohanv"},
                    "chat": {"id": 887766, "type": "private"},
                    "text": "What are your dental cleaning charges?"
                  }
                }
                """;

        service.processIncomingWebhook(payload, "tg_sec_99998888", null);

        verify(webhookEventRepository).save(any(WebhookEvent.class));
        verify(customerRepository).save(any(Customer.class));
        verify(conversationService).handleCustomerMessage(
                eq(businessId),
                eq(savedCustomer.getId()),
                eq("What are your dental cleaning charges?"),
                eq("tg_msg_101")
        );
    }

    @Test
    void testProcessIncomingWebhook_UnknownSecretThrowsBadRequest() {
        when(integrationAccountRepository.findByWebhookVerifyToken("unknown_secret"))
                .thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () ->
                service.processIncomingWebhook("{}", "unknown_secret", null));

        verifyNoInteractions(customerRepository);
        verifyNoInteractions(conversationService);
    }

    @Test
    void testSimulateCustomerMessage_TrialExpiredThrowsBadRequest() {
        when(planLimitService.canSendWhatsAppAutoReply(businessId)).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                service.simulateCustomerMessage(businessId, "Hi", "999", "Tester", "tester_tg"));

        assertTrue(ex.getMessage().contains("free trial has ended"));
        verifyNoInteractions(conversationService);
    }

    @Test
    void testSimulateCustomerMessage_SuccessfulSimulationReturnsAutoReply() {
        when(planLimitService.canSendWhatsAppAutoReply(businessId)).thenReturn(true);
        when(integrationAccountRepository.findByBusinessIdAndProvider(businessId, "TELEGRAM_BOT"))
                .thenReturn(Optional.of(account));
        when(webhookEventRepository.existsByEventId(anyString())).thenReturn(false);

        Customer cust = new Customer(business, "tg:999", "Tester", null);
        cust.setId(UUID.randomUUID());
        when(customerRepository.findByBusinessIdAndPhoneNumber(businessId, "tg:999"))
                .thenReturn(Optional.of(cust));

        Conversation conv = new Conversation(business, cust);
        conv.setLastMessageSnippet("Cleaning is ₹1200.");
        when(conversationRepository.findByBusinessIdAndCustomerId(businessId, cust.getId()))
                .thenReturn(Optional.of(conv));

        AutoReplyResult result = service.simulateCustomerMessage(
                businessId, "What is the fee?", "999", "Tester", "tester_tg");

        assertNotNull(result);
        assertEquals("What is the fee?", result.getCustomerMessage());
        assertEquals("Cleaning is ₹1200.", result.getReplyText());
        verify(conversationService).handleCustomerMessage(eq(businessId), eq(cust.getId()), eq("What is the fee?"), anyString());
    }
}
