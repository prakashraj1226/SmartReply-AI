package com.smartreplyai.conversation;

import com.smartreplyai.ai.AiService;
import com.smartreplyai.ai.dto.AiGenerationResponse;
import com.smartreplyai.auth.User;
import com.smartreplyai.auth.UserRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.customer.Customer;
import com.smartreplyai.customer.CustomerRepository;
import com.smartreplyai.message.Message;
import com.smartreplyai.message.MessageRepository;
import com.smartreplyai.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AiService aiService;

    @InjectMocks
    private ConversationService conversationService;

    private UUID businessId;
    private Business testBusiness;
    private Customer testCustomer;
    private Conversation testConversation;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        testBusiness = new Business("SmileCare Dental", "smilecare", "CLINIC", "care@smilecare.com", "+919876543210");
        testBusiness.setId(businessId);

        testCustomer = new Customer(testBusiness, "+919876543210", "Amit Patel", "amit@example.com");
        testCustomer.setId(UUID.randomUUID());

        testConversation = new Conversation(testBusiness, testCustomer);
        testConversation.setId(UUID.randomUUID());
    }

    @Test
    void testGetConversations() {
        Page<Conversation> page = new PageImpl<>(List.of(testConversation));
        when(conversationRepository.findByBusinessId(eq(businessId), any()))
                .thenReturn(page);

        Page<Conversation> result = conversationService.getConversations(businessId, "ALL", "", PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(conversationRepository).findByBusinessId(eq(businessId), any());
    }

    @Test
    void testSendAgentMessage() {
        when(conversationRepository.findByBusinessIdAndId(businessId, testConversation.getId()))
                .thenReturn(Optional.of(testConversation));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));

        User agent = new User("priya@smilecare.com", "hash", "Dr. Priya", "BUSINESS_AGENT");
        agent.setId(UUID.randomUUID());
        UserPrincipal principal = UserPrincipal.create(agent, businessId);

        Message msg = conversationService.sendAgentMessage(businessId, testConversation.getId(), "Hello, how can I help you?", principal);

        assertNotNull(msg);
        assertEquals("AGENT", msg.getSenderType());
        assertEquals("Hello, how can I help you?", msg.getTextContent());
        assertEquals("SENT", msg.getDeliveryStatus());
        assertEquals(0, testConversation.getUnreadCount());
        verify(conversationRepository).save(testConversation);
    }

    @Test
    void testHandleCustomerMessageWithAiAutonomousResponse() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(customerRepository.findByBusinessIdAndId(businessId, testCustomer.getId()))
                .thenReturn(Optional.of(testCustomer));
        when(conversationRepository.findByBusinessIdAndCustomerId(businessId, testCustomer.getId()))
                .thenReturn(Optional.of(testConversation));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));

        AiGenerationResponse aiResponse = new AiGenerationResponse(
                "We are open Mon-Sat 9AM-8PM.",
                0.95,
                false,
                UUID.randomUUID(),
                "Business Hours FAQ",
                50,
                15L,
                "RULE_BASED"
        );
        when(aiService.processIncomingMessage(eq(businessId), anyString(), anyList()))
                .thenReturn(aiResponse);

        Message incoming = conversationService.handleCustomerMessage(
                businessId, testCustomer.getId(), "What are your business hours?", "wamid.123");

        assertNotNull(incoming);
        assertEquals("CUSTOMER", incoming.getSenderType());
        assertEquals("wamid.123", incoming.getExternalMessageId());
        // Verify AI message was saved
        verify(messageRepository, times(2)).save(any(Message.class));
        verify(aiService).processIncomingMessage(eq(businessId), eq("What are your business hours?"), anyList());
        assertEquals(0, testConversation.getUnreadCount()); // Cleared since AI answered confidently
    }

    @Test
    void testHandleCustomerMessageWithAiEscalation() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(testBusiness));
        when(customerRepository.findByBusinessIdAndId(businessId, testCustomer.getId()))
                .thenReturn(Optional.of(testCustomer));
        when(conversationRepository.findByBusinessIdAndCustomerId(businessId, testCustomer.getId()))
                .thenReturn(Optional.of(testConversation));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));

        AiGenerationResponse aiResponse = new AiGenerationResponse(
                "I am routing your query to a team member.",
                0.2,
                true,
                null,
                null,
                10,
                5L,
                "RULE_BASED"
        );
        when(aiService.processIncomingMessage(eq(businessId), anyString(), anyList()))
                .thenReturn(aiResponse);

        conversationService.handleCustomerMessage(
                businessId, testCustomer.getId(), "Can you give me a discount on dental surgery?", "wamid.456");

        assertEquals("PENDING", testConversation.getStatus());
        verify(conversationRepository).save(testConversation);
    }

    @Test
    void testToggleAi() {
        when(conversationRepository.findByBusinessIdAndId(businessId, testConversation.getId()))
                .thenReturn(Optional.of(testConversation));
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(i -> i.getArgument(0));

        assertTrue(testConversation.isAiEnabled());
        Conversation toggled = conversationService.toggleAi(businessId, testConversation.getId());
        assertFalse(toggled.isAiEnabled());
    }

    @Test
    void testAssignAgent() {
        UUID agentId = UUID.randomUUID();
        User agent = new User("priya@smilecare.com", "hash", "Dr. Priya", "BUSINESS_AGENT");
        agent.setId(agentId);

        when(conversationRepository.findByBusinessIdAndId(businessId, testConversation.getId()))
                .thenReturn(Optional.of(testConversation));
        when(userRepository.findById(agentId)).thenReturn(Optional.of(agent));
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(i -> i.getArgument(0));

        Conversation updated = conversationService.assignAgent(businessId, testConversation.getId(), agentId);
        assertNotNull(updated.getAssignedAgent());
        assertEquals("Dr. Priya", updated.getAssignedAgent().getFullName());
    }
}
