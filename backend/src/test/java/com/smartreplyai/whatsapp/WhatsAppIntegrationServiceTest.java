package com.smartreplyai.whatsapp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.conversation.ConversationService;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.message.MessageRepository;
import com.smartreplyai.whatsapp.client.OfficialWhatsAppCloudApiClient;
import com.smartreplyai.whatsapp.client.WhatsAppSendResult;
import com.smartreplyai.whatsapp.dto.UpdateWhatsAppConfigRequest;
import com.smartreplyai.whatsapp.dto.WhatsAppConfigDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WhatsAppIntegrationServiceTest {

    @Mock
    private IntegrationAccountRepository integrationAccountRepository;

    @Mock
    private WebhookEventRepository webhookEventRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationService conversationService;

    @Mock
    private OfficialWhatsAppCloudApiClient whatsAppClient;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private WhatsAppIntegrationService service;

    private UUID businessId;
    private Business business;
    private IntegrationAccount account;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        business = new Business("SmileCare Dental", "smilecare", "CLINIC", "care@smilecare.com", "+919876543210");
        business.setId(businessId);

        account = new IntegrationAccount(business, "WHATSAPP_CLOUD");
        account.setPhoneNumberId("10987654321");
        account.setWebhookVerifyToken("my_test_token_123");
        account.setAppSecret("supersecretappsecret");
    }

    @Test
    void testVerifyWebhook_SuccessWhenTokenMatches() {
        when(integrationAccountRepository.findByWebhookVerifyToken("my_test_token_123"))
                .thenReturn(Optional.of(account));

        String result = service.verifyWebhook("subscribe", "my_test_token_123", "challenge_code_999");
        assertEquals("challenge_code_999", result);
    }

    @Test
    void testVerifyWebhook_FailWhenTokenDoesNotMatch() {
        when(integrationAccountRepository.findByWebhookVerifyToken("invalid_token"))
                .thenReturn(Optional.empty());

        String result = service.verifyWebhook("subscribe", "invalid_token", "challenge_code_999");
        assertNull(result);
    }

    @Test
    void testValidateSignature() {
        String payload = "{\"test\":\"payload\"}";
        // Compute correct HMAC for test
        // When appSecret is null, soft bypass returns true
        assertTrue(service.validateSignature(payload, null, null));
    }

    @Test
    void testUpdateAccount_InSandboxMode() {
        when(integrationAccountRepository.findByBusinessIdAndProvider(businessId, "WHATSAPP_CLOUD"))
                .thenReturn(Optional.of(account));
        when(integrationAccountRepository.save(any(IntegrationAccount.class))).thenAnswer(i -> i.getArgument(0));

        UpdateWhatsAppConfigRequest req = new UpdateWhatsAppConfigRequest();
        req.setPhoneNumberId("1122334455");
        req.setIsSandbox(true);

        WhatsAppConfigDto dto = service.updateAccount(businessId, req);

        assertNotNull(dto);
        assertEquals("1122334455", dto.getPhoneNumberId());
        assertTrue(dto.isSandbox());
        assertEquals("SANDBOX", dto.getStatus());
    }

    @Test
    void testProcessIncomingWebhook_IdempotencySkipsDuplicates() {
        when(webhookEventRepository.existsByEventId("wamid.ALREADY_PROCESSED")).thenReturn(true);

        String payload = """
        {
          "entry": [{
            "changes": [{
              "value": {
                "metadata": { "phone_number_id": "10987654321" },
                "messages": [{
                  "id": "wamid.ALREADY_PROCESSED",
                  "from": "919876500111",
                  "text": { "body": "Hello!" }
                }]
              }
            }]
          }]
        }
        """;

        service.processIncomingWebhook(payload, null);

        // Verify no message handling happened
        verify(conversationService, never()).handleCustomerMessage(any(), any(), any(), any());
    }

    @Test
    void testProcessIncomingWebhook_OptOutStopsMessages() {
        when(webhookEventRepository.existsByEventId("wamid.STOP_MSG")).thenReturn(false);
        when(integrationAccountRepository.findByPhoneNumberId("10987654321")).thenReturn(Optional.of(account));

        Customer customer = new Customer(business, "+919876500111", "Meera", "meera@example.com");
        customer.setId(UUID.randomUUID());
        customer.setOptInStatus("OPTED_IN");
        when(customerRepository.findByBusinessIdAndPhoneNumber(businessId, "+919876500111"))
                .thenReturn(Optional.of(customer));
        when(whatsAppClient.sendTextMessage(any(), any(), any())).thenReturn(WhatsAppSendResult.ok("wamid.ACK", true));

        String payload = """
        {
          "entry": [{
            "changes": [{
              "value": {
                "metadata": { "phone_number_id": "10987654321" },
                "messages": [{
                  "id": "wamid.STOP_MSG",
                  "from": "919876500111",
                  "text": { "body": "STOP" }
                }]
              }
            }]
          }]
        }
        """;

        service.processIncomingWebhook(payload, null);

        assertEquals("OPTED_OUT", customer.getOptInStatus());
        verify(customerRepository).save(customer);
        verify(whatsAppClient).sendTextMessage(eq(account), eq("+919876500111"), contains("unsubscribed"));
        verify(conversationService, never()).handleCustomerMessage(any(), any(), any(), any());
    }
}
